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
var rmdir = require('rimraf');
var path = require("path")

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

function learning_curves(classifiers, dataset, parameters, step, step2, numOfFolds, datatest) {

	var dir = "./learning_curves/"

	// fs.rmdirSync(dir)
	// rmdir(dir, function(error){});
	// console.log(path.join(__dirname, dir))
	// console.log()
	// process.exit(0)
	// fs.mkdirSync(dir)

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

	var testtitle = ""
	var traintitle = ""

	// var test = []
	// var mytest = []

	var mytrain = []
	// var mytrainset = []

	partitions.partitions(dataset, numOfFolds, function(train, test, fold) {
		index = step
		// index = 200
		if (datatest)
			{
			test = datatest
	  		testtitle = "constant test "+test.length
	  		}
	  		// test = _.sample(datatest,  Math.round(train.length/2))

		if (bars.isDialogue(test))
			{
			// var testset = bars.dividedataset(bars.extractturns(test))['one']
			var testset = bars.extractturns(test)
			testtitle = testtitle + "test extracted from dialogue"
			}
		else
			var testset = test

		while (index < train.length)
  		{

	  	mytrain = train.slice(0, index)

	  	if (index < 100)
	  		index += step
	  	else
	  		index += step2

  		report = []

	    _.each(cl, function(value, classifier, list) { 

	    	if (bars.isDialogue(mytrain))	
	  		{
	  			traintitle = "train extracted from dialogue"
	  			// if (value[0] == "Current_baseline")
	  				var mytrainset = bars.extractturns(mytrain)
	  			// else
	  				// var mytrainset = bars.extractturnssingle(mytrain)
	  		}
	  		else
	  			mytrainset = mytrain

	    	var stats = trainAndTest_hash(value[1], mytrainset, testset, 5)

	     	// console.log(value[0])
	    	// console.log(JSON.stringify(stats[0]['data'], null, 4))
	    	// console.log(JSON.stringify(stats[0]['labels'], null, 4))
	    	// console.log(JSON.stringify(stats[0]['labels'], null, 4))
	    	// console.log()
	    	// process.exit(0)

	    	// console.log(JSON.stringify(stats[0], null, 4))
	    	// console.log(JSON.stringify(stats[0]['labels'], null, 4))

	    	// console.log()
	    	// process.exit(0)

	    	console.log(mytrainset.length)

	    	// if (stats[0]['labels']['Reject']['F1'] == -1)
	    		// stats[0]['labels']['Reject']['F1'] = 0
	    	// console.log(stats)
	    	// process.exit(0)

	    	report.push(_.pick(stats[0]['stats'], parameters))
	    	// report.push(_.pick(stats[0]['labels']['Reject'], parameters))

	    })

		console.log(JSON.stringify(report, null, 4))
		// console.log()
		// process.exit(0)

	    // console.log()
	    // process.exit(0)

	    extractGlobal(parameters, cl, mytrain.length, report, stat)

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
				average = getAverage(stat, param, trainsize, cl)
				fs.appendFileSync(dir+param+"average",trainsize +"\t"+average.join("\t")+"\n",'utf8', function (err) {console.log("error "+err); return 0 })
			}, this)

			foldcom = " for [i=2:"+ (_.size(classifiers) + 1)+"] \'"+dir+param+"average"+"\' using 1:i with linespoints linecolor i"
			com = "gnuplot -p -e \"reset; set yrange [0:1]; set xlabel \'Number of dialogues\'; set ylabel \'"+param+"\' ;set term png truecolor size 1024,1024; set grid ytics; set grid xtics; set key bottom right; set output \'"+dir + param+"average.png\'; set key autotitle columnhead; plot "+foldcom +"\""
			result = execSync.run(com)
		}, this)

		} //while (index < train.length)
		}); //fold

}

module.exports = {
	learning_curves: learning_curves, 
	extractGlobal: extractGlobal,
	getAverage: getAverage
}
