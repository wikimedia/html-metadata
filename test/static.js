'use strict';

/**
 * Tests using files contained in ./static
 */

const assert = require( './utils/assert.js' );
const cheerio = require( 'cheerio' );
const meta = require( '../index' );

// mocha defines to avoid eslint breakage
/* global describe, it */

describe( 'static files', () => {
	let $;
	const fs = require( 'fs' );
	let expected;

	it( 'should get correct info from turtle movie file', () => {
		expected = JSON.parse( fs.readFileSync( './test/static/turtle_movie.json' ) );
		$ = cheerio.load( fs.readFileSync( './test/static/turtle_movie.html' ) );
		return meta.parseAll( $ ).then( ( results ) => {
			assert.deepEqual( results, expected );
		} );
	} );

	it( 'should get correct info using loadFromString method from turtle movie file ', () => {
		expected = JSON.parse( fs.readFileSync( './test/static/turtle_movie.json' ) );
		const html = fs.readFileSync( './test/static/turtle_movie.html' );
		return meta.loadFromString( html ).then( ( results ) => {
			assert.deepEqual( results, expected );
		} );
	} );

	it( 'should get correct info using loadFromFile method from turtle movie file ', () => {
		expected = JSON.parse( fs.readFileSync( './test/static/turtle_movie.json' ) );
		return meta.loadFromFile( './test/static/turtle_movie.html' ).then( ( results ) => {
			assert.deepEqual( results, expected );
		} );
	} );
	it( 'should get correct info using loadFromFile method using encoding from turtle movie file ', () => {
		expected = JSON.parse( fs.readFileSync( './test/static/turtle_movie.json' ) );
		return meta.loadFromFile( './test/static/turtle_movie.html', { encoding: 'utf-8' } ).then( ( results ) => {
			assert.deepEqual( results, expected );
		} );
	} );
	it( 'should get correct info using loadFromFile method using encoding and callback from turtle movie file ', () => {
		expected = JSON.parse( fs.readFileSync( './test/static/turtle_movie.json' ) );
		return meta.loadFromFile( './test/static/turtle_movie.html', { encoding: 'utf-8' }, ( err, results ) => {
			assert.deepEqual( results, expected );
		} );
	} );
	it( 'should get correct info using loadFromFile method using only callback from turtle movie file ', () => {
		expected = JSON.parse( fs.readFileSync( './test/static/turtle_movie.json' ) );
		return meta.loadFromFile( './test/static/turtle_movie.html', ( err, results ) => {
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
} );
