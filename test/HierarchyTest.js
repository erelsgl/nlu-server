/**
 * a unit-test for utils related to Homer classifier
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var shallowJson = require('../Hierarchy').shallowJson;
var splitJson = require('../Hierarchy').splitJson;
var joinJson = require('../Hierarchy').joinJson;

describe('shallowJson', function() {
	it('works for strings (depth 1)', function() {
		shallowJson("Offer", 1).should.eql("Offer");
		shallowJson("Offer", 2).should.eql("Offer");
		shallowJson("Offer", 3).should.eql("Offer");
	});
	it('works for simple objects (depth 2)', function() {
		shallowJson({Offer: "Salary"}, 1).should.eql("Offer");
		shallowJson({Offer: "Salary"}, 2).should.eql({Offer: "Salary"});
		shallowJson({Offer: "Salary"}, 3).should.eql({Offer: "Salary"});
	});
	it('works for complex objects (depth 3)', function() {
		shallowJson({Offer: {Salary: 20000}}, 1).should.eql("Offer");
		shallowJson({Offer: {Salary: 20000}}, 2).should.eql({Offer: "Salary"});
		shallowJson({Offer: {Salary: 20000}}, 3).should.eql({Offer: {Salary: 20000}});
	});
});


describe('splitJson', function() {
	it('works for strings (depth 1)', function() {
		splitJson("Offer").should.eql(["Offer"]);
	});
	it('works for simple objects (depth 2)', function() {
		splitJson({Offer: "Salary"}).should.eql(["Offer", "Salary"]);
	});
	it('works for complex objects (depth 3)', function() {
		splitJson({Offer: {Salary: "20000"}}).should.eql(["Offer", "Salary", "20000"]);
	});
});

describe('joinJson', function() {
	it('works for strings (depth 1)', function() {
		joinJson(["Offer"]).should.eql("Offer");
	});
	it('works for simple objects (depth 2)', function() {
		joinJson(["Offer", "Salary"]).should.eql({Offer: "Salary"});
	});
	it('works for complex objects (depth 3)', function() {
		joinJson(["Offer", "Salary", "20000"]).should.eql({Offer: {Salary: "20000"}});
	});
});
