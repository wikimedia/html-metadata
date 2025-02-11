/**
 * https://github.com/wikimedia/html-metadata
 */

'use strict';

const BBPromise = require( 'bluebird' );
const microdata = require( 'microdata-node' ); // Schema.org microdata

/**
 * Returns Object containing all available datatypes, keyed
 * using the same keys as in metadataFunctions.
 *
 * @param  {Object}   chtml html Cheerio object to parse
 * @return {Object}         BBPromise for metadata
 */
exports.parseAll = function ( chtml ) {

	// Array of keys corresponding to position of promise
	const keys = Object.keys( exports.metadataFunctions );
	const meta = {}; // Metadata keyed by keys in exports.metadataFunctions
	// Array of promises for metadata of each type in exports.metadataFunctions
	const arr = keys.map( ( key ) => exports.metadataFunctions[ key ]( chtml ) );

	let result; // Result in for loop over results
	let key; // Key corresponding to location of result
	return BBPromise.all( arr.map( ( x ) => x.reflect() ) )
		.then( ( results ) => {
			Object.keys( results ).forEach( ( r ) => {
				result = results[ r ];
				key = keys[ r ];
				if ( result && result.isFulfilled() && result.value() ) {
					meta[ key ] = result.value();
				}
			} );
			if ( Object.keys( meta ).length === 0 ) {
				throw new Error( 'No metadata found in page' );
			}
			return BBPromise.resolve( meta );
		} );
};

/**
 * Base scraper for tags, used by some other parsing functions
 *
 * @param  {Object}   chtml html Cheerio object
 * @param  {string[]} tags tag types to process
 * @param  {string}   reason message when metadata is not found
 * @param  {Function} getProperty function that gets the property of an element
 * @param  {Function} getContent function that gets the content of an element
 * @return {Object}   promise of metadata object
 */
exports.parseBase = BBPromise.method( ( chtml, tags, reason, getProperty, getContent ) => {

	const meta = {};
	const metaTags = chtml( tags.join() );

	if ( !metaTags || metaTags.length === 0 ) {
		return BBPromise.reject( new Error( reason ) );
	}

	metaTags.each( function () {
		const element = chtml( this );
		const property = getProperty( element );
		const content = getContent( element );

		// If lacks property or content, skip
		if ( !property || !content ) {
			return;
		}

		// If the property already exists, make the array of contents
		if ( meta[ property ] ) {
			if ( meta[ property ] instanceof Array ) {
				meta[ property ].push( content );
			} else {
				meta[ property ] = [ meta[ property ], content ];
			}
		} else {
			meta[ property ] = content;
		}
	} );

	if ( !Object.keys( meta ).length ) {
		return BBPromise.reject( new Error( reason ) );
	}

	return meta;

} );

/**
 * Scrapes BE Press metadata given html object
 *
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}   promise of BE Press metadata object
 */
exports.parseBEPress = BBPromise.method( ( chtml ) => exports.parseBase(
	chtml,
	[ 'meta' ],
	'No BE Press metadata found in page',
	( element ) => {
		const content = element.attr( 'content' );
		const name = element.attr( 'name' );

		// If the element isn't a BE Press property or if content is missing, skip it
		if ( !name || !content || ( name.slice( 0, 17 ).toLowerCase() !== 'bepress_citation_' ) ) {
			return;
		}

		return name.slice( 17 ).toLowerCase();
	},
	( element ) => element.attr( 'content' )
) );

/**
 * Scrapes COinS data given Cheerio loaded html object
 *
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}         BBPromise for COinS metadata
 */
exports.parseCOinS = function ( chtml ) {
	let title;
	const metadata = [];
	const tags = chtml( 'span[class=Z3988]' );
	const promArray = [];

	// Add promises for parsed title tags to an Array
	tags.each( function () {
		title = chtml( this ).attr( 'title' );
		promArray.push( exports.parseCOinSTitle( title ) );
	} );

	// Once promises have resolved, add any successfully parsed titles to the metadata Array
	return BBPromise.all( promArray.map( ( x ) => x.reflect() ) ).then( ( results ) => {
		let result;
		for ( const r in results ) {
			result = results[ r ];
			if ( result && result.isFulfilled() && result.value() ) {
				metadata.push( result.value() );
			}
		}
		if ( !metadata.length ) {
			return BBPromise.reject( new Error( 'No COinS metadata found' ) );
		} else {
			return metadata;
		}
	} );
};

