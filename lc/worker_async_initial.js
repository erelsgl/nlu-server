//compare natural and component approaches

var cluster = require('cluster');
var async = require('async')
var _ = require('underscore')._;
var fs = require('fs');
var classifiers = require(__dirname+"/../classifiers.js")
var PrecisionRecall = require('limdu/utils/PrecisionRecall');
var partitions = require('limdu/utils/partitions');
var trainAndTest = require(__dirname+'/../utils/trainAndTest');
var bars = require(__dirname+'/../utils/bars');
var lc = require(__dirname+'/lc');
var util = require('util');
var lcfolder = __dirname + "/learning_curves_initial/"

console.vlog = function(data) { fs.appendFileSync("./logs/" + process.pid, data + '\n', 'utf8') };
console.mlog = function(data) { fs.appendFileSync("./logs/master", data + '\n', 'utf8') };

if (cluster.isWorker)
	process.on('message', function(message) {
	
	var classifier = process.env["classifier"]
	var fold = process.env["fold"]		
	var train = JSON.parse(message['train'])
	var test = JSON.parse(message['test'])

	console.vlog("DEBUG: worker "+process.pid+" : train.length="+train.length + " test.length="+test.length + " classifier "+classifier)
	var index = 1

	async.whilst(
	    function () { return index <= train.length },
	    function (callbackwhilst) {

	    var mytrain = bars.copyobj(train.slice(0, index))
	    index += 1

	    var mytestex  = []
		var mytrainex = []
		
		if (classifier.indexOf("Natural")!=-1)
		{
			mytrainex =  bars.processdataset(_.flatten(bars.copyobj(mytrain)), {"intents": false, "filter":false, "filterIntent":[]})
			mytestex  = bars.processdataset(_.flatten(bars.copyobj(test)), {"intents": false, "filter":false, "filterIntent":[]})
		}             
        
        if (classifier.indexOf("Component")!=-1)
		{                
	    	mytrainex =  bars.processdataset(_.flatten(bars.copyobj(mytrain)), {"intents": true, "filter":false, "filterIntent":[]})
		    mytestex  = _.flatten(bars.copyobj(test))
		}

		console.vlog("DEBUG: worker "+process["pid"]+": index=" + index +
			" train_dialogue="+mytrain.length+" train_turns="+mytrainex.length+
			" test_dialogue="+test.length +" test_turns="+mytestex.length+
			" classifier="+classifier+ " fold="+fold)

		var realmytrainex = bars.copyobj(mytrainex)	
		console.vlog("DIST: class: " + classifier + " DIST:"+JSON.stringify(bars.returndist(realmytrainex), null, 4))
	
		var global_stats = {}

		async.series([
 			function(callback){
        		if(classifier.indexOf("Natural")!=-1) {
     		   		trainAndTest.trainAndTest_async(classifiers[classifier], bars.copyobj(realmytrainex), bars.copyobj(mytestex), function(err, stats){
     		   			global_stats = bars.copyobj(stats)
          				callback(null, null);     		   		
     		   		})
     		   	} else {
          			callback(null, null);
        		}
   	 		},
  		  	function(callback){
        		if (classifier.indexOf("Component")!=-1) {

        			var mapping = []
					var test_set = []

					// prepare single-sentenced testSet in usualy format  
					_.each(mytestex, function(turn, vkey, list){
						mytestex[vkey]["actual"] = []

						console.vlog("PREPARE TEST: text: "+turn["input"]["text"])
						_.each(bars.sbd(turn["input"]["text"]), function(text, key, list){

							var record = {"input":{"context":[]}}
							record["input"]["text"] = text
							record["input"]["context"] = turn["input"]["context"]
							test_set.push(record)
							
							console.vlog("PREPARE TEST: record: "+JSON.stringify(record, null, 4))
							mapping.push(vkey)
						
						}, this)
					}, this)

					var test_set_copy = bars.copyobj(test_set)
					var classif = new classifiers[classifier]
					var classes = []
					var currentStats = new PrecisionRecall()

					console.vlog("TRAIN:"+JSON.stringify(realmytrainex, null, 4))

					classif.trainBatchAsync(realmytrainex, function(err, results){
						classif.classifyBatchAsync(test_set_copy, 50, function(error, test_results){
		
							_.each(test_results, function(value, key, list){
								console.vlog("TEST: result: intents: "+JSON.stringify(value, null, 4))
								var attrval = classifiers.getRule({}, test_set[key]["input"]["text"]).labels
								console.vlog("TEST: result: attrval: "+JSON.stringify(attrval, null, 4))
								var cl = bars.coverfilter(bars.generate_possible_labels(bars.resolve_emptiness_rule([value.output, attrval[0], attrval[1]])))
								console.vlog("TEST: result: composition: "+JSON.stringify(cl, null, 4))
								mytestex[mapping[key]]["actual"].push(cl)
							}, this)

							_.each(mytestex, function(value, key, list){
								var cla = _.flatten(value["actual"])
								console.vlog("EVAL: actual: "+JSON.stringify(cla, null, 4))
								console.vlog("EVAL: expected: "+JSON.stringify(value.output, null, 4))
								mytestex[key]["exp"] = currentStats.addCasesHash(value.output, cla, true)
								currentStats.addIntentHash(value.output, cla, true)
							}, this)

							currentStats.calculateStats()

							global_stats = {'stats': currentStats}
		          			callback(null, null);
						})
					})

			} else 
          			callback(null, null);
      	
		}], function () {

				console.mlog("global_stats: "+_.keys(global_stats['stats'], null, 4).length)
	
				var results = {
					'classifier': classifier,
					'fold': fold,
					'trainsize': mytrain.length,
					'trainsizeuttr': mytrain.length,
					'stats': bars.compactStats(global_stats)
				}

				console.mlog("worker send message: "+JSON.stringify(results, null, 4))

				process.send(JSON.stringify(results))
		   		callbackwhilst()
 	

	})}, function (err) {
    	console.vlog("DEBUG: worker "+process["pid"]+": exiting")
        process.exit()
	})
})

