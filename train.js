/**
 * Trains and tests the NLU component.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var async = require('async');
var distances = require(__dirname+'/utils/distance.js');
var async_adapter = require(__dirname+'/utils/async_adapter.js');
var Hierarchy = require(__dirname+'/Hierarchy');
var _ = require('underscore')._;
var fs = require('fs');
var Hierarchy = require(__dirname+'/Hierarchy');
var multilabelutils = require('limdu/classifiers/multilabel/multilabelutils');
var trainutils = require('./utils/bars')
var wikipedia = require('./utils/wikipedia')
var bars = require('./utils/bars')
var distance = require('./utils/distance')
var rules = require("./research/rule-based/rules.js")
var cheapest_paths = require('limdu/node_modules/graph-paths').cheapest_paths;
var natural = require('natural');
var partitions = require('limdu/utils/partitions');
var PrecisionRecall = require('limdu/utils/PrecisionRecall');
var trainAndTest = require('./utils/trainAndTest');
var serialization = require('serialization');
var limdu = require("limdu");
var ftrs = limdu.features;


var signif = true
// output the blue average
var correlation = false

var latex_plot = false

var check_coverage = false
var check_con = false
var unidis = false 

// translate and org parsed
var check_rephrase = false
var make_tr = false
var make_tr_seeds = false
var make_tr_fix = false
// check the ration of single vs all utterances
var check_ration_all = false


var embedproc = false

var extractbyid = false

// number of human utterances
var check_human = false

var check_intent_issue_dst = false


var check_num_dial_utt = false

// check rephrase strategies
var check_version4 = false

var best_dial = false

var composite_ds = false

var finalization = false

// simlple naive multi label classification with train/test split
var simple_naive_test_train = false

//  the same but to calculate intents
var simple_naive_intent_test_train_intents = false

// check the accuracy of regular expression identification
var check_regexp = false

var consistent_query = false

var reshuffle = false

var check_version7 = false

// check the Ido's approach, we sample the strategy uniformly, then just see the reaction in intents
// prefereably to do so in rations
var check_version7_1 = false

var getsetcontextadv = false

// simple template to check performance on test and train even with simple multi-label binary relevance SVM
var check_ds = false

// check distirbution of intents 
var check_init = false

var check_intent_issue = false
var check_reject = false
var check_context = false

var check_biased = false
var check_single = false
var check_bar = false
var check_stats = false
var count_reject = false
var stat_sig = false

var check_false = false
var check_roots = false
var do_serialization_prod = false
var check_single_multi = false
// var shuffling = false
var check_word = false
// var multi_lab = false
// var mmm = false
var check_cross_batch = false
var check_ds_context = false
var binary_seg = false
var do_small_temporary_serialization_test=  false
var do_cross_dataset_testing = false
var do_final_test = false
var do_cross_validation= false
var do_serialization = false

var verbosity = 0;
var explain = 0;

var classifier = require(__dirname+'/classifiers')

var regexpNormalizer = ftrs.RegexpNormalizer(
		JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json')));

var stringifyClass = function (aClass) {
  	return (_(aClass).isString()? aClass: JSON.stringify(aClass));
  };

var createNewClascheck_dialsifier = function() {
	var defaultClassifier = require(__dirname+'/classifiers').defaultClassifier;
	return new defaultClassifier();
}
var normalizeClasses = function (expectedClasses) {
	if (!_(expectedClasses).isArray())
		expectedClasses = [expectedClasses];
	expectedClasses = expectedClasses.map(stringifyClass);
	expectedClasses.sort();
	return expectedClasses;
};

function normalizer(sentence) {
	sentence = sentence.toLowerCase().trim();
	return regexpNormalizer(sentence);
}

function smart_normalizer(sentence) {
	sentence = sentence.toLowerCase().trim();
	sentence = regexpNormalizer(sentence)
	sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
	
	sentence = sentence.replace(/<VALUE>/g,'')
	sentence = sentence.replace(/<ATTRIBUTE>/g,'')
	sentence = regexpNormalizer(sentence)
	
	return sentence
}

function createNewClassifier()
{
	var defaultClassifier = require(__dirname+'/classifiers').defaultClassifier
	return new defaultClassifier()
}

function parse_filter(parse)
{
        _.each(parse['sentences'], function(value, key, list){
                delete parse['sentences'][key]['basic-dependencies']
                delete parse['sentences'][key]['collapsed-dependencies']
                delete parse['sentences'][key]['tokens']
        }, this)

        return parse
}

		
function walkSync(dir, filelist) {
	files = fs.readdirSync(dir);
  	filelist = filelist || [];
  	
  	files.forEach(function(file) {
    	if (fs.statSync(dir + file).isDirectory()) {
      		filelist = walkSync(dir + file + '/', filelist);
    	}
    	else {
      	filelist.push(dir+file);
    	}
  	})
  return filelist;
}


/*if (check_bar)
{
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	var dataset = bars.getsetcontext(data)
	bars.generateoppositeversion2(_.flatten(dataset["train"]).concat(_.flatten(dataset["test"])))
	process.exit(0)
}
*/
/*if (check_stats)
{
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	// var utterset = bars.getsetcontext(data)
	// var dataset = utterset["train"].concat(utterset["test"])

	var stats = []

	_.each(data, function(value, key, list){
		var turns =  _.filter(value.turns, function(num){ return num.role == "Candidate"; });
		stats.push([turns.length, value.utilityWithoutDiscount, value.assignmentId])
	}, this)

	stats = _.sortBy(stats, function(num){ return num[0] });

	console.log(JSON.stringify(stats, null, 4))
	process.exit(0)
}
*/
/*if (binary_seg)
{
	var dataset = bars.loadds("../negochat_private/dialogues")
	var utterset = bars.getsetnocontext(dataset)
	var stats = trainAndTest.trainAndTest_hash(classifier.BinarySegmentation, utterset["train"], utterset["test"], 5)
}
*/
/*if (mmm)
{

	var single = []
	var multi = []

	var dataset = bars.loadds("../negochat_private/dialogues")
	var utterset = bars.getsetcontext(dataset)

	var data = _.flatten(utterset['train'].concat(utterset['test']))

	_.each(data, function(value, key, list){
		if (value.output.length>1)
			console.log(JSON.stringify(value, null, 4))
	}, this)
}
*/

if (latex_plot)
{


	var lc = require(__dirname + "/lc/lc.js")
	var stat =  JSON.parse(fs.readFileSync(__dirname+"/js"))

	_.each(stat, function(value, parameter, list){
	
		var results = {}

		_.each(value, function(sta, size, list){
	
			var classifiers = lc.plotlcagrlen("average", stat[parameter][size])
			
			_.each(classifiers, function(result, classifier, list){
				
				if (!(classifier in results))
					results[classifier] = []

				results[classifier].push([parseInt(size), result])				
			}, this)
		}, this)

		var string = ""

		_.each(results, function(listres, classifier, list){

			string += "\\addplot[color=green,mark=*] coordinates {\n"

			_.each(listres, function(value1, key, list){
				string += "("+value1[0]+","+value1[1]+")" 
			}, this)

	     	string += "\n};\n"
	     	string += "\\addlegendentry{"+classifier.replace(/_/g,"\\_")+"}\n"
	     	string += "\n"

		}, this)

		fs.writeFileSync(__dirname+"/latex_plot/"+parameter, string, 'utf-8')

	}, this)
	
	process.exit(0)
}

if (unidis)
{
var with_rephrase = [0.33, 0.4, 0.2, 0.05]
var without_rephrase = [0.37, 0.35, 0.21, 0.05]
var uniform = [0.25, 0.25, 0.25, 0.25]
var a = distance.tvd(with_rephrase, uniform)
var b = distance.tvd(without_rephrase, uniform)
console.log("if "+ a + " > "+ b)
}

if (correlation)
{
	var lang = {}

	// among all language MM for some reason  
  	var omitlang = ["ar", "es"]

	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed_finalized.json"))

	_.each(data, function(dialogue, key, list){

		_.each(dialogue["turns"], function(turn, key, list){
			if (turn.role == "Employer")
				if ("trans" in turn["input"])
					{

						var temp = {}

						_.each(turn["input"]["trans"], function(text, key, list){
							
							var ln = key.substr(2,2)
							var engine1 = key.substr(0,1)
							var engine2 = key.substr(-1,1)
							
							var par = engine1+engine2
							// var par = ln

							if (omitlang.indexOf(ln)==-1)
							{

								console.log("language:"+ln)
								console.log("par:"+par)
						
								var intents = _.keys(turn["output"])
								// var ln = key.substr(0,1) + key.substr(-1,1)
							    // var language = key.substr(2,2)

								if (!(par in lang))
									// lang[par] = {}
									lang[par] = []


								// if (intents.length == 1)
								// {	

									// if (!(intents[0] in lang[par]))
									// lang[par][intents[0]] = [] 

									var dst = bars.distances(text, turn["input"]["text"])
		   							// temp[par] = dst

		   							if (isNaN(parseFloat(dst)) || !isFinite(dst))
		   								{
		   								console.log("FUCK")
		   								console.log(text)
		   								console.log(turn["input"]["text"])
		   								console.log(dst)
		   								}
		   							else
										lang[par].push(dst)
										// lang[par][intents[0]].push(dst)
								// }
							}
						
						}, this)

						/*if ((temp['MY'] > temp['MM'])
							&&
							(temp['MG'] > temp['MM']))
						{
							console.log("CASE")
							console.log("text:"+turn["input"]["text"])
							console.log("MM:"+turn["input"]["trans"]["M:fi:M"])
							console.log("MY:"+turn["input"]["trans"]["M:fi:Y"])
							console.log("MG:"+turn["input"]["trans"]["M:fi:G"])
						}*/
					}
		}, this)

	}, this)

	var aver = {}

	_.each(lang, function(value, ln, list){
		aver[ln] = distances.average(value)
	}, this)

	var arr = _.pairs(aver)
	arr = _.sortBy(arr, function(num){ return num[1] });

	console.log(JSON.stringify(arr, null, 4))
	process.exit(0)
}

