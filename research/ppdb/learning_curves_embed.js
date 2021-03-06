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
// var classifier = require(__dirname+"/../classifiers.js")
var partitions = require('limdu/utils/partitions');
// var trainAndTest_hash = require(__dirname+'/trainAndTest').trainAndTest_hash;
var bars = require('../../utils/bars');
var path = require("path")

var modes = require("./modes")
var framework = require("./evalmeasure_framework")

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
			average.push(_.reduce(list , function(memo, num){ if (num >=0) {return (memo + num)} else {return memo} }, 0)/_.filter(list, function(num){ return num >= 0 }).length
)
		}, this)
		
		return average
	}

function extractGlobal(parameters, classifiers, trainset, report, stat)
	{

	var trainsize = trainset.length

	if (_.size(classifiers) == 0)
		throw new Error("List of classifiers is empty");

	if (parameters.length == 0)
		throw new Error("List of parameters is empty");

	_.each(parameters, function(param, key, list){ 

		if (!(param in stat)) stat[param]={}
    	if (!(trainsize in stat[param])) stat[param][trainsize]={}
    	if (!('_size' in stat[param][trainsize])) stat[param][trainsize]['_size'] = []
		if (!('__size' in stat[param][trainsize])) stat[param][trainsize]['__size'] = []
    	
    	if (param.indexOf("_") != -1)
    	{
    		stat[param][trainsize]['__size'].push(bars.extractintent(trainset, param.substring(0,param.indexOf("_"))).length)
    	}
    	else
    	stat[param][trainsize]['__size'].push(bars.extractdataset(trainset).length)

    	stat[param][trainsize]['_size'].push(bars.extractdataset(trainset).length)

		_.each(Object.keys(classifiers), function(classifier, key, list){
    		
    		if (!(classifier in stat[param][trainsize]))
    			stat[param][trainsize][classifier] = []

    		stat[param][trainsize][classifier].push(report[key][param])
    
    	}, this)
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


function compare(gldata)
{

	var names = Object.keys(gldata)
	var maxlen = gldata[names[0]].length
	var diff = []

	console.log('Length of output '+maxlen)

	_(maxlen).times(function(n){
		var glodata = {}
		var locdata = {}
		_.each(gldata, function(value, name, list){ 
			locdata[name] = gldata[name][n]['explanation']
			glodata[name] = gldata[name][n]
		}, this)

		if (!bars.equallist(_.values(locdata)))
			diff.push(glodata)

		// kNN_And
		// kNN_And_1

		// if ('kNNClassifier' in locdata)
			// if ((locdata['kNNClassifier']['FP'].length != 0) || (locdata['kNNClassifier']['FN'].length != 0))
				// diff.push(glodata)
		
		// if ((locdata['kNN_And_1']['TP'].length < locdata['kNN_And']['TP'].length) ||
			// (locdata['kNN_And_1']['FN'].length > locdata['kNN_And']['FN'].length))
				// diff.push(glodata)

		// if ((locdata['kNN_Cos']['TP'].length < locdata['kNN_And']['TP'].length) ||
			// (locdata['new']['FN'].length > locdata['old']['FN'].length))
				// diff.push(glodata)



	})

	console.log('Length of diff '+diff.length)
	console.log(JSON.stringify(diff, null, 4))


}


function plot(fold, parameter, stat, classifiers)
{

	var values = []
	var linetype = fold

	// console.log(JSON.stringify(stat, null, 4))

	var header = "train\t" + Object.keys(classifiers).join("-fold"+fold+"\t")+"-fold"+fold+"\n";
	fs.writeFileSync(__dirname + dirr + parameter+"fold"+fold, header, 'utf-8')

	var str = ""
	
	if (fold != 'average')
	{
		_.each(stat[parameter], function(value, trainsize, list){ 
			// str += trainsize.toString() + "(" + stat[parameter][trainsize]['_size'] + ")" + "\t"
			
			 if(value['__size'][fold] == null){

			 	console.log(JSON.stringify(stat, null, 4))
			 	console.log(JSON.stringify(parameter, null, 4))
			 	console.log(JSON.stringify(fold, null, 4))
			 	console.log(JSON.stringify(trainsize, null, 4))

			 	console.log(JSON.stringify(classifiers, null, 4))
			 	console.log(JSON.stringify(value['__size'][fold], null, 4))
			 	
			 	process.exit(0)

			 }


			str += trainsize.toString() + "(" + value['__size'][fold].toFixed(1)+ ")\t"
			_.each(value, function(results, cl, list){ 
				if ((cl != '_size') && (cl != '__size'))
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
			
			if (parameter.indexOf("_"))
				var intent = parameter.substring(0,parameter.indexOf("_")).length

			var average = getAverage(stat, parameter, trainsize, classifiers)
			var intsize = _.reduce(stat[parameter][trainsize]['__size'], function(memo, num){ return (memo + num) }, 0)/stat[parameter][trainsize]['__size'].length
			// str += trainsize.toString() + "(" + stat[parameter][trainsize]['_size'] + ")" + "\t"+filternan(average).join("\t")+"\n"
			str += trainsize.toString() + "(" + intsize.toFixed(1) + ")\t"+filternan(average).join("\t")+"\n"
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
		var foldcom = " for [i=2:"+ (_.size(classifiers) + 1)+"] \'" + __dirname + dirr + parameter + "fold"+fold+"\' using 1:i:xtic(1) with linespoints linecolor i pt "+linetype+" ps 3"
		// var com = gnuplot +" -p -e \"reset; set title \'"+stat['_sized']+"("+stat['_sizec']+")\'; set datafile missing '?'; "+(isProb(values) ? "set yrange [0:1];" : "") +" set term png truecolor size 1024,1024; set grid ytics; set grid xtics; set key bottom right; set output \'"+ __dirname + dirr + parameter + "fold"+fold+".png\'; set key autotitle columnhead; plot "+foldcom +"\""
		var com = gnuplot +" -p -e \"reset; set datafile missing '?'; "+(isProb(values) ? "set yrange [0:1];" : "") +" set term png truecolor size 1024,1024; set grid ytics; set grid xtics; set key bottom right; set output \'"+ __dirname + dirr + parameter + "fold"+fold+".png\'; set key autotitle columnhead; plot "+foldcom +"\""
		// console.log(com)
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
			var index = step0
			var oldstats = []
			var stats

			fs.writeFileSync(__dirname + dirr + "fold" + fold, "TEST \n"+JSON.stringify(test, null, 4)+"\n TRAIN \n"+JSON.stringify(train, null, 4), 'utf-8')

			while (index <= train.length)
	  		{
			  	var report = []

				var mytrain = train.slice(0, index)
			  	
			  	index += (index < limit ? step0 : step)
			  	var mytrainset = (bars.isDialogue(mytrain) ? bars.extractdataset(mytrain) : mytrain)
			  	var testset = (bars.isDialogue(test) ? bars.extractdataset(test) : test)

				console.log("fold"+fold)
				console.log("train"+mytrainset.length)

			  	var gldata = {}

			  	_.each(classifiers, function(classifier, name, list){ 
			  		console.log("start trainandTest")
	    			stats = framework.trainandtest(bars.copyobj(mytrainset), bars.copyobj(testset), classifier)
		    		
					fs.writeFileSync(__dirname + dirr + "fold" + fold + "_" + mytrainset.length + "_" + name, JSON.stringify(stats, null, 4), 'utf-8')

	    			// console.log(JSON.stringify(stats, null, 4))

		    		console.log("stop trainandTest")
		    		report.push(_.pick(stats[0]['stats'], parameters))

		    		gldata[name] = stats[0]['data']

			  	}, this)

			  	_.each(report, function(value, key, list){ 
			  		if (value['F1'] < 0)
			  			process.exit(0)
			  	}, this)

			  	// if (oldstats.length > 0)
			  		// {
			  			// var gldata = {}
			  			// gldata['old'] = oldstats[0]['data']
			  			// gldata['new'] = stats[0]['data']
					  	// compare(gldata)
			  		// }



			  	// if (oldreport.length > 0)
			  	// {
			  	// 	var done = false

			  	// 	_.each(oldreport[0]['data'], function(value, key, list){

			  	// 		if (stats[0]['data'][key]['input'] != value['input'])
			  	// 			{
			  	// 				console.log("error")
			  	// 				process.exit(0)
			  	// 			}
			  			
			  	// 		if (stats[0]['data'][key]['explanation']['TP'].length < value['explanation']['TP'].length)
			  	// 		{
			  	// 			console.log("old")
			  	// 			console.log(value)
			  	// 			console.log("new")
			  	// 			console.log(stats[0]['data'][key])
			  	// 			done = true
			  	// 		}

			  	// 		if (stats[0]['data'][key]['explanation']['FN'].length > value['explanation']['FN'].length)
			  	// 		{
			  	// 			console.log("old")
			  	// 			console.log(value)
			  	// 			console.log("new")
			  	// 			console.log(stats[0]['data'][key])
			  	// 			done = true
			  	// 		}_

			  	// 	}, this)
			  	// }

			  	oldstats = bars.copyobj(stats)

                extractGlobal(parameters, classifiers, mytrain, report, stat)
                
                stat['_sized'] = test.length
                stat['_sizec'] = bars.extractdataset(test).length

                
			} //while (index < train.length)

			_.each(parameters, function(parameter, key, list){
				plot(fold, parameter, stat, classifiers)
				plot('average', parameter, stat, classifiers)
			})

			}); //fold

}

if (process.argv[1] === __filename)
{

	var dataset = JSON.parse(fs.readFileSync(__dirname + "/../../../datasets/DatasetDraft/dial_usa_rule_core.json"))

	var classifiers  = {

				strict: [modes.strict_keyphrase],
				// strict: [modes.predicate],
			}
	
	var parameters = [
					  'F1','Precision','Recall', 'FN', 'Accuracy',
					  'Offer_F1','Reject_F1', 'Accept_F1','Greet_F1',
					  'Offer_Precision', 'Reject_Precision', 'Accept_Precision', 'Greet_Precision',
					  'Offer_Recall', 'Reject_Recall', 'Accept_Recall','Greet_Recall'
					  // 'Offer_FN','Reject_FN','Accept_FN','Greet_FN',
					  // 'Offer_TP','Reject_TP','Accept_TP','Greet_TP',
					  // 'Offer_FP', 'Reject_FP','Accept_FP', 'Greet_FP',
					  // 'Offer_Accuracy', 'Reject_Accuracy', 'Accept_Accuracy', 'Greet_Accuracy'
					]
	
	var filtered = bars.filterdataset(dataset, 5)
	console.log(filtered.length)

	filtered = _.shuffle(filtered)

	// filtered = filtered.slice(0, 5)

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
	thereisdata:thereisdata
}
