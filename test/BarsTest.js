/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

var should = require('should');
var bars = require('../utils/bars');
var _ = require('underscore');


describe('Bars utilities', function() {
	
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
		_.isEqual(bars.semlang_ambiguity(['Accept', '20,000 NIS']), []).should.equal(true)
		_.isEqual(bars.semlang_ambiguity(['20,000 NIS']), [[['Offer'],['Salary'],['20,000 NIS']]]).should.equal(true)
		bars.semlang_ambiguity(['previous']).length.should.equal(4)
	})

	it('correctly generate labels', function() {
		_.isEqual(bars.generate_possible_labels([ [ 'Accept' ], [''], [ 'previous' ] ]), [ '{"Accept":"previous"}' ]).should.equal(true)
		_.isEqual(bars.generate_possible_labels([['Offer'],['Salary'],['10,000 NIS']]),['{"Offer":{"Salary":"10,000 NIS"}}'])
		_.isEqual(bars.generate_possible_labels([['Offer'],['Salary'],['20,000 NIS']]), [ '{"Offer":{"Salary":"20,000 NIS"}}' ]).should.equal(true)
		_.isEqual(bars.generate_possible_labels([['Offer', 'Accept', 'Reject', 'Greet'],['Salary', 'Job description'],['20,000 NIS','previous']]),[ '{"Offer":{"Salary":"20,000 NIS"}}','{"Accept":"previous"}','{"Accept":"Salary"}','{"Reject":"previous"}','{"Reject":"Salary"}' ]).should.equal(true)
		_.isEqual(bars.generate_possible_labels([['Greet'],[],[true]]),[ '{"Greet":true}' ]).should.equal(true)
	})
	
	it('correctly join labels', function() {
	_.isEqual(bars.join_labels([['1'],['3'],['5']],[['2'],['4'],['6']]), [ [ '1', '2' ], [ '3', '4' ], [ '5', '6' ] ]).should.equal(true)
	})

	it('correctly resolve emptiness', function() {
		_.isEqual(bars.resolve_emptiness([[],[],['Without leased car']]),[['Offer'],['Leased Car'],['Without leased car']])
		_.isEqual(bars.resolve_emptiness([['Greet'],[],[]]), [ ['Greet' ],[  ],[ true ] ]).should.equal(true)
		_.isEqual(bars.resolve_emptiness([['Accept'],[],['20,000 NIS', 'QA']]), [ [ 'Accept', 'Offer' ],[ 'Salary', 'Job Description' ],[ '20,000 NIS', 'QA' ] ]).should.equal(true)
		_.isEqual(bars.resolve_emptiness([[],[],['20,000 NIS']]), [['Offer'],['Salary'],['20,000 NIS']]).should.equal(true)
		_.isEqual(bars.resolve_emptiness([['Accept'],[],[]]), [['Accept'],[],['previous']]).should.equal(false)
		_.isEqual(bars.resolve_emptiness([['Insist'],[],[]]), [['Insist'],[],['previous']]).should.equal(false)
		_.isEqual(bars.resolve_emptiness([['Offer'],[],[]]), [['Offer'],[],['previous']]).should.equal(false)

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


})
