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
	
	it('mutation', function() {	
		modes.mutation("I will accept your salary", "I accept", ['will']).should.be.true
		modes.mutation("I accept your salary", "I accept", ['will']).should.be.false
		modes.mutation("I accept your salary but i will reject", "I accept", ['will']).should.be.false
	})

	it('intent_dep', function() {	

		var train = {'keyphrase':['I go to school'], 'intent': 'Offer'}
		var test = {'filtered':'usually I go to school by foot'}
		modes.intent_dep(test, train)['reason'].should.be.equal("clean equality")

		var train = {'keyphrase':['I accept'], 'intent': 'Accept'}
		var test = {'filtered':'I will accept this offer'}
		modes.intent_dep(test, train)['reason'].should.be.equal("modality of accept")

		var train = {'keyphrase':['I will accept'], 'intent':'Accept'}
		var test = {'filtered':'I might accept this offer'}
		modes.intent_dep(test, train)['classes'][0].should.be.equal("Accept")
	})

	it('predicate', function() {	
		var train = 'I go to school'
		var test = 'usually I go to school by foot'
		modes.predicate(test, train, train)
	})




})

