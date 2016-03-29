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
function extractGlobal(classifier, mytrain, fold, stats, glob_stats, classifierList)
	{
		var stats_prep = {}

		_.each(stats, function(value, key, list){
			if ((key.indexOf("Precision") != -1) || (key.indexOf("Recall") != -1 ) || (key.indexOf("F1") != -1) || (key.indexOf("Accuracy") != -1))
				stats_prep[key] = value
		}, this)

		
		var results = {
			'classifiers': classifierList,
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
	var stat1 = {}
	var stat2 = {}
	var stat3 = {}
	var statp = {}
	var mytrain = []
	var cont = 0
		
	glob_stats = {}

	async.timesSeries(numOfFolds, function(fold, callback_fold){

		console.log("DEBUGSIM: FOLD "+fold)
		var index = 2

		var data = partitions.partitions_consistent_by_fold(dataset, numOfFolds, fold)

		var testset = (bars.isDialogue(data['test']) ? _.flatten(data['test']) : data['test'])
		
		console.log("DEBUGSIM: size of the train before resizing "+data['train'].length)

		// base the dst on the first 5 dialogues
		var gold = data['train'].splice(0,5)
		console.log("DEBUGSIM: size of the gold "+gold.length)
		console.log("DEBUGSIM: size of the train after resizing "+data['train'].length)

		var sim_train1 = []
		var sim_train2 = []
		var sim_train3 = []
		
		// I think it's not important to do so
		var buffer_train1 = _.flatten(data['train'])
		var buffer_train2 = _.flatten(data['train'])
		var buffer_train3 = _.flatten(data['train'])
		
		async.whilst(

			function () { return ((index <= data['train'].length) && buffer_train.length > 3) },
	    	function (callback_while) {

				console.log("DEBUGSIM: INDEX "+index)
		    	var mytrain = data['train'].slice(0, index)
    		    	
		    	if (index<10)
       				{
		           		index += 2
		       		} 
 		   		else if (index<20)
					{
			           	index += 2
		           	}
		       		else index += 10

           		var mytrainset = JSON.parse(JSON.stringify((bars.isDialogue(mytrain) ? _.flatten(mytrain) : mytrain)))

           		console.log("DEBUGSIM: size of the strandard train" + mytrain.length + " in utterances "+ mytrainset.length)

				var results1 = bars.simulateds(buffer_train1, mytrainset.length - sim_train1.length, gold, 1)
				buffer_train1 = results1["dataset"]
				sim_train1 = sim_train1.concat(results1["simulated"])

	    		trainAndTest.trainAndTest_async(classifiers[_.values(classifierList)[0]], bars.copyobj(sim_train1), bars.copyobj(testset), function(err, stats1){
	    		  
			    	console.log("DEBUGSIM:"+results1["simulated"].length+" size of the simulated train")
					console.log("DEBUGSIMDIST: Simualte dist for the first run:"+JSON.stringify(bars.getDist(sim_train1)))
					console.log("DEBUGSIM: Results for the first run "+ JSON.stringify(stats1['stats'], null, 4))
		    		
					extractGlobal(_.values(classifierList)[0], mytrain, fold, stats1['stats'], glob_stats, classifierList)
			 	
					var results2 = bars.simulateds(buffer_train2, mytrainset.length - sim_train2.length, gold, 0.5)
					buffer_train2 = results2["dataset"]
			    	sim_train2 = sim_train2.concat(results2["simulated"])
	
			    	console.log("DEBUGSIM: size of aggregated simulated after plus "+ sim_train2.length + " in utterances "+_.flatten(sim_train2).length)

	    			trainAndTest.trainAndTest_async(classifiers[_.values(classifierList)[1]], bars.copyobj(sim_train2), bars.copyobj(testset), function(err, stats2){

		    			console.log("DEBUGSIM:"+results2["simulated"].length+" size of the simulated train")
						console.log("DEBUGSIMDIST: Simualte dist for the second run:"+JSON.stringify(bars.getDist(sim_train2)))
						console.log("DEBUGSIM: Results for the second run "+ JSON.stringify(stats2['stats'], null, 4))

			    		extractGlobal(_.values(classifierList)[1], sim_train2, fold, stats2['stats'], glob_stats, classifierList)	
					    		
			    		var results3 = bars.simulateds(buffer_train3, mytrainset.length - sim_train3.length, gold, 0.0625)
						buffer_train3 = results3["dataset"]
				    	sim_train3 = sim_train3.concat(results3["simulated"])

				    	console.log("DEBUGSIM: size of aggregated simulated after plus "+ sim_train3.length + " in utterances "+_.flatten(sim_train3).length)
	
				    	trainAndTest.trainAndTest_async(classifiers[_.values(classifierList)[2]], bars.copyobj(sim_train3), bars.copyobj(testset), function(err, stats3){

				    		extractGlobal(_.values(classifierList)[2], sim_train3, fold, stats3['stats'], glob_stats, classifierList)

							_.each(glob_stats, function(data, param, list){
								master.plotlc(fold, param, glob_stats)
								console.log("DEBUGLC: param "+param+" fold "+fold+" build")
								master.plotlc('average', param, glob_stats)
							})
						})

						callback_while();
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

	var classifierList  = [ 'DS_comp_unigrams_async', 'DS_comp_unigrams_async_05', 'DS_comp_unigrams_async_00625']

	// var dataset = bars.loadds(__dirname+"/../../negochat_private/dialogues")
	// var utterset = bars.getsetcontext(dataset)
	// var dataset = utterset["train"].concat(utterset["test"])

	var data = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed.json"))
	var utterset = bars.getsetcontext(data)
	var dataset = utterset["train"].concat(utterset["test"])

	dataset = _.filter(dataset, function(num){ return num.length > 10 });

	console.log("size of dataset: "+dataset.length)

	// dataset = _.shuffle(dataset)
	// dataset = dataset.slice(0,10)

	learning_curves(classifierList, dataset, 1/*step*/, 1/*step0*/, 30/*limit*/,  5/*numOfFolds*/, function(){
		console.log()
		process.exit(0)
	})
}
