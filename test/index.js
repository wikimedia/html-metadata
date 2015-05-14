'use strict';

var meta = require('../index');
var cheerio = require('cheerio');
var request = require('request');
var util = require('util');


// Run jshint as part of normal testing
require('mocha-jshint')();

// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */

describe('scraping', function() {

	it('should get OpenGraph info', function(done) {
		var url = 'http://fortune.com/2015/02/20/nobel-prize-economics-for-sale/';

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

	it('should get OpenGraph image tags correctly', function(done) {
		var url = 'http://www.lemonde.fr';

		request(url, function(error, response) {
			var ch = cheerio.load(response.body);
			var expectedImage = '{"url":"http://s1.lemde.fr/medias/web/1.2.672/img/placeholder/opengraph.jpg"}';
			meta.parseOpenGraph(ch, function(res) {
				// check for some properties
				['image'].forEach(function(key) {
					if(!res[key]) {
						throw new Error('Expected to find the ' + key + ' key in the reponse!');
					}
					if (JSON.stringify(res[key])!== expectedImage){
						throw new Error('Unexpected result');
					}
				});
				done();
			});
		});
	});

});

