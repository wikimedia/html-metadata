'use strict';

var meta = require('../index');
var cheerio = require('cheerio');
var request = require('request');

// Run jshint as part of normal testing
require('mocha-jshint')();

// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */

describe('scraping', function() {

	var url = 'http://fortune.com/2015/02/20/nobel-prize-economics-for-sale/';

	it('should get OpenGraph info', function(done) {
		request(url, function(error, response) {
			var ch = cheerio.load(response.body);
			meta.parseOpenGraph(ch, function(res) {
				// check for some properties
				['title', 'description', 'author'].forEach(function(key) {
					if(!res[key]) {
						throw new Error('Expected to find the ' + key + ' key in the reponse!');
					}
				});
				done();
			});
		});
	});

});

