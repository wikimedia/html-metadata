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

	function onRejected(e){
		throw e;
	}

	//TODO: Fix test
	//Unhandled rejection TypeError: undefined is not a function
	it('should get OpenGraph info', function() {
		url = 'http://fortune.com/2015/02/20/nobel-prize-economics-for-sale/';
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

	it('should resolve promise', function() {
		url = 'http://blog.woorank.com/2013/04/dublin-core-metadata-for-seo-and-usability/';
		return assert.ok(meta(url));
	});

	it('should resolve promise', function() {
		url = 'http://blog.schema.org';
		return assert.ok(meta(url));
	});

	//TODO: Unhandled rejection error
	it('should get schema.org microdata', function() {
		url = 'http://blog.schema.org/';
		return preq.get(url).then(function(callRes) {
			var expected = '{"items":[{"type":["http://schema.org/Blog"],"properties":{"name":["schema blog"]}}]}';
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseSchemaOrgMicrodata($);
			return prom.then(function(results){
				assert.deepEqual(JSON.stringify(results), expected);
			});
		});
	});

});
