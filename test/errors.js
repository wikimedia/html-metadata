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


//TODO: ALL BROKEN- Pass even when they shouldn't

describe('errors', function() {

	var url = 'http://www.example.com/';

	it('should not find schema.org metadata, reject promise', function() {
		preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseSchemaOrgMicrodata($);
			return assert.fails(prom);
		});
	});

	it('should not find dublin core metadata, reject promise', function() {
		preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseDublinCore($);
			return assert.fails(prom);
		});
	});

	it('should not find open graph metadata, reject promise', function() {
		preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseOpenGraph($);
			return assert.fails(prom);
		});
	});

	//TODO: Add test for lacking general metadata
	//TODO: Add test for lacking any metadata

	// it('should reject promise with undefined cheerio object', function() {
	// 	var prom = meta.parseOpenGraph(undefined);
	// 	return assert.fails(prom);
	// });

});

