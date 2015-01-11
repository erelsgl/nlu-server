/*
	This module was created as a utils for limdu, many of the routines were copied from train.js of nlu-server.
	The main function of the following methods is helping to represent the analysis of given data.
	This module contains: 
		* the hierarchical representation of the labels.
		* routines for aggregating statistics after cross - validation.
		* routine for building confusion matrix.
		* auxiliary routine for building table in html format.
		* routine for building intent attribute distribution.
		* etc.

	@author Vasily Konovalov
 */
var s = require('net').Socket();
var Fiber = require('fibers');
var natural = require('natural');
var execSync = require('execSync')
var _ = require('underscore')._;
var fs = require('fs');
var multilabelutils = require('limdu/classifiers/multilabel/multilabelutils');
var DefaultDict = require('defaultdict')
var Hierarchy = require('../Hierarchy');

var limdu = require("limdu");
var ftrs = limdu.features

var splitJson = Hierarchy.splitJson
var joinJson = Hierarchy.joinJson

var splitJsonRecursive = Hierarchy.splitJsonRecursive
var splitPartEqually = Hierarchy.splitPartEqually
var splitPartEqually1 = Hierarchy.splitPartEqually1

var joinJsonRecursive = Hierarchy.joinJsonRecursive

var regexpNormalizer = ftrs.RegexpNormalizer(
    JSON.parse(fs.readFileSync(__dirname+'/../knowledgeresources/BiuNormalizations.json')));

var stopwords = loadstopwords(__dirname+"/../stopwords")

var ValueTransition =
{
	"8 hours": "8",
	"9 hours": "9",
	"10 hours": "10",
	"7,000 NIS": "7000",
	"12,000 NIS": "12000",
	"20,000 NIS": "20000",
	"0%": "0%",
	"10%": "10%",
	"20%": "20%",
	"Fast promotion track": "fast",
	"Slow promotion track": "slow"
} 


semlang = [ 

  '{"Offer":{"Leased Car":"With leased car"}}',
  '{"Offer":{"Leased Car":"No agreement"}}',
  '{"Offer":{"Leased Car":"Without leased car"}}',
  '{"Offer":{"Working Hours":"8 hours"}}',
  '{"Offer":{"Working Hours":"9 hours"}}',
  '{"Offer":{"Working Hours":"10 hours"}}',
  '{"Offer":{"Job Description":"Project Manager"}}',
  '{"Offer":{"Job Description":"Programmer"}}',
  '{"Offer":{"Job Description":"QA"}}',  
  '{"Offer":{"Job Description":"Team Manager"}}',
  '{"Offer":{"Salary":"7,000 NIS"}}',
  '{"Offer":{"Salary":"10,000 NIS"}}',
  '{"Offer":{"Salary":"12,000 NIS"}}',
  '{"Offer":{"Salary":"20,000 NIS"}}',
  '{"Offer":{"Pension Fund":"0%"}}',
  '{"Offer":{"Pension Fund":"10%"}}',
  '{"Offer":{"Pension Fund":"20%"}}',
  '{"Offer":{"Pension Fund":"No agreement"}}',
  '{"Offer":{"Promotion Possibilities":"Fast promotion track"}}',
  '{"Offer":{"Promotion Possibilities":"Slow promotion track"}}',

  '{"Accept":{"Leased Car":"With leased car"}}',
  '{"Accept":{"Leased Car":"No agreement"}}',
  '{"Accept":{"Leased Car":"Without leased car"}}',
  '{"Accept":{"Working Hours":"8 hours"}}',
  '{"Accept":{"Working Hours":"9 hours"}}',
  '{"Accept":{"Working Hours":"10 hours"}}',
  '{"Accept":{"Job Description":"Project Manager"}}',
  '{"Accept":{"Job Description":"Programmer"}}',
  '{"Accept":{"Job Description":"QA"}}',  
  '{"Accept":{"Job Description":"Team Manager"}}',
  '{"Accept":{"Salary":"7,000 NIS"}}',
  '{"Accept":{"Salary":"10,000 NIS"}}',
  '{"Accept":{"Salary":"12,000 NIS"}}',
  '{"Accept":{"Salary":"20,000 NIS"}}',
  '{"Accept":{"Pension Fund":"0%"}}',
  '{"Accept":{"Pension Fund":"10%"}}',
  '{"Accept":{"Pension Fund":"20%"}}',
  '{"Accept":{"Pension Fund":"No agreement"}}',
  '{"Accept":{"Promotion Possibilities":"Fast promotion track"}}',
  '{"Accept":{"Promotion Possibilities":"Slow promotion track"}}',

  '{"Accept":"Salary"}',
  '{"Accept":"previous"}',
  '{"Accept":"Leased Car"}',
  '{"Accept":"Pension Fund"}',
  '{"Accept":"Working Hours"}',
  '{"Accept":"Job Description"}',
  '{"Accept":"Promotion Possibilities"}',
  
  '{"Reject":{"Leased Car":"With leased car"}}',
  '{"Reject":{"Leased Car":"No agreement"}}',
  '{"Reject":{"Leased Car":"Without leased car"}}',
  '{"Reject":{"Working Hours":"8 hours"}}',
  '{"Reject":{"Working Hours":"9 hours"}}',
  '{"Reject":{"Working Hours":"10 hours"}}',
  '{"Reject":{"Job Description":"Project Manager"}}',
  '{"Reject":{"Job Description":"Programmer"}}',
  '{"Reject":{"Job Description":"QA"}}',  
  '{"Reject":{"Job Description":"Team Manager"}}',
  '{"Reject":{"Salary":"7,000 NIS"}}',
  '{"Reject":{"Salary":"10,000 NIS"}}',
  '{"Reject":{"Salary":"12,000 NIS"}}',
  '{"Reject":{"Salary":"20,000 NIS"}}',
  '{"Reject":{"Pension Fund":"0%"}}',
  '{"Reject":{"Pension Fund":"10%"}}',
  '{"Reject":{"Pension Fund":"20%"}}',
  '{"Reject":{"Pension Fund":"No agreement"}}',
  '{"Reject":{"Promotion Possibilities":"Fast promotion track"}}',
  '{"Reject":{"Promotion Possibilities":"Slow promotion track"}}',

  '{"Reject":"previous"}',
  '{"Reject":"Salary"}',
  '{"Reject":"Leased Car"}',
  '{"Reject":"Working Hours"}',
  '{"Reject":"Pension Fund"}',
  '{"Reject":"Job Description"}',
  '{"Reject":"Promotion Possibilities"}',

  '{"Append":"previous"}',
  '{"Insist":"Working Hours"}',
  '{"Insist":"Job Description"}',
  

  '{"Query":"accept"}',
  '{"Greet":true}',
  '{"Quit":true}',
  '{"Query":"issues"}',
  '{"Query":"Salary"}',
  '{"Query":"compromise"}',
  '{"Query":"Job Description"}',
  '{"Insist":"previous"}',
  '{"Insist":"Salary"}',
  '{"Query":"Leased Car"}',
  '{"Insist":"Promotion Possibilities"}',
  '{"Query":"Promotion Possibilities"}',
  // '{"Offer":{"Salary":"10,000 NIS"}}',
  '{"Query":"Working Hours"}',
  '{"Insist":"Pension Fund"}',
  '{"Query":"bid"}',
  '{"Query":"Pension Fund"}',
  '{"Insist":"Leased Car"}' ]


// semlang = [ '{"Reject":"previous"}',
//   '{"Append":"previous"}',
//   '{"Offer":{"Leased Car":"With leased car"}}',
//   '{"Accept":{"Leased Car":"With leased car"}}',
//   '{"Reject":{"Leased Car":"With leased car"}}',
//   '{"Reject":"Salary"}',
//   '{"Offer":{"Working Hours":"9 hours"}}',
//   '{"Accept":{"Working Hours":"9 hours"}}',
//   '{"Reject":{"Working Hours":"9 hours"}}',
//   '{"Insist":"Job Description"}',
//   '{"Offer":{"Job Description":"Programmer"}}',
//   '{"Accept":{"Job Description":"Programmer"}}',
//   '{"Reject":{"Job Description":"Programmer"}}',
//   '{"Offer":{"Working Hours":"10 hours"}}',
//   '{"Accept":{"Working Hours":"10 hours"}}',
//   '{"Reject":{"Working Hours":"10 hours"}}',
//   '{"Reject":"Leased Car"}',
//   '{"Offer":{"Leased Car":"No agreement"}}',
//   '{"Offer":{"Leased Car":"Without leased car"}}',
//   '{"Accept":{"Leased Car":"Without leased car"}}',
//   '{"Reject":{"Leased Car":"Without leased car"}}',
//   '{"Accept":"Salary"}',
//   '{"Insist":"Working Hours"}',
//   '{"Offer":{"Promotion Possibilities":"Slow promotion track"}}',
//   '{"Accept":{"Promotion Possibilities":"Slow promotion track"}}',
//   '{"Reject":{"Promotion Possibilities":"Slow promotion track"}}',
//   '{"Accept":"previous"}',
//   '{"Offer":{"Working Hours":"8 hours"}}',
//   '{"Accept":{"Working Hours":"8 hours"}}',
//   '{"Reject":{"Working Hours":"8 hours"}}',
//   '{"Offer":{"Job Description":"Project Manager"}}',
//   '{"Accept":{"Job Description":"Project Manager"}}',
//   '{"Reject":{"Job Description":"Project Manager"}}',
//   '{"Offer":{"Salary":"7,000 NIS"}}',
//   '{"Accept":{"Salary":"7,000 NIS"}}',
//   '{"Reject":{"Salary":"7,000 NIS"}}',
//   '{"Offer":{"Salary":"10,000 NIS"}}',
//   '{"Accept":{"Salary":"10,000 NIS"}}',
//   '{"Reject":{"Salary":"10,000 NIS"}}',
//   '{"Offer":{"Pension Fund":"10%"}}',
//   '{"Accept":{"Pension Fund":"10%"}}',
//   '{"Reject":{"Pension Fund":"10%"}}',
//   '{"Offer":{"Promotion Possibilities":"Fast promotion track"}}',
//   '{"Accept":{"Promotion Possibilities":"Fast promotion track"}}',
//   '{"Reject":{"Promotion Possibilities":"Fast promotion track"}}',
//   '{"Offer":{"Salary":"12,000 NIS"}}',
//   '{"Accept":{"Salary":"12,000 NIS"}}',
//   '{"Reject":{"Salary":"12,000 NIS"}}',
//   '{"Offer":{"Pension Fund":"0%"}}',
//   '{"Accept":{"Pension Fund":"0%"}}',
//   '{"Reject":{"Pension Fund":"0%"}}',
//   '{"Offer":{"Job Description":"QA"}}',
//   '{"Accept":{"Job Description":"QA"}}',
//   '{"Reject":{"Job Description":"QA"}}',
//   '{"Query":"accept"}',
//   '{"Greet":true}',
//   '{"Offer":{"Pension Fund":"20%"}}',
//   '{"Accept":{"Pension Fund":"20%"}}',
//   '{"Reject":{"Pension Fund":"20%"}}',
//   '{"Offer":{"Job Description":"Team Manager"}}',
//   '{"Accept":{"Job Description":"Team Manager"}}',
//   '{"Reject":{"Job Description":"Team Manager"}}',
//   '{"Quit":true}',
//   '{"Query":"issues"}',
//   '{"Query":"Salary"}',
//   '{"Query":"compromise"}',
//   '{"Query":"Job Description"}',
//   '{"Reject":"Working Hours"}',
//   '{"Accept":"Leased Car"}',
//   '{"Accept":"Pension Fund"}',
//   '{"Reject":"Pension Fund"}',
//   '{"Insist":"previous"}',
//   '{"Insist":"Salary"}',
//   '{"Query":"Leased Car"}',
//   '{"Reject":"Job Description"}',
//   '{"Reject":"Promotion Possibilities"}',
//   '{"Offer":{"Salary":"20,000 NIS"}}',
//   '{"Accept":{"Salary":"20,000 NIS"}}',
//   '{"Reject":{"Salary":"20,000 NIS"}}',
//   '{"Accept":"Working Hours"}',
//   '{"Accept":"Job Description"}',
//   '{"Insist":"Promotion Possibilities"}',
//   '{"Query":"Promotion Possibilities"}',
//   // '{"Offer":{"Salary":"10,000 NIS"}}',
//   '{"Query":"Working Hours"}',
//   '{"Insist":"Pension Fund"}',
//   '{"Query":"bid"}',
//   '{"Accept":"Promotion Possibilities"}',
//   '{"Query":"Pension Fund"}',
//   '{"Offer":{"Pension Fund":"No agreement"}}',
//   '{"Insist":"Leased Car"}' ]

