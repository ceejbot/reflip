var
	_            = require('lodash'),
	assert       = require('assert'),
	http         = require('http'),
	P            = require('bluebird'),
	Feature      = require('./feature'),
	FileAdapter  = require('./file'),
	RedisAdapter = require('./redis'),
	;

var Reflip = module.exports = function(opts)
{
	assert(opts, 'You must pass options to the Reflip constructor');
	assert(opts.storage || opts.features, 'You must pass either storage options or a pre-set feature object');

	this.options = opts;

	if (opts.storage) this.storage = opts.self.storage;
	if (opts.features) this.features = opts.features;
	if (opts.hasOwnProperty('default')) this.default = opts.default;
	if (opts.httpcode) this.httpcode = opts.httpcode;
	if (opts.ttl) this.ttl = opts.ttl;
};

Reflip.FileAdapter  = FileAdapter;
Reflip.RedisAdapter = RedisAdapter;
Reflip.Feature      = Feature;

Reflip.prototype.options      = {};
Reflip.prototype.ttl          = 5 * 60 * 1000; // 5 minutes
Reflip.prototype.refreshTimer = null;
Reflip.prototype.storage      = null;
Reflip.prototype.features     = {};
Reflip.prototype.default      = false;
Reflip.prototype.httpcode     = 404;

Reflip.prototype.flip = function()
{
	var self = this;
	var defEnabled = this.default;

	function middleware(request, response, next)
	{
		request.features = {};
		_.each(self.features, function(v, k)
		{
			request.features[k] = v.check(request);
		});

		request.check = function(name)
		{
			if (!request.features[name])
				return self.default;

			return request.features[name];
		};
		next();
	}

	return middleware;

};

Reflip.prototype.gate = function gate(name)
{
	var self = this;

	function gateFunc(request, response, next)
	{
		if (request.check(name))
			return next();

		var error = new Error(http.STATUS_CODES[self.httpcode]);
		error.status = self.httpcode;
		return next(error);
	}

	return gateFunc;
};

Reflip.prototype.makeKey = function makeKey(base)
{
	return this.namespace + base;
};

Reflip.prototype.refresh = function refresh()
{
	if (!this.storage)
		return P();

	var self = this;

	self.storage.refresh()
	.then(function(response)
	{
		if (response.hasOwnProperty('ttl'))
			self.ttl = response.ttl;

		if (self.ttl)
			self.refreshTimer = setInterval(self.refresh.bind(self), self.ttl);
		else
			self.refreshTimer = null;

		self.features = {};
		_.each(response.features, function(def)
		{
			var feature = new Feature(def);
			self.features[feature.name] = feature;
		})
	})
	.done();
};
