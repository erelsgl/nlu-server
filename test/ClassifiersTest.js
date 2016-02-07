/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

var async = require('async');
var should = require('should');
var classifiers = require('../classifiers');
var _ = require('underscore');
var limdu_classifiers = require('limdu/classifiers');
var ftrs = require('limdu/features');
var natural = require('natural');
var Hierarchy = require(__dirname+'/../Hierarchy');
var async_adapter = require(__dirname+'/../utils/async_adapter');

var SvmPerfBinaryClassifier = limdu_classifiers.SvmPerf.bind(0, {
	learn_args: "-c 100 --i 1",   // see http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html 
	model_file_prefix: "trainedClassifiers/tempfiles/SvmPerf"
});

var SvmPerfBinaryRelevanceClassifier = limdu_classifiers.multilabel.BinaryRelevance.bind(0, {
	binaryClassifierType: SvmPerfBinaryClassifier
});

describe('Classifiers functions', function() {

   it('feContext', function(callback) {

   		async.waterfall([
   		function(callback1) {
   				var sample = {'input':{
   					'unproc': 'I accept you a salary of 60000 ',
   					'context': ['{\"Offer\":{\"Salary\":\"60,000 USD\"}}']
   				}}
				
				classifiers.feContext(sample, {}, true, {'offered':true, 'unoffered':true, 'previous_intent':false}, function(err, features){
   					("OFFERED_VALUE" in features).should.equal(true)
 					callback1()
   				}) 
    		},
		function(callback1) {
                                var sample = {'input':{
                                        'unproc': 'I accept you a salary of 60000 ',
                                        'context': ['{\"Offer\":{\"Salary\":\"60,000 USD\"}}','{\"Accept\":\"Salary\"}']
                                }}

                                classifiers.feContext(sample, {}, true, {'offered':false, 'unoffered':false, 'previous_intent':true}, function(err, features){
                            _.isEqual(features, { PREV_YES_Offer: 1, PREV_YES_Accept: 1, PREV_NO_Reject: 1, PREV_NO_Quit: 1, PREV_NO_Greet: 1, PREV_NO_Query: 1 }).should.equal(true)
					callback1()
                                })
                },
    		function(callback1) {
   				var sample = {'input':{
   					'unproc': 'I accept you a salary of 90000',
   					'context': ['{\"Offer\":{\"Salary\":\"60,000 USD\"}}']
   				}}
				
				classifiers.feContext(sample, {}, true, {'offered':true, 'unoffered':true}, function(err, features){
   					("UNOFFERED_VALUE" in features).should.equal(true)
 					callback1()
   				}) 
    		},
    		function(callback1) {
   				var sample = {'input':{
   					'unproc': 'I accept you a salary of 60000 and 10% pension' ,
   					'context': ['{\"Offer\":{\"Salary\":\"60,000 USD\"}}']
   				}}
				
				classifiers.feContext(sample, {}, true, {'offered':true, 'unoffered':true}, function(err, features){
					_.isEqual(features, {"OFFERED_VALUE": 1,"UNOFFERED_VALUE": 1}).should.equal(true)

 					callback1()
   				}) 
    		},
    		function(callback1) {
   				var sample = {'input':{
   					'unproc': 'I accept you a salary of 60000 and 10% pension' ,
   					'context': ['{\"Offer\":{\"Salary\":\"60,000 USD\"}}']
   				}}
				
				classifiers.feContext(sample, {}, true, {'offered':true, 'unoffered':false}, function(err, features){
					_.isEqual(features, {"OFFERED_VALUE": 1}).should.equal(true)

 					callback1()
   				}) 
    		},
    		function(callback1) {
   				var sample = {'input':{
   					'unproc': 'I accept you a salary of 60000 and 10% pension' ,
   					'context': ['{\"Offer\":{\"Salary\":\"60,000 USD\"}}']
   				}}
				
				classifiers.feContext(sample, {}, true, {'offered':false, 'unoffered':true}, function(err, features){
					_.isEqual(features, {"UNOFFERED_VALUE": 1}).should.equal(true)

 					callback1()
   				}) 
    		}], function (err, result) {
    			callback()
			});
   	       
    })

   	it('feEmbed', function(callback) {

		async.waterfall([
   			function(callback1) {
				var sample = ""
				var features = {'i':1, 'love':1, 'the':1, 'life':1}
		
				classifiers.feEmbed(sample, features, false, {'embdeddb': 5, 'aggregate':'average'}, function (err, results){
					_.keys(results).length.should.equal(100)
					results.w2v0.should.equal(0.30470749999999996)
					callback1()
				}) 	
    		} ,
    		function(callback1) {
     	 		var sample = ""
      	        var features = {'love':1,'life':1}
                
                classifiers.feEmbed(sample, features, false, {'embdeddb': 5, 'aggregate':'average'}, function (err, results){
              	_.keys(results).length.should.equal(100)
			 		async_adapter.getembed("love", 5, function(err, love){
						async_adapter.getembed("life", 5, function(err, life){
							results.w2v0.should.equal((love[0]+life[0])/2)
							callback1()
	                    })
	                 })
                 })
    		 },
    		 function(callback1) {
           		var sample = ""
                var features = {'love':1}
                
                classifiers.feEmbed(sample, features, false, {'embdeddb': 6, 'aggregate':'average', 'allow_stopwords': true}, function (err, results){
                    _.keys(results).length.should.equal(100)
                     callback1()
                })
        	},
         	function(callback1) {
           		var sample = ""
	            var features = {'love':1}

                classifiers.feEmbed(sample, features, false, {'embdeddb': 7, 'aggregate':'average', 'allow_stopwords': true}, function (err, results){
                   _.keys(results).length.should.equal(25)
                    callback1()
                })
         	},
         	function(callback1) {
           		var sample = ""
                var features = {'love':1}

                classifiers.feEmbed(sample, features, false, {'embdeddb': 8, 'aggregate':'average', 'allow_stopwords': true}, function (err, results){
                	_.keys(results).length.should.equal(50)
                    callback1()
                })
         	},
         	function(callback1) {
           		var sample = ""
                var features = {'love':1}

                classifiers.feEmbed(sample, features, false, {'embdeddb': 9, 'aggregate':'average', 'allow_stopwords': true}, function (err, results){
                    _.keys(results).length.should.equal(100)
                    callback1()
                })
         	}
    	], function (err, result) {
    			callback()
			});
	})

	it('feAsync', function(callback) {

		var sample = {'input': {'text': 'I love the nature'}}
		
		async.waterfall([
   			function(callback1) {
        		var params = { 'unigrams': false, 'bigrams': false, 'allow_stopwords': false }
   				classifiers.feAsync(sample, {}, true, params, function (err, features){
					_.keys(features).length.should.equal(0)
					callback1(null)
        		})
    		},
    		function(callback1) {
        		var params = { 'unigrams': true, 'bigrams': false, 'allow_stopwords': false }
        		classifiers.feAsync(sample, {}, true, params, function (err, features){
					_.isEqual(features, {"love": 1, "nature": 1}).should.equal(true)
					callback1(null)
        		})
    		},
    		function(callback1) {
        		var params = { 'unigrams': true, 'bigrams': false, 'allow_stopwords': true }
        		classifiers.feAsync(sample, {}, true, params, function (err, features){
					_.isEqual(features, {"i":1, "love": 1, "the":1, "nature": 1}).should.equal(true)
					callback1(null)
        		})
        	},
        	function(callback1) {
        		var params = { 'unigrams': true, 'bigrams': true, 'allow_stopwords': true }
        		classifiers.feAsync(sample, {}, true, params, function (err, features){
					_.isEqual(features, {"i": 1,"love": 1,"the": 1,"nature": 1,"i love": 1,"love the": 1,"the nature": 1}).should.equal(true)					
					callback1(null)
        		})
        	}
    	], function (err, result) {
    			callback()
			});
	})

	it('feExpansion', function(callback) {
        
        var sample = { 
        	'output': ["Reject"],
        	'input':{'text': "I love the life",
			'sentences':[
				{
					'basic-dependencies':[
						{"dep": "ROOT", "dependentGloss": "love"},
					],
					'tokens':[
						{'word': 'I','pos': 'ABC'},
						{'word': 'love','pos': 'VB'},
						{'word': 'the','pos': 'ABC'},
						{'word': 'life','pos': 'NN'},
					]
				}]
			}
		}
	

 var sampleTest = {
                'text': "I love the life test",
                'sentences':[
                                {
                                        'basic-dependencies':[
                                                {"dep": "ROOT", "dependentGloss": "love"},
                                        ],
                                        'tokens':[
                                                {'word': 'I','pos': 'ABC'},
                                                {'word': 'love','pos': 'VB'},
                                                {'word': 'the','pos': 'ABC'},
                                                {'word': 'life','pos': 'NN'},
                                        ]
                                }]
                        }

		var sampleOffer = { 'output': ["Offer"],
        	'input':{'text': "everything is great",
			'sentences':[]},
		}
	         
		async.waterfall([
   			function(callback1) {
        		var params = {'scale':0, 'onlyroot': false, 'relation': undefined, 'allow_offer': false, 'best_results': undefined, 'expand_test': false}
   				classifiers.feExpansion(sample, {}, true, params, function (err, features){
					_.isEqual(features, { i:1, love: 1,the:1, life: 1,enjoys: 1,liking: 1,prefers: 1,appreciates: 1,lifetime: 1}).should.equal(true)
					callback1(null)
        		})
    		},
    		function(callback1) {
        		var params = {'scale':0, 'onlyroot': true, 'relation': undefined, 'allow_offer': false, 'best_results': undefined, 'expand_test': false}
   				classifiers.feExpansion(sample, {}, true, params, function (err, features){
					_.isEqual(features, { i:1, love: 1, the:1, life: 1,enjoys: 1,liking: 1,prefers: 1,appreciates: 1 }).should.equal(true)
					callback1(null)
        		})
    		},
    		function(callback1) {
        		var params = {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': false, 'best_results': 5, 'expand_test': false}
   				classifiers.feExpansion(sample, {}, true, params, function (err, features){
					_.isEqual(features, { i:1, love: 1, the:1,  life: 1, like: 1, adore: 1, adores:1, enjoy:1, liked:1 }).should.equal(true)
					callback1(null)
        		})
    		},
			function(callback1) {
                var params = {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': false, 'best_results': 5, 'expand_test': false}
                classifiers.feExpansion(sampleOffer, {}, true, params, function (err, features){
			_.isEqual(features, { everything:1, is:1, great: 1 }).should.equal(true)
                    callback1(null)
                })
            },
		function(callback1) {
		var params = {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': false, 'best_results': 5, 'expand_test': true}
			
                classifiers.feExpansion(sampleTest, {}, false, params, function (err, features){
			callback1(null)
		
		})

	},
	function(callback1) {
                var params = {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': false, 'best_results': 5, 'expand_test': true}
                classifiers.feExpansion(sample, {}, false, params, function (err, features){
			_.isEqual(features, { i:1, love: 1,the:1,  life: 1, like: 1, adore: 1, adores:1, enjoy:1, liked:1 }).should.equal(true)
                    callback1(null)
                })
            }
], function (err, result) {
    			callback()
			});
    })
	

	it('tokenizer', function() {
		_.isEqual(classifiers.tokenizer.tokenize("i want to success ?"), ["i","want","to","success","?"]).should.equal(true)
	})
	

	//TODO in different domain currency witth have digits after decimal point.

	it('correctly normalize', function() {

		// console.log(JSON.stringify(classifiers.normalizer("10hours"), null, 4))
		// process.exit(0)

		classifiers.normalizer("12,000 NIS").should.equal("12000 nis")
		classifiers.normalizer("12.000 NIS").should.equal("12000 nis")
		classifiers.normalizer("pension 14%").should.equal("pension 14%")
		// classifiers.normalizer("14hours").should.equal("14 hours")
		classifiers.normalizer("pension 14 % I offer").should.equal("pension 14% i offer")
		// classifiers.normalizer("abc 10,000NIS xyz").should.equal("abc 10000 nis xyz")
		// classifiers.normalizer("abc 10.000NIS xyz").should.equal("abc 10000 nis xyz")
		classifiers.normalizer("5.450 EGP").should.equal("5450 egp")
		classifiers.normalizer("5,450 EGP").should.equal("5450 egp")
	});


	it('correctly normalize', function() {

		var SvmClassifierStringFeatures = limdu_classifiers.EnhancedClassifier.bind(0, 	{
			classifierType: SvmPerfBinaryRelevanceClassifier, 
			featureLookupTable: new ftrs.FeatureLookupTable(),
			normalizer: classifiers.normalizer,
			featureExtractor: classifiers.featureExtractorUB,
			multiplyFeaturesByIDF: true,
			TfIdfImpl: natural.TfIdf
		});

		var cl = new SvmClassifierStringFeatures();

		var data = cl.normalizedSample("I offer 10,000NIS or 20.000 NIS and 15  % pension");
		
		//data.should.equal("i offer 10000 nis or 20000 nis and 15% pension")

		var features = cl.sampleToFeatures(data, cl.featureExtractors);

		//_.isEqual(features, { '10000': 1, '20000': 1, i: 1, offer: 1, nis: 1, or: 1, and: 1, '15%': 1, pension: 1, 'i offer': 1, 'offer 10000': 1, '10000 nis': 1, 'nis or': 1, 'or 20000': 1, '20000 nis': 1, 'nis and': 1, 'and 15%': 1, '15% pension': 1 }).should.equal(true)
		
		if (cl.tfidf) cl.tfidf.addDocument(features);

		cl.normalizedSample("I offer 10,000NIS or 20.000NIS");

		if (cl.tfidf) cl.tfidf.addDocument(cl.sampleToFeatures(cl.normalizedSample("I offer 10,000NIS or 20.000NIS"), cl.featureExtractors));

		cl.editFeatureValues(features, /*remove_unknown_features=*/false);

		var gold = { '10000': 0.5945348918918356,'20000': 0.5945348918918356,i: 0.5945348918918356,offer: 0.5945348918918356,
	  				nis: 0.5945348918918356, or: 0.5945348918918356, and: 1, '15%': 1,
  					pension: 1, 'i offer': 0.5945348918918356, 'offer 10000': 0.5945348918918356,
  					'10000 nis': 0.5945348918918356, 'nis or': 0.5945348918918356, 'or 20000': 0.5945348918918356, '20000 nis': 0.5945348918918356, 'nis and': 1, 'and 15%': 1, '15% pension': 1 }

		// _.isEqual(features, { '10000': 0, '20000': 0, i: 0, offer: 0, nis: 0, or: 0, and: 0.6931471805599453, '15%': 0.6931471805599453, pension: 0.6931471805599453, 'i offer': 0, 'offer 10000': 0, '10000 nis': 0, 'nis or': 0, 'or 20000': 0, '20000 nis': 0, 'nis and': 0.6931471805599453, 'and 15%': 0.6931471805599453, '15% pension': 0.6931471805599453 }).should.equal(true)
		_.isEqual(features, gold).should.be.true

	})

	// it('correctly classify IDF and Binary', function() {

	// 	var classifiertype =  classifiers.enhance(classifiers.PartialClassification
	// 		(classifiers.SvmPerfBinaryRelevanceClassifier), classifiers.featureExtractorU, 
	// 		undefined, new ftrs.FeatureLookupTable(),undefined, Hierarchy.splitPartEqually, 
	// 		Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent, false, classifiers.featureExpansionEmpty)
		
	// 	var classifier = new classifiertype();

	// 	var dataset = [
	// 		{input:"aaa bbb ccc", output:[{Insist: true}]},
	// 		{input:"aaa bbb", output:[{Insist: true}]},
	// 		{input:"ccc", output:[{Insist: true}]},
	// 		{input:"bbb ccc", output:[{Insist: true}]}
	// 		]

	// 	classifier.trainBatch(dataset)

	// 	_.isEqual(classifier.featureLookupTable["featureNameToFeatureIndex"], {
 //        	"undefined": 0,"aaa": 1,"bbb": 2,"ccc": 3}).should.be.true

	// 	var input = "I classify aaa and ddd aaa"
	// 	input = classifier.normalizedSample(input);
	// 	var features = classifier.sampleToFeatures(input, classifier.featureExtractors);
	// 	_.isEqual(features, { i: 1, classify: 1, aaa: 1, and: 1, ddd: 1 }).should.be.true

	// 	classifier.editFeatureValues(features, /*remove_unknown_features=*/false);
	// 	_.isEqual(features, { i: 1, classify: 1, aaa: 1, and: 1, ddd: 1 }).should.be.true

	// 	var classifiertype1 =  classifiers.enhance(classifiers.PartialClassification
	// 		(classifiers.SvmPerfBinaryRelevanceClassifier), classifiers.featureExtractorU, 
	// 		undefined, new ftrs.FeatureLookupTable(),undefined, Hierarchy.splitPartEqually, 
	// 		Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent, true, classifiers.featureExpansionEmpty)

		
	// 	var classifier1 = new classifiertype1();
	// 	classifier1.trainBatch(dataset)
	// 	input = classifier1.normalizedSample(input);
	// 	var features = classifier1.sampleToFeatures(input, classifier1.featureExtractors);
	// 	classifier1.editFeatureValues(features, /*remove_unknown_features=*/false);

	// 	_.isEqual(features, { i: 2.386294361119891,classify: 2.386294361119891,aaa: 1.2876820724517808,and: 2.386294361119891,ddd: 2.386294361119891 }).should.be.true

	// })

})