newsemlang = [ '{"Reject":null}',
  '{"Append":null}',
  '{"Offer":{"Leased Car":"With leased car"}}',
  '{"Reject":"Salary"}',
  '{"Reject":"Leased Car"}',
  '{"Offer":{"Leased Car":"With leased car"}}',
  '{"Offer":{"Working Hours":"9 hours"}}',
  '{"Insist":"Job Description"}',
  '{"Offer":{"Job Description":"Programmer"}}',
  '{"Offer":{"Working Hours":"10 hours"}}',
  '{"Offer":{"Leased Car":"No agreement"}}',
  '{"Offer":{"Leased Car":"Without leased car"}}',
  '{"Accept":null}',
  '{"Accept":"Salary"}',
  '{"Insist":"Working Hours"}',
  '{"Offer":{"Promotion Possibilities":"Slow promotion track"}}',
  '{"Offer":{"Working Hours":"8 hours"}}',
  '{"Offer":{"Job Description":"Project Manager"}}',
  '{"Offer":{"Salary":"7,000 NIS"}}',
  '{"Offer":{"Salary":"10,000 NIS"}}',
  '{"Offer":{"Pension Fund":"10%"}}',
  '{"Offer":{"Promotion Possibilities":"Fast promotion track"}}',
  '{"Offer":{"Salary":"12,000 NIS"}}',
  '{"Offer":{"Pension Fund":"0%"}}',
  '{"Offer":{"Job Description":"QA"}}',
  '{"Query":"accept"}',
  '{"Greet":null}',
  '{"Offer":{"Pension Fund":"20%"}}',
  '{"Offer":{"Job Description":"Team Manager"}}',
  '{"Quit":null}',
  '{"Query":"issues"}',
  '{"Query":"Salary"}',
  '{"Query":"compromise"}',
  '{"Query":"Job Description"}',
  '{"Reject":"Working Hours"}',
  '{"Accept":"Leased Car"}',
  '{"Accept":"Pension Fund"}',
  '{"Reject":"Pension Fund"}',
  '{"Insist":"previous"}',
  '{"Insist":"Salary"}',
  '{"Query":"Leased Car"}',
  '{"Reject":"Job Description"}',
  '{"Reject":"Promotion Possibilities"}',
  '{"Offer":{"Salary":"20,000 NIS"}}',
  '{"Accept":"Working Hours"}',
  '{"Accept":"Job Description"}',
  '{"Insist":"Promotion Possibilities"}',
  '{"Query":"Promotion Possibilities"}',
  // '{"Offer":{"Salary":"10,000 NIS"}}',
  '{"Query":"Working Hours"}',
  '{"Insist":"Pension Fund"}',
  '{"Query":"bid"}',
  '{"Accept":"Promotion Possibilities"}',
  '{"Query":"Pension Fund"}',
  '{"Offer":{"Pension Fund":"No agreement"}}',
  '{"Insist":"Leased Car"}' ]


Itents = ['Offer', 'Accept', 'Reject', 'Insist', 'QueryYN', 'QueryWH']
IntentsSingle = ['Greet', 'Quit']
Attributes = ['Salary', 'Pension Fund', 'Working Hours', 'Promotion Possibilities', 'Job Description', 'Leased Car']
Values = {'Salary': ['7000','10000','12000'],
		  'Pension Fund': ['10','15','20'],
		  'Promotion Possibilities': ['fast','slow'],
		  'Working Hours': ['8','9','10'],
		  'Job description': ['QA','Programmer','Team Manager','Project Manager']
		}

labeltree = { Offer: 
   { Salary: { '12,000 NIS': {}, '7,000 NIS': {}, '20,000 NIS': {} },
     'Job Description': 
      { QA: {},
        'Team Manager': {},
        Programmer: {},
        'Project Manager': {} },
     'Pension Fund': { '10%': {}, '0%': {}, '20%': {}, 'No agreement': {} },
     'Working Hours': { '10 hours': {}, '9 hours': {}, '8 hours': {} },
     'Promotion Possibilities': { 'Fast promotion track': {}, 'Slow promotion track': {} },
     'Leased Car': 
      { 'Without leased car': {},
        'With leased car': {},
        'No agreement': {} } },
  Insist: 
   { 'Pension Fund': {},
     'Working Hours': {},
     previous: {},
     'Job Description': {},
     'Promotion Possibilities': {},
     Salary: {},
     'Leased Car': {} },
  Greet: { true: {} },
  Reject: 
   { Salary: {},
     'Leased Car': {},
     previous: {},
     'Pension Fund': {},
     'Job Description': {},
     'Working Hours': {},
     'Promotion Possibilities': {} },
  Accept: 
   { previous: {},
     Salary: {},
     'Pension Fund': {},
     'Working Hours': {},
     'Leased Car': {},
     'Job Description': {},
     'Promotion Possibilities': {} },
  Query: 
   { 'Job Description': {},
     accept: {},
     compromise: {},
     bid: {},
     'Working Hours': {},
     'Leased Car': {},
     'Pension Fund': {},
     Salary: {},
     issues: {},
     'Promotion Possibilities': {} },
  Append: { previous: {} },
  Quit: { true: {} } }

function returnValues()
{

}

/*

[ [ 'Accept', 'i agree+ to with', [ 0, 4 ] ] ]

rules : [
    [
        [
            "Working Hours",
            "hours",
            [
                4,
                4
            ],
            [
                11,
                16
            ]
        ]
    ],
    [
        [
            "8 hours",
            "8",
            [
                3,
                3
            ],
            [
                9,
                10
            ]
        ],

depparsed: [
    {
        "num": "1",
        "word": "i",
        "lemma": "i",
        "pos": "FW",
        "pos1": "FW",
        "root": "3",
        "role": "nsubj"
    },


        */

function uniqueArray(array)
{
  var output = []
  _.each(array, function(elem, key, list){
    var pos = _.filter(output, function(num){ return _.isEqual(num, elem) });
    if (pos.length == 0)
        output.push(elem)
  }, this)
  return output
}

function buildlabel(ruled, depparse, intents)
{

  var output = []
  // console.log("beg")
  _.each(intents, function(intent, key1, list1){ 
    var intfound = false
    // console.log(intent)
    var intentbegin = intent[2][0] + 1
    var intentend = intent[2][1] + 1
    _(3).times(function(n){
      // console.log("times")
      // console.log(n)
      _.each(ruled[n], function(value, key, list){ 
          // console.log(value)
          var begin = value[2][0] + 1
          var end = value[2][1] + 1
          var found = false
          while (depparse[begin-1]['role']!='root') {
            // var next = _.findWhere(depparse, {"num": begin})
            // console.log(next)
            // begin = depparse[next]['root']
            // console.log(begin)
            if ((begin >= intentbegin) && (begin <= intentend))
              found = true
            begin = depparse[begin-1]['root']
            intfound = found
          }
          if (found)
            if (n==0)
              output.push([[intent[0]],[value[0]], []])
            if (n==1)
              output.push([[intent[0]],[],[value[0]]])
      }, this)
    })

  if (intfound == false)
    output.push([[intent[0]],[],[]])
  }, this)

  return output
}


function labelFilter(labels)
{
    // var lab = splitPartEqually(multilabelutils.normalizeOutputLabels(semval))
        // if (_.isEqual([intent,value],_.flatten(lab)))
  var output = []
  _.each(labels, function(orlabel, key, list){
    label = (splitPartEqually(multilabelutils.normalizeOutputLabels(JSON.parse(orlabel))))
    var champion = true
    _.each(labels, function(orlabel1, key1, list1){ 
      label1 = (splitPartEqually(multilabelutils.normalizeOutputLabels(JSON.parse(orlabel1))))
      if (key != key1)
        {
          // console.log("ocompare")
          // console.log(label)
          // console.log(label1)
          // console.log(label[0][0] == label1[0][0])
          // console.log(label[1][0] == label1[1][0])
          // console.log(label[2].length == 0)
          // console.log(label1[2].length != 0)
          if ((label[0][0] == label1[0][0]) && (label[1][0] == label1[1][0]) && (label[2].length == 0) && (label1[2].length != 0))
            {
            // console.log("trigger")
            champion = false
            }
        }
    }, this)  
    if (champion == true) output.push(orlabel)
  }, this)
  // console.log(output)
  // process.exit(0)
  return output
}

function treatstring(num, str, ind)
{
	if (num == 0) return num
	if (str[num] == " ") return num

		// console.log(str[num])
	if (str[num-1] != " ")
		{	
		var findex = num - str.substring(0, num).lastIndexOf(" ")
		var lindex = str.substring(num).indexOf(" ")
		// console.log("findex"+findex)
		// console.log("lindex"+lindex)

		if (ind == 'last')
			if (findex > lindex)
				return num + lindex + 1
			else
				return num - findex

		if (ind == 'first')
			if (findex > lindex)
				return num - findex
			else
				return num + lindex
		}

	return num
}
// { sentence: 'I said without leased car',
    // input: 'without leased car',
    // output: 'Without leased car' },
