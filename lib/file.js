var
	assert = require('assert'),
	events = require('events'),
	fs     = require('fs'),
	P      = require('bluebird'),
	path   = require('path'),
	util   = require('util')
	;

var FileAdapter = module.exports = function FileAdapter(opts)
{
	assert(opts && (typeof opts == 'object'), 'you must pass an options object to the RedisAdapter constructor');
	assert(opts.filename, 'you must specify a file to read from');

	this.filename = opts.filename;

	var self = this;
	this.watcher = fs.watch(this.filename, function(event, fname)
	{
		self.refresh();
	});
};
util.inherits(FileAdapter, events.EventEmitter);

FileAdapter.prototype.filename = null;

FileAdapter.prototype.refresh = function refresh()
{
	var self = this;

	this.read()
	.then(function(response)
	{
		self.emit('update', response.features);
	},
	function(err)
	{
		self.emit('error', err);
	});
};

FileAdapter.prototype.read = function read()
{
	var deferred = P.pending();

	fs.readFile(this.filename, function(err, data)
	{
		if (err) return deferred.reject(err);
		parseJSON(data, function(err, value)
		{
			if (err) return deferred.reject(err);
			deferred.fulfill(value);
		});
	});

	return deferred.promise;
};

FileAdapter.prototype.close = function close()
{
	this.watcher.close();
};

function parseJSON(data, callback)
{
	var value;
	try
	{
		value = JSON.parse(data);
	}
	catch (err)
	{
		return callback(err);
	}
	callback(null, value);
}
