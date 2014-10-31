/*Problematic cases

TASK TO DO:

* resolve the same values
10 10%
find ambiguity, then the correct attribute has to be mentioned in the sentence 


* use lemmatizer in both directions (on sentence|on phase) when split the phrase of attribute/value
hours - hour
leased - lease

* catch argumentation by using function words like 'since','because of'....

[compromise, accept, issues] - was not identified because, they were used with Intent Query and actually
represent the second layer of Intent, so they should be identified by classifier

Argumentation
9 hours per day because of the generous pension
Gold: {"Offer":{"Working Hours":"9"}}
Found: Pension Fund,Working Hours,9
{ TP: [ '9', 'Working Hours' ], FP: [ 'Pension Fund' ], FN: [] }

Lemmatize
salary 20000 , project manager, with leased car, 10% pension fund, fast promotion track and 10 hour days?
Gold: {"Offer":{"Job Description":"Project Manager"}},{"Offer":{"Leased Car":"With leased car"}},{"Offer":{"Pension Fund":"10%"}},{"Offer":{"Promotion Possibilities":"fast"}},{"Offer":{"Salary":"20000"}},{"Offer":{"Working Hours":"10"}}
Found: Salary,20000,Pension Fund,10%,Promotion Possibilities,fast,Project Manager,Job Description,With leased car,Leased Car
{ TP: 
   [ '10%',
     '20000',
     'Job Description',
     'Leased Car',
     'Pension Fund',
     'Project Manager',
     'Promotion Possibilities',
     'Salary',
     'With leased car',
     'fast' ],
  FP: [],
  FN: [ '10', 'Working Hours' ] }

Lemmatize
so, do we agree on a programming position with a leased car and a 10% pension?
Gold: {"Offer":{"Job Description":"Programmer"}},{"Offer":{"Leased Car":"With leased car"}},{"Offer":{"Pension Fund":"10%"}}
Found: Pension Fund,10%,Leased Car
{ TP: [ '10%', 'Leased Car', 'Pension Fund' ],
  FP: [],
  FN: [ 'Job Description', 'Programmer', 'With leased car' ] }


!!!! May be we should use new label {"Offer":"Pension"} - "Offer:Attribute"
or use some default value for non existing value
hi, i will offer 12000 with a car and a pension
Gold: {"Greet":true},{"Offer":{"Leased Car":"With leased car"}},{"Offer":{"Salary":"12000"}}
Found: 12000,Salary,Pension Fund,Leased Car,Without leased car,With leased car
{ TP: [ '12000', 'Leased Car', 'Salary', 'With leased car' ],
  FP: [ 'Pension Fund', 'Without leased car' ],
  FN: [] }


actually "job" just point out that there is an acceptance.
you can have the job, but no car.
Gold: {"Accept":"previous"},{"Reject":"Leased Car"}
Found: Job Description,Leased Car,Without leased car,With leased car
{ TP: [ 'Leased Car' ],
  FP: [ 'Job Description', 'With leased car', 'Without leased car' ],
  FN: [] }

Same case
think it over.  its a good job, and a good offer.
Gold: {"Insist":"previous"}
Found: Job Description
{ TP: [], FP: [ 'Job Description' ], FN: [] }

Difficult case when context determines the attribute
without, please
Gold: {"Offer":{"Leased Car":"Without leased car"}}
Found: 
{ TP: [], FP: [], FN: [ 'Leased Car', 'Without leased car' ] }

May be we should use lexical resources for Attributes
i am willing to pay that amount if you commit to working 10 hours for our company
Gold: {"Accept":"Salary"},{"Insist":"Working Hours"},{"Offer":{"Working Hours":"10"}}
Found: Working Hours,10
{ TP: [ '10', 'Working Hours' ], FP: [], FN: [ 'Salary' ] }

'%' sign was omitted, create more profound identification
i offer 10 for pension
Gold: {"Offer":{"Pension Fund":"10%"}}
Found: Pension Fund,10,Working Hours
{ TP: [ 'Pension Fund' ],
  FP: [ '10', 'Working Hours' ],
  FN: [ '10%' ] }


"Salary" is the part of argumentation 
no leased car since i had to increase the salary
Gold: {"Offer":{"Leased Car":"Without leased car"}}
Found: Salary,Without leased car,Leased Car
Placement: 
[ [ 42, 48, 'Salary', 'salary' ],
  [ -1, -1, 'Without leased car', '' ],
  [ 3, 13, 'Leased Car', 'leased car' ] ]
{ TP: [ 'Leased Car', 'Without leased car' ],
  FP: [ 'Salary' ],
  FN: [] }

Reject invert the value
you can have the job, but no car.
Gold: {"Accept":"previous"},{"Reject":"Leased Car"}
Found: Job Description,Without leased car,Leased Car
Placement: 
[ [ 17, 20, 'Job Description', 'job' ],
  [ -1, -1, 'Without leased car', '' ],
  [ 29, 32, 'Leased Car', 'car' ] ]
{ TP: [ 'Leased Car' ],
  FP: [ 'Job Description', 'Without leased car' ],
  FN: [] }

there will be no car. you will only recieve a car if you work 10 hour days
Gold: {"Offer":{"Leased Car":"With leased car"}},{"Offer":{"Working Hours":"10"}}
Found: 10,Working Hours,Without leased car,Leased Car
Placement: 
[ [ 62, 64, '10', '10' ],
  [ -1, -1, 'Without leased car', '' ],
  [ 17, 20, 'Leased Car', 'car' ] ]
{ TP: [ '10', 'Leased Car', 'Working Hours' ],
  FP: [ 'Without leased car' ],
  FN: [ 'With leased car' ] }




Truthteller miss

no leased car and a slow promotion track?
Gold: {"Offer":{"Leased Car":"Without leased car"}},{"Offer":{"Promotion Possibilities":"slow"}}
Found: Promotion Possibilities,slow,With leased car,Leased Car
Placement: 
[ [ 25, 34, 'Promotion Possibilities', 'promotion' ],
  [ 20, 24, 'slow', 'slow' ],
  [ -1, -1, 'With leased car', '' ],
  [ 3, 13, 'Leased Car', 'leased car' ] ]
{ TP: [ 'Leased Car', 'Promotion Possibilities', 'slow' ],
  FP: [ 'With leased car' ],
  FN: [ 'Without leased car' ] }

1       car     car     NOUN    NN      _       0       ROOT    _       _       _       U       _       _
2       no      no      DETERMINER      DT      _       1       det     _       _       _       _       _       _
3       leased  lease   VERB    VBN     _       1       amod    _       _       +/-NoF  P       U       U
4       and     and     PREPOSITION     CC      _       1       cc      _       _       _       _       _       _
5       track   track   NOUN    NN      _       1       conj    _       _       _       U       _       _
6       a       a       DETERMINER      DT      _       5       det     _       _       _       _       _       _
7       slow    slow    ADJECTIVE       JJ      _       5       amod    _       _       _       P       _       _
8       promotion       promotion       NOUN    NN      _       5       nn      _       _       _       P       _       _
9       ?       ?       PUNCTUATION     .       _       1       punct   _       _       _       _       _       _

Reject Leased Car Issue
no i can not agree to leased car
Gold: {"Reject":"Leased Car"}
Found: Without leased car,Leased Car
Placement: 
[ [ -1, -1, 'Without leased car', '' ],
  [ 22, 32, 'Leased Car', 'leased car' ] ]
{ TP: [ 'Leased Car' ], FP: [ 'Without leased car' ], FN: [] }

*/

