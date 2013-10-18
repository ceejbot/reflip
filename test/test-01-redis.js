/*global describe:true, it:true, before:true, after:true */

var
	_      = require('lodash'),
	chai   = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
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
		assert.throws(shouldThrow);
	});

	it('requires client or host/port in options', function()
	{
		function shouldThrow() { var r = new RedisAdapter({}); }
		assert.throws(shouldThrow);
	});

	it('respects the host/port options', function()
	{
		var r = new RedisAdapter({ host: 'localhost', port: 6379 });
		assert.property(r, 'client');
		assert.isObject(r.client);
	});

	it('respects the client option', function()
	{
		var client = redis.createClient();
		var r = new RedisAdapter({ client: client });
		assert.property(r, 'client');
		assert.isObject(r.client);
		assert.equal(r.client, client);
		client.end();
	});

	it('respects the namespace option', function()
	{
		var client = redis.createClient();
		var r = new RedisAdapter({ client: client, namespace: 'foozles:' });

		var t = r.makeKey('features');
		assert.ok(t.match(/^foozles:/));

		client.end();
	});

	it('refresh returns a promise', function()
	{
		var client = redis.createClient();
		var r = new RedisAdapter({ client: client, namespace: 'foozles:' });

		var result = r.refresh();
		assert.ok(result);
		assert.isObject(result);
		assert.property(result, 'then');
		assert.isFunction(result.then);
	});

	it('refresh reads the hashes', function(done)
	{
		var client = redis.createClient();
		var r = new RedisAdapter({ client: client });

		r.refresh()
		.then(function(result)
		{
			assert.ok(result, 'did not get a result back from refresh()');
			assert.isObject(result, 'refresh() did not resolve to an object');
			assert.property(result, 'ttl', 'refresh() result did not include a ttl');
			assert.equal(result.ttl, testFeatures.ttl, 'ttl was not the expected value');

			assert.property(result, 'features');
			assert.isArray(result.features, 'result.features not an array');
			assert.equal(result.features.length, testFeatures.features.length);

			done();
		}, function(err)
		{
			should.not.exist(err);
		}).done();
	});
});
