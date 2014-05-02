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
var partitions = require('limdu/utils/partitions');
var trainAndTest_hash = require('./trainAndTest').trainAndTest_hash;
var bars = require('./bars');

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


function checkGnuPlot()
	{
		var result = execSync.run("gnuplot -V");
		if (result !=0 ) {
			console.log("gnuplot is not found")
			return 0
		}
	}

function extractturns(dataset)
	{
		data = []
		_.each(dataset, function(value, key, list){ 
			_.each(value['turns'], function(set, key, list){ 
				data.push(set)
				}, this)
		}, this)
		return data
	}

function isDialogue(dataset)
	{
		if (dataset.length == 0)
			return false

		if ("id" in dataset[0])
			return true
		else
			return false
	}

module.exports.learning_curves = function(classifiers, dataset, parameters, step, numOfFolds) {

	dir = "./learning_curves/"
	checkGnuPlot
	if (dataset.length == 0)
		{return}

	plotfor = "plot "
	_(numOfFolds).times(function(n){
		app = "-fold"+n+"\t"
		header = "train\t" + (Object.keys(classifiers)).join(app)+"-fold"+n+"\n";
	_.each(parameters,  function(value, key, list){ 
		plotfor = plotfor + " for [i=2:"+ (_.size(classifiers) + 1)+"] \'"+dir+value+"-fold"+n+"\' using 1:i with lines linecolor i, "
		fs.writeFileSync(dir+value+"-fold"+n, header, 'utf-8', function(err) {console.log("error "+err); return 0 })
		},this)
	},this)

	plotfor = plotfor.substring(0,plotfor.length-2);
	stat = {}

	partitions.partitions(dataset, numOfFolds, function(train, test, fold) {
		index = step
		// index = 200

		if (isDialogue(test))
			test = extractturns(test)	

		while (index < train.length)
  		{

	  	mytrain = train.slice(0, index)
	  	if (isDialogue(mytrain))	
	  		mytrainset = extractturns(mytrain)
	  	else
	  		mytrainset = mytrain

	  	index += step

  		report = []

	    _.each(classifiers, function(value, classifier, list) { 	
	    	stats = trainAndTest_hash(value, mytrainset, test, 5)
	    	report.push(stats[0]['stats'])

	    	

	    	_.each(parameters, function(param, key, list){ 
	    		if (!(param in stat)) 
	    			stat[param]={}

	    		if (!(mytrain.length in stat[param]))
	    		stat[param][mytrain.length]={}

	    		if (!(classifier in stat[param][mytrain.length]))
	    			stat[param][mytrain.length][classifier] = []
	    		
	    		// if (!(mytrain.length in stat[classifier][param]))
	    			// stat[classifier][param][mytrain.length] = []
	    		stat[param][mytrain.length][classifier].push(stats[0]['stats'][param])
	    	}, this)

	    	// clas.push(key)
	    	// res.push(stats[0]['data'])
	    })

	    // console.log(JSON.stringify(stat, null, 4))
	    // bars.compareresults(clas[0],res[0],clas[1],res[1])
	    // header
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
			average = []
				_.each(classifiers, function(value, classifier, list){ 
					average.push(_.reduce(stat[param][trainsize][classifier], function(memo, num){ return memo + num; }, 0)/stat[param][trainsize][classifier].length)
				}, this)
			fs.appendFileSync(dir+param+"average",trainsize +"\t"+average.join("\t")+"\n",'utf8', function (err) {console.log("error "+err); return 0 })
			}, this)

			foldcom = " for [i=2:"+ (_.size(classifiers) + 1)+"] \'"+dir+param+"average"+"\' using 1:i with linespoints linecolor i"
			com = "gnuplot -p -e \"reset; set yrange [0:1]; set term png truecolor size 1024,1024; set grid ytics; set grid xtics; set key bottom right; set output \'"+dir + param+"average.png\'; set key autotitle columnhead; plot "+foldcom +"\""
			result = execSync.run(com)
		
		}, this)

		} //while (index < train.length)
		}); //fold

}