'use strict';

/**
 * Tests using files contained in ./static
 */

var cheerio = require('cheerio');
var meta = require('../index');
var util = require('util');

// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */

describe('static files', function() {
	var fs = require('fs');

	it('should get correct info from turtle movie file', function(done) {
		var expected = '{"dublinCore":{"title":"Turtles of the Jungle","creator":"http://www.example.com/turtlelvr","description":"A 2008 film about jungle turtles.","date":"2012-02-04 12:00:00","type":"Image.Moving"},"general":{"author":"Turtle Lvr","authorlink":"http://examples.com/turtlelvr","canonical":"http://example.com/turtles","description":"Exposition on the awesomeness of turtles","publisher":"https://mediawiki.org","robots":"we welcome our robot overlords","shortlink":"http://example.com/c","title":"Turtles are AWESOME!!1 | Awesome Turtles Website"},"schemaOrg":{"items":[]},"openGraph":{"locale":"en_US","type":"video.movie","title":"Turtles of the Jungle","description":"A 2008 film about jungle turtles.","url":"http://example.com","site_name":"Awesome Turtle Movies Website","image":[{"url":"http://example.com/turtle.jpg"},{"url":"http://example.com/shell.jpg"}],"tag":["turtle","movie","awesome"],"director":"http://www.example.com/PhilTheTurtle","actor":["http://www.example.com/PatTheTurtle","http://www.example.com/SaminaTheTurtle"],"writer":"http://www.example.com/TinaTheTurtle","release_date":"2015-01-14T19:14:27+00:00","duration":"1000000"}}';
		var $ = cheerio.load(fs.readFileSync('./test_files/turtle_movie.html'));
		meta.parseAll($, function(err, results){
			if (JSON.stringify(results) !== expected){
				console.log(util.inspect(results, false, null));
				throw new Error('Unexpected Results');
			}
			done();
		});
	});

	it('should get correct info from turtle article file', function(done) {
		var expected = '{"dublinCore":{"title":"Turtles are AWESOME!!1","creator":"http://www.example.com/turtlelvr","description":"Exposition on the awesomeness of turtles","date":"2012-02-04 12:00:00","type":"Text.Article"},"general":{"author":"Turtle Lvr","authorlink":"http://examples.com/turtlelvr","canonical":"http://example.com/turtles","description":"Exposition on the awesomeness of turtles","publisher":"https://mediawiki.org","robots":"we welcome our robot overlords","shortlink":"http://example.com/c","title":"Turtles are AWESOME!!1 | Awesome Turtles Website"},"schemaOrg":{"items":[]},"openGraph":{"locale":"en_US","type":"article","title":"Turtles are AWESOME!!1","description":"Exposition on the awesomeness of turtles","url":"http://example.com","site_name":"Awesome Turtles Website","image":[{"url":"http://example.com/turtle.jpg","secure_url":"https://secure.example.com/turtle.jpg","type":"image/jpeg","width":"400","height":"300"},{"url":"http://example.com/shell.jpg","width":"200","height":"150"}],"audio":{"url":"http://example.com/sound.mp3","secure_url":"https://secure.example.com/sound.mp3","type":"audio/mpeg"},"tag":["turtles","are","awesome"],"section":["Turtles are tough","Turtles are flawless","Turtles are cute"],"published_time":"2012-02-04T12:00:00+00:00","modified_time":"2015-01-14T19:14:27+00:00","author":"http://examples.com/turtlelvr","publisher":"http://mediawiki.org"}}';
		var $ = cheerio.load(fs.readFileSync('./test_files/turtle_article.html'));
		meta.parseAll($, function(err, results){
			if (JSON.stringify(results) !== expected){
				console.log(util.inspect(results, false, null));
				throw new Error('Unexpected Results');
			}
			done();
		});

	});
});

