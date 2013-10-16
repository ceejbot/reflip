/*global describe:true, it:true, before:true, after:true */

var
	chai   = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	path   = require('path'),
	sinon  = require('sinon')
	;

var Reflip = require('../index');
var testfile = path.join(__dirname, './mocks/features.json');

describe('Reflip', function()
{
	describe('with file adapter', function()
	{
		it('can be constructed', function()
		{
			var flipper = new Reflip(
			{
				storage: new Reflip.FileAdapter({ filename: testfile }),
			});

			assert.isObject(flipper);
		});

		it('calls refresh on its adapter', function(done)
		{
			var flipper = new Reflip({ storage: new Reflip.FileAdapter({ filename: testfile }), });
			flipper.on('ready', function()
			{
				assert.isObject(flipper.refreshTimer);
				assert.equal(flipper.ttl, 60000);
				assert.isObject(flipper.features);
				assert.equal(Object.keys(flipper.features).length, 4);
				done();
			});
		});
	});

	describe('with redis adapter', function()
	{
		it('tests exist');
	});

	describe('register()', function()
	{
		var flipper;

		before(function()
		{
			flipper = new Reflip({ features: {} });
		});

		it('is a function on the reflip object', function()
		{
			assert.isFunction(flipper.register);
		});

		it('adds a feature to the reflip object', function()
		{
			function check() { return true; }
			flipper.register('anaconda', check);

			assert.property(flipper.features, 'anaconda');
			assert.equal(flipper.features.anaconda.type, 'custom');
			assert.equal(flipper.features.anaconda.checker, check);
		});

		it('the checker function is called when the registered feature is checked', function()
		{
			var check = sinon.stub();
			check.returns(true);
			flipper.register('anaconda', check);

			var feature = flipper.features.anaconda;
			assert.equal(feature.check(), true);
			assert.ok(check.called);
		});

	});

	describe('flip()', function()
	{
		var flipper;

		before(function(done)
		{
			flipper = new Reflip({ storage: new Reflip.FileAdapter({ filename: testfile }), });
			flipper.on('ready', done);
		});

		it('returns a function', function()
		{
				var middleware = flipper.flip();
				assert.isFunction(middleware);
		});

		it('behaves like connect middleware', function()
		{
				var middleware = flipper.flip();
				var request = {}, response = {}, next = sinon.spy();
				middleware(request, response, next);

				assert.ok(next.calledOnce);
		});

		it('decorates its first argument with a check function', function(done)
		{
				var middleware = flipper.flip();
				var request = {}, response = {};
				middleware(request, response, function()
				{
					assert.isFunction(request.check, 'check is not a function!');
					assert.isObject(request.features, 'request.features not set');
					assert.ok(request.features.alpacas, 'alpacas are not enabled');
					assert.isTrue(request.features.aardvarks, 'anteaters are not enabled');
					assert.equal(request.features.archaeopteryx, request.check('archaeopteryx'), 'feature cache and feature check() are returning different values');
					done();
				});
		});
	});

	describe('gate()', function()
	{
		var flipper;

		before(function(done)
		{
			flipper = new Reflip({ storage: new Reflip.FileAdapter({ filename: testfile }), });
			flipper.on('ready', done);
		});

		it('requires a feature name argument', function()
		{
			function shouldThrow()
			{
				return flipper.gate();
			}

			assert.throws(shouldThrow);
		});

		it('returns a function', function()
		{
				var gater = flipper.gate('archaeopteryx');
				assert.isFunction(gater);
		});

		it('invokes its callback with no argument if the feature is enabled', function()
		{
			var req = {}, res = {};
			req.check = sinon.stub();
			req.check.returns(true);

			var next = sinon.spy();

			var gater = flipper.gate('aardvarks');
			gater(req, res, next);

			assert.ok(req.check.calledOnce, 'check() not called');
			assert.ok(next.calledOnce, 'next() not called');
		});

		it('invokes its callback with reflip.httpcode if the feature is disabled', function()
		{
			var req = {}, res = {};
			req.check = sinon.stub();
			req.check.returns(false);

			var next = sinon.spy();

			var gater = flipper.gate('archaeopteryx');
			gater(req, res, next);

			assert.ok(req.check.calledOnce, 'check() not called');
			assert.ok(next.calledOnce, 'next() not called');

			var arglist = next.args[0];
			assert.equal(arglist.length, 1);
			var arg = arglist[0];
			assert.property(arg, 'status', 'error has no status code!');
			assert.equal(arg.status, 404);
			assert.property(arg, 'message', 'error has no message!');
			assert.equal(arg.message, 'Not Found');
		});

	});

});
