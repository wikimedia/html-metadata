'use strict';

/**
 * Tests using files contained in ./static
 */

const assert = require( './utils/assert.js' );
const cheerio = require( 'cheerio' );
const meta = require( '../index' );

// mocha defines to avoid eslint breakage
/* global describe, it */

describe( 'static tests', () => {
	let $;
	const fs = require( 'fs' );
	let expected;

	describe( 'static files', () => {
		it( 'should get correct info from turtle movie file', () => {
			expected = JSON.parse( fs.readFileSync( './test/static/turtle_movie.json' ) );
			$ = cheerio.load( fs.readFileSync( './test/static/turtle_movie.html' ) );
			return meta.parseAll( $ ).then( ( results ) => {
				assert.deepEqual( results, expected );
			} );
		} );

		it( 'should get correct info from turtle article file', () => {
			expected = JSON.parse( fs.readFileSync( './test/static/turtle_article.json' ) );
			$ = cheerio.load( fs.readFileSync( './test/static/turtle_article.html' ) );
			return meta.parseAll( $ ).then( ( results ) => {
				assert.deepEqual( results, expected );
			} );
		} );

		it( 'should be case insensitive on turtle article file', () => {
			expected = JSON.parse( fs.readFileSync( './test/static/turtle_article.json' ) );
			$ = cheerio.load( fs.readFileSync( './test/static/turtle_article_case.html' ) );
			return meta.parseAll( $ ).then( ( results ) => {
				assert.deepEqual( results, expected );
			} );
		} );

		it( 'should be case insensitive on turtle article file', () => {
			expected = JSON.parse( fs.readFileSync( './test/static/turtle_article.json' ) );
			$ = cheerio.load( fs.readFileSync( './test/static/turtle_article_case.html' ) );
			return meta.parseAll( $ ).then( ( results ) => {
				assert.deepEqual( results, expected );
			} );
		} );
	} );

	describe( 'loadFromString', () => {
		it( 'should get correct info using loadFromString method from turtle movie file ', () => {
			expected = JSON.parse( fs.readFileSync( './test/static/turtle_movie.json' ) );
			const html = fs.readFileSync( './test/static/turtle_movie.html' );
			return meta.loadFromString( html ).then( ( results ) => {
				assert.deepEqual( results, expected );
			} );
		} );

		it( 'should get correct info using loadFromString method for self closing tag', () => {
			const html = '<div itemscope><span itemprop="price" content="139.90" /> <span itemprop="priceCurrency" content="PLN" /></div>';
			const expected = { schemaOrg: { items: [ { properties: { priceCurrency: [ 'PLN' ], price: [ '139.90' ] } } ] } };
			return meta.loadFromString( html ).then( ( results ) => {
				assert.deepEqual( results, expected );
			} );
		} );
	} );

} );
