'use strict';

/**
 * Tests using externally scraped websites. May fail if resource at
 * location changes.
 */

var meta = require('../index');
var assert = require('./utils/assert.js');
var preq = require('preq');
var cheerio = require('cheerio');

// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */

describe('scraping', function() {

	this.timeout(50000);

	var url;

	describe('parseAll function', function() {
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
	});

	describe('parseBEPress function', function() {
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
	});

	describe('parseCOinS function', function() {
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
	});

	describe('parseEPrints function', function() {
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
	});

	describe('parseGeneral function', function() {
		it('should get html lang parameter', function() {
			var expected = "fr";
			var options =  {
				url: "http://www.lemonde.fr",
				headers: {
					'User-Agent': 'webscraper'
				}
			};
			return preq.get(options).then(function(callRes) {
				var chtml = cheerio.load(callRes.body);
				return meta.parseGeneral(chtml).then(function(results) {
					assert.deepEqual(results.lang, expected);
				});
			});
		});

		it('should get html dir parameter', function() {
			var expected = "rtl";
			var options =  {
				url: "https://www.iranrights.org/fa/",
				headers: {
					'User-Agent': 'webscraper'
				}
			};
			return preq.get(options).then(function(callRes) {
				var chtml = cheerio.load(callRes.body);
				return meta.parseGeneral(chtml).then(function(results) {
					assert.deepEqual(results.dir, expected);
				});
			});
		});
	});

	describe('parseHighwirePress function', function() {
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
	});

	describe('parseOpenGraph function', function() {
		it('from http://fortune.com', function() {
			url = 'http://fortune.com/2015/02/20/nobel-prize-economics-for-sale/';
			return preq.get(url).then(function(callRes) {
				var chtml = cheerio.load(callRes.body);
				return meta.parseOpenGraph(chtml)
				.catch(function(e){throw e;})
				.then(function(res) {
					['title', 'description'].forEach(function(key) {
						if(!res.hasOwnProperty(key)) {
							throw new Error('Expected to find the ' + key + ' key in the response!');
						}
					});
				});
			});
		});

		it('image tag urls and metadata from http://github.com', function() {
			url = 'https://github.com';
			return preq.get(url).then(function(callRes) {
				var chtml = cheerio.load(callRes.body);
				return meta.parseOpenGraph(chtml)
				.catch(function(e){throw e;})
				.then(function(res) {
					var expectedImage = '{"url":"https://assets-cdn.github.com/images/modules/open_graph/github-logo.png","type":"image/png","width":"1200","height":"1200"},{"url":"https://assets-cdn.github.com/images/modules/open_graph/github-mark.png","type":"image/png","width":"1200","height":"620"},{"url":"https://assets-cdn.github.com/images/modules/open_graph/github-octocat.png","type":"image/png","width":"1200","height":"620"}';
					assert.deepEqual(JSON.stringify(res.image), expectedImage);
				});
			});
		});

	});

	describe('parseSchemaOrgMicrodata function', function() {
		it('should get Schema.org Microdata', function() {
			url = 'http://blog.schema.org/';
			return preq.get(url).then(function(callRes) {
				var chtml = cheerio.load(callRes.body);
				return meta.parseSchemaOrgMicrodata(chtml)
				.then(function(res){
					if(!res.items) {
						throw new Error('Expected to find items in the response!');
					}
				});
			});
		});
	});

	describe('parseTwitter function', function() {
		it('from http://www.aftenposten.no', function() {
			url = 'http://www.aftenposten.no/kultur/Pinlig-for-Skaber-555558b.html';
			return preq.get(url).then(function(callRes) {
				var chtml = cheerio.load(callRes.body);
				return meta.parseTwitter(chtml)
				.catch(function(e){throw e;})
				.then(function(res) {
					['card', 'site', 'description', 'title', 'image'].forEach(function(key) {
						if(!res[key]) {
							throw new Error('Expected to find the ' + key + ' key in the response!');
						}
					});
				});
			});
		});

		it('and nested Twitter data from www.theguardian.com', function() {
			url = 'http://www.theguardian.com/us';
			return meta(url)
			.catch(function(e){throw e;})
			.then(function(res) {
				var expected = '{"app":{"id":{"iphone":"409128287","ipad":"409128287","googleplay":"com.guardian"},"name":{"googleplay":"The Guardian","ipad":"The Guardian","iphone":"The Guardian"},"url":{"ipad":"gnmguardian://us?contenttype=front&source=twitter","iphone":"gnmguardian://us?contenttype=front&source=twitter"}},"site":"@guardian","card":"summary","dnt":"on","url":"https://www.theguardian.com/us"}';
				assert.deepEqual(JSON.stringify(res.twitter), expected);
			});
		});
	});

	describe('parseJsonLd function', function() {
		var urls = ['http://www.theguardian.com/us', 'http://www.apple.com/'];
		urls.forEach(function(test) {
			describe(test, function() {
				it('should return an object or array and get correct data', function() {
					return preq.get(test).then(function(callRes) {
						var chtml = cheerio.load(callRes.body);
						return meta.parseJsonLd(chtml)
						.then(function(res) {
							assert.ok(typeof res === 'object');
							var result = res.filter(function(r) {
								return r['@type'] === 'Organization';
							})[0]; // Check the first organisation for the correct properties
							['@context', '@type', 'url', 'logo'].forEach(function(key) {
								assert.ok(result.hasOwnProperty(key));
							});
						});
					});
				});
			});
		});
	});

	describe('parsePrism function', function() {
		it('should get PRISM metadata from http://nature.com', function() {
			url = 'https://www.nature.com/articles/nature24679';
			return preq.get(url).then(function(callRes) {
				var expectedKeys = ['issn', 'publicationName', 'publicationDate', 'section', 'copyright', 'rightsAgent', 'url', 'doi'];
				var chtml = cheerio.load(callRes.body);

				return meta.parsePrism(chtml)
				.catch(function(e){throw e;})
				.then(function(results) {
					expectedKeys.forEach(function(key) {
						if(!results.hasOwnProperty(key)) {
							throw new Error('Expected to find the ' + key + ' key in the response!');
						}
					});
				});
			});
		});
	});

	it('should not have any undefined values', function() {
		url = 'https://www.cnet.com/special-reports/vr101/';
		return preq.get(url).then(function(callRes) {
			var chtml = cheerio.load(callRes.body);
			return meta.parseAll(chtml)
			.then(function(results) {
				Object.keys(results).forEach(function(metadataType) {
					Object.keys(results[metadataType]).forEach(function(key) {
						assert.notDeepEqual(results[metadataType][key], undefined); // Ensure all values are not undefined in response
					});
				});
			});
		});
	});

});
