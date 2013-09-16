/**
 * a unit-test for utils related to Homer classifier
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var Hierarchy = require('../Hierarchy');


describe('splitJson', function() {
	it('works for strings (depth 1)', function() {
		Hierarchy.splitJson("Offer").should.eql(["Offer"]);
	});
	it('works for simple objects (depth 2)', function() {
		Hierarchy.splitJson({Offer: "Salary"}).should.eql(["Offer", "Salary"]);
	});
	it('works for complex objects (depth 3)', function() {
		Hierarchy.splitJson({Offer: {Salary: "20000"}}).should.eql(["Offer", "Salary", "20000"]);
	});
});

describe('joinJson', function() {
	it('works for strings (depth 1)', function() {
		Hierarchy.joinJson(["Offer"]).should.eql("Offer");
	});
	it('works for simple objects (depth 2)', function() {
		Hierarchy.joinJson(["Offer", "Salary"]).should.eql(JSON.stringify({Offer: "Salary"}));
	});
	it('works for complex objects (depth 3)', function() {
		Hierarchy.joinJson(["Offer", "Salary", "20000"]).should.eql(JSON.stringify({Offer: {Salary: "20000"}}));
	});
});

describe('splitJsonFeatures', function() {
	it('works for strings (depth 1)', function() {
		Hierarchy.splitJsonFeatures("Offer").should.eql({"Offer":1});
	});
	it('works for simple objects (depth 2)', function() {
		Hierarchy.splitJsonFeatures({Offer: "Salary"}).should.eql({"Offer":1, "Salary":1});
	});
	it('works for complex objects (depth 3)', function() {
		Hierarchy.splitJsonFeatures({Offer: {Salary: "20000"}}).should.eql({"Offer":1, "Salary":1, "20000":1});
	});
});
