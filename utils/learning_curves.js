/*
	Draw learning curves of classifiers
	A "learning curve" is a graph of the performance of a certain classifier, as a function of the number of training instances.
	You can draw learning curves of several classifiers on the same graph, for the sake of comparison.
	You can measure the performance can using several parameters, such as: accuracy, F1, etc.
	The graphs are drawn by "gnuplot", so you must have gnuplot installed in order to use this unit.
	@author Vasily Konovalov
 */


var _ = require('underscore')._;
var fs = require('fs');
var execSync = require('execSync')
var classifier = require(__dirname+"/../classifiers.js")
var partitions = require('limdu/utils/partitions');
var trainAndTest_hash = require(__dirname+'/trainAndTest').trainAndTest_hash;
var bars = require(__dirname+'/bars');
var path = require("path")


var gnuplot = __dirname + '/gnuplot'
var dirr = "/learning_curves/"
/* @params classifiers - classifier for learning curves
   @params dataset - dataset for evaluation, 20% is takes for evaluation
   @params parameters - parameters we are interested in 
   @params step - step to increase a train set 

   The example of module.exports = {
	learning_curves: learning_curves, 
	extractGlobal: extractGlobal,
	getAverage: getAverage
}the input is following.

classifiers  = {
	Adaboost: limdu.classifiers.multilabel.Adaboost, 
	PassiveAggressive: limdu.classifiers.multilabel.PassiveAggressive
	};

parameters = ['F1','TP','FP','FN','Accuracy','Precision','Recall']
*/
/*
{
    "F1": {
        "2": {module.exports = {
	learning_curves: learning_curves, 
	extractGlobal: extractGlobal,
	getAverage: getAverage
}
            "PPDB": [ 0.6666666666666666 ],
            "Original": [ 0.16666666666666666 ]
        }
    },
    "Precision": {
        "2": {
            "PPDB": [ 0.7777777777777778 ],
            "Original": [ 1 ]
        }
    },
    "Recall": {
        "2": {
            "PPDB": [ 0.5833333333333334 ],
            "Original": [ 0.09090909090909091 ]
        }
    },
    "FN": {
        "2": {
            "PPDB": [ 5 ],
            "Original": [ 10 ]
        }
    }
}
param
F1
trainsize
2
[ 0.6666666666666666, 0.16666666666666666 ]
classifiers
[ [ 'PPDB', [] ], [ 'Original', [] ] ]
*/

function onlyNumbers(list)
{
	var output = []
	_.each(list, function(value, key, list){ 
		if (bars.isNumber(value))
			output.push(value)
	}, this)
	return output
}

function getAverage(stat, param, trainsize, classifiers)
	{
		var average = []
		_.each(Object.keys(classifiers), function(classifier, key, list){
			var list = onlyNumbers(stat[param][trainsize][classifier])
			average.push(_.reduce(list , function(memo, num){ return memo + num; }, 0)/list.length)
		}, this)
		
		return average
	}

function extractGlobal(parameters, classifiers, trainset, report, stat)
	{
	var ord = 0

	var trainsize = trainset.length

	if (_.size(classifiers) == 0)
		throw new Error("List of classifiers is empty");

	if (parameters.length == 0)
		throw new Error("List of parameters is empty");

	_.each(Object.keys(classifiers), function(classifier, key, list){
		_.each(parameters, function(param, key, list){ 
    		if (!(param in stat)) 
    			stat[param]={}

    		if (!(trainsize in stat[param]))
    		{
    		stat[param][trainsize]={}
    		stat[param][trainsize]={_size: bars.extractdataset(trainset).length}
    		}

    		if (!(classifier in stat[param][trainsize]))
    			stat[param][trainsize][classifier] = []

    		stat[param][trainsize][classifier].push(report[ord][param])
    	}, this)
    	ord = ord + 1
	}, this)
	}

function checkGnuPlot()
	{
		var result = execSync.run(gnuplot);
		if (result !=0 ) {
			console.log("gnuplot is not found")
			return 0
		}
	}

