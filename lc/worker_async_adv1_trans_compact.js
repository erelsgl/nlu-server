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

console.vlog = function(data) {
    fs.appendFileSync(log_file, data + '\n', 'utf8')
};

if (cluster.isWorker)
process.on('message', function(message) {
	
	var classifier = process.env["classifier"]
	var fold = process.env["fold"]
	// var thread = process.env["thread"]

   	console.log('DEBUG: worker ' + process.pid + ' received message from master.')
	
	var test  = bars.processdatasettest(JSON.parse(message['test']))
	var train = bars.processdatasettrain(JSON.parse(message['train']))

	_.each(train, function(turn, key, list){
		delete train[key]["input"]["sentences"]
	}, this)

	_.each(test, function(turn, key, list){
		delete test[key]["input"]["sentences"]
	}, this)

	var max  = JSON.parse(message['max'])
	var max = 70

	console.vlog("DEBUG: worker "+process.pid+" : train.length="+train.length + " test.length="+test.length + " max="+max + " classifier "+classifier)
	var index = 0

	async.whilst(
	    function () { return index < max },
	    function (callbackwhilst) {

		if (index<10)
		{ index += 2} 
		else if (index<20)
		{ index += 5 }
		else index += 10


	       	var mytrain = bars.copyobj(train.slice(0, index))
	       	var mytrainex =  _.flatten(mytrain)
			var mytestex  = _.flatten(test)

			if (["Biased_no_rephrase_trans", "Natural_trans"].indexOf(classifier) != -1)
				mytrainex = bars.gettrans(mytrainex, ".*")

			console.vlog("DEBUG: worker "+process["pid"]+": index=" + index +
				" train_dialogue="+mytrain.length+" train_turns="+mytrainex.length+
				" test_dialogue="+test.length +" test_turns="+mytestex.length+
				" classifier="+classifier+ " fold="+fold)

			var realmytrainex = bars.copyobj(mytrainex)	
			console.vlog("DIST: class: " + classifier + " DIST:"+JSON.stringify(bars.returndist(realmytrainex), null, 4))

			if (index >= max)
        	    {
               		if (classifier == "Undersampled")
            	         fs.appendFileSync("./logs/under", JSON.stringify(bars.returndist(realmytrainex), null, 4), 'utf8')

	        	    console.vlog("FINALE")
        		}

	    	trainAndTest.trainAndTest_async(classifiers[classifier], bars.copyobj(realmytrainex), bars.copyobj(mytestex), function(err, stats){

		    	console.vlog("DEBUG: worker "+process["pid"]+": traintime="+
		    		stats['traintime']/1000 + " testtime="+ 
		    		stats['testtime']/1000 + " classifier="+classifier + 
		    		" Accuracy="+stats['stats']['Accuracy']+ " fold="+fold)

		    	console.vlog(JSON.stringify(stats['stats'], null, 4))

		    	var stats1 = {}
		    	_.each(stats['stats'], function(value, key, list){ 
		    		if ((key.indexOf("Precision") != -1) || (key.indexOf("Recall") != -1 ) || (key.indexOf("F1") != -1) || (key.indexOf("Accuracy") != -1))
		    			stats1[key] = value
		    	}, this)

				console.vlog("STATS: fold:"+fold+" trainsize:"+mytrain.length+" classifier:"+classifier+" "+JSON.stringify(stats1, null, 4))

				var results = {
					'classifier': classifier,
					'fold': fold,
					'trainsize': mytrain.length,
					'trainsizeuttr': realmytrainex.length,
					'stats': stats1
					// 'uniqueid': stats['id']
				}

				process.send(JSON.stringify(results))
		   		callbackwhilst()
		   	})
	    },
    	function (err) {
			console.vlog("DEBUG: worker "+process["pid"]+": exiting")
			process.exit()
		})
});

