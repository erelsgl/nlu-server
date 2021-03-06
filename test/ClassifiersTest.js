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

  it("randomCheck", function(callback) {
    var sample = {
      'output': ["Accept"],
      'input':{
           // 'text': "I love the life",
        'sentences':
        {
          'basic-dependencies':[
            {"dep": "ROOT", "dependentGloss": "love"},
            {"dependentGloss": "I"},
            {"dependentGloss": "the"},
            {"dependentGloss": "life"}
          ],
          'tokens':[
            {'word': 'I','pos': 'ABC', 'lemma':'I'},
            {'word': 'love','pos': 'VB','lemma':'love'},
            {'word': 'the','pos': 'ABC','lemma':'the'},
            {'word': 'life','pos': 'NN','lemma':'life'},
          ]
        }
      }
    }

    var params = {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': true, 'best_results': 5, 'expand_test': false}
    classifiers.feExpansionW(sample, {'I':1, 'love':1, 'the':1, 'life':1}, true, params, function (err, features){
      console.log(JSON.stringify(features, null, 4))
      // _.isEqual(features, { i:1, love: 1,the:1, life: 1,enjoys: 1,liking: 1,prefers: 1,appreciates: 1,lifetime: 1}).should.equal(true)
      callback(null)
    })

  })

  it('neufeExpansion', function(callback1) {

    var sample = {
      'output': ["Accept"],
      'input':{
           // 'text': "I love the life",
        'sentences':
        {
          'basic-dependencies':[
            {"dep": "ROOT", "dependentGloss": "love"},
            {"dependentGloss": "I"},
            {"dependentGloss": "the"},
            {"dependentGloss": "life"}
          ],
          'tokens':[
            {'word': 'I','pos': 'ABC', 'lemma':'I'},
            {'word': 'love','pos': 'VB','lemma':'love'},
            {'word': 'the','pos': 'ABC','lemma':'the'},
            {'word': 'life','pos': 'NN','lemma':'life'},
          ]
        }
      }
    }

    var params = {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': true, 'best_results': 2, 'expand_test': false}
    classifiers.feExpansion(sample, {'I':1, 'love':1, 'the':1, 'life':1}, true, params, function (err, features){
      console.log(JSON.stringify(features, null, 4))
      // _.isEqual(features, { i:1, love: 1,the:1, life: 1,enjoys: 1,liking: 1,prefers: 1,appreciates: 1,lifetime: 1}).should.equal(true)
      callback1(null)
    })
  })

  it('feWordnet', function(callback) {
     var sample = { 
          'output': ["Reject"],
          'input':{
            // 'text': "I love the life",
      'sentences':
        {
          'basic-dependencies':[
            {"dep": "ROOT", "dependentGloss": "love"},
            {"dep": "neg", "governorGloss": "love"},
            {"dependentGloss": "I"},
            {"dependentGloss": "the"},
            {"dependentGloss": "life"}
          ],
          'tokens':[
            {'word': 'I','pos': 'ABC', 'lemma':'I'},
            {'word': 'love','pos': 'VB','lemma':'love'},
            {'word': 'the','pos': 'ABC','lemma':'the'},
            {'word': 'life','pos': 'NN','lemma':'life'},
          ]
        }
      }
    }

    async.waterfall([
      function(callback1) {
        classifiers.feWordnet(sample, {}, true, {'synonyms':true, 'antonyms':true}, function (err, features){
          _.isEqual(features,{"love-": 1,"know-": 1,"screw-": 1,"fuck-": 1,"jazz-": 1,"eff-": 1,"hump-": 1,"bed-": 1,"bang-": 1,"bonk-": 1,"enjoy-": 1,"hate": 1,"detest": 1}).should.equal(true)
          callback1(null)
        })
      },
      function(callback1) {
        classifiers.feWordnet(sample, {}, true, {'synonyms':true, 'antonyms':false}, function (err, features){
          _.isEqual(features,{"love-": 1,"know-": 1,"screw-": 1,"fuck-": 1,"jazz-": 1,"eff-": 1,"hump-": 1,"bed-": 1,"bang-": 1,"bonk-": 1,"enjoy-": 1}).should.equal(true)
          callback1(null)
        })
      },
      function(callback1) {
        classifiers.feWordnet(sample, {}, true, {'synonyms':false, 'antonyms':true}, function (err, features){
          _.isEqual(features,{"hate": 1,"detest": 1}).should.equal(true)
          callback1(null)
        })
      }],
    function (err, result) {
      callback()
    })
  })

  it('getRule', function() {  

    var data = {'tokens':[{'word':'no','lemma':'no','pos':'A'},{'lemma':'agreement','word':'agreement','pos':'A'},{'lemma':'pension','word':'pension','pos':'A'}]} 
	  var results = classifiers.getRule(data)

    var data = {'tokens':[{'word':'60,000','lemma':'60,000','pos':'A'},{'lemma':'USD','word':'USD','pos':'A'},
                          {'lemma':'salary','word':'salary','pos':'A'}]}
    var results = classifiers.getRule(data)

    var data = {'tokens':[{'word':'10','lemma':'10','pos':'A'},{'lemma':'%','word':'%','pos':'A'},
                          {'lemma':'is','word':'is','pos':'A'},{'word':'accepted','lemma':'accepted','pos':'A'}]}
    var results = classifiers.getRule(data)
    results['cleaned']['tokens'].length.should.equal(2)
            
    var data = {'tokens':[{'word':'with','lemma':'with','pos':'A'},{'lemma':'no','word':'no','pos':'A'},
                          {'lemma':'agreement','word':'agreement','pos':'A'},{'word':'the','lemma':'the','pos':'A'},
                          {'word':'car','lemma':'car','pos':'A'}]}

    var results = classifiers.getRule(data)
    
    results["cleaned"]["tokens"].length.should.equal(1)
    _.isEqual(results.labels,  [['Leased Car'],['No agreement']]).should.equal(true)


    var data = {'tokens':[{'word':'no','lemma':'no','pos':'A'},{'lemma':'agreement','word':'agreement','pos':'A'},
                          {'lemma':'on','word':'on','pos':'A'},{'word':'the','lemma':'the','pos':'A'},
                          {'word':'car','lemma':'car','pos':'A'},{'word':'then','lemma':'then','pos':'A'}],
                'basic-dependencies':[{'dep':'neg','governorGloss':'agreement'}]}

    var results = classifiers.getRule(data)

    results["cleaned"]["tokens"].length.should.equal(3)
    _.isEqual(results.labels,  [['Leased Car'],['No agreement']]).should.equal(true)


    var data = {'tokens':[{'word':'120,000','lemma':'120,000','pos':'A'},{'lemma':'USD','word':'USD','pos':'A'},{'lemma':'no','word':'no','pos':'A'},
                          {'word':'car','lemma':'car','pos':'A'}],
                'basic-dependencies':[{'dep':'neg','governorGloss':'car'}]}

    var results = classifiers.getRule(data)

    results["cleaned"]["tokens"].length.should.equal(0)

	_.isEqual(results.labels,  [['Salary','Leased Car'],['120,000 USD','Without leased car']]).should.equal(true)

    var data = {'tokens':[{'word':'I','lemma':'I','pos':'A'},{'lemma':'have','word':'have','pos':'A'},{'lemma':'a','word':'a','pos':'A'},
                          {'word':'salary','lemma':'salary','pos':'A'},{'lemma':'of','word':'of','pos':'A'},{'lemma':'60,000','word':'60,000','pos':'A'}]
                }

    var results = classifiers.getRule(data)
  
  _.isEqual(results.labels,  [['Salary'],['60,000 USD']]).should.equal(true)

    var data = classifiers.getRule({'tokens':[{'lemma':'I','pos':'A'},{'lemma':'have','pos':'A'},{'lemma':'a','pos':'A'},
      {'lemma':'salary','pos':'A'},{'lemma':'of','pos':'A'},{'lemma':'60,000','pos':'A'}]})

    results["cleaned"]["tokens"].length.should.equal(4)      
    _.isEqual(data.cleaned,{"tokens": [{"lemma": "I",'pos':'A'},{"lemma": "have",'pos':'A'},{"lemma": "a",'pos':'A'},{"lemma": "of",'pos':'A'}]}).should.equal(true)

    var data = classifiers.getRule({'tokens':[{'lemma':'I','pos':'A'},{'lemma':'have','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'salary','pos':'A'},{'lemma':'of','pos':'A'},{'lemma':'60k','pos':'A'}]})

    data["cleaned"]["tokens"].length.should.equal(4)      
    _.isEqual(data.labels,[["Salary"],["60,000 USD"]]).should.equal(true)

    var data = classifiers.getRule({'tokens':[{'lemma':'I','pos':'A'},{'lemma':'have','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'salary','pos':'A'},{'lemma':'of','pos':'A'},{'lemma':'60,000','pos':'A'}]})

    data["cleaned"]["tokens"].length.should.equal(4)      
    _.isEqual(data.labels,[["Salary"],["60,000 USD"]]).should.equal(true)

    var data = classifiers.getRule({'tokens':[{'lemma':'there','pos':'A'},{'lemma':'will','pos':'A'},{'lemma':'be','pos':'A'},{'lemma':'no','pos':'A'},{'lemma':'agreement','pos':'A'},{'lemma':'for','pos':'A'},{'lemma':'car','pos':'A'}]})
    
    data["cleaned"]["tokens"].length.should.equal(4)      
    _.isEqual(data.labels,[["Leased Car"],["No agreement"]]).should.equal(true)
    
    var data = classifiers.getRule({'tokens':[{'lemma':'with','pos':'A'},{'lemma':'leased','pos':'A'},{'lemma':'car','pos':'A'},{'lemma':'pension','pos':'A'},{'lemma':'fund','pos':'A'},{'lemma':'10','pos':'A'},{'lemma':'%','pos':'A'}]})

    data["cleaned"]["tokens"].length.should.equal(0)      
    _.isEqual(data.labels,[["Pension Fund","Leased Car"],["10%","With leased car"]]).should.equal(true)

    var data = classifiers.getRule({'tokens':[{'lemma':'let','pos':'A'},{'lemma':'us','pos':'A'},{'lemma':'compromise','pos':'A'},{'lemma':'without','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'leased','pos':'A'},{'lemma':'car','pos':'A'}]})

    data["cleaned"]["tokens"].length.should.equal(4)      
    _.isEqual(data.labels,[["Leased Car"],["Without leased car"]]).should.equal(true)

    var data = classifiers.getRule({'tokens':[{'lemma':'with','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'pension','pos':'A'},{'lemma':'fund','pos':'A'},{'lemma':'10%','pos':'A'}]})

    data["cleaned"]["tokens"].length.should.equal(1)      
    _.isEqual(data.labels,[["Pension Fund"],["10%"]]).should.equal(true)
// !!!!!!!!!!!!!!
    var data = classifiers.getRule({'tokens':[{'lemma':'you','pos':'A'},{'lemma':'offer','pos':'A'},{'lemma':'me','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'leased','pos':'A'},{'lemma':'car','pos':'A'}]})

    data["cleaned"]["tokens"].length.should.equal(4)      
    _.isEqual(data.labels,[["Leased Car"],[]]).should.equal(true)

    var data = classifiers.getRule({'tokens':[{'lemma':'I','pos':'A'},{'lemma':'need','pos':'A'},{'lemma':'you','pos':'A'},{'lemma':'to','pos':'A'},{'lemma':'work','pos':'A'},{'lemma':'10','pos':'A'},{'lemma':'hours','pos':'A'},{'lemma':'because','pos':'A'},{'lemma':'there','pos':'A'},{'lemma':'job','pos':'A'}]})
    
    data["cleaned"]["tokens"].length.should.equal(7)      
    _.isEqual(data.labels,[["Working Hours","Job Description"],["10 hours"]]).should.equal(true)

    var data = classifiers.getRule({'tokens':[{'lemma':'I','pos':'A'},{'lemma':'offering','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'job','pos':'A'},{'lemma':':','pos':'A'},{'lemma':'programmer','pos':'A'}, {'lemma':'10','pos':'A'},{'lemma':'hours','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'day','pos':'A'},{'lemma':',','pos':'A'}, {'lemma':'60000','pos':'A'},{'lemma':'no','pos':'A'},{'lemma':'car','pos':'A'},{'lemma':'fast','pos':'A'},{'lemma':'promotion','pos':'A'},{'lemma':'track','pos':'A'}]})
    
    data["cleaned"]["tokens"].length.should.equal(5)
    _.isEqual(data.labels,[["Salary","Promotion Possibilities","Working Hours","Job Description","Leased Car"],["60,000 USD","Fast promotion track","10 hours","Programmer","Without leased car"]]).should.equal(true)

  })

  it('feNeg', function(callback) {
    var sample = { 
        'output': ["Reject"],
        'input':{'text': "I love the life",
      'sentences':
        {
          'basic-dependencies':[
            {
              "dep": "neg", 
              "governorGloss": "pains"
        
            }
          ],
          'tokens':[
            {
              'word':'pains',
              'lemma':'pain'
            },
            {
              'word':'loves',
              'lemma':'love'
            }
          ]
        }
      }
    }

    classifiers.feNeg(sample, {'love':1, 'pain':1}, true, {}, function(err, features){
      _.isEqual(features, {"love": 1, "pain-":1}).should.equal(true)
      callback()
    })    
   })

  it('feContext', function(callback) {
    async.waterfall([
    		function(callback1) {
   				var sample = {'input':{
              'sentences':{'tokens':[{'word':'I','lemma':'I','pos':'A'},{'word':'accept','lemma':'accept','pos':'A'},{'word':'you','lemma':'you','pos':'A'},
                        {'word':'a','lemma':'a','pos':'A'},{'word':'salary','lemma':'salary','pos':'A'},{'word':'of','lemma':'of','pos':'A'},{'word':'90000','lemma':'90000','pos':'A'}]
              // 'basic-dependencies':[{'dependentGloss':'I'},{'dependentGloss':'accept'},{'dependentGloss':'you'},
                                    // {'dependentGloss':'a'},{'dependentGloss':'salary'},{'dependentGloss':'of'},{'dependentGloss':'90000'}]
                                  },
   					'context': ['{\"Offer\":{\"Salary\":\"60,000 USD\"}}']
   				}}
				
				classifiers.feContext(sample, {}, true, {'offered':true, 'unoffered':true}, function(err, features){
          _.isEqual(features, {'UNOFFEREDVALUE':1}).should.equal(true)
            callback1()
   				}) 
    		},
/*    		function(callback1) {
   				var sample = {'input':{
 'sentences':{'tokens':[{'word':'I','lemma':'I','pos':'A'},{'word':'accept','lemma':'accept','pos':'A'},{'word':'you','lemma':'you','pos':'A'},
                        {'word':'a','lemma':'a','pos':'A'},{'word':'salary','lemma':'salary','pos':'A'},{'word':'of','lemma':'of','pos':'A'},
                        {'word':'60000','lemma':'60000','pos':'A'},{'word':'and','lemma':'and','pos':'A'},{'word':'10%','lemma':'10%','pos':'A'},{'word':'pension','lemma':'pension','pos':'A'}],

                // 'basic-dependencies':[{'dependentGloss':'I'},{'dependentGloss':'accept'},{'dependentGloss':'you'},{'dependentGloss':'a'},
                  // {'dependentGloss':'salary'},{'dependentGloss':'of'},{'dependentGloss':'60000'},{'dependentGloss':'and'},{'dependentGloss':'and'},
                  // {'dependentGloss':'10%'},{'dependentGloss':'pension'}]
                /*},
   					'context': ['{\"Offer\":{\"Salary\":\"60,000 USD\"}}']
   				}}
				
				classifiers.feContext(sample, {}, true, {'offered':true, 'unoffered':true}, function(err, features){
					_.isEqual(features, {"OFFERED_VALUE": 1,"UNOFFERED_VALUE": 1}).should.equal(true)

 					callback1()
   				}) 
    		},/*
    		function(callback1) {
   				var sample = {'input':{
'sentences':{'tokens':[{'word':'I'},{'word':'accept'},{'word':'you'},
                        {'word':'a'},{'word':'salary'},{'word':'of'},{'word':'60000'},{'word':'and'},{'word':'10%'},{'word':'pension'}]},
 
   					'context': ['{\"Offer\":{\"Salary\":\"60,000 USD\"}}']
   				}}
				
				classifiers.feContext(sample, {}, true, {'offered':true, 'unoffered':false}, function(err, features){
					_.isEqual(features, {"OFFERED_VALUE": 1}).should.equal(true)

 					callback1()
   				}) 
    		},*/
    		function(callback1) {
   				var sample = {'input':{
'sentences':{'tokens':[{'lemma':'I','pos':'A'},{'lemma':'accept','pos':'A'},{'lemma':'you','pos':'A'},
                        {'lemma':'a','pos':'A'},{'lemma':'salary','pos':'A'},{'lemma':'of','pos':'A'},{'lemma':'60000','pos':'A'},{'lemma':'and','pos':'A'},{'lemma':'10%','pos':'A'},{'lemma':'pension','pos':'A'}]},
 
   					'context': ['{\"Offer\":{\"Salary\":\"60,000 USD\"}}']
   				}}
				
				classifiers.feContext(sample, {}, true, {'offered':false, 'unoffered':true}, function(err, features){
					_.isEqual(features, {"UNOFFEREDVALUE": 1}).should.equal(true)

 					callback1()
   				}) 
    		}], function (err, result) {
    			callback()
			});
   	       
    })

   	it('feEmbed', function(callback) {

      var sample = { 
          'output': ["Reject"],
          'input':{
            // 'text': "I love the life",
            'sentences':
              {
                'basic-dependencies':[
                  {"dep": "ROOT", "dependentGloss": "love"},
                  {"dep": "neg", "governorGloss": "love"},
                  {"dependentGloss": "I"},
                  {"dependentGloss": "the"},
                  {"dependentGloss": "life"}
                ],
                'tokens':[
                  {'word': 'I','pos': 'ABC', 'lemma':'I'},
                  {'word': 'love','pos': 'VB','lemma':'love'},
                  {'word': 'the','pos': 'ABC','lemma':'the'},
                  {'word': 'life','pos': 'NN','lemma':'life'},
                ]
              }
          }
      }

		async.waterfall([
        function(callback1) {
        var features = {'i':1, 'love':1, 'the':1, 'life':1}
        classifiers.feEmbed(sample, features, false, {'embdeddb': 5, 'operation':'sum'}, function (err, results){
          _.keys(results).length.should.equal(100)
          callback1()
        })  
        },
/*   	function(callback1) {

	var features = {'i':1, 'love':1, 'the':1, 'life':1}	
	classifiers.feEmbed(sample, features, false, {'embdeddb': 5, 'operation':'sum', 'root':false, 'unigrams':false}, function (err, results){
					_.keys(results).length.should.equal(100)
					results.w2v0.should.equal(0.30470749999999996)
					callback1()
				}) 	
    		} ,*/
    		function(callback1) {
     	 		var sample = ""
      	        var features = {'love':1,'life':1}
                
                classifiers.feEmbed(sample, features, false, {'embdeddb': 5, 'operation':'sum', 'root':false, 'unigrams':false}, function (err, results){
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
                
                classifiers.feEmbed(sample, features, false, {'embdeddb': 6, 'operation':'sum', 'root':false, 'unigrams':false, 'allow_stopwords': true}, function (err, results){
                    _.keys(results).length.should.equal(100)
                     callback1()
                })
        	},
         	function(callback1) {
           		var sample = ""
	            var features = {'love':1}

                classifiers.feEmbed(sample, features, false, {'embdeddb': 7, 'operation':'sum', 'root':false, 'unigrams':false, 'allow_stopwords': true}, function (err, results){
                   _.keys(results).length.should.equal(25)
                    callback1()
                })
         	},
         	function(callback1) {
           		var sample = ""
                var features = {'love':1}

                classifiers.feEmbed(sample, features, false, {'embdeddb': 8, 'operation':'sum', 'root':false, 'unigrams':false, 'allow_stopwords': true}, function (err, results){
                	_.keys(results).length.should.equal(50)
                    callback1()
                })
         	},
         	function(callback1) {
           		var sample = ""
                var features = {'love':1}

                classifiers.feEmbed(sample, features, false, {'embdeddb': 9, 'operation':'sum', 'root':false, 'unigrams':false, 'allow_stopwords': true}, function (err, results){
                    _.keys(results).length.should.equal(100)
                    callback1()
                })
         	}
    	], function (err, result) {
    			callback()
			});
	})

	it('feAsync', function(callback) {

		var sample = {'input': {
      'text': 'I love the nature',
      'sentences':{
        'tokens':[{'word':'I','lemma':'I','pos':'A'},{'word':'love','lemma':'love','pos':'A'},
        {'word':'the','lemma':'the','pos':'A'},{'word':'nature','lemma':'nature','pos':'A'}]
      }
  }}
		
    var sample1 = {'input': {
      'text': 'She loves me',
      'sentences':{
        'tokens':[{'word':'She','lemma':'she','pos':'PRP'},{'word':'loves','lemma':'love','pos':'VB'},{'word':'me','lemma':'me','pos':'CC'}]
      }
  }}
    
		async.waterfall([
   			function(callback1) {
            // var params = { 'unigrams': true, 'bigrams': false, 'allow_stopwords': true }
        		
        		classifiers.feAsync(sample, {}, true, {}, function (err, features){
              _.isEqual(features, {"i":1, "love": 1, "the":1, "nature": 1}).should.equal(true)
					    callback1(null)
        		})
        	},
          function(callback1) {
            classifiers.feAsync(sample1, {}, true, {}, function (err, features){
              _.isEqual(features, {"she": 1,"love": 1,"me": 1}).should.equal(true)
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
        	'input':{
            // 'text': "I love the life",
			'sentences':
				{
					'basic-dependencies':[
            {"dep": "ROOT", "dependentGloss": "love"},
            {"dependentGloss": "I"},
            {"dependentGloss": "the"},
						{"dependentGloss": "life"}
					],
					'tokens':[
						{'word': 'I','pos': 'ABC', 'lemma':'I'},
						{'word': 'love','pos': 'VB','lemma':'love'},
						{'word': 'the','pos': 'ABC','lemma':'the'},
						{'word': 'life','pos': 'NN','lemma':'life'},
					]
				}
			}
		}
	

 var sampleTest = {
                // 'text': "I love the life test",
                'sentences':
                                {
                                        'basic-dependencies':[
                                                {"dep": "ROOT", "dependentGloss": "love"},
                                                {"dependentGloss": "I"},
                                                {"dependentGloss": "the"},
                                                {"dependentGloss": "life"},
                                        ],
                                        'tokens':[
                                                {'word': 'I','pos': 'ABC','lemma':'I'},
                                                {'word': 'love','pos': 'VB','lemma':'love'},
                                                {'word': 'the','pos': 'ABC','lemma':'the'},
                                                {'word': 'life','pos': 'NN','lemma':'life'},
                                        ]
                                }
                        }

		var sampleOffer = { 'output': ["Offer"],
        	'input':{'text': "everything is great",
			'sentences':[]},
		}

    var sampleNeg = {
                // 'text': "I love the life test",
                'sentences':
                                {
                                        'basic-dependencies':[
                                                {"dep": "ROOT", "dependentGloss": "loves"},
                                                {"dep": "neg", "governorGloss": "loves"}
                                        ],
                                        'tokens':[
                                                {'word': 'I','pos': 'ABC','lemma':'I'},
                                                {'word': 'loves','pos': 'VB','lemma':'love'},
                                                {'word': 'the','pos': 'ABC','lemma':'the'},
                                                {'word': 'life','pos': 'NN','lemma':'life'},
                                        ]
                                }
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
            var params = {'scale':0, 'onlyroot': true, 'relation': undefined, 'allow_offer': true, 'best_results': 5, 'expand_test': true}
          classifiers.feExpansion(sampleNeg, {}, true, params, function (err, features){
          

	 _.isEqual(features, {"i": 1,"love": 1,"the": 1,"life": 1,"enjoys-": 1,"liking-": 1,"prefers-": 1,"appreciates-": 1}).should.equal(true)
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
		//	function(callback1) {
               // var params = {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': false, 'best_results': 5, 'expand_test': false}
               // classifiers.feExpansion(sampleOffer, {}, true, params, function (err, features){
	//		_.isEqual(features, { everything:1, is:1, great: 1 }).should.equal(true)
         //           callback1(null)
           //     })
           // },
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
