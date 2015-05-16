'use strict';

/**
 * Tests expecting promises to reject
 */

var cheerio = require('cheerio');
var meta = require('../index');
var preq = require('preq'); // Promisified Request library
var assert = require('./utils/assert.js');


// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */


describe('errors', function() {

	var url = 'http://www.example.com/';
//	TODO: ALL BROKEN- Pass even when they shouldn't i.e. uncomment following line:
//	var url = 'http://blog.woorank.com/2013/04/dublin-core-metadata-for-seo-and-usability/';

	it('should not find schema.org metadata, reject promise', function() {
		return preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseSchemaOrgMicrodata($);
			assert.fails(prom);
		});
	});

	it('should not find dublin core metadata, reject promise', function() {
		return preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseDublinCore($);
			assert.fails(prom);
		});
	});

	it('should not find open graph metadata, reject promise', function() {
		return preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseOpenGraph($);
			assert.fails(prom);
		});
	});

	//TODO: Add test for lacking general metadata
	//TODO: Add test for lacking any metadata

	// it('should reject promise with undefined cheerio object', function() {
	// 	var prom = meta.parseOpenGraph(undefined);
	// 	return assert.fails(prom);
	// });

});

