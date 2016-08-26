var cluster = require('cluster');
var async = require('async')
var _ = require('underscore')._;
var fs = require('fs');
var master = require('./master');
var partitions = require('limdu/utils/partitions');
var classifiers = require(__dirname+"/../classifiers.js")
var trainAndTest = require(__dirname+'/../utils/trainAndTest');
var bars = require(__dirname+'/../utils/bars');
var lc = require(__dirname+'/lc');
var util = require('util');
var fold = process.env["fold"]
// var folds = process.env["folds"]
var classifier = process.env["classifier"]
var lcfolder = __dirname + "/learning_curves_intents/"

console.vlog = function(data) { fs.appendFileSync("./logs/" + process.pid, data + '\n', 'utf8') };
console.mlog = function(data) { fs.appendFileSync("./logs/master", data + '\n', 'utf8') };

if (cluster.isWorker)
	process.on('message', function(message) {

    	console.vlog('DEBUG: worker ' + process.pid + ' received message from master.')
	
		var train = JSON.parse(message['train'])
		var test  = JSON.parse(message['test'])

        var test  = bars.processdataset(_.flatten(test), {"intents": true, "filterIntent":["Quit","Greet"], "filter":false})
        var train  = bars.processdataset(_.flatten(train), {"intents": true, "filterIntent":["Quit","Greet"], "filter":true})

    
		_.each(test, function(turn, key, list){ delete test[key]["input"]["trans"] }, this)
		_.each(train, function(turn, key, list){ delete test[key]["input"]["trans"] }, this)

	console.vlog("DEBUG: worker "+process.pid+" : train.length="+train.length + " test.length="+test.length)

	var index = 0

	async.whilst(
	    //function () { return index < train.length },
	    function () { return index < 50 },
	    function (callbackwhilst) {

		async.waterfall([
    		function(callbacks) {

        		//if (index == 0) index = 3
			if (index < 10) index +=1
			else index += 5
	
    		var mytrain = train.slice(0, index)
			var mytrainex = JSON.parse(JSON.stringify(mytrain))
    		var mytestex = JSON.parse(JSON.stringify(test))

			console.vlog("DEBUG: worker "+process["pid"]+": index=" + index +
				" train_dialogue="+mytrain.length+" train_turns="+_.flatten(mytrainex).length+
				" test_dialogue="+test.length +" test_turns="+mytestex.length+
				" classifier="+classifier+ " fold="+fold)
			
				switch(classifier) {
  
    				default:
						callbacks(null, mytrainex, mytestex, mytrainex.length)
        		}

    		},
    		function(mytrainex, mytestex, trainsize, callback) {

		
			console.vlog("DEBUGPRETRAIN: classifier:"+classifier+" mytrainex: "+mytrainex.length+" mytestex: "+mytestex.length+ " reportedtrainsize:"+trainsize)
			

    			trainAndTest.trainAndTest_async(classifiers[classifier], bars.copyobj(mytrainex), bars.copyobj(mytestex), function(err, stats){
    			//trainAndTest.trainAndTest_async(classifiers[classifier], bars.copyobj(mytrainex), bars.copyobj(mytestex), function(err, stats){
    			//trainAndTest.trainAndTest_async(classifiers.Natural, bars.copyobj(mytrainex), bars.copyobj(mytestex), function(err, stats){

				console.vlog("DEBUG: worker "+process["pid"]+": traintime="+
					stats['traintime']/1000 + " testtime="+ 
					stats['testtime']/1000 + " classifier="+classifier + 
					" Accuracy="+stats['stats']['Accuracy']+ " fold="+fold)

				var results = {
					'classifier': classifier,
					'fold': fold,
					'trainsize': trainsize,
					'trainsizeuttr': trainsize,
					'stats': bars.compactStats(stats)
					//'data': stats.data		
				}

				console.vlog("STATS: stats:"+JSON.stringify(results, null, 4))

				process.send(JSON.stringify(results))
				callbackwhilst()
			 	})
		    			
    		}], function (err, result) {
   
		})},
    function (err) {
			console.vlog("DEBUG: worker "+process["pid"]+": exiting")
			process.exit()
		})
	});



if (cluster.isMaster)
{
	var stat = {}

	bars.cleanFolder(lcfolder)
	bars.cleanFolder("./logs")

	var folds = 2

//	var classifiers = ["Unigram", "Unigram_Lemma", "Unigram+Context", "Unigram_Lemma+Context", "Unigram+Context+Neg", 'Unigram+Neg']
//	var classifiers = [ "Unigram", "Unigram+Context", "Unigram+Neg", "Unigram+Context+Neg" ]
//	var classifiers = [ "Natural_Neg", "Natural_Neg_Svm" ]
	var classifiers = [ "Natural_Neg", "Natural_Neg_Svm", "Natural_Neg_Decisiontree", "Natural_Neg_Randomforest", "Natural_Neg_Adaboost" ]

	
	var data1 = (JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed_finalized.json")))
 	var utterset1 = bars.getsetcontext(data1, false)
	var train1 = utterset1["train"].concat(utterset1["test"])

	cluster.setupMaster({
  	exec: __filename,
	// args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
	// silent: false
	});
	
	console.mlog("DEBUGMASTER: loaded: "+train1.length)

	_.each(classifiers, function(classifier, key, list){ 
		_(folds).times(function(fold){
		
			// worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len, 'datafile': datafile, 'thread': thr})
			var worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier})
			
			var data = partitions.partitions_consistent_by_fold(train1, folds, fold)

			console.mlog("DEBUGMASTER: class: "+classifier+" fold:"+ fold + " train size:"+data.train.length + " test size:" + data.test.length)
			console.mlog("DEBUGMASTER: process.pid:"+worker.process.pid)

			worker.send({ 		
					'train': JSON.stringify(data.test), 
					'test': JSON.stringify(data.train)
		     		})
			
			worker.on('disconnect', function(){
			  	console.mlog("DEBUGMASTER: finished: workers.length: "+Object.keys(cluster.workers).length )
				//disc += 1
			  	//if (Object.keys(cluster.workers).length == 1)
			  	_.each(stat, function(data, param, list){
					lc.plotlc('average', param, stat, lcfolder)
				})
				console.mlog(JSON.stringify(stat, null, 4))
			})

			worker.on('message', function(message){
				var workerstats = JSON.parse(message)
				workerstats['classifiers'] = classifiers
				console.mlog("DEBUGMASTER: on message: "+message)
				lc.extractGlobal(workerstats, stat)
			})
		})
	}, this)
}
