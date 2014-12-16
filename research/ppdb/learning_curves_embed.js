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
var rmdir = require('rimraf');
var path = require("path")
var ppdb = require("./evalmeasure_5ed_embed.js")

/* @params classifiers - classifier for learning curves
   @params dataset - dataset for evaluation, 20% is takes for evaluation
   @params parameters - parameters we are interested in 
   @params step - step to increase a train set 

   The example of the input is following.

classifiers  = {
	Adaboost: limdu.classifiers.multilabel.Adaboost, 
	PassiveAggressive: limdu.classifiers.multilabel.PassiveAggressive
	};

parameters = ['F1','TP','FP','FN','Accuracy','Precision','Recall']
*/
function getAverage(stat, param, trainsize, classifiers)
	{
		var average = []
		_.each(classifiers, function(classifier_tuple, key, list){
			var  classifier = classifier_tuple[0]
			average.push(_.reduce(stat[param][trainsize][classifier], function(memo, num){ return memo + num; }, 0)/stat[param][trainsize][classifier].length)
		}, this)
		return average
	}

function extractGlobal(parameters, classifiers, trainsize, report, stat)
	{
	var ord = 0

	if (classifiers.length == 0)
		throw new Error("List of classifiers is empty");

	if (parameters.length == 0)
		throw new Error("List of parameters is empty");

	_.each(classifiers, function(classifier_tuple, key, list){
		var classifier = classifier_tuple[0]
		_.each(parameters, function(param, key, list){ 
    		if (!(param in stat)) 
    			stat[param]={}

    		if (!(trainsize in stat[param]))
    		stat[param][trainsize]={}

    		if (!(classifier in stat[param][trainsize]))
    			stat[param][trainsize][classifier] = []

    		stat[param][trainsize][classifier].push(report[ord][param])
    	}, this)
    	ord = ord + 1
	}, this)
	}

function checkGnuPlot()
	{
		var result = execSync.run("gnuplot -V");
		if (result !=0 ) {
			console.log("gnuplot is not found")
			return 0
		}
	}

	
