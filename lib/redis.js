var
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
	console.log(this.namespace + base);
	return this.namespace + base;
};

RedisAdapter.prototype.refresh = function refresh()
{
	var self = this,
	    deferred = P.pending(),
	    result =
	    {
	    	features: []
	    };

	var chain = self.client.multi();
	chain.smembers(self.makeKey('features'));
	chain.get(self.makeKey('ttl'));

	chain.exec(function(err, replies)
	{
		console.log(replies);

		if (err) return deferred.reject(err);


		// read set of features from redis
		// for each feature, read hash setting its fields

		deferred.fulfill(result);
	});

	return deferred.promise;
};