if (make_tr)
{
	var lang = {
		French:"fr",
		German:"de",
		Spanish:"es",
		Portuguese: "pt",
		Hebrew:"he",
		Arabic:"ar",
		Russian:"ru",
		Chinese:"zh"
	}


	var sys = {
			"yandex": "Y",
			"microsoft":"M",
			"google":"G"
		}

	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))

	var child_process = require('child_process')
	
	_.each(data, function(dialogue, keyd, list){

		console.log("DIALOGUE: "+ keyd)

		_.each(dialogue["turns"], function(turn, keyt, list){
			
			if (turn.role == "Employer")
			{

				var trans = {}
				console.log(turn.translation_id)

				_.each(sys, function(engine1liter, engine1, list){
					_.each(sys, function(engine2liter, engine2, list){

					//	if (engine1 != engine2)
						{
							_.each(lang, function(ln, lnkey, list){						
				
	    						// var out = child_process.execSync("node utils/async_tran.js 'microsoft' 'en' 'ru' 'I am home'", {encoding: 'utf8'})
	    						var out = child_process.execSync("node utils/async_tran.js \""+engine1+"\" \""+engine2+"\" \""+ln+"\" \""+turn.input.text+"\"", {encoding: 'utf8'})
	   							out = out.replace(/\n$/, '')
								trans[engine1liter+":"+ln+":"+engine2liter] = out
				//				console.log(engine1liter+":"+ln+":"+engine2liter)
		
							}, this)
						}
					}, this)
				}, this)


				data[keyd]["turns"][keyt]["input"]["trans"] = trans


				// console.log(JSON.stringify(trans, null, 4))
				// process.exit(0)	

			}

		}, this)

//		process.exit(0)	
			fs.writeFileSync("/tmp/buffer_dial.json", JSON.stringify(data, null, 4))

	}, this)

	console.log(JSON.stringify(data, null, 4))
	process.exit(0)	
}


if (signif)
{
	var glresults = {
		"classifier1":[],
		"classifier2":[]
	}

	var data1 = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed_finalized.json"))
	var utterset1 = bars.getsetcontext(data1, false)
	var train1 = utterset1["train"].concat(utterset1["test"])

	var data = partitions.partitions_consistent_by_fold(bars.copyobj(train1), 10, 1)

	// data["test"] - 10 dialogues
	// data["train"] - 90 dialogues

	var  train = data["test"] 
	var  test = data["train"] 
	
	train = train.slice(0,2)

	console.log("DEBUGTRAIN: test: "+test.length)	
	console.log("DEBUGTRAIN: train: "+train.length)	

	train = bars.processdataset(_.flatten(train), {"intents":true, "filter": true, "filterIntent": ["Quit", "Greet"]})

	var classifier1 = new classifier.Natural_Neg 
	var classifier2 = new classifier.Natural_Neg

	var train1 = bars.copyobj(train)

	classifier1.trainBatchAsync(bars.copyobj(train1), function(err, results){
		
		console.log("classifier1 is trained")
		var train2 = bars.gettrans(bars.copyobj(train), ".*:hu:.*")
		console.log("train2 before additional processdataset: "+train2.length)
		train2 =  bars.processdataset(train2, {"intents": true, "filterIntent": ["Quit","Greet"], "filter":true})
		console.log("train2 after additional processdataset: "+train2.length)

	
		classifier2.trainBatchAsync(bars.copyobj(train2), function(err, results){
			
			console.log("classifier2 is trained")
			// _(30).times(function(n){ 
			var index = 0

			var testop = bars.copyobj(test)

			async.timesSeries(30, function(n, callbackl){ 

				// var index = n*3
				console.log("DEBUGTRAIN: index: "+index)
				console.log("DEBUGTRAIN: test size : "+testop.length)
				var testsplice  = testop.splice(0, 3)
				console.log("DEBUGTRAIN: testsplice: "+testsplice.length)
				console.log("DEBUGTRAIN: testsplice uttreances: "+_.flatten(testsplice).length)

				var testdata =  bars.processdataset(bars.copyobj(_.flatten(testsplice)), {"intents":true, "filter": false, "filterIntent": ["Quit", "Greet"]})
					
				console.log("DEBUGTRAIN:"+testdata.length)	
				trainAndTest.testBatch_async(classifier1, bars.copyobj(testdata), function(error, results1){

					glresults["classifier1"].push(results1['stats']["macro-F1"])
					trainAndTest.testBatch_async(classifier2, bars.copyobj(testdata), function(error, results2){
						glresults["classifier2"].push(results2['stats']["macro-F1"])
						callbackl()
					})
				})
			},
			function(err)
			{
				console.log(JSON.stringify(glresults, null, 4))
				bars.write_wilcoxon(glresults)
				process.exit(0)
			})

		})
	})


	// console.log(data["train"].length)
	// console.log(data["test"].length)
	// process.exit(0)

}

if (check_num_dial_utt)
{
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version7_trans.json"))
	// var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed_finalized.json"))
	var utterset = bars.getsetcontext(data, false)
	var dialogues = utterset["test"].concat(utterset["train"])



	console.log(dialogues.length)
	console.log(_.flatten(dialogues).length)
	
	var para = 0

	_.each(_.flatten(dialogues), function(utterance, key, list){
	
		if ("trans" in utterance["input"])
			para += _.keys(utterance["input"]["trans"]).length

	}, this)

	console.log(JSON.stringify(para, null, 4))
	process.exit(0)
}


if (make_tr_fix)
{
	var lang = {
		French:"fr",
		German:"de",
		Spanish:"es",
		Portuguese: "pt",
		Hebrew:"he",
		Arabic:"ar",
		Russian:"ru",
		Chinese:"zh"
	}


	var sys = {
			"yandex": "Y",
			"microsoft":"M",
			"google":"G"
		}

	var data = JSON.parse(fs.readFileSync("/tmp/buffer_dial.json.bk"))

	var child_process = require('child_process')
	
	_.each(data, function(dialogue, keyd, list){

		console.log("DIALOGUE: "+ keyd)

		_.each(dialogue["turns"], function(turn, keyt, list){
			
			if (turn.role == "Employer")
			{
				if  (!("trains" in turn["input"]))
				{ 

				var trans = {}
				console.log(turn.translation_id)

				_.each(sys, function(engine1liter, engine1, list){
					_.each(sys, function(engine2liter, engine2, list){

					//	if (engine1 != engine2)
						{
							_.each(lang, function(ln, lnkey, list){						
				
	    						// var out = child_process.execSync("node utils/async_tran.js 'microsoft' 'en' 'ru' 'I am home'", {encoding: 'utf8'})
	    						var out = child_process.execSync("node utils/async_tran.js \""+engine1+"\" \""+engine2+"\" \""+ln+"\" \""+turn.input.text+"\"", {encoding: 'utf8'})
	   							out = out.replace(/\n$/, '')
								trans[engine1liter+":"+ln+":"+engine2liter] = out
				//				console.log(engine1liter+":"+ln+":"+engine2liter)
		
							}, this)
						}
					}, this)
				}, this)
				data[keyd]["turns"][keyt]["input"]["trans"] = trans
				}

				if  ("trains" in turn["input"])
				{

					if  (turn["input"]["trains"]["Y:fr:M"].indexOf("TranslateApiException")!=-1)
					{
						var trans = {}
						console.log(turn.translation_id)

						_.each(sys, function(engine1liter, engine1, list){
							_.each(sys, function(engine2liter, engine2, list){

					//	if (engine1 != engine2)
								{
								_.each(lang, function(ln, lnkey, list){						
				
	    						// var out = child_process.execSync("node utils/async_tran.js 'microsoft' 'en' 'ru' 'I am home'", {encoding: 'utf8'})
	    							var out = child_process.execSync("node utils/async_tran.js \""+engine1+"\" \""+engine2+"\" \""+ln+"\" \""+turn.input.text+"\"", {encoding: 'utf8'})
	   								out = out.replace(/\n$/, '')
									trans[engine1liter+":"+ln+":"+engine2liter] = out
				//				console.log(engine1liter+":"+ln+":"+engine2liter)
		
								}, this)
								}
							}, this)
						}, this)
						
						data[keyd]["turns"][keyt]["input"]["trans"] = trans	
					}


				}

			}

		}, this)

//		process.exit(0)	
			fs.writeFileSync("/tmp/buffer_dial.json", JSON.stringify(data, null, 4))

	}, this)

	console.log(JSON.stringify(data, null, 4))
	process.exit(0)	
}


if (make_tr_seeds)
{

}

