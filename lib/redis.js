var
	_      = require('lodash'),
	assert = require('assert'),
	P      = require('bluebird'),
	redis  = require('redis')
	;

var RedisAdapter = module.exports = function RedisAdapter(opts)
{
	assert(opts && (typeof opts == 'object'), 'you must pass an options object to the RedisAdapter constructor');
	assert(opts.client || (opts.host && opts.port), 'you must pass either a redis client or options sufficient to create one');

	if (opts.client)
		this.client = opts.client;
	else
		this.client = redis.createClient(opts.port, opts.host);

	if (opts.namespace)
		this.namespace = opts.namespace;
};

RedisAdapter.prototype.client = null;
RedisAdapter.prototype.namespace = 'reflip:';

RedisAdapter.prototype.makeKey = function makeKey(base)
{
	return this.namespace + base;
};

RedisAdapter.prototype.refresh = function refresh()
{
	var self = this,
		deferred = P.pending(),
		result = { features: [] };

	var chain = self.client.multi();
	chain.smembers(self.makeKey('features'));
	chain.get(self.makeKey('ttl'));

	chain.exec(function(err, replies)
	{
		if (err) return deferred.reject(err);

		result.ttl = parseInt(replies[1], 10);

		var chain2 = self.client.multi();
		_.each(replies[0], function(f)
		{
			chain2.hgetall(self.makeKey(f));
		});

		chain2.exec(function(err, hashes)
		{
			result.features = hashes;
			deferred.fulfill(result);
		});
	});

	return deferred.promise;
};
