/*
 * a unit-test for normalization.
 * 
 * @author Vasily Konovalov
 * @since 2015-03
 */
var fs = require('fs');
var should = require('should');
var _ = require("underscore")._;
var limdu = require("limdu");
var ftrs = limdu.features;

var regexpNormalizer = ftrs.RegexpNormalizer(
		JSON.parse(fs.readFileSync(__dirname+'/../knowledgeresources/BiuNormalizations.json')));

describe('normalization test', function() {
	it('salary', function(){
		regexpNormalizer("60,000").should.equal("60000")
		regexpNormalizer("90,000").should.equal("90000")
		regexpNormalizer("80,000").should.equal("80000")
		regexpNormalizer("I am earning 90,000").should.equal("I am earning 90000")
		regexpNormalizer("60K").should.equal("60000")
		regexpNormalizer("60k").should.equal("60000")
		regexpNormalizer("60.000").should.equal("60000")
		regexpNormalizer("60,000").should.equal("60000")
		regexpNormalizer(" 60 ").should.equal(" 60000 ")
		regexpNormalizer("10 %").should.equal("10%")
	})
})



