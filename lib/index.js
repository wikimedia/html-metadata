#!/usr/bin/env node
/**
 * https://github.com/wikimedia/html-metadata
 */

'use strict';

var BBPromise = require('bluebird');
var cheerio = require('cheerio');
var preq = require('preq'); // Promisified Request library
var microdata = require('microdata-node'); // Schema.org microdata

/**
 * Returns Object containing all available datatypes, keyed
 * using the same keys as in metadataFunctions.
 *
 * @param  {Object}   chtml html Cheerio object to parse
 * @return {Object}         BBPromise for metadata
 */
exports.parseAll = function(chtml){

	var keys = Object.keys(exports.metadataFunctions); // Array of keys corresponding to position of promise in arr
	var meta = {}; // Metadata keyed by keys in exports.metadataFunctions
	// Array of promises for metadata of each type in exports.metadataFunctions
	var arr = keys.map(function(key) {
		return exports.metadataFunctions[key](chtml);
	});

	var result; // Result in for loop over results
	var key; // Key corrsponding to location of result
	return BBPromise.settle(arr)
		.then(function(results){
			for (var r in results){
				result = results[r];
				key = keys[r];
				if (result && result.isFulfilled() && result.value()) {
					meta[key] = result.value();
				}
			}
			if (Object.keys(meta).length === 0){
				throw new Error("No metadata found in page");
			}
			return BBPromise.resolve(meta);
		});
};

/**
 * Base scraper for tags, used by some other parsing functions
 * @param  {Object}   chtml html Cheerio object
 * @param  {string[]} tags tag types to process
 * @param  {string}   reason message when metadata is not found
 * @param  {function} getProperty function that gets the property of an element
 * @param  {function} getContent function that gets the content of an element
 * @return {Object}   promise of metadata object
 */
exports.parseBase = BBPromise.method(function(chtml, tags, reason, getProperty, getContent){

	var meta = {};
	var metaTags = chtml(tags.join());

	if (!metaTags || metaTags.length === 0) {
		return BBPromise.reject(reason);
	}

	metaTags.each(function() {
		var element = chtml(this),
			property = getProperty(element),
			content = getContent(element);

		// If the element isn't what we're looking for, skip it
		if (!property) {
			return;
		}

		// If the property already exists, make the array of contents
		if (meta[property]) {
			if (meta[property] instanceof Array) {
				meta[property].push(content);
			} else {
				meta[property] = [meta[property], content];
			}
		} else {
			meta[property] = content;
		}
	});

	if (!Object.keys(meta).length){
		return BBPromise.reject(reason);
	}

	return meta;

});

/**
 * Scrapes BE Press metadata given html object
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}   promise of BE Press metadata object
 */
exports.parseBEPress = BBPromise.method(function(chtml){

	return exports.parseBase(
		chtml,
		['meta'],
		'No BE Press metadata found in page',
		function(element) {
			var nameAttr = element.attr('name');

			// If the element isn't a BE Press property, skip it
			if (!nameAttr || (nameAttr.substring(0, 17).toLowerCase() !== 'bepress_citation_')) {
				return;
			}

			return nameAttr.substring(17).toLowerCase();
		},
		function(element) {
			return element.attr('content');
		}
	);

});

/**
 * Scrapes COinS data given Cheerio loaded html object
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}         BBPromise for COinS metadata
 */
exports.parseCOinS = function(chtml){
	var title;
	var metadata = [];
	var tags = chtml('span[class=Z3988]');
	var promArray = [];

	// Add promises for parsed title tags to an Array
	tags.each(function() {
		title = chtml(this).attr('title');
		promArray.push(exports.parseCOinSTitle(title));
	});

	// Once promises have resolved, add any successfully parsed titles to the metadata Array
	return BBPromise.settle(promArray).then(function(results){
		var result;
		for (var r in results){
			result = results[r];
			if (result && result.isFulfilled() && result.value()) {
				metadata.push(result.value());
			}
		}
		if (!metadata.length){
			return BBPromise.reject('No COinS metadata found');
		} else {
			return metadata;
		}
	});
};

/**
 * Parses value of COinS title tag
 * @param  {String}   title String corresponding to value of title tag in span element
 * @return {Object}         BBPromise for CoinS metadata
 */
