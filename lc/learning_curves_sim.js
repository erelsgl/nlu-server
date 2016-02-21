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
var classifiers = require(__dirname+"/../classifiers.js")
var partitions = require('limdu/utils/partitions');
var trainAndTest = require(__dirname+'/../utils/trainAndTest');
//var trainAndTest_batch = require(__dirname+'/../utils/trainAndTest').trainAndTest_batch;
var cross_batch_async = require(__dirname+'/../utils/trainAndTest').cross_batch_async;
var bars = require(__dirname+'/../utils/bars');
var master = require(__dirname+'/master');
var path = require("path")
var async = require('async')

var gnuplot = 'gnuplot'
// var gnuplot = __dirname + '/gnuplot'

/* @params classifiers - classifier for learning curves
   @params dataset - dataset for evaluation, 20% is takes for evaluation
   @params parameters - parameters we are interested in 
   @params step - step to increase a train set 

   The example of module.exports = {
	learning_curves: learning_curves, 
	extractGlobal: extractGlobal,
	getAverage: getAverage
}the input is following.

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

// function extractGlobal(parameters, classifiers, trainset, report, stat)
function extractGlobal(classifier, mytrain, fold, stats, glob_stats)
	{
		var stats_prep = {}

		_.each(stats, function(value, key, list){
			if ((key.indexOf("Precision") != -1) || (key.indexOf("Recall") != -1 ) || (key.indexOf("F1") != -1) || (key.indexOf("Accuracy") != -1))
				stats_prep[key] = value
		}, this)

		
		var results = {
			'classifier': classifier,
			'fold': fold,
			'trainsize': mytrain.length,
			'trainsizeuttr': _.flatten(mytrain).length,
			'stats': stats_prep
		}

		master.extractGlobal(results, glob_stats)

	}

function checkGnuPlot()
	{
	//	var result = execSync.run(gnuplot);
	//	if (result !=0 ) {
	//		console.log("gnuplot is not found")
	//		return 0
	//	}
	}

function learning_curves(classifierList, dataset, step, step0, limit, numOfFolds, callback) 
{
	var stat = {}
	var stat1 = {}
	var mytrain = []
		
	glob_stats = {}

	async.timesSeries(numOfFolds, function(fold, callback_fold){

		console.log("FOLD "+fold)
		var index = 4

		var data = partitions.partitions_consistent_by_fold(dataset, numOfFolds, fold)

		var testset = (bars.isDialogue(data['test']) ? _.flatten(data['test']) : data['test'])
		var sim_train = _.flatten(data['train'].slice(0, index-1))
		var buffer_train = _.flatten(data['train'].slice(index+1))

		console.log("DEBUGSIM: aggregated stats START "+JSON.stringify(_.countBy(sim_train, function(num) { 
						if (num.output.length == 0) 
							return -1
						else
							return _.keys(JSON.parse(num.output[0]))[0] })
					))

		async.whilst(

			function () { return ((index <= data['train'].length) && buffer_train.length > 100) },
    		function (callback_while) {

			console.log("INDEX "+index)

    		var mytrain = data['train'].slice(0, index)
    		    	
    		if (index<10)
       		{
           		index += 1
       		} 
    		else if (index<20)
			{
               	index += 2
           	}
       		else index += 5

           	var mytrainset = (bars.isDialogue(mytrain) ? _.flatten(mytrain) : mytrain)

	    	trainAndTest.trainAndTest_async(classifiers[_.values(classifierList)[0]], bars.copyobj(mytrainset), bars.copyobj(testset), function(err, stats){

				console.log("DEBUGSIM: standard results")
                console.log(JSON.stringify(stats['stats']['intents'], null, 4))

//				console.log(JSON.stringify(stats['data'], null, 4))
				console.log("DEBUGSIM: FP of Accepts")


				/*_.each(stats['data'], function(value, key, list){
					if ('FP' in value.explanation)
					{
						//console.log(JSON.stringify(value['explanation'], null, 4))
						if (_.keys(JSON.parse(value['explanation']['FP'][0]))[0]=="Accept")
							{
								console.log(JSON.stringify(value.input.text, null, 4))
								console.log(JSON.stringify(value.explanation, null, 4))
							}	
					}
				}, this)
*/
	    		
				extractGlobal(_.values(classifierList)[0], mytrain, fold, stats['stats'], glob_stats)

			 	var size_last_dial = _.flatten(mytrain[mytrain.length-1]).length

			 	// console.log(size_last_dial+" size of the last dialogue")
		    	// console.log(buffer_train.length+" size of the buffer train")

		    	cross_batch_async(classifiers[_.values(classifierList)[0]], bars.copyobj(mytrainset), function(err, stats2){
								
					var results = bars.simulateds(buffer_train, size_last_dial, stats2)

					console.log("DEBUGSIM: size of strandard " + mytrain.length + " in utterances "+ mytrainset.length)
					console.log("DEBUGSIM: stats after 2 folds cross validation on buffer train")
					console.log(JSON.stringify(stats2, null, 4))
		    		console.log("DEBUGSIM:"+results["simulated"].length+" size of the simulated train")
		    	 	console.log("DEBUGSIM:"+buffer_train.length+" size of the buffer train before simulation")
		    	 	console.log("DEBUGSIM:"+results["dataset"].length+" size of the buffer train after simulation")
		    	 	console.log("DEBUGSIM:"+JSON.stringify(results["report"]))
		    	 	console.log("DEBUGSIM: size of aggregated simulated before plus "+ sim_train.length + " in utterances "+_.flatten(sim_train).length)
		    	 	// console.log("DEBUGSIM: aggregated stats "+JSON.stringify(_.countBy(sim_train, function(num) { return _.keys(JSON.parse(num.output[0]))[0] })))

					buffer_train = results["dataset"]
			    	sim_train = sim_train.concat(results["simulated"])

					console.log("DEBUGSIM: aggregated output distribution "+JSON.stringify(_.countBy(sim_train, function(num) { 
						if (num.output.length == 0) 
							return -1
						else
							return _.keys(JSON.parse(num.output[0]))[0] })
					))

					console.log("DEBUGSIM: standard output distribution "+JSON.stringify(_.countBy(mytrainset, function(num) { 
						if (num.output.length == 0) 
							return -1
						else
							return _.keys(JSON.parse(num.output[0]))[0] })
					))

					var temp = JSON.parse(JSON.stringify(results["simulated"]))
					temp = _.map(temp, function(num){ delete num['input']['sentences']; return num });

					console.log("DEBUGSIM: simulated dataset temp")
					console.log(JSON.stringify(temp, null, 4))
					
			    	console.log("DEBUGSIM: size of aggregated simulated after plus "+ sim_train.length + " in utterances "+_.flatten(sim_train).length)

	    			trainAndTest.trainAndTest_async(classifiers[_.values(classifierList)[1]], bars.copyobj(sim_train), bars.copyobj(testset), function(err, stats1){

						console.log("DEBUGSIM: simulated results")
						console.log(JSON.stringify(stats1['stats']['intents'], null, 4))

				//		console.log("DEBUGSIM: simulated data")
				//		console.log(JSON.stringify(stats1['data'], null, 4))

			    		extractGlobal(_.values(classifierList)[1], mytrain, fold, stats1['stats'], glob_stats)	
			    		console.log("DEBUGGLOB:")
						console.log(JSON.stringify(glob_stats, null, 4))

						_.each(glob_stats, function(data, param, list){
							master.plotlc(fold, param, glob_stats)
							console.log("DEBUGLC: param "+param+" fold "+fold+" build")
							master.plotlc('average', param, glob_stats)
						})

						callback_while();
			    	})
				})
			})
    	},
    		function (err, n) {
        		callback_fold()
    		});    	
      	}, function() {
  			callback()
		})
}

if (process.argv[1] === __filename)
{
	master.cleanFolder(__dirname + "/learning_curves")

	var classifierList  = [ 'DS_comp_unigrams_async_context_unoffered', 'DS_comp_unigrams_async_context_unoffered_sim']

	// var dataset = bars.loadds(__dirname+"/../../negochat_private/dialogues")
	// var utterset = bars.getsetcontext(dataset)
	// var dataset = utterset["train"].concat(utterset["test"])

	var data = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed.json"))
	var utterset = bars.getsetcontext(data)
	var dataset = utterset["train"].concat(utterset["test"])
	//dataset = _.shuffle(dataset)

	// dataset = dataset.slice(0,10)

	learning_curves(classifierList, dataset, 1/*step*/, 1/*step0*/, 30/*limit*/,  3/*numOfFolds*/, function(){
		console.log()
		process.exit(0)
	})
}