function isProb(results)
{
	return _.filter(results, function(num){ return ((num > 1)  || (num<0))}).length == 0
}

function filternan(input)
{
	if (_.isArray(input))
	{
		var output = []

		_.each(input, function(value, key, list){ 
			if (bars.isNumber(value))
			{
				if (value != -1)
					output.push(value)
				else
					output.push("?")
			}
			else
				output.push("?")
		}, this)
	}
	else
	{
		var output = ''
		if (bars.isNumber(input))
		{
			if (input != -1)
				output = input
			else
				output = "?"
		}
		else
			output = "?"
	}
	return output
}

function thereisdata(data)
{
	var output = false
	if (_.isArray(data))
		{
			_.each(data, function(elem, key, list){
				if (elem != '?')				
					output = true
			}, this)
		}
	else
		if (data != '?')
			output = true

	return output
}


function plot(fold, parameter, stat, classifiers)
{
	var values = []
	var linetype = fold

	var header = "train\t" + Object.keys(classifiers).join("-fold"+fold+"\t")+"-fold"+fold+"\n";
	fs.writeFileSync(__dirname + dirr + parameter+"fold"+fold, header, 'utf-8')

	var str = ""
	
	if (fold != 'average')
	{
		_.each(stat[parameter], function(value, trainsize, list){ 
			// str += trainsize.toString() + "(" + stat[parameter][trainsize]['_size'] + ")" + "\t"
			str += trainsize.toString() + "\t"
			_.each(value, function(results, cl, list){ 
				if (cl != '_size')
				{
					values.push(filternan(results[fold]))
					str += filternan(results[fold]) + "\t"
				}
			}, this)
			str += "\n"
		}, this)
	}
	else
	{
		_.each(stat[parameter], function(value, trainsize, list){ 
			var average = getAverage(stat, parameter, trainsize, classifiers)
			// str += trainsize.toString() + "(" + stat[parameter][trainsize]['_size'] + ")" + "\t"+filternan(average).join("\t")+"\n"
			str += trainsize.toString() + "\t"+filternan(average).join("\t")+"\n"
			values = values.concat(filternan(average))
		}, this)

		linetype = 5
	}

	var plot = thereisdata(values)
	// console.log(parameter)
	// console.log(values)

	fs.appendFileSync(__dirname + dirr +parameter+"fold"+fold, str, 'utf-8')

	if (plot)
	{
		// var foldcom = " for [i=2:"+ (_.size(classifiers) + 1)+"] \'" + __dirname + dirr + parameter + "fold"+fold+"\' using 1:i:xtic(1) with linespoints linecolor i pt "+linetype+" ps 3"
		var foldcom = " for [i=2:"+ (_.size(classifiers) + 1)+"] \'" + __dirname + dirr + parameter + "fold"+fold+"\' using 1:i with linespoints linecolor i pt "+linetype+" ps 3"
		// var com = gnuplot +" -p -e \"reset; set title \'"+stat['_sized']+"("+stat['_sizec']+")\'; set datafile missing '?'; "+(isProb(values) ? "set yrange [0:1];" : "") +" set term png truecolor size 1024,1024; set grid ytics; set grid xtics; set key bottom right; set output \'"+ __dirname + dirr + parameter + "fold"+fold+".png\'; set key autotitle columnhead; plot "+foldcom +"\""
		var com = gnuplot +" -p -e \"reset; set datafile missing '?'; "+(isProb(values) ? "set yrange [0:1];" : "") +" set term png truecolor size 1024,1024; set grid ytics; set grid xtics; set key bottom right; set output \'"+ __dirname + dirr + parameter + "fold"+fold+".png\'; set key autotitle columnhead; plot "+foldcom +"\""
		result = execSync.run(com)
	}
}


