#!/usr/bin/env node
/**
 * https://github.com/wikimedia/html-metadata
 */

'use strict';

var BBPromise = require('bluebird');
var cheerio = require('cheerio');
var preq = require('preq'); // Promisified Request library
var microdata = require('microdata-node'); // Schema.org microdata

// Default exported function
exports = module.exports = function(urlOrOpts) {
	return preq.get(urlOrOpts
	).then(function(callRes) {
		return exports.parseAll(cheerio.load(callRes.body));
	});
};

/**
 * Returns Object containing all available datatypes, keyed
 * using the same keys as in metadataFunctions.
 *
 * @param  {Object}   chtml html Cheerio object to parse
 * @return {Object}         contains metadata
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
 * Scrapes Dublin Core data given Cheerio loaded html object
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}         promise of dc metadata
 */
exports.parseDublinCore = BBPromise.method(function(chtml){

	var meta = {};
	var metaTags = chtml('meta,link');
	var reason = new Error('No openGraph metadata found in page');

	if (!metaTags || metaTags.length === 0){throw reason;}

	metaTags.each(function() {
		var element = chtml(this),
			isLink = this.name === 'link',
			nameAttr = element.attr(isLink ? 'rel' : 'name');

		// If the element isn't a Dublin Core property, skip it
		if (!nameAttr
			|| (nameAttr.substring(0, 3).toUpperCase() !== 'DC.'
				&& nameAttr.substring(0, 8).toUpperCase() !== 'DCTERMS.')) {
			return;
		}

		var property = nameAttr.substring(nameAttr.lastIndexOf('.') + 1),
			content = element.attr(isLink ? 'href' : 'content');

		// Lowercase the first character
		property = property.charAt(0).toLowerCase() + property.substr(1);

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
	if (Object.keys(meta).length === 0){
		throw reason;
	}
	return meta;
});

/**
 * Scrapes general metadata terms given Cheerio loaded html object
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}         object contain general metadata
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
 * Scrapes OpenGraph data given html object
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}         promise of open graph metadata object
 */
exports.parseOpenGraph = BBPromise.method(function(chtml){

	var element;
	var itemType;
	var propertyValue;
	var property;
	var root;
	var node;
	var meta = {};
	var metaTags = chtml('meta');
	var namespace = ['og','fb'];
	var subProperty = {
			image : 'url',
			video : 'url',
			audio : 'url'
		};

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
		if (typeof namespace.indexOf(propertyValue[0]) !== 'number'){return; }

		var content = element.attr('content');

		if (propertyValue.length === 2){
			property = propertyValue[1]; // Set property to value after namespace
			if (property in subProperty){ // If one of image,video,audio
				node = {};
				node[subProperty[property]] = content;
				root = node; // Set as potential root
			} else {
				node = content;
				root = false; // Clear root- subproperties must occur directly after root tag is declared
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
		} else if (propertyValue.length === 3){ // Property part of a verticle
			if (root){ // If root exists, add properties to root
				property = propertyValue[2];
				root[property] = content; // If multiple tags present, overwrites previous one. These should be unique.
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
	'dublinCore': exports.parseDublinCore,
	'general': exports.parseGeneral,
	'schemaOrg': exports.parseSchemaOrgMicrodata,
	'openGraph': exports.parseOpenGraph
};

/*
  Export the version
*/

exports.version = require('./package').version;
