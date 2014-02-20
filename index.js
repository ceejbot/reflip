var
	_            = require('lodash'),
	assert       = require('assert'),
	events       = require('events'),
	http         = require('http'),
	P            = require('bluebird'),
	util         = require('util'),
	Feature      = require('./lib/feature'),
	FileAdapter  = require('./lib/file'),
	RedisAdapter = require('./lib/redis')
	;

var Reflip = module.exports = function(opts)
{
	events.EventEmitter.call(this);

	assert(opts, 'You must pass options to the Reflip constructor');
	assert(opts.storage || opts.features, 'You must pass either storage options or a pre-set feature object');

	if (opts.features) this.features = opts.features;
	if (_.has(opts, 'default')) this.default = opts.default;
	if (opts.httpcode) this.httpcode = opts.httpcode;
	this.exportName = opts.exportName || 'check';

	this.features = {};

	if (opts.storage)
	{
		var self = this;
		this.storage = opts.storage;
		this.storage.on('update', function(f) { self.update(f); });
		this.refresh();
	}
};
util.inherits(Reflip, events.EventEmitter);

Reflip.FileAdapter  = FileAdapter;
Reflip.RedisAdapter = RedisAdapter;
Reflip.Feature      = Feature;

Reflip.prototype.storage  = null;
Reflip.prototype.features = null;
Reflip.prototype.default  = false;
Reflip.prototype.httpcode = 404;

Reflip.prototype.flip = function()
{
	var self = this;

	function middleware(request, response, next)
	{
		var features = _.transform(self.features, function(features, v, k)
		{
			features[k] = v.check(request);
		}, {});

		request[self.exportName] = function(name)
		{
			if (name == null)
				return features;

			if (!_.has(features, name))
				return self.default;

			return features[name];
		};
		next();
	}

	return middleware;
};

Reflip.prototype.gate = function gate(name, failureHandler)
{
	var self = this;
	assert(name && name.length, 'You must provide a feature name');

	var isCustomResponse = typeof failureHandler == 'function';
	function gateFunc(request, response, next)
	{
		if (request.check(name))
			return next();

		if (!isCustomResponse)
			return response.send(self.httpcode, http.STATUS_CODES[self.httpcode]);

		failureHandler(request, response);
	}

	return gateFunc;
};

Reflip.prototype.register = function register(name, func)
{
	var feat;
	if (name instanceof Feature)
		feat = name;
	else
	{
		feat = new Feature(
		{
			name: name,
			type: 'custom',
			enabled: true,
			checker: func
		});
	}

	this.features[feat.name] = feat;
};

Reflip.prototype.refresh = function refresh()
{
	if (!this.storage)
		return P.cast(true);

	var self = this;
	this.emit('refreshing');
	self.storage.refresh();
};

Reflip.prototype.update = function update(features)
{
	var self = this;

	_.each(features, function(def)
	{
		var feature = new Feature(def);
		self.features[feature.name] = feature;
	});
	self.emit('ready');
};

Reflip.prototype.shutdown = function shutdown()
{
	if (this.storage)
		this.storage.close();
};
