#!/usr/bin/env node
/**
 * https://github.com/mvolz/node-metadata
 */

var async = require('async'),
	cheerio = require('cheerio'),
	request = require('request'),
	microdata = require('microdata-node'),
	og = require('open-graph').parse;

// Default exported function
exports = module.exports = function(urlOrOpts, callback){
	request(urlOrOpts, function(error, response, html){
		chtml = cheerio.load(html);
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
					value = results[key];

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
	callback(og(chtml));
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
	var scrape = exports,
		sampleUrl = 'http://blog.woorank.com/2013/04/dublin-core-metadata-for-seo-and-usability/',
		opts = {
			url: sampleUrl,
			followAllRedirects: false,
			headers: {'user-agent': 'Mozilla/5.0'}
		};
	console.log('Scrape function running on sample url: '+ sampleUrl);
	scrape(opts, function(error, results){
		console.log(results);
	});
}
