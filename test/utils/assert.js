'use strict';

var assert = require('assert');

function isDeepEqual(result, expected, message) {

	try {
		if (typeof expected === 'string') {
			assert.ok(result === expected || (new RegExp(expected).test(result)), message);
		} else {
			assert.deepEqual(result, expected, message);
		}
		return true;
	} catch (e) {
		return false;
	}

}

function deepEqual(result, expected, message) {

	try {
		if (typeof expected === 'string') {
			assert.ok(result === expected || (new RegExp(expected).test(result)));
		} else {
			assert.deepEqual(result, expected, message);
		}
	} catch (e) {
		console.log('Expected:\n' + JSON.stringify(expected, null, 2));
		console.log('Result:\n' + JSON.stringify(result, null, 2));
		throw e;
	}

}


function notDeepEqual(result, expected, message) {

	try {
		assert.notDeepEqual(result, expected, message);
	} catch (e) {
		console.log('Not expected:\n' + JSON.stringify(expected, null, 2));
		console.log('Result:\n' + JSON.stringify(result, null, 2));
		throw e;
	}

}


function fails(promise, onRejected) {

	var failed = false;
	if (!onRejected) {
		onRejected = function() {};
	}

	function trackFailure(e) {
		failed = true;
		return onRejected(e);
	}

	function check() {
		if (!failed) {
			throw new Error('expected error was not thrown');
		}
	}

	return promise.catch(trackFailure).then(check);

}

module.exports.ok             = assert.ok;
module.exports.fails          = fails;
module.exports.deepEqual      = deepEqual;
module.exports.isDeepEqual    = isDeepEqual;
module.exports.notDeepEqual   = notDeepEqual;