if (make_tr_seeds)
{
	var lang = {
		French:"fr",
		German:"de",
		Spanish:"es",
		Portuguese: "pt",
		Hebrew:"he",
		Arabic:"ar",
		Russian:"ru",
		Chinese:"zh"
	}


	var sys = {
			"yandex": "Y",
			"microsoft":"M",
			"google":"G"
		}

	var turns = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/seeds.json"))

	var child_process = require('child_process')
	
	_.each(turns, function(turn, keyt, list){
			
		if (turn.role == "Employer")
		{

			var trans = {}
			console.log(turn.translation_id)

				_.each(sys, function(engine1liter, engine1, list){
					_.each(sys, function(engine2liter, engine2, list){

					//	if (engine1 != engine2)
						{
							_.each(lang, function(ln, lnkey, list){						
				
	    						// var out = child_process.execSync("node utils/async_tran.js 'microsoft' 'en' 'ru' 'I am home'", {encoding: 'utf8'})
	    						var out = child_process.execSync("node utils/async_tran.js \""+engine1+"\" \""+engine2+"\" \""+ln+"\" \""+turn.input.text+"\"", {encoding: 'utf8'})
	   							out = out.replace(/\n$/, '')
								trans[engine1liter+":"+ln+":"+engine2liter] = out
				//				console.log(engine1liter+":"+ln+":"+engine2liter)
		
							}, this)
						}
					}, this)
				}, this)


			turns[keyt]["input"]["trans"] = trans

		}

	}, this)

	console.log(JSON.stringify(turns, null, 4))
	process.exit(0)	
}

if (best_dial)
{
	var count = {}
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version7_trans.json"))

	var data = _.filter(data, function(num){ return num.gameid == "2016-05-04T14:00:43.923Z" });
	var dial = data[0]["turns"]

	_.each(dial, function(value, key, list){
		if ("input" in value)
		{
			delete value["input"]["trans"]
			delete value["input"]["sentences"]
		}
	}, this)

	console.log(JSON.stringify(dial, null, 4))

	// _.each(data, function(dialogue, key, list){
		// count[dialogue.gameid] = dialogue["turns"].length
	// }, this)
	// console.log(JSON.stringify(count, null, 4))

}

if (check_word)
{
	var wordembs = {}
	var inc = 0
	var distance = []

	async_adapter.getembedall(9, function(err, results){
		console.log("List is loaded"+ results.length)
		async.forEachOfSeries(results, function(word, dind, callback2){ 
			inc += 1
			if (inc % 10000 == 0) console.log(inc)
			async_adapter.getembed(word, 9, function(err, wordemb){
				wordembs[word] = wordemb
				callback2()
			})
		}, function(err){
			console.log("Finished")
			console.log(_.keys(wordembs).length)
			inc = 0

			_.each(wordembs, function(value, key, list){
				inc += 1
				if (inc % 10000 == 0) console.log(inc)
				distance.push([key, distances.cosine_distance(wordembs['offer'], value)])
			}, this)

			distance = _.sortBy(distance, function(num){ return num[1] }).reverse()

			console.log(distance.slice(0,50))

		})
	})
}

/*if (multi_lab)
{
	var dataset = bars.loadds("../negochat_private/dialogues")
	var utterset = bars.getsetcontext(dataset)

	var data = _.flatten(utterset['train'].concat(utterset['test']))

	var unlab = 0
	var single = 0
	var multi = 0

	var multiaccept = 0
	var multireject = 0
	var multioffer = 0

	var multihash = 0

	var truemulti = []
	var multistats = []
	var offerreject = []

	_.each(data, function(value, key, list){
		if (value.output.length==0)
			unlab += 1

		if (value.output.length==1)
			single += 1

		if (value.output.length>1)
		{
			multi += 1
			var intents = _.map(value.output, Hierarchy.splitPartEquallyIntent);
			intents = _.flatten(intents)

			// console.log(JSON.stringify(intents, null, 4))
			if ((_.unique(intents).length==1)&&(_.unique(intents)[0]=='Offer'))
				multioffer += 1

			if ((_.unique(intents).length==1)&&(_.unique(intents)[0]=='Accept'))
				multiaccept += 1

			if ((_.unique(intents).length==1)&&(_.unique(intents)[0]=='Reject'))
				multireject += 1

		}

		if (_.keys(value.outputhash).length>1)
		{	
			multihash += 1
			truemulti.push(value)
		}

		if (_.isEqual(['Offer','Reject'],_.sortBy(_.keys(value.outputhash),function(num){ return num } ))==true)
			offerreject.push(value)

		multistats.push(_.sortBy(_.keys(value.outputhash),function(num){ return num } ))

	}, this)

	console.log(JSON.stringify(offerreject, null, 4))

	multistats = _.countBy(multistats, function(num) { return num });
	// console.log(JSON.stringify(truemulti, null, 4))
	console.log(JSON.stringify(multistats, null, 4))

	console.log(JSON.stringify("unlab "+unlab, null, 4))
	console.log(JSON.stringify("single "+single, null, 4))
	console.log(JSON.stringify("multi "+multi, null, 4))
	console.log(JSON.stringify("multioffer "+multioffer, null, 4))
	console.log(JSON.stringify("multiaccept "+multiaccept, null, 4))
	console.log(JSON.stringify("multireject "+multireject, null, 4))
	console.log(JSON.stringify("multihash "+multihash, null, 4))
}
*/
if (check_intent_issue_dst)
{
	var result = {
				"Accept": {},
				"Reject": {},
				"Query": {}
				}

	
	// var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version7.json"))
	var utterset = bars.getsetcontext(data)
	var dialogues = utterset["test"].concat(utterset["train"])
	dialogues = dialogues.slice(0,30)

	console.log(dialogues.length)

	_.each(dialogues, function(dialogue, key, list){
		_.each(dialogue, function(utterance, key, list){
			var intents = bars.turnoutput(utterance.outputhash)
			console.log(JSON.stringify(intents, null, 4))
			_.each(intents, function(intent, key, list){	
				if (["Accept","Reject","Query"].indexOf(intent[0])!=-1)
					{
						if (!(intent[1] in result[intent[0]]))
							result[intent[0]][intent[1]] = 0

						result[intent[0]][intent[1]] += 1
					}
			}, this)
		}, this)
	}, this)

	_.each(result, function(res, intent, list){
		var sum = _.reduce(_.values(res), function(memo, num){ return memo + num; }, 0);
		_.each(res, function(value, key, list){
			result[intent][key] =value/sum
		}, this)
	}, this)

	console.log(JSON.stringify(result, null, 4))
	process.exit(0)
}

if (check_single_multi)
{

	var single = []
	var multi = []

	var dataset = bars.loadds("../negochat_private/dialogues")
	var utterset = bars.getsetcontext(dataset)

	var data = _.flatten(utterset['train'].concat(utterset['test']))
	
	// the third of the utterances are multi-label utterances
	// var sing = 0	
	// var mult = 0	

	// _.each(data, function(value, key, list){
	// 	if (value.output.length > 1)
	// 		mult += 1
	// 	else
	// 		sing += 1
	// }, this)

	// console.log(JSON.stringify(data.length, null, 4))	
	// console.log(JSON.stringify(mult, null, 4))
	// console.log(JSON.stringify(sing, null, 4))
	
	_.each(data, function(value, key, list){
		if (value.output.length > 1)
			multi = multi.concat(value.output)
		else
			single = single.concat(value.output)
	}, this)

	console.log(JSON.stringify(multi.length, null, 4))
	console.log(JSON.stringify(single.length, null, 4))
	
	var multis = _.countBy(multi, function(num) { return num })
	var singles = _.countBy(single, function(num) { return num })

	console.log(JSON.stringify(multis, null, 4))
	console.log(JSON.stringify(singles, null, 4))

	var aggree = {}

	_.each(multis, function(value, label, list){
		aggree[label] = {}
		aggree[label]['multi'] = value
	}, this)

	_.each(singles, function(value, label, list){
		if (!(label in aggree))
			aggree[label] = {}
		
		aggree[label]['single'] = value
	}, this)

	console.log(JSON.stringify(aggree, null, 4))
	process.exit(0)
}

    // "{\"Offer\":{\"Pension Fund\":\"20%\"}}": {
    //     "multi": 45,
    //     "single": 2


if (check_cross_batch)
{
	var dataset = bars.loadds("../negochat_private/dialogues")
	var utterset = bars.getsetcontext(dataset)

	// utterset["train"] = utterset["train"].slice(0,20)
	// utterset["test"] = utterset["test"].slice(0,5)

	console.log(utterset["train"].length)
	console.log(_.flatten(utterset["train"]).length)
	console.log("----")
	
	console.log(utterset["test"].length)
	console.log(_.flatten(utterset["test"]).length)

	utterset["test"] = _.flatten(utterset["test"])
	utterset["train"] = _.flatten(utterset["train"])

	var stats = trainAndTest.cross_batch(classifier.DS_bigram, bars.copyobj(utterset["train"]), 2)

	console.log(JSON.stringify(stats, null, 4))
	process.exit(0)
}

