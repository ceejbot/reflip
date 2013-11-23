/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	path   = require('path')
	;

var FileAdapter = require('../lib/file');
var testfile = path.join(__dirname, './mocks/features.json');

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

	it('refresh returns a promise', function()
	{
		var obj = new FileAdapter({ filename: testfile });
		var result = obj.refresh();
		result.must.be.truthy();
		result.must.be.an.object();
		result.must.have.property('then');
		result.then.must.be.a.function();
	});

	it('refresh re-reads the file', function(done)
	{
		var obj = new FileAdapter({ filename: testfile });

		obj.refresh()
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
});
