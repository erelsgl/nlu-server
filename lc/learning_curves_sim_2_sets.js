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

// function extractGlobal(parameters, classifiers, trainset, report, stat)
function extractGlobal(classifier, mytrain, fold, stats, glob_stats, classifiers)
{
		var stats_prep = {}

		_.each(stats, function(value, key, list){
			if ((key.indexOf("Precision") != -1) || (key.indexOf("Recall") != -1 ) || (key.indexOf("F1") != -1) || (key.indexOf("Accuracy") != -1))
				stats_prep[key] = value
		}, this)

		
		var results = {
			'classifier': classifier,
			'fold': fold,
			// 'trainsize': mytrain.length,
			'trainsize': _.flatten(mytrain).length,
			'trainsizeuttr': _.flatten(mytrain).length,
			'classifiers': classifiers,
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

function learning_curves(classifierList, step, step0, limit, numOfFolds, callback) 
{
	glob_stats = {}

	var data = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed.json"))
	var utterset1 = bars.getsetcontext(data)
	var train1or = utterset1["train"].concat(utterset1["test"])
	
	var data = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed_new.json"))
	var utterset2 = bars.getsetcontext(data)
	var train2 = utterset2["train"].concat(utterset2["test"])
	
	console.log("DEBUGLC: train2.length "+ train2.length)
	console.log("DEBUGLC: train1or.length "+ train1or.length)
	
	//	var train1 = _.shuffle(train1)	
	//	var train2 = _.shuffle(train2)

	async.timesSeries(numOfFolds, function(fold, callback_fold){

		var index = 0
		console.log("DEBUGLC: FOLD "+fold)

		var datasplitted = partitions.partitions_consistent_by_fold(JSON.parse(JSON.stringify(train1or)), numOfFolds, fold)
		var train1 = datasplitted['test']
		var testset = _.flatten(datasplitted['train'])

		async.whilst(

		function () { return (index <= train1.length && index <= train2.length)  },
	    	function (callback_while) {
		    	
			if (index<=10)
			{
		   		index += 1
			} 
			else if (index<20)
			{
			       	index += 2
		    }
		    else index += 10

	    	var mytrain1 = train1.slice(0, index)
	    	var mytrain2 = train2.slice(0, index)

		console.log("DEBUGLC: train1.length: "+ train1.length)
		console.log("DEBUGLC: train2.length: "+ train2.length)

		console.log("DEBUGLC: mytrain1.length: "+ mytrain1.length + " " + _.flatten(mytrain1).length)
		console.log("DEBUGLC: mytrain2.length: "+ mytrain2.length + " " + _.flatten(mytrain2).length)

		console.log("DEBUGLC: testset.length: "+ testset.length)

		    var mytrainset1 = JSON.parse(JSON.stringify((bars.isDialogue(mytrain1) ? _.flatten(mytrain1) : mytrain1)))

	   		// filter train to contain only single label utterances
		    console.log("DEBUGLC: size of mytrainset1 before filtering: "+ mytrainset1.length)
	   	    mytrainset1 = _.filter(mytrainset1, function(num){ return num.output.length == 1 })
		    console.log("DEBUGLC: size of mytrainset1 after filtering: "+ mytrainset1.length)

		    trainAndTest.trainAndTest_async(classifiers[_.values(classifierList)[0]], bars.copyobj(mytrainset1), bars.copyobj(testset), function(err, stats1){

			    extractGlobal(_.values(classifierList)[0], mytrainset1, fold, stats1['stats'], glob_stats, classifierList)
			    console.log(_.values(classifierList)[0])
			    console.log(JSON.stringify(stats1['stats'], null, 4))

	//			    bars.generateoppositeversion2(JSON.parse(JSON.stringify(mytrainset2)), function(err, sim_train){

		    			var mytrainset2 = JSON.parse(JSON.stringify((bars.isDialogue(mytrain2) ? _.flatten(mytrain2) : mytrain2)))
		    			console.log("DEBUGLC: size of mytrainset2 before filtering: "+ mytrainset2.length)
	   	    			mytrainset2 = _.filter(mytrainset2, function(num){ return num.output.length == 1 })
					console.log("DEBUGLC: size of mytrainset2 after filtering: "+ mytrainset2.length)

				    	trainAndTest.trainAndTest_async(classifiers[_.values(classifierList)[1]], bars.copyobj(mytrainset2), bars.copyobj(testset), function(err, stats2){

					    extractGlobal(_.values(classifierList)[1], mytrainset2, fold, stats2['stats'], glob_stats, classifierList)
				    		
				    	    console.log(_.values(classifierList)[1])
					    console.log(JSON.stringify(stats2['stats'], null, 4))

				    		_.each(glob_stats, function(data, param, list){
								master.plotlc(fold, param, glob_stats)
								console.log("DEBUGLC: param "+param+" fold "+fold+" build")
								master.plotlc('average', param, glob_stats)
							})

							callback_while();
				    	})
	//			    })
				})
	    },
	    function (err, n) {
	    	callback_fold(null)
	    });    	
    }, function() {
  			callback()
		})
}

if (process.argv[1] === __filename)
{
	master.cleanFolder(__dirname + "/learning_curves")

	var classifierList  = [ 'DS_comp_unigrams_async', 'DS_comp_unigrams_async_biased']

	learning_curves(classifierList, 1/*step*/, 1/*step0*/, 30/*limit*/,  10/*numOfFolds*/, function(){
		console.log()
		process.exit(0)
	})
}