// i can do 10 - [ '{"Offer":{"Working Hours":"10"}}' ]
//  attribute is context dependent, and it's important when values are not unique for attribute


var _ = require('underscore')._;
var bars = require('../../utils/bars.js')._;
var truth_utils = require('./truth_utils')
var fs = require('fs');
var trainAndTest= require('../../utils/trainAndTest').trainAndTest_hash;
var Hierarchy = require('../../Hierarchy');
var multilabelutils = require('limdu/classifiers/multilabel/multilabelutils');
var trainutils = require('../../utils/bars')
var natural = require('natural');
var limdu = require("limdu");
var ftrs = limdu.features
var bars = require('../../utils/bars')
var splitJson = Hierarchy.splitJson
var PrecisionRecall = require("limdu/utils/PrecisionRecall");
var cp = require("child_process");


var truth_filename = "sentence_to_truthteller.txt"
var path = "../../truthteller/truth_teller"
var easyfirst_path = "./run_ef.sh"
var truth_path = "./run.sh -f ../../research/rule-based/sentence_to_truthteller.txt"

var regexpNormalizer = ftrs.RegexpNormalizer(
		JSON.parse(fs.readFileSync('../../knowledgeresources/BiuNormalizations.json')));


function normalizer(sentence) {
	sentence = sentence.toLowerCase().trim();
	return regexpNormalizer(sentence);
}


