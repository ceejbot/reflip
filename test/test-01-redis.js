/*global describe:true, it:true, before:true, after:true */

var
	_      = require('lodash'),
	demand = require('must'),
	redis  = require('redis'),
	fs     = require('fs')
	;

var RedisAdapter = require('../lib/redis');

var testFeatures = require('./mocks/features.json');

describe('RedisAdapter', function()
{
	before(function(done)
	{
		var r = redis.createClient();
		var chain = r.multi();

		var features = [];
		_.each(testFeatures.features, function(item)
		{
			features.push(item.name);
			chain.hmset('reflip:' + item.name, item);
		});
		chain.set('reflip:ttl', testFeatures.ttl);
		chain.sadd('reflip:features', features);

		chain.exec(function(err, replies)
		{
			done();
		});
	});

	it('requires an options object', function()
	{
		function shouldThrow() { var r = new RedisAdapter(); }
		shouldThrow.must.throw();
	});

	it('requires client or host/port in options', function()
	{
		function shouldThrow() { var r = new RedisAdapter({}); }
		shouldThrow.must.throw();
	});

	it('respects the host/port options', function()
	{
		var r = new RedisAdapter({ host: 'localhost', port: 6379 });
		r.must.have.property('client');
		r.client.must.be.an.object();
	});

	it('respects the client option', function()
	{
		var client = redis.createClient();
		var r = new RedisAdapter({ client: client });
		r.must.have.property('client');
		r.client.must.be.an.object();
		r.client.must.equal(client);
		client.end();
	});

	it('respects the namespace option', function()
	{
		var client = redis.createClient();
		var r = new RedisAdapter({ client: client, namespace: 'foozles:' });

		var t = r.makeKey('features');
		t.must.match(/^foozles:/);

		client.end();
	});

	it('read() returns a promise', function()
	{
		var client = redis.createClient();
		var r = new RedisAdapter({ client: client, namespace: 'foozles:' });

		var result = r.read();
		result.must.be.truthy();
		result.must.be.an.object();
		result.must.have.property('then');
		result.then.must.be.a.function();
	});

	it('read() reads the hashes', function(done)
	{
		var client = redis.createClient();
		var r = new RedisAdapter({ client: client });

		r.read()
		.then(function(result)
		{
			result.must.be.truthy();
			result.must.be.an.object();
			result.must.have.property('ttl');
			result.ttl.must.equal(testFeatures.ttl);

			result.must.have.property('features');
			result.features.must.be.an.array();
			result.features.length.must.equal(testFeatures.features.length);

			done();
		}, function(err)
		{
			demand(err).be.undefined();
		}).done();
	});
});
