html-metadata
=============
[![npm](https://img.shields.io/npm/v/html-metadata.svg)](https://www.npmjs.com/package/html-metadata)
> MetaData html scraper and parser for Node.js (supports Promises and callback style)

The aim of this library is to be a comprehensive source for extracting all html embedded metadata. Currently it supports Schema.org microdata using a third party library, a native BEPress, Dublin Core, Highwire Press, JSON-LD, Open Graph, Twitter, EPrints, PRISM, and COinS implementation, and some general metadata that doesn't belong to a particular standard (for instance, the content of the title tag, or meta description tags).

Planned is support for RDFa, AGLS, and other yet unheard of metadata types. Contributions and requests for other metadata types welcome!

## Install

	npm install html-metadata

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
var parseDublinCore = require('html-metadata').parseDublinCore;

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
var parseDublinCore = require('html-metadata').parseDublinCore;

var url = "http://blog.woorank.com/2013/04/dublin-core-metadata-for-seo-and-usability/";

request(url, function(error, response, html){
	$ = cheerio.load(html);
	parseDublinCore($, function(error, metadata){
		console.log(metadata);
	});
});
```

Options object:

You can also pass an [options object](https://github.com/request/request#requestoptions-callback) as the first argument containing extra parameters. Some websites require the user-agent or cookies to be set in order to get the response.

```
var scrape = require('html-metadata');
var request = require('request');

var options =  {
	url: "http://blog.woorank.com/2013/04/dublin-core-metadata-for-seo-and-usability/",
	jar: request.jar(), // Cookie jar
	headers: {
		'User-Agent': 'webscraper'
	}
};

scrape(options, function(error, metadata){
	console.log(metadata);
});
```

The method parseGeneral obtains the following general metadata:

```html
<link rel="apple-touch-icon" href="" sizes="" type="">
<link rel="icon" href="" sizes="" type="">
<meta name="author" content="">
<link rel="author" href="">
<link rel="canonical" href="">
<meta name ="description" content="">
<link rel="publisher" href="">
<meta name ="robots" content="">
<link rel="shortlink" href="">
<title></title>
<html lang="en">
<html dir="rtl">
```

## Tests

```npm test``` runs the mocha tests

```npm run-script coverage``` runs the tests and reports code coverage

## Contributing

Contributions welcome! All contibutions should use [bluebird promises](https://github.com/petkaantonov/bluebird) instead of callbacks,
and be .nodeify()-ed in index.js so the functions can be used as either callbacks or Promises.