if (check_coverage)
{
    var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed_finalized.json"))

    // var data_src = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	// var utterset = bars.getsetcontext(data_src, false)
    // var data = utterset["train"].concat(utterset["test"])

    var total = 0
    var uncover = []
    var dials = []

    var employer = 0
    var candidate = 0

    var human_single = 0
    var human_multi = 0
    var human_zero = 0

    var endedIn = []
    var gender = []
    var age = []

    var candidate_intents = []
    var employer_intents = []

    var data = _.filter(data, function(num){ return ["train","test"].indexOf(num.set)!=-1 });

    console.log(data.length)

    _.each(data, function(dialogue, dialid, list){

    	endedIn.push(dialogue.endedIn)
    	gender.push(dialogue.gender)
    	age.push(dialogue.age)

    	_.each(dialogue["turns"], function(turn, key, list){

 			if (turn.role == "Candidate")
 			{
   				candidate += 1
   				if ("output" in turn) candidate_intents.push(_.keys(turn.output))

 			}

    		if (turn.role == "Employer")
    		{
    			var intents = _.keys(turn.output)
    			employer += 1

    			if (intents.length == 1) human_single += 1
    			if (intents.length == 0) human_zero += 1
    			if (intents.length > 1) human_multi += 1

   				if ("output" in turn) employer_intents.push(_.keys(turn.output))

 	   		}
    		
    	}, this)
    }, this)

    console.log(JSON.stringify(_.countBy(endedIn, function(num){ return num }), null, 4))	
    console.log(JSON.stringify(_.countBy(gender, function(num){ return num }), null, 4))
    console.log(JSON.stringify(_.countBy(age, function(num){ return num }), null, 4))

    console.log("employer")
    console.log(JSON.stringify(_.countBy(_.flatten(employer_intents), function(num){ return num }), null, 4))
    console.log("candidate")
    console.log(JSON.stringify(_.countBy(_.flatten(candidate_intents), function(num){ return num }), null, 4))


    // console.log("COVERAGE")
    console.log("total number of dials:"+data.length)
    console.log("total number agent utterances:"+candidate)
    console.log("total number human utterances:"+employer)

    console.log("total number human single utterances:"+human_single)
    console.log("total number human zero utterances:"+human_zero)
    console.log("total number human multi utterances:"+human_multi)

    // console.log("total:"+total)
    // console.log("uncover:"+uncover.length)
    // console.log("dials:"+_.unique(dials))
    // console.log("dials:"+dials.length)
    // console.log(JSON.stringify(uncover, null, 4))
    process.exit(0)
}

// kind of intent issue distribution
if (check_intent_issue)
{
	var intents = {}

	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version3.json"))
	// var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	var utterset = bars.getsetcontext(data)
	var data = utterset["test"].concat(utterset["train"])

	_.each(data, function(dial, key, list){
		_.each(dial, function(value, key, list){
			_.each(value.output, function(inte, key, list){
				var js = JSON.parse(inte)
				var intent = _.keys(js)[0]
				if (_.isObject(_.values(js)[0]))
				{
					var issue = _.keys(_.values(js)[0])[0]

					if (!(intent in intents))
						intents[intent] = {}

					if (!(issue in intents[intent]))
						intents[intent][issue] = 0

					intents[intent][issue] += 1
				}
			}, this)
		}, this)
	}, this)

	_.each(intents, function(value, key, list){
		var valar = _.pairs(value)
		valar = _.sortBy(valar, function(num){ return num[1] }).reverse()
		intents[key] = _.object(valar) 
	}, this)

	console.log(JSON.stringify(intents, null, 4))
	process.exit(0)
}

// single vs multi intent utterances
if (check_ration_all)
{
	// var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version7.json"))
	var utterset = bars.getsetcontext(data)
	var dataset = _.flatten(utterset["train"].concat(utterset["test"]))

	var all = dataset.length
	var single =  _.filter(dataset, function(num){ return _.keys(num.outputhash).length <= 1 });

	console.log(single.length/all)
	process.exit(0)
}

if (check_version4)
{
	var recovery = {}
	var intents = {}
	// var rectypes = ['AskRepeat', 'AskRephrase' ,'Reprompt' ,'Notify', 'Yield', 'MoveOn', 'Help', 'YouCanSay', 'TerseYouCanSay']
	var rectypes = ['AskRepeat', 'AskRephrase' ,'Reprompt' ,'Notify', 'Yield', 'Help', 'YouCanSay', 'TerseYouCanSay']
	var previntents = []
	var rectype = undefined

	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version7.json"))
	// var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version4.json"))
	var data = _.filter(data, function(num){ return num['set'] != 'unable'; });

	console.log("Length: "+data.length)

	_.each(data, function(dialogue, key, list){
		_.each(dialogue['turns'], function(turn, key, list){
			if ((turn.role == "Candidate") && (rectypes.indexOf(turn.data) !=-1) && (_.isUndefined(rectype)))
			{
				if (!(turn.data in recovery))
					recovery[turn.data] = {'total': 0, 'correct':0}
				
				recovery[turn.data]['total'] += 1

				previntents = _.sortBy(_.keys(dialogue['turns'][key-1]['output']), function(num){ return num })

				if (previntents.length == 0)
						{
							// console.log(JSON.stringify(dialogue['turns'][key-1], null, 4))
							// console.log(JSON.stringify(dialogue['turns'][key], null, 4))
							// process.exit(0)
						}

				_.each(previntents, function(value, key, list){
					if (!(value in intents))
						intents[value] = {'total': 0, 'correct':0}
				
					intents[value]['total'] += 1
				}, this)

				rectype = turn.data
			}

			if ((turn.role == "Employer") && (!_.isUndefined(rectype)))
			{
				var curintents = _.sortBy(_.keys(turn['output']), function(num){ return num })

				// console.log(JSON.stringify(previntents, null, 4))
				// console.log(JSON.stringify(curintents, null, 4))
				// console.log("---")

				var intersec = _.sortBy(_.intersection(curintents, previntents), function(num){ return num })

				if (_.isEqual(intersec, previntents) == true) 
				{
					recovery[rectype]["correct"] += 1

					_.each(previntents, function(value, key, list){
						intents[value]['correct'] += 1
					}, this)					
				}
						
				rectype = undefined
				previntents = []
			}

		}, this)
	}, this)
	console.log(JSON.stringify(recovery, null, 4))
	console.log(JSON.stringify(intents, null, 4))
	process.exit(0)
}


// let's assume we sample a strategy
// the question is if we sampled the good startegy for specific issue. what intent we will get in return
if (check_version7_1)
{
	var strategy = {
					'Accept': {}, 
					'Reject': {}
					}

	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version7_neww.json"))
	console.log(data.length)

	var data = _.filter(data, function(num){ return ["train","test"].indexOf(num.set)!=-1 });
	console.log(data.length)

	_.each(data, function(dialogue, key, list){

		var iss = 	{
					'Salary': '',
					'Pension Fund': '',
					'Job Description': '',
					'Leased Car': '',
					'Promotion Possibilities': '',
					'Working Hours':''
					}

		_.each(dialogue['turns'], function(turn, key, list){
			
			if ((turn.role == "Candidate") && ('data' in turn))
			{
				// "data": "Job Description:Accept"

				if (turn.data.indexOf(":")!=-1)
				{
					var intent = turn.data.split(":")[1];
					var issue = turn.data.split(":")[0];

					iss[issue] = intent

					console.log("intent: "+ intent + " issue: "+issue)
					console.log("strategies:"+JSON.stringify(strategy))
					console.log("iss:"+JSON.stringify(iss))
				}
			}

			/*if ((turn.role == "Candidate") && ("output" in turn))
			{
				// previously mentioned issues by Candidate
				truein = _.map(bars.turnoutput(turn.output), function(num){ return num[1] })
				console.log("CT: with output issues: "+truein + " output: "+JSON.stringify(turn.output))
			}*/
				
			if (turn.role == "Employer")
			{
				var curintents = bars.turnoutput(turn.output)
				// [['Accept', 'Salary'], ['Reject', 'Job']]
				
				// check the work of turnoutput
				console.log("ET: "+JSON.stringify(curintents) + " output "+JSON.stringify(turn.output))
						
				_.each(curintents, function(value, key, list){

					// 
					if (["true", true, "Offer"].indexOf(value[1])==-1)
					{
						console.log("each:" +value+ " in startegy: "+iss[value[1]])

						if (iss[value[1]]!='')
						{
							var intent = value[0]
							if (!(intent in strategy[iss[value[1]]]))
								strategy[iss[value[1]]][intent] = 0

							strategy[iss[value[1]]][intent] += 1
							
							iss[value[1]] = ""
						}
					}
				}, this)

				console.log("iss:"+JSON.stringify(iss))
				console.log("strategy:"+JSON.stringify(strategy))
			}
		}, this)
	}, this)

	_.each(strategy, function(intents, str, list){
		var overall = 0
		_.each(intents, function(count, intent, list){
			overall += count
			strategy[str][intent] = {'count': count, 'ratio':0}
		}, this)

		_.each(intents, function(has, intent, list){
			strategy[str][intent]['ratio'] = has["count"]/overall
		}, this)
	}, this)

	console.log(JSON.stringify(strategy, null, 4))
	process.exit(0)

}

if (check_version7)
{
	var strategy = {
					'Accept': {'total': 0, 'correct': 0}, 
					'Reject': {'total': 0, 'correct': 0},
					}

	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version7.json"))
	// var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version4.json"))
	// var data = _.filter(data, function(num){ return num['set'] != 'unable'; });

	// console.log("Length: "+data.length)
	var truein = []

	_.each(data, function(dialogue, key, list){

		var iss = 	{
					'Salary': '',
					'Pension Fund': '',
					'Job Description': '',
					'Leased Car': '',
					'Promotion Possibilities': '',
					'Working Hours':''
					}

		_.each(dialogue['turns'], function(turn, key, list){
			
			if ((turn.role == "Candidate") && ('data' in turn))
			{
				if (turn.data.indexOf(":")!=-1)
				{
					var intent = turn.data.split(":")[1];
					var issue = turn.data.split(":")[0];

					strategy[intent]['total'] = strategy[intent]['total'] + 1
					iss[issue] = intent

					console.log("intent: "+ intent + " issue: "+issue)
					console.log("strategies:"+JSON.stringify(strategy))
					console.log("iss:"+JSON.stringify(iss))
				}
			}

			if ((turn.role == "Candidate") && ("output" in turn))
			{
				truein = _.map(bars.turnoutput(turn.output), function(num){ return num[1] })
				console.log("CT: with output issues: "+truein + " output: "+JSON.stringify(turn.output))
			}
				
			if (turn.role == "Employer")
			{
				var curintents = bars.turnoutput(turn.output)

				console.log("ET: "+JSON.stringify(curintents) + " output "+JSON.stringify(turn.output))
				
				_.each(curintents, function(value, key, list){
					if (value[1]!=true)
					{
						console.log("ET: intent: " + value[0] + " issue: " + value[1])
						if (iss[value[1]] == value[0])
						{
							strategy[value[0]]['correct'] += 1
							iss[value[1]] = ""
						}
					}
					else
					{
						console.log("ET: TRUE: " + truein)

						_.each(truein, function(value1, key, list){
							if (iss[value1] == value[0])
								strategy[value[0]]['correct'] += 1
								
							iss[value1] = ""	

						}, this)
					}

				}, this)

				console.log("ET: END: strategy: "+JSON.stringify(strategy))
				console.log("ET: END: issue : "+JSON.stringify(iss))
			}

		}, this)
	}, this)
	// console.log(JSON.stringify(recovery, null, 4))
	console.log(JSON.stringify(strategy, null, 4))
	process.exit(0)
}

