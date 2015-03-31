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

	it('simpledistance', function() {	
		modes.simpledistance("i want", "want").should.equal(0.8)
		modes.simpledistance("i propose a", "i propose a").should.equal(0)
	})
	
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

		var train = {'keyphrase':['I offer'], 'intent':'Offer'}
		var test = {'filtered':'I no offer you'}
		modes.intent_dep(test, train)['classes'][0].should.be.equal("Reject")

		// can be either Offer or Accept 'I not accpept' or 'I not offer'
		var train = {'keyphrase':['I not accept'], 'intent':'Reject'}
		var test = {'filtered':'I accept'}
		modes.intent_dep(test, train)['classes'].length.should.equal(0)


		var train = {'keyphrase':['I can not accept'], 'intent':'Reject'}
		var test = {'filtered':'I accept'}
		modes.intent_dep(test, train)['classes'].length.should.equal(0)

		var train = {'keyphrase':['I will accept'], 'intent':'Offer'}
		var test = {'filtered':'I accept'}
		// console.log(modes.intent_dep(test, train))

		var train = {'keyphrase':['i agree'], 'intent':'Offer'}
		var test = {'filtered':'i can agree to no agreement on'}
		console.log(modes.intent_dep(test, train))
	})

	it('onlyOffer', function() {
		modes.onlyOffer({'input_normalized': "<ATTRIBUTE> <VALUE>"}).should.be.true	
	})
	
	it('predicate', function() {	
		var train = {'keyphrase': 'i offer', 'filtered': 'i offer', 'intent': 'Offer'}
		var test = {'filtered': 'extend by foot'}
		_.isEqual(modes.predicate(test, train)['explanation']['keyphrases'], [ 'i offer', 'i offer', 'i extend', 'extend' ]).should.be.true

		var train = {'keyphrase': 'i offer', 'filtered': 'i offer', 'intent': 'Offer'}
		var test = {'filtered': 'i demand by foot'}
		_.isEqual(modes.predicate(test, train)['explanation']['keyphrases'], [ 'i offer', 'offer', 'the submission', 'demand', 'demand' ]).should.be.true

		var train = {'keyphrase': 'i offer', 'filtered': 'i offer', 'intent': 'Offer'}
		var test = {'filtered': 'i require by foot'}
		// _.isEqual(modes.predicate(test, train)['explanation']['keyphrases'], [ 'i offer','i offer','i give','i ask','i require','i require' ]).should.be.true
     	// score: 3 
	
		var train = {'keyphrase': 'hello', 'filtered': 'hello', 'intent': 'Greet'}
		var test = {'filtered': 'hi'}

		// console.log(modes.predicate(test, train))
		// _.isEqual(modes.predicate(test, train)['explanation']['keyphrases'], [ 'i offer', 'offer', 'the submission', 'demand', 'demand' ]).should.be.true
		

	})

	it('ppdbexpansion', function() {	
		console.log(modes.ppdbexpansion('school'))
	})

	it('skipexpansion', function() {	
		_.isEqual(modes.skipexpansion("i propose a"),[ 'i propose a', 'i propose', 'propose a', 'propose' ]).should.be.true
		_.isEqual(modes.skipexpansion("would"),[]).should.be.true
		_.isEqual(modes.skipexpansion("i can not get"),['i can not get']).should.be.true
		_.isEqual(modes.skipexpansion("i do not want"),['i do not want']).should.be.true
	})


})