function getFound(sentence)
{
	var data = []
	_.each(Values, function(values, key1, list1){ 
		
		data = data.concat(inSentence(sentence, key1))

		_.each(values, function(value, key2, list2){
			data = data.concat(inSentence(sentence, value))

			// var found = inSentence(record['input'], value)
			// if (found.length != 0)
				// {
				// data[key]['found'].push([found, value])
				// }
			// if (found == true)
				// data[key]['found'].push(value)

		}, this)
	 }, this) 
// 9 hours with leased
	// if (sentence == "i agree to with leased @ 8 hours with slow promotion track")
		// {
		// console.log(data)
		// console.log()
		// process.exit(0)
		// }
	return data
}

function inSentence(sentence, keyphrase)
{
	var goldLable = keyphrase
	keyphrase = keyphrase.toLowerCase()
	// var output = []

	// var sentenceList = sentence.split(" ")

	// _.each(sentenceList, function(element, key, list){
	// 	if (element == keyphrase)
	// 		output.push(key)
	// }, this)

	var listToFind = []
	var output = []

	listToFind.push(keyphrase)
	listToFind = _.unique(listToFind.concat(keyphrase.split(" ")))

	// remove "with" from labels
	listToFind = _.without(listToFind,'with')
	listToFind = _.without(listToFind,'without')
	listToFind = _.without(listToFind,'working')
	listToFind = _.without(listToFind,'no')

	// console.log(listToFind)
	// process.exit(0)
	var alreadycared = false

	_.each(listToFind, function(phrase, key, list){ 
		var index = sentence.indexOf(phrase)
		if (index != -1)
			{
			if ((goldLable == 'Leased Car') && (alreadycared == false))
				{
				alreadycared = true
				var negation = truth_utils.negation(sentence.replace('without','no'),['agreement'], truth_filename)	
				if (negation == true)
					{
						output.push([-1,-1,'No agreement',''])
					}
				else
					{	
					var negation1 = truth_utils.negation(sentence.replace('without','no'),['car','lease'], truth_filename)	
					if (negation1 == true)
						output.push([-1,-1,'Without leased car',''])
					else
						output.push([-1,-1,'With leased car',''])
					}
				}
			// return [sentence.indexOf(keyphrase)]
			output.push([index, index + phrase.length, goldLable, sentence.slice(index, index + phrase.length)])
			}
		// else
			// res = false
	}, this)



	// if (sentence == "i agree to with leased @ 8 hours with slow promotion track")
		// {
			// console.log(output)
			// console.log(goldLable)
		// }
	// process.exit(0)
	return output
}

function onlyValue(labels)
{
	var output = []
	_.each(labels, function(label, key, list){ 
		var lablist = splitJson(label)
		// if (lablist.length == 3 )
			// output.push(lablist[2])  
		output = output.concat(lablist.slice(1))  
	}, this)

	// ignore previous and true
	output = _.without(output, 'previous')
	output = _.without(output, 'true')
	output = _.without(output, true)
	output = _.without(output, 'accept')
	output = _.without(output, 'issues')
	output = _.without(output, 'compromise')
	return output
}

function uniqueValuesF(data)
{
	var lab = []
	var alll = _.map(data, function(num){ return num[2]; });

	_.each(data, function(label, key, list){ 
		lab.push(label)
		_.each(Values, function(value1, key1, list1){
			 if ((value1.indexOf(label[2]) != -1) && (alll.indexOf(key1) == -1))
			 	lab.push([-1,-1,key1])
		}, this)
	}, this)
	return lab
}


function uniqueValues(data)
{
	var lab = []
	_.each(data, function(label, key, list){ 
		lab.push(label)
		_.each(Values, function(value1, key1, list1){
			 if ((value1.indexOf(label) != -1) && (data.indexOf(key1) == -1))
			 	lab.push(key1)
		}, this)
	}, this)
	return lab
}

function filtering(data)
{
	var toelim = []
	// console.log(data)
	_.each(data, function(elem1, key1, list1){
		_.each(data, function(elem2, key2, list2){
			if (((elem1[0]<elem2[0]) && (elem1[1]>=elem2[1])) ||
				((elem1[0]<=elem2[0]) && (elem1[1]>elem2[1])))
					toelim.push(key2)
		 }, this) 
	}, this)

	_.each(toelim, function(value, key, list){
		data[value] = []
	}, this)

	// console.log(toelim)

	var datacopy = []
	_.each(data, function(value, key, list){ 
		if (data[key].length != 0)
			datacopy.push(data[key])
	}, this)

	return datacopy
}

Itents = ['Offer', 'Accept', 'Reject', 'Insist', 'QueryYN', 'QueryWH']
IntentsSingle = ['Greet', 'Quit']
Attributes = ['Salary', 'Pension Fund', 'Working Hours', 'Promotion Possibilities', 'Job Description', 'Leased Car']
Values = {'Salary': ['7000','10000','12000', '20000'],
		  'Pension Fund': ['0%','10%','15%','20%'],
		  'Promotion Possibilities': ['fast','slow'],
		  'Working Hours': ['8','9','10'],
		  'Job Description': ['QA','Programmer','Team Manager','Project Manager'],
		  // 'Leased Car': ['Without leased car', 'With leased car', 'No agreement']
		  'Leased Car': ['Ferrari']
		}