/*if (shuffling)
{
        var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	data = _.shuffle(data)
	data = _.shuffle(data)
	data = _.shuffle(data)
	data = _.shuffle(data)
	data = _.shuffle(data)
	data = _.shuffle(data)
	console.log(JSON.stringify(data, null, 4))	               
	process.exit(0)
}
*/
/*if (stat_sig)
{
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	var utterset = bars.getsetcontext(data)
	var dataset = utterset["train"].concat(utterset["test"])

	var train = dataset.splice(70)

	var res = {'1':[],'2':[]}
	
	async.timesSeries(25, function(n, callback){

		trainAndTest.trainAndTest_async(classifier.DS_comp_exp_3_root_5_unoffered_yes_offer_yes_test, train, dataset[n]), function(err, stats1){
			res['1'].push(stats1.average_macroF1)

			trainAndTest.trainAndTest_async(classifier.DS_comp_unigrams_async_context_unoffered, train, dataset[n]), function(err, stats2){
				res['2'].push(stats2.average_macroF1)

				callback()

			})
		})
    }, function(err, users) {
    	console.log(JSON.stringify(res, null, 4))
	})
}
*/

if (check_roots)
{
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	var utterset = bars.getsetcontext(data)
	
	utterset["test"] = _.shuffle(_.flatten(utterset["test"]))
	utterset["train"] = _.shuffle(_.flatten(utterset["train"]))

	var data = utterset["test"].concat(utterset["train"])

	var res = {'Accept':[], 'Reject':[]}

	async.eachSeries(data, function(value, callbackl){ 
	// _.each(data, function(value, key, list){

		if (value.output.length == 1)
		{
			var intent = _.keys(JSON.parse(value.output[0]))[0]

			if (["Accept","Reject"].indexOf(intent)!=-1)
			{
			    var root = _.where(value["input"]["sentences"][0]['basic-dependencies'], {"dep": "ROOT"})[0]["dependentGloss"]

			    var negate = _.where(value["input"]["sentences"][0]['basic-dependencies'], {"dep": "neg", "governorGloss":root})

      			var roottoken = _.where(value["input"]["sentences"][0]['tokens'], {"word": root}, this)[0]



      			if (["vb","vbd","vbg","vbn","vbp","vbz"].indexOf(roottoken.pos.toLowerCase())!=-1)
      			{

	      			async_adapter.getwordnet(roottoken.lemma, roottoken.pos, function(err, results){
	      				
	      				if ((results['antonyms'].length > 3) && (results['synonyms'].length > 3))
	      				{
							res[intent].push({
				    			'word': roottoken.word, 
				    			'lemma': roottoken.lemma, 
				    			'pos': roottoken.pos,
				    			'negated': negate.length > 0,
				    			//'antonyms': results['antonyms'],
				    			//'synonyms': results['synonyms'],
				    			'text': value.input.text
							})
							callbackl()
	     				}
	     				else
	     					callbackl()
	      			})
	      		}
	      		else
	      			callbackl()
			}
			else
				callbackl()
		}
		else
			callbackl()
	
	}, 
		function(err){
				
					console.log(JSON.stringify(res, null, 4))
					process.exit(0)
				}) 
}

if (check_reject)
{

	var inte = "Accept"
	// var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version3.json"))
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	var utterset = bars.getsetcontext(data)	
	var data = utterset["test"].concat(utterset["train"])
	var sum = 0

	// console.log(JSON.stringify(data.length, null, 4))
	// process.exit(0)

	_.each(data, function(dialogue, key, list){
		var rej = 0
		_.each(dialogue, function(turn, key, list){
			if (_.keys(turn.outputhash).indexOf(inte)!=-1)
				rej += 1
		}, this)
		sum += rej

		console.log(rej)

		if (rej == 5) console.log(dialogue)
				
	}, this)
	
	console.log(data.length)
	console.log(JSON.stringify(sum, null, 4))
	
	var multi = 0
	var single = 0

	_.each(_.flatten(data), function(turn, key, list){
		if (_.keys(turn.outputhash).indexOf(inte)!=-1)
			if (_.keys(turn.outputhash).length == 1)
				single += 1
			else
				multi += 1
	}, this)

	console.log("multi: "+multi)
	console.log("single: "+single)

	var attr = []
	var content = []

	_.each(_.flatten(data), function(turn, key, list){
		if (_.keys(turn.outputhash).indexOf(inte)!=-1)
			if (_.isObject(turn.outputhash[inte]))
				attr.push(_.keys(turn.outputhash[inte]))
			else
				attr.push(turn.outputhash[inte])

		if (_.keys(turn.outputhash).indexOf(inte)!=-1)
			if (_.keys(turn.outputhash).length == 1)
				content.push(turn.input.text)

	}, this)

	var attr = _.countBy(_.flatten(attr), function(num) { return num })

	console.log(JSON.stringify(attr, null, 4))
	console.log(JSON.stringify(content, null, 4))

}

/*if (check_reject)
{

	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	var utterset = bars.getsetcontext(data)
	
	utterset["test"] = _.shuffle(_.flatten(utterset["test"]))
	utterset["train"] = _.shuffle(_.flatten(utterset["train"]))

	var data = utterset["test"].concat(utterset["train"])

	var sens = []

	_.each(data, function(value, key, list){

		if (value.output.length == 1)
		{
			if (_.keys(JSON.parse(value.output))=="Reject")
				sens.push(value.input.text)
		}

	}, this)

	console.log(JSON.stringify(sens, null, 4))
	process.exit(0)
}
*/


/* "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}": [
        "no company car",
        "So we can agree on without leased car",
        "no car",
*/
if (count_reject)
{

	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	var utterset = bars.getsetcontext(data)
	
	utterset["test"] = _.shuffle(_.flatten(utterset["test"]))
	utterset["train"] = _.shuffle(_.flatten(utterset["train"]))

	var data = utterset["test"].concat(utterset["train"])

	console.log(JSON.stringify(data.length, null, 4))
	
	var labels = {}

	_.each(data, function(value, key, list){

		if (value.output.length == 1)
		{
			var label = JSON.parse(value.output[0])
			var intent = _.keys(label)[0]
			var attr = _.keys(_.values(label)[0])[0]
			if ((intent== "Reject") || (attr=="Leased Car"))
			{
				if (!(JSON.stringify(label) in labels))
					labels[JSON.stringify(label)] = []

				labels[JSON.stringify(label)].push(value.input.text)
			}

		}

	}, this)

	console.log(JSON.stringify(labels, null, 4))
	process.exit(0)
}


if (check_con)
{
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version7_neww.json"))
	var utterset = bars.getsetcontext(data, /*rephrase*/true)
    console.log(JSON.stringify(utterset, null, 4))
    process.exit(0)
}

if (check_rephrase)
{
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version7_neww.json"))
    var data = _.filter(data, function(num){ return ["train"].indexOf(num.set)!=-1 });

    console.log(JSON.stringify(data.length, null, 4))

	/*var intentshash = {
		"Accept":[],
		"Reject":[],
		"Offer":[],
		"Query":[]
	}
*/
	var intentshash = {}


	var lastintent = ""
	var lasttext = false
	var strem = false

	_.each(data, function(dialogue, key, list){
		_.each(dialogue['turns'], function(turn, key, list){
			if (turn.role == "Employer")
			{
				var intents = _.keys(turn.output)
				
				if (intents.length == 1)
				{
					if (strem)
					{	

							// if (intents[0] == lastintent)
							// intentshash[lastintent].push([lasttext, turn.input.text])
					
						if (!(lastintent in intentshash))
							intentshash[lastintent] = {}

						if (!(intents[0] in intentshash[lastintent]))
							intentshash[lastintent][intents[0]] = {'count': 0, 'examples': [] }

						intentshash[lastintent][intents[0]]['count'] += 1
						// intentshash[lastintent][intents[0]]['examples'].push([lasttext, turn.input.text])

						strem = false

					}
					else
					{	
						lastintent = intents[0]
						lasttext = turn.input.text					
					}
				}
			
			}
			if (turn.role == "Candidate")
				if ("data" in turn)
				{
					if (turn.data == "AskRephrase")
						strem = true
				}
				else
				{
					strem = false
				}
				
		}, this)
	}, this)

	console.log(JSON.stringify(intentshash, null, 4))
	process.exit(0)
}