function convert_to_train(data)
{
	var newdataset = []
	_.each(data, function(value, key, list){ 
		_.each(value['output']['single_labels'], function(value1, key1, list){ 
			if (value1['position'][0].length != 0)
			_.each(value1['position'], function(value3, key3, list){
				// console.log(JSON.stringify(value3, null, 4))
				// console.log(JSON.stringify("INP", null, 4)) 
				// console.log(JSON.stringify(value['input'], null, 4))
				// console.log(JSON.stringify(value['input'][value3[0]], null, 4))
				// console.log(JSON.stringify(value['input'][value3[1]+1], null, 4))
				var sttt = value['input'].substring(treatstring(value3[0],value['input'], 'first'),treatstring(value3[1]+1,value['input'], 'last')).trim()
				if (sttt.length > 0)
					newdataset.push({
								'sentence': value['input'],
								'input': value['input'].substring(treatstring(value3[0],value['input'], 'first'),treatstring(value3[1]+1,value['input'], 'last')).trim(),
								'output': key1})
				// console.log(JSON.stringify({'input': value['input'].substring(value3[0],value3[1]+1),
								// 'output': key1}, null, 4))
			}, this)
		}, this)
	}, this)
	return newdataset
}

function convert_to_test(data)
{
	// var test = []

	_.each(data, function(record, key, list){ 
		_.each(record['output']['single_labels'], function(value1, key1, list1){
			if (value1['position'][0].length > 0)
				_.each(value1['position'], function(value2, key2, list2){
					if (value2[0]!=0) value2[0] = value2[0] + 1
					var str = record['input'].substr(0,value2[0])
					var spaces = str.split(" ")
					var innerspace = record['input'].substring(value2[0],value2[1] + 1).trim().split(" ")
					// console.log("str_before "+str)
					// console.log("inner text "+ innerspace)
					// console.log("coord:"+value2)
					// console.log("inner original:" +record['input'].substring(value2[0],value2[1] + 1))
					// console.log("spaces_start "+spaces.length)
					// console.log("inner_space"+ innerspavbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbce.length)
					data[key]['output']['single_labels'][key1]['position'][key2] = [spaces.length, spaces.length + innerspace.length]
			 	}, this) 
		}, this)
		// console.log(JSON.stringify(record, null, 4))
	}, this)

// console.log("DATA")
// console.log(JSON.stringify(data, null, 4))
// console.log()
// process.exit(0)
	return data
}

function intersection(begin, end)
{
	if ((begin[0]<=end[0])&&(begin[1]>=end[0]))
		return true
	if ((begin[0]>=end[0])&&(begin[0]<=end[1]))
		return true
	return false
}

function extractactual(data)
{
	// if (data.length == 0) return []
	var acdata = []
	_.each(data['explanation'], function(value, key, list){ 
		// console.log(value)
		// process.exit(0)
		acdata.push([value[0],value[2]])
	}, this)
	return acdata
}

function sequencetest(original)
{
	var classes = []
	_.each(original['single_labels'], function(value, key, list){ 
		if (_.flatten(value['position']).length > 0)
			classes.push(key)
	}, this)
	return classes
}

function deal(classes, classifier, parts, explanations, original)
{
	// console.log(parts)
	// console.log(JSON.stringify(classes, null, 4))
	// console.log(JSON.stringify(explanations, null, 4))
	// console.log(JSON.stringify(original, null, 4))

	var convertedexp = []
	_.each(explanations, function(value, key, list){ 
		value[1] = value[1].replace(" 'end'", "")
		value[1] = value[1].replace("'start' ", "")
		convertedexp.push([value[0],[parts.indexOf(value[1]), parts.indexOf(value[1])+value[1].length]])
	}, this)

	// console.log(convertedexp)
	var classes = []
	_.each(convertedexp, function(value, key, list){ 
		if (value[0] in original['single_labels'])
			_.each(original['single_labels'][value[0]]['position'], function(value1, key, list){ 
				if (intersection(value1, value[1]))
					classes.push(value[0])
			}, this)
	}, this)

	return classes
	// console.log(classes)
	// process.exit(0)
}

function average(list)
	{
		var sum = _.reduce(list, function(memo, num){ return memo + num; }, 0);
		return sum/list.length
	}

function extractturnssingle(dataset)
	{
		data = []
		_.each(dataset, function(value, key, list){ 
			_.each(value['turns'], function(set, key1, list1){ 

				if ('output' in set)
					{
					_.each(set['parts'], function(value2, key2, list2){ 
						// if (value2['input'].split(" ").length > 3)
						data.push({'input': value2['input'], 'output': value2['output']})
					}, this)
					}
				}, this)
		}, this)
		return data
	}

/*
extract only active turns from dataset that active
*/
// set['input'] = set['input'].replace(/[^\x00-\x7F]/g, "")

function filterturn(turn)
{
  if ('intent_keyphrases_rule' in turn)
  {
    if (turn['output'].length > 0)
    {
     if (Object.keys(turn['intent_keyphrases_rule']).length > 0) 
      return turn
    }
    else
      return turn
  }
  else
    return turn

return []
}

function isactivedialogue(dial)
{
    if ('status' in dial)
    {
      if (_.isArray(dial['status']))
        {
          if (dial['status'].indexOf('goodconv') != -1)
            return true
          else
            return false
        }
      if (_.isString(dial['status']))
        { 
          if (dial['status'] == 'goodconv')
            return true
        }
        return false
    }
  else return true
}


function ispermittedturn(turn)
{
  var permitted = true
  var forbid = ['Query', 'compromise', 'accept', 'Leased Car']
  var output = []
  _.each(turn['output'], function(label, key, list){ 
    var lablist = splitJson(label)
      output = output.concat(lablist)  
  }, this)

  var match = _.filter(output, function(elem){ return forbid.indexOf(elem) != -1; });
  if (match.length != 0)
    permitted = false

  if ('intent_keyphrases_rule' in turn)
  {
    if ('Offer' in turn['intent_keyphrases_rule'])
    {
      if (turn['intent_keyphrases_rule']['Offer'] == 'DEFAULT INTENT')
        permitted = false    
    }
  }
  return permitted
}

function isactiveturn(turn)
{
  if ('status' in turn)
  {
    if (_.isArray(turn['status']))
      if (turn['status'].indexOf('active') != -1)
        return true
      else
        return false
    else
      if (turn['status'] == 'active')
        return true
      else
        return false
    return false
  }
  else
  {
    return false
  }
}

function ishumanturn(turn)
{
  if ('user' in turn)
  {
    if (turn['user'].match(/Agent/g) == undefined )
      return true
    else
      return false
  }
  else
    return true
} 

function isseqturn(turn)
{
  if ('intent_keyphrases_rule' in turn)
  {
    if (('output' in turn) && (_.isArray(turn['output'])) == true)
      {
        return true
      }
    else
      return false
  }
  else
    return false
}

function extractturns(dataset)
{
  var data = []
    _.each(dataset, function(dial, key, list){ 
      _.each(dial['turns'], function(turn, keyt, listt){
        // if (isactivedialogue(dial) && isactiveturn(turn) &&
                  // ishumanturn(turn) && isseqturn(turn) && ispermittedturn(turn))

      
          // ishumanturn(turn) && isseqturn(turn))
          data.push(turn) 
      }, this)
    }, this)
  return data
}

function extractturnsold(dataset)
	{
		data = []
		_.each(dataset, function(value, key, list){ 
        if ('status' in value)
          {
          if (value['status'].indexOf("goodconv") != -1)
            {
        			_.each(value['turns'], function(set, key, list){ 
                if (set['user'].match(/Agent/g) == undefined)
                {
          				if (('output' in set) && (_.isArray(set['output'])) == true)
                    if ('status' in set)
                      {
                        if (_.isArray(set['status'] == true))
                        {
                          if (set['status'].indexOf("active") != -1)
                            data.push(filterturn(set))
                          else
                            data.push(filterturn(set))
                        }
                        else
                        {
                          if (set['status'] == 'active')
                            data.push(filterturn(set))
                        }
                      }
                    else
                      data.push(filterturn(set))
                }
        			}, this)
            }
          }
          else
          {
            _.each(value['turns'], function(set, key, list){ 
                  if (('output' in set) && (_.isArray(set['output'])) == true)
                    if ('status' in set)
                      {
                        if (_.isArray(set['status'] == true))
                        {
                          if (set['status'].indexOf("active") != -1)
                            data.push(filterturn(set))
                        }
                        else
                        {
                          if (set['status'] == 'active')
                            data.push(filterturn(set))
                        }
                      }
                    else
                      data.push(filterturn(set))
              }, this)
          }
		}, this)

		return _.compact(_.flatten(data))
	}

// function extractkeyphrasesgold(dataset)
//   {
//     data = []
//     _.each(dataset, function(value, key, list){ 
//       _.each(value['turns'], function(set, key, list){ 
//         if ('intent_keyphrases_gold' in set)
//           data.push(set[''])
//         }, this)
//     }, this)
//     return data
//   }


function isDialogue(dataset)
	{
		if (dataset.length == 0)
			return false

		if ("id" in dataset[0])
			return true
		else
			return false
	}


function comparelabels(labels1, labels2)
{


	var result = []
	_.each(labels1, function(value, key, list){ 
		if (key in labels2)
			{
			result.push([key, ((value['F1']!=-1) ? value['F1'] : 0) - ((labels2[key]['F1'] != -1) ? labels2[key]['F1'] : 0), value['TP']+value['FN']])
			}
			// result[key] = value['F1'] - labels2[key]['F1']
	}, this)

	result = _.sortBy(result, function(num){ return num[1];})
	result = _.filter(result, function(num){ return num[1]!=0 });

	return result
}

function filteraccept(dataset)
	{
	// var datasetfiltered = []
	_.each(dataset, function(value, key, list){ 
		// var bo = true
		var labels = []
		_.each(value['output'], function(value1, key1, list1){
			if (value1.indexOf("previous") == -1)
				// bo = false
				labels.push(value1)
		}, this)
		// if (bo)
			// datasetfiltered.push(value)
		dataset[key]['output'] = labels
	}, this)
	return dataset
	}
function sentenceStem(sentence)
{
	sentence = sentence.replace(/\%/," percent");
	sentenceout = []

	_.each(sentence.split(" "), function(word, key, list){ 
		stem = natural.PorterStemmer.stem(word)
		if (stem.length == 0)
			sentenceout.push(word)
		else
			sentenceout.push(stem)
	}, this)
	
	return 	sentenceout
}

/*
translates 20,000 NIS to 20000
*/
function translateLabel(label)
{
var lablist = splitJson(label)
if (lablist.length == 3 )
	if (lablist[2] in ValueTransition)
		{
		lablist[2] = ValueTransition[lablist[2]]
		return Hierarchy.joinJson(lablist)
		}
return label
}

function retrievelabels()
{
	lis = []
	_.each(semlang, function(value, key, list){ 
		lablist = splitJson(value)
		_.each(lablist, function(labitem, key, list){ 
			lis.push(labitem)
		}, this)
	}, this)
	return _.uniq(lis)
}

function retrievelabelsbytypes()
{
	lis = []
	_.each(newsemlang, function(value, key, list){ 
		lablist = splitJson(value)
		console.log(lablist)
		process.exit(0)
		_.each(lablist, function(labitem, key, list){ 
			lis.push(labitem)
		}, this)
	}, this)
	return _.uniq(lis)
}

function convertlabeltree()
{
	labels = []
	_.each(labeltree, function(attval, intent, list){ 
		_.each(attval, function(value, attr, list){
			if (Object.keys(value).length != 0)
				{ 
				_.each(value, function(value1, key, list){ 
						labels.push([intent,attr,key])
				}, this)
				}
			else
				labels.push([intent,attr])
		},this)
	}, this)
	return labels
}


