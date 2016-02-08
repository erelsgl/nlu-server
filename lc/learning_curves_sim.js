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
var trainAndTest_hash = require(__dirname+'/../utils/trainAndTest').trainAndTest_hash;
//var trainAndTest_batch = require(__dirname+'/../utils/trainAndTest').trainAndTest_batch;
var cross_batch = require(__dirname+'/../utils/trainAndTest').cross_batch;
var bars = require(__dirname+'/../utils/bars');
var master = require(__dirname+'/master');
var path = require("path")


// var gnuplot = __dirname + '/gnuplot'
var gnuplot = 'gnuplot'
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

function learning_curves(classifierList, dataset, step, step0, limit, numOfFolds) 
{
		checkGnuPlot

		if (dataset.length == 0)
			throw new Error("Dataset is empty");
		
		stat = {}
		stat1 = {}
		labels = {}
		glob_stats = {}
		
		var mytrain = []

		partitions.partitions_consistent(dataset, numOfFolds, function(train, test, fold) {
			
			var index = 4
			var testset = (bars.isDialogue(test) ? _.flatten(test) : test)
			var sim_train = _.flatten(train.slice(0, index-1))
			var buffer_train = _.flatten(train.slice(index+1))
			// var buffer_train = train.slice(index+1)

			// fs.writeFileSync(__dirname + dirr + "fold" + fold, "TEST \n"+JSON.stringify(test, null, 4)+"\n TRAIN \n"+JSON.stringify(train, null, 4), 'utf-8')

			while ((index <= train.length) && buffer_train.length > 100)
			// while (index <= train.length)
	  		{
			  	var report = []

				var mytrain = train.slice(0, index)
			  	
			  	index += (index < limit ? step0 : step)
			  	var mytrainset = (bars.isDialogue(mytrain) ? _.flatten(mytrain) : mytrain)

			  	// for simulated

				console.log("fold"+fold)

				var classifier	= _.values(classifierList)[0]	

				console.log("classifier " + classifier + " size of strandard " + mytrain.length + " in utterances "+ mytrainset.length)
    			var stats = trainAndTest_hash(classifiers[classifier], bars.copyobj(mytrainset), bars.copyobj(testset), 5)
//    			var stats = trainAndTest_batch(classifier, bars.copyobj(mytrainset), bars.copyobj(testset), 5)

    			_.each(stats['labels'], function(value, label, list){
    				stats['labels'][label]['count'] = countLabel(mytrainset, label)
    			}, this)
	    		
	    		// console.log(JSON.stringify(stats['stats']['confusion'], null, 4))
	    		// report.push(_.pick(stats['stats'], parameters))		    		
	 			extractGlobal(classifier, mytrain, fold, stats['stats'], glob_stats)

	    	 	var size_last_dial = _.flatten(mytrain[mytrain.length-1]).length

	    	 	console.log(size_last_dial+" size of the last dialogue")
	    	 	console.log(buffer_train.length+" size of the buffer train")

	    	 	var stats2 = cross_batch(classifiers[classifier], bars.copyobj(mytrainset), 2)

	    	 	console.log("LC: stats2="+JSON.stringify(stats2))

	    	 	var results = bars.simulateds(buffer_train, size_last_dial, stats2)
	    	 	// var results = bars.simulateds(buffer_train, size_last_dial, _.keys(stats1).length > 0 ? stats1['stats']['labels']: stats['stats']['labels'])
	    	 	// var results = bars.simulaterealds(buffer_train, size_last_dial, _.keys(stats1).length > 0 ? stats1['stats']['labels']: stats['stats']['labels'])

	    	 	console.log(results["simulated"].length+" size of the simulated train")
	    	 	console.log(results["dataset"].length+" size of the buffer train after simulation")

	    	 	console.log("size of sim "+ sim_train.length + " in utterances "+_.flatten(sim_train).length)

				buffer_train = results["dataset"]

				console.log(JSON.stringify(results["simulated"], null, 4))

		    	sim_train = sim_train.concat(results["simulated"])

		    	console.log(sim_train.length+" "+mytrainset.length)

		    	// single label sentences for training

		    	// var sim_train = []
		    	// _.each(mytrainset, function(value, key, list){
		    	// 	if (value.output.length==1)
		    	// 		sim_train.push(value)
		    	// }, this)

		    	// console.log("Size of the origin train "+mytrainset.length)
		    	// console.log("Size of the single label train "+sim_train.length)
		    	
				// var stats1 = trdainAndTest_hash(classifier, bars.copyobj(sim_train), bars.copyobj(testset), 5)
		    	

			var stats1 = trainAndTest_hash(classifiers[_.values(classifierList)[1]], bars.copyobj(sim_train), bars.copyobj(testset), 5)

		    	_.each(stats1['labels'], function(value, label, list){
    				stats1['labels'][label]['count'] = countLabel(sim_train, label)
    			}, this)
	    			    		
	    		// report.push(_.pick(stats1['stats'], parameters))		    		

	    		var labcom = {}

	    		_.each(stats['labels'], function(performance, label, list){
	    			labcom[label] = {}
	    			labcom[label]['original'] = performance
	    			if (label in stats1['labels'])
	    				labcom[label]['simulated'] = stats1['labels'][label]
	    		}, this)

	    		var diffcom = {}
	    		var difflist = []

	    		_.each(labcom, function(valuee, label, list){
	    			if ('simulated' in valuee)
	    			{
	    				if (valuee['original']['F1']!=valuee['simulated']['F1'])
	    				{
	    					diffcom[label] = valuee

	    					var origF1 = (valuee['original']['F1'] == -1 ) ? 0 : valuee['original']['F1']
	    					var simF1 = (valuee['simulated']['F1'] == -1 ) ? 0 : valuee['simulated']['F1']
	    					difflist.push([label, simF1-origF1, valuee['simulated']['count'] - valuee['original']['count']])
	    				}

	    			}
	    		}, this)

	    		difflist = _.sortBy(difflist, function(num){ return num[1] })

	    		console.log("difflist="+JSON.stringify(difflist, null, 4))
	    		console.log("diffcom="+JSON.stringify(diffcom, null, 4))

	 			// extractGlobal(parameters, classifiers, mytrain, report, stat)
	 			extractGlobal(_.values(classifierList)[1], mytrain, fold, stats1['stats'], glob_stats)
                	
				console.log("DEBUGGLOB")
				console.log(JSON.stringify(glob_stats, null, 4))
				
				_.each(glob_stats, function(data, param, list){
					master.plotlc(fold, param, glob_stats)
					console.log("DEBUGLC: param "+param+" fold "+fold+" build")
					master.plotlc('average', param, glob_stats)
				})

			} //while (index < train.length)

				// _.each(labels, function(value, label, list){
		    		// plot('average', label, labels, {"Precision":true, "Recall":true, "F1":true})
				// })

			}); //fold

}

if (process.argv[1] === __filename)
{
	master.cleanFolder(__dirname + "/learning_curves")

	var classifierList  = [ 'DS_comp_unigrams_sync', 'DS_comp_unigrams_sync_sim']
	var dataset = bars.loadds(__dirname+"/../../negochat_private/dialogues")
	var utterset = bars.getsetcontext(dataset)
	var dataset = utterset["train"].concat(utterset["test"])

	// dataset = dataset.slice(0,10)

	learning_curves(classifierList, dataset, 1/*step*/, 1/*step0*/, 30/*limit*/,  3/*numOfFolds*/, function(){
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

