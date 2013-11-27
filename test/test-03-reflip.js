/*global describe:true, it:true, before:true, after:true */

var
	_      = require('lodash'),
	demand = require('must'),
	path   = require('path'),
	redis  = require('redis'),
	sinon  = require('sinon')
	;

var Reflip = require('../index');
var testfile = path.join(__dirname, './mocks/features.json');
var testFeatures = require('./mocks/features.json');

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

			flipper.must.be.an.object();
		});

		it('calls refresh on its adapter', function(done)
		{
			var flipper = new Reflip({ storage: new Reflip.FileAdapter({ filename: testfile }), });
			flipper.on('ready', function()
			{
				flipper.must.have.property('storage');
				flipper.must.have.property('features');
				flipper.features.must.be.an.object();
				Object.keys(flipper.features).length.must.equal(4);
				done();
			});
		});
	});

	describe('with redis adapter', function()
	{
		it('can be constructed', function()
		{
			var flipper = new Reflip({ storage: new Reflip.RedisAdapter({ client: redis.createClient() }), });
			flipper.must.be.an.object();
		});

		it('calls refresh on its adapter', function(done)
		{
			var flipper = new Reflip({ storage: new Reflip.RedisAdapter({ client: redis.createClient() }), });
			flipper.on('ready', function()
			{
				flipper.must.have.property('storage');
				flipper.storage.must.have.property('refreshTimer');
				flipper.storage.refreshTimer.must.be.an.object();
				flipper.storage.ttl.must.equal(60000);
				flipper.features.must.be.an.object();
				Object.keys(flipper.features).length.must.equal(4);
				done();
			});
		});
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
			flipper.register.must.be.a.function();
		});

		it('adds a feature to the reflip object', function()
		{
			function check() { return true; }
			flipper.register('aardwolf', check);

			flipper.features.must.have.property('aardwolf');
			flipper.features.aardwolf.type.must.equal('custom');
			flipper.features.aardwolf.checker.must.equal(check);
		});

		it('the checker function is called when the registered feature is checked', function()
		{
			var check = sinon.stub();
			check.returns(true);
			flipper.register('anaconda', check);

			var feature = flipper.features.anaconda;
			feature.check().must.equal(true);
			check.called.must.be.truthy();
		});

		it('can accept a Feature object argument', function()
		{
			var feature = new Reflip.Feature(
			{
				name:    'armadillo',
				type:    'boolean',
				enabled: true
			});

			flipper.register(feature);
			flipper.features.must.have.property('armadillo');
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
				middleware.must.be.a.function();
		});

		it('behaves like connect middleware', function()
		{
				var middleware = flipper.flip();
				var request = {}, response = {}, next = sinon.spy();
				middleware(request, response, next);

				next.calledOnce.must.be.truthy();
		});

		it('decorates its first argument with a check function', function(done)
		{
				var middleware = flipper.flip();
				var request = {}, response = {};
				middleware(request, response, function()
				{
					request.check.must.be.a.function();
					request.features.must.be.an.object();
					request.features.alpacas.must.be.truthy();
					request.features.aardvarks.must.be.true();
					request.features.archaeopteryx.must.equal(request.check('archaeopteryx'));
					request.check('agouti').must.equal(flipper.default);
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

			shouldThrow.must.throw();
		});

		it('returns a function', function()
		{
				var gater = flipper.gate('archaeopteryx');
				gater.must.be.a.function();
		});

		it('invokes its callback with no argument if the feature is enabled', function()
		{
			var req = {}, res = {};
			req.check = sinon.stub();
			req.check.returns(true);

			var next = sinon.spy();

			var gater = flipper.gate('aardvarks');
			gater(req, res, next);

			req.check.calledOnce.must.be.truthy();
			next.calledOnce.must.be.truthy();
		});

		it('invokes its callback with reflip.httpcode if the feature is disabled', function()
		{
			var req = {}, res = {};
			req.check = sinon.stub();
			req.check.returns(false);
			res.send = sinon.spy();
			var next = sinon.spy();

			var gater = flipper.gate('archaeopteryx');
			gater(req, res, next);

			req.check.calledOnce.must.be.truthy();
			res.send.calledOnce.must.be.truthy();
			next.calledOnce.must.be.false();

			var arglist = res.send.args[0];
			arglist.length.must.equal(2);
			arglist[0].must.equal(404);
			arglist[1].must.be.a.string();
			arglist[1].must.equal('Not Found');
		});

	});

	after(function(done)
	{
		var r = redis.createClient();
		var chain = r.multi();

		chain.del('reflip:ttl');
		chain.del('reflip:features');
		_.each(Object.keys(testFeatures.features), function(k)
		{
			chain.del('reflip:' + k);
		});
		chain.exec(function(err, replies)
		{
			done();
		});
	});

});
