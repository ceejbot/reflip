var
	assert = require('assert'),
	fs     = require('fs'),
	P      = require('bluebird'),
	path   = require('path')
	;

var FileAdapter = module.exports = function FileAdapter(opts)
{
	assert(opts && (typeof opts == 'object'), 'you must pass an options object to the RedisAdapter constructor');
	assert(opts.filename, 'you must specify a file to read from');

	this.filename = opts.filename;
};

FileAdapter.prototype.filname = null;

FileAdapter.prototype.refresh = function refresh()
{
	// read file
	// parse json; reject promise if bad
	// resolve promise with the parsed json
};


