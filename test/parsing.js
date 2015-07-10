'use strict';

/**
 * Tests using parsing methods only
 */

var assert = require('./utils/assert.js');
var meta = require('../index');

// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */

describe('parsing', function() {

	it('should get correct structure from decoded string', function() {
		var title = 'ctx_ver=Z39.88-2004&rft_id=info%3Adoi%2Fhttp%3A%2F%2Fdx.doi.org%2F10.5555%2F12345678&rfr_id=info%3Asid%2Fcrossref.org%3Asearch&rft.atitle=Toward+a+Unified+Theory+of+High-Energy+Metaphysics%3A+Silly+String+Theory&rft.jtitle=Journal+of+Psychoceramics&rft.date=2008&rft.volume=5&rft.issue=11&rft.spage=1&rft.epage=3&rft.aufirst=Josiah&rft.aulast=Carberry&rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Ajournal&rft.genre=article&';
		var expected = {
			ctx_ver: 'Z39.88-2004',
			rft_id: 'info:doi/http://dx.doi.org/10.5555/12345678',
			rfr_id: 'info:sid/crossref.org:search',
			rft_val_fmt: 'info:ofi/fmt:kev:mtx:journal',
			rft: {
				atitle: 'Toward a Unified Theory of High-Energy Metaphysics: Silly String Theory',
				jtitle: 'Journal of Psychoceramics',
				date: '2008',
				volume: '5',
				issue: '11',
				spage: '1',
				epage: '3',
				aufirst: 'Josiah',
				aulast: 'Carberry',
				genre: 'article'
			}
		};

		return meta.parseCOinSTitle(title).then(function(results){
			assert.deepEqual(results, expected);
		});
	});

	it('should get correct structure from html encoded string', function() {
		var title = 'ctx_ver=Z39.88-2004&amp;rft_id=info%3Adoi%2Fhttp%3A%2F%2Fdx.doi.org%2F10.5555%2F12345678&amp;rfr_id=info%3Asid%2Fcrossref.org%3Asearch&amp;rft.atitle=Toward+a+Unified+Theory+of+High-Energy+Metaphysics%3A+Silly+String+Theory&amp;rft.jtitle=Journal+of+Psychoceramics&amp;rft.date=2008&amp;rft.volume=5&amp;rft.issue=11&amp;rft.spage=1&amp;rft.epage=3&amp;rft.aufirst=Josiah&amp;rft.aulast=Carberry&amp;rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Ajournal&amp;rft.genre=article&amp;';
		var expected = {
			ctx_ver: 'Z39.88-2004',
			rft_id: 'info:doi/http://dx.doi.org/10.5555/12345678',
			rfr_id: 'info:sid/crossref.org:search',
			rft_val_fmt: 'info:ofi/fmt:kev:mtx:journal',
			rft: {
				atitle: 'Toward a Unified Theory of High-Energy Metaphysics: Silly String Theory',
				jtitle: 'Journal of Psychoceramics',
				date: '2008',
				volume: '5',
				issue: '11',
				spage: '1',
				epage: '3',
				aufirst: 'Josiah',
				aulast: 'Carberry',
				genre: 'article'
			}
		};

		return meta.parseCOinSTitle(title).then(function(results){
			assert.deepEqual(results, expected);
		});
	});

	it('should not add rft object when there are no valid keys', function() {
		var title = 'ctx_ver=Z39.88-2004&amp;rft_id=info%3Adoi%2Fhttp%3A%2F%2Fdx.doi.org%2F10.5555%2F12345678&amp;rfr_id=info%3Asid%2Fcrossref.org%3Asearch&amp;badkey.atitle=Toward+a+Unified+Theory+of+High-Energy+Metaphysics%3A+Silly+String+Theory&amp;badkey.jtitle=Journal+of+Psychoceramics&amp;badkey.date=2008&amp;badkey.volume=5&amp;badkey.issue=11&amp;badkey.spage=1&amp;badkey.epage=3&amp;badkey.aufirst=Josiah&amp;badkey.aulast=Carberry&amp;rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Ajournal&amp;badkey.genre=article&amp;badkey.au=Josiah+Carberry';
		var expected = {
			ctx_ver: 'Z39.88-2004',
			rft_id: 'info:doi/http://dx.doi.org/10.5555/12345678',
			rfr_id: 'info:sid/crossref.org:search',
			rft_val_fmt: 'info:ofi/fmt:kev:mtx:journal',
		};

		return meta.parseCOinSTitle(title).then(function(results){
			assert.deepEqual(results, expected);
		});
	});

	it('should not replace encoded + symbol in doi', function() {
		var title = 'ctx_ver=Z39.88-2004&amp;rft_id=info%3Adoi%2Fhttp%3A%2F%2Fdx.doi.org%2F10.5555%2F12%2B345678&amp;rfr_id=info%3Asid%2Fcrossref.org%3Asearch&amp;badkey.atitle=Toward+a+Unified+Theory+of+High-Energy+Metaphysics%3A+Silly+String+Theory&amp;badkey.jtitle=Journal+of+Psychoceramics&amp;badkey.date=2008&amp;badkey.volume=5&amp;badkey.issue=11&amp;badkey.spage=1&amp;badkey.epage=3&amp;badkey.aufirst=Josiah&amp;badkey.aulast=Carberry&amp;rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Ajournal&amp;badkey.genre=article&amp;badkey.au=Josiah+Carberry';
		var expected = {
			ctx_ver: 'Z39.88-2004',
			rft_id: 'info:doi/http://dx.doi.org/10.5555/12+345678',
			rfr_id: 'info:sid/crossref.org:search',
			rft_val_fmt: 'info:ofi/fmt:kev:mtx:journal',
		};

		return meta.parseCOinSTitle(title).then(function(results){
			assert.deepEqual(results, expected);
		});
	});


	it('should add list for au field', function() {
		var title = 'ctx_ver=Z39.88-2004&amp;rft_id=info%3Adoi%2Fhttp%3A%2F%2Fdx.doi.org%2F10.5555%2F12345678&amp;rfr_id=info%3Asid%2Fcrossref.org%3Asearch&amp;rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Ajournal&amp;rft.genre=article&amp;rft.au=Josiah+Carberry&amp;rft.au=Random+Name&amp;rft.au=Name+of+an+organisation';
		var expected = {
			ctx_ver: 'Z39.88-2004',
			rft_id: 'info:doi/http://dx.doi.org/10.5555/12345678',
			rfr_id: 'info:sid/crossref.org:search',
			rft_val_fmt: 'info:ofi/fmt:kev:mtx:journal',
			rft: {
				genre: 'article',
				au: [
				'Josiah Carberry',
				'Random Name',
				'Name of an organisation'
				]
			}
		};

		return meta.parseCOinSTitle(title).then(function(results){
			assert.deepEqual(results, expected);
		});
	});

	it('should add list for issn and aucorp field', function() {
		var title = 'rft.genre=article&amp;rft.issn=1234-5678&amp;rft.issn=2222-3333&amp;rft.aucorp=Name+of+an+organisation';
		var expected = {
			rft: {
				genre: 'article',
				aucorp: [
				'Name of an organisation'
				],
				issn: [
				'1234-5678',
				'2222-3333'
				]
			}
		};

		return meta.parseCOinSTitle(title).then(function(results){
			assert.deepEqual(results, expected);
		});
	});

	it('should ignore bad hierarchical keys', function() {
		var title = 'ctx_ver=Z39.88-2004&amp;rft_id=info%3Adoi%2Fhttp%3A%2F%2Fdx.doi.org%2F10.5555%2F12345678&amp;rfr_id=info%3Asid%2Fcrossref.org%3Asearch&amp;badkey.atitle=Toward+a+Unified+Theory+of+High-Energy+Metaphysics%3A+Silly+String+Theory&amp;badkey.jtitle=Journal+of+Psychoceramics&amp;badkey.date=2008&amp;badkey.volume=5&amp;badkey.issue=11&amp;badkey.spage=1&amp;badkey.epage=3&amp;badkey.aufirst=Josiah&amp;badkey.aulast=Carberry&amp;rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Ajournal&amp;rft.genre=article&amp;badkey.au=Josiah+Carberry';
		var expected = {
			ctx_ver: 'Z39.88-2004',
			rft_id: 'info:doi/http://dx.doi.org/10.5555/12345678',
			rfr_id: 'info:sid/crossref.org:search',
			rft_val_fmt: 'info:ofi/fmt:kev:mtx:journal',
			rft: {
				genre: 'article'
			}
		};

		return meta.parseCOinSTitle(title).then(function(results){
			assert.deepEqual(results, expected);
		});
	});


});

