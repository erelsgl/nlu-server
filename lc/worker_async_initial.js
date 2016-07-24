var cluster = require('cluster');
var async = require('async')
var _ = require('underscore')._;
var fs = require('fs');
var classifiers = require(__dirname+"/../classifiers.js")
var partitions = require('limdu/utils/partitions');
var trainAndTest = require(__dirname+'/../utils/trainAndTest');
var bars = require(__dirname+'/../utils/bars');
var lc = require(__dirname+'/lc');
var util = require('util');
var log_file = "./logs/" + process.pid

console.vlog = function(data) { fs.appendFileSync(log_file, data + '\n', 'utf8') };
console.mlog = function(data) { fs.appendFileSync("./logs/master", data + '\n', 'utf8') };

if (cluster.isWorker)
	process.on('message', function(message) {
	
	var classifier = process.env["classifier"]
	var fold = process.env["fold"]
	
   	console.log('DEBUG: worker ' + process.pid + ' received message from master.')
	
	//var train = bars.processdataset(_.flatten(JSON.parse(message['train'])), {"intents": true, "filter":true})
	var train = JSON.parse(message['train'])
	var test = JSON.parse(message['test'])

/*	if (classifier == "Natural")
		var test  = bars.processdataset(_.flatten(JSON.parse(message['test'])), {"intents": true, "filter":false})
	else
		var test  = _.flatten(JSON.parse(message['test']))
*/
	console.vlog("DEBUG: worker "+process.pid+" : train.length="+train.length + " test.length="+test.length + " classifier "+classifier)
	var index = 0

	async.whilst(
	    function () { return index < train.length },
	    function (callbackwhilst) {

		if (index<10)
			{ index += 2} 
		else if (index<20)
			{ index += 5 }
		else index += 10

	    var mytrain = bars.copyobj(train.slice(0, index))
	    var mytrainex =  bars.processdataset(_.flatten(mytrain), {"intents": true, "filter":true})
	    var mytestex  = []

	      if (classifier == "Natural")
              		mytestex  = bars.processdataset(_.flatten(test), {"intents": true, "filter":false})
              else
                        mytestex  = _.flatten(test)

		console.vlog("DEBUG: worker "+process["pid"]+": index=" + index +
			" train_dialogue="+mytrain.length+" train_turns="+mytrainex.length+
			" test_dialogue="+test.length +" test_turns="+mytestex.length+
			" classifier="+classifier+ " fold="+fold)

		var realmytrainex = bars.copyobj(mytrainex)	
		console.vlog("DIST: class: " + classifier + " DIST:"+JSON.stringify(bars.returndist(realmytrainex), null, 4))
	
		var global_stats = {}

		async.series([
 			function(callback){
        		if(classifier == "Natural") {
     		   		trainAndTest.trainAndTest_async(classifiers[classifier], bars.copyobj(realmytrainex), bars.copyobj(mytestex), function(err, stats){
     		   			global_stats = bars.copyobj(stats)
          				callback(null, null);     		   		
     		   		})
     		   	} else {
          			callback(null, null);
        		}
   	 		},
  		  	function(callback){
        		if (classifier == "Component") {
        		
          			callback(null, null);
			} else {
          			callback(null, null);
        		}
   		 	}
		], function () {

			var stats1 = {}
			_.each(global_stats['stats'], function(value, key, list){ 
		    		if ((key.indexOf("Precision") != -1) || (key.indexOf("Recall") != -1 ) || (key.indexOf("F1") != -1) || (key.indexOf("Accuracy") != -1))
		    			stats1[key] = value
		    	}, this)

			
				var results = {
					'classifier': classifier,
					'fold': fold,
					'trainsize': mytrain.length,
					'trainsizeuttr': mytrain.length,
					'stats': stats1
					// 'uniqueid': stats['id']
				}

				process.send(JSON.stringify(results))
		   		callbackwhilst()
 	

	})}
	,
        function (err) {
                        console.vlog("DEBUG: worker "+process["pid"]+": exiting")
                        process.exit()

	})
})

if (cluster.isMaster)
{
	lc.cleanFolder(__dirname + "/learning_curves")
	lc.cleanFolder("./logs")
	
	var folds = 10
	var stat = {}

	//var classifiers = [ 'Natural','Natural_trans','Biased_no_rephrase','Biased_no_rephrase_trans']
	var classifiers = [ 'Natural' ]
	
	cluster.setupMaster({
  	exec: __filename,
	// args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
	// silent: false
	});

		var data = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed_finalized.json"))
		console.mlog("number of unprocessed dialogues: "+data.length)

		var utterset = bars.getsetcontext(data)
		var dataset = utterset["train"].concat(utterset["test"])
			
		_.each(classifiers, function(classifier, key, list){ 
			_(folds).times(function(fold){
			
				var worker = cluster.fork({ 'fold': fold, 'classifier':classifier })
				console.mlog("start worker")
				
				var data = partitions.partitions_consistent_by_fold(bars.copyobj(dataset), folds, fold)
				console.mlog("DEBUGMASTER: classifier: "+classifier+" fold: "+ fold + " train size "+data.train.length + " test size " + data.test.length+" process: "+worker.process.id)

				worker.send({ 		
						'train': JSON.stringify(data.train), 
						'test': JSON.stringify(data.test)
						})

				worker.on('disconnect', function(){
				  	console.mlog("DEBUGMASTER: finished: number of clusters: " + Object.keys(cluster.workers).length)
				  	//if (Object.keys(cluster.workers).length == 1)
					//next()
					_.each(stat, function(data, param, list){ lc.plotlc('average', param, stat) })
				})

				worker.on('message', function(message){
					var workerstats = JSON.parse(message)
					workerstats['classifiers'] = classifiers
					console.mlog("DEBUGMASTER: on message: "+message)
					lc.extractGlobal(workerstats, stat)
				})
			})
		}, this)
		

		_.each(stat, function(data, param, list){
			lc.plotlc('average', param, stat)
		})
}
