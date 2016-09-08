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
var lcfolder = __dirname + "/learning_curves_trans/"

console.vlog = function(data) { fs.appendFileSync("./logs/" + process.pid, data + '\n', 'utf8') };
console.mlog = function(data) { fs.appendFileSync("./logs/master", data + '\n', 'utf8') };

if (cluster.isWorker)
	process.on('message', function(message) {

    	console.vlog('DEBUG: worker ' + process.pid + ' received message from master.')
	
	//var train = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/seeds_adv.json")).concat(JSON.parse(message['train']))
	var train = JSON.parse(message['train'])
	var test  = JSON.parse(message['test'])

	//var train = _.flatten(train)
        var test  = bars.processdataset(_.flatten(test), {"intents": true, "filterIntent":["Quit","Greet"], "filter":false})
     //   var test  = bars.processdataset(_.flatten(test), {"intents": true, "filterIntent":[], "filter":false})
        var train  = bars.processdataset(_.flatten(train), {"intents": true, "filterIntent":["Quit","Greet"], "filter":true})
       // var train  = bars.processdataset(_.flatten(train), {"intents": true, "filterIntent":[], "filter":true})

    //    _.each(train, function(turn, key, list){ delete train[key]["input"]["sentences"]}, this)

//	 _.each(train, function(turn, key, list){ train[key]["input"]["trans"] = {} }, this)
  //      train = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/seeds_adv.json")).concat(train)

	_.each(test, function(turn, key, list){
		//delete test[key]["input"]["sentences"]
		delete test[key]["input"]["trans"]
	}, this)

	console.vlog("DEBUG: worker "+process.pid+" : train.length="+train.length + " test.length="+test.length)

	var index = 0

	async.whilst(
	    //function () { return index < train.length },
	    function () { return index < 70 },
	    function (callbackwhilst) {

		async.waterfall([
    		function(callbacks) {

        		//if (index == 0) index = 3
			//if (index < 10) index +=5
			//else index += 5
			index += 5
	
    		var mytrain = train.slice(0, index)
		var mytrainex = JSON.parse(JSON.stringify(mytrain))
    		var mytestex = JSON.parse(JSON.stringify(test))


			console.vlog("DEBUG: worker "+process["pid"]+": index=" + index +
				" train_dialogue="+mytrain.length+" train_turns="+_.flatten(mytrainex).length+
				" test_dialogue="+test.length +" test_turns="+mytestex.length+
				" classifier="+classifier+ " fold="+fold)
			
				switch(classifier) {
    				
				case "Natural_Neg":  callbacks(null, mytrainex, mytestex, mytrainex.length); break;
				case "Emb_25": case "Emb_50": case "Emb_100": case "Emb_200": case "Emb_300":  callbacks(null, mytrainex, mytestex, mytrainex.length); break;
				case "MY": callbacks(null, bars.gettrans(mytrainex, "M:.*:Y"), mytestex, mytrainex.length); break;
				case "YM": callbacks(null, bars.gettrans(mytrainex, "Y:.*:M"), mytestex, mytrainex.length); break;
				case "GM": callbacks(null, bars.gettrans(mytrainex, "G:.*:M"), mytestex, mytrainex.length); break;
				case "MG": callbacks(null, bars.gettrans(mytrainex, "M:.*:G"), mytestex, mytrainex.length); break;
				case "YG": callbacks(null, bars.gettrans(mytrainex, "Y:.*:G"), mytestex, mytrainex.length); break;
				case "GY": callbacks(null, bars.gettrans(mytrainex, "G:.*:Y"), mytestex, mytrainex.length); break;
				case "GG": callbacks(null, bars.gettrans(mytrainex, "G:.*:G"), mytestex, mytrainex.length); break;
				case "YY": callbacks(null, bars.gettrans(mytrainex, "Y:.*:Y"), mytestex, mytrainex.length); break;
				case "MM": callbacks(null, bars.gettrans(mytrainex, "M:.*:M"), mytestex, mytrainex.length); break;
    				
				case "hu_GG": callbacks(null, bars.gettrans(mytrainex, "G:hu:G"), mytestex, mytrainex.length); break;
				case "hu_MY": callbacks(null, bars.gettrans(mytrainex, "M:hu:Y"), mytestex, mytrainex.length); break;
				case "hu_YG": callbacks(null, bars.gettrans(mytrainex, "Y:hu:G"), mytestex, mytrainex.length); break;
				case "hu_YY": callbacks(null, bars.gettrans(mytrainex, "Y:hu:Y"), mytestex, mytrainex.length); break;
 
    				case "Emb_100_German": callbacks(null, bars.gettrans(mytrainex, ".*:de:.*"), mytestex, mytrainex.length); break;
				case "Emb_100_Hungarian": callbacks(null, bars.gettrans(mytrainex, ".*:hu:.*"), mytestex, mytrainex.length);break;
	    			case "Emb_100_All": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length);break;

				case "Finish+Hungarian": callbacks(null, bars.gettrans(mytrainex, ".*:(fi|hu):.*"), mytestex, mytrainex.length); break;
				case "Urdu": callbacks(null, bars.gettrans(mytrainex, ".*:ur:.*"), mytestex, mytrainex.length); break;
				case "French": callbacks(null, bars.gettrans(mytrainex, ".*:fr:.*"), mytestex, mytrainex.length); break;
    				case "German": callbacks(null, bars.gettrans(mytrainex, ".*:de:.*"), mytestex, mytrainex.length); break;
    				case "Spanish": callbacks(null, bars.gettrans(mytrainex, ".*:es:.*"), mytestex, mytrainex.length); break;
    				case "Arabic": callbacks(null, bars.gettrans(mytrainex, ".*:ar:.*"), mytestex, mytrainex.length); break;
    				case "Chinese": callbacks(null, bars.gettrans(mytrainex, ".*:zh:.*"), mytestex, mytrainex.length); break;
    				case "Finish": callbacks(null, bars.gettrans(mytrainex, ".*:fi:.*"), mytestex, mytrainex.length); break;
    				case "Russian": callbacks(null, bars.gettrans(mytrainex, ".*:ru:.*"), mytestex, mytrainex.length); break;
    				case "Portuguese": callbacks(null, bars.gettrans(mytrainex, ".*:pt:.*"), mytestex, mytrainex.length); break;
    				case "Hebrew": callbacks(null, bars.gettrans(mytrainex, ".*:he:.*"), mytestex, mytrainex.length); break;
    				case "Hungarian": callbacks(null, bars.gettrans(mytrainex, ".*:hu:.*"), mytestex, mytrainex.length);break;
				case "French+German+Potuguese": callbacks(null, bars.gettrans(mytrainex, ".*:(de|fr|pt):.*"), mytestex, mytrainex.length); break;
				case "Russian+Spanish+Arabic": callbacks(null, bars.gettrans(mytrainex, ".*:(ru|es|ar):.*"), mytestex, mytrainex.length); break;
				case "Russian+Hebrew+Arabic": callbacks(null, bars.gettrans(mytrainex, ".*:(ru|he|ar):.*"), mytestex, mytrainex.length); break;
				case "Finish+Hungarian+Hebrew": callbacks(null, bars.gettrans(mytrainex, ".*:(fi|hu|he):.*"), mytestex, mytrainex.length); break;
				case "Finish+Hungarian+Chinese": callbacks(null, bars.gettrans(mytrainex, ".*:(fi|hu|zh):.*"), mytestex, mytrainex.length); break;
				case "Finish+Hungarian+Urdu": callbacks(null, bars.gettrans(mytrainex, ".*:(fi|hu|ur):.*"), mytestex, mytrainex.length); break;
				case "Spanish+Hebrew+Arabic": callbacks(null, bars.gettrans(mytrainex, ".*:(es|he|ar):.*"), mytestex, mytrainex.length); break;

//				case "Natural_trans": 
//
//					console.vlog("NLU_trans")
  //  				callbacks(null, bars.gettrans(mytrainex, ".*:fi:.*"), mytestex, mytrainex.length); 
    				//_.each(mytrainex, function(turn, key, list){
    				//	mytrainex[key]["input"]["trans"] = {}
    				//}, this)
//
//					mytrainex = mytrainex.concat(JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/seeds_adv.json")))    		
  //  					callbacks(null, bars.gettrans(mytrainex, ".*:fi:.*"), mytestex, mytrainex.length); 
					

    				break;
    				case "Google_Hungarian": callbacks(null, bars.gettrans(mytrainex, "G:hu:G"), mytestex, mytrainex.length); break;	
    				case "NLU_Tran_Finish_Arabic:": callbacks(null, bars.gettrans(mytrainex, ".*:(ar|fi):.*"), mytestex, mytrainex.length); break;	
    				case "huzh": callbacks(null, bars.gettrans(mytrainex, ".*:(hu|zh):.*"), mytestex, mytrainex.length); break;	
    				case "huzhur": callbacks(null, bars.gettrans(mytrainex, ".*:(hu|zh|ur):.*"), mytestex, mytrainex.length); break;	
    	//			case "NLU_Tran_Yandex_Microsoft_Finish": callbacks(null, bars.gettrans(mytrainex, "Y:fi:M"), mytestex, mytrainex.length); break;	
    				case "NLU_Tran_All": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;	
    	//			case "Root_Trans": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;	
    	//			case "Root_Trans_Emb": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;	
	
	//			case "NLU_Bal": callbacks(null, bars.gettransdist(mytrainex), mytestex, mytrainex.length); break;
    	//			case "NLU_Oversample": callbacks(null, bars.oversample(mytrainex), mytestex, mytrainex.length); break;
    	//			case "NLU_Tran_Oversample": callbacks(null, bars.tranoversam(mytrainex), mytestex, mytrainex.length); break;

	//			case "NLU_Emb_Trans_Sum_100": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;
	//			case "NLU_Emb_Trans_Sum_50": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;
	//			//case "NLU_Emb_Trans_Ext_100": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;

    				default:

					throw new Error("no classifier")				
			//mytrainex = mytrainex.concat(JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/seeds_adv.json")))    		
        			//	callbacks(null, mytrainex, mytestex, mytrainex.length)
        		}

    		},
    		function(mytrainex, mytestex, trainsize, callback) {

			mytrainex =  bars.processdataset(mytrainex, {"intents": true, "filterIntent": ["Quit","Greet"], "filter":true})
			//mytrainex =  bars.processdataset(mytrainex, {"intents": true, "filterIntent": [], "filter":true})
    	
			console.vlog("DEBUGPRETRAIN: classifier:"+classifier+" mytrainex: "+mytrainex.length+" mytestex: "+mytestex.length+ " reportedtrainsize:"+trainsize)

			var baseline_cl = classifiers.Natural_Neg
			
			// if (classifier.indexOf("Root")!=-1) baseline_cl = classifiers.Natural_Root
			if (classifier.indexOf("Emb")!=-1)  baseline_cl = classifiers[classifier]

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

	bars.cleanFolder(lcfolder)
	bars.cleanFolder("./logs")

	var folds = 10
	
	//var classifiers = [ "Natural_Neg", "Emb_100", "Emb_50", "NLU_Tran_All"]
	//var classifiers = [ "Natural_Neg", "Emb_25", "Emb_50", "Emb_100", "Emb_200", "Emb_300"]
//	var classifiers = [ "Natural_Neg", "YY", "MM", "GG", "YG", "GY", "YM", "MY", "GM", "MG"]
	//var classifiers = [ "Natural_Neg", "Russian", "Hebrew", "Hungarian", "NLU_Tran_All", "Portuguese", "Chinese", "Finish", "Urdu", "Finish+Hungarian", "Spanish", "Arabic"]
	//var classifiers = [ "Natural_Neg", "NLU_Tran_All", "French+German+Potuguese", "Russian+Spanish+Arabic", "Finish+Hungarian+Hebrew", "Urdu+Chinese+Hungarian"]
	var classifiers = [ "Natural_Neg", "NLU_Tran_All", "French+German+Potuguese", "Russian+Hebrew+Arabic", "Finish+Hungarian+Chinese", "Spanish+Hebrew+Arabic", "Finish+Hungarian+Urdu", "Hungarian", "Finish"]
	//var classifiers = [ "Natural_Neg", "NLU_Tran_All", "Finish+Hungarian+Chinese", "Finish", "Hungarian", "Chinese"]
	// var classifiers = [ "Natural_Neg", "NLU_Tran_All", "hu_GG", "hu_MY", "hu_YG", "hu_YY", "Hungarian"]
	///var classifiers = [ "Natural_Neg", "NLU_Tran_All", "Hungarian", "huzh", "huzhur"]
	//var classifiers = [ "Natural","NLU_Tran_GGFinish"]
	//var classifiers = [ "Natural_Neg", "NLU_Tran_All", "Emb_100", "Hungarian", "Emb_100_Hungarian", "Emb_100_All"]
		
	var data1 = (JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed_finalized.json")))
 	var utterset1 = bars.getsetcontext(data1, false)
	var train1 = utterset1["train"].concat(utterset1["test"])

	cluster.setupMaster({
  	exec: __filename,
	// args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
	// silent: false
	});
	
	console.mlog("DEBUGMASTER: loaded: "+train1.length)

	_(folds).times(function(fold){

		var data = partitions.partitions_consistent_by_fold(train1, folds, fold)

		_.each(classifiers, function(classifier, key, list){ 
		
			// worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len, 'datafile': datafile, 'thread': thr})
			var worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier})
			
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
		}, this)
	}, this)
}