function transl(output, input)
{
	// console.log(output)
	var ValueTransition =
	{
	"8 hours": "8",
	"9 hours": "9",
	"10 hours": "10",
	"7,000 NIS": "7000",
	"12,000 NIS": "12000",
	"20,000 NIS": "20000",
	// "0%": "0%",
	// "10%": "10%",
	// "20%": "20%",
	"Fast promotion track": "fast",
	"Slow promotion track": "slow"
	} 

	Intent = ['Offer', 'Query', 'Accept', 'Reject', 'Insist', 'Append','previous',
			'true', true, 'accept', 'issues', 'compromise', 'Greet', 'Quit']

	_.each(output['single_labels'], function(value, key, list){ 
		if (key in ValueTransition)
			{
			output['single_labels'][ValueTransition[key]] = value
			delete output['single_labels'][key]
			}
	}, this)

	_.each(output['single_labels'], function(value, key, list){ 
		if (Intent.indexOf(key) != -1)
			delete output['single_labels'][key]
	}, this)

	return output
}


var stats = new PrecisionRecall();

// dataset = [
			// "5_woz_ncagent_turkers_negonlp2ncAMT_fixed.json",
		    // "nlu_ncagent_turkers_negonlpncAMT_fixed.json"
			// ]

// var data = []
// _.each(dataset, function(value, key, list){ 
	// data = data.concat(JSON.parse(fs.readFileSync("../../datasets/Employer/"+value)))
// })

var data = JSON.parse(fs.readFileSync("../../sequence.json"))

// normalization
_.each(data, function(record, key, list){ 
	record['input'] = normalizer(record['input'])
	record['output'] = transl(record['output'], record['input'])
	// console.log(record['output'])
	// process.exit(0)
	// _.each(record['output'], function(value, key, list){
		 // record['output'][key] = bars.translateLabel(value)
	// }, this)
}, this)

var file_content = _.reduce(data, function(memo, num){ 
	if (memo == 0) memo = ""
	return memo+num['input'].replace('without','no')+"\n"; }, 0);
fs.writeFileSync(truth_filename, file_content, 'utf-8', function(err) {})

cp.exec(easyfirst_path, {cwd: path}, function(error,stdout,stderr){
})



setTimeout(function() {
	cp.exec(truth_path, {cwd: path}, function(error,stdout,stderr){
		_.each(data, function(record, key, list){
			data[key]['found'] = getFound(record['input'])
			// data[key]['found'] = getFound('programmer')

			data[key]['found'] = filtering(data[key]['found'])

			data[key]['got'] = _.map(data[key]['found'], function(num){ return num[2]; });

			data[key]['got'] = uniqueValues(data[key]['got'])	

			data[key]['found'] = uniqueValuesF(data[key]['found'])	
				
			// 	if (inSentence(record['input'], key1) == true)
			// 		data[key]['found'].push(key1)

			// 	_.each(values, function(value, key2, list2){
			// 		var found = inSentence(record['input'], value)
			// 		// if (found.length != 0)
			// 			// {
			// 			// data[key]['found'].push([found, value])
			// 			// }
			// 		if (found == true)
			// 			data[key]['found'].push(value)

			// 	}, this)
			//  }, this) 
		}, this)

	// evaluation
		_.each(data, function(record, key, list){

			var correctactualformat = []

			_.each(record['found'], function(value, key, list){ 
				correctactualformat.push([value[2],[value[0],value[1]]])
			}, this)

			// console.log("final")
			// console.log(record['output'])
			var expl = stats.addCasesHashSeq(record['output'], correctactualformat, true);
			if ((expl['FP'].length!=0) || (expl['FN'].length!=0))
			{
				console.log(record['input'])
				// console.log("Gold: "+record['output'])
				console.log(JSON.stringify(record['output'], null, 4))
				console.log("Found: "+record['got'])
				console.log("Placement: ")
				console.log(record['found'])
				console.log(expl)
				console.log("---------------------------") 
			}
		}, this)

		console.log(stats.retrieveStats())
		process.exit(0)


	})
}, 10000);




// console.log(bars.Values)
// process.exit(0)

// console.log(data)
// process.exit(0)

// console.log(natural.JaroWinklerDistance('10','1'))
// var a = trainutils.retrievelabelsbytypes()
// console.log(a)
// process.exit(0)
