'use strict';

/**
 * Tests expecting promises to reject
 */

var cheerio = require('cheerio');
var meta = require('../index');
var preq = require('preq'); // Promisified Request library
var assert = require('./utils/assert.js');
var fs = require('fs');


// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */


describe('errors', function() {

	this.timeout(40000);

	it('should not find schema.org metadata, reject promise', function() {
		var url = 'http://example.com';
		return preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseSchemaOrgMicrodata($);
			return assert.fails(prom);
		});
	});

	it('should not find BE Press metadata, reject promise', function() {
		var url = 'http://example.com';
		return preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseBEPress($);
			return assert.fails(prom);
		});
	});

	it('should not find coins metadata, reject promise', function() {
		var url = 'http://example.com';
		return preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseCOinS($);
			return assert.fails(prom);
		});
	});

	it('should not find dublin core metadata, reject promise', function() {
		var url = 'http://www.laprovence.com/article/actualites/3411272/marseille-un-proche-du-milieu-corse-abattu-par-balles-en-plein-jour.html';
		return preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseDublinCore($);
			return assert.fails(prom);
		});
	});

	it('should not find highwire press metadata, reject promise', function() {
		var url = 'http://example.com';
		return preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseHighwirePress($);
			return assert.fails(prom);
		});
	});

	it('should not find open graph metadata, reject promise', function() {
		var url = 'http://www.example.com';
		return preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseOpenGraph($);
			return assert.fails(prom);
		});
	});

	it('should not find eprints metadata, reject promise', function() {
		var url = 'http://example.com';
		return preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseEprints($);
			return assert.fails(prom);
		});
	});

	it('should not find twitter metadata, reject promise', function() {
		var url = 'http://example.com';
		return preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseTwitter($);
			return assert.fails(prom);
		});
	});

	it('should not find JSON-LD, reject promise', function() {
		var url = 'http://example.com';
		return preq.get(url)
		.then(function(callRes) {
			var $ = cheerio.load(callRes.body);
			var prom = meta.parseJsonLd($);
			return assert.fails(prom);
		});
	});

	it('should reject parseALL promise for entire error file', function() {
		var $ = cheerio.load(fs.readFileSync('./test/static/turtle_article_errors.html'));
		return assert.fails(meta.parseAll($));
	});


	it('should reject promise with undefined cheerio object', function() {
		var prom = meta.parseOpenGraph(undefined);
		return assert.fails(prom);
	});

	it('should reject promise with non-string title', function() {
		var prom = meta.parseCOinSTitle({});
		return assert.fails(prom);
	});

	it('should reject promise with string with no keys', function() {
		var prom = meta.parseCOinSTitle('');
		return assert.fails(prom);
	});

	it('should reject promise with string with bad keys', function() {
		var prom = meta.parseCOinSTitle('badkey.a&badkey.b');
		return assert.fails(prom);
	});

});