// module.exports.expl_struct = function(explanation)
function expl_struct(explanation)
{
	exp = []

	_.each(explanation, function(value, key, list){ 
		if (typeof(value)==="object")
			exp.push(value)
	}, this)


	list = []
	listpos = []

	list.push(_.pluck(exp, 'positive'))
	list.push(_.pluck(exp, 'negative'))

	// poslist = _.pluck(exp, 'positive')
	_.each(list, function(poslist, key, list){ 
		pos = {}

	// concat same labels 
	_.each(poslist, function(hashlab, key, list){
		_.each(hashlab, function(weightlist, lab, list){
			if (!(lab in pos))
				pos[lab] = []
			// pos[lab] = pos[lab].concat(weightlist)
			_.each(weightlist, function(wei, key, list){
				even = _.find(pos[lab], function(num){ return num[0] == wei[0]; });
				// console.log(even)
				// process.exit(0)
				if ((typeof(even)!="undefined"))
					{
					_.each(pos[lab], function(value5, key5, list){
						if (_.isEqual(value5,even))
							pos[lab][key5][1] =  pos[lab][key5][1] + wei[1]
					}, this)
					}
				else
					pos[lab].push(wei)
			}, this)
		 }, this) 
	}, this)

	listpos.push(pos)
}, this)



	hashpos = 
	{
		'positive': listpos[0],
		'negative': listpos[1]
	}
	// // merge same weight and aggreagde values
	// _.each(pos, function(weigths, lab, list){
	// 	_.each(weigths, function(wei, key, list){ 
	// 		_.each(weigths, function(wei1, key1, list){ 
	// 			if ((wei[0] == wei1[0])&& (key != key1))
	// 				pos[lab][key][1] = pos[lab][key][1] + pos[lab][key1][1]
	// 		}, this)
	// 	 }, this) 
	// }, this)

	// console.log(JSON.stringify(hashpos, null, 4))

	// console.log(JSON.stringify(ab, null, 4))

	// bc = _.extend(ab[0], ab[1])

	// console.log(JSON.stringify(bc, null, 4))
	// // console.log(exp)
	// process.exit(0)
	return hashpos
}

// module.exports.aggregate_results = function(stats)
function aggregate_results(stats)
{
	results = _.reduce(stats, function(memo, obj) {
	  return {
	    F1: memo.F1 + obj.F1,
	    Precision: memo.Precision + obj.Precision,
	    Recall: memo.Recall + obj.Recall,
	    Accuracy: memo.Accuracy + obj.Accuracy,
	  };
	}, {F1: 0, Precision: 0, Recall: 0, Accuracy: 0})

	_.each(results, function(value, key, list){ 
		results[key] = value/stats.length
		}, this)
	return results
}

function find_path(mat)
{
	var d = []
	d[mat.length - 1] = 0//mat[mat.length -2][mat.length-1]
	d[mat.length - 2] = mat[mat.length -2][mat.length-1]
	// console.log(mat.length - 3)
	// console.log(_.range(mat.length - 3, -1, -1))
	_.each(_.range(mat.length - 3, -1, -1), function(value1, key, list){ 
	// }, this)
	// _(mat.length - 2).times(function(n){
		var buf = []
		// _.each(mat, function(value, key, list){ 
		// }, this)
		// _(n).times(function(nn){
			// if ()/
		// })
		// console.log("value1"+value1)
		_.each(_.range(value1+1, mat.length, 1), function(value, key, list){ 
			// console.log("value"+value)
			// console.log("mat"+mat[value1][value])
			// if ((mat[value1][value]!=0)&&(mat[value1][value]!=Infinity))
			if ((mat[value1][value]!=Infinity))
				buf.push(mat[value1][value]+d[value])
		}, this)
		// console.log("123")
		// console.log(buf)
		// process.exit(0)
		d[value1] = _.max(buf, function(i){ return i });

	}) 

	// console.log(d)
	
	var v = 0
	var path = [v]
	while (d[v] != 0)
   	{
   		// for each edge (v,u):
   		lo=true
   		_.each(_.range(v+1, mat.length,1), function(u, key, list){ 
   			if (lo)
   			{
   			console.log("d[v]="+d[v])
   			console.log("mat[v][u]="+mat[v][u])
   			console.log("d[u]="+d[u])
        	}
        	if ((d[v] - mat[v][u] == d[u])&&(lo))
            	{
            	path.push(u)
				console.log("u"+u)
				console.log(path)
            	// console.log(v)
            	// process.exit(0)
            	v = u
            	lo=false
             // break
             	}
   		}, this)

    }
	// return list

	console.log(path)
	return d
}

function generate_string(words)
{

	var list = []
	if (words.length < 2) return [words.join(" ")]
	for (var i = 0; i <= words.length; i++) 
		for (var j = i + 1; j <= words.length; j++) 
			list.push(words.slice(i, j).join(" "))

	return list
}

function truth_sentence(sentence)
{

	if (sentence == "'start'") return sentence
	if (sentence == "'end'") return sentence

	var start = 0
	var end = 0

	if (sentence.indexOf("'start'") != 1)
		start = 1
	
	if (sentence.indexOf("'end'") != 1)
		end = 1

	sentence = sentence.replace("['start']", "")
	sentence = sentence.replace("'start'", "")
	sentence = sentence.replace("['end']", "")
	sentence = sentence.replace("'end'", "")
	sentence = sentence.trim()

	var sentencelist = []
	var sentencevocab = fs.readFileSync('truthteller/truth_teller/examples.txt').toString().split("\n");
	console.log(sentence)
	var index = sentencevocab.indexOf(sentence)
	console.log(index)
	console.log(complement_number(index + 1, 5))
	var lines = fs.readFileSync('truthteller/truth_teller/annotatedSentences/sentence_' + complement_number(index + 1, 5) + '.cnt').toString().split("\n");
	lines.pop()
	lines.pop()

	_.each(lines, function(line, key, list){
		sentencelist.push(line.split('\t')) 
		// console.log(line.split('\t').length)
	}, this)

	_.each(sentencelist, function(row, key, list){ 
		if ((row[3] == 'VERB') && (row[13] == "N"))
			sentence = sentence.replace(row[1], row[1]+"&"+row[13]);

		if ((row[3] == 'NOUN') && (row[11] == "N"))
			sentence = sentence.replace(row[1], row[1]+"&"+row[11]);

	}, this)

	if (start == 1)
		sentence = "'start' " + sentence

	if (end == 1)
		sentence = sentence + " 'end'"

	return sentence
}

function complement_number(num, digits)
{
	var numstr = num.toString()
	while (numstr.length < digits) {
    	numstr = '0'+numstr
    }
    return numstr
}

function aggreate_similar(list)
{
	var buf = []
	var str = ""
	var clean = []

	_.each(list, function(value, key, list){ 
		// should be Offer and (either it's first or it's continue)
		if ((value[0]=='Offer')&&((buf.length==0)||(buf[buf.length-1][2][1] == value[2][0])))
			{
				buf.push(value)
				str = str + " " + value[1]
			}
		else
			{
				if (buf.length!=0) 
					clean.push(['Offer',str.trim(),[buf[0][2][0], buf[buf.length-1][2][1]], _.map(buf, function(num){return num[3]})])				
					// clean.push(['Offer',str,[buf[0][2][0], buf[buf.length-1][2][1]]])				

				buf = []
				str = ""

				if (value[0]=='Offer')
				{
				buf.push(value)
				str = str + " " + value[1]		
				}
				else
				{
				clean.push(value)					
				}


			}

	}, this)
	if (buf.length!=0)
		clean.push(['Offer',str.trim(),[buf[0][2][0], buf[buf.length-1][2][1]], _.map(buf, function(num){return num[3]})])
		// clean.push(['Offer',str,[buf[0][2][0], buf[buf.length-1][2][1]]])
	return clean
}

// divide dataset to 
// - where output is just one labels
// - where output is more than one label 
function dividedataset(dataset)
{
	var datasetd = {'one':[], 'two':[]}

	_.each(dataset, function(value, key, list){ 
		if (value.output.length == 1)
			datasetd['one'].push(value)
		else
			datasetd['two'].push(value)

	}, this)

	return datasetd
}


function aggregate_sagae_no_completition(classes, classifier, parts, explanations, original)
{
return aggregate_sagae(classes, classifier, parts, explanations, original, false)
}

function aggregate_sagae_completition(classes, classifier, parts, explanations, original)
{
return aggregate_sagae(classes, classifier, parts, explanations, original, true)
}


// function aggregate_sagae_improved(classes, classifier, parts, explanations, original)
// {
// 	var completition = true
// 	var clas = []

// 	explanations[0] = aggreate_similar(explanations[0])
// 	// explanations[0] = filterreject(explanations[0])
// 	// explanations[2] = filterreject(explanations[2])

// 	console.log("utterance")
// 	console.log(JSON.stringify(parts, null, 4))
// 	console.log("explanation")
// 	console.log(JSON.stringify(explanations, null, 4))
	

// 	_.each(explanations[2], function(value, key, list){
// 		clas.push([[],[],[value[0]]])
// 	})
// 	_.each(explanations[0], function(intent, key, list){ 
// 		// if (intent[0] != null)
// 			clas.push([[intent[0]],[],[]])
		
// 		_.each(explanations[2], function(value, key, list){ 
// 			// if ((intent[2][0]-1<=value[2][0])&&(intent[2][1]+1>=value[2][1]))
// 			if ((intent[2][0]<=value[2][0])&&(intent[2][1]>=value[2][1]))
// 				{
// 				if ((intent[0]!=null)&&(value[0]!=null))
// 				clas.push([[intent[0]],[], [value[0]]])
// 				}
// 		}, this)

// 		_.each(explanations[1], function(attr, key, list){ 
// 			// if ((intent[2][0]-1<=attr[2][0])&&(intent[2][1]+1>=attr[2][1]))
// 			if ((intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][1]))
// 				if ((intent[0]!=null)&&(attr[0]!=null))
// 					clas.push([[intent[0]],[attr[0]], []])

// 			_.each(explanations[2], function(value, key, list){ 
// 				// if ((attr[2][0]-1<=value[2][0])&&(attr[2][1]+1>=value[2][1])&&
// 					// (intent[2][0]-1<=attr[2][0])&&(intent[2][1]+1>=attr[2][1]))
// 				if ((attr[2][0]<=value[2][0])&&(attr[2][1]>=value[2][1])&&
// 					(intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][1]))
// 					if ((intent[0]!=null)&&(attr[0]!=null)&&(value[0]!=null))

// 						clas.push([[intent[0]],[attr[0]], [value[0]]])
// 			}, this)
// 		}, this)
				
// 	}, this)

// // console.log(clas)

	
// 	var js = []
// 	_.each(clas, function(lab, key, list){ 
// 		// if (completition)
// 			var res = resolve_emptiness(lab)
// 			// console.log(res)
// 			js = js.concat(generate_possible_labels(res))
// 			// console.log(js)
// 		// else
// 			// js = js.concat(generate_possible_labels((lab)))

// 	}, this)

