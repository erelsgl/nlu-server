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
var classifier = require(__dirname+"/../classifiers.js")
var partitions = require('limdu/utils/partitions');
var trainAndTest_hash = require(__dirname+'/../utils/trainAndTest').trainAndTest_hash;
var bars = require(__dirname+'/../utils/bars');
var path = require("path")
var execSync = require('child_process').execSync


// var gnuplot = __dirname + '/gnuplot'
var gnuplot = 'gnuplot'
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

function countLabel(mytrain, label, single)
{
	var results = _.countBy(_.flatten(mytrain), function(utterance) {
  			return utterance['output'].indexOf(label) != -1 ? 'found':'notfound';
	});

	return results["found"]
}

function extractLabels(stats, mytrain, labels)
{
	_.each(stats, function(params, label, list){


		var label_json = JSON.parse(label)
		var label_str = _.keys(label_json)[0]

		if (_.isObject(_.values(label_json)[0]))
			label_str += "_"+(_.keys(_.values(label_json)[0])[0]) + "_" + (_.values(_.values(label_json)[0])[0])
		else
			label_str += "_"+_.values(label_json)[0]

		label_str = label_str.replace(" ","_")

		var count = countLabel(mytrain, label, true)

		if (!(_.isUndefined(count)))
		{
			if (!(label_str in labels))
				labels[label_str] = {}

			if (!(count in labels[label_str]))
				labels[label_str][count] = {}

			_.each(params, function(value, param, list){
				if (["Recall","Precision","F1"].indexOf(param) != -1)
				{
					if (!(param in labels[label_str][count]))
						labels[label_str][count][param] = []
		
					if (!(_.isNaN(value)))
						labels[label_str][count][param].push(value)
				}
			}, this)
		}
	}, this)
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
    	
    	// if Intent in the name of the parameter then count the number of sentences with the same intent
    	if (param.indexOf("_") != -1)
    	{
    		stat[param][trainsize]['__size'].push(bars.extractintent(trainset, param.substring(0,param.indexOf("_"))).length)
    	}
    	else
    		// else just the size of the set in utterances
    	stat[param][trainsize]['__size'].push(_.flatten(trainset).length)

    		// the size of the set in utterances
    	stat[param][trainsize]['_size'].push(_.flatten(trainset).length)

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

function plot(fold, parameter, stat, classifiers)
{

	var values = []
	var linetype = fold

	console.log(JSON.stringify(stat, null, 4))

	var header = "train\t" + Object.keys(classifiers).join("-fold"+fold+"\t")+"-fold"+fold+"\n";
	fs.writeFileSync(__dirname + dirr + parameter+"fold"+fold, header, 'utf-8')

	var str = ""
	
	if (fold != 'average')
	{
		_.each(stat[parameter], function(value, trainsize, list){ 
			// str += trainsize.toString() + "(" + stat[parameter][trainsize]['_size'] + ")" + "\t"
			str += trainsize.toString() + "(" + value['__size'][fold]+ ")\t"
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
			
			// if (parameter.indexOf("_"))
				// var intent = parameter.substring(0,parameter.indexOf("_")).length

			var average = getAverage(stat, parameter, trainsize, classifiers)
			// var intsize = _.reduce(stat[parameter][trainsize]['__size'], function(memo, num){ return (memo + num) }, 0)/stat[parameter][trainsize]['__size'].length
			// str += trainsize.toString() + "(" + stat[parameter][trainsize]['_size'] + ")" + "\t"+filternan(average).join("\t")+"\n"
			// str += trainsize.toString() + "(" + intsize + ")\t"+filternan(average).join("\t")+"\n"
			str += trainsize.toString() + "(" + trainsize.toString() + ")\t"+filternan(average).join("\t")+"\n"
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
		result = execSync(com)
	}
}


function learning_curves(classifiers, dataset, parameters, step, step0, limit, numOfFolds) 
{
		checkGnuPlot

		if (dataset.length == 0)
			throw new Error("Dataset is empty");
		
		stat = {}
		labels = {}
		
		var mytrain = []

		partitions.partitions_consistent(dataset, numOfFolds, function(train, test, fold) {
			var index = step0
			// var oldstats = []
			// var stats

			// fs.writeFileSync(__dirname + dirr + "fold" + fold, "TEST \n"+JSON.stringify(test, null, 4)+"\n TRAIN \n"+JSON.stringify(train, null, 4), 'utf-8')

			while (index <= train.length-10)
	  		{
			  	var report = []

				var mytrain = train.slice(0, index)
			  	
			  	index += (index < limit ? step0 : step)
			  	var mytrainset = (bars.isDialogue(mytrain) ? _.flatten(mytrain) : mytrain)
			  	var testset = (bars.isDialogue(test) ? _.flatten(test) : test)

			  	// for simulated

				console.log("fold"+fold)

				var classifier	= _.values(classifiers)[0]	

    			var stats = trainAndTest_hash(classifier, bars.copyobj(mytrainset), bars.copyobj(testset), 5)
	    		
	    		report.push(_.pick(stats['stats'], parameters))		    		

	    		var dial = Math.floor(index/10)+1;
	    	 	var size = _.flatten(mytrain.slice(mytrain.length - dial)).length
		    	var sim_dataset = bars.simulateds(_.flatten(train.slice(index)), size, stats['stats']['labels'])
		    	var sim_train = _.flatten(mytrain.slice(0,mytrain.length-dial)).concat(sim_dataset)

				console.log(mytrain.length+" dialogues in train with "+ mytrainset.length + " utterances")
				console.log(dial+" dialogues should be simulated")
				console.log(size+" in total utterances are simulated")
	    		console.log(mytrainset.length+" and "+sim_train.length)
	    	
				var stats = trainAndTest_hash(classifier, bars.copyobj(sim_train), bars.copyobj(testset), 5)
	    			    		
	    		report.push(_.pick(stats['stats'], parameters))		    		
	    		
	    		extractGlobal(parameters, classifiers, mytrain, report, stat)
                           
                _.each(parameters, function(parameter, key, list){
					plot(fold, parameter, stat, classifiers)
					plot('average', parameter, stat, classifiers)
				})

			} //while (index < train.length)

				// _.each(labels, function(value, label, list){
		    		// plot('average', label, labels, {"Precision":true, "Recall":true, "F1":true})
				// })

			}); //fold

}

if (process.argv[1] === __filename)
{

	var lc = __dirname + "/learning_curves"
	var graph_files = fs.readdirSync(lc)

	_.each(graph_files, function(value, key, list){ 
		fs.unlinkSync(lc+"/"+value)
	}, this)

	var classifiers  = {
			DS : classifier.DS_bigram,
			DS_sim : classifier.DS_bigram
		}
	
	var parameters = [
					  // 'F1','Precision','Recall', 'FN', 'Accuracy',
					  // 'Offer_F1', 'Offer_Precision', 'Offer_Recall', 'Offer_FN', 'Offer_TP', 'Offer_Accuracy', 
					  // 'Reject_F1','Reject_Precision','Reject_Recall', 'Reject_FN', 'Reject_TP', 'Reject_Accuracy', 
					  // 'Accept_F1','Accept_Precision','Accept_Recall', 'Accept_FN', 'Accept_TP', 'Accept_Accuracy', 
					  // 'Greet_F1','Greet_Precision','Greet_Recall', 'Greet_FN', 'Greet_Accuracy'
						'macroF1', 'macroPrecision', "macroRecall",
						'microF1', 'microPrecision', "microRecall"
					]
	
	
	var dataset = bars.loadds(__dirname+"/../../negochat_private/dialogues")
	var utterset = bars.getsetcontext(dataset)
	
	var dataset = utterset["train"].concat(utterset["test"])

	// dataset = dataset.slice(0,10)

	learning_curves(classifiers, dataset, parameters, 10/*step*/, 2/*step0*/, 30/*limit*/,  3/*numOfFolds*/, function(){
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