if (check_biased)
{
	// example when rephrase wasn't successful
	var rephrase_total = 0
	var rephrase_success = 0
	var rephrase_unsec_examples = []

	var offer_resquest = 0
	var offer_response = 0

	var query_resquest = 0
	var query_response = 0

	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version3.json"))
	_.each(data, function(dialogue, key, list){
		_.each(dialogue['turns'], function(turn, key, list){

			
			/*if (turn.role == "Candidate" && "output" in turn)
				if (_.keys(turn.output)[0] == "Query")
				{
					offer_resquest += 1
					
					if (_.keys(dialogue['turns'][key+1]["output"])[0] == "Offer")
						offer_response += 1
			}

			if (turn.role == "Candidate" && "data" in turn)
				if (turn.data.indexOf("I have very specific preferences about"))
				{
					query_resquest += 1
					
					if (dialogue['turns'].length > (key + 1))
						if (_.keys(dialogue['turns'][key+1]["output"])[0] == "Query")
							query_response += 1
			}*/

			if (turn.role == "Candidate" && "data" in turn)
				if (turn.data.indexOf("rephrase")!=-1)
				{
					rephrase_total += 1

					if (_.keys(dialogue['turns'][key-1]["output"]).length == 1)
						if (dialogue['turns'].length > (key + 1))
							if ("output" in dialogue['turns'][key + 1])
								if (_.keys(dialogue['turns'][key-1]["output"])[0] == _.keys(dialogue['turns'][key+1]["output"])[0])
									{
										rephrase_success += 1
									}
								else
									{
										var prev = {
												'input': dialogue['turns'][key-1]["input"]["text"],
												'output': dialogue['turns'][key-1]["output"]
													}	

										var next = {
												'input': dialogue['turns'][key+1]["input"]["text"],
												'output': dialogue['turns'][key+1]["output"]
													}

										rephrase_unsec_examples.push([prev, next])
									}
				}
		}, this)
	}, this)

	console.log("Rephrase: "+rephrase_success/rephrase_total)
	console.log("Offer: "+offer_response/offer_resquest)
	console.log("Query: "+query_response/query_resquest)

	console.log(JSON.stringify(rephrase_unsec_examples, null, 4))

	process.exit(0)
}

if (check_human)
{
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version7.json"))
	var utterset = bars.getsetcontext(data, false)
    var train = utterset["train"].concat(utterset["test"])

	var utt = _.flatten(train)

	var count = 0
	_.each(utt, function(value, key, list){
		if (value.role == "Employer")
			count += 1
	}, this)

	console.log(count)
	console.log(utt.length)

	process.exit(0)
}

if (embedproc)
{
	var path = require('path');
	var parsing = {}
	var parsedfiles  = walkSync("/tmp/json/", parsedfiles)

	_.each(parsedfiles, function(file, key, list){
        var id = path.basename(file).split(".")[0]
        parsing[id] = JSON.parse(fs.readFileSync(file, 'utf8'))
    }, this)

	console.log(JSON.stringify(parsing, null, 4))
	process.exit(0)

}

if (extractbyid)
{
	var directory = "/tmp/sen/"
	var sentences = {}
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed_finalized.json"))

	_.each(data, function(dialogue, key, list){
		_.each(dialogue["turns"], function(turn, key, list){
			if (turn.role == "Employer")
			{
				_.each(turn["input"]["trans"], function(value1, key1, list){
					sentences[turn["translation_id"]+"_"+key1] = value1
				}, this)
			}
		}, this)
	}, this)

	_.each(sentences, function(value, key, list){
    	fs.writeFileSync(directory+key, value, 'utf-8')
     }, this)

    fs.writeFileSync(directory+"list", "", 'utf-8')
    _.each(sentences, function(value, key, list){
	    fs.appendFileSync(directory+"list", directory+key+"\n", 'utf-8')
    }, this)

    process.exit(0)
}	

// very useful routine 
if (check_init)
{
	var result = {
					'Offer': {'count':0},
					'Accept':{'count':0},
				  	'Reject':{'count':0},
 					'Query': {'count':0},
				  	'Greet': {'count':0},
				  	'Quit': {'count':0}
				}
	
	// var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed_finalized.json"))
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/version7_neww.json"))
	var utterset = bars.getsetcontext(data, false)
	var dialogues = utterset["test"].concat(utterset["train"])

    // var dialogues = _.filter(data, function(num){ return ["train","test"].indexOf(num.set)!=-1 });

	console.log(dialogues.length)
		
	var int_stat = []
	
	var globallabels = []
/*
	_.each(_.flatten(dialogues), function(value, key, list){		
		
		// if (_.keys(value.outputhash).length==1)
			globallabels = globallabels.concat(_.keys(value.outputhash))
			
	}, this)

	console.log(JSON.stringify(_.countBy(globallabels, function(num) { return num })))
*/
	_.each(dialogues, function(dial, key, list){
		var temp = []
		_.each(dial, function(turn, key, list){
			// var intents = _.map(utters.output, function(num){ return _.keys(JSON.parse(num))[0] })
			// if (_.keys(utters.outputhash).length==1)
			// if (turn.role=="Employer")
				temp = temp.concat(_.keys(turn.outputhash))
			// temp = temp.concat(_.keys(utters.outputhash))
			
		}, this)
		int_stat.push(temp)
	}, this)

	_.each(int_stat, function(intents, key, list){
		int_stat[key] = _.countBy(intents, function(num) { return num })
	}, this)

	console.log(JSON.stringify(int_stat, null, 4))

	_.each(int_stat, function(dial, key, list){
		_.each(dial, function(value, intent, list){
			result[intent]["count"] += value
		}, this)
	}, this)

	var count_sum = _.reduce(_.flatten(_.values(result)), function(memo, num){ return memo + num["count"]; }, 0);

	_.each(result, function(value, intent, list){
		result[intent]["ration"] = value["count"] / count_sum
	}, this)

	_.each(["Offer", "Accept", "Reject", "Query"], function(intent, key, list){
		var intent_list = _.pluck(int_stat, intent);
		result[intent] = _.extend(result[intent], bars.mean_variance(intent_list));
	})

	var leng = []
	_.each(dialogues, function(dial, key, list){
		var dials = _.filter(dial, function(num){ return _.keys(num.outputhash).length == 1; })

		leng.push(dials.length)

	}, this)
	
	console.log(JSON.stringify(result, null, 4))
	console.log("Length: "+ JSON.stringify(leng, null, 4))
	console.log("mean_variance: "+ JSON.stringify(bars.mean_variance(leng), null, 4))

	process.exit(0)
}

// simple composite labeling with test/train
if (simple_naive_test_train)
{
 	bars.cleanFolder("/tmp/logs")

	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed_finalized.json"))
    var utterset = bars.getsetcontext(data)

    console.log(utterset["train"].length)
    console.log(utterset["test"].length)

	utterset["train"] = _.flatten(utterset["train"])
	utterset["test"] = _.flatten(utterset["test"])

	console.log(utterset["train"].length)
    console.log(utterset["test"].length)

    utterset["train"] = bars.processdataset(utterset["train"],{"intents": false, "filter":false})
	utterset["test"] = bars.processdataset(utterset["test"],{"intents": false, "filter":false})

	trainAndTest.trainAndTest_async(classifier.Natural_no_con, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), function(err, results){
		console.log(JSON.stringify(results, null, 4))
		process.exit(0)
	}, this)	
}

if (reshuffle)
{
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	var data = _.filter(data, function(num){ return ["train", "test"].indexOf(num.set) != -1 });

	_.each(data, function(value, key, list){
		data[key]["set"] = "train"
	}, this)

	data = _.shuffle(data)

	_(20).times(function(n){ 
		var key = _.random(0, 100);
		data[key]["set"] = "test"
	});

	console.log(JSON.stringify(data, null, 4))

	var cou = _.countBy(data, function(num) {return num.set})
	console.log(JSON.stringify(cou, null, 4))
	process.exit(0)
}

if (simple_naive_intent_test_train_intents)
{
 	bars.cleanFolder("/tmp/logs")

	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed_finalized.json"))
    var utterset = bars.getsetcontext(data)

    console.log(utterset["train"].length)
    console.log(utterset["test"].length)

	utterset["train"] = _.flatten(utterset["train"])
	utterset["test"] = _.flatten(utterset["test"])

	console.log(utterset["train"].length)
    console.log(utterset["test"].length)

    utterset["train"] = bars.processdataset(utterset["train"],{"intents": true, "filter":false})
	utterset["test"] = bars.processdataset(utterset["test"],{"intents": true, "filter":false})

	trainAndTest.trainAndTest_async(classifier.Natural_no_con, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), function(err, results){
		console.log(JSON.stringify(results, null, 4))
		process.exit(0)
	}, this)	
}

// add trans to finalized parsed
/*if (finalization)
{

	var trans = {}
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed_trans_new.json"))
	
	_.each(data, function(dialogue, key, list){
		_.each(dialogue["turns"], function(turn, key, list){
			if (turn.role == "Employer")
			{
				if (!("trans" in turn["input"]))
					throw new Error("error")
				trans[turn.translation_id] = turn["input"]["trans"]
			}
		}, this)
	}, this)


	var data1 = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed_finalized.json"))
	_.each(data1, function(dialogue, key, list){
		_.each(dialogue["turns"], function(turn, key, list){
			if (turn.translation_id in trans)
				turn["input"]["trans"] = trans[turn.translation_id]
		}, this)
	}, this)

	console.log(JSON.stringify(data1, null, 4))
}
*/

