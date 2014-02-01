var
	_      = require('lodash'),
	assert = require('assert'),
	events = require('events'),
	P      = require('bluebird'),
	redis  = require('redis'),
	util   = require('util')
	;

var RedisAdapter = module.exports = function RedisAdapter(opts)
{
	assert(opts && (typeof opts == 'object'), 'you must pass an options object to the RedisAdapter constructor');
	assert(opts.client || (opts.host && opts.port), 'you must pass either a redis client or options sufficient to create one');

	if (opts.ttl) this.ttl = opts.ttl;
	if (opts.namespace) this.namespace = opts.namespace;

	if (opts.client)
		this.client = opts.client;
	else
		this.client = redis.createClient(opts.port, opts.host);

};
util.inherits(RedisAdapter, events.EventEmitter);

RedisAdapter.prototype.client       = null;
RedisAdapter.prototype.namespace    = 'reflip:';
RedisAdapter.prototype.ttl          = 5 * 60 * 1000; // 5 minutes
RedisAdapter.prototype.refreshTimer = null;

RedisAdapter.prototype.makeKey = function makeKey(base)
{
	return this.namespace + base;
};

RedisAdapter.prototype.refresh = function refresh()
{
	var self = this;

	self.read()
	.then(function(response)
	{
		self.emit('update', response.features);
	}, function(err)
	{
		console.log(err);
	});
};

RedisAdapter.prototype.read = function read()
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

		if (!_.isNull(replies[1]))
			result.ttl = parseInt(replies[1], 10);
		else
			result.ttl = 0;
		self.ttl = result.ttl;

		if (self.ttl)
			self.refreshTimer = setInterval(self.refresh.bind(self), self.ttl);
		else
			self.refreshTimer = null;

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

RedisAdapter.prototype.close = function close()
{
	this.client.close();
	this.client = null;
	if (this.refreshTimer)
	{
		clearInterval(this.refreshTimer);
		this.refreshTimer = null;
	}
};
