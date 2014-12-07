/**
 * a unit-test for PrecisionRecall unit
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var utils = require('./utils');
var _ = require('underscore');
var sync = require('synchronize')
var Fiber = require('fibers');

var seeds = { 
			"Offer": [{
        		'I offer': [ 'i offer', 'i suggest', 'provide']
        		}],
        	"Accept":[{
        		'accept':[ 'i offer']
        		}]
			}


function makeid(len)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < len; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

describe('Util test', function() {

	it('takeIntent', function() {
		var eval = {'Offer':[[1,'1'],[2,'1']],
					'Accept':[[4,'1'],[1,'1']],
					'Reject':[[6,'1'],[3,'1']],
				}
		var output = utils.takeIntent(eval)
		output.should.be.equal('Reject')
	})

	it('replacefeatures', function() {
		var features = {'dog':1, 'cat': 1, 'shark':1, 'salomon':1}
		var seeds = {'animals':[['dog','NN',5], ['cat','NN',6]], 
					'fish': [['shark','NN',7]]}

		var output = utils.replacefeatures(features, seeds, function(a){return 1})
		_.isEqual(output, { animals: 0.4082482904638631, fish: 0.3779644730092272, salomon: 0 }).should.be.true
	})

	it('buildvector', function() {
		var featuremap = ['rabbit', 'cat', 'fish', 'horse']
		var features = {'dog':2, 'cat':3, 'horse':4}
		var output = utils.buildvector(featuremap, features)
		_.isEqual(output, [ 0, 3, 0, 4 ]).should.be.true
	})

	it('cosine', function() {
		var v1 = [2, 1, 0, 2, 0, 1, 1, 1]
		var v2 = [2, 1, 1, 1, 1, 0, 1, 1]
		var cosine = utils.cosine(v1,v2)
		cosine.should.equal(0.8215838362577491)
	})
	
	it('indexOflist', function() {
		var key = 'rabbit'
		var value = ['geek', ['dog','1',4], 'geek1', ['cat', '2', 5]]
		var feature = 'geek1'
		var output = utils.indexOflist(key, value, feature)
		_.isEqual(output, [ [ 'rabbit', 1 ] ]).should.be.true

		var feature = 'cat'
		var output = utils.indexOflist(key, value, feature)
		_.isEqual(output,  [ [ 'rabbit', 5 ] ]).should.be.true
	})

	it('seekfeature', function() {	
		var feature = 'here'
		var seeds = { 'here': ['there',['everywhere','q',3]]}
		var output = utils.seekfeature(feature, seeds)
		_.isEqual(output, [['here',1]]).should.be.true

		feature = 'here'
		seeds = { 'yellow': [['here','s',1],'everywhere'],
					'submarine': ['one', ['here','d',5]]}
		var output = utils.seekfeature(feature, seeds)
		_.isEqual(output, [ ['yellow',1], ['submarine',5] ]).should.be.true

		feature = 'dog'
		seeds = {'animals':[['dog','NN',5], ['cat','NN',6]], 
				'fish': [['shark','NN',7]]}
		output = utils.seekfeature(feature, seeds)
		_.isEqual(output, [['animals',5]]).should.be.true
	})

	it('only intents', function() {
		_.isEqual(utils.onlyIntents(["{\"Accept\":\"previous\"}"]), ['Accept']).should.be.true
	})

	it('retrieve intent', function(done) {	
		utils.retrieveIntent("my boss and i offer you a salary", seeds, function(err, result){
    		var keys = _.map(result, function(num, key){ return Object.keys(num)[0] });
			_.isEqual(['Offer', 'Accept'], keys).should.be.true
			done()
		})
	})

	it('retrieve intent', function(done) {
		utils.retrieveIntent("my boss and i provide you a salary", seeds, function(err, result){
    		var keys = _.map(result, function(num, key){ return Object.keys(num)[0] });
			_.isEqual(keys, ['Offer']).should.be.true
			done()
		})
	})

	it('retrieve intent', function(done) {
		utils.retrieveIntent("my boss and i give you a salary", seeds, function(err, result){
			result.length.should.be.equal.zero
			done()
		})
	})

	it('subst', function() {
		var sublist = utils.subst("rub")
		// console.log(sublist)
		// console.log()
		// process.exit(0)
	})

	it('tagger1', function(done) {
		utils.getcontent("I accept withour leased car",function(err, result){
			// _.isEqual(result, [ 'i think you', 'i think is good', [ 'think' ], [ 'think' ], 1 ]).should.be.true
			done()
		})
	})

	it('comparison455', function(done) {
		utils.compare(["i need a", "i need"], function(err, result){
			result[4].should.equal.one
			done()
		})
	})

	it('comparison4', function(done) {
		utils.compare(["i think you", "i think is good"], function(err, result){
			_.isEqual(result, [ 'i think you', 'i think is good', [ 'think' ], [ 'think' ], 1 ]).should.be.true
			done()
		})
	})

	it('comparison44', function(done) {
		utils.compare(["will accept", "instead, will you accept"], function(err, result){
			_.isEqual(result, [ 'will accept','instead, will you accept',[ 'accept' ], [ 'accept' ], 1 ]).should.be.true
			done()
		})
	})

	it('comparison444', function(done) {
		utils.compare(["we agreed", "do we agree on"], function(err, result){
			_.isEqual(result, [ 'we agreed', 'do we agree on',[ 'agree' ],[ 'agree' ],1 ]).should.be.true
			done()
		})
	})

	it('comparison1', function(done) {
		utils.compare(["the delivery", "delivering"], function(err, result){
			result[4].should.equal.one
			// process.exit(0)
			// _.isEqual(result, [ 'can not give', 'give', [ 'not', 'give' ], [ 'give' ], 0.75 ]).should.be.true
			done()
		})
	})
	

	it('comparison', function(done) {
		utils.compare(["I\'m willing to offer you the following", "offer"], function(err, result){
			result[4].should.equal.one
			// _.isEqual(result, [ 'can not give', 'give', [ 'not', 'give' ], [ 'give' ], 0.75 ]).should.be.true
			done()
		})
	})
	

	it('negative comparison', function(done) {
		utils.compare(["can not give", "give"], function(err, result){
			_.isEqual(result, [ 'can not give', 'give', [ 'not', 'give' ], [ 'give' ], 0.75 ]).should.be.true
			done()
		})
	})
	
	it('correctly compare 1', function(done) {
		utils.compare(["actually, i had in mind offering you", "i offer"], function(err, result){
			result[4].should.be.equal.one
			done()
		})
	})

	it('correctly compare 1', function(done) {
		utils.compare(["i am prepared to offer", "i offer"], function(err, result){
			result[4].should.be.equal.one
			done()
		})
	})
	
	it('correctly compare 1', function(done) {
		utils.compare(["i would be willing to give you", "i give"], function(err, result){
			result[4].should.be.equal.one
			done()
		})
	})

	it('correctly compare 1', function(done) {
		utils.compare(["i want to give you", "i give"], function(err, result){
			result[4].should.be.equal.one
			done()
		})
	})

	it('check the clusteration', function(done) {
		utils.clusteration(['has proposed','are proposing'], function(err, results){
			_.isEqual([ [ 'are proposing', 'has proposed' ] ], results).should.be.true
			done()
		})
	})
	
	it('check the clusteration', function(done) {
		utils.clusteration(['make available','made available'], function(err, results){
			_.isEqual([ [ 'made available', 'make available' ] ], results).should.be.true
			done()
		})
	})

	it('correctly compare 2', function(done) {
		utils.compare(["has proposed", "have proposed"], function(err, result){
			// console.log(result)
			done()
		})
	})	
 
 	it('check the clusteration', function(done) {
		utils.clusteration(['provided','to provide','will provide','are provided','can provide','is provided','a presentation', 'the presentation', 'to provide', 'will provide', 'are provided', 'can provide', 'provided'], function(err, results){
			_.isEqual([ [ 'to provide',
    'will provide','are provided','can provide','is provided',
    'to provide','will provide','are provided','can provide',
    'provided','provided' ],[ 'the presentation', 'a presentation' ] ], results).should.be.true
			done()
		})
	})

	it('correctly calculates precision, recall, etc.', function() {
		utils.stat({'TP':4,'FP':2,'FN':0})['Recall'].should.equal(1)
		utils.stat({'TP':4,'FP':2,'FN':0})['F1'].should.equal(0.8)
		utils.stat({'TP':4,'FP':2,'FN':0})['Precision'].should.equal(0.6666666666666666)
	});
	
 	it('correctly clasify actual and expected clean', function(done) {
		// sync.fiber(function(){
		var f = Fiber(function() {
		    var fiber = Fiber.current;

			var result = utils.cleanlisteval(['offer','suggest','offered','suppose','car'],['offer','suggest','suppose','supposed','invite','invited', 'I am offering', 'ofer'])
			// console.log(result['stats'])
			_.isEqual(result['stats'], { TP: 4, FP: 1, FN: 3 }).should.be.true
			
			var result = utils.cleanlisteval(['offer','suggest','offered','suppose','car'],['offer','suggest','suppose','supposed'])
			_.isEqual(result['stats'], { TP: 4, FP: 1, FN: 0 }).should.be.true
			// console.log(result['stats'])


			var result = utils.cleanlisteval(['offer','suggest','offered','suppose'],['offer','suggest','suppose','supposed'])
			_.isEqual(result['stats'], { TP: 4, FP: 0, FN: 0 }).should.be.true
			// console.log(result['stats'])


			var result = utils.cleanlisteval(['offer','suggest','suppose'],['offer','suggest','suppose'])
			_.isEqual(result['stats'], { TP: 3, FP: 0, FN: 0 }).should.be.true
			// console.log(result['stats'])
			

			done()
		})

		f.run()
		// })
	})

	// it('check readredis', function() {
	// 	sync.fiber(function(){
	// 	var len = _.random(5,20)
	// 	var str = 'mocha_'+makeid(len)
	// 	var pos = sync.await(utils.readpos(str, sync.defer()))
	// 	_.isEqual(pos,null).should.be.true
	// 	})	
	// })

	// it('check writereadis', function() {
	// 	sync.fiber(function(){
	// 	var len = _.random(5,20)
	// 	var str = 'mocha_'+makeid(len)
	// 	var pos = sync.await(utils.readpos(str, sync.defer()))
	// 	_.isEqual(pos,null).should.be.true
	// 	sync.await(utils.writepos(str, "DONE", sync.defer()))
	// 	var pos = sync.await(utils.readpos(str, sync.defer()))
	// 	_.isEqual(pos, "DONE").should.be.true
	// 	console.log(pos)
	// 	})	
	// 	console.log("out")
	// })

	// it('pos tagger is on', function(done1) {
	// 	utils.retrievepos("I only want", function(err, results){
 	// 		_.isEqual(results, "I_PRP only_RB want_VBP").should.be.true
	// 		done1();
	// 	})
	// })

	it('correctly get pos tags', function(done) {
		utils.onlycontent("i home", function(err, results){
			_.isEqual(results, [ 'home' ]).should.be.true
			done()		
		})
	})

	// it('correctly get content', function() {
	// 	_.isEqual(utils.cleanposoutput("we_PRP agree_VBP on_IN\n"), [ 'agree' ]).should.be.true
	// })

	it('correctly compare 1', function(done) {
		utils.compare(["i offer", "i provide"], function(err, result){
			_.isEqual(result, ['i offer','i provide',['offer'],['provide'],0]).should.be.true
			done()
		})
	})

	it('correctly compare 2', function(done) {
		utils.compare(["to provide", "you be a"], function(err, result){
			_.isEqual(result, [ 'to provide', 'you be a', [ 'provide' ], [ 'be' ], 0 ]).should.be.true
			done()
		})
	})	
	
	it('onlycontent should return list of strings', function(done) {
		utils.onlycontent("offer", function(err, result){
			_.isEqual(result, ['offer']).should.be.true
			done()
		})
	})	

	it('check depth', function(done) {
		var f = Fiber(function() {
		    var fiber = Fiber.current;
		    utils.cleanredis("offer", function(err, resp) {
		        fiber.run(resp);
		    });
		    var str = Fiber.yield()
		    done()
		});

		f.run();
	})	

	// it('correctly compare 3', function(done) {
	// 	utils.compare(["to provide", "i need"], function(err, result){
	// 		console.log(result)
	// 		_.isEqual(result, [ 'to provide', 'you be a', [ 'provide' ], [ 'be' ], 0 ]).should.be.true
	// 		done()
	// 	})
	// })		

	// it('correctly clasify actual and expected 1', function(done) {
	// 	utils.listeval(['offer','suggest','suppose'],['offer','suggest','suppose'], function(err, result)
	// 	{
	// 		_.isEqual(result['stats'], { TP: 3, FP: 0, FN: 0 }).should.be.true
	// 		done()
	// 	})
	// })

	// it('correctly clasify actual and expected 2', function(done) {
	// 	utils.listeval(['offer','suggest','offered','suppose'],['offer','suggest','suppose','supposed'], function(err, result)
	// 	{
	// 		_.isEqual(result['stats'], { TP: 4, FP: 0, FN: 0 }).should.be.true
	// 		done()
	// 	})
	// })

	// it('correctly clasify actual and expected 3', function(done) {
	// 	utils.listeval(['offer','suggest','offered','suppose','car'],['offer','suggest','suppose','supposed'], function(err, result)
	// 	{
	// 		console.log(result)
	// 		process.exit(0)
	// 		_.isEqual(result['stats'], { TP: 4, FP: 1, FN: 0 }).should.be.true
	// 		done()
	// 	})
	// })

	// it('correctly clasify actual and expected 4', function(done) {
	// 	utils.listeval(['offer','suggest','offered','suppose','car'],['offer','suggest','suppose','supposed','invite','invited', 'I am offering', 'ofer'], function(err, result)
	// 	{
	// 		_.isEqual(result['stats'], { TP: 4, FP: 1, FN: 3 }).should.be.true
	// 		done()
	// 	})
	// })

})

