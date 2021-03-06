/*global describe:true, it:true, before:true, after:true */
'use strict';

var
	_      = require('lodash'),
	demand = require('must'),
	fs     = require('fs'),
	path   = require('path'),
	redis  = require('redis'),
	sinon  = require('sinon')
	;

var Reflip = require('../index');
var testfile = path.join(__dirname, './mocks/features.json');
var testFeatures = require('./mocks/features.json');

var file2 = path.join(__dirname, './mocks/f2.json');

describe('Reflip', function()
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

	describe('with file adapter', function()
	{
		it('can be constructed', function(done)
		{
			var flipper = new Reflip(
			{
				storage: new Reflip.FileAdapter({ filename: testfile }),
			});

			flipper.must.be.an.object();
			done();
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
		it('can be constructed', function(done)
		{
			var flipper = new Reflip({ storage: new Reflip.RedisAdapter({ client: redis.createClient() }), });
			flipper.must.be.an.object();
			done();
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

		before(function(done)
		{
			flipper = new Reflip({ features: {} });
			done();
		});

		it('is a function on the reflip object', function(done)
		{
			flipper.register.must.be.a.function();
			done();
		});

		it('adds a feature to the reflip object', function(done)
		{
			function check() { return true; }
			flipper.register('aardwolf', check);

			flipper.features.must.have.property('aardwolf');
			flipper.features.aardwolf.type.must.equal('custom');
			flipper.features.aardwolf.checker.must.equal(check);
			done();
		});

		it('the checker function is called when the registered feature is checked', function(done)
		{
			var check = sinon.stub();
			check.returns(true);
			flipper.register('anaconda', check);

			var feature = flipper.features.anaconda;
			feature.check().must.equal(true);
			check.called.must.be.truthy();
			done();
		});

		it('can accept a Feature object argument', function(done)
		{
			var feature = new Reflip.Feature(
			{
				name:    'armadillo',
				type:    'boolean',
				enabled: true
			});

			flipper.register(feature);
			flipper.features.must.have.property('armadillo');
			done();
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

		it('returns a function', function(done)
		{
			var middleware = flipper.flip();
			middleware.must.be.a.function();
			done();
		});

		it('behaves like connect middleware', function(done)
		{
			var middleware = flipper.flip();
			var request = {}, response = {}, next = sinon.spy();
			middleware(request, response, next);

			next.calledOnce.must.be.truthy();
			done();
		});

		it('decorates its first argument with a check function', function(done)
		{
			var middleware = flipper.flip();
			var request = {}, response = {};
			middleware(request, response, function()
			{
				request.must.have.property('check');
				request.check.must.be.a.function();

				var features = request.check();
				features.must.be.an.object();
				features.alpacas.must.be.truthy();
				features.aardvarks.must.be.true();
				features.archaeopteryx.must.equal(request.check('archaeopteryx'));
				request.check('agouti').must.equal(flipper.default);
				done();
			});
		});

		it('obeys its `exportName` option', function(done)
		{
			var f2 = new Reflip({ exportName: 'wobble', storage: new Reflip.FileAdapter({ filename: testfile }), });

			var middleware = f2.flip();
			var request = {}, response = {};
			middleware(request, response, function()
			{
				request.must.have.property('wobble');
				request.wobble.must.be.a.function();
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

		it('requires a feature name argument', function(done)
		{
			function shouldThrow()
			{
				return flipper.gate();
			}

			shouldThrow.must.throw();
			done();
		});

		it('returns a function', function(done)
		{
				var gater = flipper.gate('archaeopteryx');
				gater.must.be.a.function();
				done();
		});

		it('invokes its callback with no argument if the feature is enabled', function(done)
		{
			var req = {}, res = {};
			req.check = sinon.stub();
			req.check.returns(true);

			var next = sinon.spy();

			var gater = flipper.gate('aardvarks');
			gater(req, res, next);

			req.check.calledOnce.must.be.truthy();
			next.calledOnce.must.be.truthy();
			done();
		});

		it('invokes its callback with reflip.httpcode if the feature is disabled', function(done)
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
			done();
		});

		it('allows specifying a custom failure handler if the feature is disabled', function(done)
		{
			var req = {}, res = {};
			req.check = sinon.stub();
			req.check.returns(false);
			res.json = sinon.spy();
			var next = sinon.spy();

			var gater = flipper.gate('aardwolf', function(req, res)
			{
				res.json(403,
				{
					code: 'ForbiddenError',
					message: 'This feature is unavailable.'
				});
			});
			gater(req, res, next);

			req.check.calledOnce.must.be.truthy();
			res.json.calledOnce.must.be.truthy();
			next.calledOnce.must.be.false();

			var arglist = res.json.args[0];
			arglist.length.must.equal(2);
			arglist[0].must.equal(403);
			arglist[1].must.eql(
			{
				code: 'ForbiddenError',
				message: 'This feature is unavailable.'
			});
			done();
		});

		it('updates its responses', function(done)
		{
			var features2 =
			{
				"features":
				[
					{
						"name": "aardvarks",
						"type": "boolean",
						"enabled": false
					},
					{
						"name": "archaeopteryx",
						"type": "boolean",
						"enabled": true
					},
					{
						"name": "aardwolf",
						"type": "metered",
						"enabled": true,
						"chance": 25
					}
				]
			};

			fs.writeFile(file2, JSON.stringify(testFeatures), function(err)
			{
				demand(err).not.exist();

				var flipper = new Reflip({ storage: new Reflip.FileAdapter({ filename: file2 }), });
				var count = 0;

				function blort()
				{
					var bar = flipper.features.aardvarks.check({});

					if (count === 0)
					{
						fs.writeFileSync(file2, JSON.stringify(features2));
						count++;
					}

					if (bar === false)
					{
						flipper.shutdown();
						flipper.removeListener('ready', blort);
						done();
					}
				}

				flipper.on('ready', blort);
			});
		});

		after(function(done)
		{
			flipper.shutdown();
			done();
		});
	});

	after(function(done)
	{
		fs.unlink(file2, function(err)
		{
			demand(err).not.exist();

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
});
