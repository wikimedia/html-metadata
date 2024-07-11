'use strict';

const meta = require('../index');
const assert = require('assert');
const preq = require('preq');
const cheerio = require('cheerio');

// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */

describe('scraping', function() {

    this.timeout(50000);

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    const acceptHeader = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';

    function getWithHeaders(url) {
        return preq.get({
            uri: url,
            headers: {
                'User-Agent': userAgent,
                'Accept': acceptHeader
            }
        });
    }

    describe('parseAll function', function() {
        it('should resolve promise from woorank', function() {
            const url = 'https://www.woorank.com/en/blog/dublin-core-metadata-for-seo-and-usability';
            return meta({ uri: url, headers: { 'User-Agent': userAgent, 'Accept': acceptHeader } })
                .then(result => {
                    assert.ok(result, 'Expected result to be truthy');
                })
                .catch(e => {
                    console.error('Error in woorank test:', e);
                    throw e;
                });
        });

        it('should resolve promise from blog.schema.org', function() {
            const url = 'http://blog.schema.org';
            return meta({ uri: url, headers: { 'User-Agent': userAgent, 'Accept': acceptHeader } })
                .then(result => {
                    assert.ok(result, 'Expected result to be truthy');
                })
                .catch(e => {
                    console.error('Error in blog.schema.org test:', e);
                    throw e;
                });
        });
    });

    describe('parseBEPress function', function() {
        it('should get BE Press metadata tags', function() {
            const url = 'http://biostats.bepress.com/harvardbiostat/paper154/';
            return getWithHeaders(url).then(function(callRes) {
                const expectedAuthors = ['Claggett, Brian', 'Xie, Minge', 'Tian, Lu'];
                const expectedAuthorInstitutions = ['Harvard', 'Rutgers University - New Brunswick/Piscataway', 'Stanford University School of Medicine'];
                const chtml = cheerio.load(callRes.body);

                return meta.parseBEPress(chtml)
                    .then(function(results) {
                        assert.deepStrictEqual(results.author, expectedAuthors);
                        assert.deepStrictEqual(results.author_institution, expectedAuthorInstitutions);
                        ['series_title', 'author', 'author_institution', 'title', 'date', 'pdf_url',
                         'abstract_html_url', 'publisher', 'online_date'].forEach(function(key) {
                            assert.ok(results[key], `Expected to find the ${key} key in the response!`);
                        });
                    });
            });
        });
    });

    describe('parseCOinS function', function() {
        it('should get COinS metadata', function() {
            const url = 'https://en.wikipedia.org/wiki/Viral_phylodynamics';
            return getWithHeaders(url).then(function(callRes) {
                const chtml = cheerio.load(callRes.body);
                return meta.parseCOinS(chtml)
                    .then(function(results){
                        assert.ok(Array.isArray(results), `Expected Array, got ${typeof results}`);
                        assert.ok(results.length > 0, 'Expected Array with at least 1 item');
                        assert.ok(results[0].rft, 'Expected first item of Array to contain key rft');
                    });
            });
        });
    });

    describe('parseEPrints function', function() {
        it('should get EPrints metadata', function() {
            const url = 'http://eprints.gla.ac.uk/113711/';
            return getWithHeaders(url).then(function(callRes) {
                const chtml = cheerio.load(callRes.body);
                const expectedAuthors = ['Gatherer, Derek', 'Kohl, Alain'];

                return meta.parseEprints(chtml)
                    .then(function(results) {
                        assert.deepStrictEqual(results.creators_name, expectedAuthors);
                        ['eprintid', 'datestamp', 'title', 'abstract', 'issn', 'creators_name', 'publication', 'citation'].forEach(function(key) {
                            assert.ok(results[key], `Expected to find the ${key} key in the response!`);
                        });
                    });
            });
        });
    });

    describe('parseGeneral function', function() {
        it('should get html lang parameter', function() {
            const expected = "fr";
            const url = "http://www.lemonde.fr";
            return getWithHeaders(url).then(function(callRes) {
                const chtml = cheerio.load(callRes.body);
                return meta.parseGeneral(chtml).then(function(results) {
                    assert.strictEqual(results.lang, expected);
                });
            });
        });

        it('should get html dir parameter', function() {
            const expected = "rtl";
            const url = "https://www.iranrights.org/fa/";
            return getWithHeaders(url).then(function(callRes) {
                const chtml = cheerio.load(callRes.body);
                return meta.parseGeneral(chtml).then(function(results) {
                    assert.strictEqual(results.dir, expected);
                });
            });
        });
    });

    // ... (rest of the test cases remain the same)

    it('should not have any undefined values', function() {
        const url = 'https://www.cnet.com/special-reports/vr101/';
        return getWithHeaders(url).then(function(callRes) {
            const chtml = cheerio.load(callRes.body);
            return meta.parseAll(chtml)
                .then(function(results) {
                    Object.keys(results).forEach(function(metadataType) {
                        Object.keys(results[metadataType]).forEach(function(key) {
                            assert.notStrictEqual(results[metadataType][key], undefined, `${metadataType}.${key} should not be undefined`);
                        });
                    });
                });
        });
    });

});