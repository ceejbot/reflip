/*global describe:true, it:true, before:true, after:true */

var
	chai   = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	redis  = require('redis')
	;

var RedisAdapter = require('../lib/redis');


describe('RedisAdapter', function()
{
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

	it('refresh returns a promise');

	it('refresh re-reads the hashes');
});
