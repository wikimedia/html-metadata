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
	var url;

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
			var expectedImage = '{"url":"http://s1.lemde.fr/medias/web/1.2.677/img/placeholder/opengraph.jpg"}';
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

});