// turns all Queries to consistent 
if (consistent_query)
{
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed_finalized.json"))

	_.each(data, function(dialogue, dkey, list){
		_.each(dialogue["turns"], function(turn, tkey, list){
			if ("output" in turn)
				if ("Query" in turn.output)
				{
					var ob = turn["output"]["Query"]
					if (_.isObject(ob))
					{
						if (_.keys(ob).length > 1)
						{
							console.log(JSON.stringify(turn.output, null, 4))
							process.exit(0)
						}
						else
						{
							data[dkey]["turns"][tkey]["output"]["Query"] = _.values(turn["output"]["Query"])[0]
						}
					}
					else
					{
						if (ob == "Offer")
							data[dkey]["turns"][tkey]["output"]["Query"] = true
						else
							{
								console.log(JSON.stringify(turn.output, null, 4))
								process.exit(0)
							}
					}
				}
		}, this)
	}, this)

	console.log(JSON.stringify(data, null, 4))
	process.exit(0)
}

// get the accuracy of regexp to identify issues and values
if (check_regexp)
{
	var stats = new PrecisionRecall()

	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed_finalized.json"))
    var utterset = bars.getsetcontext(data)
    var dataset = _.flatten(utterset.train.concat(utterset.test))
    dataset = bars.processdataset(dataset, {"intents": false, "filter":false})

    _.each(dataset, function(value, key, list){
		var found = classifier.getRule(value["input"]["sentences"]).labels
		found = _.flatten(found)

		var actual = bars.parseoutput(value["outputhash"])
		var exp = stats.addCasesHash(actual, found, true)
		
		if (("FP" in exp)||("FN" in exp))
		{
			console.log(value["input"]["text"])
			console.log(JSON.stringify(value["outputhash"], null, 4))
			console.log(JSON.stringify(exp, null, 4))
			
		}
		var exp = stats.addIntentHash(actual, found, true)

    }, this)

	stats.calculateStats()
    console.log(JSON.stringify(stats, null, 4))
    process.exit(0)
}

if (composite_ds)
{
    bars.cleanFolder("/tmp/logs")

	var data1 = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed_finalized.json"))
    var utterset = bars.getsetcontext(data1, /*rephrase*/true)

	utterset["train"] = bars.processdataset(_.flatten(utterset["train"]), {"intents": true, "filter":true})
	utterset["test"] = _.flatten(utterset["test"])
	
	var mapping = []
	var test_set = []

	// prepare single sentence testSet in usualy format  
	_.each(utterset["test"], function(turn, vkey, list){

		utterset["test"][vkey]["actual"] = []

		_.each(turn["input"]["sentences"], function(value, key, list){

			var record = {"input":{"context":[]}}
			var text = _.reduce(value["tokens"], function(memo, num){ return memo +" "+ num.word; }, "");
			
			record["input"]["text"] = text
			record["input"]["context"] = turn["input"]["context"]
			record["input"]["sentences"] = {"tokens": value["tokens"]}
			// mapping[text] = vkey

			test_set.push(record)
			mapping.push(vkey)

		}, this)

	}, this)

	var test_set_copy = bars.copyobj(test_set)
	var classif = new classifier.Natural
	var classes = []
	var currentStats = new PrecisionRecall()

	classif.trainBatchAsync(utterset["train"], function(err, results){
		classif.classifyBatchAsync(test_set_copy, 50, function(error, test_results){
		
			_.each(test_results, function(value, key, list){
				var attrval = classifier.getRule(test_set[key]["input"]["sentences"]).labels
				var cl = bars.coverfilter(bars.generate_possible_labels(bars.resolve_emptiness_rule([value.output, attrval[0], attrval[1]])))
				utterset["test"][mapping[key]]["actual"].push(cl)
			}, this)

			_.each(utterset["test"], function(value, key, list){
				var cla = _.flatten(value["actual"])
				utterset["test"][key]["exp"] = currentStats.addCasesHash(value.output, cla, true)
				currentStats.addIntentHash(value.output, cla, true)
			}, this)

			currentStats.calculateStats()
			console.log(JSON.stringify(utterset["test"], null, 4))
			console.log(currentStats, null, 4)
			process.exit(0)
			
		})
	})
}


if (check_ds)
{

// 70
// 966
// ----
// 35
// 518

// PERF
// "TP": 487,
// "FP": 95,
// "FN": 181,

// Linear
// "TP": 492,
// "FP": 100,
// "FN": 176,

//	var dataset = bars.loadds("../negochat_private/dialogues")
//
/*	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json.clean"))
	var utterset = bars.getsetcontext(data)

	// var stats = {}

	// _.each(data, function(value, key, list){
	// 	stats[value['gameid']] = _.countBy(value['turns'], function(turn) { if (turn.role == "Employer") return 'match' });
	// }, this)	

	
	//utterset["train"] = utterset["train"].slice(0,20)
	//utterset["test"] = utterset["test"].slice(0,5)

	console.log("Train in dials:"+utterset["train"].length)
	console.log("Test in dials:"+utterset["test"].length)
	
	utterset["test"] = _.flatten(utterset["test"])
	utterset["train"] = _.flatten(utterset["train"])

	// utterset["train"] = _.filter(utterset["train"], function(num){ return num.output.length <= 1 });

	console.log("Train in utts:"+utterset["train"].length)
	console.log("Test in utts:"+utterset["test"].length)
	
	// concat tokens for primitive classification
*//*
	_.each(utterset["test"], function(utterance, key, list){
		var tokens = _.flatten(_.pluck(utterance['input']['sentences'], 'tokens'))
		utterset["test"][key]['input']['sentences'] = [{'tokens': tokens}]
	}, this)

	_.each(utterset["train"], function(utterance, key, list){
		var tokens = _.flatten(_.pluck(utterance['input']['sentences'], 'tokens'))
		utterset["train"][key]['input']['sentences'] = [{'tokens': tokens}]
	}, this)

*/
/*	_.each(utterset["train"], function(utterance, key, list){
		var tokens = _.flatten(_.pluck(utterance['input']['sentences'], 'tokens'))
		utterset["train"][key]['input']['sentences'] = [{'tokens': tokens}]
	}, this)

	_.each(utterset["test"], function(utterance, key, list){
		var tokens = _.flatten(_.pluck(utterance['input']['sentences'], 'tokens'))
		utterset["test"][key]['input']['sentences'] = [{'tokens': tokens}]
	}, this)

	_.each(utterset["train"], function(utterance, key, list){
		utterset["train"][key]['output'] = _.unique(_.keys(utterance.outputhash))
	}, this)

	_.each(utterset["test"], function(utterance, key, list){
		utterset["test"][key]['output'] = _.unique(_.keys(utterance.outputhash))
	}, this)
*/
	/*var count = 0
	_.each(utterset["test"].concat(utterset["train"]), function(value, key, list){
		if (value.output.indexOf("{\"Offer\":{\"Pension Fund\":\"No agreement\"}}")!=-1)
		{
			console.log(JSON.stringify(value, null, 4))
			count +=1
		}
	}, this)

	console.log(JSON.stringify(count, null, 4))
	process.exit(0)
	*/
	

	// _.each(utterset["train"], function(value, key, list){
	// 	if (value.input.context.lenght == 0)
	// 		console.log(JSON.stringify(value, null, 4))
	// }, this)
	// process.exit(0)

	// var stats = trainAndTest.trainAndTest_batch(classifier.DS_bigram, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), 50)
	// var stats = trainAndTest.trainAndTest_hash(classifier.DS_bigram, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), 50)
	// var stats_cl = trainAndTest.trainAndTest_hash(classifier.DS_bigram, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), 5)

	// var stats = trainAndTest.trainAndTest_hash(classifier.DS_bigram_split, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), 50)
	// console.log(JSON.stringify(stats, null, 4))

	//trainAndTest.trainAndTest_async(classifier.DS_bigram_split_embed, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), function(err, results){
	

	
/*	trainAndTest.trainAndTest_async(classifier.unbiased, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), function(err, results){
		console.log(JSON.stringify(results, null, 4))
		process.exit(0)
	}, this)
*/
    bars.cleanFolder("/tmp/logs")

	var data1 = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed_tran.json"))
    var utterset = bars.getsetcontext(data1, /*rephrase*/true)

	//utterset["train"] = bars.processdataset(_.flatten(utterset["train"]), 'test')
//	utterset["train"] = bars.processdataset(_.flatten(utterset["train"]), 'test')
	
	// utterset["train"] = bars.processdatasettrain(_.flatten(utterset["train"]))
	// utterset["test"] = bars.processdatasettest(_.flatten(utterset["test"]))

	utterset["train"] = _.flatten(utterset["train"])
	utterset["test"] = _.flatten(utterset["test"])

	console.log("train.length="+utterset["train"].length)
	console.log("test.length="+utterset["test"].length)

	// _.each(utterset["train"], function(turn, key, list){
		// delete utterset["train"][key]["input"]["sentences"]
	// }, this)

	// _.each(utterset["test"], function(turn, key, list){
		// delete utterset["test"][key]["input"]["sentences"]
	// }, this)

	
//	utterset["train"] = _.filter(utterset["train"], function(num){ return _.keys(num.outputhash).length <= 1 })

//NLU_Unbiased_Bin:
//NLU_Baseline

	trainAndTest.trainAndTest_async(classifier.DS_Component_wise, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), function(err, results){
		console.log(JSON.stringify(results, null, 4))
		process.exit(0)
	}, this)

		// var stats = trainAndTest.trainAndTest_hash(classifier.DS_primitive, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]))
		// console.log(JSON.stringify(stats, null, 4))
		// process.exit(0)

		
		// _.each(results['data'], function(val, key, list){
		// 	// if (('FP' in val.explanation) && ('FN' in val.explanation))
		// 	if ('FP' in val.explanation)
		// 	{
		// 		// if (val.explanation.FP.indexOf("{\"Reject\":true}")!=-1)
		// 			if (val.explanation.FP.indexOf("{\"Reject\":{\"Leased Car\":\"With leased car\"}}")!=-1)
		// 					console.log(JSON.stringify(val, null, 4))

				
		// 		// delete val.input.sentences
		// 		// console.log(JSON.stringify(val, null, 4))
		// 	}
		// }, this)

		

		// _.each(results.data, function(value, key, list){
		// 	if (!_.isEqual(results.data[key].explanation, stats.data[key].explanation))
		// 	{
		// 		console.log("sync")
		// 		console.log(JSON.stringify(stats.data[key], null, 4))
		// 		console.log("async")
		// 		console.log(JSON.stringify(results.data[key], null, 4))
		// 	}
		// }, this)
	// })
	


	// trainAndTest.trainAndTest_async(classifier.DS_bigram_split, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), function(error, results){
	// 	console.log(JSON.stringify(results, null, 4))
	// })
}

