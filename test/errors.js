'use strict';

/**
 * Tests expecting promises to reject
 */

const cheerio = require( 'cheerio' );
const meta = require( '../index' );
const assert = require( './utils/assert.js' );
const fs = require( 'fs' );

// mocha defines to avoid eslint breakage
/* global describe, it */

describe( 'errors', function () {

	this.timeout( 40000 );

	function fetchBody( url ) {
		return fetch( url ).then( ( res ) => {
			// res.body is a ReadableStream of a Uint8Array, but we just want the string
			return res.text();
		} );
	}

	it( 'should not find schema.org metadata, reject promise', () => {
		const url = 'http://example.com';
		return fetchBody( url )
			.then( ( body ) => {
				const $ = cheerio.load( body );
				const prom = meta.parseSchemaOrgMicrodata( $ );
				return assert.fails( prom );
			} );
	} );

	it( 'should not find BE Press metadata, reject promise', () => {
		const url = 'http://example.com';
		return fetchBody( url )
			.then( ( body ) => {
				const $ = cheerio.load( body );
				const prom = meta.parseBEPress( $ );
				return assert.fails( prom );
			} );
	} );

	it( 'should not find coins metadata, reject promise', () => {
		const url = 'http://example.com';
		return fetchBody( url )
			.then( ( body ) => {
				const $ = cheerio.load( body );
				const prom = meta.parseCOinS( $ );
				return assert.fails( prom );
			} );
	} );

	it( 'should not find dublin core metadata, reject promise', () => {
		const url = 'http://www.laprovence.com/article/actualites/3411272/marseille-un-proche-du-milieu-corse-abattu-par-balles-en-plein-jour.html';
		return fetchBody( url )
			.then( ( body ) => {
				const $ = cheerio.load( body );
				const prom = meta.parseDublinCore( $ );
				return assert.fails( prom );
			} );
	} );

	it( 'should not find highwire press metadata, reject promise', () => {
		const url = 'http://example.com';
		return fetchBody( url )
			.then( ( body ) => {
				const $ = cheerio.load( body );
				const prom = meta.parseHighwirePress( $ );
				return assert.fails( prom );
			} );
	} );

	it( 'should not find open graph metadata, reject promise', () => {
		const url = 'http://www.example.com';
		return fetchBody( url )
			.then( ( body ) => {
				const $ = cheerio.load( body );
				const prom = meta.parseOpenGraph( $ );
				return assert.fails( prom );
			} );
	} );

	it( 'should not find eprints metadata, reject promise', () => {
		const url = 'http://example.com';
		return fetchBody( url )
			.then( ( body ) => {
				const $ = cheerio.load( body );
				const prom = meta.parseEprints( $ );
				return assert.fails( prom );
			} );
	} );

	it( 'should not find twitter metadata, reject promise', () => {
		const url = 'http://example.com';
		return fetchBody( url )
			.then( ( body ) => {
				const $ = cheerio.load( body );
				const prom = meta.parseTwitter( $ );
				return assert.fails( prom );
			} );
	} );

	it( 'should not find JSON-LD, reject promise', () => {
		const url = 'http://example.com';
		return fetchBody( url )
			.then( ( body ) => {
				const $ = cheerio.load( body );
				const prom = meta.parseJsonLd( $ );
				return assert.fails( prom );
			} );
	} );

	it( 'should reject parseALL promise for entire error file', () => {
		const $ = cheerio.load( fs.readFileSync( './test/static/turtle_article_errors.html' ) );
		return assert.fails( meta.parseAll( $ ) );
	} );

	it( 'should reject promise with undefined cheerio object', () => {
		const prom = meta.parseOpenGraph( undefined );
		return assert.fails( prom );
	} );

	it( 'should reject promise with non-string title', () => {
		const prom = meta.parseCOinSTitle( {} );
		return assert.fails( prom );
	} );

	it( 'should reject promise with string with no keys', () => {
		const prom = meta.parseCOinSTitle( '' );
		return assert.fails( prom );
	} );

	it( 'should reject promise with string with bad keys', () => {
		const prom = meta.parseCOinSTitle( 'badkey.a&badkey.b' );
		return assert.fails( prom );
	} );

} );
