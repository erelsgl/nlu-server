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
	
	var train = _.flatten(JSON.parse(message['train']))
	var test = _.flatten(JSON.parse(message['test']))

	// var test  = bars.processdataset(_.flatten(test), {"intents": true, "filterIntent":["Quit", "Greet"], "filter":false})
	// var test  = bars.processdataset(_.flatten(test), {"intents": true, "filterIntent":[], "filter":false})
	// var train  = bars.processdataset(_.flatten(train), {"intents": true, "filterIntent":["Quit", "Greet"], "filter":true})
	// var train  = bars.processdataset(_.flatten(train), {"intents": true, "filterIntent":[], "filter":true}) 

	console.vlog("DEBUG: worker "+process.pid+" : train.length="+train.length + " test.length="+test.length)

	var index = 10

	async.whilst(
	    function () { return index <= train.length },
	    //function () { return index < 150 },
	    function (callbackwhilst) {

		async.waterfall([
    		function(callbacks) {
	
    		var mytrain = train.slice(0, index)
			index += 10
		
			var mytrainex = JSON.parse(JSON.stringify(mytrain))
    		var mytestex = JSON.parse(JSON.stringify(test))

			console.vlog("DEBUG: worker "+process["pid"]+": index=" + index +
				" train_dialogue="+mytrain.length+" train_turns="+_.flatten(mytrainex).length+
				" test_dialogue="+test.length +" test_turns="+mytestex.length+
				" classifier="+classifier+ " fold="+fold)
			
				switch(classifier) {
    				
				case "Natural_Neg":  callbacks(null, mytrainex, mytestex, mytrainex.length); break;
				case "Emb_25": case "Emb_50": case "Emb_100": case "Emb_200": case "Emb_300":  callbacks(null, mytrainex, mytestex, mytrainex.length); break;
				case "MY": callbacks(null, bars.gettrans(mytrainex, "M:(pt|fr|de|ru|ar|he|hu|fi|zh):Y"), mytestex, mytrainex.length); break;
				case "YM": callbacks(null, bars.gettrans(mytrainex, "Y:(pt|fr|de|ru|ar|he|hu|fi|zh):M"), mytestex, mytrainex.length); break;
				case "GM": callbacks(null, bars.gettrans(mytrainex, "G:(pt|fr|de|ru|ar|he|hu|fi|zh):M"), mytestex, mytrainex.length); break;
				case "MG": callbacks(null, bars.gettrans(mytrainex, "M:(pt|fr|de|ru|ar|he|hu|fi|zh):G"), mytestex, mytrainex.length); break;
				case "YG": callbacks(null, bars.gettrans(mytrainex, "Y:(pt|fr|de|ru|ar|he|hu|fi|zh):G"), mytestex, mytrainex.length); break;
				case "GY": callbacks(null, bars.gettrans(mytrainex, "G:(pt|fr|de|ru|ar|he|hu|fi|zh):Y"), mytestex, mytrainex.length); break;
				case "GG": callbacks(null, bars.gettrans(mytrainex, "G:(pt|fr|de|ru|ar|he|hu|fi|zh):G"), mytestex, mytrainex.length); break;
				case "YY": callbacks(null, bars.gettrans(mytrainex, "Y:(pt|fr|de|ru|ar|he|hu|fi|zh):Y"), mytestex, mytrainex.length); break;
				case "MM": callbacks(null, bars.gettrans(mytrainex, "M:(pt|fr|de|ru|ar|he|hu|fi|zh):M"), mytestex, mytrainex.length); break;
    				
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
				case "Hungarian": callbacks(null, bars.gettrans(mytrainex, ".*:hu:.*"), mytestex, mytrainex.length); break;
				case "Hungarian1": callbacks(null, bars.gettrans(mytrainex, ".*:hu1:.*"), mytestex, mytrainex.length); break;
				case "Dutch": callbacks(null, bars.gettrans(mytrainex, ".*:nl:.*"), mytestex, mytrainex.length); break;
				case "French+German+Potuguese": callbacks(null, bars.gettrans(mytrainex, ".*:(de|fr|pt):.*"), mytestex, mytrainex.length); break;
				case "Hungarian+Chinese": callbacks(null, bars.gettrans(mytrainex, ".*:(hu|zh):.*"), mytestex, mytrainex.length); break;
				case "Russian+Spanish+Arabic": callbacks(null, bars.gettrans(mytrainex, ".*:(ru|es|ar):.*"), mytestex, mytrainex.length); break;
				case "Russian+Hebrew+Arabic": callbacks(null, bars.gettrans(mytrainex, ".*:(ru|he|ar):.*"), mytestex, mytrainex.length); break;
				case "Finish+Hungarian+Hebrew": callbacks(null, bars.gettrans(mytrainex, ".*:(fi|hu|he):.*"), mytestex, mytrainex.length); break;
				case "Finish+Hungarian+Chinese": callbacks(null, bars.gettrans(mytrainex, ".*:(fi|hu|zh):.*"), mytestex, mytrainex.length); break;
				case "Finish+Hungarian+Urdu": callbacks(null, bars.gettrans(mytrainex, ".*:(fi|hu|ur):.*"), mytestex, mytrainex.length); break;
				case "Spanish+Hebrew+Arabic": callbacks(null, bars.gettrans(mytrainex, ".*:(es|he|ar):.*"), mytestex, mytrainex.length); break;
				case "Best": callbacks(null, bars.gettransbest(mytrainex), mytestex, mytrainex.length); break;
				case "French+Potuguese": callbacks(null, bars.gettrans(mytrainex, ".*:(fr|pt):.*"), mytestex, mytrainex.length); break;
				case "Finish+Hungarian": callbacks(null, bars.gettrans(mytrainex, ".*:(fi|hu):.*"), mytestex, mytrainex.length); break;
				case "Arabic+Hebrew": callbacks(null, bars.gettrans(mytrainex, ".*:(he|ar):.*"), mytestex, mytrainex.length); break;
				case "Japanese": callbacks(null, bars.gettrans(mytrainex, ".*:ja:.*"), mytestex, mytrainex.length); break;
				case "_Japanese": callbacks(null, bars.gettrans(mytrainex, "((G:ja:G)|(M:ja:M)|(Y:ja:Y))"), mytestex, mytrainex.length); break;
				case "_Portuguese": callbacks(null, bars.gettrans(mytrainex, "((G:pt:G)|(M:pt:M)|(Y:pt:Y))"), mytestex, mytrainex.length); break;
				case "_French": callbacks(null, bars.gettrans(mytrainex, "((G:fr:G)|(M:fr:M)|(Y:fr:Y))"), mytestex, mytrainex.length); break;
				case "_Hungarian": callbacks(null, bars.gettrans(mytrainex, "((G:hu:G)|(M:hu:M)|(Y:hu:Y))"), mytestex, mytrainex.length); break;
				case "_Polish": callbacks(null, bars.gettrans(mytrainex, "((G:pl:G)|(M:pl:M)|(Y:pl:Y))"), mytestex, mytrainex.length); break;
				case "_Finish": callbacks(null, bars.gettrans(mytrainex, "((G:fi:G)|(M:fi:M)|(Y:fi:Y))"), mytestex, mytrainex.length); break;
				case "_Chinese": callbacks(null, bars.gettrans(mytrainex, "((G:zh:G)|(M:zh:M)|(Y:zh:Y))"), mytestex, mytrainex.length); break;
				case "_Russian": callbacks(null, bars.gettrans(mytrainex, "((G:ru:G)|(M:ru:M)|(Y:ru:Y))"), mytestex, mytrainex.length); break;
				//case "_All_together": callbacks(null, bars.gettrans(mytrainex, "((G:.*:G)|(M:.*:M)|(Y:.*:Y))"), mytestex, mytrainex.length); break;
				 case "_All_together": callbacks(null, bars.gettrans(mytrainex, "((G:(pt|fr|de|ru|ar|he|hu):G)|(M:(pt|fr|de|ru|ar|he|hu):M)|(Y:(pt|fr|de|ru|ar|he|hu):Y))"), mytestex, mytrain.length); break;
                                case "All_together": callbacks(null, bars.gettrans(mytrainex, ".*:(pt|fr|de|ru|ar|he|hu|fi):.*"), mytestex, mytrain.length); break;
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
				case "Portuguese+Russian+Hungarian": callbacks(null, bars.gettrans(mytrainex, ".*:(pt|ru|hu):.*"), mytestex, mytrainex.length); break;
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
    			case "Natural_Neg_10":
    				var res = mytrainex.concat(mytrainex).concat(mytrainex).concat(mytrainex).concat(mytrainex)
    				res = res.concat(res)
    				console.vlog("Natural_Neg_10 size: "+res.length)
					callbacks(null, _.shuffle(res), mytestex, mytrainex.length); break;	

    			case "Google_Hungarian": callbacks(null, bars.gettrans(mytrainex, "G:hu:G"), mytestex, mytrainex.length); break;	
    			case "NLU_Tran_Finish_Arabic:": callbacks(null, bars.gettrans(mytrainex, ".*:(ar|fi):.*"), mytestex, mytrainex.length); break;	
    			case "huzh": callbacks(null, bars.gettrans(mytrainex, ".*:(hu|zh):.*"), mytestex, mytrainex.length); break;	
    			case "huzhur": callbacks(null, bars.gettrans(mytrainex, ".*:(hu|zh|ur):.*"), mytestex, mytrainex.length); break;	
    	//		case "NLU_Tran_Yandex_Microsoft_Finish": callbacks(null, bars.gettrans(mytrainex, "Y:fi:M"), mytestex, mytrainex.length); break;	
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

			//mytrainex =  bars.processdataset(mytrainex, {"intents": true, "filterIntent": ["Quit", "Greet"], "filter":true})
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
	//var classifiers = ["Natural_Neg", "YY", "MM", "GG"]
	//var classifiers = [ "Natural_Neg", "Russian", "Hebrew", "Hungarian", "NLU_Tran_All", "Portuguese", "Chinese", "Finish", "Urdu", "Finish+Hungarian", "Spanish", "Arabic"]
	//var classifiers = [ "Natural_Neg", "NLU_Tran_All", "French+German+Potuguese", "Russian+Spanish+Arabic", "Finish+Hungarian+Hebrew", "Urdu+Chinese+Hungarian"]
	//var classifiers = [ "Natural_Neg", "NLU_Tran_All", "French+German+Potuguese", "Russian+Hebrew+Arabic", "Finish+Hungarian+Chinese", "Spanish+Hebrew+Arabic", "Finish+Hungarian+Urdu", "Hungarian", "Finish"]
	//var classifiers = [ "Natural_Neg", "NLU_Tran_All", "French+Potuguese",  "Finish+Hungarian", "Arabic+Hebrew", "Hungarian", "Finish", "Portuguese", "Arabic", "Russian"]
	//var classifiers = [ "Natural_Neg", "_Hungarian", "_Portuguese", "_Russian", "_Japanese", "_All_together", "_Hungarian+_Japanese", "_Hungarian+_Japanese+_Chinese", "_Hungarian+_Japanese+_Chinese+_Finish"]
	//var classifiers = [ "Natural_Neg", "_Hungarian", "_Portuguese","_All_together_test"]
	//var classifiers = [ "Natural_Neg", "_Portuguese", "_All_together", "_Romanic", "_Germanic", "_Uralic", "_Semitic"]
	var classifiers = [ "Natural_Neg", "Natural_Neg_10", "Portuguese", "Chinese", "All_together", "Arabic", "Russian",  "Hungarian1" ]
	//var classifiers = [ "Natural_Neg", "Natural_Neg_10", "Portuguese", "All_together", "Russian", "Hungarian", "Finish", "Japanese", "Chinese", "French", "Hungarian+Chinese", "Hebrew", "Arabic", "Emb_100" ]
	//var classifiers = [ "Natural_Neg", "YY", "MM", "GG", "YG", "GY", "YM", "MY", "MG", "GM" ]
	//var classifiers = [ "Natural_Neg", "Hungarian", "Portuguese", "Russian", "All_together"]
	//var classifiers = [ "Natural_Neg", "Hungarian", "Russian", "Hebrew", "Arabic", "Portuguese", "All_together", "German", "_Japanese" ]
	//var classifiers = [ "Natural_Neg", "_Asia", "_Semitic", "_Slavic", "_Uralic", "_Germanic", "_Romanic", "_All_together"]
	//var classifiers = [ "Natural_Neg", "NLU_Tran_All", "Hungarian", "Hungarian_Google", "Hungarian_Yandex", "Hungarian_Microsoft"]
	//var classifiers = [ "Natural_Neg", "NLU_Tran_All", "Hungarian", "Finish", "Best"]
	//var classifiers = [ "Natural_Neg", "NLU_Tran_All", "Finish+Hungarian+Chinese", "Finish", "Hungarian", "Chinese"]
	//var classifiers = [ "Natural_Neg", "NLU_Tran_All", "hu_GG", "hu_MY", "hu_YG", "hu_YY", "Hungarian"]
	//var classifiers = [ "Natural_Neg", "NLU_Tran_All", "Hungarian", "huzh", "huzhur"]
	//var classifiers = [ "Natural","NLU_Tran_GGFinish"]
	//var classifiers = [ "Natural_Neg", "NLU_Tran_All", "Emb_100", "Hungarian", "Emb_100_Hungarian", "Emb_100_All"]
		

	cluster.setupMaster({
  	exec: __filename,
	// args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
	// silent: false
	});
	

	var data1 = (JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed_finalized_fin_full_biased.json")))
    // data1 = bars.enrichparse(data1)
    var utterset1 = bars.getsetcontext(data1, false)
    var train1 = utterset1["train"].concat(utterset1["test"])

    train1 = _.flatten(train1)
    train1 = _.filter(train1, function(num){ return (_.keys(num.outputhash).length == 1 && !("Greet" in num.outputhash) && !("Quit" in num.outputhash)) });

    _.each(train1, function(value, key, list){
    	value["output"] = _.unique(_.keys(value.outputhash))
    	value["input"]["sentences"] = {}
    }, this)
		

	var dist = _.countBy(train1, function(num) { return num["output"][0]});
	console.mlog("DEBUGMASTER: dist: "+JSON.stringify(dist, null, 4))
	
	console.mlog("DEBUGMASTER: loaded: "+train1.length)

	_(folds).times(function(fold){

		var data = partitions.partitions_consistent_by_fold(train1, folds, fold)

		_.each(classifiers, function(classifier, key, list){ 
		
			// worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len, 'datafile': datafile, 'thread': thr})
			// var worker = cluster.fork({'fold': fold+n*folds, 'classifier':classifier})
			var worker = cluster.fork({'fold': fold, 'classifier':classifier})
			
			// console.mlog("DEBUGMASTER: class: "+classifier+" fold:"+ (fold+n*folds) + " train size:"+data.train.length + " test size:" + data.test.length)
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