/**
 * Parses value of COinS title tag
 *
 * @param  {string}   title String corresponding to value of title tag in span element
 * @return {Object}         BBPromise for CoinS metadata
 */
exports.parseCOinSTitle = BBPromise.method( ( title ) => {
	const metadata = {};
	const rft = {};
	let value;
	let key;
	if ( typeof title !== 'string' ) {
		return BBPromise.reject( new Error( 'Provided value must be a string; Got ' + typeof title ) );
	}
	title = title.replace( /&amp;/g, '&' ); // Allows function to take the raw html string
	title = title.split( '&' );
	title.forEach( ( element ) => {
		element = element.split( '=' );
		if ( element.length !== 2 ) {
			return;
		} // Invalid element
		key = element[ 0 ].toLowerCase(); // Be case-insensitive for properties
		value = decodeURIComponent( element[ 1 ].replace( /\+/g, '%20' ) ); // Replace + with encoded space since they aren't getting decoded as spaces
		key = key.split( '.' ); // Split hierarchical keys
		if ( key.length === 1 ) { // Top level key
			metadata[ key[ 0 ] ] = value;
			return;
		}
		if ( key.length === 2 ) { // Split key e.g. rft.date
			if ( key[ 0 ] !== 'rft' ) {
				return;
			} // Invalid hierarchical key
			// Keys that may have multiple values - return in list format
			if ( key[ 1 ] === 'au' || key[ 1 ] === 'isbn' || key[ 1 ] === 'issn' || key[ 1 ] === 'eissn' || key[ 1 ] === 'aucorp' ) {
				if ( !rft[ key[ 1 ] ] ) {
					rft[ key[ 1 ] ] = [];
				}
				rft[ key[ 1 ] ].push( value );
				return;
			}
			// Add rft value to rft key - this will overwrite duplicates, if they exist
			rft[ key[ 1 ] ] = value;
		}
	} );
	if ( Object.keys( rft ).length ) { // Add rft object if it is not empty
		metadata.rft = rft;
	}
	if ( !Object.keys( metadata ).length ) {
		return BBPromise.reject( new Error( 'No COinS in provided string' ) );
	}
	if ( metadata.rft && metadata.rft.genre ) {
		// Genre should be case insensitive as this field may be used programmatically
		metadata.rft.genre = metadata.rft.genre.toLowerCase();
	}
	return metadata;
} );

/**
 * Scrapes Dublin Core data given Cheerio loaded html object
 *
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}         BBPromise for DC metadata
 */
exports.parseDublinCore = BBPromise.method( ( chtml ) => exports.parseBase(
	chtml,
	[ 'meta', 'link' ],
	'No Dublin Core metadata found in page',
	( element ) => {
		const isLink = element[ 0 ].name === 'link';
		const nameAttr = element.attr( isLink ? 'rel' : 'name' );
		const value = element.attr( isLink ? 'href' : 'content' );

		// If the element isn't a Dublin Core property or if value is missing, skip it
		if ( !nameAttr || !value ||
				( nameAttr.slice( 0, 3 ).toUpperCase() !== 'DC.' &&
					nameAttr.slice( 0, 8 ).toUpperCase() !== 'DCTERMS.' ) ) {
			return;
		}

		const property = nameAttr.slice( Math.max( 0, nameAttr.lastIndexOf( '.' ) + 1 ) ).toLowerCase();

		return property;
	},
	( element ) => {
		const isLink = element[ 0 ].name === 'link';
		return element.attr( isLink ? 'href' : 'content' );
	}
) );

/**
 * Scrapes EPrints data given Cheerio loaded html object
 *
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}         BBPromise for EPrints metadata
 */
exports.parseEprints = BBPromise.method( ( chtml ) => exports.parseBase(
	chtml,
	[ 'meta' ],
	'No EPrints metadata found in page',
	( element ) => {
		const nameAttr = element.attr( 'name' );
		const content = element.attr( 'content' );

		// If the element isn't an EPrints property or content is missing, skip it
		if ( !nameAttr || !content || nameAttr.slice( 0, 8 ).toLowerCase() !== 'eprints.' ) {
			return;
		}

		let property = nameAttr.slice( Math.max( 0, nameAttr.lastIndexOf( '.' ) + 1 ) );

		// Lowercase property
		property = property.toLowerCase();
		return property;
	},
	( element ) => element.attr( 'content' )
).then( ( results ) => {
	if ( results.type ) {
		results.type = results.type.toLowerCase(); // Standardise 'type' field to lowercase
	}
	return results;
} ) );

