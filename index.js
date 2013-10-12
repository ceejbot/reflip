var
	_ = require('lodash'),
	P = require('bluebird')
	;


var Reflip = module.exports = function(opts)
{

};

Reflip.prototype.options      = {};
Reflip.prototype.refreshTimer = null;
Reflip.prototype.storage      = null;
Reflip.prototype.features     = {};
Reflip.prototype.default      = false;

Reflip.prototype.check = function check(name)
{
	var self = this;
	var defEnabled = this.default;

	function middleware(request, response, next)
	{
		// TODO
		next();
	}

	return middleware;
};

Reflip.prototype.makeKey = function makeKey(base)
{
	return this.namespace + base;
};

Reflip.prototype.refresh = function refresh()
{
	// call refresh on adapter
	// promise will resolve to an object containing ttl & dict of features
	// update ttl if necessary
	// set timeout for next refresh
	// store results; build features
};



