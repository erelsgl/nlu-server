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
var curves = require('./learning_curves_embed.js');

var seeds = { 
			"Offer": {
        		'I offer': [ 'i offer', 'i suggest', 'provide']
        		},
        	"Accept":{
        		'accept':[ 'i offer']
        		}
			}

var seedsnew = { 
			"Offer": {
        		'I offer': [ {'i offer':['offer']}, {'i suggest':['suggest']}, {'provide':['provide']}]
        		},
        	"Accept":{
        		'accept':[ {'i offer':['offer']}]
        		}
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

	it('filternan', function() {
		_.isEqual(curves.filternan([1,2,'wqd',0,-1]), [ 1, 2, '?', 0, '?' ]).should.be.true
		_.isEqual(curves.filternan(5), 5).should.be.true
		_.isEqual(curves.filternan('a'), '?').should.be.true
		_.isEqual(curves.filternan(-1), '?').should.be.true
		_.isEqual(curves.filternan([1.5,8.9]), [1.5,8.9]).should.be.true
	})
	

	it("generatens", function(done){
		utils.generatengramsasync("I need a money", function(err, response){
			var gold = [ 'money', 'I need', 'need a', 'a money', 'I need a', 'need a money' ]
			_.isEqual(gold, response).should.be.true
			done()
		})
	})
	
	it('loadseeds', function() {
		var turn = [{'intent_core':{'Offer': 'I need a salary'}}]
		var seeds = utils.loadseeds(turn, true)
		var gold = {"Offer": [{"i need a salary": ["need","salary","i need","need a","a salary","i need a","need a salary"]}]}
		_.isEqual(seeds,gold).should.be.true
		})
	
	it('generatengrams', function() {
		var feat = utils.generatengrams("I need a car")
		var gold = [ 'need', 'car', 'I need', 'need a', 'a car', 'I need a', 'need a car'] 
		_.isEqual(feat, gold).should.be.true
	})
	
	it('check pos', function(done) {
		// how_WRB about_RB
		// why_WRB not_RB
		// good_JJ for_IN me_PRP
		// hi_NN
		// yes_RB
		// no_DT
		// i_FW can_MD not_RB agree_VB
		// the_DT answer_NN is_VBZ
		utils.retrievepos("the answer is", function(err, result){
			console.log(result)
			done()
		})
	})

	it('enrichseeds_original', function() {
		var seeds = { 	
						Offer: [ 'our counter proposal is', 'i am offering', ' is what i have' ],
  						Accept: [ 'accepted', 'ok' ] 
  					}
		var output = utils.enrichseeds_original(seeds)

		var gold = {
		    "Offer": {
		        "our counter proposal is": [
		            "our counter proposal is"
		        ],
		        "i am offering": [
		            "i am offering"
		        ],
		        " is what i have": [
		            " is what i have"
		        ]
		    },
		    "Accept": {
		        "accepted": [
		            "accepted"
		        ],
		        "ok": [
		            "ok"
		        ]
		    }
			}
	_.isEqual(output, gold).should.be.true
	})

	it('calculateparam', function() {
		
		// 3 folds
		// 2 methods
		var results = [
			[{'F1':3, 'Precision':1 ,'Recall':5, 'Label': -1},{'F1':3, 'Precision':5 ,'Recall':5, 'Label': -1}],
			[{'F1':3, 'Precision':2 ,'Recall':6, 'Label': 2},{'F1':7, 'Precision':3 ,'Recall':5, 'Label': -1}],
			[{'F1':0, 'Precision':6 ,'Recall':7, 'Label': 4},{'F1':11, 'Precision':4 ,'Recall':5, 'Label': -1}]
		]

		// as results: Precision - methods - folds
		var param = ['Precision', 'Recall', 'F1', 'Label']
		var output = utils.calculateparam(results, param)

		_.isEqual(output['Precision']['average'], [3,4]).should.be.true
		_.isEqual(output['Recall']['average'], [6,5]).should.be.true
		_.isEqual(output['F1']['average'], [2,7]).should.be.true
		_.isEqual(output['Label']['average'][0], 3).should.be.true
	})
		

	it('comparefeatures', function() {
		var original = {'one':1, 'two':2, 'three':3}
		var features = {'one':1, 'two':2, 'five':3}
		var output = utils.comparefeatures(original, features)
		output.should.equal(1)
	})
	
	it('takeIntent', function() {
		var eval = {'Query':[],
					'Offer':[[1,'1'],[2,'1']],
					'Accept':[[4,'1'],[1,'1']],
					'Reject':[[6,'1'],[3,'1']],
				}

		var output = utils.takeIntent(eval)
		output.should.be.equal('Reject')

		var eval = {'Query':[],
				'Offer':[],
				'Accept':[],
				'Reject':[],
			}
		var output = utils.takeIntent(eval)
		output.length.should.be.equal(0)
	})

	it('replacefeatures', function() {
		var features = {'dog':1, 'cat': 1, 'shark':1, 'salomon':1}
		var seeds = {'animals':[['dog','NN',16], ['cat','NN',25]], 
					'fish': [['shark','NN',100], ['mushrooms', 'NN', 81]],
					'mushrooms':[['maslenok', 'NN', 16]]}

		var output = utils.replacefeatures(features, seeds, function(a){return 1})
		_.isEqual(output['features'], { animals: 0.25, fish: 0.1, salomon: 0 }).should.be.true
		_.isEqual(output['details'], { dog: 'animals', cat: 'animals', shark: 'fish' }).should.be.true

		var features = {'dog':1, 'cat': 1, 'shark':1, 'salomon':1, 'mushrooms': 5, 'maslenok':1}
		var output = utils.replacefeatures(features, seeds, function(a){return 1})
		_.isEqual(output['features'], { mushrooms: 1, animals: 0.25, fish: 0.1, salomon: 0 }).should.be.true
		_.isEqual(output['details'],  { dog: 'animals',cat: 'animals',shark: 'fish',maslenok: 'mushrooms' }).should.be.true
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
		_.isEqual(utils.onlyIntents(["{\"Query\":\"accept\"}"]), []).should.be.true
		_.isEqual(utils.onlyIntents(["{\"Query\":\"compromise\"}"]), []).should.be.true
	})

	it('equalgold', function(done) {	
		var turn = {"input_modified": "then <ATTRIBUTE> would be <VALUE>",
					"output": [ "{\"Offer\":{\"Salary\":\"12,000 NIS\"}}" ],
					"intent_keyphrases_rule": {	"Offer": "would be" }
					}

		var seeds = { 
			"Offer": {'I offer': [ 'would be']}
					}

		var gold = utils.seqgold(turn)
		// [ [ 'Offer', [ 17, 25 ], 'would be' ] ]

		utils.retrieveIntent(turn['input_modified'], seeds, function(err, result){
			// console.log(JSON.stringify(result, null, 4))
			done()
/*[
    {
        "Offer": {
            "original seed": "I offer",
            "ppdb phrase": "would be",
            "content of ppdb phrase": [
                "would",
                "be"
            ],
            "position": [
                17,
                25
            ]
        }
    }
]
*/
			
		})
	})

	it('retrieve intent', function(done) {	
		utils.retrieveIntent("my boss and i offer you a salary", seeds, function(err, result){
		/*	[ { Offer: 
   				  { 'original seed': 'I offer',
      				 'ppdb phrase': 'i offer',
      				 'content of ppdb phrase': [Object],
    				  position: 14 } 
    		  },
  			{ Accept: 
     			{ 'original seed': 'accept',
       			'ppdb phrase': 'i offer',
      			 'content of ppdb phrase': [Object],
      			 position: 14 } } ]*/

    		var keys = _.map(result, function(num, key){ return Object.keys(num)[0] });
    		var sequence = _.map(result, function(num, key){ return [Object.keys(num)[0], num[Object.keys(num)[0]]['position']] });
			_.isEqual(['Offer', 'Accept'], keys).should.be.true
			_.isEqual([ [ 'Offer', [ 14, 19 ] ], [ 'Accept', [ 14, 19 ] ] ], sequence).should.be.true
			done()
		})
	})

	it('seqgold', function() {
		var turn = {
			"input":"hello I need you to work 8 hours",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"8 hours\"}}",
            "{\"Offer\":{\"Pension Hours\":\"8 hours\"}}"
        ],
	    "intent_keyphrases_rule": {
    	    "Offer": "i need you"
    	}}
	    var seq = utils.seqgold(turn)
   		_.isEqual(seq, [ [ 'Offer', [ 6, 16 ], "i need you" ] ]).should.be.true  
    })

	it('retrieve intent DEFAULT INTENT', function(done) {
		utils.retrieveIntent("my boss <ATTRIBUTE>", seeds, function(err, result){
    		var keys = _.map(result, function(num, key){ return Object.keys(num)[0] });
       		_.isEqual(keys, ['Offer']).should.be.true
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

	it('retrieve intent sync', function() {
		var result = utils.retrieveIntentsync("my boss and i provide you a salary", seedsnew)
    	var keys = _.map(result, function(num, key){ return Object.keys(num)[0] });
		_.isEqual(keys, ['Offer']).should.be.true	
	})

	it('retrieve intent', function(done) {
		utils.retrieveIntent("my boss and i give you a salary", seeds, function(err, result){
			result.length.should.be.equal.zero
			done()
		})
	})

	it('subst', function() {
		var sublist = utils.subst("rub")
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
	
 	/*it('correctly clasify actual and expected clean', function(done) {
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
*/
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
			_.isEqual(results, [[ 'home' ]]).should.be.true
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
			_.isEqual(result, [['offer']]).should.be.true
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