/**
 * Scrapes general metadata terms given Cheerio loaded html object
 *
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}         BBPromise for general metadata
 */
exports.parseGeneral = BBPromise.method( ( chtml ) => {
	const clutteredMeta = {
		appleTouchIcons: chtml( 'link[rel=apple-touch-icon i]' ).map( ( i, e ) => ( {
			href: e.attribs.href,
			sizes: e.attribs.sizes
		} ) ).get(), // apple-touch-icon <link rel="apple-touch-icon" href="" sizes="">
		icons: chtml( 'link[rel="shortcut icon" i], link[rel="icon" i]' ).map( ( i, e ) => ( {
			href: e.attribs.href,
			sizes: e.attribs.sizes,
			type: e.attribs.type
		} ) ).get(), // icon <link rel="icon" href="" sizes="" type="">
		author: chtml( 'meta[name=author i]' ).first().attr( 'content' ), // author <meta name="author" content="">
		authorlink: chtml( 'link[rel=author i]' ).first().attr( 'href' ), // author link <link rel="author" href="">
		canonical: chtml( 'link[rel=canonical i]' ).first().attr( 'href' ), // canonical link <link rel="canonical" href="">
		description: chtml( 'meta[name=description i]' ).attr( 'content' ), // meta description <meta name ="description" content="">
		publisher: chtml( 'link[rel=publisher i]' ).first().attr( 'href' ), // publisher link <link rel="publisher" href="">
		robots: chtml( 'meta[name=robots i]' ).first().attr( 'content' ), // robots <meta name ="robots" content="">
		shortlink: chtml( 'link[rel=shortlink i]' ).first().attr( 'href' ), // short link <link rel="shortlink" href="">
		title: chtml( 'title' ).first().text(), // title tag <title>
		lang: chtml( 'html' ).first().attr( 'lang' ) || chtml( 'html' ).first().attr( 'xml:lang' ), // lang <html lang=""> or <html xml:lang="">
		dir: chtml( 'html' ).first().attr( 'dir' ) // dir <html dir="">
	};

	// Copy key-value pairs with defined values to meta
	const meta = {};
	let value;
	let notEmpty = false;
	Object.keys( clutteredMeta ).forEach( ( key ) => {
		notEmpty = false;
		value = clutteredMeta[ key ];
		let innerValue;
		if ( value && typeof value === 'object' ) {
			let i;
			for ( i = 0; i < Object.keys( value ).length; i++ ) {
				const definedValue = {};
				// eslint-disable-next-line no-loop-func
				Object.keys( value[ i ] ).forEach( ( objectProperty ) => {
					innerValue = value[ i ][ objectProperty ];
					if ( innerValue ) {
						definedValue[ objectProperty ] = innerValue;
						notEmpty = true;
					}
				} );
				value[ i ] = definedValue;
			}
		} else {
			notEmpty = true;
		}
		if ( value && notEmpty ) { // Only add if has value
			meta[ key ] = value;
		}
	} );

	// Reject promise if meta is empty
	if ( Object.keys( meta ).length === 0 ) {
		throw new Error( 'No general metadata found in page' );
	}

	// Resolve on meta
	return meta;
} );

/**
 * Scrapes Highwire Press metadata given html object
 *
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}   promise of highwire press metadata object
 */
exports.parseHighwirePress = BBPromise.method( ( chtml ) => exports.parseBase(
	chtml,
	[ 'meta' ],
	'No Highwire Press metadata found in page',
	( element ) => {
		const nameAttr = element.attr( 'name' );
		const content = element.attr( 'content' );

		// If the element isn't a Highwire Press property, skip it
		if ( !nameAttr || !content || ( nameAttr.slice( 0, 9 ).toLowerCase() !== 'citation_' ) ) {
			return;
		}

		return nameAttr.slice( Math.max( 0, nameAttr.indexOf( '_' ) + 1 ) ).toLowerCase();
	},
	( element ) => element.attr( 'content' )
) );

/**
 * Returns JSON-LD provided by page given HTML object
 *
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}   BBPromise for JSON-LD
 */