// 	console.log("composite label:")
// 	console.log(JSON.stringify(_.uniq(js), null, 4))
// 	console.log("gold composite label:")
// 	console.log(JSON.stringify(original, null, 4))
// 	console.log()
// 	// process.exit(0)
// 	return _.uniq(js)
// }

function filterreject(list)
{
	var	placereject = false 
	var	car = false 
	_.each(list, function(value, key, list){ 
			// should be Offer and (either it's first or it's continue)
			if (value[0]=='Without leased car')
				car = true
			if ((value[0]=='With leased car') && (car))
				list[key][0] = 'Without leased car'
			
			if (value[0]=='Reject')
					placereject = true
			if ((value[0]=='Accept') &&  (placereject))
					list[key][0] = 'Reject'
		})
	return list
}



function getlabelhier()
{
lis = {}
	_.each(semlang, function(value, key, list){ 
		lablist = splitJson(value)
		// console.log(la/blist)
		// process.exit(0)
		if (!(lablist[1] in lis)) lis[lablist[1]] = []
			lis[lablist[1]].push(lablist[2])
		
		lis[lablist[1]] = _.uniq(lis[lablist[1]])

		// _.each(lablist, function(labitem, key, list){ 
			// lis.push(labitem)
		// }, this)
	}, this)
	return lis
}

function filterValues(values)
{
  var out = []
  var lista = ['accept', 'compromise', 'issues', 'bid']
  _.each(values, function(value, key, list){
    if (lista.indexOf(value[0])!=-1)
      out.push(value)
  }, this)
  return out
}

function hasRoot(depparse)
{
  var root = false
  _.each(depparse, function(value, key, list){
    if (value['role'] == 'root')
      root = true 
  }, this)
  return root
}

function filterzerofeatures(intens)
{

  _.each(intens, function(intent, key, list){ 
    if (_.isArray(intent[3]))
    {
    _.each(intent[3], function(subintent, subkey, list){ 
      _.each(subintent, function(features, intentname, list){ 
        intens[key][3][subkey][intentname] = _.filter(features, function(num){ return ((num[1] != 0) && (num != 0)) });
      }, this)
    }, this)
    }
    else
    {
      _.each(intent[3], function(features, intentname, list){ 
         intens[key][3][intentname] = _.filter(features, function(num){ return ((num[1] != 0) && (num != 0)) });
      }, this)
    }

  }, this)
  return intens
}

function aggregate_rilesbased(classes, classifier, parts, explanations, original, classifier, initial)
{
  var rules = require("../research/rule-based/rules.js")
	var ppdb = require("../research/ppdb/utils.js")

  console.log("-------------------------------------") 
 
  nopuntc = initial.replace(/\./g,"")

  var fiber = Fiber.current;
  ppdb.cachepos(nopuntc, function(err, response){
    fiber.run(response)
  })
  var tag = Fiber.yield()
  // console.log("tag" + tag)
  
  ppdb.dep(tag, function(response){
    fiber.run(response)
  })
  var dep = Fiber.yield()

  if (!(hasRoot(dep)))
    return null

  // console.log("dep")
  // console.log(dep)

	var data = rules.findData(initial)

	explanations[0] = filterzerofeatures(aggreate_similar(explanations[0]))
  explanations[1] = data[0]
  explanations[2] = data[1].concat(filterValues(explanations[2]))
  var clas = []

  // console.log(JSON.stringify("normalized "+parts, null, 4))
  // console.log(JSON.stringify("initial "+initial, null, 4))
  // console.log("data")
  // console.log(JSON.stringify(data, null, 4))
  // console.log("gold")
  // console.log(JSON.stringify(original, null, 4))
  // console.log("actual")
  // console.log(JSON.stringify(_.uniq(js), null, 4))
  // console.log(JSON.stringify(explanations, null, 4))

  if (explanations[0].length == 0)
    explanations[0].push(["Offer","offer",[0,100],[0,100]])

	// _.each(explanations[2], function(value, key, list){
    // clas.push([[],[],[value[0]]])
  // })
  // _.each(explanations[0], function(intent, key, list){ 
  //   if (intent[0] != null)
  //     clas.push([[intent[0]],[],[]])

  //   // _.each(explanations[1], function(attr, key, list){ 
  //     // if ((intent[2][0]-1<=value[2][0])&&(intent[2][1]+1>=value[2][1]))
  //     // if ((intent[2][0]<=value[2][0])&&(intent[2][1]>=value[2][1]))
  //     // if (((intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][0])) ||
  //       // ((intent[2][0]<=attr[2][1])&&(intent[2][1]>=attr[2][1]))
  //       // )
  //       // {
  //       // clas.push([[intent[0]],[attr[0]], []])
  //       // }
  //   // }, this)
    
  //   _.each(explanations[2], function(value, key, list){ 
  //     // if ((intent[2][0]-1<=value[2][0])&&(intent[2][1]+1>=value[2][1]))
  //     if ((intent[2][0]<=value[2][0])&&(intent[2][1]>=value[2][1]))
  //       {
  //       if ((intent[0]!=null)&&(value[0]!=null))
  //       clas.push([[intent[0]],[], [value[0]]])
  //       }
  //   }, this)

  //   _.each(explanations[1], function(attr, key, list){ 
  //     // if ((intent[2][0]-1<=attr[2][0])&&(intent[2][1]+1>=attr[2][1]))
  //     if ((intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][1]))
  //       if ((intent[0]!=null)&&(attr[0]!=null))
  //         clas.push([[intent[0]],[attr[0]], []])

  //     _.each(explanations[2], function(value, key, list){ 
  //       // if ((attr[2][0]-1<=value[2][0])&&(attr[2][1]+1>=value[2][1])&&
  //         // (intent[2][0]-1<=attr[2][0])&&(intent[2][1]+1>=attr[2][1]))
  //       if ((attr[2][0]<=value[2][0])&&(attr[2][1]>=value[2][1])&&
  //         (intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][1]))
  //         if ((intent[0]!=null)&&(attr[0]!=null)&&(value[0]!=null))

  //           clas.push([[intent[0]],[attr[0]], [value[0]]])
  //     }, this)
  //   }, this)
  // }, this)

  // console.log(clas)
  // process.exit(0)


  // console.log(explanations[0])
// console.log("comming")
 var clas = buildlabel(data, dep, explanations[0])

 // console.log("CLASS")
 // console.log(JSON.stringify(clas, null, 4))

 var js = []
  _.each(clas, function(lab, key, list){ 
    // if (completition)
      // {
      var res = resolve_emptiness_rule(lab)
      js = js.concat(generate_possible_labels(res))
      // }
      // console.log(js)
    // else
      // js = js.concat(generate_possible_labels((lab)))

  }, this)

  // console.log("before labelFilter")
  js = labelFilter(js)
  // console.log("after labelFilter")

  // console.log(js)

  // console.log(_.uniq(js))
  // console.log()
  // process.exit(0)

  // console.log("composite label:")
  // console.log(JSON.stringify(_.uniq(js), null, 4))
  // console.log("gold composite label:")
  // console.log(JSON.stringify(original, null, 4))

_.sortBy([1, 2, 3, 4, 5, 6], function(num){ return Math.sin(num); });


  if (_.isEqual(_.sortBy(original, function(n){return n}), _.sortBy(_.uniq(js), function(n){return n})) == false)
  {
    console.log("initial")
    console.log(initial)
    console.log("gold")
    console.log(JSON.stringify(original, null, 4))
    console.log("actual")
    console.log(JSON.stringify(_.uniq(js), null, 4))
    console.log("tagging")
    console.log(tag)
    console.log("depparsing")
    console.log(dep)
    console.log("rules")
    console.log(JSON.stringify(data, null, 4))
    console.log("intents")
    console.log(JSON.stringify(explanations[0], null, 4))
  }
  // else
  // {
    // console.log("everything is correct")
  // }
  
  return _.uniq(js)
}
/*
INPUT
OUTPUT
*/
function aggregate_sagae(classes, classifier, parts, explanations, original, completition)
{
	var clas = []


	
	explanations[0] = aggreate_similar(explanations[0])
	// explanations[0] = filterreject(explanations[0])
	// explanations[2] = filterreject(explanations[2])
	// console.log("utterance")
	// console.log(JSON.stringify(parts, null, 4))
	// console.log("explanation")
	// console.log(JSON.stringify(explanations, null, 4))
	
	_.each(explanations[2], function(value, key, list){
		clas.push([[],[],[value[0]]])
	})
	_.each(explanations[0], function(intent, key, list){ 
		if (intent[0] != null)
			clas.push([[intent[0]],[],[]])

		// _.each(explanations[1], function(attr, key, list){ 
			// if ((intent[2][0]-1<=value[2][0])&&(intent[2][1]+1>=value[2][1]))
			// if ((intent[2][0]<=value[2][0])&&(intent[2][1]>=value[2][1]))
			// if (((intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][0])) ||
				// ((intent[2][0]<=attr[2][1])&&(intent[2][1]>=attr[2][1]))
				// )
				// {
				// clas.push([[intent[0]],[attr[0]], []])
				// }
		// }, this)
		
		_.each(explanations[2], function(value, key, list){ 
			// if ((intent[2][0]-1<=value[2][0])&&(intent[2][1]+1>=value[2][1]))
			if ((intent[2][0]<=value[2][0])&&(intent[2][1]>=value[2][1]))
				{
				if ((intent[0]!=null)&&(value[0]!=null))
				clas.push([[intent[0]],[], [value[0]]])
				}
		}, this)

		_.each(explanations[1], function(attr, key, list){ 
			// if ((intent[2][0]-1<=attr[2][0])&&(intent[2][1]+1>=attr[2][1]))
			if ((intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][1]))
				if ((intent[0]!=null)&&(attr[0]!=null))
					clas.push([[intent[0]],[attr[0]], []])

			_.each(explanations[2], function(value, key, list){ 
				// if ((attr[2][0]-1<=value[2][0])&&(attr[2][1]+1>=value[2][1])&&
					// (intent[2][0]-1<=attr[2][0])&&(intent[2][1]+1>=attr[2][1]))
				if ((attr[2][0]<=value[2][0])&&(attr[2][1]>=value[2][1])&&
					(intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][1]))
					if ((intent[0]!=null)&&(attr[0]!=null)&&(value[0]!=null))

						clas.push([[intent[0]],[attr[0]], [value[0]]])
			}, this)
		}, this)
				
	}, this)

	// console.log(clas)
	// process.exit(0)
	
	var js = []
	_.each(clas, function(lab, key, list){ 
		if (completition)
			{
			var res = resolve_emptiness(lab)
			// console.log(res)
			js = js.concat(generate_possible_labels(res))
			}
			// console.log(js)
		else
			js = js.concat(generate_possible_labels((lab)))

	}, this)



	// console.log("composite label:")
	// console.log(JSON.stringify(_.uniq(js), null, 4))
	// console.log("gold composite label:")
	// console.log(JSON.stringify(original, null, 4))
	
	return _.uniq(js)
}


function compareresults(classifier1, result1, classifier2, result2)
{
	_(result1.length).times(function(n){
		if (!(_.isEqual(result1[n], result2[n])))
			{
				console.log(classifier1)
				console.log(JSON.stringify(result1[n], null, 4))
				console.log(classifier2)
				console.log(JSON.stringify(result2[n], null, 4))
				console.log("+++++++++++++++++++++++++++++++++++")
			}
	})
}

