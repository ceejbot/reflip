/*global describe:true, it:true, before:true, after:true */

var
	chai   = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	path   = require('path')
	;

var Reflip = require('../index');
var testfile = path.join(__dirname, './mocks/features.json');

describe('Reflip', function()
{
	it('tests exist');

	describe('flip()', function()
	{
		it('tests exist');
		it('returns a function');
	});

	describe('gate()', function()
	{
		it('tests exist');
		it('returns a function');
	});


	describe('with file adapter', function()
	{
		it('can be constructed', function()
		{
			var flipper = new Reflip(
			{
				storage: new Reflip.FileAdapter({ filename: testfile }),
			});

			assert.isObject(flipper);

		});



	});

	describe('with redis adapter', function()
	{
		it('tests exist');
	});



});
