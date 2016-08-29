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

		regexpNormalizer("with leased car pension fund 10%").should.equal("with leased car pension fund 10%")

		regexpNormalizer("60000-it").should.equal("60000-it")

		regexpNormalizer("Then, the salary of 60 000").should.equal("Then, the salary of 60000")

		regexpNormalizer("a salary of 0.").should.equal("a salary of 0.")

		regexpNormalizer("60, 000 sounds better").should.equal("60000 sounds better")

		regexpNormalizer("60.000 sounds better").should.equal("60000 sounds better")

		regexpNormalizer("on 10:00?").should.equal("on  10 hours ?")
 
		regexpNormalizer("to put in 10-hours. If").should.equal("to put in 10 hours. If")

		regexpNormalizer("really put on 10:00, if you").should.equal("really put on  10 hours , if you")

		regexpNormalizer("for 60, 000, with").should.equal("for 60000, with")

		regexpNormalizer("red her 60,000, the fastest").should.equal("red her 60000, the fastest")

		regexpNormalizer("it to 60,000, with").should.equal("it to 60000, with")
		
		regexpNormalizer("it to 60 000, with").should.equal("it to 60000, with")

		regexpNormalizer("of pension fun fast").should.equal("of pension fund fast")

		regexpNormalizer("10% \"pensions").should.equal("10% pensions")
		
		regexpNormalizer("and fast-track promotion").should.equal("and fast track promotion")

		regexpNormalizer("I offer 10:00").should.equal("I offer  10 hours ")
		regexpNormalizer("Programmers, 6, 10 hours").should.equal("Programmers, 60000, 10 hours")
		// regexpNormalizer("I offer 90 000").should.equal("I offer 90000")



		regexpNormalizer("programmer, 10:00, 60.000 10%").should.equal("programmer,  10 hours , 60000 10%")
		regexpNormalizer("60.000, 10 hours, 10%").should.equal("60000, 10 hours, 10%")

 

		regexpNormalizer("60, 000").should.equal("60000")
		regexpNormalizer("60. 000").should.equal("60000")
		regexpNormalizer("60 000").should.equal("60000")
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



