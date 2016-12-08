'use strict';

/**
 * Tests using files contained in ./static
 */

var assert = require('./utils/assert.js');
var cheerio = require('cheerio');
var meta = require('../index');

// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */

describe('static files', function() {
	var $;
	var fs = require('fs');
	var expected;

	it('should get correct info from turtle movie file', function() {
		expected = JSON.parse(fs.readFileSync('./test/static/turtle_movie.json'));
		$ = cheerio.load(fs.readFileSync('./test/static/turtle_movie.html'));
		return meta.parseAll($).then(function(results){
			assert.deepEqual(results, expected);
		});
	});

	it('should get correct info from turtle article file', function() {
		expected = JSON.parse(fs.readFileSync('./test/static/turtle_article.json'));
		$ = cheerio.load(fs.readFileSync('./test/static/turtle_article.html'));
		return meta.parseAll($).then(function(results){
			assert.deepEqual(results, expected);
		});
	});

	it('should be case insensitive on Turtle Article file', function() {
		expected = JSON.parse(fs.readFileSync('./test/static/turtle_article.json'));
		$ = cheerio.load(fs.readFileSync('./test/static/turtle_article_case.html'));
		return meta.parseAll($).then(function(results){
			assert.deepEqual(results, expected);
		});
	});
});
