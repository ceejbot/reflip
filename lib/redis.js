var
	assert = require('assert'),
	P      = require('bluebird'),
	redis  = require('redis')
	;

var RedisAdapter = module.exports = function RedisAdapter(opts)
{
	assert(opts && (typeof opts == 'object'), 'you must pass an options object to the RedisAdapter constructor');

	if (opts.client)
		this.client = opts.client;
	else
		this.client = redis.createClient(opts.port, opts.host);

	if (opts.namespace)
		this.namespace = opts.namespace
};

RedisAdapter.prototype.client = null;
RedisAdapter.prototype.namespace = 'reflip:';

RedisAdapter.prototype.refresh = function refresh()
{
	// generate promise; return it
	// read set of features from redis
	// for each feature, read hash setting its fields
	// resolve promise with an object

	var self = this;
	var features = [];

	self.client.smembers(self.makeKey('features'), function(err, reply)
	{
		features = reply;
	});


};

