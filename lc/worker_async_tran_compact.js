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
var thread = process.env["thread"]

console.vlog = function(data) { fs.appendFileSync("./logs/" + process.pid, data + '\n', 'utf8') };
console.mlog = function(data) { fs.appendFileSync("./logs/master", data + '\n', 'utf8') };

if (cluster.isWorker)
	process.on('message', function(message) {

    	console.vlog('DEBUG: worker ' + process.pid + ' received message from master.')
	
	var train = JSON.parse(message['train'])
	var test  = JSON.parse(message['test'])

	//var train = _.flatten(train)
        var test  = bars.processdataset(_.flatten(test), {"intents": true, "filter_Quit_Greet":true, "filter":false})
        var train  = bars.processdataset(_.flatten(train), {"intents": true, "filter_Quit_Greet":true, "filter":true})

    //    _.each(train, function(turn, key, list){ delete train[key]["input"]["sentences"]}, this)

	_.each(test, function(turn, key, list){
		//delete test[key]["input"]["sentences"]
		delete test[key]["input"]["trans"]
	}, this)

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
    				case "Google": callbacks(null, bars.gettrans(mytrainex, "G:.*:G"), mytestex, mytrainex.length); break;
    				case "Microsoft": callbacks(null, bars.gettrans(mytrainex, "M:.*:M"), mytestex, mytrainex.length); break;
    				case "Yandex": callbacks(null, bars.gettrans(mytrainex, "Y:.*:Y"), mytestex, mytrainex.length); break;
    				
    				case "NLU_Tran_Yandex_Google": callbacks(null, bars.gettrans(mytrainex, "Y:.*:G"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Yandex_Microsoft": callbacks(null, bars.gettrans(mytrainex, "Y:.*:M"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Microsoft_Yandex": callbacks(null, bars.gettrans(mytrainex, "M:.*:Y"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Microsoft_Google": callbacks(null, bars.gettrans(mytrainex, "M:.*:G"), mytestex, mytrainex.length); break;
    				case "NLU_Emb_Trans": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;
    				case "NLU_Emb_Trans_25": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;
    				case "NLU_Emb_Trans_50": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;
    				case "NLU_Emb_Trans_100": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;

				case "NLU_Tran_Google_Yandex": callbacks(null, bars.gettrans(mytrainex, "G:.*:Y"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Google_Microsoft": callbacks(null, bars.gettrans(mytrainex, "G:.*:M"), mytestex, mytrainex.length); break;

    				case "NLU_Tran_GGFinish": callbacks(null, bars.gettrans(mytrainex, "G:fi:G"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Yandex_Microsoft_French": callbacks(null, bars.gettrans(mytrainex, "Y:fr:M"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Yandex_Microsoft_German": callbacks(null, bars.gettrans(mytrainex, "Y:de:M"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Yandex_Microsoft_Spanish": callbacks(null, bars.gettrans(mytrainex, "Y:es:M"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Yandex_Microsoft_Portuguese": callbacks(null, bars.gettrans(mytrainex, "Y:pt:M"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Yandex_Microsoft_Hebrew": callbacks(null, bars.gettrans(mytrainex, "Y:he:M"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Yandex_Microsoft_Arabic": callbacks(null, bars.gettrans(mytrainex, "Y:ar:M"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Yandex_Microsoft_Russian": callbacks(null, bars.gettrans(mytrainex, "Y:ru:M"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Yandex_Microsoft_Chinese": callbacks(null, bars.gettrans(mytrainex, "Y:zh:M"), mytestex, mytrainex.length); break;
    				
				case "NLU_Tran_French": callbacks(null, bars.gettrans(mytrainex, ".*:fr:.*"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_German": callbacks(null, bars.gettrans(mytrainex, ".*:de:.*"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Spanish": callbacks(null, bars.gettrans(mytrainex, ".*:es:.*"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Portuguese": callbacks(null, bars.gettrans(mytrainex, ".*:pt:.*"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Hebrew": callbacks(null, bars.gettrans(mytrainex, ".*:he:.*"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Arabic": callbacks(null, bars.gettrans(mytrainex, ".*:ar:.*"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Russian": callbacks(null, bars.gettrans(mytrainex, ".*:ru:.*"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Chinese": callbacks(null, bars.gettrans(mytrainex, ".*:zh:.*"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Urdu": callbacks(null, bars.gettrans(mytrainex, ".*:ur:.*"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Finish": callbacks(null, bars.gettrans(mytrainex, ".*:fi:.*"), mytestex, mytrainex.length);break;
    				case "NLU_Tran_Hungarian": callbacks(null, bars.gettrans(mytrainex, ".*:hu:.*"), mytestex, mytrainex.length);break;
				case "Natural_trans": 

					console.vlog("NLU_trans")
    				callbacks(null, bars.gettrans(mytrainex, ".*:fi:.*"), mytestex, mytrainex.length); 
    				//_.each(mytrainex, function(turn, key, list){
    				//	mytrainex[key]["input"]["trans"] = {}
    				//}, this)
//
//					mytrainex = mytrainex.concat(JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/seeds_adv.json")))    		
  //  					callbacks(null, bars.gettrans(mytrainex, ".*:fi:.*"), mytestex, mytrainex.length); 
					

    				break;
    				case "NLU_Tran_Hungarian": callbacks(null, bars.gettrans(mytrainex, ".*:hu:.*"), mytestex, mytrainex.length); break;	
    				case "NLU_Tran_Finish_Arabic:": callbacks(null, bars.gettrans(mytrainex, ".*:(ar|fi):.*"), mytestex, mytrainex.length); break;	
    				case "NLU_Tran_Yandex_Microsoft_Finish": callbacks(null, bars.gettrans(mytrainex, "Y:fi:M"), mytestex, mytrainex.length); break;	
    				case "NLU_Tran_All": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;	
    				
				case "NLU_Bal": callbacks(null, bars.gettransdist(mytrainex), mytestex, mytrainex.length); break;
    				case "NLU_Oversample": callbacks(null, bars.oversample(mytrainex), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Oversample": callbacks(null, bars.tranoversam(mytrainex), mytestex, mytrainex.length); break;

    				default:
						//mytrainex = mytrainex.concat(JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/seeds_adv.json")))    		
        				callbacks(null, mytrainex, mytestex, mytrainex.length)
        		}

    		},
    		function(mytrainex, mytestex, trainsize, callback) {

			mytrainex =  bars.processdataset(mytrainex, {"intents": true, "filter_Quit_Greet":true, "filter":true})
    	
			console.vlog("DEBUGPRETRAIN: classifier:"+classifier+" mytrainex: "+mytrainex.length+" mytestex: "+mytestex.length+ " reportedtrainsize:"+trainsize)
			
			if (classifier.indexOf("Emb")!=-1)
				var baseline_cl = classifiers[classifier]
			else
				var baseline_cl = classifiers.Natural_Neg

    			trainAndTest.trainAndTest_async(baseline_cl, bars.copyobj(mytrainex), bars.copyobj(mytestex), function(err, stats){
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

	bars.cleanFolder(__dirname + "/learning_curves")
	bars.cleanFolder("./logs")

	var folds = 10
	var classifiers = [ "No_translations", "NLU_Tran_All", "NLU_Emb_Trans_Sum", "NLU_Emb_Trans_Ext" ]
	//var classifiers = [ 'No_translations', "Google", "Microsoft", "Yandex" ]
	//var classifiers = [ 'Natural', "NLU_Tran_Yandex_Google", "NLU_Tran_Yandex_Microsoft", "NLU_Tran_Microsoft_Yandex",
	//			"NLU_Tran_Microsoft_Google", "NLU_Tran_All", "Google", "Yandex"]
				//"NLU_Tran_Microsoft_Google", "NLU_Tran_Google_Yandex", "NLU_Tran_Google_Microsoft"]
	//var classifiers = [ "No_translations", "Google", "NLU_Tran_Microsoft_Google"]
	//var classifiers = [ "Natural", "NLU_Emb_25", "NLU_Emb_50", "NLU_Emb_Trans", "NLU_Tran_All"]
	//var classifiers = [ "NLU_Tran_All", "NLU_Emb_Trans_25", "NLU_Emb_Trans_50", "NLU_Emb_Trans_100"]
	//var classifiers = [ "Natural","NLU_Tran_GGFinish"]

	//var classifiers = ["Natural", "NLU_Tran_German","NLU_Tran_Spanish","NLU_Tran_Portuguese","NLU_Tran_Hebrew","NLU_Tran_Arabic","NLU_Tran_Russian","NLU_Tran_Chinese","NLU_Tran_Urdu","NLU_Tran_Finish", "NLU_Tran_Hungarian", "NLU_Tran_All"]
	
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
					lc.plotlc('average', param, stat)
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