function aggregate_lab(explanations, inputngram, inputnorm)
// function exports.aggregate_lab = function(explanations, inputngram, inputnorm)
{

	tags = convertlabeltree()

	senlabel =  {}
	_.each(explanations['positive'], function(value, label, list){
		// _.each(sample.replace(/\,/g,"").split(" "), function(value1, key, list){ 
		_.each(inputngram, function(value1, feature, list){ 
			var element = _.find(value, function(num){ return num[0]==feature; });
			if (element)
				{
				if (!(label in senlabel))
					senlabel[label] =  new DefaultDict(0);

				senlabel[label].set(feature, senlabel[label].get(feature) + element[1])
				}
		}, this)
	}, this)

	pop = []

	//treating bigrams
	_.each(senlabel, function(setofgrams, label, list){ 
			_.each(setofgrams['_'], function(value, gram, list){ 
				if (gram.split(" ").length>1)
					_.each(gram.split(" "), function(unigram, key, list){
						senlabel[label]['_'][unigram] = senlabel[label]['_'][unigram]+value
					}, this)
			}, this)
		}, this)

	return senlabel

}

function aggregate_label_trick(classes, classifier, sample, explanations, original, classifier_compare)
{
	draw = true
	return aggregate_label(classifier, sample, explanations, true, draw, original, classifier_compare)
}


function aggregate_label_no_trick(classes, classifier, sample, explanations, original, classifier_compare)
{
	draw = false
	return aggregate_label(classifier, sample, explanations, false, draw, original, classifier_compare)
}