exports.parseCOinSTitle = BBPromise.method(function(title){
	var metadata = {};
	var rft = {};
	var value;
	var key;
	if (typeof title !== 'string'){
		return BBPromise.reject('Provided value must be a string; Got ' + typeof title);
	}
	title = title.replace(/&amp;/g,'&'); // Allows function to take the raw html string
	title = title.split('&');
	title.forEach(function(element){
		element = element.split('=');
		if (element.length!== 2){return;} // Invalid element
		key = element[0];
		value = decodeURIComponent(element[1].replace(/\+/g,'%20')); // Replace + with encoded space since they aren't getting decoded as spaces
		key = key.split('.'); // Split hierarchical keys
		if (key.length === 1){ // Top level key
			metadata[key[0]] = value;
			return;
		}
		if (key.length === 2){ // Split key e.g. rft.date
			if (key[0] !== 'rft') {return;} // Invalid hierarchical key
			// Keys that may have multiple values - return in list format
			if (key[1] === 'au' || key[1] === 'isbn' || key[1] === 'issn' || key[1] === 'eissn' || key[1] === 'aucorp') {
				if (!rft[key[1]]) {rft[key[1]] = [];}
				rft[key[1]].push(value);
				return;
			}
			rft[key[1]] = value; // Add rft value to rft key - this will overwrite duplicates, if they exist
		}
	});
	if (Object.keys(rft).length){ // Add rft object if it is not empty
		metadata.rft = rft;
	}
	if (!Object.keys(metadata).length){
		return BBPromise.reject('No COinS in provided string');
	}
	return metadata;
});

/**
 * Scrapes Dublin Core data given Cheerio loaded html object
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}         BBPromise for DC metadata
 */
exports.parseDublinCore = BBPromise.method(function(chtml){

	return exports.parseBase(
		chtml,
		['meta', 'link'],
		'No Dublin Core metadata found in page',
		function(element) {
			var isLink = element[0].name === 'link',
				nameAttr = element.attr(isLink ? 'rel' : 'name');

			// If the element isn't a Dublin Core property, skip it
			if (!nameAttr
				|| (nameAttr.substring(0, 3).toUpperCase() !== 'DC.'
					&& nameAttr.substring(0, 8).toUpperCase() !== 'DCTERMS.')) {
				return;
			}

			var property = nameAttr.substring(nameAttr.lastIndexOf('.') + 1);

			// Lowercase the first character
			property = property.charAt(0).toLowerCase() + property.substr(1);
			return property;
		},
		function(element) {
			var isLink = element[0].name === 'link';
			return element.attr(isLink ? 'href' : 'content');
		}
	);

});

/**
 * Scrapes EPrints data given Cheerio loaded html object
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}         BBPromise for EPrints metadata
 */
exports.parseEprints = BBPromise.method(function(chtml){

	return exports.parseBase(
		chtml,
		['meta'],
		'No EPrints metadata found in page',
		function(element) {
			var nameAttr = element.attr('name');

			// If the element isn't an EPrints property, skip it
			if (!nameAttr || nameAttr.substring(0, 8).toLowerCase() !== 'eprints.') {
				return;
			}

			var property = nameAttr.substring(nameAttr.lastIndexOf('.') + 1);

			// Lowercase property
			property = property.toLowerCase();
			return property;
		},
		function(element) {
			return element.attr('content');
		}
	);

});

/**
 * Scrapes general metadata terms given Cheerio loaded html object
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}         BBPromise for general metadata
 */
exports.parseGeneral = BBPromise.method(function(chtml){

	var clutteredMeta = {
		author: chtml('meta[name=author]').first().attr('content'), //author <meta name="author" content="">
		authorlink: chtml('link[rel=author]').first().attr('href'), //author link <link rel="author" href="">
		canonical: chtml('link[rel=canonical]').first().attr('href'), //canonical link <link rel="canonical" href="">
		description: chtml('meta[name=description]').attr('content'), //meta description <meta name ="description" content="">
		publisher: chtml('link[rel=publisher]').first().attr('href'), //publisher link <link rel="publisher" href="">
		robots: chtml('meta[name=robots]').first().attr('content'), //robots <meta name ="robots" content="">
		shortlink: chtml('link[rel=shortlink]').first().attr('href'), //short link <link rel="shortlink" href="">
		title: chtml('title').first().text(), //title tag <title>
	};

	// Copy key-value pairs with defined values to meta
	var meta = {};
	var value;
	Object.keys(clutteredMeta).forEach(function(key){
		value = clutteredMeta[key];
		if (value){
			meta[key] = value;
		}
	});

	// Reject promise if meta is empty
	if (Object.keys(meta).length === 0){
		throw new Error('No general metadata found in page');
	}

	// Resolve on meta
	return meta;
});

