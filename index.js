/**
 * https://github.com/wikimedia/html-metadata
 *
 * This file wraps all exportable functions so that they
 * can be used with Promises.
 */

'use strict';

/*
Import modules
 */
const BBPromise = require( 'bluebird' );
const cheerio = require( 'cheerio' );
const fs = BBPromise.promisifyAll( require( 'fs' ) );

const index = require( './lib/index.js' );

/**
 * Default exported function that takes a url string or
 * request library options dictionary and returns a
 * BBPromise for all available metadata
 *
 * @param  {Object}   urlOrOpts  url String or options dictionary
 * @return {Object}              BBPromise for metadata
 */
exports = module.exports = function ( urlOrOpts ) {
	let url, opts;
	if ( urlOrOpts instanceof Object ) {
		if ( urlOrOpts.uri ) {
			url = urlOrOpts.uri;
		}
		opts = urlOrOpts;
	} else if ( typeof urlOrOpts === String ) {
		url = urlOrOpts;
	}
	if ( !url ) {
		return BBPromise.reject( 'No uri supplied in argument' );
	} else {
		return BBPromise.resolve(
			// eslint-disable-next-line n/no-unsupported-features/node-builtins
			fetch( url, opts ).then(
				( response ) => response.text().then(
					( body ) => index.parseAll( cheerio.load( body ) )
				)
			)
		);
	}
};

/**
 * Exported function that takes html file and
 * returns a BBPromise for all available metadata
 *
 * @param  {string}   path       path Path to HTML file
 * @param  {Object}   [opts]     opts Additional options such as encoding
 * @return {Object}              BBPromise for metadata
 */
exports.loadFromFile = function ( path, opts ) {
	const defaultEncoding = 'utf-8';

	opts = opts || defaultEncoding;

	return fs.readFileAsync( path, opts ).then(
		( html ) => index.parseAll( cheerio.load( html ) )
	);
};

/**
 * c
 * Exported function that takes html string and
 * returns a BBPromise for all available metadata
 *
 * @param  {string}   html       html String HTML of the page
 * @return {Object}              BBPromise for metadata
 */
exports.loadFromString = function ( html ) {
	return index.parseAll( cheerio.load( html ) );
};

/**
 * Returns Object containing all available datatypes, keyed
 * using the same keys as in metadataFunctions.
 *
 * @param  {Object}   chtml      html Cheerio object to parse
 * @return {Object}              BBPromise for metadata
 */
exports.parseAll = function ( chtml ) {
	return index.parseAll( chtml );
};

/**
 * Scrapes BE Press metadata given html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @return {Object}              BBPromise for metadata
 */
exports.parseBEPress = function ( chtml ) {
	return index.parseBEPress( chtml );
};

/**
 * Scrapes embedded COinS data given Cheerio loaded html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @return {Object}              BBPromise for metadata
 */
exports.parseCOinS = function ( chtml ) {
	return index.parseCOinS( chtml );
};

/**
 * Parses value of COinS title tag
 *
 * @param  {string}   title      String corresponding to value of title tag in span element
 * @return {Object}              BBPromise for metadata
 */
exports.parseCOinSTitle = function ( title ) {
	return index.parseCOinSTitle( title );
};

/**
 * Scrapes Dublin Core data given Cheerio loaded html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @return {Object}              BBPromise for metadata
 */
exports.parseDublinCore = function ( chtml ) {
	return index.parseDublinCore( chtml );
};

/**
 * Scrapes EPrints data given Cheerio loaded html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @return {Object}              BBPromise for metadata
 */
exports.parseEprints = function ( chtml ) {
	return index.parseEprints( chtml );
};

/**
 * Scrapes general metadata terms given Cheerio loaded html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @return {Object}              BBPromise for metadata
 */
exports.parseGeneral = function ( chtml ) {
	return index.parseGeneral( chtml );
};

/**
 * Scrapes Highwire Press metadata given html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @return {Object}              BBPromise for metadata
 */
exports.parseHighwirePress = function ( chtml ) {
	return index.parseHighwirePress( chtml );
};

/**
 * Retrieves JSON-LD for given html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @return {Object}              BBPromise for JSON-LD
 */
exports.parseJsonLd = function ( chtml ) {
	return index.parseJsonLd( chtml );
};

/**
 * Scrapes OpenGraph data given html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @return {Object}              BBPromise for metadata
 */
exports.parseOpenGraph = function ( chtml ) {
	return index.parseOpenGraph( chtml );
};

/**
 * Scrapes schema.org microdata given Cheerio loaded html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @return {Object}              BBPromise for metadata
 */
exports.parseSchemaOrgMicrodata = function ( chtml ) {
	return index.parseSchemaOrgMicrodata( chtml );
};

/**
 * Scrapes Twitter data given html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @return {Object}              BBPromise for metadata
 */
exports.parseTwitter = function ( chtml ) {
	return index.parseTwitter( chtml );
};

/**
 * Scrapes PRISM data given html object
 *
 * @param  {Object}   chtml      html Cheerio object
 * @return {Object}              BBPromise for metadata
 */
exports.parsePrism = function ( chtml ) {
	return index.parsePrism( chtml );
};

/**
 * Global exportable list of scraping promises with string keys
 *
 * @type {Object}
 */
exports.metadataFunctions = index.metadataFunctions;

/*
  Export the version
*/

exports.version = require( './package' ).version;
