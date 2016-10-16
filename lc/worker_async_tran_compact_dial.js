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
var lcfolder = __dirname + "/learning_curves_trans_dial/"

console.vlog = function(data) { fs.appendFileSync("./logs/" + process.pid, data + '\n', 'utf8') };
console.mlog = function(data) { fs.appendFileSync("./logs/master", data + '\n', 'utf8') };

if (cluster.isWorker)
	process.on('message', function(message) {

    	console.vlog('DEBUG: worker ' + process.pid + ' received message from master.')
	
	//var train = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/seeds_adv.json")).concat(JSON.parse(message['train']))
	var train = JSON.parse(message['train'])
	var test  = JSON.parse(message['test'])

	console.vlog("DEBUG: worker "+process.pid+" : train.length="+train.length + " test.length="+test.length)

	var index = 1

	async.whilst(
	    function () { return index <= train.length },
	    //function () { return index < 150 },
	    function (callbackwhilst) {

		async.waterfall([
    		function(callbacks) {

        		//if (index == 0) index = 3
			//if (index < 10) index +=5
			//else index += 5
	
    		var mytrain = train.slice(0, index)
		index += 1

		var mytrainex = _.flatten(JSON.parse(JSON.stringify(mytrain)))
    		var mytestex = _.flatten(JSON.parse(JSON.stringify(test)))

		//var mytestex  = bars.processdataset(mytestex, {"intents": true, "filterIntent":["Quit", "Greet"], "filter":false})
    		var mytestex = bars.processdataset(mytestex, {"intents": true, "filterIntent":[], "filter":false})
	    	//var mytrainex  = bars.processdataset(mytrainex, {"intents": true, "filterIntent":["Quit", "Greet"], "filter":false})
    		var mytrainex  = bars.processdataset(mytrainex, {"intents": true, "filterIntent":[], "filter":true})

			console.vlog("DEBUG: worker "+process["pid"]+": index=" + index +
				" train_dialogue="+mytrain.length+" train_turns="+_.flatten(mytrainex).length+
				" test_dialogue="+test.length +" test_turns="+mytestex.length+
				" classifier="+classifier+ " fold="+fold)
			
				switch(classifier) {
    				
				case "Natural_Neg":  callbacks(null, mytrainex, mytestex, mytrain.length); break;
				case "Emb_25": case "Emb_50": case "Emb_100": case "Emb_200": case "Emb_300":  callbacks(null, mytrain, mytestex, mytrainex.length); break;
    				case "Finish": callbacks(null, bars.gettrans(mytrainex, ".*:fi:.*"), mytestex, mytrain.length); break;	
    				case "Uralic": callbacks(null, bars.gettrans(mytrainex, ".*:(fi|hu):.*"), mytestex, mytrain.length); break;
				case "German": callbacks(null, bars.gettrans(mytrainex, ".*:de:.*"), mytestex, mytrain.length); break;
    				case "Spanish": callbacks(null, bars.gettrans(mytrainex, ".*:es:.*"), mytestex, mytrain.length); break;
    				case "Hungarian": callbacks(null, bars.gettrans(mytrainex, ".*:hu:.*"), mytestex, mytrain.length); break;
    				case "Hebrew": callbacks(null, bars.gettrans(mytrainex, ".*:he:.*"), mytestex, mytrain.length); break;
    				case "Russian": callbacks(null, bars.gettrans(mytrainex, ".*:ru:.*"), mytestex, mytrain.length); break;
    				case "Arabic": callbacks(null, bars.gettrans(mytrainex, ".*:ar:.*"), mytestex, mytrain.length); break;
    				case "Chinese": callbacks(null, bars.gettrans(mytrainex, ".*:zh:.*"), mytestex, mytrain.length); break;
    				case "Finish": callbacks(null, bars.gettrans(mytrainex, ".*:fi:.*"), mytestex, mytrain.length); break;
    				case "French": callbacks(null, bars.gettrans(mytrainex, ".*:fr:.*"), mytestex, mytrain.length); break;
    				case "Portuguese": callbacks(null, bars.gettrans(mytrainex, ".*:pt:.*"), mytestex, mytrain.length); break;
				//case "All_together": callbacks(null, bars.gettrans(mytrainex, "(G|Y|M):(pt|de|fr|ru|he|ar|fi|zh|hu):(G|Y|M)"), mytestex, mytrain.length); break;
				case "Hungarian+Russian": callbacks(null, bars.gettrans(mytrainex, ".*:(ru|hu):.*"), mytestex, mytrain.length); break;
				
				case "_Japanese": callbacks(null, bars.gettrans(mytrainex, "((G:ja:G)|(M:ja:M)|(Y:ja:Y))"), mytestex, mytrain.length); break;
				case "_Portuguese": callbacks(null, bars.gettrans(mytrainex, "((G:pt:G)|(M:pt:M)|(Y:pt:Y))"), mytestex, mytrain.length); break;
				case "_French": callbacks(null, bars.gettrans(mytrainex, "((G:fr:G)|(M:fr:M)|(Y:fr:Y))"), mytestex, mytrain.length); break;
				case "_Hungarian": callbacks(null, bars.gettrans(mytrainex, "((G:hu:G)|(M:hu:M)|(Y:hu:Y))"), mytestex, mytrain.length); break;
				case "_Polish": callbacks(null, bars.gettrans(mytrainex, "((G:pl:G)|(M:pl:M)|(Y:pl:Y))"), mytestex, mytrain.length); break;
				case "_Finish": callbacks(null, bars.gettrans(mytrainex, "((G:fi:G)|(M:fi:M)|(Y:fi:Y))"), mytestex, mytrain.length); break;
				case "_Chinese": callbacks(null, bars.gettrans(mytrainex, "((G:zh:G)|(M:zh:M)|(Y:zh:Y))"), mytestex, mytrain.length); break;
				case "_Russian": callbacks(null, bars.gettrans(mytrainex, "((G:ru:G)|(M:ru:M)|(Y:ru:Y))"), mytestex, mytrain.length); break;
				//case "_All_together": callbacks(null, bars.gettrans(mytrainex, "((G:.*:G)|(M:.*:M)|(Y:.*:Y))"), mytestex, mytrainex.length); break;
				case "_All_together": callbacks(null, bars.gettrans(mytrainex, "((G:(pt|fr|de|ru|ar|he|hu):G)|(M:(pt|fr|de|ru|ar|he|hu):M)|(Y:(pt|fr|de|ru|ar|he|hu):Y))"), mytestex, mytrain.length); break;
				case "All_together": callbacks(null, bars.gettrans(mytrainex, ".*:(pt|fr|de|ru|ar|he|hu|fi):.*"), mytestex, mytrain.length); break;
 
   				default:

					throw new Error("no classifier: "+classifier)				
       		}

    		},
    		function(mytrainex, mytestex, trainsize, callback) {

			//mytrainex =  bars.processdataset(mytrainex, {"intents": true, "filterIntent": ["Quit", "Greet"], "filter":false})
			//mytrainex =  bars.processdataset(mytrainex, {"intents": true, "filterIntent": [], "filter":true})
    	
			console.vlog("DEBUGPRETRAIN: classifier:"+classifier+" mytrainex: "+mytrainex.length+" mytestex: "+mytestex.length+ " reportedtrainsize:"+trainsize)

			var baseline_cl = classifiers.Natural_Neg
			
			// if (classifier.indexOf("Root")!=-1) baseline_cl = classifiers.Natural_Root
	//		if (classifier.indexOf("Emb")!=-1)  baseline_cl = classifiers[classifier]

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
	
	var classifiers = [ "Hungarian+Russian", "_Hungarian", "Natural_Neg", "Portuguese", "Russian", "French", "Hebrew", "Hungarian", "All_together", "Arabic", "German", "Finish", "Uralic", "_All_together"]
	//var classifiers = [ "Natural_Neg", "_Portuguese", "_All_together", "_French", "_Hungarian", "_Japanese", "Hungarian", "All_together"]
	//var classifiers = [ "_Portuguese", "_All_together", "_French", "_Hungarian"]

	cluster.setupMaster({
  	exec: __filename,
	// args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
	// silent: false
	});
	
	async.timesSeries(1, function(n, next){


		var data1 = (JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed_finalized_fin_full_biased_no_ur_dial.json")))
       	data1 = bars.enrichparse(data1)
        var utterset1 = bars.getsetcontext(data1, false)
        //var train1 = utterset1["train"].concat(utterset1["test"]).concat(utterset1["biased"])
        var train1 = utterset1["train"].concat(utterset1["test"])
//		train1 = _.shuffle(train1)        

		console.mlog("DEBUGMASTER: loaded: "+train1.length)
		console.log("Assurance fold: "+n+" set: "+train1.length)

	_(folds).times(function(fold){

		var data = partitions.partitions_consistent_by_fold(train1, folds, fold)

		_.each(classifiers, function(classifier, key, list){ 
		
			// worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len, 'datafile': datafile, 'thread': thr})
			var worker = cluster.fork({'fold': fold+n*folds, 'classifier':classifier})
			
			console.mlog("DEBUGMASTER: class: "+classifier+" fold:"+ (fold+n*folds) + " train size:"+data.train.length + " test size:" + data.test.length)
			console.mlog("DEBUGMASTER: process.pid:"+worker.process.pid)

			worker.send({ 		
					'train': JSON.stringify(data.test), 
					'test': JSON.stringify(data.train)
		     		})
			
			worker.on('disconnect', function(){
			  	console.mlog("DEBUGMASTER: finished: workers.length: "+Object.keys(cluster.workers).length )
                                if (Object.keys(cluster.workers).length == 1)
                                  next()
				//disc += 1
			  	//if (Object.keys(cluster.workers).length == 1)
	//		  	_.each(stat, function(data, param, list){
	//				lc.plotlc('average', param, stat, lcfolder)
	//			})
	//			console.mlog(JSON.stringify(stat, null, 4))
			})

			worker.on('message', function(message){
				var workerstats = JSON.parse(message)
				workerstats['classifiers'] = classifiers
				console.mlog("DEBUGMASTER: on message: "+message)
				lc.extractGlobal(workerstats, stat)
			})
		}, this)
	}, this)
	}, function(){
                _.each(stat, function(data, param, list){
                        lc.plotlc('average', param, stat, lcfolder)
                })

        })
}
