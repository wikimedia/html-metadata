html-metadata
=============

# MetaData html scraper and parser for Node.js (supports Promises and callback style)

The aim of this library is to be a comprehensive source for extracting all html embedded metadata. Currently it supports Schema.org microdata using a third party library, a native Dublin Core and Open Graph implementation, and some general metadata that doesn't belong to a particular standard (for instance, the content of the title tag, or meta description tags).

Planned is support for  COinS, RDFa , twitter, AGLS, eprints, highwire, BEPress and other yet unheard of metadata types. Contributions and requests for other metadata types welcome!

## Install

	npm install git://github.com/mvolz/html-metadata.git

## Usage

Promise-based:

```js
var scrape = require('html-metadata');

var url = "http://blog.woorank.com/2013/04/dublin-core-metadata-for-seo-and-usability/";

scrape(url).then(function(metadata){
	console.log(metadata);
});
```

Callback-based:

```js
var scrape = require('html-metadata');

var url = "http://blog.woorank.com/2013/04/dublin-core-metadata-for-seo-and-usability/";

scrape(url, function(error, metadata){
	console.log(metadata);
});
```

The scrape method used here invokes the parseAll() method, which uses all the available methods registered in method metadataFunctions(), and are available for use separately as well, for example:

Promise-based:
```js
var cheerio = require('cheerio');
var preq = require('preq'); // Promisified request library
var dublinCore = require('html-metadata').parseDublinCore;

var url = "http://blog.woorank.com/2013/04/dublin-core-metadata-for-seo-and-usability/";

preq(url).then(function(response){
	$ = cheerio.load(response.body);
	return parseDublinCore($).then(function(metadata){
		console.log(metadata);
	});
});
```

Callback-based:
```js
var cheerio = require('cheerio');
var request = require('request');
var dublinCore = require('html-metadata').parseDublinCore;

var url = "http://blog.woorank.com/2013/04/dublin-core-metadata-for-seo-and-usability/";

request(url, function(error, response, html){
	$ = cheerio.load(html);
	parseDublinCore($, function(error, metadata){
		console.log(metadata);
	});
});

The method parseGeneral obtains the following general metadata:

```html
<meta name="author" content="">
<link rel="author" href="">
<link rel="canonical" href="">
<meta name ="description" content="">
<link rel="publisher" href="">
<meta name ="robots" content="">
<link rel="shortlink" href="">
<title></title>
```

## Tests

```npm test``` runs the mocha tests

```npm run-script coverage``` runs the tests and reports code coverage

