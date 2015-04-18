'use strict';

var meta = require('../index');
var cheerio = require('cheerio');

// Run jshint as part of normal testing
require('mocha-jshint')();

// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */

describe('scraping', function() {

	var url = 'http://fortune.com/2015/02/20/nobel-prize-economics-for-sale/';

	it('should get OpenGraph info', function(done) {
		meta(url).done(function(res) {
			['title', 'description', 'author'].forEach(function(key) {
				if(!res.openGraph[key]) {
					throw new Error('Expected to find the ' + key + ' key in the reponse!');
				}
			});
			done();
		});
	});
});

describe('turtle movie', function() {

	var fs = require('fs');
	var expectedResults = '{"dublinCore":{"title":"Turtles of the Jungle","creator":"http://www.example.com/turtlelvr","description":"A 2008 film about jungle turtles.","date":"2012-02-04 12:00:00","type":"Image.Moving"},"general":{"author":"Turtle Lvr","authorlink":"http://examples.com/turtlelvr","canonical":"http://example.com/turtles","description":"Exposition on the awesomeness of turtles","publisher":"https://mediawiki.org","robots":"we welcome our robot overlords","shortlink":"http://example.com/c","title":"Turtles are AWESOME!!1 | Awesome Turtles Website"},"schemaOrg":{"items":[]},"openGraph":{"locale":"en_US","type":"video.movie","title":"Turtles of the Jungle","description":"A 2008 film about jungle turtles.","url":"http://example.com","site_name":"Awesome Turtle Movies Website","image":[{"url":"http://example.com/turtle.jpg"},{"url":"http://example.com/shell.jpg"}],"tag":["turtle","movie","awesome"],"director":"http://www.example.com/PhilTheTurtle","actor":["http://www.example.com/PatTheTurtle","http://www.example.com/SaminaTheTurtle"],"writer":"http://www.example.com/TinaTheTurtle","release_date":"2015-01-14T19:14:27+00:00","duration":"1000000"}}';
	it('should get correct info from turtle movie file', function(done) {
		var $ = cheerio.load(fs.readFileSync('./test/static/turtle_movie.html'));
		var results = meta.parseAll($);
		if (JSON.stringify(results) !== expectedResults){
			throw new Error('Got '+JSON.stringify(results) + 'Expected' + expectedResults);
		}
		done();
	});
});

