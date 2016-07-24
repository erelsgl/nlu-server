var cluster = require('cluster');
var async = require('async')
var _ = require('underscore')._;
var fs = require('fs');
var master = require('./master');
var classifiers = require(__dirname+"/../classifiers.js")
var trainAndTest = require(__dirname+'/../utils/trainAndTest');
var bars = require(__dirname+'/../utils/bars');
var lc = require(__dirname+'/lc');
var util = require('util');
var fold = process.env["fold"]
// var folds = process.env["folds"]
var classifier = process.env["classifier"]
var thread = process.env["thread"]

var log_file = "/tmp/logs/" + process.pid

console.vlog = function(data) { fs.appendFileSync(log_file, data + '\n', 'utf8') };
console.mlog = function(data) { fs.appendFileSync("./logs/master", data + '\n', 'utf8') };

if (cluster.isWorker)
	process.on('message', function(message) {

    console.vlog("DEBUG: worker "+ process.pid+": started")
    console.vlog('DEBUG: worker ' + process.pid + ' received message from master.')
	
	var train = JSON.parse(message['train'])
	var test  = JSON.parse(message['test'])

	var train =  bars.processdatasettrain(_.flatten(train))
    var test  = bars.processdatasettest(_.flatten(test))

    _.each(train, function(turn, key, list){
		delete train[key]["input"]["sentences"]
	}, this)

	_.each(test, function(turn, key, list){
		delete test[key]["input"]["sentences"]
	}, this)

	console.vlog("DEBUG: worker "+process.pid+" : train.length="+train.length + " test.length="+test.length)

	var index = 0

	async.whilst(
	    //function () { return index < train.length },
	    function () { return index < 30 },
	    function (callbackwhilst) {

		async.waterfall([
    		function(callbacks) {

        		//if (index == 0) index = 3
			if (index < 11) index +=1
			else index += 5
	
    		var mytrain = train.slice(0, index)

			var mytrainex = JSON.parse(JSON.stringify(mytrain))
    		var mytestex = JSON.parse(JSON.stringify(test))

			console.vlog("DEBUG: worker "+process["pid"]+": index=" + index +
				" train_dialogue="+mytrain.length+" train_turns="+mytrainex.length+
				" test_dialogue="+test.length +" test_turns="+mytestex.length+
				" classifier="+classifier+ " fold="+fold)
			

				switch(classifier) {
    				case "NLU_Tran_Google": callbacks(null, bars.gettrans(mytrainex, "G:.*:G"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Microsoft": callbacks(null, bars.gettrans(mytrainex, "M:.*:M"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Yandex": callbacks(null, bars.gettrans(mytrainex, "Y:.*:Y"), mytestex, mytrainex.length); break;
    				
    				case "NLU_Tran_Yandex_Google": callbacks(null, bars.gettrans(mytrainex, "Y:.*:G"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Yandex_Microsoft": callbacks(null, bars.gettrans(mytrainex, "Y:.*:M"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Microsoft_Yandex": callbacks(null, bars.gettrans(mytrainex, "M:.*:Y"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Microsoft_Google": callbacks(null, bars.gettrans(mytrainex, "M:.*:G"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Google_Yandex": callbacks(null, bars.gettrans(mytrainex, "G:.*:Y"), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Google_Microsoft": callbacks(null, bars.gettrans(mytrainex, "G:.*:M"), mytestex, mytrainex.length); break;

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
    				case "NLU_Tran_Finish": 


    				// callbacks(null, bars.gettrans(mytrainex, ".*:fi:.*"), mytestex, mytrainex.length); 
    				_.each(mytrainex, function(turn, key, list){
    					mytrainex[key]["input"]["trans"] = {}
    				}, this)

					mytrainex = mytrainex.concat(JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/seeds_adv.json")))    		
    					callbacks(null, bars.gettrans(mytrainex, ".*:fi:.*"), mytestex, mytrainex.length); 
					

    				break;
    				case "NLU_Tran_Hungarian": callbacks(null, bars.gettrans(mytrainex, ".*:hu:.*"), mytestex, mytrainex.length); break;	
    				case "NLU_Tran_Finish_Arabic:": callbacks(null, bars.gettrans(mytrainex, ".*:(ar|fi):.*"), mytestex, mytrainex.length); break;	
    				case "NLU_Tran_Yandex_Microsoft_Finish": callbacks(null, bars.gettrans(mytrainex, "Y:fi:M"), mytestex, mytrainex.length); break;	
    				case "NLU_Tran_All": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;	
    				
					case "NLU_Bal": callbacks(null, bars.gettransdist(mytrainex), mytestex, mytrainex.length); break;
    				case "NLU_Oversample": callbacks(null, bars.oversample(mytrainex), mytestex, mytrainex.length); break;
    				case "NLU_Tran_Oversample": callbacks(null, bars.tranoversam(mytrainex), mytestex, mytrainex.length); break;

    				default:
						mytrainex = mytrainex.concat(JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/seeds_adv.json")))    		
        				callbacks(null, mytrainex, mytestex, mytrainex.length)
        		}

    		},
    		function(mytrainex, mytestex, trainsize, callback) {
    	
			console.vlog("DEBUG: worker SIZES: mytrainex: "+mytrainex.length+" mytestex: "+mytestex.length)

    			trainAndTest.trainAndTest_async(classifiers[classifier], bars.copyobj(mytrainex), bars.copyobj(mytestex), function(err, stats){

				console.vlog("DEBUG: worker "+process["pid"]+": traintime="+
					stats['traintime']/1000 + " testtime="+ 
					stats['testtime']/1000 + " classifier="+classifier + 
					" Accuracy="+stats['stats']['Accuracy']+ " fold="+fold)

				var stats1 = {}
				_.each(stats['stats'], function(value, key, list){ 
				   		if ((key.indexOf("Precision") != -1) || (key.indexOf("Recall") != -1 ) || (key.indexOf("F1") != -1) || (key.indexOf("Accuracy") != -1))
				   			stats1[key] = value
				}, this)

				console.vlog("STATS: data.length: "+stats["data"].length+" fold:"+fold+" trainsize:"+mytrainex.length+" classifier:"+classifier+" "+JSON.stringify(stats1, null, 4))

				var results = {
					'classifier': classifier,
					'fold': fold,
					'trainsize': trainsize,
					'trainsizeuttr': trainsize,
					'stats': stats1
					//'data': stats.data		
				}

				process.send(JSON.stringify(results))
				callbackwhilst()
			 	})
		    			
    		}], function (err, result) {
   
		})},
    function (err) {
			console.log("DEBUG: worker "+process["pid"]+": exiting")
			process.exit()
		})
	});



if (cluster.isMaster)
{
	var stat = {}

	fs.writeFileSync(statusfile, "")
	fs.writeFileSync(plotfile, "")
	bars.cleanFolder(__dirname + "/learning_curves")
    bars.cleanFolder("/tmp/logs")

	var folds = 20
	var classifiers = [ 'NLU_Baseline', 'NLU_Tran_Finish' ]

	var data1 = (JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed_finalized.json")))
 	var utterset1 = bars.getsetcontext(data1, true)
	var train1 = utterset1["train"].concat(utterset1["test"])

	cluster.setupMaster({
  	exec: __filename,
	// args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
	// silent: false
	});
	
	console.mlog("DEBUGMASTER")

	_.each(classifiers, function(classifier, key, list){ 
		_(folds).times(function(fold){
		
			// worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len, 'datafile': datafile, 'thread': thr})
			var worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier})
			
			var data = partitions.partitions_consistent_by_fold(train1, folds, fold)

			console.mlog("DEBUGMASTER: class: "+classifier+" fold:"+ fold + " train size:"+data.train.length + " test size:" + data.test.length)
			//console.vlog(JSON.stringify(worker, bars.censor(worker), 4))
			console.mlog("DEBUGMASTER: process.pid:"+worker.process.pid)

			worker.send({ 		
					'train': JSON.stringify(data.test), 
					'test': JSON.stringify(data.train)
		     		})
			
			worker.on('disconnect', function(){
			  	console.mlog("DEBUGMASTER: finished: workers.length: "+Object.keys(cluster.workers).length + " disc: "+disc)
				disc += 1
			  	//if (Object.keys(cluster.workers).length == 1)
			  	{
			  		_.each(stat, function(data, param, list){
						lc.plotlc('average', param, stat)
					})
					console.mlog(JSON.stringify(stat, null, 4))
			  	}
			})

			worker.on('message', function(message){
				var workerstats = JSON.parse(message)
				workerstats['classifiers'] = classifiers
				console.mlog("DEBUGMASTER: on message: "+message)
				// fs.appendFileSync(statusfile, JSON.stringify(workerstats, null, 4))
				lc.extractGlobal(workerstats, stat)
			})
		})
	}, this)
}