function learning_curves(classifiers, dataset, parameters, step, step0, limit, numOfFolds) 
{

		checkGnuPlot

		if (dataset.length == 0)
			throw new Error("Dataset is empty");
		
		stat = {}
		
		var mytrain = []

		partitions.partitions_consistent(dataset, numOfFolds, function(train, test, fold) {
			console.log("fold"+fold)
			var index = step0
			var oldreport = []
			var stats

			while (index <= train.length)
	  		{
			  	var report = []

				var mytrain = train.slice(0, index)
			  	
			  	index += (index < limit ? step0 : step)
			  	var mytrainset = (bars.isDialogue(mytrain) ? bars.extractdataset(mytrain) : mytrain)
			  	var testset = (bars.isDialogue(test) ? bars.extractdataset(test) : test)

			  	_.each(classifiers, function(classifier, name, list){ 
			  		console.log("start trainandTest")
	    			stats = trainAndTest_hash(classifier, mytrainset, bars.copyobj(testset), 5)
		    		console.log("stop trainandTest")
		    		report.push(_.pick(stats[0]['stats'], parameters))
			  	}, this)

			  	if (oldreport.length > 0)
			  	{
			  		console.log("ENTRANCE")
			  		var done = false

			  		_.each(oldreport[0]['data'], function(value, key, list){

			  			if (stats[0]['data'][key]['input'] != value['input'])
			  				{
			  					console.log("error")
			  					process.exit(0)
			  				}
			  			
			  			if (stats[0]['data'][key]['explanation']['TP'].length < value['explanation']['TP'].length)
			  			{
			  				console.log("old")
			  				console.log(value)
			  				console.log("new")
			  				console.log(stats[0]['data'][key])
			  				done = true
			  				
			  			}

			  			if (stats[0]['data'][key]['explanation']['FN'].length > value['explanation']['FN'].length)
			  			{
			  				console.log("old")
			  				console.log(value)
			  				console.log("new")
			  				console.log(stats[0]['data'][key])
			  				done = true
			  			}

			  		}, this)
			  	}

			  	oldreport = bars.copyobj(stats)

                extractGlobal(parameters, classifiers, mytrain, report, stat)

                stat['_sized'] = test.length
                stat['_sizec'] = bars.extractdataset(test).length

                _.each(parameters, function(parameter, key, list){
					plot(fold, parameter, stat, classifiers)
					plot('average', parameter, stat, classifiers)
				})

			} //while (index < train.length)
			}); //fold

}

if (process.argv[1] === __filename)
{

	var dataset = JSON.parse(fs.readFileSync(__dirname + "/../../datasets/DatasetDraft/dial_usa_rule_core.json"))
	dataset = _.shuffle(dataset)

	var classifiers  = {
				Expansion1:   classifier.IntentClassificationExpansion1,
				Expansion1Fine: classifier.IntentClassificationExpansion1Fine,
				// Expansion2:   classifier.IntentClassificationExpansion2,
				NoExpansion: classifier.IntentClassificationNoExpansion,
				Expansion1Unigrams: classifier.IntentClassificationExpansion1Phrase
			}
	
	var parameters = [
					  'F1','Precision','Recall', 'FN', 'Accuracy',
					  'OfferF1', 'OfferPrecision', 'OfferRecall', 'OfferFN', 'OfferTP', 'OfferAccuracy', 
					  'RejectF1','RejectPrecision','RejectRecall', 'RejectFN', 'RejectTP', 'RejectAccuracy', 
					  'AcceptF1','AcceptPrecision','AcceptRecall', 'AcceptFN', 'AcceptTP', 'AcceptAccuracy', 
					  'GreetF1','GreetPrecision','GreetRecall', 'GreetFN', 'GreetAccuracy'
					]
	
	var filtered = bars.filterdataset(dataset, 5)
	console.log(filtered.length)

	learning_curves(classifiers, filtered, parameters, 10/*step*/, 2/*step0*/, 30/*limit*/,  5/*numOfFolds*/, function(){
		console.log()
		process.exit(0)
	})
		
}

module.exports = {
	learning_curves: learning_curves, 
	extractGlobal: extractGlobal,
	getAverage: getAverage,
	filternan:filternan,
	onlyNumbers:onlyNumbers,
	isProb:isProb,
	getAverage:getAverage,
	thereisdata:thereisdata
}