if (cluster.isMaster)
{
	console.log("start master")

	//fs.writeFileSync(statusfile, "")
	//fs.writeFileSync(plotfile, "")
	lc.cleanFolder(__dirname + "/learning_curves")
	lc.cleanFolder("./logs")
	
	var folds = 10
	var stat = {}
	// var thr = 0
	// var maxfolds = 0
	// var id_fold = {}

	//var classifiers = [ 'Natural','Natural_trans','Biased_no_rephrase','Biased_no_rephrase_trans']
	var classifiers = [ 'Natural']
	
	cluster.setupMaster({
  	exec: __filename,
  	//exec: __dirname + '/worker_async_adv1_trans_compact.js',
  	// exec: __dirname + '/worker.js',
	// args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
	// silent: false
	});

	async.timesSeries(10, function(n, next){

		var data1 = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed.json"))
		console.vlog("number of unprocessed dialogues: "+data1.length)
		var utterset1 = bars.getsetcontext(data1, false)
		var train1 = utterset1["train"].concat(utterset1["test"])
		console.vlog("number of the dialogues: "+train1.length)

//		train1 = bars.processdataset(train1)

		var data2 = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/version7_trans.json"))
		var utterset2 = bars.getsetcontextadv(data2)
		var train2 = utterset2["train"].concat(utterset2["test"])
		
		console.vlog("number of the dialogues2: "+train2.length)
		// only intents
//		train2 = bars.processdataset(train2)
		// console.vlog("DEBUG: train2.length "+train2.length)

		_.each(classifiers, function(classifier, key, list){ 
			_(folds).times(function(fold){
			
				// worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len, 'datafile': datafile, 'thread': thr})
				var worker = cluster.fork({'fold': fold+n*folds, 'classifier':classifier, /*'thread': thr*/})
				console.log("start worker")
				//	console.vlog("DEBUGMASTER: classifier: "+classifier+" overall size: "+train1.length)
				
				var data = partitions.partitions_consistent_by_fold(bars.copyobj(train1), folds, fold)
		
				console.vlog("DEBUGMASTER: classifier: "+classifier+" fold: "+ (fold+n*folds) + " train size "+data.train.length + " test size " + data.test.length+" process: "+worker.process.id)

				var train2sam = _.flatten(_.sample(bars.copyobj(train2), 10))

				var train = []

				if (["Biased_with_rephrase", "Biased_no_rephrase", "Biased_no_rephrase_trans", "Biased_no_rephrase_no_con_trans", "Biased_no_rephrase_no_con"].indexOf(classifier)!=-1)
				// if (classifier == "Biased_with_rephrase")
					train = bars.copyobj(train2sam)
				// else if (classifier == "Biased_no_rephrase")
					// train = train3sam
				else
					train = _.flatten(bars.copyobj(data.test))

				var max = _.min([_.flatten(data.test).length, _.flatten(train2sam).length])
				// var max = _.min([_.flatten(data.test).length, _.flatten(train2sam).length])
				max = max - max % 10			
				
				console.vlog("DEBUGMASTER: train1.len="+_.flatten(data.test).length+ " train2.len="+ _.flatten(train2sam).length + " max="+max)
				console.vlog("DEBUGMASTER: class="+classifier+ " fold="+ fold + " train1.len="+train.length + " test.len=" + data.train.length + " max: "+max)
				
				data.train = _.flatten(data.train)

				worker.send({ 		
							'train': JSON.stringify(train), 
							'test': JSON.stringify(data.train),
							'max': JSON.stringify(max)
							})
				// thr += 1	

				worker.on('disconnect', function(){
				  	console.vlog("DEBUGMASTER: finished: number of clusters: " + Object.keys(cluster.workers).length)
				  	if (Object.keys(cluster.workers).length == 1)
					next()
				})

				worker.on('message', function(message){
					var workerstats = JSON.parse(message)
					workerstats['classifiers'] = classifiers
					console.vlog("DEBUGMASTER: on message: "+message)
					fs.appendFileSync(statusfile, JSON.stringify(workerstats, null, 4))
					lc.extractGlobal(workerstats, stat)
				})
			})
		}, this)
	}, function(){
		_.each(stat, function(data, param, list){
			lc.plotlc('average', param, stat)
		})

		console.vlog(JSON.stringify(stat, null, 4))
	})

}