exports.parseJsonLd = BBPromise.method( ( chtml ) => {
	const json = [];
	const jsonLd = chtml( 'script[type="application/ld+json"]' );

	jsonLd.each( function () {
		let contents;
		try {
			contents = JSON.parse( this.children[ 0 ].data );
		} catch ( e ) {
			// Fail silently, just in case there are valid tags
			return;
		}
		if ( contents ) {
			json.push( contents );
		} else {
			return;
		}
	} );

	if ( json.length === 0 ) {
		throw new Error( 'No JSON-LD valid script tags present on page' );
	}

	return json.length > 1 ? json : json[ 0 ];
} );

/**
 * Scrapes OpenGraph data given html object
 *
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}         promise of open graph metadata object
 */
exports.parseOpenGraph = BBPromise.method( ( chtml ) => {
	let property;
	let node;
	const meta = {};
	const metaTags = chtml( 'meta' );
	const namespace = [ 'og', 'fb' ];
	const subProperty = {
		image: 'url',
		video: 'url',
		audio: 'url'
	};
	const roots = {}; // Object to store roots of different type i.e. image, audio
	let subProp; // Current subproperty of interest
	const reason = new Error( 'No openGraph metadata found in page' );

	if ( !metaTags || metaTags.length === 0 ) {
		throw reason;
	}

	metaTags.each( function () {
		const element = chtml( this );
		let propertyValue = element.attr( 'property' );
		const content = element.attr( 'content' );

		if ( !propertyValue || !content ) {
			return;
		} else {
			propertyValue = propertyValue.toLowerCase().split( ':' );
		}

		// If the property isn't in namespace, exit
		if ( !namespace.includes( propertyValue[ 0 ] ) ) {
			return;
		}

		if ( propertyValue.length === 2 ) {
			property = propertyValue[ 1 ]; // Set property to value after namespace
			if ( property in subProperty ) { // If has valid subproperty
				node = {};
				node[ subProperty[ property ] ] = content;
				roots[ property ] = node;
			} else {
				node = content;
			}
			// If the property already exists, make the array of contents
			if ( meta[ property ] ) {
				if ( meta[ property ] instanceof Array ) {
					meta[ property ].push( node );
				} else {
					meta[ property ] = [ meta[ property ], node ];
				}
			} else {
				meta[ property ] = node;
			}
		} else if ( propertyValue.length === 3 ) { // Property part of a vertical
			// i.e. image, audio - as properties, not values, these should be lower case
			subProp = propertyValue[ 1 ].toLowerCase();
			// i.e. height, width - as properties, not values, these should be lower case
			property = propertyValue[ 2 ].toLowerCase();
			// If root for subproperty exists, and there isn't already a property
			// called that in there already i.e. height, add property and content.
			if ( roots[ subProp ] && !roots[ subProp ][ property ] ) {
				// As properties, not values, these should be lower case
				roots[ subProp ][ property ] = content.toLowerCase();
			}
		} else {
			return; // Discard values with length <2 and >3 as invalid
		}

		// Check for "type" property and add to namespace if so
		// If any of these type occur in order before the type attribute is defined,
		// they'll be skipped; spec requires they be placed below type definition.
		// For nested types (e.g. video.movie) the OG protocol uses the super type
		// (e.g. movie) as the new namespace.
		if ( property === 'type' ) {
			namespace.push( content.split( '.' )[ 0 ].toLowerCase() ); // Add the type to the acceptable namespace list - as a property, should be lower case
		}
	} );
	if ( Object.keys( meta ).length === 0 ) {
		throw reason;
	}
	if ( meta.type ) {
		// Make type case insensitive as this may be used programmatically
		meta.type = meta.type.toLowerCase();
	}
	return meta;
} );

/**
 * Scrapes schema.org microdata given Cheerio loaded html object
 *
 * @param  {Object}  chtml Cheerio object with html loaded
 * @return {Object}        promise of schema.org microdata object
 */
exports.parseSchemaOrgMicrodata = BBPromise.method( ( chtml ) => {
	if ( !chtml ) {
		throw new Error( 'Undefined argument' );
	}

	const meta = microdata.toJson( chtml.html() );
	if ( !meta || !meta.items || !meta.items[ 0 ] ) {
		throw new Error( 'No schema.org metadata found in page' );
	}
	return meta;
} );

/**
 * Scrapes twitter microdata given Cheerio html object
 *
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}   promise of twitter metadata object
 */
