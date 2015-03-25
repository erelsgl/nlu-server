/**
 * a unit-test for PrecisionRecall unit
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var utils = require('./utils');
var _ = require('underscore');
var modes = require('./modes.js')

describe('Util test', function() {

	it('intersection', function() {	

		var train = 'I go to school'
		var test = 'usually I go to school by foot'
		modes.strict_keyphrase(test, train).should.be.true

		var train = 'I will go to school'
		var test = 'usually I go to school by foot'
		modes.strict_keyphrase(test, train).should.be.false

		var train = 'I will go to school'
		var test = 'I might go to school by foot'
		modes.strict_keyphrase(test, train).should.be.true
	})

	it('predicate', function() {	
		var train = 'I go to school'
		var test = 'usually I go to school by foot'
		modes.predicate(test, train, train)
	})




})

