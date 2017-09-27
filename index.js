/**
 * https://github.com/wikimedia/html-metadata
 *
 * This file wraps all exportable functions so that they
 * can be used either with Promises or with callbacks.
 */

'use strict';

/*
Import modules
 */
var BBPromise = require('bluebird');
var cheerio = require('cheerio');
var preq = require('preq'); // Promisified Request library
var fs = BBPromise.promisifyAll(require('fs'));

var index = require('./lib/index.js');

/**
 * Default exported function that takes a url string or
 * request library options object and returns a
 * BBPromise for all available metadata
 *
 * @param  {Object}   urlOrOpts  url String or options Object
 * @param  {Function} [callback] Optional callback
 * @return {Object}              BBPromise for metadata
 */
exports = module.exports = function(urlOrOpts, callback) {
	return preq.get(urlOrOpts
	).then(function(response) {
		return index.parseAll(cheerio.load(response.body));
	}).nodeify(callback);
};

/**
 * Exported function that takes html file and
 * returns a BBPromise for all available metadata
 *
 * @param  {String}   path  	 path Path to HTML file
 * @param  {Object}   [opts]  	 opts Additional options such as encoding
 * @param  {Function} [callback] Optional callback
 * @return {Object}              BBPromise for metadata
 */
exports.loadFromFile = function(path, opts, callback) {
	var defaultEncoding = 'utf-8';

	opts = opts || defaultEncoding;
	if (typeof opts === 'function') {
		callback = opts;
		opts = defaultEncoding;
	}

	return fs.readFileAsync(path, opts).then(html =>
		index.parseAll(cheerio.load(html)).nodeify(callback)
	);
};

/**
 * Exported function that takes html string and
 * returns a BBPromise for all available metadata
 *
 * @param  {String}   html  	 html String HTML of the page
 * @param  {Function} [callback] Optional callback
 * @return {Object}              BBPromise for metadata
 */
exports.loadFromString = function(html, callback) {
	return index.parseAll(cheerio.load(html)).nodeify(callback);
};

/**
 * Returns Object containing all available datatypes, keyed
 * using the same keys as in metadataFunctions.
 *
 * @param  {Object}   chtml      html Cheerio object to parse
 * @param  {Function} [callback] optional callback function
 * @return {Object}              BBPromise for metadata
 */
exports.parseAll = function(chtml, callback){
	return index.parseAll(chtml).nodeify(callback);
};

/**
 * Scrapes BE Press metadata given html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @param  {Function} [callback] optional callback function
 * @return {Object}              BBPromise for metadata
 */
exports.parseBEPress = function(chtml, callback){
	return index.parseBEPress(chtml).nodeify(callback);
};

/**
 * Scrapes embedded COinS data given Cheerio loaded html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @param  {Function} [callback] optional callback function
 * @return {Object}              BBPromise for metadata
 */
exports.parseCOinS = function(chtml, callback){
	return index.parseCOinS(chtml).nodeify(callback);
};

/**
 * Parses value of COinS title tag
 *
 * @param  {String}   title      String corresponding to value of title tag in span element
 * @param  {Function} [callback] Optional callback function
 * @return {Object}              BBPromise for metadata
 */
exports.parseCOinSTitle = function(title, callback){
	return index.parseCOinSTitle(title).nodeify(callback);
};

/**
 * Scrapes Dublin Core data given Cheerio loaded html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @param  {Function} [callback] optional callback function
 * @return {Object}              BBPromise for metadata
 */
exports.parseDublinCore = function(chtml, callback){
	return index.parseDublinCore(chtml).nodeify(callback);
};

/**
 * Scrapes EPrints data given Cheerio loaded html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @param  {Function} [callback] optional callback function
 * @return {Object}              BBPromise for metadata
 */
exports.parseEprints = function(chtml, callback){
	return index.parseEprints(chtml).nodeify(callback);
};

/**
 * Scrapes general metadata terms given Cheerio loaded html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @param  {Function} [callback] optional callback function
 * @return {Object}              BBPromise for metadata
 */
exports.parseGeneral = function(chtml, callback){
	return index.parseGeneral(chtml).nodeify(callback);
};

/**
 * Scrapes Highwire Press metadata given html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @param  {Function} [callback] optional callback function
 * @return {Object}              BBPromise for metadata
 */
exports.parseHighwirePress = function(chtml, callback){
	return index.parseHighwirePress(chtml).nodeify(callback);
};

/**
 * Retrieves JSON-LD for given html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @param  {Function} [callback] optional callback function
 * @return {Object}              BBPromise for JSON-LD
 */
exports.parseJsonLd = function(chtml, callback){
	return index.parseJsonLd(chtml).nodeify(callback);
};

/**
 * Scrapes OpenGraph data given html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @param  {Function} [callback] optional callback function
 * @return {Object}              BBPromise for metadata
 */
exports.parseOpenGraph = function(chtml, callback){
	return index.parseOpenGraph(chtml).nodeify(callback);
};

/**
 * Scrapes schema.org microdata given Cheerio loaded html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @param  {Function} [callback] optional callback function
 * @return {Object}              BBPromise for metadata
 */
exports.parseSchemaOrgMicrodata = function(chtml, callback){
	return index.parseSchemaOrgMicrodata(chtml).nodeify(callback);
};

/**
 * Scrapes Twitter data given html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @param  {Function} [callback] optional callback function
 * @return {Object}              BBPromise for metadata
 */
exports.parseTwitter = function(chtml, callback){
	return index.parseTwitter(chtml).nodeify(callback);
};

/**
 * Scrapes PRISM data given html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @param  {Function} [callback] optional callback function
 * @return {Object}              BBPromise for metadata
 */
exports.parsePrism = function(chtml, callback){
	return index.parsePrism(chtml).nodeify(callback);
};

/**
 * Global exportable list of scraping promises with string keys
 * @type {Object}
 */
exports.metadataFunctions = index.metadataFunctions;

/*
  Export the version
*/

exports.version = require('./package').version;