if (do_small_temporary_serialization_test) {
	var classifier = createNewClassifier(); 
	classifier.trainBatch(collectedDatasetSingle);
	console.log("\nConvert to string, and test on training data again");
	serialization.toStringVerified(classifier, createNewClassifier, __dirname, collectedDatasetSingle, /*explain=*/4);
	process.exit(1);
}

if (do_cross_dataset_testing) {
	verbosity=0;
	
	console.log("Train on grammar, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset, collectedDatasetMulti8, verbosity).shortStats())+"\n";
//	console.log("Train on grammar+single1, test on multi8: "+
//			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+multi1, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single1+multi1, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti), collectedDatasetMulti8, verbosity).shortStats())+"\n";

	console.log("Train on grammar+multi2, test on multi8: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
//	console.log("Train on grammar+single2, test on multi8: "+
//		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single2+multi2, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle2).concat(collectedDatasetMulti2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	
//	console.log("Train on grammar+multi1+multi2, test on multi8: "+
//		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti).concat(collectedDatasetMulti2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
//	console.log("Train on grammar+single1+single2, test on multi8: "+
//		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetSingle2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single1+multi1+single2+multi2, test on multi8: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti).concat(collectedDatasetSingle2).concat(collectedDatasetMulti2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	
//	console.log("\nTrain on grammar+single1+multi8, test on multi2: "+
//		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti8), collectedDatasetMulti2, verbosity).shortStats())+"\n";
//	console.log("Train on grammar+single1+multi1+multi8, test on multi2: "+
//			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti).concat(collectedDatasetMulti8), collectedDatasetMulti2, verbosity).shortStats())+"\n";

//	console.log("\nTrain on grammar data, test on woz single class: "+
//		trainAndTest(createNewClassifier, grammarDataset, collectedDatasetSingle, verbosity).shortStats())+"\n";
//	console.log("Train on grammar data, test on woz multi class: "+
//		trainAndTest(createNewClassifier, grammarDataset, collectedDatasetMulti, verbosity).shortStats())+"\n";
	console.log("\nTrain on woz single class, test on woz multi class: "+
		trainAndTest(createNewClassifier, collectedDatasetSingle, collectedDatasetMulti, verbosity).shortStats())+"\n";
	console.log("Train on woz multi class, test on woz single class: "+
		trainAndTest(createNewClassifier, collectedDatasetMulti, collectedDatasetSingle, verbosity).shortStats())+"\n";

	collectedDatasetMultiPartition = partitions.partition(collectedDatasetMulti, 0, collectedDatasetMulti.length/2);
	collectedDatasetSinglePartition = partitions.partition(collectedDatasetSingle, 0, collectedDatasetSingle.length/2);
	console.log("Train on mixed, test on mixed: "+
		trainAndTest(createNewClassifier, 
			collectedDatasetMultiPartition.train.concat(collectedDatasetSinglePartition.train), 
			collectedDatasetMultiPartition.test.concat(collectedDatasetSinglePartition.test), 
			verbosity).shortStats())+"\n";
	console.log("Train on mixed, test on mixed (2): "+
		trainAndTest(createNewClassifier, 
			collectedDatasetMultiPartition.test.concat(collectedDatasetSinglePartition.test), 
			collectedDatasetMultiPartition.train.concat(collectedDatasetSinglePartition.train), 
			verbosity).shortStats())+"\n";
} // do_cross_dataset_testing

if (do_final_test) {
	verbosity=0;
	
	["Employer"/*,"Candidate"*/].forEach(function(classifierName) {
		console.log("\nFinal test for "+classifierName);

		var grammarDataset = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/0_grammar.json"));
		var collectedDatasetMulti = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/1_woz_kbagent_students.json"));
		var collectedDatasetSingle = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/1_woz_kbagent_students1class.json"));
		var collectedDatasetMulti2 = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/2_experts.json"));
		var collectedDatasetSingle2 = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/2_experts1class.json"));
		var amtDataset = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/3_woz_kbagent_turkers_negonlp2.json"));
		
		console.log("Train on grammar, test on AMT: "+
				trainAndTest(createNewClassifier, grammarDataset, amtDataset, verbosity).shortStats())+"\n";
		console.log("Train on grammar+multi1, test on AMT: "+
				trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti), amtDataset, verbosity).shortStats())+"\n";
		console.log("Train on grammar+single1+multi1, test on AMT: "+
				trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti), amtDataset, verbosity).shortStats())+"\n";
		console.log("Train on grammar+multi2, test on AMT: "+
				trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti2), amtDataset, verbosity).shortStats())+"\n";
		console.log("Train on grammar+single2+multi2, test on AMT: "+
				trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle2).concat(collectedDatasetMulti2), amtDataset, verbosity).shortStats())+"\n";
		console.log("Train on grammar+single1+multi1+single2+multi2, test on AMT: "+
				trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti).concat(collectedDatasetSingle2).concat(collectedDatasetMulti2), amtDataset, verbosity).shortStats())+"\n";
	});
} // do_final_test

if (do_cross_validation) {
	verbosity=0;

	var numOfFolds = 5; // for k-fold cross-validation
	var microAverage = new PrecisionRecall();
	var macroAverage = new PrecisionRecall();
	
	var constantTrainSet = (grammarDataset).concat(collectedDatasetSingle);
	var devSet = (collectedDatasetMulti2).concat(collectedDatasetMulti8);
	var startTime = new Date();
	console.log("\nstart "+numOfFolds+"-fold cross-validation on "+grammarDataset.length+" grammar samples and "+collectedDatasetSingle.length+" single samples and "+devSet.length+" collected samples");
	partitions.partitions(devSet, numOfFolds, function(trainSet, testSet, index) {
		var stats = trainAndTest(createNewClassifier,
			trainSet.concat(constantTrainSet), testSet, verbosity,
			microAverage, macroAverage).shortStats();
		console.log("partition #"+index+": "+(new Date()-startTime)+" [ms]: "+stats);
	});
	//_(macroAverage).each(function(value,key) { macroAverage[key] = value/numOfFolds; });
	console.log("end "+numOfFolds+"-fold cross-validation: "+(new Date()-startTime)+" [ms]");

	//if (verbosity>0) {console.log("\n\nMACRO AVERAGE FULL STATS:"); console.dir(macroAverage.fullStats());}
	//console.log("\nMACRO AVERAGE SUMMARY: "+macroAverage.shortStats());

	microAverage.calculateStats();
	console.log("MICRO AVERAGE SUMMARY: "+microAverage.shortStats());
} // do_cross_validation

if (do_serialization_prod) {

        var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
        var utterset = bars.getsetcontext(data)

        utterset["test"] = _.flatten(utterset["test"])
        utterset["train"] = _.flatten(utterset["train"])

        var clas = createNewClassifier()

        clas.trainBatchAsync(bars.copyobj(utterset["train"]).concat(bars.copyobj(utterset["test"])), function(err,results){
            fs.writeFileSync("trainedClassifiers/Employer-usa/MostRecentClassifier.json", serialization.toString(clas, createNewClassifier, __dirname), 'utf8')
            console.log("done")
            process.exit()
        })
}

if (do_serialization) {
	verbosity=0;
		["Employer-egypt-translate", "Employer-egypt-generate", "Employer-egypt"].forEach(function(classifierName) {
		console.log("\nBuilding classifier for "+classifierName);
		var classifier = createNewClassifier();
		var jsonEmpty = classifier.toJSON();  // just to check that it works

		try { var datasetNames = fs.readdirSync("datasets/" + classifierName) }

		catch (e)
		{	
			throw new Error(e);
		}

		var dataset = datasetNames.reduce(function(previous, current) {
			return previous.concat(
				JSON.parse(
					fs.readFileSync(
						"datasets/"+classifierName+"/" + current )));
		}, []);

		console.log("\nstart training on "+dataset.length+" samples"); var startTime = new Date();
		classifier.trainBatch(dataset);
		console.log("end training on "+dataset.length+" samples, "+(new Date()-startTime)+" [ms]");

		if (do_test_on_training_data) console.log("\ntest on training data: " + test(classifier, dataset).shortStats());

		console.log("\nConvert to string, and test on training data again");
		fs.writeFileSync("trainedClassifiers/"+classifierName+"/MostRecentClassifier.json", 
			(do_test_on_training_data? 
					serialization.toStringVerified(classifier, createNewClassifier, __dirname, dataset):
					serialization.toString(classifier, createNewClassifier, __dirname))
			, 'utf8');
	});
} // do_serialization
