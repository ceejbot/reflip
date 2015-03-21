/*global describe:true, it:true, before:true, after:true */
'use strict';

var
    _      = require('lodash'),
    demand = require('must'),
    fs     = require('fs'),
    path   = require('path')
	;

var FileAdapter = require('../lib/file');
var testfile = path.join(__dirname, './mocks/features.json');
var file2 = path.join(__dirname, './mocks/f2.json');
var features1 = require(testfile);

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

describe('FileAdapter', function()
{
	it('requires an options object', function(done)
	{
		function shouldThrow()
		{
			var obj = new FileAdapter();
		}
		shouldThrow.must.throw();
		done();
	});

	it('requires options.filename', function(done)
	{
		function shouldThrow()
		{
			var obj = new FileAdapter({});
		}
		shouldThrow.must.throw();
		done();
	});

	it('can be constructed', function(done)
	{
		var obj = new FileAdapter({ filename: testfile });
		obj.must.be.truthy();
		done();
	});

	it('read() returns a promise', function(done)
	{
		var obj = new FileAdapter({ filename: testfile });
		var result = obj.read();
		result.must.be.truthy();
		result.must.be.an.object();
		result.must.have.property('then');
		result.then.must.be.a.function();
		done();
	});

	it('read() re-reads the file', function(done)
	{
		var obj = new FileAdapter({ filename: testfile });

		obj.read()
		.then(function(reply)
		{
			reply.must.be.truthy();
			reply.must.be.an.object();
			reply.must.have.property('ttl');
			reply.ttl.must.equal(60000);
			reply.must.have.property('features');
			reply.features.must.be.an.array();

			done();
		}, function(err)
		{
			demand(err).be.undefined();
		}).done();
	});

	it('observes file changes', function(done)
	{
		fs.writeFile(file2, JSON.stringify(features1), function(err)
		{
			demand(err).not.exist();

			var obj = new FileAdapter({ filename: file2 });
			obj.must.have.property('watcher');
			obj.once('update', function onUpdate(features)
			{
				features.must.be.an.array();
				features.length.must.equal(3);
				obj.close();
				done();
			});

			obj.read()
			.then(function(data)
			{
				fs.writeFileSync(file2, JSON.stringify(features2));
			});
		});
	});

	after(function(done)
	{
		fs.unlink(file2, function(err)
		{
			done();
		});
	});
});
