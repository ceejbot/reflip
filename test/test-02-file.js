/*global describe:true, it:true, before:true, after:true */

var
	chai   = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
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
		assert.throws(shouldThrow);
	});

	it('requires options.filename', function()
	{
		function shouldThrow()
		{
			var obj = new FileAdapter({});
		}
		assert.throws(shouldThrow);
	});

	it('can be constructed', function()
	{
		var obj = new FileAdapter({ filename: testfile })
		assert.ok(obj);
	});

	it('refresh returns a promise', function()
	{
		var obj = new FileAdapter({ filename: testfile })
		var result = obj.refresh();
		assert.ok(result);
		assert.isObject(result);
		assert.property(result, 'then');
		assert.isFunction(result.then);
	});

	it('refresh re-reads the file', function(done)
	{
		var obj = new FileAdapter({ filename: testfile })

		obj.refresh()
		.then(function(reply)
		{
			assert.ok(reply);
			assert.isObject(reply);
			assert.property(reply, 'ttl');
			assert.equal(reply.ttl, 60000);
			assert.property(reply, 'features');
			assert.isArray(reply.features);

			done();
		}, function(err)
		{
			assert.ok(!err);
		}).done();

	});
});