exports.parseTwitter = BBPromise.method( ( chtml ) => {
	if ( !chtml ) {
		throw new Error( 'Undefined argument' );
	}

	const meta = {};
	const metaTags = chtml( 'meta' );

	// These properties can either be strings or objects
	const dualStateSubProperties = {
		image: 'url',
		player: 'url',
		creator: '@username'
	};

	metaTags.each( function () {
		const element = chtml( this );
		let name = element.attr( 'name' );

		let property;
		const content = element.attr( 'content' );
		let node;

		// Exit if not a twitter tag or content is missing
		if ( !name || !content ) {
			return;
		} else {
			name = name.toLowerCase().split( ':' );
			property = name[ 1 ];
		}

		// Exit if tag not twitter metadata
		if ( name[ 0 ] !== 'twitter' ) {
			return;
		}

		// Handle nested properties
		if ( name.length > 2 ) {
			const subProperty = name[ 2 ];

			// Upgrade the property to an object if it needs to be
			if ( property in dualStateSubProperties && !( meta[ property ] instanceof Object ) ) {
				node = {};
				node[ dualStateSubProperties[ property ] ] = meta[ property ];
				// Clear out the existing string as we just placed it into our new node
				meta[ property ] = [];
			} else {
				// Either create a new node or ammend the existing one
				node = meta[ property ] ? meta[ property ] : {};
			}

			// Differentiate betweeen twice and thrice nested properties
			// Not the prettiest solution, but twitter metadata guidelines are fairly strict,
			// so it's not nessesary to anticipate strange data.
			if ( name.length === 3 ) {
				node[ subProperty ] = content;
			} else if ( name.length === 4 ) {
				// Solve twitter:player:stream:content_type where stream needs to be an obj
				if ( subProperty.toLowerCase() === 'stream' ) {
					node[ subProperty ] = { url: node[ subProperty ] };
				} else {
					// Either create a new subnode or amend the existing one
					node[ subProperty ] = node[ subProperty ] ? node[ subProperty ] : {};
				}
				node[ subProperty ][ name[ 3 ] ] = content;
			} else {
				// Something is malformed, so exit
				return;
			}
		} else {
			node = content;
		}

		// Create array if property exists and is not a nested object
		if ( meta[ property ] && !( meta[ property ] instanceof Object ) ) {
			if ( meta[ property ] instanceof Array ) {
				meta[ property ].push( node );
			} else {
				meta[ property ] = [ meta[ property ], node ];
			}
		} else {
			meta[ property ] = node;
		}
	} );

	if ( Object.keys( meta ).length === 0 ) {
		throw new Error( 'No twitter metadata found on this page' );
	}

	return meta;
} );

/**
 * Scrapes prism metadata given Cheerio html object
 *
 * @param  {Object}   chtml html Cheerio object
 * @return {Object}   promise of prism metadata object
 */
exports.parsePrism = BBPromise.method( ( chtml ) => {
	if ( !chtml ) {
		throw new Error( 'Undefined argument' );
	}

	const meta = {};
	const metaTags = chtml( 'meta' );

	const reason = new Error( 'No PRISM metadata found in page' );

	if ( !metaTags || metaTags.length === 0 ) {
		throw reason;
	}

	metaTags.each( function () {
		const element = chtml( this );
		let name = element.attr( 'name' );
		const content = element.attr( 'content' );

		if ( !name || !content ) {
			return;
		} else {
			name = name.split( '.' );
		}

		// If the name does not have the prism prefix, exit
		if ( name[ 0 ].toLowerCase() !== 'prism' ) {
			return;
		}

		// Set the name to the value after the prefix
		name = name[ 1 ];
		// Set the first character to lower case
		name = name.charAt( 0 ).toLowerCase() + name.slice( 1 );

		// If the name already exists, make an array of the contents
		if ( meta[ name ] ) {
			if ( meta[ name ] instanceof Array ) {
				meta[ name ].push( content );
			} else {
				meta[ name ] = [ meta[ name ], content ];
			}
		} else {
			meta[ name ] = content;
		}
	} );

	if ( Object.keys( meta ).length === 0 ) {
		throw reason;
	}

	return meta;
} );

/**
 * Global exportable list of scraping promises with string keys
 *
 * @type {Object}
 */
exports.metadataFunctions = {
	bePress: exports.parseBEPress,
	coins: exports.parseCOinS,
	dublinCore: exports.parseDublinCore,
	eprints: exports.parseEprints,
	general: exports.parseGeneral,
	highwirePress: exports.parseHighwirePress,
	jsonLd: exports.parseJsonLd,
	openGraph: exports.parseOpenGraph,
	schemaOrg: exports.parseSchemaOrgMicrodata,
	twitter: exports.parseTwitter,
	prism: exports.parsePrism
};