if (cluster.isMaster)
{
	lc.cleanFolder(lcfolder)
	lc.cleanFolder("./logs")
	
	var folds = 10
	var statt = {}

	//var classifiers = [ 'Natural','Natural_trans','Biased_no_rephrase','Biased_no_rephrase_trans']
	//var classifiers = [ "Natural", "Natural+Context", "Component", "Component+Context" ]
	// var classifiers = [ "Natural_SVM", "Natural_ADA", "Natural_RF", "Component", "Component+Context", "Natural_SVM_Context", "Natural_ADA_Context", "Natural_RF_Context" ]
	var classifiers = [ "Component" ]

	cluster.setupMaster({
  	exec: __filename,
	// args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
	// silent: false
	});

	var data = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed_finalized_fin_full_biased.json"))
	console.mlog("number of unprocessed dialogues: "+data.length)
	var utterset = bars.getsetcontext(data)
	var dataset = utterset["train"].concat(utterset["test"])
			
	_(folds).times(function(fold){
			
		var data = partitions.partitions_consistent_by_fold(bars.copyobj(dataset), folds, fold)
		
		_.each(classifiers, function(classifier, key, list){ 
			
			var worker = cluster.fork({ 'fold': fold, 'classifier':classifier })
			console.mlog("start worker")
			console.mlog("DEBUGMASTER: classifier: "+classifier+" fold: "+ fold + " train size "+data.train.length + " test size " + data.test.length+" process: "+worker.process.id)

			worker.send({'train': JSON.stringify(data.test), 'test': JSON.stringify(data.train)})

			worker.on('disconnect', function(){
  				console.mlog("DEBUGMASTER: finished: number of clusters: " + Object.keys(cluster.workers).length)
  				console.mlog("DEBUGMASTER: "+_.keys(statt))
				_.each(statt, function(data, param, list){ 
  					console.mlog("plotlc")
					lc.plotlc('average', param, statt, lcfolder) 
				})
			})

			worker.on('message', function(message){
				var workerstats = JSON.parse(message)
				workerstats['classifiers'] = classifiers
				//console.mlog("DEBUGMASTER: on message: "+message)
				lc.extractGlobal(workerstats, statt)
			})
		})
	}, this)
		
}