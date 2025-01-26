'use strict';

const meta = require( '../index' );
const assert = require( 'assert' );
const cheerio = require( 'cheerio' );

// mocha defines to avoid eslint breakage
/* global describe, it */

describe( 'scraping', function () {

	this.timeout( 50000 );

	const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
	const acceptHeader = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';

	function getWithHeaders( url ) {
		return fetch( url, {
			method: 'GET',
			headers: {
				'User-Agent': userAgent,
				Accept: acceptHeader
			}
		} ).then( ( res ) => {
			// res.body is a ReadableStream of a Uint8Array, but we just want the string
			return res.text();
		} );
	}

	describe( 'parseAll function', () => {
		it( 'should resolve promise from woorank', () => {
			const url = 'https://www.woorank.com/en/blog/dublin-core-metadata-for-seo-and-usability';
			return meta( { uri: url, headers: { 'User-Agent': userAgent, Accept: acceptHeader } } )
				.then( ( result ) => {
					assert.ok( result, 'Expected result to be truthy' );
				} )
				.catch( ( e ) => {
					console.error( 'Error in woorank test:', e );
					throw e;
				} );
		} );

		it( 'should resolve promise from blog.schema.org', () => {
			const url = 'http://blog.schema.org';
			return meta( { uri: url, headers: { 'User-Agent': userAgent, Accept: acceptHeader } } )
				.then( ( result ) => {
					assert.ok( result, 'Expected result to be truthy' );
				} )
				.catch( ( e ) => {
					console.error( 'Error in blog.schema.org test:', e );
					throw e;
				} );
		} );
	} );

	describe( 'parseBEPress function', () => {
		it( 'should get BE Press metadata tags', () => {
			const url = 'http://biostats.bepress.com/harvardbiostat/paper154/';
			return getWithHeaders( url ).then( ( body ) => {
				const expectedAuthors = [ 'Claggett, Brian', 'Xie, Minge', 'Tian, Lu' ];
				const expectedAuthorInstitutions = [ 'Harvard', 'Rutgers University - New Brunswick/Piscataway', 'Stanford University School of Medicine' ];
				const chtml = cheerio.load( body );
				return meta.parseBEPress( chtml )
					.then( ( results ) => {
						assert.deepStrictEqual( results.author, expectedAuthors );
						assert.deepStrictEqual(
							results.author_institution,
							expectedAuthorInstitutions
						);
						[ 'series_title', 'author', 'author_institution', 'title', 'date', 'pdf_url',
							'abstract_html_url', 'publisher', 'online_date' ].forEach( ( key ) => {
							assert.ok( results[ key ], `Expected to find the ${ key } key in the response!` );
						} );
					} );
			} );
		} );
	} );

	describe( 'parseCOinS function', () => {
		it( 'should get COinS metadata', () => {
			const url = 'https://en.wikipedia.org/wiki/Viral_phylodynamics';
			return getWithHeaders( url ).then( ( body ) => {
				const chtml = cheerio.load( body );
				return meta.parseCOinS( chtml )
					.then( ( results ) => {
						assert.ok( Array.isArray( results ), `Expected Array, got ${ typeof results }` );
						assert.ok( results.length > 0, 'Expected Array with at least 1 item' );
						assert.ok( results[ 0 ].rft, 'Expected first item of Array to contain key rft' );
					} );
			} );
		} );
	} );

	describe( 'parseEPrints function', () => {
		it( 'should get EPrints metadata', () => {
			const url = 'http://eprints.gla.ac.uk/113711/';
			return getWithHeaders( url ).then( ( body ) => {
				const chtml = cheerio.load( body );
				const expectedAuthors = [ 'Gatherer, Derek', 'Kohl, Alain' ];

				return meta.parseEprints( chtml )
					.then( ( results ) => {
						assert.deepStrictEqual( results.creators_name, expectedAuthors );
						[ 'eprintid', 'datestamp', 'title', 'abstract', 'issn', 'creators_name', 'publication', 'citation' ].forEach( ( key ) => {
							assert.ok( results[ key ], `Expected to find the ${ key } key in the response!` );
						} );
					} );
			} );
		} );
	} );

	describe( 'parseGeneral function', () => {
		it( 'should get html lang parameter', () => {
			const expected = 'fr';
			const url = 'http://www.lemonde.fr';
			return getWithHeaders( url ).then( ( body ) => {
				const chtml = cheerio.load( body );
				return meta.parseGeneral( chtml ).then( ( results ) => {
					assert.strictEqual( results.lang, expected );
				} );
			} );
		} );

		it( 'should get html dir parameter', () => {
			const expected = 'rtl';
			const url = 'https://www.iranrights.org/fa/';
			return getWithHeaders( url ).then( ( body ) => {
				const chtml = cheerio.load( body );
				return meta.parseGeneral( chtml ).then( ( results ) => {
					assert.strictEqual( results.dir, expected );
				} );
			} );
		} );
	} );

	it( 'should not have any undefined values', () => {
		const url = 'https://www.cnet.com/special-reports/vr101/';
		return getWithHeaders( url ).then( ( body ) => {
			const chtml = cheerio.load( body );
			return meta.parseAll( chtml )
				.then( ( results ) => {
					Object.keys( results ).forEach( ( metadataType ) => {
						Object.keys( results[ metadataType ] ).forEach( ( key ) => {
							assert.notStrictEqual( results[ metadataType ][ key ], undefined, `${ metadataType }.${ key } should not be undefined` );
						} );
					} );
				} );
		} );
	} );

} );
