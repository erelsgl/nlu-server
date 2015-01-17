/*
	Draw learning curves of classifiers
	A "learning curve" is a graph of the performance of a certain classifier, as a function of the number of training instances.
	You can draw learning curves of several classifiers on the same graph, for the sake of comparison.
	You can measure the performance can using several parameters, such as: accuracy, F1, etc.
	The graphs are drawn by "gnuplot", so you must have gnuplot installed in order to use this unit.
	@author Vasily Konovalov
 */

var Fiber = require('fibers');
var _ = require('underscore')._;
var fs = require('fs');
var utils = require('./utils');
var execSync = require('execSync')
var partitions = require('limdu/utils/partitions');
var trainAndTest_hash = require('../../utils/trainAndTest').trainAndTest_hash;
var bars = require('../../utils/bars');
var path = require("path")
var ppdb = require("./evalmeasure_5ed_embed.js")

var gnuplot = './gnuplot'
var dir = "./learning_curves/"
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

function onlyint(list)
{
	var output = []
	_.each(list, function(value, key, list){ 
		if (bars.isInt(value))
			output.push(value)
	}, this)
	return output
}

function getAverage(stat, param, trainsize, classifiers)
	{
		var average = []
		_.each(Object.keys(classifiers), function(classifier, key, list){
			var list = onlyint(stat[param][trainsize][classifier])
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
    		stat[param][trainsize]={_size: bars.extractturns(trainset, 5).length}
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
	return _.filter(results, function(num){ return num > 1}).length == 0
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

		return output
	}
	else
	{
		if (bars.isNumber(input))
		{
			if (input != -1)
				return input
			else
				return "?"
		}
		else
			return "?"
	}
}


function plot(fold, parameter, stat, classifiers)
{

	var values = []
	var linetype = fold

	var header = "train\t" + Object.keys(classifiers).join("-fold"+fold+"\t")+"-fold"+fold+"\n";
	fs.writeFileSync(dir+parameter+"fold"+fold, header, 'utf-8')

	var str = ""
	
	if (fold != 'average')
	{
		_.each(stat[parameter], function(value, trainsize, list){ 
			str += trainsize.toString() + "(" + stat[parameter][trainsize]['_size'] + ")" + "\t"
			_.each(value, function(results, cl, list){ 
				if (cl != '_size')
				{
					values.push(results[fold])
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
			str += trainsize.toString() + "(" + stat[parameter][trainsize]['_size'] + ")" + "\t"+filternan(average).join("\t")+"\n"
			values = values.concat(average)
		}, this)

		linetype = 5
	}

	fs.appendFileSync(dir+parameter+"fold"+fold, str, 'utf-8')

	var foldcom = " for [i=2:"+ (_.size(classifiers) + 1)+"] \'"+dir+parameter+"fold"+fold+"\' using 1:i:xtic(1) with linespoints linecolor i pt "+linetype+" ps 3"
	var com = gnuplot +" -p -e \"reset; set datafile missing '?'; "+(isProb(values) ? "set yrange [0:1];" : "") +" set term png truecolor size 1024,1024; set grid ytics; set grid xtics; set key bottom right; set output \'"+dir + parameter + "fold"+fold+".png\'; set key autotitle columnhead; plot "+foldcom +"\""
	result = execSync.run(com)
}


function learning_curves(classifiers, dataset, parameters, step, step0, limit, numOfFolds) 
{
	var probLabel = ['F1','Precision','Recall']
	var Labels = {'Offer':[], 'Accept':[], 'Reject':[], 'Greet':[]}


	var f = Fiber(function() {

	  	var fiber = Fiber.current;
		
		checkGnuPlot

		if (dataset.length == 0)
			throw new Error("Dataset is empty");
		
		stat = {}
		
		var mytrain = []

		partitions.partitions_consistent(dataset, numOfFolds, function(train, test, fold) {
			console.log("fold"+fold)
			var index = step0

			while (index <= train.length)
	  		{

			  	var report = []
				// var Labels = {'Offer':[], 'Accept':[], 'Reject':[]}

				var mytrain = train.slice(0, index)
			  	
			  	index += (index < limit ? step0 : step)
			  	var mytrainset = (bars.isDialogue(mytrain) ? bars.extractturns(mytrain, 5) : mytrain)
			  	var testset = (bars.isDialogue(test) ? bars.extractturns(test) : test)

	  			// ----------------SEEDS-------------------

	  			// ngrams
				var seeds = utils.loadseeds(mytrainset, true)
				var seeds_original = utils.enrichseeds_original(seeds)
				var seeds_original_after = utils.afterppdb(seeds_original)

				var stats_ppdb = []
				var seeds_ppdb_after = []

				// console.log("start")

				utils.enrichseeds(seeds, function(err, seeds_ppdb){
					seeds_ppdb_after = utils.afterppdb(seeds_ppdb)
	      			ppdb.trainandtest(mytrainset, bars.copyobj(testset), seeds_ppdb_after, 1, function(err, response_ppdb){
	      				stats_ppdb = response_ppdb
	      				
	      				bars.wrfile(__dirname + dirr+"ppdb_fold-"+fold+"_train-"+index, [seeds_ppdb, stats_ppdb])

						ppdb.trainandtest(mytrainset, bars.copyobj(testset), seeds_original_after, 1, function(err, response){
        					setTimeout(function() {
	      						fiber.run(response)
							}, 1000)
		    			})
		    		})
				})

		    	var stats_original = Fiber.yield()

		   		bars.wrfile(__dirname+dirr+"orig_fold-"+fold+"_train-"+index, [seeds_original, stats_original])
				
	  	    	// --------------TRAIN-TEST--------------

		    	report.push(_.pick(stats_ppdb['stats'], parameters))
		    	report.push(_.pick(stats_original['stats'], parameters))
		    			    	
		   		var FNppdb = []

		   		_.each(stats_ppdb['data'], function(turn, key, list){ 
	    			if (stats_ppdb['data'][key]['eval']['FN'].length > 0)	
						{
						FNppdb.push({
							'input':stats_ppdb['data'][key]['input'], 
							'intent_core':stats_ppdb['data'][key]['intent_core'],
							'eval':stats_ppdb['data'][key]['eval'],
							// 'sequence_actual_ppdb': stats_ppdb['data'][key]['sequence_actual']
							})	
						}		    				
		    	}, this)

				var comparison = []
				_.each(stats_ppdb['data'], function(turn, key, list){ 
	    			if (stats_ppdb['data'][key]['eval']['FN'].length < stats_original['data'][key]['eval']['FN'].length)
						{
						comparison.push({
							'input':stats_ppdb['data'][key]['input'], 
							'intent_core':stats_ppdb['data'][key]['intent_core'], 
							'eval_ppdb':stats_ppdb['data'][key]['eval'], 
							'eval_original':stats_original['data'][key]['eval'],	
							'sequence_actual_ppdb': stats_ppdb['data'][key]['sequence_actual']
							})
						}
					else
					{
					if (stats_ppdb['data'][key]['eval']['FN'].length > stats_original['data'][key]['eval']['FN'].length)
						{
							console.log(stats_ppdb['data'][key])
							console.log(stats_original['data'][key])
							console.log()
							process.exit(0)
						}	
					}		    				
		    	}, this)

		   		bars.wrfile(__dirname+dirr+"comparison_fold-"+fold+"_train-"+index+"_"+FNppdb.length+"_"+comparison.length, 
		   			["FN of PPDB", FNppdb.length, "PPDB gain", comparison.length, seeds_ppdb_after, "FN of ppdb", FNppdb, "comparison", comparison])

                extractGlobal(parameters, classifiers, mytrain, report, stat)

                _.each(parameters, function(parameter, key, list){
					plot(fold, parameter, stat, classifiers)
					plot('average', parameter, stat, classifiers)
				})

			} //while (index < train.length)
			}); //fold

	})
f.run();
}

if (process.argv[1] === __filename)
{
	//var dataset = JSON.parse(fs.readFileSync("../../../datasets/Employer/Dialogue/turkers_keyphrases_only_rule.json"))
	//var dataset = JSON.parse(fs.readFileSync("../../../datasets/Employer/Dialogue/turkers_keyphrases_only_rule_shuffled.json"))
	var dataset = JSON.parse(fs.readFileSync("../../../datasets/DatasetDraft/dial_usa_rule_core.json"))

	var dataset = _.filter(dataset, function(dial){return bars.isactivedialogue(dial) == true})
	
	var classifiers  = {
		'PPDB': [],
		'Original': []
	}
	// var classifiers  = {}
	var parameters = [
					  'F1','Precision','Recall', 'FN', 
					  'OfferF1', 'OfferPrecision', 'OfferRecall', 'OfferFN',
					  'RejectF1','RejectPrecision','RejectRecall', 'RejectFN', 
					  'AcceptF1','AcceptPrecision','AcceptRecall', 'AcceptFN', 
					  'GreetF1','GreetPrecision','GreetRecall', 'GreetFN'
					]
	learning_curves(classifiers, dataset, parameters, 10/*step*/, 2/*step0*/, 18/*limit*/,  10/*numOfFolds*/, function(){
		console.log()
		process.exit(0)
	})
		
}


module.exports = {
	learning_curves: learning_curves, 
	extractGlobal: extractGlobal,
	getAverage: getAverage,
	filternan:filternan
}