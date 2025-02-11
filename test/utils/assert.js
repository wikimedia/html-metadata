'use strict';

const { use } = require( 'chai' );

module.exports = use( ( _chai ) => {
	const { assert } = _chai;

	assert.fails = ( promise ) => {

		let failed = false;

		function trackFailure( e ) {
			failed = true;
			return e;
		}

		function check() {
			if ( !failed ) {
				throw new Error( 'expected error was not thrown' );
			}
		}
		return promise.catch( trackFailure ).then( check );

	};

} ).assert;
