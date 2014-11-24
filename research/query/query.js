var _ = require('underscore')._;
var Hierarchy = require('../../Hierarchy');
var fs = require('fs');
var limdu = require("limdu");
var ftrs = limdu.features
var bars = require('../../utils/bars')
var splitJson = Hierarchy.splitJson
var PrecisionRecall = require("limdu/utils/PrecisionRecall");

var regexpNormalizer = ftrs.RegexpNormalizer(
		JSON.parse(fs.readFileSync(__dirname+'/../../knowledgeresources/BiuNormalizations.json')));

function normalizer(sentence) {
	sentence = sentence.toLowerCase().trim();
	return regexpNormalizer(sentence);
}

function detectQuery(input)
{
	var elim = ['do you','does','do we','what','which']	
	var output = []
	
	_.each(elim, function(element, key, list){
		if (input.indexOf(element) != -1)
			output = ['Query']
	}, this)

	return output
}

function onlyQuery(labels)
{
	var output = []
	_.each(labels, function(label, key, list){ 
		var lablist = splitJson(label)
		// if (lablist.length == 3 )
			// output.push(lablist[2])  
		output = output.concat(lablist[0])  
	}, this)

	if (output.indexOf("Query") != -1) return ['Query']
		else
		return []
	
}

var dataset = [
			"turkers_keyphrases_only_rule.json",
			// "students_keyphrases_only_rule.json"
			]

var data = []
_.each(dataset, function(value, key, list){ 
	data = data.concat(JSON.parse(fs.readFileSync("../../../datasets/Employer/Dialogue/"+value)))
	// data = data.concat(JSON.parse(fs.readFileSync("../../datasets/Candidate/"+value)))
})

data = bars.extractturns(data)
data = _.shuffle(data)

var datanew = []
_.each(data, function(record, key, list){ 
	data[key]['input'] = normalizer(record['input'])
	// if (data[key]['input'] != "")
		// datanew.push(data[key])
}, this)

var stats = new PrecisionRecall();

_.each(data, function(record, key, list){
	var expl = stats.addCasesHash(onlyQuery(record['output']), detectQuery(record['input']))
	if ((expl['FP'].length!=0) || (expl['FN'].length!=0))
		{
			console.log(record['input'])
			console.log(record['output'])
			console.log("---------------------")
		}
})

console.log(stats.retrieveStats())
process.exit(0)