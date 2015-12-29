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

	this.timeout(40000);

	var url;

	it('should get COinS metadata', function() {
		var url = 'https://en.wikipedia.org/wiki/Viral_phylodynamics';
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

	it('should get OpenGraph info', function() {
		var url = 'http://fortune.com/2015/02/20/nobel-prize-economics-for-sale/';
		return meta(url)
		.catch(function(e){throw e;})
		.then(function(res) {
			['title', 'description', 'author'].forEach(function(key) {
				if(!res.openGraph[key]) {
					throw new Error('Expected to find the ' + key + ' key in the response!');
				}
			});
		});
	});

	it('should get OpenGraph image tags correctly', function() {
		url = 'http://www.lemonde.fr';
		return meta(url)
		.catch(function(e){throw e;})
		.then(function(res) {
			var expectedImage = '{"url":"http://s1.lemde.fr/medias/web/1.2.682/img/placeholder/opengraph.jpg"}';
			assert.deepEqual(JSON.stringify(res.openGraph.image), expectedImage);
		});
	});

	it('should resolve promise', function() {
		url = 'http://blog.woorank.com/2013/04/dublin-core-metadata-for-seo-and-usability/';
		return assert.ok(meta(url));
	});

	it('should resolve promise', function() {
		url = 'http://blog.schema.org';
		return assert.ok(meta(url));
	});

	it('should get schema.org microdata', function() {
		var url = 'http://blog.schema.org/';
		return preq.get(url).then(function(callRes) {
			var expected = '{"items":[{"type":["http://schema.org/Blog"],"properties":{"name":["schema blog"]}}]}';
			var chtml = cheerio.load(callRes.body);
			return meta.parseSchemaOrgMicrodata(chtml)
			.then(function(results){
				assert.deepEqual(JSON.stringify(results), expected);
			});
		});
	});

	it('should get basic BE Press metadata', function() {
		url = 'http://biostats.bepress.com/harvardbiostat/paper154/';
		return preq.get(url).then(function(callRes) {
			var chtml = cheerio.load(callRes.body);

			return meta.parseBEPress(chtml)
			.then(function(results) {
				['series_title', 'author', 'author_institution', 'title', 'date', 'pdf_url',
				 'abstract_html_url', 'publisher', 'online_date'].forEach(function(key) {
					if(!results[key]) {
						throw new Error('Expected to find the ' + key + ' key in the response!');
					}
				});
			})
		});
	});

	it('should get BE Press author and author_institution tags correctly', function() {
		url = 'http://biostats.bepress.com/harvardbiostat/paper154/';
		return preq.get(url).then(function(callRes) {
			var expectedAuthors = '["Claggett, Brian", "Xie, Minge", "Tian, Lu"]';
			var expectedAuthorInstitutions = '["Harvard", "Rutgers University - New Brunswick/Piscataway", "Stanford University School of Medicine"]';
			var chtml = cheerio.load(callRes.body);

			return meta.parseBEPress(chtml)
			.then(function(results) {
				var authors = results.author;
				var authorInstitutions = results.author_institution;
				assert.deepEqual(JSON.stringify(authors), expectedAuthors);
				assert.deepEqual(JSON.stringify(authorInstitutions), expectedAuthorInstitutions);
			})
		});
	});

	it('should get basic Highwire Press metadata', function() {
		url = 'http://mic.microbiologyresearch.org/content/journal/micro/10.1099/mic.0.26954-0';
		return preq.get(url).then(function(callRes) {
			var chtml = cheerio.load(callRes.body);

			return meta.parseHighwirePress(chtml)
			.then(function(results) {
				['journal_title', 'issn', 'doi', 'publication_date', 'title', 'author', 'author_institution',
				 'volume', 'issue', 'firstpage', 'lastpage', 'publisher', 'abstract', 'reference'].forEach(function(key) {
					if(!results[key]) {
						throw new Error('Expected to find the ' + key + ' key in the response!');
					}
				});
			})
		});
	});

	it('should get Highwire Press author tags correctly', function() {
		url = 'http://mic.microbiologyresearch.org/content/journal/micro/10.1099/mic.0.26954-0';
		return preq.get(url).then(function(callRes) {
			var expectedAuthors = '["Jacqueline Reimers", "Karen H. Schmidt", "Angelika Longacre", "Dennis K. Reschke", "Barbara E. Wright"]';
			var chtml = cheerio.load(callRes.body);

			return meta.parseHighwirePress(chtml)
			.then(function(results) {
				var authors = results.authors;
				assert.deepEqual(JSON.stringify(authors), expectedAuthors);
			})
		});
	});


});
