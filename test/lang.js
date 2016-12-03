'use strict';

/**
 * Tests using externally scraped websites. May fail if resource at
 * location changes.
 */

var meta = require('../index');
var assert = require('./utils/assert.js');

// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */

describe('scraping', function() {

	this.timeout(40000);

	var url;

	describe('Lang parameter from external website', function() {
		it('should get hu parameter', function() {
			var expected = "hu";
			var options =  {
    		url: "http://mno.hu/migr_1834/tellerlevel-cafolat-es-cafolat-700280",
    		headers: {
        	'User-Agent': 'webscraper'
    		}
			};
			return meta(options, function(error, metadata){
				assert.deepEqual(eval(metadata).general.lang, expected);
			});
		});
	});
});
