// this is the coling version of bias collection

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
var lcfolder = __dirname + "/learning_curves/"

console.vlog = function(data) { fs.appendFileSync( "./logs/" + process.pid, data + '\n', 'utf8') };
console.mlog = function(data) { fs.appendFileSync("./logs/master", data + '\n', 'utf8') };

if (cluster.isWorker)
process.on('message', function(message) {
	
	var classifier = process.env["classifier"]
	var fold = process.env["fold"]
	
	var test  = bars.processdataset(_.flatten(JSON.parse(message['test'])), {"intents":true, "filter": false, "lemma": false, "filterIntent":['Quit','Greet']})
	var train = bars.processdataset(_.flatten(JSON.parse(message['train'])), {"intents":true, "filter": true, "lemma": false, "filterIntent":['Quit','Greet']})
   	
//	_.each(train, function(turn, key, list){ delete train[key]["input"]["sentences"] }, this)
//	_.each(test, function(turn, key, list){ delete test[key]["input"]["sentences"] }, this)

	var max = 100

	console.vlog("DEBUG: worker "+process.pid+" : train.length="+train.length + " test.length="+test.length + " max="+max + " classifier "+classifier)
	var index = 0

	async.whilst(
	    function () { return index < max },
	    function (callbackwhilst) {

	    async.waterfall([
    	function(callbacks) {

    		index += 5

			// if (index < 5)
			// { index +=5 }
			// else if (index<10)
			// { index += 5} 
			// else if (index<20)
			// { index += 5 }
			// else index += 5

	       	var mytrain = bars.copyobj(train.slice(0, index))
	       	var mytrainex =  bars.copyobj(mytrain)
			var mytestex  = bars.copyobj(test)
		
			console.vlog("DIST: class: " + classifier + " DIST:"+JSON.stringify(bars.returndist(mytrain), null, 4))
			console.vlog("DEBUG: worker "+process["pid"]+": index=" + index +
				" train_dialogue="+mytrain.length+" train_turns="+mytrainex.length+
				" test_dialogue="+test.length +" test_turns="+mytestex.length+
				" classifier="+classifier+ " fold="+fold)

			switch(classifier) {
				case "Biased_with_rephrase": 
					var out = []
					console.vlog("COLLING: without rephrases "+mytrainex.length);
					_.each(mytrainex, function(value, key, list){
						out.push(value)
						if ("rephrases" in value)
							out = out.concat(value["rephrases"])
					}, this)		
					out = _.compact(_.flatten(out))
					console.vlog("COLLING: with rephrases "+out.length);
					callbacks(null, out, mytestex, mytrainex.length);
					break;
				case "Biased_no_rephrase_All_Lang": callbacks(null, bars.gettrans(mytrainex, ".*:(pt|fr|de|ru|ar|he|hu|fi|zh):.*"), mytestex, mytrainex.length); break;
				case "Biased_no_rephrase_Hungarian": callbacks(null, bars.gettrans(mytrainex, ".*:hu:.*"), mytestex, mytrainex.length); break;
				case "Natural_All_Lang": callbacks(null, bars.gettrans(mytrainex, ".*:(pt|fr|de|ru|ar|he|hu|fi|zh):.*"), mytestex, mytrainex.length); break;
				case "Natural_Hungarian": callbacks(null, bars.gettrans(mytrainex, ".*:hu:.*"), mytestex, mytrainex.length); break;
				case "Natural_Trans_Microsoft": callbacks(null, bars.gettrans(mytrainex, "M:.*:M"), mytestex, mytrainex.length); break;
				case "Balanced_Trans_Microsoft": callbacks(null, bars.gettrans(mytrainex, "M:.*:M"), mytestex, mytrainex.length); break;
				case "Balanced_Trans_Microsoft_Google": callbacks(null, bars.gettrans(mytrainex, "M:.*:G"), mytestex, mytrainex.length); break;
				case "Balanced_Trans_Google_Microsoft": callbacks(null, bars.gettrans(mytrainex, "G:.*:M"), mytestex, mytrainex.length); break;
				case "Balanced_Trans_Yandex_Microsoft": callbacks(null, bars.gettrans(mytrainex, "Y:.*:M"), mytestex, mytrainex.length); break;
				case "Balanced_Trans_Microsoft_Yandex": callbacks(null, bars.gettrans(mytrainex, "M:.*:Y"), mytestex, mytrainex.length); break;
				case "Natural_Trans": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;
				case "Balanced_Trans": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;
				case "Natural_Trans_Emb": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;
				case "Balanced_Trans_Emb": callbacks(null, bars.gettrans(mytrainex, ".*"), mytestex, mytrainex.length); break;
				case "Oversampled": callbacks(null, bars.oversample(bars.copyobj(mytrainex)), mytestex, mytrainex.length); break;
				case "Undersampled": callbacks(null, bars.undersample(bars.copyobj(mytrainex)), mytestex, mytrainex.length); break;
				default:
					callbacks(null, mytrainex, mytestex, mytrainex.length)
    		}
		},
    		function(mytrainex, mytestex, trainsize, callback) {

		
		var trainwith = bars.copyobj(mytrainex)
		_.each(trainwith, function(value, key, list){
			delete trainwith[key]["rephrases"]
			delete trainwith[key]["input"]["trans"]
		}, this)

		console.vlog(JSON.stringify(trainwith, null, 4))

		trainwith = bars.processdataset(trainwith, {"intents":true, "filter": true, "filterIntent":['Quit','Greet']})
	
//		var baseline_cl = classifiers.Natural_Neg
		var baseline_cl = classifiers["Unigram+Context_SVM"]

/*		if (classifier.indexOf("25")!=-1)
                     baseline_cl = classifiers.NLU_Emb_25
                else if (classifier.indexOf("50")!=-1)
                     baseline_cl = classifiers.NLU_Emb_50
                else if (classifier.indexOf("100")!=-1)
                     baseline_cl = classifiers.NLU_Emb_100
*/  

/*		if (classifier.indexOf("Emb")!=-1)
		{

			if (!(classifier in classifiers))
				throw new Error(classifier+"not in classifiers")
			else	
				baseline_cl = classifiers[classifier]
              	}
*/
	    	// trainAndTest.trainAndTest_async(classifiers[classifier], bars.copyobj(realmytrainex), bars.copyobj(mytestex), function(err, stats){
    		trainAndTest.trainAndTest_async(baseline_cl, bars.copyobj(trainwith), bars.copyobj(mytestex), function(err, stats){

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
	lc.cleanFolder(lcfolder)
	lc.cleanFolder("./logs")
	
	var folds = 10
	var stat = {}

	//var classifiers = [ 'Natural', 'Balanced', 'Balanced_Trans_Microsoft',  "Balanced_Trans_Yandex_Microsoft", "Balanced_Trans_Microsoft_Yandex", "Balanced_Trans_All"]
	//var classifiers = [ 'Natural', 'Balanced', 'Balanced_Trans_Microsoft', "Balanced_Trans_Microsoft_Google", "Balanced_Trans_Google_Microsoft", "Balanced_Trans_Yandex_Microsoft", "Balanced_Trans_Microsoft_Yandex"]
	//var classifiers = [ 'Natural', 'Balanced', 'Balanced_Embed_25', 'Balanced_Embed_50', 'Balanced_Embed_100']
	//var classifiers = [ 'Natural', 'Balanced', 'Natural_Trans', 'Balanced_Trans', 'Natural_Emb', 'Balanced_Emb', 'Natural_Trans_Emb', 'Balanced_Trans_Emb']
	//var classifiers = [ 'Natural', 'Biased_no_rephrase', 'Trans_Google', 'Trans_Microsoft', 'Trans_Yandex']
	var classifiers = [ 	'Natural', 'Biased_with_rephrase', 'Biased_no_rephrase'
//				'Oversampled', 'Undersampled'
				//,'Biased_no_rephrase_All_Lang', 'Natural_All_Lang'
				,'Biased_no_rephrase_Hungarian', 'Natural_Hungarian'	]
	
	//var classifiers = [ 'Natural','Natural_trans','Biased_no_rephrase','Biased_no_rephrase_trans']
	//var classifiers = [ 'Natural','Natural_trans']
	
	cluster.setupMaster({
  	exec: __filename,
  	// exec: __dirname + '/worker.js',
	// args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
	// silent: false
	});


	//	var data1 = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed_finalized.json"))
	//	console.mlog("number of unprocessed dialogues: "+data1.length)
	//	var utterset1 = bars.getsetcontext(data1, false)
	//	var train1 = utterset1["train"].concat(utterset1["test"])
	//	console.mlog("number of the dialogues: "+train1.length)

//		train1 = bars.processdataset(train1)

	//	var data2 = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/version7_trans.json"))
	//	var utterset2 = bars.getsetcontextadv(data2)//COLLING
	//	//var utterset2 = bars.getsetcontext(data2)
	//	var train2 = utterset2["train"].concat(utterset2["test"])
	//	
	//	console.mlog("number of the dialogues2: "+train2.length)

	var data = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed_finalized_fin_full_biased.json"))
	console.mlog("number of unprocessed dialogues: "+data.length)
	var utterset = bars.getsetcontextadv(data)
	const train1 = _.shuffle(utterset["train"].concat(utterset["test"]))
		
	const train2 = utterset["biased"]
	console.mlog("number of the dialogues: train1: " + train1.length + " train2: " + train2.length)

//	_(folds).times(function(fold){
	async.timesSeries(10, function(fold, next){

		var data = partitions.partitions_consistent_by_fold(bars.copyobj(train1), folds, fold)

		_(5).times(function(n){
	
		_.each(classifiers, function(classifier, key, list){ 
			
				var worker = cluster.fork({'fold': fold+n*folds, 'classifier':classifier, /*'thread': thr*/})
		
				console.mlog("DEBUGMASTER: classifier: "+classifier+" fold: "+ (fold+n*folds) + 
					     " train size "+data.train.length + " test size " + data.test.length+
                         " process: "+worker.process.id)

				var train2sam = _.flatten(_.sample(bars.copyobj(train2), 10))

				//var train2sam_no_reph = _.filter(bars.copyobj(train2sam), function(num){ return num.type == "normal" });
				//console.mlog("DEBUGMASTER: with rephrases: "+train2sam.length + " without:"+train2sam_no_reph.length)
				// _.each(train2sam, function(value, key, list){ delete value["trans"]}, this)
			
				var train = []

				if (classifier.indexOf("Biased")!=-1)
					train = bars.copyobj(train2sam)
				else
					train = bars.copyobj(data.test)


/*				if (classifier == "Biased_with_rephrase")
					train = bars.copyobj(train2sam)
				else if (classifier == "Biased_no_rephrase")
					//train = bars.copyobj(train2sam_no_reph)	
					train = bars.copyobj(train2sam)	
				else if (classifier.indexOf("Balance")!=-1)
					{
					console.mlog("DEBUGMASTER: classifier: "+classifier+" its balanced")
					//train = bars.copyobj(train2sam_no_reph)
					train = bars.copyobj(train2sam)
					}		
				else
					train = bars.copyobj(data.test)
*/
				//var max = _.min([_.flatten(data.test).length, _.flatten(train2sam_no_reph).length])
				// var max = _.min([_.flatten(data.test).length, _.flatten(train2sam).length])
			//	max = max - max % 10			
				var max = 0
	
				console.mlog("DEBUGMASTER: train1.len="+_.flatten(data.test).length+ " train2.len="+ _.flatten(train2sam).length + " max="+max)
				console.mlog("DEBUGMASTER: class="+classifier+ " fold="+ fold + " train.len="+train.length + " test.len=" + data.train.length + " max: "+max)
				worker.send({ 		
						'train': JSON.stringify(_.flatten(train)), 
						'test': JSON.stringify(_.flatten(data.train)),
						'max': JSON.stringify(max)
						})

				worker.on('disconnect', function(){
				  	console.mlog("DEBUGMASTER: finished: number of clusters: " + Object.keys(cluster.workers).length)
				  	if (Object.keys(cluster.workers).length == 1)
					next()
				})

				worker.on('message', function(message){
					var workerstats = JSON.parse(message)
					workerstats['classifiers'] = classifiers
					console.mlog("DEBUGMASTER: on message: "+message)
					//fs.appendFileSync(statusfile, JSON.stringify(workerstats, null, 4))
					lc.extractGlobal(workerstats, stat)
				})
			}, this)
		})
	}, function(){
		_.each(stat, function(data, param, list){
			lc.plotlc('average', param, stat, lcfolder)
		})

		console.mlog(JSON.stringify(stat, null, 4))
	})

}
