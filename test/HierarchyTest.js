/**
 * a unit-test for utils related to Homer classifier
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */
var _ = require('underscore')._;
var should = require('should');
var Hierarchy = require('../Hierarchy');
var ftrs = require("limdu/features");

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

describe('splitPartEqually', function() {
	it('should separate labels correctly', function() {
		_.isEqual(Hierarchy.splitPartEqually([{Offer: {Salary: "20000"}}]), [["Offer"], ["Salary"], ["20000"]]).should.equal(true);
		_.isEqual(Hierarchy.splitPartEqually([{Accept: "previous"}]), [["Accept"], [], ["previous"]]).should.equal(true)
		_.isEqual(Hierarchy.splitPartEqually([{Insist: "Salary"}]), [["Insist"], ["Salary"], []]).should.equal(true)	
		_.isEqual(Hierarchy.splitPartEqually([{Insist: "Salary"}, {Accept: "previous"}]), [["Insist", "Accept"], ["Salary"], ["previous"]]);	
	});
})

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
		ftrs.call(Hierarchy.splitJsonFeatures, "Offer").should.eql({"Offer":1});
	});
	it('works for simple objects (depth 2)', function() {
		ftrs.call(Hierarchy.splitJsonFeatures, {Offer: "Salary"}).should.eql({"Offer":1, "Salary":1});
	});
	it('works for complex objects (depth 3)', function() {
		ftrs.call(Hierarchy.splitJsonFeatures, {Offer: {Salary: "20000"}}).should.eql({"Offer":1, "Salary":1, "20000":1});
	});
});