// module.exports.aggregate_label = function(explanations, inputngram, inputnorm)
// module.exports.aggregate_label = function(classifier, sample, explanations)
function aggregate_label(classifier, sample, explanations, trick, draw, original, classifier_compare)
// exports.aggregate_label = function(classifier, sample, explanations)
{
	var inputngram = classifier.sampleToFeatures(classifier.normalizedSample(sample), classifier.featureExtractors)
	var inputnormal = classifier.normalizedSample(sample)
	
	inputnormal = inputnormal.replace(/\,/g," ,")
	inputnormal = inputnormal.replace(/\./g," .")
	inputnormal = inputnormal.replace(/\?/g," ?")
	inputnormal = inputnormal.replace(/\!/g," !")
	inputnormal = inputnormal.replace(/\%/g," %")
	inputnormal = inputnormal.replace(/\$/g," $")

	console.log(sample)

	clas = classifier_compare.classify(sample, 5 ,true)

	var claslist = []
	// _.each(explanations['positive'], function(value, key, list){ 
		// claslist.push(key)
	// }, this)
	// console.log(Object.keys(explanations['positive']))
	labels = generate_possible_labels(resolve_emptiness(bag_of_labels_to_components(Object.keys(explanations['positive']))))
	
	labscor = []
	_.each(labels, function(lab, key, list){ 
		labscor.push([lab,clas['scores'][lab]])
	}, this)
	// _.each(claslist, function(value, key, list){ 
		// bag_of_labels_to_components
	// }, this)
// console.log(labels)
// process.exit(0)
	// console.log(_.extend(explanations['positive'],explanations['negative']))
	// process.exit(0)

	var senlabel =  {}
	_.each(explanations['positive'], function(value, label, list){
	// _.each(_.extend(explanations['positive'],explanations['negative']), function(value, label, list){
		// _.each(sample.replace(/\,/g,"").split(" "), function(value1, key, list){ 
		_.each(inputngram, function(value1, feature, list){ 
			var element = _.find(value, function(num){ return num[0]==feature; });
			if (element)
				{
				if (!(label in senlabel))
					senlabel[label] =  new DefaultDict(0);

				senlabel[label].set(feature, senlabel[label].get(feature) + element[1])
				}
		}, this)
	}, this)

	var pop = []

	//treating bigrams
	_.each(senlabel, function(setofgrams, label, list){ 
			_.each(setofgrams['_'], function(value, gram, list){ 
				if (gram.split(" ").length>1)
					_.each(gram.split(" "), function(unigram, key, list){
						senlabel[label]['_'][unigram] = senlabel[label]['_'][unigram]+value
					}, this)
			}, this)
		}, this)

	var wordhash = {}

	_.each(senlabel, function(words, label, list){ 
		_.each(words['_'], function(value, word, list){
			if (!(word in wordhash))
				wordhash[word] = []//new DefaultDict(0)
			wordhash[word].push([label, value])
		}, this)
	}, this)

	// if ((draw) &&(intent_attr_label_ambiguity(resolve_emptiness(bag_of_labels_to_components(Object.keys(explanations['positive']))))>1))
	if ((draw))
		{
			senid = "./image/"+Date.now()
			var labellist = Object.keys(senlabel)
			_.each(labellist, function(value, key, list){ 
				labellist[key] = "\""+value+"\""
			}, this)

			// fs.writeFileSync(senid, "word\tword\t"+labellist.join("\t") + "\n", 'utf-8', function(err) {console.log("error "+err); return 0 })
			fs.writeFileSync(senid, "word\tword\t"+labellist.join("\t") + "\n", 'utf-8')

			_.each(inputnormal.split(" "), function(word, wordnum, list){
			var row = []
				_.each(wordhash[word], function(value, key, list){
					row.push(value[1])
				 }, this) 
			fs.appendFileSync(senid, wordnum+"\t"+word+"\t"+row.join("\t")+"\n",'utf8')
			}, this)

			indx = 0.8
			labb = ""
			_.each(labscor, function(value, key, list){ 
				labb = labb + "set label \'"+value[0].replace(/[\",\\]/g,"")+value[1]+"\' at screen 0.1,"+indx +";"
				indx = indx - 0.025
			}, this)

		command = "gnuplot -p -e \"reset; set term png truecolor  size 1000,1000; set grid ytics; set grid xtics; set title \'"+sample.replace(/\'/g,'')+"\';  set key top right; set output \'image/"+sample.replace(/\'/g,'')+".png\'; set key autotitle columnhead; set label \'"+(JSON.stringify(original)).replace(/[\",\\]/g,"")+"\' at screen 0.1, 0.9;"+labb+" plot for [i=3:"+(labellist.length+2)+"] \'"+senid+"\' using 1:i:xticlabels(2) smooth frequency with boxes\""
		if (labellist.length > 0)
			result = execSync.run(command)
		}

	_.each(wordhash, function(value, key, list){ 
		wordhash[key] = (_.sortBy(value, function(num){ return num[1]; })).reverse();
	}, this)

	var pop = []
	var buffer = []

	_.each(wordhash, function(labels, word, list){
		if (word.split(" ").length==1)
			{
			// console.log(word)
			var ar = []
			_.each(labels, function(value, key, list){ 
				if (value[1]>0)
					ar.push((value[0]=="true") ? true:value[0])
			}, this)

			comp = bag_of_labels_to_components(ar.concat(buffer))

			if (trick) comp = resolve_emptiness(comp)
			var label = generate_possible_labels(comp)
			// console.log(label)
			pop = pop.concat(label)

			} 
		buffer = _.clone(ar)
	}, this)

	_.each(pop, function(value, key, list){ 

	}, this)
	return _.uniq(pop)
}

// input: [[],[],['20,000 NIS']]
// output: [['Offer'],['Salary'],['20,000 NIS']]
// module.exports.resolve_emptiness = function(label)
// function resolve_emptiness(label)
// {

// 	if ((label[1].length == 0)&&(label[2].length == 0)&&
// 		(['Append', 'Reject', 'Insist', 'Accept'].indexOf(label[0][0])) != -1
// 		)
// 		label[2][0] = 'previous'

// 	_.each(label[2], function(value, key, list){ 
// 		// console.log(value)
// 		if (typeof(value)!=undefined)
// 			if (value.toString().indexOf("previous")!=-1)
// 				value = "previous"

// 		var amb = semlang_ambiguity([value])
// 		if (amb.length==1)
// 			{
// 				// label = this.join_labels(label,amb[0])
// 				label = join_labels(label,amb[0])
// 				// console.log("label")
// 				// console.log(label)
// 			}
// 	}, this)


// 	// console.log(label)
// 	// process.exit(0)

// 	_.each(label[0], function(value, key, list){ 
// 		var amb = semlang_ambiguity([value])
// 		// console.log(amb)
// 		if (amb.length==1)
// 			{
// 				// label = this.join_labels(label,amb[0])
// 				label = join_labels(label,amb[0])
// 			}
// 	}, this)

// 	_(3).times(function(n){
// 		label[n] = _.uniq(label[n])
// 	})
// 	return label
// }

function isValuesofAttribute(val)
{
Values = {
            'Salary': [,'7,000 NIS','10,000 NIS','12,000 NIS','20,000 NIS'],
            'Pension Fund': ['0%','10%','15%','20%'],
            'Promotion Possibilities': ['Fast promotion track','Slow promotion track'],
            'Working Hours': ['8 hours','9 hours','10 hours'],
            'Job Description': ['QA','Programmer','Team Manager','Project Manager'],
            'Leased Car': ['Without leased car', 'With leased car', 'No agreement']
      // 'Leased Car': ['Ferrari']
            }
  var out = []
  _.each(Values, function(value, key, list){
    if (value.indexOf(val)!=-1)
      out.push(key) 
  }, this)
return out
}/*
INPUT:[['Reject'],[],[]]*/
function resolve_emptiness_rule(label)
{
// complete attribute only
  _.each(label[2], function(value, key, list){
    if (isValuesofAttribute(value).length == 1)
      label[1].push(isValuesofAttribute(value)[0]) 
  }, this)

  // TODO: to complete the list
  var previous = ['Accept', 'Reject', 'Insist']
  if ((label[1].length == 0) && (label[2].length == 0) && 
    (previous.indexOf(label[0][0])!=-1))
    label[2].push('previous')

  var truel = ['Greet','Quit']
  if ((label[1].length == 0) && (label[2].length == 0) && 
    (truel.indexOf(label[0][0])!=-1))
    label[2].push(true)

  _(3).times(function(n){
    label[n] = _.uniq(label[n])
  })
  return label
}

function resolve_emptiness(label)
{
	// the most popular vased on intent
	_.each(label[2], function(value, key, list){ 
		var amb = semlang_ambiguity([value])
		if (amb.length == 1)
				label = join_labels(label,amb[0])
	}, this)

	// like Greet
	_.each(label[0], function(value, key, list){ 
		var amb = semlang_ambiguity([value])
		if (amb.length==1)
				label = join_labels(label,amb[0])
	}, this)

  if ((label[0]=='Accept')||(label[0]=='Reject'))
    label[2].push('previous')

	_(3).times(function(n){
		label[n] = _.uniq(label[n])
	})
	return label
}

// input: [['Offer', 'Accept'], ['Salary'], ['previous','20,000 NIS']]
// output: [{'Offer':{'Salary':'20,000 NIS'}}, {'Accept':'previous'}]
// module.exports.generate_possible_labels = function(label)
function generate_possible_labels(label)
{
	// console.log(label)
	// _.each(label[2], function(value, key, list){ 
	// 	if (typeof(value) != undefined)
	// 		// if (typeof(value) != Boolean)
	// 			if (value.toString().indexOf("previous") != -1)
	// 				label[2][key] = 'previous'
	// }, this)

	var out = []
	_.each(label[0], function(intent, key, list){
		_.each(label[2], function(value, key, list){
			_.each(semlang, function(semval, key, list){ 
				var lab = splitPartEqually(multilabelutils.normalizeOutputLabels(semval))
				if (_.isEqual([intent,value],_.flatten(lab)))
					out.push(semval)
			 }, this)
		 }, this) 
		_.each(label[1], function(value, key, list){
			_.each(semlang, function(semval, key, list){ 
				var lab = splitPartEqually(multilabelutils.normalizeOutputLabels(semval))
				if (_.isEqual([intent,value],_.flatten(lab)))
					out.push(semval)
			 }, this)
		 }, this) 
		_.each(label[1], function(attr, key, list){
			_.each(label[2], function(value1, key, list){ 
				_.each(semlang, function(semval, key, list){ 
					var lab = splitPartEqually(multilabelutils.normalizeOutputLabels(semval))
					if (_.isEqual([intent,attr,value1],_.flatten(lab)))
					 out.push(semval)
				}, this)
			 }, this) 
		}, this)
	}, this)
	return out
}

function join_labels(label, label1)
// module.exports.join_labels = function(label, label1)
{
	_(3).times(function(n){
		label[n] = _.uniq(label[n].concat(label1[n]))
	})
	return label
}
// module.exports.semlang_ambiguity = function(label)
function semlang_ambiguity(label)
{

	var out = []
	_.each(semlang, function(value, key, list){
		var lab = splitPartEqually(multilabelutils.normalizeOutputLabels(value))
		if (_.difference(label,_.flatten(lab)).length==0)
			// out.push(_.flatten(lab))
			out.push(lab)
	}, this)
	return out
}

// input : ['Offer', 'Salary', '20,000 NIS']
// output: [['Offer'],['Salary'], ['20,000 NIS']]
// exports.bag_of_labels_to_components = function(label)
function bag_of_labels_to_components(label)
{
	var set = [[],[],[]]
	_.each(semlang, function(value, key, list){
		var out = splitPartEqually(multilabelutils.normalizeOutputLabels(value))
		_.each(out, function(va, key, list){
			set[key] = set[key].concat(va) 
		}, this)
	}, this)

	_.each(set, function(value, key, list){ 
		set[key] = _.uniq(value)
	}, this)

	var out = [[],[],[]]

	_.each(label, function(val, key, list){ 
		// if (val.length != 0)
		// {
			if (set[0].indexOf(val)!=-1) out[0].push(val)
			if (set[1].indexOf(val)!=-1) out[1].push(val)
			if (set[2].indexOf(val)!=-1) out[2].push(val)
		// }
	}, this)

	return out
}

/*@input - array of hashes, as a input given after cross -  validation
@output - hash that aggregates all statistics from the input*/
function aggregate_two_nested(stats)
// module.exports.aggregate_two_nested = function(stats)
{
	b = _.reduce(stats, function(memo, obj) {
	h = _.clone(memo)

	_.each(obj, function(value, label, list){ 
		if (!(label in h ))
			h[label] = {}
		_.each(_.keys(value), function(param, key, list){ 
			if (param in h[label])
				h[label][param] = h[label][param] + obj[label][param]
			else
				h[label][param] = obj[label][param]
  		}, this)
	}, this)

	return h
	}, {}, this)

	_.each(b, function(value, key, list){ 
		_.each(value, function(value1, key1, list){ 
			b[key][key1] = value1/stats.length
		}, this)
	}, this)
	return b
}

/*@input - stats from test
@output - confusion matrix in multi-label case*/
// module.exports.confusion_matrix = function(stats)
function confusion_matrix(stats)
{	
	matrix = {}
	_.each(stats['data'], function(value, key, list){ 
		_.each(value['explanation']['TP'], function(value1, key, list){ 
			if (!(value1 in matrix))
				matrix[value1] = {}
			if (!(value1 in matrix[value1]))
				matrix[value1][value1] = 0
			matrix[value1][value1] = matrix[value1][value1] + 1
		}, this)

		_.each(value['explanation']['FP'], function(value1, key, list){ 
			if (!(value['explanation']['FN']))
				value['explanation']['FN'] = []
			_.each(value['explanation']['TP'].concat(value['explanation']['FN']), function(value2, key, list){ 
				if (!(value2 in matrix))
					matrix[value2] = {}
				if (!(value1 in matrix[value2]))
					matrix[value2][value1] = 0
				matrix[value2][value1] = matrix[value2][value1] + 1
			}, this)
		}, this)

		_.each(value['explanation']['FN'], function(value1, key, list){ 
			if (!(value1 in matrix))
				matrix[value1] = {}
			if (!("nolabel" in matrix[value1]))
				matrix[value1]["nolabel"] = 0
			matrix[value1]["nolabel"] = matrix[value1]["nolabel"] + 1
			
		}, this)			

	}, this)

	return matrix
}

/*@input - hash that represents table
@output - html table*/
module.exports.hash_to_htmltable = function(labelhash)
{
	keys = []
	_.each(labelhash, function(value, key, list){ 
		_.each(value, function(value1, key1, list){ 
			keys.push(key1)
			}, this)
		}, this)

	labelheader = Object.keys(labelhash)
	labelheader.push("nolabel")

	console.log("<html><body><table border=1 style='border-collapse: collapse'>")
	console.log("<th><td>"+((labelheader)).join("</td><td>")+"</td></th>")

_.each(labelhash, function(value, key, list){
	console.log("<tr><td>"+	(buildstringnosum(key, value, labelheader)).join("</td><td>")+"</td></tr>")
	}, this)

		console.log("</table>")
		// console.log()
		// process.exit(0)

}


// @stats - dataset in the format after test_hash, i.e. the hash with parameters 'data', 'stats', 'labels'
// output is the data labels where there is an error
module.exports.filtererror = function(stats)
{
	stats_filtered=[]
	 _.each(stats['data'], function(value, key, list){ 
		if ((value['explanation']['FP'].length != 0) || (value['explanation']['FN'].length != 0))
		{
		stats_filtered.push(value)	
		}
	});
	return stats_filtered
}


module.exports.bars_hash = function(data)
{ 
	labelhash = {}
	_.each(data, function(value, key, list){
		output = _.flatten((splitPartEqually(multilabelutils.normalizeOutputLabels(value.output))))		
		_.each(output, function(lab, key, list){
			if (!(lab in labelhash))
				{
				labelhash[lab] = {}
				labelhash[lab]['train'] = 0 
				}
			else
				labelhash[lab]['train'] =  labelhash[lab]['train'] + 1
			}, this)

		}, this)
	return labelhash
}

module.exports.bars_original = function(data)
{	
	alllabel = []
	_.each(data, function(value, key, list){
		alllabel = alllabel.concat(value.output)
	}, this)

	aggreg = _.countBy(alllabel, function(num) {return num})

	aggreglist = []
	_.each(aggreg, function(value, key, list){ 
		aggreglist.push([key,value])
		}, this)

	aggregarray = _.sortBy(aggreglist, function(num){ return num[0]});


	_.each(aggregarray, function(value, key, list){
		console.log(value[0])
		}, this)

	process.exit(0)

	// _.each(aggregarray, function(value, key, list){ 
	// 		console.log(value[0]+"\t"+value[1])
	// 	}, this)
}

/*@input - dataset
@output - the table in html format with intent attribute cooccurence.*/
module.exports.intent_attr_matrix = function(data)
{

labelhash = {}
labelheader = []

_.each(data, function(value, key, list){ 
	output = splitPartEqually(multilabelutils.normalizeOutputLabels(value.output))

	_.each(output[0], function(intent, key, list){ 
		if (!(intent in labelhash))
			labelhash[intent] = []
		labelheader = labelheader.concat(output[1])
		labelhash[intent] = labelhash[intent].concat(output[1])
	}, this)
}, this)

labelheader = _.uniq(labelheader)

_.each(labelhash, function(value, key, list){ 
	labelhash[key] = _.countBy(value, function(num) { return num })
}, this)

console.log("<html><body><table border=1 style='border-collapse: collapse'>")
console.log("<th><td>"+((labelheader)).join("</td><td>")+"</td></th>")

_.each(labelhash, function(value, key, list){
	console.log("<tr><td>"+	(buildstring(key, value, labelheader)).join("</td><td>")+"</td></tr>")
	}, this)

labelmarginal = []
_.each(labelheader, function(label, key, list){ 
	agg = 0
	_.each(labelhash, function(value, key, list){ 
		if (label in value)
			agg = agg + value[label]
		}, this)
	labelmarginal.push(agg)
	}, this)

console.log("<tr><td></td><td>"+labelmarginal.join("</td><td>")+"</td></tr>")
console.log("</table>")
}

function buildstring(intent, valhash, labelheader)
{
	str = [intent]
	_.each(labelheader, function(value, key, list){ 
		if (value in valhash)
			str.push(valhash[value])
		else
			str.push(0)
		}, this)

	sum = _.reduce(_.rest(str), function(memo, num){ return memo + num; }, 0)
	str.push(sum)
	return str
}


function buildstringnosum(intent, valhash, labelheader)
{
	str = [intent]
	_.each(labelheader, function(value, key, list){ 
		if (value in valhash)
			str.push(valhash[value])
		else
			str.push(0)
		}, this)
	return str
}

/*
@input - data - dataset
@output - set of graphs with distributions of intent and attributes.*/
module.exports.intent_attr_dist = function(data)
{
	alllabelhash = {}
	_.each(data, function(value, key, list){
			jsonlablist = value['output'].map(splitJson)
			_.each(jsonlablist, function(value1, key, list){ 
				if (!(value1[0] in alllabelhash))
					alllabelhash[value1[0]] = []
				alllabelhash[value1[0]].push(value1[1])
				}, this)
	}, this)

	_.each(alllabelhash, function(value, key, list){ 
		alllabelhash[key] = _.sortBy(_.pairs(_.countBy(value, function(num) {return num})),1)
		}, this)

	filehash = {}
	_.each(alllabelhash, function(hashattribute, intent, list){ 
		str = ""
		num = 0
		_.each(hashattribute, function(occurence, attribute, list){ 
			str = str + num + "\t\""+occurence[0]+"\"\t"+ occurence[1]+"\n"
			num = num + 1
			}, this)
		filehash[intent] = str
	}, this)

	_.each(filehash, function(value, intent, list){ 
		fs.writeFileSync(intent, value, 'utf-8', function(err) {console.log("error "+err); return 0 })
	}, this)

	_.each(alllabelhash, function(value, intent, list){ 
		command = "gnuplot -p -e \"reset; set term png truecolor size 1500,800; set grid ytics; set grid xtics; set output \'"+intent+".png\'; set boxwidth 0.5; set style fill solid; plot \'"+intent+"\' using 1:3:xtic(2) with boxes\""
		result = execSync.run(command)
	}, this)
	process.exit(0)
}


/*@data is a dataset in the original format (array of JSON with input output parameters)
output - list of the labels and the occurrences of the labels in the dataset.*/
module.exports.bars = function(data)
{ 	
	lalelarray = []
	lalelarray.push([])
	lalelarray.push([])
	lalelarray.push([])

	_.each(data, function(value, key, list){
		output = splitPartEqually(multilabelutils.normalizeOutputLabels(value.output))

		_.each(output, function(value, key, list){ 
			lalelarray[key]  = lalelarray[key].concat(value)
		}, this)
	}, this)

	labelgroup=[]
	_.each(lalelarray, function(value, key, list){
		labelgroup.push([])
		_.each(_.countBy(value, function(num) {return num}), function(value1, key1, list1){ 
			labelgroup[key].push([key1,value1])
			}, this)
	},this)

	labelsorted = []
	_.each(labelgroup, function(value, key, list){ 
		labelsorted.push(_.sortBy(value, function(num){ return num[1]}))
		}, this)


	_.each(labelsorted, function(value, key, list){ 
		_.each(value, function(value1, key, list){ 
				console.log(value1[0]+"\t"+value1[1])
			}, this)
		}, this)
	return labelsorted
}

// @data is a dataset in the original format (array of JSON with input output parameters)
// output - tree with the hierarchy of the labels.
module.exports.labeltree = function(data)
	{
	Observable = {}
		_.each(data, function(datum, key, list){				
			_.each(multilabelutils.normalizeOutputLabels(datum.output), function(lab, key, list){				
				_.each(splitJson(lab), function(element, key, list){
					if (key==0)
						if (!(element in Observable))
								Observable[element] = {}
					if (key==1)
						if (!(element in Observable[list[key-1]]))
								Observable[list[key-1]][element] = {}
					if (key==2)
						if (!(element in Observable[list[key-2]][list[key-1]]))
								Observable[list[key-2]][list[key-1]][element] = {}

				}, this)
			}, this)
		}, this)
	return Observable
	}

module.exports.extend_dict = function(aggreg, current)
	{
		for (label in current)
		{
			if (!(label in aggreg))
				{
					aggreg[label]={}
					for (attr in current[label])
						{
							aggreg[label][attr]=0
						}
				}

			for (attr in current[label])
				{
					aggreg[label][attr]= aggreg[label][attr] + current[label][attr]
				}

		}
		return aggreg
	}

module.exports.generate_labels = function(output)
{
	var tags = convertlabeltree()
	var lab = []
	var compos = []

	_.each(output[0], function(intent, key, list){
		_.each(output[2], function(value1, key, list){
			lab.push([intent,value1]) 
		 }, this) 
		_.each(output[1], function(attr, key, list){ 
			lab.push([intent, attr])
			_.each(output[2], function(value, key, list){ 
				lab.push([intent, attr, value])
				// lab.push([intent,value])
			}, this)
		}, this)
	}, this)

	_.each(tags, function(value1, key, list){ 
		_.each(lab, function(value2, key, list){ 
			if ((_.difference(value1,value2)==0)&&(_.difference(value2,value1)==0))
				compos.push(joinJson(value2))
		}, this)
	}, this)

	return compos
	// console.log(compos)
	// process.exit(0)
}

/*@output - is the label in the separate format (intent, attribute, value), observable - tree of the labels
output - list of the ambiguities for intents and labels.*/
// module.exports.intent_attr_label_ambiguity = function(output)
function intent_attr_label_ambiguity(output)
	{
	Observable = labeltree
	ambiguity = []
	_.each(output[1], function(attr, key, list){
			listt = []
			_.each(output[0], function(intent, key, list){
				if (Object.keys(Observable[intent]).indexOf(attr) != -1)
					{
					listt.push(intent)
					} 
				}, this)
			// console.log(listt)
			if (listt.length >= 2)
				{
					amb = {}
					amb['attr'] = attr
					amb['list'] = listt
					ambiguity.push(amb)
				}
			}, this)
	return ambiguity
	}

/*the same as previous but for the dataset
*/
// module.exports.intent_attr_dataset_ambiguity = function(data)
function intent_attr_dataset_ambiguity(data)
	{

	Observable = labeltree
	ambiguityset = []
	_.each(data, function(value, key, list){ 
			output = (splitPartEqually(multilabelutils.normalizeOutputLabels(value.output)))
			ambig = this.intent_attr_label_ambiguity(output)
			if (ambig.length != 0)
			ambiguityset.push({'input': value['input'],
							'output': value['output'],
							'conversion': output,
							'ambiguity':ambig})
		}, this)

	return ambiguityset
}

/*testSet - dataset
output - clone of the dataset*/
// module.exports.clonedataset = function(set)

function Compensate(json) {
		// console.log(json)
	js = splitJson(json)
	if ((js.length == 2) && (js[1].toString()[0] != js[1].toString()[0].toUpperCase()))
		{
		js.push(js[1])
		js[1] = ""
		}
	return js
}


// function splitJson(json) {
// 	return splitJsonRecursive(_.isString(json) && /{.*}/.test(json)?
// 		JSON.parse(json):
// 		json);
// }
 
// function splitJsonRecursive(json) {
// 	if (!_.isObject(json))
// 		return [json];
// 	var firstKey = Object.keys(json)[0];
// 	var rest = splitJsonRecursive(json[firstKey]);
// 	rest.unshift(firstKey);
// 	return rest;
// }

// function splitPartEqually(json) {	
// 	label = []	
// 	_(3).times(function(n){
// 		buf = []
// 		_.each(json.map(Compensate), function(value, key, list){
// 			if (value.length>n)
// 			{
// 			if (_.compact(value[n].toString()).length != 0)
// 				buf = buf.concat(value[n])
// 			}
// 		})

// 		buf = _.uniq(buf)

// 		if ((buf.length > 0) && (typeof(buf[0])!="undefined"))
// 			label[n] = buf
// 		if ((typeof(buf[0])=="undefined"))
// 			label[n] = []
// 	})
// 	return label
// }

// function joinJson(parts) {
// 	var json = joinJsonRecursive(parts);
// 	return _.isString(json)? json: JSON.stringify(json);
// }

// function joinJsonRecursive(parts) {
// 	var firstKey = parts[0];
// 	if (parts.length<=1)
// 		return (firstKey=='true'? true: firstKey);
// 	else {
// 		var result = {};
// 		result[firstKey] = joinJsonRecursive(parts.slice(1));
// 		return result;
// 	}
// }

function clone(item) {
    if (!item) { return item; } // null, undefined values check

    var types = [ Number, String, Boolean ], 
        result;

    // normalizing primitives if someone did new String('aaa'), or new Number('444');
    types.forEach(function(type) {
        if (item instanceof type) {
            result = type( item );
        }
    });

    if (typeof result == "undefined") {
        if (Object.prototype.toString.call( item ) === "[object Array]") {
            result = [];
            item.forEach(function(child, index, array) { 
                result[index] = clone( child );
            });
        } else if (typeof item == "object") {
            // testing that this is DOM
            if (item.nodeType && typeof item.cloneNode == "function") {
                var result = item.cloneNode( true );    
            } else if (!item.prototype) { // check that this is a literal
                if (item instanceof Date) {
                    result = new Date(item);
                } else {
                    // it is an object literal
                    result = {};
                    for (var i in item) {
                        result[i] = clone( item[i] );
                    }
                }
            } else {
                // depending what you would like here,
                // just keep the reference, or create new object
                if (false && item.constructor) {
                    // would not advice to do that, reason? Read below
                    result = new item.constructor();
                } else {
                    result = item;
                }
            }
        } else {
            result = item;
        }
    }

    return result;
}

function biunormalizer(sentence) {
  sentence = sentence.toLowerCase().trim();
  return regexpNormalizer(sentence);
}

function copylist(list)
{
  return JSON.parse(JSON.stringify(list));
}

function wrfile(file, list)
{
  _.each(list, function(value, key, list){ 
    if (key == 0)
      fs.writeFileSync(file, JSON.stringify(value, null, 4))
    else
      fs.appendFileSync(file, JSON.stringify(value, null, 4))
  }, this)
}

function loadstopwords(filename)
{
  var output = []
  var data = fs.readFileSync(filename)
  _.each(data.toString().split("\n"), function(line, key, list){ 
    if (line != "")
      output.push(line)
  }, this)  
  return output
}

function isstopword(word)
{
  word = word.toLowerCase()
  if (stopwords.indexOf(word) != -1)
    return true
  else
    return false
}



module.exports = {
  copylist:copylist,
	// aggregate_sagae_improved: aggregate_sagae_improved,
	aggregate_sagae: aggregate_sagae, 
	convertlabeltree: convertlabeltree,
	expl_struct: expl_struct,
	aggregate_results: aggregate_results,
	aggregate_lab: aggregate_lab,
	aggregate_label: aggregate_label,
	resolve_emptiness: resolve_emptiness,
	generate_possible_labels: generate_possible_labels,
	join_labels: join_labels, 
	semlang_ambiguity: semlang_ambiguity,
	bag_of_labels_to_components: bag_of_labels_to_components,
	aggregate_two_nested: aggregate_two_nested,
	confusion_matrix:confusion_matrix,
	intent_attr_label_ambiguity:intent_attr_label_ambiguity,
	intent_attr_dataset_ambiguity:intent_attr_dataset_ambiguity,
	aggregate_label_trick: aggregate_label_trick,
	aggregate_label_no_trick: aggregate_label_no_trick,
	find_path:find_path,
	aggreate_similar:aggreate_similar,
	aggregate_sagae_no_completition: aggregate_sagae_no_completition,
	aggregate_sagae_completition:aggregate_sagae_completition,
	compareresults:compareresults,
	retrievelabels:retrievelabels, 
	sentenceStem:sentenceStem,
	dividedataset: dividedataset,
	filteraccept:filteraccept,
	filterreject:filterreject,
	comparelabels:comparelabels,
	aggregate_rilesbased:aggregate_rilesbased,
	extractturnssingle: extractturnssingle,
	extractturns: extractturns,
	isDialogue:isDialogue,
	average:average,
	complement_number:complement_number,
	truth_sentence:truth_sentence,
	generate_string:generate_string,
	deal:deal,
	intersection:intersection,
	sequencetest:sequencetest,
	convert_to_test:convert_to_test,
	convert_to_train:convert_to_train,
	extractactual:extractactual,
	treatstring:treatstring,
	retrievelabelsbytypes:retrievelabelsbytypes,
	translateLabel:translateLabel,
  resolve_emptiness_rule:resolve_emptiness_rule,
  filterValues:filterValues,
  buildlabel:buildlabel,
  labelFilter:labelFilter,
  filterzerofeatures:filterzerofeatures,
  clone:clone,
  biunormalizer:biunormalizer,
  uniqueArray:uniqueArray,
  // extractturnsneu:extractturnsneu
isactivedialogue:isactivedialogue,
isseqturn:isseqturn,
ishumanturn:ishumanturn,
isactiveturn:isactiveturn,
wrfile:wrfile,
ispermittedturn:ispermittedturn,
loadstopwords:loadstopwords,
isstopword:isstopword
}
