/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	fs     = require('fs'),
	path   = require('path')
	;

var FileAdapter = require('../lib/file');
var testfile = path.join(__dirname, './mocks/features.json');
var file2 = path.join(__dirname, './mocks/f2.json');

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
	it('requires an options object', function()
	{
		function shouldThrow()
		{
			var obj = new FileAdapter();
		}
		shouldThrow.must.throw();
	});

	it('requires options.filename', function()
	{
		function shouldThrow()
		{
			var obj = new FileAdapter({});
		}
		shouldThrow.must.throw();
	});

	it('can be constructed', function()
	{
		var obj = new FileAdapter({ filename: testfile });
		obj.must.be.truthy();
	});

	it('read() returns a promise', function()
	{
		var obj = new FileAdapter({ filename: testfile });
		var result = obj.read();
		result.must.be.truthy();
		result.must.be.an.object();
		result.must.have.property('then');
		result.then.must.be.a.function();
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
		var count = 0;

		var obj = new FileAdapter({ filename: file2 });
		obj.must.have.property('watcher');
		obj.on('update', function(features)
		{
			features.must.be.an.array();
			count++;
			if (features.length === 3)
			{
				count.must.equal(2);
				done();
			}
		});

		var ws = fs.createWriteStream(file2);
		var rs = fs.createReadStream(testfile);
		rs.pipe(ws);
		ws.on('finish', function()
		{
			obj.read()
			.then(function(data)
			{
				fs.writeFileSync(file2, JSON.stringify(features2));
			});
		});
	});
});
