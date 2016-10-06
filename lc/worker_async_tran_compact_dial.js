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

	
	_.each(test, function(turn, key, list){
		//delete test[key]["input"]["sentences"]
		delete test[key]["input"]["trans"]
	}, this)

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

			var mytrainex = JSON.parse(JSON.stringify(mytrain))
    		var mytestex = JSON.parse(JSON.stringify(test))

			var mytestex  = bars.processdataset(_.flatten(mytestex), {"intents": true, "filterIntent":["Quit", "Greet"], "filter":false})
    		//var test  = bars.processdataset(_.flatten(test), {"intents": true, "filterIntent":[], "filter":false})
	    	var mytrainex  = bars.processdataset(_.flatten(mytrainex), {"intents": true, "filterIntent":["Quit", "Greet"], "filter":true})
    		//var train  = bars.processdataset(_.flatten(train), {"intents": true, "filterIntent":[], "filter":true})

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
    			case "Russian": callbacks(null, bars.gettrans(mytrainex, "(G|Y|M):ru:(G|Y|M)"), mytestex, mytrainex.length); break;
    			case "Portuguese": callbacks(null, bars.gettrans(mytrainex, "(G|Y|M):pt:(G|Y|M)"), mytestex, mytrainex.length); break;
    			case "Hebrew": callbacks(null, bars.gettrans(mytrainex, "(G|Y|M):he:(G|Y|M)"), mytestex, mytrainex.length); break;
				case "French+German+Potuguese": callbacks(null, bars.gettrans(mytrainex, ".*:(de|fr|pt):.*"), mytestex, mytrainex.length); break;
				case "Russian+Spanish+Arabic": callbacks(null, bars.gettrans(mytrainex, ".*:(ru|es|ar):.*"), mytestex, mytrainex.length); break;
				case "Russian+Hebrew+Arabic": callbacks(null, bars.gettrans(mytrainex, ".*:(ru|he|ar):.*"), mytestex, mytrainex.length); break;
				case "Finish+Hungarian+Hebrew": callbacks(null, bars.gettrans(mytrainex, ".*:(fi|hu|he):.*"), mytestex, mytrainex.length); break;
				case "Finish+Hungarian+Chinese": callbacks(null, bars.gettrans(mytrainex, ".*:(fi|hu|zh):.*"), mytestex, mytrainex.length); break;
				case "Finish+Hungarian+Urdu": callbacks(null, bars.gettrans(mytrainex, ".*:(fi|hu|ur):.*"), mytestex, mytrainex.length); break;
				case "Spanish+Hebrew+Arabic": callbacks(null, bars.gettrans(mytrainex, ".*:(es|he|ar):.*"), mytestex, mytrainex.length); break;
				case "Best": callbacks(null, bars.gettransbest(mytrainex), mytestex, mytrainex.length); break;
				case "All_together": callbacks(null, bars.gettrans(mytrainex, "(G|Y|M):(pt|de|fr|ru|he|ar|fi|zh|hu):(G|Y|M)"), mytestex, mytrainex.length); break;
				case "French+Potuguese": callbacks(null, bars.gettrans(mytrainex, ".*:(fr|pt):.*"), mytestex, mytrainex.length); break;
				case "Finish+Hungarian": callbacks(null, bars.gettrans(mytrainex, ".*:(fi|hu):.*"), mytestex, mytrainex.length); break;
				case "Arabic+Hebrew": callbacks(null, bars.gettrans(mytrainex, ".*:(he|ar):.*"), mytestex, mytrainex.length); break;
				case "_Japanese": callbacks(null, bars.gettrans(mytrainex, "((G:ja:G)|(M:ja:M)|(Y:ja:Y))"), mytestex, mytrainex.length); break;
				case "_Portuguese": callbacks(null, bars.gettrans(mytrainex, "((G:pt:G)|(M:pt:M)|(Y:pt:Y))"), mytestex, mytrainex.length); break;
				case "_French": callbacks(null, bars.gettrans(mytrainex, "((G:fr:G)|(M:fr:M)|(Y:fr:Y))"), mytestex, mytrainex.length); break;
				case "_Hungarian": callbacks(null, bars.gettrans(mytrainex, "((G:hu:G)|(M:hu:M)|(Y:hu:Y))"), mytestex, mytrainex.length); break;
				case "_Polish": callbacks(null, bars.gettrans(mytrainex, "((G:pl:G)|(M:pl:M)|(Y:pl:Y))"), mytestex, mytrainex.length); break;
				case "_Finish": callbacks(null, bars.gettrans(mytrainex, "((G:fi:G)|(M:fi:M)|(Y:fi:Y))"), mytestex, mytrainex.length); break;
				case "_Chinese": callbacks(null, bars.gettrans(mytrainex, "((G:zh:G)|(M:zh:M)|(Y:zh:Y))"), mytestex, mytrainex.length); break;
				case "_Russian": callbacks(null, bars.gettrans(mytrainex, "((G:ru:G)|(M:ru:M)|(Y:ru:Y))"), mytestex, mytrainex.length); break;
				//case "_All_together": callbacks(null, bars.gettrans(mytrainex, "((G:.*:G)|(M:.*:M)|(Y:.*:Y))"), mytestex, mytrainex.length); break;
				case "_All_together": callbacks(null, bars.gettrans(mytrainex, "((G:(pt|fr|ge|nl|ar|he):G)|(M:(pt|fr|ge|nl|ar|he):M)|(Y:(pt|fr|ge|nl|ar|he):Y))"), mytestex, mytrainex.length); break;
				case "_Uralic": callbacks(null, bars.gettrans(mytrainex, "((G:(hu|fi):G)|(M:(hu|fi):M)|(Y:(hu|fi):Y))"), mytestex, mytrainex.length); break;
				case "_Hungarian+_Japanese": callbacks(null, bars.gettrans(mytrainex, "((G:hu:G)|(M:hu:M)|(Y:hu:Y)|(G:ja:G)|(M:ja:M)|(Y:ja:Y))"), mytestex, mytrainex.length); break;
				case "_Hungarian+_Japanese+_Chinese": callbacks(null, bars.gettrans(mytrainex, "((G:hu:G)|(M:hu:M)|(Y:hu:Y)|(G:ja:G)|(M:ja:M)|(Y:ja:Y)|(G:zh:G)|(M:zh:M)|(Y:zh:Y))"), mytestex, mytrainex.length); break;

				case "_Hungarian+_Japanese+_Finish": callbacks(null, bars.gettrans(mytrainex, "((G:hu:G)|(M:hu:M)|(Y:hu:Y)|(G:ja:G)|(M:ja:M)|(Y:ja:Y)|(G:fi:G)|(M:fi:M)|(Y:fi:Y))"), mytestex, mytrainex.length); break;

				case "_Asia+_Uralic": callbacks(null, bars.gettrans(mytrainex, "((G:(hu|ja|zh|fi):G)|(M:(huja|zh|fi):M)|(Y:(hu|ja|zh|fi):Y))"), mytestex, mytrainex.length); break;

				case "_Slavic": callbacks(null, bars.gettrans(mytrainex, "((G:ru:G)|(M:ru:M)|(Y:ru:Y)|(G:pl:G)|(M:pl:M)|(Y:pl:Y))"), mytestex, mytrainex.length); break;
				case "_Asia": callbacks(null, bars.gettrans(mytrainex, "((G:zh:G)|(M:zh:M)|(Y:zh:Y)|(G:ja:G)|(M:ja:M)|(Y:ja:Y))"), mytestex, mytrainex.length); break;
				case "_Semitic": callbacks(null, bars.gettrans(mytrainex, "((G:(he|ar):G)|(M:(he|ar):M)|(Y:(he|ar):Y))"), mytestex, mytrainex.length); break;
				case "_Germanic": callbacks(null, bars.gettrans(mytrainex, "((G:(de|nl):G)|(M:(de|nl):M)|(Y:(de|nl):Y))"), mytestex, mytrainex.length); break;
				case "_Romanic": callbacks(null, bars.gettrans(mytrainex, "((G:(fr|pt):G)|(M:(fr|pt):M)|(Y:(fr|pt):Y))"), mytestex, mytrainex.length); break;					

 
   				default:

					throw new Error("no classifier")				
       		}

    		},
    		function(mytrainex, mytestex, trainsize, callback) {

			mytrainex =  bars.processdataset(mytrainex, {"intents": true, "filterIntent": ["Quit", "Greet"], "filter":true})
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
	
	var classifiers = [ "Natural_Neg", "_Portuguese", "_All_together", "_French", "_Hungarian"]

	cluster.setupMaster({
  	exec: __filename,
	// args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
	// silent: false
	});
	
	async.timesSeries(1, function(n, next){


		var data1 = (JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed_finalized_fin_full_biased_no_ur.json")))
       	data1 = bars.enrichparse(data1)
        var utterset1 = bars.getsetcontext(data1, false)
        //var train1 = utterset1["train"].concat(utterset1["test"]).concat(utterset1["biased"])
        var train1 = utterset1["train"].concat(utterset1["test"])
		train1 = _.shuffle(train1)        

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
