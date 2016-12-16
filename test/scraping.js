'use strict';

/**
 * Tests using externally scraped websites. May fail if resource at
 * location changes.
 */

var meta = require('../index');
var parseSchemaOrgMicrodata = require('../index').parseSchemaOrgMicrodata;
var assert = require('./utils/assert.js');
var preq = require('preq'); // Promisified Request library
var cheerio = require('cheerio');

// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */

describe('scraping', function() {

	this.timeout(50000);

	var url;

	describe('Resolve parseAll promises for partial metadata', function() {
		it('should resolve promise from woorank', function() {
			url = 'http://blog.woorank.com/2013/04/dublin-core-metadata-for-seo-and-usability/';
			return assert.ok(meta(url));
		});

		it('should resolve promise from blog.schema.org', function() {
			url = 'http://blog.schema.org';
			return assert.ok(meta(url));
		});
	});

	it('should get BE Press metadata tags', function() {
		url = 'http://biostats.bepress.com/harvardbiostat/paper154/';
		return preq.get(url).then(function(callRes) {
			var expectedAuthors = ['Claggett, Brian', 'Xie, Minge', 'Tian, Lu'];
			var expectedAuthorInstitutions = ['Harvard', 'Rutgers University - New Brunswick/Piscataway', 'Stanford University School of Medicine'];
			var chtml = cheerio.load(callRes.body);

			return meta.parseBEPress(chtml)
			.then(function(results) {
				var authors = results.author;
				var authorInstitutions = results.author_institution;
				assert.deepEqual(authors, expectedAuthors);
				assert.deepEqual(authorInstitutions, expectedAuthorInstitutions);
				['series_title', 'author', 'author_institution', 'title', 'date', 'pdf_url',
				 'abstract_html_url', 'publisher', 'online_date'].forEach(function(key) {
					if(!results[key]) {
						throw new Error('Expected to find the ' + key + ' key in the response!');
					}
				});
			});
		});
	});

	it('should get COinS metadata', function() {
		url = 'https://en.wikipedia.org/wiki/Viral_phylodynamics';
		return preq.get(url).then(function(callRes) {
			var chtml = cheerio.load(callRes.body);
			return meta.parseCOinS(chtml)
			.then(function(results){
				assert.deepEqual(Array.isArray(results), true, 'Expected Array, got' + typeof results);
				assert.deepEqual(!results.length, false, 'Expected Array with at least 1 item');
				assert.deepEqual(!results[0].rft, false, 'Expected first item of Array to contain key rft');
			});
		});
	});

	it('should get EPrints metadata', function() {
		url = 'http://eprints.gla.ac.uk/113711/';
		return preq.get(url).then(function(callRes) {
			var chtml = cheerio.load(callRes.body);
			var expectedAuthors = ['Gatherer, Derek', 'Kohl, Alain'];

			return meta.parseEprints(chtml)
			.then(function(results) {
				assert.deepEqual(results.creators_name, expectedAuthors); // Compare authors values
				// Ensure all keys are in response
				['eprintid', 'datestamp', 'title', 'abstract', 'issn', 'creators_name', 'publication', 'citation'].forEach(function(key) {
					if(!results[key]) {
						throw new Error('Expected to find the ' + key + ' key in the response!');
					}
				});
			});
		});
	});

	it('should get Highwire Press metadata', function() {
		url = 'http://mic.microbiologyresearch.org/content/journal/micro/10.1099/mic.0.26954-0';
		return preq.get(url).then(function(callRes) {
			var chtml = cheerio.load(callRes.body);
			var expectedAuthors = ['Jacqueline M. Reimers', 'Karen H. Schmidt', 'Angelika Longacre', 'Dennis K. Reschke', 'Barbara E. Wright'];

			return meta.parseHighwirePress(chtml)
			.then(function(results) {
				assert.deepEqual(results.author, expectedAuthors); // Compare authors values
				// Ensure all keys are in response
				['journal_title', 'issn', 'doi', 'publication_date', 'title', 'author', 'author_institution',
				 'volume', 'issue', 'firstpage', 'lastpage', 'publisher', 'abstract', 'reference'].forEach(function(key) {
					if(!results[key]) {
						throw new Error('Expected to find the ' + key + ' key in the response!');
					}
				});
			});
		});
	});

 	describe('openGraph tests', function() {
		it('should get OpenGraph info', function() {
			url = 'http://fortune.com/2015/02/20/nobel-prize-economics-for-sale/';
			return meta(url)
			.catch(function(e){throw e;})
			.then(function(res) {
				['title', 'description', 'author'].forEach(function(key) {
					if(!res.openGraph.hasOwnProperty(key)) {
						throw new Error('Expected to find the ' + key + ' key in the response!');
					}
				});
			});
		});

		it('should get OpenGraph image tag urls and metadata correctly', function() {
			url = 'https://github.com';
			return meta(url)
			.catch(function(e){throw e;})
			.then(function(res) {
				var expectedImage = '{"url":"https://assets-cdn.github.com/images/modules/open_graph/github-logo.png","type":"image/png","width":"1200","height":"1200"},{"url":"https://assets-cdn.github.com/images/modules/open_graph/github-mark.png","type":"image/png","width":"1200","height":"620"},{"url":"https://assets-cdn.github.com/images/modules/open_graph/github-octocat.png","type":"image/png","width":"1200","height":"620"}';
				assert.deepEqual(JSON.stringify(res.openGraph.image), expectedImage);
			});
		});
	});

	it('should get Schema.org Microdata', function() {
		url = 'http://blog.schema.org/';
		return preq.get(url).then(function(callRes) {
			var expected = '{"items":[{"type":["http://schema.org/Blog"],"properties":{"name":["schema blog"]}}]}';
			var chtml = cheerio.load(callRes.body);
			return meta.parseSchemaOrgMicrodata(chtml)
			.then(function(results){
				assert.deepEqual(JSON.stringify(results), expected);
			});
		});
	});

	describe('twitter tests', function() {
		it('should get most basic twitter info', function() {
			url = 'http://www.aftenposten.no/kultur/Pinlig-for-Skaber-555558b.html';
			return meta(url)
			.catch(function(e){throw e;})
			.then(function(res) {
				['card', 'site', 'description', 'title', 'image'].forEach(function(key) {
					if(!res.twitter[key]) {
						throw new Error('Expected to find the ' + key + ' key in the response!');
					}
				});
			});
		});

		it('should get twitter nested data correctly', function() {
			url = 'http://www.theguardian.com/us';
			return meta(url)
			.catch(function(e){throw e;})
			.then(function(res) {
				var expected = '{"app":{"id":{"iphone":"409128287","ipad":"409128287","googleplay":"com.guardian"},"name":{"googleplay":"The Guardian","ipad":"The Guardian","iphone":"The Guardian"},"url":{"ipad":"gnmguardian://us?contenttype=front&source=twitter","iphone":"gnmguardian://us?contenttype=front&source=twitter"}},"site":"@guardian","card":"summary","url":"https://www.theguardian.com/us"}';
				assert.deepEqual(JSON.stringify(res.twitter), expected);
			});
		});
	});

	describe('JSON-LD tests (for types of Organizations)', function() {
		var urls = ['http://www.theguardian.com/us', 'http://jsonld.com/', 'http://www.apple.com/'];
		urls.forEach(function(test) {
			describe(test, function() {
				it('should return an object or array', function() {
					return meta(test)
					.then(function(res) {
						assert.ok(typeof res.jsonLd === 'object');
					});
				});

				it('should get correct JSON-LD data', function() {
					return meta(test)
					.then(function(res) {
						var result = res.jsonLd;
						if (res.jsonLd instanceof Array) {
							result = res.jsonLd.filter(function(r) {
								return r['@type'] === 'Organization';
							})[0];
						};
						['@context', '@type', 'url', 'logo'].forEach(function(key) {
							assert.ok(result.hasOwnProperty(key));
						});
					});
				});
			});
		});
	});

});
