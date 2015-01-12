#!/usr/bin/env node
/**
 * https://github.com/mvolz/node-metadata
 */

var async = require('async'),
	cheerio = require('cheerio'),
	request = require('request'),
	parseOG = require('open-graph').parse;

// Default exported function
exports = module.exports = function(urlOrOpts, callback){
	request(urlOrOpts, function(error, response, html){
		exports.scrapeAll(html, function(err, results){
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
 * Currently only openGraph data as this is the only one implemented
 *
 * @param  {Object}   html     html object to scrape
 * @param  {Function} callback callback(error, mergedObject)
 */
exports.scrapeAllMerged = function(html, callback){
	var fcn, results, superResults, value,
		allMetadata = {},
		metadataFunctions = exports.metadataFunctions;

	async.forEach(Object.keys(metadataFunctions), function (key, cb){
		fcn = metadataFunctions[key];
		fcn(html, function(results){
			if (results){
				//merge results into larger object
				for (var key in results){
					superResults = allMetadata[key];
					value = results[key];
					if (!superResults){
						superResults = [];
					}
					superResults.push(value);
					allMetadata[key] = superResults;
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
 * @param  {Object}   html     html object to scrape
 * @param  {Function} callback callback(error, allMetadata)
 */
exports.scrapeAll = function(html, callback){
	var fcn,
		allMetadata = {},
		metadataFunctions = exports.metadataFunctions;

	async.forEach(Object.keys(metadataFunctions), function (key, cb){
		fcn = metadataFunctions[key];
		fcn(html, function(results){
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

exports.scrapeType = function(metadataType, html, callback){
	callback(metadataFunctions[metadataType]);
};

// TODO
exports.scrapeCOinS = function(html, callback){
	callback(null);
};

// TODO
exports.scrapeDublinCore = function(html, callback){
	callback(null);
};

// TODO
exports.scrapeEmbeddedRDF = function(html, callback){
	callback(null);
};

// TODO
exports.scrapeHighWire = function(html, callback){
	callback(null);
};

/**
 * Scrapes OpenGraph data given html object
 * @param  {Object}   html     html object
 * @param  {Function} callback callback(openGraphDataObject)
 */
exports.scrapeOpenGraph = function(html, callback){
	var ogData = parseOG(html);
	callback(ogData);
};

/**
 * Global exportable list of scraping functions with string keys
 * @type {Object}
 */
exports.metadataFunctions = {
	//'coins': exports.scrapeCOinS,
	//'dublin-core': exports.scrapeDublinCore,
	//'embedded-rdf':exports.scrapeEmbeddedRDF,
	//'high-wire': exports.scrapeHighWire,
	'open-graph': exports.scrapeOpenGraph
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
		sampleUrl = 'http://facebook.com',
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