/**
 * Scrapes Highwire Press metadata given html object
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}   promise of highwire press metadata object
 */
exports.parseHighwirePress = BBPromise.method(function(chtml){

	return exports.parseBase(
		chtml,
		['meta'],
		'No Highwire Press metadata found in page',
		function(element) {
			var nameAttr = element.attr('name');

			// If the element isn't a Highwire Press property, skip it
			if (!nameAttr || (nameAttr.substring(0, 9).toLowerCase() !== 'citation_')) {
				return;
			}

			return nameAttr.substring(nameAttr.indexOf('_') + 1).toLowerCase();
		},
		function(element) {
			return element.attr('content');
		}
	);

});

/**
 * Scrapes OpenGraph data given html object
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}         promise of open graph metadata object
 */
exports.parseOpenGraph = BBPromise.method(function(chtml){

	var element;
	var itemType;
	var propertyValue;
	var property;
	var node;
	var meta = {};
	var metaTags = chtml('meta');
	var namespace = ['og','fb'];
	var subProperty = {
			image : 'url',
			video : 'url',
			audio : 'url'
		};
	var roots = {}; // Object to store roots of different type i.e. image, audio
	var subProp; // Current subproperty of interest
	var reason = new Error('No openGraph metadata found in page');

	if (!metaTags || metaTags.length === 0){ throw reason; }

	metaTags.each(function() {
		element = chtml(this);
		propertyValue = element.attr('property');

		if (!propertyValue){
			return;
		} else {
			propertyValue = propertyValue.toLowerCase().split(':');
		}

		// If the element isn't in namespace, exit
		if (namespace.indexOf(propertyValue[0]) < 0){
			return;
		}

		var content = element.attr('content');

		if (propertyValue.length === 2){
			property = propertyValue[1]; // Set property to value after namespace
			if (property in subProperty){ // If has valid subproperty
				node = {};
				node[subProperty[property]] = content;
				roots[property] = node;
			} else {
				node = content;
			}
			// If the property already exists, make the array of contents
			if (meta[property]) {
				if (meta[property] instanceof Array) {
					meta[property].push(node);
				} else {
					meta[property] = [meta[property], node];
				}
			} else {
				meta[property] = node;
			}
		} else if (propertyValue.length === 3){ // Property part of a vertical
			subProp = propertyValue[1]; // i.e. image, audio
			property = propertyValue[2]; // i.e. height, width
			// If root for subproperty exists, and there isn't already a property
			// called that in there already i.e. height, add property and content.
			if (roots[subProp] && !roots[subProp][property]){
				roots[subProp][property] = content;
			}
		} else {
			return; // Discard values with length <2 and >3 as invalid
		}

		// Check for "type" property and add to namespace if so
		// If any of these type occur in order before the type attribute is defined,
		// they'll be skipped; spec requires they be placed below type definition.
		// For nested types (e.g. video.movie) the OG protocol uses the super type
		// (e.g. movie) as the new namespace.
		if (property === 'type'){
			namespace.push(content.split('.')[0]); // Add the type to the acceptable namespace list
		}
	});
	if (Object.keys(meta).length === 0){
		throw reason;
	}
	return meta;
});


/**
 * Scrapes schema.org microdata given Cheerio loaded html object
 * @param  {Object}  chtml Cheerio object with html loaded
 * @return {Object}        promise of schema.org microdata object
 */
exports.parseSchemaOrgMicrodata = BBPromise.method(function(chtml){
	if (!chtml){
		throw new Error('Undefined argument');
	}

	var meta = microdata.parse(chtml);
	if (!meta || !meta.items || !meta.items[0]){
		throw new Error('No schema.org metadata found in page');
	}
	return meta;
});

/**
 * Global exportable list of scraping promises with string keys
 * @type {Object}
 */
exports.metadataFunctions = {
	'bePress': exports.parseBEPress,
	'coins': exports.parseCOinS,
	'dublinCore': exports.parseDublinCore,
	'eprints': exports.parseEprints,
	'general': exports.parseGeneral,
	'highwirePress': exports.parseHighwirePress,
	'openGraph': exports.parseOpenGraph,
	'schemaOrg': exports.parseSchemaOrgMicrodata
};
