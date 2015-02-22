#!/usr/bin/env node
/**
 * https://github.com/wikimedia/html-metadata
 */

'use strict';

var async = require('async'),
	cheerio = require('cheerio'),
	request = require('request'),
	microdata = require('microdata-node');

// Default exported function
exports = module.exports = function(urlOrOpts, callback){
	request(urlOrOpts, function(error, response, html){
		var chtml = cheerio.load(html);
		exports.parseAll(chtml, function(err, results){
			callback(err, results);
		});
	});
};

/**
 * Callback on Object containing all fields merged into
 * one object. The parameters key to a list which may contain
 * multiple values if multiples are found (for instance, if
 * multiple metadata types exist and both contain a parameter
 * called 'title')
 *
 * @param  {Object}   chtml     html Cheerio object to parse
 * @param  {Function} callback callback(error, mergedObject)
 */
exports.parseAllMerged = function(chtml, callback){
	var fcn, results, merged,
		allMetadata = {},
		metadataFunctions = exports.metadataFunctions;

	async.eachSeries(Object.keys(metadataFunctions), function (key, cb){
		fcn = metadataFunctions[key];
		fcn(chtml, function(results){
			if (results){
				// Merge results into larger object
				for (var key in results){
					merged = allMetadata[key];
					var value = results[key];

					if (!merged){
						merged = [];
					}

					if (value instanceof Array) {
						merged = merged.concat(value);
					} else {
						merged.push(value);
					}

					allMetadata[key] = merged;
				}
			}
		});
		cb();
	}, function(err) {
		callback(err, allMetadata);
	});
};

/**
 * Callback on Object containing all available datatypes, keyed
 * using the same keys as in metadataFunctions.
 *
 * Currently only openGraph data as this is the only one implemented
 *
 * @param  {Object}   chtml     html Cheerio object to parse
 * @param  {Function} callback callback(error, allMetadata)
 */
exports.parseAll = function(chtml, callback){
	var fcn,
		allMetadata = {},
		metadataFunctions = exports.metadataFunctions;

	async.forEach(Object.keys(metadataFunctions), function (key, cb){
		fcn = metadataFunctions[key];
		fcn(chtml, function(results){
			//add results keyed by metadataFunctions name
			if (results){
				allMetadata[key] = results;
			}
		});
		cb();
	}, function(err) {
		callback(err, allMetadata);
	});
};

/**
 * Scrapes Dublin Core data given Cheerio loaded html object
 * @param  {Object}   chtml     html Cheerio object
 * @param  {Function} callback  callback(dublinCoreDataObject)
 */
exports.parseDublinCore = function(chtml, callback){
	var meta = {},
		metaTags = chtml('meta,link');

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

	callback(meta);
};

/**
 * Scrapes general metadata terms given Cheerio loaded html object
 * @param  {Object}   chtml     html Cheerio object
 * @param  {Function} callback callback(generalObjectTerms)
 */
exports.parseGeneral = function(chtml, callback){
	var meta = {
		author: chtml('meta[name=author]').first().attr('content'), //author <meta name="author" content="">
		authorlink: chtml('link[rel=author]').first().attr('href'), //author link <link rel="author" href="">
		canonical: chtml('link[rel=canonical]').first().attr('href'), //canonical link <link rel="canonical" href="">
		description: chtml('meta[name=description]').attr('content'), //meta description <meta name ="description" content="">
		publisher: chtml('link[rel=publisher]').first().attr('href'), //publisher link <link rel="publisher" href="">
		robots: chtml('meta[name=robots]').first().attr('content'), //robots <meta name ="robots" content="">
		shortlink: chtml('link[rel=shortlink]').first().attr('href'), //short link <link rel="shortlink" href="">
		title: chtml('title').first().text(), //title tag <title>
	};
	callback(meta);
};

/**
 * Scrapes OpenGraph data given html object
 * @param  {Object}   chtml     html Cheerio object
 * @param  {Function} callback callback(openGraphDataObject)
 */
exports.parseOpenGraph = function(chtml, callback){
	var element, itemType, propertyValue, property, root, node,
		meta = {},
		metaTags = chtml('meta'),
		namespace = ['og','fb'],
		subProperty = {
			image : 'url',
			video : 'url',
			audio : 'url'
		};

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

	callback(meta);
};


/**
 * Scrapes schema.org microdata given Cheerio loaded html object
 * @param  {Object}   chtml    Cheerio object with html loaded
 * @param  {Function} callback callback(microdataObject)
 */
exports.parseSchemaOrgMicrodata = function(chtml,callback){
	callback(microdata.parse(chtml));
};

/**
 * Global exportable list of scraping functions with string keys
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

/*
 Test from main
 */

if (require.main === module) {
	var fs = require('fs'),
		scrape = exports;

	console.log('Parser running on test file');
	var $ = cheerio.load(fs.readFileSync('./test_files/turtle_movie.html'));
	exports.parseAll($, function(err, results){
		console.log(JSON.stringify(results));
	});
}
