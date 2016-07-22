	/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

var should = require('should')
var bars = require('../utils/bars')
var _ = require('underscore')._;
//var __ = require('lodash');
var fs = require('fs');

// var rules = require("../research/rule-based/rules.js")
// var ppdb = require("../research/ppdb/utils.js")


describe('Bars utilities', function() {

	it('parseoutput', function() {
		var output = bars.parseoutput({ "Accept": true, "Offer": {"Working Hours": "10 hours"}})
		_.isEqual(output, ["Working Hours","10 hours"]).should.equal(true)
	
		var output = bars.parseoutput({ "Accept": {"Salary": "60,000 USD", "Working Hours": "10 hours" }})
		_.isEqual(output, ["Salary", "60,000 USD", "Working Hours", "10 hours"]).should.equal(true)
	})

	it('mngrp', function() {
		var val = bars.mngrp("the the the the the the the", "The cat is on the mat",1 )
		_.isEqual(val, 0.2857142857142857).should.equal(true)
	
		// var val = bars.mngrp("It is a guide to action which ensures that the military always obeys the commands of the party", 
							 // "It is a guide to action that ensures that the military will forever heed Party commands",1 )
		// _.isEqual(val, 0.2857142857142857).should.equal(true)

		var val = bars.mngrp("of the", "It is the guiding principle which guarantees the military forces always being under the command of the Party",1)
		
		var val = bars.mngrp("of the", "It is the guiding principle which guarantees the military forces always being under the command of the Party",2)
		_.isEqual(val, 1).should.equal(true)

	})


	it('distances', function() {
		var res = bars.distances("The salary that you offer?", "I reject the salary of 90000")
		console.log(JSON.stringify(res, null, 4))
	})

	it('turnoutput', function() {
		var output = { "Offer": { "Job Description": "Project Manager" }}
		_.isEqual(bars.turnoutput(output), [["Offer","Job Description"]]).should.equal(true)

		var output = { "Accept": true, "Offer": {"Working Hours": "10 hours"}}
		_.isEqual(bars.turnoutput(output), [["Accept",true], ["Offer","Working Hours"]]).should.equal(true)

		var output = { "Accept": {"Salary": "60,000 USD", "Working Hours": "10 hours" }}
		_.isEqual(bars.turnoutput(output), [["Accept","Salary"], ["Accept","Working Hours"]]).should.equal(true)

		var output = { "Query": {"Offer": "Salary"}}
		_.isEqual(bars.turnoutput(output), [["Query","Salary"]]).should.equal(true)
	
		// _.isEqual(bars.turnoutput(output), [["Accept","Salary"], ["Accept","Working Hours"]]).should.equal(true)
	})
	
	it('singlelabeldst', function() {
		var dataset = [
				{'outputhash':{'Accept':{},'Reject':{}}},
				{'outputhash':{'Accept':{}}},
				{'outputhash':{'Offer':{}}},
				{'outputhash':{'Offer':{},'Accept':{}}},
				{'outputhash':{'Offer':{},'Reject':{}}}
			]

		var dist = bars.singlelabeldst(dataset)
		_.isEqual(dist, {"Accept": 1,"Offer": 1}).should.equal(true)
	})

	it('undersampledst', function() {

		var src = [
			{'outputhash':{'Accept':{}}},
			{'outputhash':{'O':{}}},
			{'outputhash':{'O':{}}}
			]

		var dst = [
			{'outputhash':{'Accept':{},'Reject':{}}, 'input': 'dst'},
			{'outputhash':{'Accept':{}}, 'input': 'dst'},
			{'outputhash':{'Accept':{}}, 'input': 'dst'},
			{'outputhash':{'O':{}}, 'input': 'dst'}
			]

		var new_dst = bars.undersampledst(src, dst)
		console.log(JSON.stringify(new_dst, null, 4))
	})

	it('oppositeintent', function() {
		_.isEqual(bars.oppositeintent({"Accept":true}), {"Reject":true}).should.equal(true)
		_.isEqual(bars.oppositeintent({"Reject":{"Salary":"10"}}), {"Accept":{"Salary":"10"}}).should.equal(true)
		_.isEqual(bars.oppositeintent({"Reject":{"Salary":"10"}}), {"Accept":true}).should.equal(false)
	})

	it('replaceroot', function() {
		var sen = {	"basic-dependencies": 	[
											{"dep":"ROOT","dependentGloss": "accept"}
											],
								"tokens": 	[
											{"word": "accept","lemma": "accept","pos": "VB"},
											{"word": "loved","lemma": "love","pos": "VB"}
											]}								
		
		var res = bars.replaceroot(sen, "reject")
		res['basic-dependencies'][0]['dependentGloss'].should.equal("reject")
		res['tokens'][0]['word'].should.equal("reject")
		res['tokens'][0]['lemma'].should.equal("reject")
	})
	
	it('getroot', function() {
		var sen = {	"basic-dependencies": 	[
											{"dep":"ROOT","dependentGloss": "accept"}
											],
								"tokens": 	[
											{"word": "accept","lemma": "accept","pos": "VB"},
											{"word": "loved","lemma": "love","pos": "VB"}
											]}								
		
		var sen_neg = {	"basic-dependencies": 	[
											{"dep":"ROOT","dependentGloss": "accept"},
											{"dep":"neg","governorGloss": "accept"}
											],
								"tokens": 	[
											{"word": "accept","lemma": "accept","pos": "VB"},
											{"word": "loved","lemma": "love","pos": "VB"}
											]}								
		
		var sen_neg_xcomp = {	"basic-dependencies": 	[
											{"dep":"ROOT","dependentGloss": "have"},
											{"dep":"xcomp","governorGloss": "have", "dependentGloss":"accept"}
											],
								"tokens": 	[
											{"word": "accept","lemma": "accept","pos": "VB"},
											{"word": "have","lemma": "have","pos": "VB"}
											]}								
		
		bars.getroot(sen)["negation"].should.equal(false)
		bars.getroot(sen_neg)["negation"].should.equal(true)
		bars.getroot(sen_neg_xcomp)["lemma"].should.equal("accept")
	})

	it('undersample', function() {
		var dataset = [
			{'input':"1", 'output':["\{\"Offer\":true\}"]},
			{'input':"1", 'output':["\{\"Offer\":true\}"]},
			{'input':"2", 'output':["\{\"Accept\":true\}"]}
		]

		var dat = bars.undersample(dataset)

		_.isEqual(dat[0]["input"], "1").should.equal(true)
		_.isEqual(dat[1]["input"], "2").should.equal(true)

		var dataset = [
			{'input':"1", 'output':["\{\"Offer\":true\}"]},
			{'input':"1", 'output':["\{\"Offer\":true\}"]},
			{'input':"2", 'output':["\{\"Accept\":true\}"]},
			{'input':"2", 'output':["\{\"Accept\":true\}"]},
			{'input':"1", 'output':["\{\"Offer\":true\}"]},
			{'input':"3", 'output':["\{\"Reject\":true\}"]},
			{'input':"4", 'output':["\{\"Query\":true\}"]},
		]

		var dat = bars.undersample(dataset)

		_.isEqual(dat[0]["input"], "4").should.equal(true)
		_.isEqual(dat[1]["input"], "1").should.equal(true)
		_.isEqual(dat[2]["input"], "2").should.equal(true)
		_.isEqual(dat[3]["input"], "3").should.equal(true)

	})

	it('oversample', function() {
		
		var dataset = [
			{'input':"1", 'output':["\{\"Offer\":true\}"]},
			{'input':"1", 'output':["\{\"Offer\":true\}"]},
			{'input':"2", 'output':["\{\"Accept\":true\}"]},
			{'input':"3", 'output':["\{\"Reject\":true\}"]},
			{'input':"4", 'output':["\{\"Query\":true\}"]}
		]

		var dat = bars.oversample(dataset)
		console.log(JSON.stringify(dat, null, 4))

		_.isEqual(dat.length, 7).should.equal(true)
		_.isEqual(dat[dat.length-2]["input"], "2").should.equal(true)
		_.isEqual(dat[dat.length-1]["input"], "3").should.equal(true)
	})

	it('oversampleA', function() {

		var dataset = [
			{'input':"1", 'output':["Offer"]},
			{'input':"1", 'output':["Offer"]},
			{'input':"2", 'output':["Accept"]},
			{'input':"3", 'output':["Reject"]},
			{'input':"4", 'output':["Query"]}
		]

		var bufferset = [
			{'input':"g1", 'output':["Offer"]},
			{'input':"g1", 'output':["Offer"]},
			{'input':"g2", 'output':["Accept"]},
			{'input':"g3", 'output':["Reject"]},
			{'input':"g4", 'output':["Query"]}
		]

		var dat = bars.oversampleA(dataset, bufferset)
		console.log(JSON.stringify(dat, null, 4))
	})

	it('expanbal', function(callbackl) {

		var dataset = [
			{
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
		]

		bars.expanbal(dataset,function(err, res){
			console.log(JSON.stringify(res, null, 4))
			callbackl()
		})
	})

	it('setsize', function() {
		_.isEqual(bars.setsize([1,2,3], 9).length, 9).should.equal(true)
		_.isEqual(bars.setsize([1,2,3], 2).length, 2).should.equal(true)
		/*_.isEqual(bars.setsize([1,2,3], 9), [1,2,3,1,2,3,1,2,3]).should.equal(true)
		_.isEqual(bars.setsize([1,2,3], 5), [1,2,3,1,2]).should.equal(true)
		_.isEqual(bars.setsize([1,2,3], 3), [1,2,3]).should.equal(true)
		_.isEqual(bars.setsize([1,2,3], 2), [1,2]).should.equal(true)*/
	})

	it('generateopposite', function(callback) {

		var dataset = [{
					"output":["\{\"Accept\":true\}"],
					"input":{"sentences":[
							{
								"basic-dependencies": [
										{"dep":"ROOT","dependentGloss": "accept"}
									],
								"tokens": 	[
											{"word": "accept","lemma": "accept","pos": "VB"},
											{"word": "love","lemma": "love","pos": "VB"}
											]
				}]}}]

		bars.generateopposite(dataset, function(err, res){
			res.length.should.equal(4)
			callback()
			// console.log(JSON.stringify(res, null, 4))
		})
    })  

	it('pipeline', function() {

		var labels = bars.coverfilter(bars.generate_possible_labels(bars.resolve_emptiness_rule([["Offer"], ['Leased Car'], ['Without leased car']])))
		_.isEqual(labels,["{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"]).should.equal(true)

		var labels = bars.coverfilter(bars.generate_possible_labels(bars.resolve_emptiness_rule([[], [], []])))
		labels.length.should.equal(0)

		var labels = bars.coverfilter(bars.generate_possible_labels(bars.resolve_emptiness_rule([["Reject"], [], []])))
		_.isEqual(labels, ["{\"Reject\":true}"]).should.equal(true)

		var labels = bars.resolve_emptiness_rule([["Query"], [], ['Salary']])
		labels[1][0].should.equal("Offer")

		var labels = bars.coverfilter(bars.generate_possible_labels(bars.resolve_emptiness_rule([["Query"], ['Salary'], []])))
		_.isEqual(labels,["{\"Query\":{\"Offer\":\"Salary\"}}"]).should.equal(true)

		var labels = bars.coverfilter(bars.generate_possible_labels(bars.resolve_emptiness_rule([["Query"], [], []])))
		_.isEqual(labels,["{\"Query\":\"Offer\"}"])

		var labels = bars.coverfilter(bars.generate_possible_labels(bars.resolve_emptiness_rule([["Reject"], ["Leased Car"], ["Without leased car"]])))
		_.isEqual(labels,["{\"Reject\":{\"Leased Car\":\"With leased car\"}}"])
	})

	it('coverfilter', function() {
		var a =  ["{\"Accept\":\"Pension Fund\"}","{\"Accept\":{\"Pension Fund\":\"10%\"}}"]
		_.isEqual(bars.coverfilter(a), ["{\"Accept\":{\"Pension Fund\":\"10%\"}}"]).should.be.true
	})
	
	it('distdistance', function() {
		var a = {
			'a':0.2,
			'c':0.1,
			'b':0.4
		}

		var b = {
			'a':0.2,
			'd':0.5,
			'e':0.4
		}

		var dist = bars.distdistance(a,b)
		console.log(JSON.stringify(dist, null, 4))
		process.exit(0)
	})

	it('simulateds', function() {
		var dial = [
			{'output':['a','b']},
			{'output':['b','c']},
			{'output':['a','c']},
			{'output':['b']}
		]

		var dist = bars.getdist(dial)
	})

	it('simulateds', function() {
		var dataset = [
			{"input":1, "output":["a"]},
			{"input":2, "output":["b"]},
			{"input":3, "output":["b"]},
			{"input":4, "output":["a"]},
			{"input":5, "output":["a"]}
		]
		var size = 2
		var params = {
			"a":{"TP":5,"FN":5,"F1":0},
			"b":{"TP":5,"FN":5,"F1":0.5}
		}

		var sim_dataset =  bars.simulateds(dataset, size, params)

		var inputs = _.pluck(sim_dataset, 'input');
		_.uniq(inputs).length.should.equal(inputs.length)
	})

	it('filterlabels', function() {
		_.isEqual(bars.filterlabels(["{\"Reject\":true}","{\"Reject\":{\"Leased Car\":\"With leased car\"}}"]), [ '{"Reject":{"Leased Car":"With leased car"}}' ]).should.be.true
		_.isEqual(bars.filterlabels(["{\"Reject\":true}","{\"Reject\":{\"Leased Car\":\"With leased car\"}}", "{\"Offer\":true}"]), [ '{"Reject":{"Leased Car":"With leased car"}}', "{\"Offer\":true}" ]).should.be.true
		_.isEqual(bars.filterlabels(["{\"Reject\":true}","{\"Offer\":true}"]), [ "{\"Offer\":true}","{\"Reject\":true}" ]).should.be.true
		_.isEqual(bars.filterlabels(["{\"Accept\":true}","{\"Offer\":true}"]), [ "{\"Offer\":true}","{\"Accept\":true}" ]).should.be.true

		console.log(JSON.stringify(bars.filterlabels(["{\"Accept\":\"Pension Fund\"}","{\"Accept\":{\"Pension Fund\":\"10%\"}}"]), null, 4))

	

		_.isEqual(bars.filterlabels(["{\"Accept\":\"Pension Fund\"}","{\"Accept\":{\"Pension Fund\":\"10%\"}}"]), ["{\"Accept\":{\"Pension Fund\":\"10%\"}}"]).should.be.true
	})

	it('ngraminindex', function() {
	  // function ngraminindex(ngram, index, type)
  		var index = JSON.parse(fs.readFileSync("./wordnet_index.json", 'UTF-8'))

  		var input = [{'word':'offer','pos':'VB','lemma':'offer'}]
  		var output = bars.ngraminindex(input, index, 'word')
  		_.isEqual(output, 'offer').should.be.true

		var input = [{'word':'offeras','pos':'VB','lemma':'offer'}]
  		var output = bars.ngraminindex(input, index, 'word')
  		_.isEqual(output, 'offer').should.be.true  		

  		var input = [
  					 {'word':'beyond','pos':'VB','lemma':'beyond'},
  					 {'word':'a','pos':'VB','lemma':'a'},
  					 {'word':'doubt','pos':'VB','lemma':'doubt'}
  					 ]
  		var output = bars.ngraminindex(input, index, 'word')
  		_.isEqual(output, 'beyond a doubt').should.be.true  		

  		var input = [
  					 {'word':'beyond','pos':'VB','lemma':'beyond'},
  					 {'word':'a','pos':'VB','lemma':'a'},
  					 {'word':'doubtdd','pos':'VB','lemma':'doubt'}
  					 ]
  		var output = bars.ngraminindex(input, index, 'word')
  		_.isEqual(output, 'beyond a doubt').should.be.true  		
	})

	it('createcandidates', function() {
		var input = {
			'CORENLP':{'sentences':[{'tokens':[
				{'word':'pine','pos':'NN','lemma':'offer'},
				{'word':'gold','pos':'NN','lemma':'offer'},
				{'word':'all','pos':'NN','lemma':'offer'},
				{'word':'too','pos':'NN','lemma':'offer'},
			]}]}
		}

		var output = bars.createcandidates(input)
		console.log("-------------")
		console.log(output)
	})
	
	it('isnotokaccept', function() {
		var turn = {'input': 'OK', 'output': [{'Accept':'previous'}]}
		bars.isnotokaccept(turn).should.be.false
		var turn = {'input': 'OK', 'output': [{'Accept':'previous'}, {'Reject':'previous'}]}
		bars.isnotokaccept(turn).should.be.true
		var turn = {'input': 'chpok', 'output': [{'Accept':'previous'}]}
		bars.isnotokaccept(turn).should.be.true
		var turn = {'input': 'okay', 'output': [{'Accept':'previous'}]}
		bars.isnotokaccept(turn).should.be.false
		var turn = {'input': 'No', 'output': [{'Reject':'previous'}]}
		bars.isnotokaccept(turn).should.be.false
		var turn = {'input': 'paraNo', 'output': [{'Reject':'previous'}]}
		bars.isnotokaccept(turn).should.be.true
	})

	it('vectorsum', function() {
		_.isEqual(bars.vectorsum([1,2,3,4],[4,3,2,1]),[5,5,5,5]).should.be.true
		_.isEqual(bars.vectorsum([1,2,3,4],[1,1,1,1]),[2,3,4,5]).should.be.true
	})

	it('filter', function() {
		var out = _.filter([[1], [2], [], [4]], function(num){ return num.length != 0 });
	})
	

	it('isstopword', function() {
		bars.isstopword('can').should.be.true
		bars.isstopword('could').should.be.true
		bars.isstopword(['could', 'i']).should.be.true
		bars.isstopword('could i').should.be.true
		bars.isstopword('reveice i').should.be.false
	})

	it('equallist', function() {
		bars.equallist([{'one':123, 'two':234}, {'one':123, 'two':234}, {'one':123, 'two':234}]).should.be.true
		bars.equallist([{'one':123, 'two':234}, {'one':123, 'two':2134}, {'one':123, 'two':234}]).should.be.false
		bars.equallist([{'one':123, 'two':234}, {'one':123, 'two':234}, {'one':123, 'thw':234}]).should.be.false
	})

	it('onecoverstwo', function() {
		bars.onecoverstwo([1,4],[1,4]).should.be.true
		bars.onecoverstwo([1,4],[2,3]).should.be.true
		bars.onecoverstwo([1,4],[2,4]).should.be.true
		bars.onecoverstwo([1,4],[1,3]).should.be.true
		bars.onecoverstwo([1,4],[2,5]).should.be.false
		bars.onecoverstwo([1,4],[0,2]).should.be.false
	})

	it('lisunique', function() {
  		var out = bars.lisunique([[2],[1],[3],[1]])
  		_.isEqual(out, [ [2],[1],[3] ]).should.be.true
  	})

	it('listint', function() {
  		var out = bars.listint([[2],[1],[3]],[[1]])
  		_.isEqual(out, [ [ 1 ] ]).should.be.true
  	})


 	it('fullycovered', function() {
 		var actual = [['Offer',[1,5]],['Accept',[1,5]],['Offer',[4,5]],['Accept',[1,5]]]
 		_.isEqual(bars.fullycovered(actual), [ [ 'Offer', [ 1, 5 ] ], [ 'Accept', [ 1, 5 ] ] ]).should.be.true
		
		var actual = [['Offer',[2,3]], ['Offer',[1,5]],['Accept',[1,5]],['Offer',[4,5]],['Accept',[2,7]]]
 		_.isEqual(bars.fullycovered(actual), [ [ 'Offer', [ 1, 5 ] ],[ 'Accept', [ 1, 5 ] ],[ 'Accept', [ 2, 7 ] ] ]).should.be.true
 	})

 	it('uniquecoord', function() {
 		var actual = [['Offer',[1,5]],['Accept',[1,5]],['Offer',[4,5]],['Accept',[1,5]]]
 		bars.uniquecoord(actual).length.should.equal(3)
	})

 	it('intersection', function() {
    	bars.intersection([5,10],[8,15]).should.be.true
		bars.intersection([5,10],[12,15]).should.be.false
		bars.intersection([5,10],[6,9]).should.be.true
		bars.intersection([6,9],[5,10]).should.be.true
		bars.intersection([6,9],[6,9]).should.be.true
		bars.intersection([6,9],[6,10]).should.be.true
		bars.intersection([6,9],[10,11]).should.be.false
		bars.intersection([1,1],[1,1]).should.be.true
    })

  it('difference', function() {
  		var out = bars.listdiff([[2],[1],[3]],[[1]])
  		_.isEqual(out, [ [ 2 ], [ 3 ] ]).should.be.true
  })

  it('uniqueaggregate', function() {
		var ac = [['Greet',[1,5]], ['Offer',[0,5]], ['Offer', [0,5]],  ['Greet',[0,6]],['Offer', [0,5]], ['Offer',[9,15]], ['Greet',[0,9]],['Offer', [0,5]], ['Accept',[4,6]]]
		var output = bars.uniqueaggregate(ac)
		output.length.should.equal(4)

		var actual = bars.uniquecandidate(output)
		_.isEqual(actual[0], ['Greet',[0,9]]).should.be.true
	})	

	it('intersections', function() {	
		var inter = bars.barint([[1],[2],[3]],[[2],[3],[4]])
		_.isEqual(inter,['2','3']).should.be.true
	})

	it('skipgrams', function() {	

		var str = bars.skipgrams("1 2 3 4",2/*n ngrams*/,1/*k skip*/, 'start', 'end')
		_.isEqual(str, [ [ 'start', '2' ],[ '2', '3' ],[ '3', '4' ],[ '4', 'end' ],
			[ 'start', '1' ],[ '1', '3' ],[ '1', '2' ],[ '2', '4' ],[ '3', 'end' ] ]).should.be.true
	})

	it('create list', function() {	
		var data = {"0": {
        				"2": {'TP':[
        					{
                			"input": "I don't accept pension?",
                			"intent_core": { "Reject": "don't accept" },
                			"diff_TP":[
                				["Reject",[4,10],"reject","reject","don't accept","don't accept"]
                			],
                			"sequence_actual_ppdb": [
                    			["Reject",[4,10],"reject","reject","don't accept","don't accept"]
                			]
            				},
            				{
                			"input": "Can I have a higher pension?",
                			"intent_core": { "Reject": "can i have a higher" },
                			"diff_TP":[
                				["Reject",[4,10],"no","no","no , i have n't","i have"],
                    			["Reject",[4,10],"nono","no","no , i have n't","i have no"]
                			],
                			"sequence_actual_ppdb": [
                    			["Reject",[4,10],"no","no","no , i have n't","i have"],
                    			["Reject",[4,10],"nono","no","no , i have n't","i have no"],
                    			["Reject",[4,10],"nonono","no","no , i have n't","i have nono"],
                    			["Reject",[4,10],"nononono","no","no , i have n't","i have nonono"]
                			]
            				},
            				{
                			"input": "Fine, but can I get a leased car?",
                			"intent_core": { "Accept": "^fine", "Offer": "can i get" },
                			"diff_TP":[
                				["Offer",[15,25],"would you give","would you give","can i get","can i get"],
                				["Accept",[0,4],"agree","agree","okay , fine","fine"]
                			],
                			"sequence_actual_ppdb": [
                    			["Offer",[15,25],"would you give","would you give","can i get","can i get"],
                    			["Offer",[11,20],"can i give","can i give","can i get","can i"],
                    			["Accept",[0,4],"agree","agree","okay , fine","fine"]
                			]}]},
            			"4": {'TP':[{
                			"input": "We're losing time, leased car please?",
                			"intent_core": { "Offer": "please" },
                			"diff_TP":[
                				["Offer",[33,39],"i would be willing to go","would","please do","please"]
                			],
                			"sequence_actual_ppdb": [
                    			["Offer",[33,39],"i would be willing to go","would","please do","please"]
                			]
            				}]	
            				}},
            		"1":{
            			"2":{ 'TP': [{
            				"input": "Yes but can I have a higher pension?",
                			"intent_core": { "Reject": "can i have a higher" },
                			"diff_TP":[
                				["Reject",[4,10],"no","nope","nope , i have n't a","i have a"]
                				],
			                "sequence_actual_ppdb": [
            			        ["Reject",[4,10],"no","no","no , i have n't","i have"],
            			        ["Reject",[4,10],"no","nope","nope , i have n't a","i have a"]
                			]}]},
            			"4":{ 'TP': [{
							"input": "Fine, but please a leased car?",
                			"intent_core": { "Accept": "fine", "Offer": "please"},
                			"diff_TP":[
                    			["Offer",[11,20],"i would be willing to go","would you give","please","please"],
                    			["Accept",[0,4],"agree","agree","okay , fine","fine"]
                			],
                			"sequence_actual_ppdb": [
                    			["Offer",[11,20],"i would be willing to go","would you give","please","please"],
                    			["Offer",[11,20],"i would be willing to go","would","please","please"],
                    			["Accept",[0,4],"agree","agree","okay , fine","fine"]
                			]
            			}]}}}
    
          bars.writehtml(data)
    })

       
	it('copyobj', function() {	
		var list = [{'one':[1,1,1]}, {'two':[2,2,2]}]
		var copylist = bars.copyobj(list)
		copylist[0]['one'].push(1)
		list[0]['one'].length.should.equal(3)

		var hash = {'one':1, 'two':2}
		var copyhash = bars.copyobj(list)
		copyhash['one'] = 2
		hash['one'].should.equal(1)
	})

	it('isunigram', function() {
		bars.isunigram("year").should.be.true
		bars.isunigram(" year").should.be.true
		bars.isunigram(" ye ar").should.be.false
		bars.isunigram("year month").should.be.false
	})

	it('onlyunigrams', function() {
		var input = {
			' 1 2':[['1'],['2']],
			'3':[['33'],['333']],
			' 4 ':[[' 44 '],['444']],
			'5':[['5 5'],['555']],
			'6':[['6 6']]
			}

		var output = bars.onlyunigrams(input)

		var gold = 	{ 
			'3': [ [ '33' ], [ '333' ] ],
  			'5': [ [ '555' ] ],
  			' 4 ': [ [ ' 44 ' ], [ '444' ] ] 
  		}	

		_.isEqual(gold, output).should.be.true
	})

	
	it('biunormalizer', function() {

		var sen = 'Can I work as a Team Manager? I will work ten hours'
		var gold = "can i work as a team manager ? i will work 10 hours"
		var sennor = bars.biunormalizer(sen)
		sennor.should.equal(gold)

		var sen = 'I can accept the $90,000 as programmer with leased car, 10% pension fund, fast promotion track and eight hours work'
		var sennor = bars.biunormalizer(sen)
		_.isEqual(bars.biunormalizer(sennor), sennor).should.be.true


		var sen = 'I would like to be considered for the position of Team Manager, 90,000 USD, with car, 20% pension, fast promotion, 8 hours'
		var sennor = bars.biunormalizer(sen)
		_.isEqual(bars.biunormalizer(sennor), sennor).should.be.true
		   
		_.isEqual(bars.biunormalizer("Sounds reasonable!"), "sounds reasonable !").should.be.true
		_.isEqual(bars.biunormalizer("Sounds reasonable !"), "sounds reasonable !").should.be.true
		_.isEqual(bars.biunormalizer("Sounds reasonable?"), "sounds reasonable ?").should.be.true
		_.isEqual(bars.biunormalizer("Sounds reasonable ?"), "sounds reasonable ?").should.be.true
		// _.isEqual(bars.biunormalizer("Ok, sound"), "okay , sound").should.be.true
		// _.isEqual(bars.biunormalizer("Ok , sound"), "okay , sound").should.be.true
		_.isEqual(bars.biunormalizer("do you agree to start with 12,000"), "do you agree to start with 12000").should.be.true
	})
	
	it('intersection', function() {
    	bars.intersection([5,10], [8,15]).should.be.true
    	bars.intersection([5,10], [12,15]).should.be.false
    	bars.intersection([5,10], [5,10]).should.be.true
    	bars.intersection([0,10], [5,10]).should.be.true
    	bars.intersection([0,4], [5,10]).should.be.false
    })
	
	it('uniqueArray', function() {
		var array = [['accept',[0,1]], ['accept',[2,1]], ['accept',[0,1]]]
		var output = bars.uniqueArray(array)
		_.isEqual(output, [ [ 'accept', [ 0, 1 ] ], [ 'accept', [ 2, 1 ] ] ]).should.be.true
	})

	it('correctly filter labels with Accept and etc', function() {
		// _.isEqual(bars.labelFilter([["Accept"],["Salary"],["20,000 NIS"]]),[ [ 'Accept' ], [ 'Salary' ], [ '20,000 NIS' ] ]).should.be.true
		_.isEqual(bars.labelFilter(['{"Accept":"Salary"}', '{"Accept":{"Salary":"20,000 NIS"}}']), [ '{"Accept":{"Salary":"20,000 NIS"}}' ]).should.be.true

	})


	// then we can not agree on the salary
	// '{"Reject":"Salary"}'

	it('sample1', function(done) {
		var nopuntc = 'then we can not agree on the salary'
  		ppdb.cachepos(nopuntc, function(err, tagged){
  			ppdb.dep(tagged, function(depparsed){
  				var data = rules.findData(nopuntc)
				var intents = [ [ 'Reject', '', [ 1, 5 ], [ [] ] ] ]
				var output = bars.buildlabel(data, depparsed, intents)
				
				var js = []
				_.each(output, function(lab, key, list){ 
			    	var res = bars.resolve_emptiness_rule(lab)
      				js = js.concat(bars.generate_possible_labels(res))
  				}, this)

				js = bars.labelFilter(js)
  				_.isEqual(js, [ '{"Reject":"Salary"}' ]).should.be.true
				done()
  			})
		})
	})

	// there is no agreement on leased car"
	// '{"Offer":{"Leased Car":"No agreement"}}'

	it('sample2', function(done) {
		var nopuntc = 'there is no agreement on leased car'
  		ppdb.cachepos(nopuntc, function(err, tagged){
  			ppdb.dep(tagged, function(depparsed){
  				var data = rules.findData(nopuntc)
				var intents = [ [ 'Offer', 'there is no agreement on', [ 0, 5 ], [ [] ] ] ]
				var output = bars.buildlabel(data, depparsed, intents)

				var js = []
				_.each(output, function(lab, key, list){ 
			    	var res = bars.resolve_emptiness_rule(lab)
      				js = js.concat(bars.generate_possible_labels(res))
  				}, this)

				js = bars.labelFilter(js)

  				_.isEqual(js, [ '{"Offer":{"Leased Car":"No agreement"}}' ]).should.be.true

				done()
  			})
		})
	})

	// i agree to with leased @ 8 hours with slow promotion track
	// '{"Accept":{"Promotion Possibilities":"Slow promotion track"}}',
  	// '{"Accept":{"Working Hours":"8 hours"}}',
  	// '{"Accept":{"Leased Car":"With leased car"}}'

	it('sample3', function(done) {
		var nopuntc = 'i agree to with leased @ 8 hours with slow promotion track'
  		ppdb.cachepos(nopuntc, function(err, tagged){
  			ppdb.dep(tagged, function(depparsed){
  				var data = rules.findData(nopuntc)
				var intents = [["Accept","i agree+ to with",[0,4]]]
				var output = bars.buildlabel(data, depparsed, intents)

				var js = []
				_.each(output, function(lab, key, list){ 
			    	var res = bars.resolve_emptiness_rule(lab)
      				js = js.concat(bars.generate_possible_labels(res))
  				}, this)

				js = bars.labelFilter(js)

  				_.isEqual(js, [ '{"Accept":{"Promotion Possibilities":"Slow promotion track"}}',
  '{"Accept":{"Working Hours":"8 hours"}}',
  '{"Accept":{"Leased Car":"With leased car"}}' ]).should.be.true

				done()
  			})
		})
	})

	it('ispermittedturn', function(){
  		bars.ispermittedturn({'output':['{"Accept":{"Leased Car":"With leased car"}}']}).should.be.true
  		bars.ispermittedturn({'output':['{"Accept":{"Salary":"20,000"}}']}).should.be.true
  		bars.ispermittedturn({'output':['{"Query":{"Salary":"20,000"}}']}).should.be.false
  		bars.ispermittedturn({'intent_core':{'Offer':'asdsad'}}).should.be.true
  		bars.ispermittedturn({'intent_core':{'Offer':'DEFAULT INTENT'}}).should.be.false
  		bars.ispermittedturn({'intent_core':{'Accept':'accept'}}).should.be.true
	})
	
	// it('correctly depparse and labels', function(done) {
	// 	var nopuntc = 'i can do 8 hours, but only if you work as a programmer'
 //  		ppdb.cachepos(nopuntc, function(err, tagged){
 //  			ppdb.dep(tagged, function(depparsed){
 //  				var data = rules.findData(nopuntc)
	// 			var intents = [["Offer","i can do+ but only if you work+ as a",[0,10]]]
	// 			var output = bars.buildlabel(data, depparsed, intents)
	// 			console.log(output)
	// 			// [ [ [ 'Offer' ], [ 'Working Hours' ], [] ],
	// 			// [ [ 'Offer' ], [], [ '8 hours' ] ],
 //  				// [ [ 'Offer' ], [], [ 'Programmer' ] ],
 //  				// [ [ 'Offer' ], [], [] ] ]
	// 			done()
 //  			})
	// 	})
	// })

	// it('correctly depparse and labels1', function(done) {
	// 	var nopuntc = 'i can not agree to your suggest'
 //  		ppdb.cachepos(nopuntc, function(err, tagged){
 //  			ppdb.dep(tagged, function(depparsed){
 //  				var data = rules.findData(nopuntc)
	// 			var intents = [["Reject","i can not agree-",[0,4]]]
	// 			var output = bars.buildlabel(data, depparsed, intents)
	// 			// [ [ [ 'Reject' ], [], [] ] ]
	// 			console.log(output)
	// 			done()
 //  			})
	// 	})
	// })

	it('correctly aggregate nested hashes', function() {
		stats = [{
			'F1' : 1,
			'Precision': 5,
			'Recall' : 0.75
		},
		{
			'F1' : 0.8,
			'Precision': 2,
			'Recall' : 0.4
		}]
	results = bars.aggregate_results(stats)
	results['F1'].should.equal(0.9);
	results['Precision'].should.equal(3.5);
	results['Recall'].should.equal(0.575);
	})

	it('correctly aggregate nested hashes', function() {
		stats = [{
			'label1':
			{
				'param1' : 5,
				'param2' : 3,
			},
			'label2':
			{
				'param2' : 3,
			},
			'label3':
			{
				'param3' : 5,
				'param1' : 3,
			}
		},
		{
			'label1':
			{
				'param1' : 5,
				'param3' : 3,
			},
			'label2':
			{
				'param1' : 5,
				'param2' : 3,
			},
			'label3':
			{
				'param2' : 3,
			},
			'label4':
			{
				'param2' : 3,
				'param4' : 7,
			}
		}]
		result = bars.aggregate_two_nested(stats)
		
		result['label1']['param1'].should.equal(5);
		result['label1']['param2'].should.equal(1.5);
		result['label1']['param3'].should.equal(1.5);

		result['label2']['param2'].should.equal(3);
		result['label2']['param1'].should.equal(2.5);

		result['label3']['param1'].should.equal(1.5);
		result['label3']['param2'].should.equal(1.5);
		result['label3']['param3'].should.equal(2.5);

		result['label4']['param2'].should.equal(1.5);
		result['label4']['param4'].should.equal(3.5);
	});

	it('correctly computes comfusion matrix', function() {
	stats = {'data':[
		{
			'explanation':{
				'TP':['Offer'],
				'FP':['Insist'],
			}
		},

		{
			'explanation':{
				'TP':['Accept'],
				'FN':['Reject']
			}
		},

		{
			'explanation':{
				'TP':['Offer', 'Insist'],
				'FP':['Accept'],
				'FN':['Query']
			}
		},

	]}

	matrix = bars.confusion_matrix(stats)

	matrix['Offer']['Offer'].should.equal(2)
	matrix['Offer']['Insist'].should.equal(1)
	matrix['Offer']['Accept'].should.equal(1)
	matrix['Accept']['Accept'].should.equal(1)
	matrix['Reject']['nolabel'].should.equal(1)
	matrix['Insist']['Insist'].should.equal(1)
	matrix['Insist']['Accept'].should.equal(1)
	matrix['Query']['Accept'].should.equal(1)
	matrix['Query']['nolabel'].should.equal(1)

	})

	it('correctly computes ambiguity between labels', function() {
		amb	= bars.intent_attr_label_ambiguity([['Offer', 'Reject', 'Greet'],['Salary', 'Working Hours'],['20,000']])
		amb.length.should.equal(2)
		amb[0]['attr'].should.equal('Salary')
		amb[1]['attr'].should.equal('Working Hours')
		_.isEqual(amb[0]['list'], ['Offer','Reject']).should.equal(true)
		_.isEqual(amb[1]['list'], ['Offer','Reject']).should.equal(true)
	})

	it('correctly computes ambiguity in dataset', function() {
		dataset = [{
					'input': "",
					'output': [ '{"Insist":"Working Hours"}','{"Offer":{"Job Description":"Programmer"}}','{"Offer":{"Working Hours":"10 hours"}}' ]
				}]

		amba = bars.intent_attr_dataset_ambiguity(dataset)
		amba[0]['ambiguity'].length.should.equal(2)
		amba[0]['ambiguity'][0]['attr'].should.equal("Working Hours")
		amba[0]['ambiguity'][1]['attr'].should.equal("Job Description")

		dataset = [{
					'input': "",
					'output': [ '{"Insist":"Working Hours"}','{"Greet":true}' ]
				}]

		amba = bars.intent_attr_dataset_ambiguity(dataset)
		amba.length.should.equal(0)
		
	})	

	it('correctly compuets explanation', function() {
		explanation = ["how about 10000 nis",
    {
    	"positive": {
    			"Offer": [["label1",3], ["label7",2], ["label3",3]],
            	"Salary": [["label1",1], ["label2",5]]
            	},
     	"negative": {
            	"Greet": [["label1",1], ["label2",2]],
            	"Aceept": [["label1",1], ["label3",2]],
        		}
    },
    	"blaasdasdada",
	{
    	"positive": {
    			"Offer": [["label1",1], ["label2",2], ["label3",3]],
            	"Salary": [["label1",1], ["label4",5]]
            	},
     	"negative": {
            	"Greet": [["label1",1], ["label4",2]],
            	"Aceept": [["label1",1], ["label3",2]],
        		}
    }]

    original = {
    "positive": {
        "Offer": [["label1",4],["label7",2],["label3",6],["label2",2]],
        "Salary": [["label1",2], ["label2",5],["label4",5]]
    	},
    "negative": {
        "Greet": [["label1",2],["label2",2],["label4",2]],
        "Aceept": [["label1",2],["label3",4]]
    	}
	}

    str = bars.expl_struct(explanation)
    _.isEqual(str,original).should.equal(true)    
	})

	it('correctly divides labels', function() {

		_.isEqual(bars.bag_of_labels_to_components(['Offer']),[['Offer'],[],[]]).should.equal(true)
		_.isEqual(bars.bag_of_labels_to_components(['Offer', 'Salary', 'Accept']),[['Offer','Accept'],['Salary'],[]]).should.equal(true)
		_.isEqual(bars.bag_of_labels_to_components(['Offer', 'Salary', 'Accept', '20,000 NIS', 'QA']),[['Offer','Accept'],['Salary'],['20,000 NIS','QA']]).should.equal(true)
		_.isEqual(bars.bag_of_labels_to_components([true,'Greet']),[['Greet'], [], [ true]]).should.equal(true)
	})

	it('correctly sees ambiguity', function() {
		_.isEqual(bars.semlang_ambiguity(['accept']), [[['Query'],[], ['accept']]]).should.equal(true)
		_.isEqual(bars.semlang_ambiguity(['Offer', '20,000 NIS']), [[[ 'Offer'], ['Salary'], ['20,000 NIS' ]]]).should.equal(true)
		_.isEqual(bars.semlang_ambiguity([true]), [ [ [ 'Greet' ], [], [ true ] ], [ [ 'Quit' ], [], [ true ] ] ]).should.equal(true)
		_.isEqual(bars.semlang_ambiguity(['Accept', '20,000 NIS']), [[['Accept'],['Salary'],['20,000 NIS']]]).should.equal(true)
		// _.isEqual(bars.semlang_ambiguity(['20,000 NIS']), [[['Offer'],['Salary'],['20,000 NIS']]]).should.equal(true)
		bars.semlang_ambiguity(['previous']).length.should.equal(4)
	})

	it('correctly generate labels', function() {
		// _.isEqual(bars.generate_possible_labels([ [ 'Accept' ], [''], [ '' ] ]), [ '{"Accept":"previous"}' ]).should.equal(true)
		_.isEqual(bars.generate_possible_labels([ [ 'Accept' ], [''], [ 'previous' ] ]), [ '{"Accept":"previous"}' ]).should.equal(true)
		_.isEqual(bars.generate_possible_labels([['Offer'],['Salary'],['10,000 NIS']]),['{"Offer":{"Salary":"10,000 NIS"}}'])
		_.isEqual(bars.generate_possible_labels([['Offer'],['Salary'],['20,000 NIS']]), [ '{"Offer":{"Salary":"20,000 NIS"}}' ]).should.equal(true)
		// _.isEqual(bars.generate_possible_labels([['Offer', 'Accept', 'Reject', 'Greet'],['Salary', 'Job description'],['20,000 NIS','previous']]),[ '{"Offer":{"Salary":"20,000 NIS"}}','{"Accept":"previous"}','{"Accept":"Salary"}','{"Reject":"previous"}','{"Reject":"Salary"}' ]).should.equal(true)
		_.isEqual(bars.generate_possible_labels([['Greet'],[],[true]]),[ '{"Greet":true}' ]).should.equal(true)
		_.isEqual(bars.generate_possible_labels([['Accept'],['Salary'],['20,000 NIS']]),[ '{"Accept":"Salary"}', '{"Accept":{"Salary":"20,000 NIS"}}' ]).should.equal(true)
	})
	
	it('correctly join labels', function() {
	_.isEqual(bars.join_labels([['1'],['3'],['5']],[['2'],['4'],['6']]), [ [ '1', '2' ], [ '3', '4' ], [ '5', '6' ] ]).should.equal(true)
	})

	it('resolve emptiness', function() {

		_.isEqual(bars.resolve_emptiness([['Reject'],[],[]]),[['Reject'],[],['true']]).should.equal(true)
		_.isEqual(bars.resolve_emptiness([['Accept'],[],[]]),[['Accept'],[],['true']]).should.equal(true)
		_.isEqual(bars.resolve_emptiness([[],[],['Without leased car']]),[['Offer'],['Leased Car'],['Without leased car']])


				_.isEqual(bars.resolve_emptiness([['Greet'],[],[]]), [ ['Greet' ],[  ],[ 'true' ] ]).should.equal(true)
		// _.isEqual(bars.resolve_emptiness([['Accept'],[],['20,000 NIS', 'QA']]), [ [ 'Accept', 'Offer' ],[ 'Salary', 'Job Description' ],[ '20,000 NIS', 'QA' ] ]).should.equal(true)
		// _.isEqual(bars.resolve_emptiness([[],[],['20,000 NIS']]), [['Offer'],['Salary'],['20,000 NIS']]).should.equal(true)
		// _.isEqual(bars.resolve_emptiness([['Accept'],[],[]]), [['Accept'],[],['previous']]).should.equal(false)
		// _.isEqual(bars.resolve_emptiness([['Insist'],[],[]]), [['Insist'],[],['previous']]).should.equal(false)
		// _.isEqual(bars.resolve_emptiness([['Offer'],[],[]]), [['Offer'],[],['previous']]).should.equal(false)
		console.log(bars.resolve_emptiness([['Offer'],[],["10%"]]))
		console.log(bars.semlang_ambiguity(['Offer','10%']))

	})
	
	it('correctly filter values', function() {
		_.isEqual(bars.filterValues([['Offer'],['Accept'],['accept'],['compromise']]), [['accept'],['compromise']]).should.be.true
	})

	it('resolve_emptiness_rule', function() {
		_.isEqual(bars.resolve_emptiness_rule([['Greet'],[],[]]), [['Greet'],[],[true]]).should.equal(true)
		_.isEqual(bars.resolve_emptiness_rule([['Accept'],[],[]]), [['Accept'],[],[true]]).should.equal(true)
		_.isEqual(bars.resolve_emptiness_rule([['Reject'],['Salary'],[]]), [['Reject'],['Salary'],[]]).should.equal(true)
		_.isEqual(bars.resolve_emptiness_rule([['Accept'],[],['120,000 USD']]), [['Accept'],['Salary'],['120,000 USD']]).should.equal(true)
		_.isEqual(bars.resolve_emptiness_rule([['Offer'],[],['10%']]), [['Offer'],['Pension Fund'],['10%']]).should.equal(true)
		_.isEqual(bars.resolve_emptiness_rule([['Offer'],[],[]]), [['Offer'],[],[]]).should.equal(true)
		})


	it('genlab', function() {
		_.isEqual(bars.generate_labels([['Query','Offer'],[],[]]),  [ '{"Query":"Offer"}' ]).should.be.true
		_.isEqual(bars.generate_labels([['Reject'],[],[]]),  [ '{"Reject":"true"}' ]).should.be.true
		_.isEqual(bars.generate_labels([['Accept'],[],[]]),  [ '{"Accept":"true"}' ]).should.be.true
		_.isEqual(bars.generate_labels([['Greet'],[],[]]),  [ '{"Greet":"true"}' ]).should.be.true
		// _.isEqual(bars.generate_labels([['Greet'],[],[]]),  [ '{"Greet":"true"}' ]).should.be.true
		_.isEqual(bars.generate_labels([['Offer'],['Pension Fund'],['10%']]),  [ '{"Offer":{"Pension Fund":"10%"}}' ]).should.be.true
		_.isEqual(bars.generate_labels([['Offer'],[],['10%']]),  [ '{"Offer":{"Pension Fund":"10%"}}' ]).should.be.true
		_.isEqual(bars.generate_labels([['Offer','Reject'],[],['10%']]), [ '{"Offer":{"Pension Fund":"10%"}}',
  '{"Reject":{"Pension Fund":"10%"}}' ]).should.be.true
		_.isEqual(bars.generate_labels([['Accept'],[],[]]), [ '{"Accept":"true"}' ]).should.be.true
	})


	it('correctly resolve emptiness', function() {
		var res = bars.filterreject([[ 'Reject', 'no..you', [0,1], {Reject:[Object]}], ['Accept','be programmer',[1,3], {Offer:[Object]}]])
		_.isEqual(res, [['Reject','no..you', [0,1],{Reject:[Object]}],['Reject','be programmer',[1,3],{Offer:[Object]}]])

		var res = bars.filterreject([[ 'Reject', 'no..you', [0,1], {Reject:[Object]}], ['Offer','be programmer',[1,3], {Offer:[Object]}]])
		_.isEqual(res, [['Reject','no..you', [0,1],{Reject:[Object]}],['Offer','be programmer',[1,3],{Offer:[Object]}]])

		var res = bars.filterreject([[ 'Reject', 'no..you', [0,1], {Reject:[Object]}], ['Offer','be programmer',[1,3], {Offer:[Object]}], ['Accept','be programmer',[1,3], {Accept:[Object]}]])
		_.isEqual(res, [['Reject','no..you', [0,1],{Reject:[Object]}],['Offer','be programmer',[1,3],{Offer:[Object]}],['Reject','be programmer',[1,3], {Reject:[Object]}]])
	})

	it('correctly connect Offers', function() {
	a  = [
        ["Offer"," I can go", [0,3]],
        ["Offer","12,000",[4,5]],
        ["Offer"," NIS with a fast promotion",[5,10]        ]
    	]


    a_tested =  [
    			["Offer","I can go",[0,3]],
    			["Offer","12,000  NIS with a fast promotion",[4,10]]
				]

	a_after = bars.aggreate_similar(a)

	// console.log(JSON.stringify(a_after, null, 4))
	// process.exit(0)
	// a = [ [ [ "Offer", "'start'", [ 0, 1 ], [ { "Offer": [ [ "bias", 0.032924794 ] ] } ] ], [ "Offer", "can wait but you", [ 2, 6 ], [ { "Offer": [ [ "can", 0.0673212107400951 ], [ "bias", 0.032924794 ] ] }, { "Offer": [ [ "bias", 0.032924794 ] ] }, { "Offer": [ [ "bias", 0.032924794 ], [ "but", 0.0018114377419201698 ] ] }, { "Offer": [ [ "bias", 0.032924794 ], [ "you", 0.026276993986689784 ] ] } ] ], [ "Offer", "'end'", [ 9, 10 ], [ { "Offer": [ [ "bias", 0.032924794 ] ] } ] ] ], [], [] ]
	
	// a_after = bars.aggreate_similar(a)

	// console.log(JSON.stringify(a_after, null, 4))
	// process.exit(0)

	// console.log(a_after)

	a_after[0].pop()
	a_after[1].pop()

	_.isEqual(a_tested, a_after).should.equal(true)
	})

	it('correctly filter accept', function() {

		var dataset = [{"input":"","output":["{\"Accept\":\"previous\"}","{\"Offer\":{\"Job Description\":\"Project Manager\"}}"]},
					   {"input":"","output":["{\"Offer\":{\"Salary\":\"20,000 NIS\"}}"]}]
		
		var f = bars.filteraccept(dataset)
		var gold = [{input: '',output: [ '{"Offer":{"Job Description":"Project Manager"}}' ] },
	  { input: '', output: [ '{"Offer":{"Salary":"20,000 NIS"}}' ] } ]
		
		_.isEqual(f, gold).should.equal(true)
	})

	it('correctly separate dataset', function() {
		bars.intersection([1,3],[2,5]).should.equal(true)
		bars.intersection([5,8],[1,2]).should.equal(false)
		bars.intersection([5,7],[5,7]).should.equal(true)
		bars.intersection([8,14],[1,9]).should.equal(true)
		bars.intersection([0,9],[0,10]).should.equal(true)

	})

	it('correctly separate dataset', function() {
		var dataset = [
					{"input":"","output":["{\"Accept\":\"previous\"}","{\"Offer\":{\"Job Description\":\"Project Manager\"}}"]},
					{"input":"","output":["{\"Offer\":{\"Salary\":\"20,000 NIS\"}}"]},
					{"input":"","output":["{\"Accept\":\"previous\"}"]},
					{"input":"done","output":["{\"Accept\":\"previous\"}", "{\"Offer\":{\"Salary\":\"12,000 NIS\"}}"]},
					{"input":"Leased car?","output":["{\"Accept\":\"previous\"}","{\"Offer\":{\"Leased Car\":\"With leased car\"}}"]}
					]

		var dt = bars.dividedataset(dataset)

		_.each(dt['one'], function(value, key, list){ 
			value['output'].length.should.equal(1)
		}, this)

		_.each(dt['two'], function(value, key, list){ 
			value['output'].length.should.not.be.below(2);
		}, this)

	})

	it('correctly separate dataset', function() {
		var str = "I reject 8 hours"
		var begin = bars.treatstring(9, str, 'first')
		var end = bars.treatstring(16, str, 'last')
		// console.log("begin "+begin)
		// console.log("end "+end)
		// a = a - 1
		// console.log(JSON.stringify(a, null, 4))
		// console.log(JSON.stringify(str.substring(0,a), null, 4))
	})

	it('currrr filters the fetures', function() {
		var intents = 
		[["Offer","",[0,4],[{
						"Offer": 
						[["a1",1],
	                    ["a2",0],
	                    ["a3",2]],

	                    "Accept": 
						[["a9",0],
	                    ["a7",0],
	                    ["a13",2]]
	            }]
	    ],
	    ["Reject","",[0,4],[{
						"Offer": 
						[["a4",1],
	                    ["a5",0],
	                    ["a6",0]]
	            }]
	    ]
	    ]

	    var filtered = bars.filterzerofeatures(intents)

	    // console.log(JSON.stringify(filtered, null, 4))

	    _.isEqual(filtered, [["Offer","",[0,4],[{"Offer": [["a1",1],["a3",2]], "Accept": [["a13",2]]}]],
        ["Reject","",[0,4],[{"Offer": [[ "a4",1]]}]]])
	    
    })

    it('buildlabels', function() {

    	var dep = [ { num: '1',
    word: 'i',
    lemma: 'i',
    pos: 'FW',
    pos1: 'FW',
    root: '3',
    role: 'nsubj' },
  { num: '2',
    word: 'can',
    lemma: 'can',
    pos: 'MD',
    pos1: 'MD',
    root: '3',
    role: 'aux' },
  { num: '3',
    word: 'offer',
    lemma: 'offer',
    pos: 'VB',
    pos1: 'VB',
    root: '0',
    role: 'root' },
  { num: '4',
    word: 'slow',
    lemma: 'slow',
    pos: 'JJ',
    pos1: 'JJ',
    root: '6',
    role: 'amod' },
  { num: '5',
    word: 'promotion',
    lemma: 'promotion',
    pos: 'NN',
	pos1: 'NN',
    root: '6',
    role: 'nn' },
  { num: '6',
    word: 'track',
    lemma: 'track',
    pos: 'NN',
    pos1: 'NN',
    root: '3',
    role: 'dobj' },
  { num: '7',
    word: 'but',
    lemma: 'but',
    pos: 'CC',
    pos1: 'CC',
    root: '6',
    role: 'cc' },
  { num: '8',
    word: 'no',
    lemma: 'no',
    pos: 'DT',
    pos1: 'DT',
    root: '9',
    role: 'det' },
  { num: '9',
    word: 'car',
    lemma: 'car',
    pos: 'NN',
    pos1: 'NN',
    root: '6',
    role: 'conj' } ]

    var rule = [
    [
        [
            "Promotion Possibilities",
            "promotion",
            [
                4,
                4
            ],
            [
                17,
                26
            ]
        ],
        [
            "Leased Car",
            "car",
            [
                8,
                8
            ],
            [
                40,
                43
            ]
        ]
    ],
	[
        [
            "Slow promotion track",
            "slow",
            [
                3,
                3
            ],
            [
                12,
                16
            ]
        ],
        [
            "Without leased car",
            "car",
            [
                8,
                8
            ],
            [
                -1,
                -1
            ]
        ]
    ]
]

	var intents = [
    [
        "Offer",
        "i can offer+ but",
        [
            0,
            4
        ],
        [
            {
                "Offer": [
                ]
            }
        ]
    ],
    [
        "Reject",
        "no",
        [
            4,
            5
        ],
		{
            "Reject": [
            ]
        }
    ]
]

	var results = bars.buildlabel(rule,dep,intents)
	//console.log(results)
	//process.exit(0)

    })


})