function learning_curves(classifiers, dataset, parameters, step, numOfFolds) 
{


	var f = Fiber(function() {

	  	var fiber = Fiber.current;
		var dir = "./learning_curves/"
		checkGnuPlot

		if (dataset.length == 0)
			throw new Error("Dataset is empty");
		
		var cl = _.pairs(classifiers)

		plotfor = "plot "
		_(numOfFolds).times(function(n){
			app = "-fold"+n+"\t"
			header = "train\t" + _.map(cl,function(num){return num[0]}).join(app)+"-fold"+n+"\n";
		_.each(parameters,  function(value, key, list){ 
			plotfor = plotfor + " for [i=2:"+ (_.size(cl) + 1)+"] \'"+dir+value+"-fold"+n+"\' using 1:i with lines linecolor i, "
			fs.writeFileSync(dir+value+"-fold"+n, header, 'utf-8', function(err) {console.log("error "+err); return 0 })
			},this)
		},this)

		plotfor = plotfor.substring(0,plotfor.length-2);
		stat = {}

		var mytrain = []

		partitions.partitions(dataset, numOfFolds, function(train, test, fold) {
			console.log("fold"+fold)
			index = step

			if (bars.isDialogue(test))
				var testset = bars.extractturns(test)
			else
				var testset = test

			while (index < train.length)
	  		{

			  	var report = []
				var mytrainset = []
			  	var mytrain = train.slice(0, index)
			  	index += step

		    	if (bars.isDialogue(mytrain))	
		  			mytrainset = bars.extractturns(mytrain)
		  		else	
		  			mytrainset = mytrain

	  			// ----------------SEEDS-------------------

				var seeds = utils.loadseeds(mytrainset)
				var seeds_original = utils.enrichseeds_original(seeds)

				var stats_ppdb = []

				utils.enrichseeds(seeds, function(err, seeds_ppdb){
	      			ppdb.trainandtest(mytrainset, testset, seeds_ppdb, function(err, response_ppdb){
	      				stats_ppdb = response_ppdb

						ppdb.trainandtest(mytrainset, testset, seeds_original, function(err, response){
	      					fiber.run(response)
		    			})
		    		})
				})

		    	var stats_original = Fiber.yield()

	  	    	// --------------TRAIN-TEST--------------

		    	report.push(_.pick(stats_ppdb['stats'], parameters))
		    	report.push(_.pick(stats_original['stats'], parameters))

			    extractGlobal(parameters, cl, mytrain.length, report, stat)

				_.each(parameters, function(value, key, list){
					valuestring = mytrain.length +"\t"+ (_.pluck(report, value)).join("\t") +"\n" ;
					fs.appendFileSync(dir+value+"-fold"+fold, valuestring,'utf8', function (err) {console.log("error "+err); return 0 })
				},this)

				_.each(parameters, function(value, key, list){
					plotfor = "plot "
					_(fold+1).times(function(n){
					// _.each(parameters,  function(value, key, list){ 

						foldcom = " for [i=2:"+ (_.size(classifiers) + 1)+"] \'"+dir+value+"-fold"+n+"\' using 1:i with linespoints linecolor i pt "+n+" ps 3"
						com = "gnuplot -p -e \"reset; set yrange [0:1]; set term png truecolor size 1024,1024; set grid ytics; set grid xtics; set key bottom right; set output \'"+dir + value+"fold"+n+".png\'; set key autotitle columnhead; plot "+foldcom +"\""
						result = execSync.run(com)

						plotfor = plotfor + foldcom + ", "
						// fs.writeFileSync(dir+value+"-fold"+n, header, 'utf-8', function(err) {console.log("error "+err); return 0 })
						// },this)
					},this)
					plotfor = plotfor.substring(0,plotfor.length-2);
					command = "gnuplot -p -e \"reset; set yrange [0:1]; set term png truecolor size 1024,1024; set grid ytics; set grid xtics; set key bottom right; set output \'"+dir + value+".png\'; set key autotitle columnhead; "+plotfor +"\""
					result = execSync.run(command)
				}, this)


				_.each(parameters, function(param, key, list){ 
					fs.writeFileSync(dir+param+"average", "train\t"+Object.keys(classifiers).join("\t")+"\n", 'utf-8', function(err) {console.log("error "+err); return 0 })
					_.each(stat[param], function(value, trainsize, list){ 
						average = getAverage(stat, param, trainsize, cl)
						fs.appendFileSync(dir+param+"average",trainsize +"\t"+average.join("\t")+"\n",'utf8', function (err) {console.log("error "+err); return 0 })
					}, this)

					foldcom = " for [i=2:"+ (_.size(classifiers) + 1)+"] \'"+dir+param+"average"+"\' using 1:i with linespoints linecolor i"
					com = "gnuplot -p -e \"reset; set yrange [0:1]; set xlabel \'Number of dialogues\'; set ylabel \'"+param+"\' ;set term png truecolor size 1024,1024; set grid ytics; set grid xtics; set key bottom right; set output \'"+dir + param+"average.png\'; set key autotitle columnhead; plot "+foldcom +"\""
					result = execSync.run(com)
				}, this)

			} //while (index < train.length)
			}); //fold

	})
f.run();
}

if (process.argv[1] === __filename)
{
	var dataset = JSON.parse(fs.readFileSync("../../../datasets/Employer/Dialogue/turkers_keyphrases_only_rule.json"))
	dataset = _.shuffle(dataset)

	var classifiers  = {
		'PPDB': [],
		'Original': []
	}
	// var classifiers  = {}
	var parameters = ['F1','Precision','Recall', 'Accuracy']
	learning_curves(classifiers, dataset, parameters, 1/*step*/, 4/*numOfFolds*/)
}

 