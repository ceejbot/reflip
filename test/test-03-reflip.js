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


	describe('with file adapter', function()
	{
		it('can be constructed', function()
		{
			var adapter = new Reflip.FileAdapter({ filename: testfile });
			var flipper = new Reflip(
			{
				storage: adapter,
			});



		});



	});


});
