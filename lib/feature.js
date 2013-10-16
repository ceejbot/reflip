var
	_      = require('lodash'),
	assert = require('assert')
	;

var Feature = module.exports = function Feature(opts)
{
	assert(opts && (typeof opts == 'object'), 'you must pass an options object to the Feature constructor');

	this.name    = opts.name;
	this.type    = opts.type;
	this.enabled = opts.enabled;
	this.chance  = opts.hasOwnProperty('chance') ? opts.chance : 100;
	this.checker = opts.checker;
	this.groups  = opts.groups;
};

Feature.prototype.name    = 'aardvarks';  // name
Feature.prototype.type    = 'boolean';    // one of boolean, grouped, metered, custom
Feature.prototype.enabled = false;        // on/off by default
Feature.prototype.chance  = 100;          // percentage; consulted if this is a metered feature
Feature.prototype.checker = null;         // user-supplied check function
Feature.prototype.groups  = null;         // used for a/b testing stuff

Feature.prototype.check = function check(request)
{
	if (!this.enabled)
		return false;

	switch (this.type)
	{
	case 'custom':
		return this.checker(request);

	case 'boolean':
		return true;

	case 'metered':
		return (Math.random() * 100 > this.chance);

	case 'grouped':
		return this.checkGroup(request);
	}
};

Feature.prototype.checkGroup = function checkGroup(request)
{
	var idx = _.random(0, this.groups.length - 1);
	return this.groups[idx];

	// TODO store it in the session?
};

