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
		var result = execSync.run(gnuplot);
		if (result !=0 ) {
			console.log("gnuplot is not found")
			return 0
		}
	}

function learning_curves(classifiers, dataset, parameters, step, step0, limit, numOfFolds) 
{
	var f = Fiber(function() {

	  	var fiber = Fiber.current;
		var dir = "./learning_curves/"
		var dirr = "/learning_curves/"
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

		partitions.partitions_consistent(dataset, numOfFolds, function(train, test, fold) {
			console.log("fold"+fold)
			var index = step0

			while (index <= train.length)
	  		{

			  	var report = []
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

				utils.enrichseeds(seeds, function(err, seeds_ppdb){
					var seeds_ppdb_after = utils.afterppdb(seeds_ppdb)
	      			ppdb.trainandtest(mytrainset, bars.copylist(testset), seeds_ppdb_after, 1, function(err, response_ppdb){
	      				stats_ppdb = response_ppdb
	      				
	      				bars.wrfile(__dirname+dirr+"ppdb_fold-"+fold+"_train-"+index, [seeds_ppdb, stats_ppdb])

						ppdb.trainandtest(mytrainset, bars.copylist(testset), seeds_original_after, 1, function(err, response){
        					setTimeout(function() {
	      						fiber.run(response)
							}, 1000)
		    			})
		    		})
				})

		    	var stats_original = Fiber.yield()

		   		bars.wrfile(__dirname+dirr+"orig_fold-"+fold+"_train-"+index, [seeds_original, stats_original])
				
	  	    	// --------------TRAIN-TEST--------------

/*	  	    	console.log("ORIGINAL")
	  	    	console.log("START")
	  	    	console.log(JSON.stringify(stats_original['data'].length, null, 4))
	  	    	console.log(JSON.stringify(stats_original['stats'], null, 4))
	  	    	console.log(JSON.stringify(stats_original['data'], null, 4))
	  	    	console.log("ORIGINAL")
	  	    	console.log(JSON.stringify(stats_original['stats'], null, 4))
	  	    	
	  	    	console.log("PPDB")
	  	    	console.log("START")
	  	    	console.log(JSON.stringify(stats_ppdb['data'].length, null, 4))
	  	    	console.log(JSON.stringify(stats_ppdb['stats'], null, 4))
	  	    	console.log(JSON.stringify(stats_ppdb['data'], null, 4))
	  	    	console.log("PPDB")
	  	    	console.log(JSON.stringify(stats_ppdb['stats'], null, 4))
*/
		    	report.push(_.pick(stats_ppdb['stats'], parameters))
		    	report.push(_.pick(stats_original['stats'], parameters))

/*		    	if (stats_original['stats']['Recall'] > stats_ppdb['stats']['Recall'])
		    	{
		    		console.log('FOUND')
		    		_.each(stats_ppdb['data'], function(turn, key, list){ 
		    			console.log(stats_ppdb['data'][key]['eval']['FN']+"   "+stats_original['data'][key]['eval']['FN'])
		    			if (stats_ppdb['data'][key]['eval']['FN'].length > 
		    				stats_original['data'][key]['eval']['FN'].length
		    				)
		    				{
		    					console.log("FN")
		    					console.log(JSON.stringify(stats_ppdb['data'][key], null, 4))
		    					console.log(JSON.stringify(stats_original['data'][key], null, 4))
		    				}
		    			if (stats_ppdb['data'][key]['eval']['TP'].length <
		    				stats_original['data'][key]['eval']['TP'].length
		    				)
		    				{
		    					console.log("TP")
		    					console.log(JSON.stringify(stats_ppdb['data'][key], null, 4))
		    					console.log(JSON.stringify(stats_original['data'][key], null, 4))
		    				}
		    		}, this)
		    		console.log()
		    		process.exit(0)
		    	}
*/
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
						com = gnuplot +" -p -e \"reset; set yrange [0:1]; set term png truecolor size 1024,1024; set grid ytics; set grid xtics; set key bottom right; set output \'"+dir + value+"fold"+n+".png\'; set key autotitle columnhead; plot "+foldcom +"\""
						result = execSync.run(com)

						plotfor = plotfor + foldcom + ", "
						// fs.writeFileSync(dir+value+"-fold"+n, header, 'utf-8', function(err) {console.log("error "+err); return 0 })
						// },this)
					},this)
					plotfor = plotfor.substring(0,plotfor.length-2);
					command = gnuplot +" -p -e \"reset; set yrange [0:1]; set term png truecolor size 1024,1024; set grid ytics; set grid xtics; set key bottom right; set output \'"+dir + value+".png\'; set key autotitle columnhead; "+plotfor +"\""
					result = execSync.run(command)
				}, this)


				_.each(parameters, function(param, key, list){ 
					fs.writeFileSync(dir+param+"average", "train\t"+Object.keys(classifiers).join("\t")+"\n", 'utf-8', function(err) {console.log("error "+err); return 0 })
					_.each(stat[param], function(value, trainsize, list){ 
						average = getAverage(stat, param, trainsize, cl)
						fs.appendFileSync(dir+param+"average",trainsize +"\t"+average.join("\t")+"\n",'utf8', function (err) {console.log("error "+err); return 0 })
					}, this)

					foldcom = " for [i=2:"+ (_.size(classifiers) + 1)+"] \'"+dir+param+"average"+"\' using 1:i with linespoints linecolor i"
					com = gnuplot +" -p -e \"reset; set yrange [0:1]; set xlabel \'Number of dialogues\'; set ylabel \'"+param+"\' ;set term png truecolor size 1024,1024; set grid ytics; set grid xtics; set key bottom right; set output \'"+dir + param+"average.png\'; set key autotitle columnhead; plot "+foldcom +"\""
					result = execSync.run(com)
				}, this)

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
	var parameters = ['F1','Precision','Recall', 'Accuracy']
	learning_curves(classifiers, dataset, parameters, 10/*step*/, 2/*step0*/, 18/*limit*/,  10/*numOfFolds*/, function(){
		console.log()
		process.exit(0)
	})
		
}
