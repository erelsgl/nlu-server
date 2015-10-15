/**
 * Trains and tests the NLU component.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */


var async = require('async');
var Hierarchy = require(__dirname+'/Hierarchy');

// var intent_stat = false
// var add_context = false
// var convert_tran = false
// var try_sequence = false
// var prepare_sequence = false
// var compare_performance = false
// var project_dataset = false
// var prepare_truthteller = false
// var do_separate_dialogue = false
// var test_conv = false
// var sample_kbagent = false
// var do_coverage = false
// var do_coverage_version2 = false
// var do_separate_datasets = false
// var test_aggregate_errors = false
// var test_aggregate_keyphases = false
// var test_underscore = false
// var test_error_analysis = false
// var test_keywords = false
// var test_egypt = false
// var test_natural = false
// var test_spell = false
// var test_segmentation = false
// var do_spell_correction_test = false
// var do_compare_approach = false
// var do_partial_classification = false
// var do_unseen_word_fp = false
// var do_unseen_word_curve = false
// var do_checking_tag = false
// var do_small_temporary_test = false

// var do_small_temporary_serialization_test = false
var test_phrases = false
var test_initiative = false
var test_label = false
var test_distance = false

var check_ds = true

var wikipedia_boc = false
var wikipedia_prepared1 = false
var wikipedia_fit = false
var wikipedia_json = false
var technion_300 = false
var wikipedia_test = false
var wikipedia_categories = false
var wikipedia_prepared = false
var wikipedia_parsed = false
var wikipedia_stats = false
var index_wordnet = false
var reuters = false
var test_proportion = false
var trans = false
var test_ppdb = false
var test_knn = false
var test_clust = false
var do_learning_curves = false
var test_pp = false

var test_approaches = false
var do_test_seed = false
var check_dial = false
var do_keyphrase_predict_annotaiton = false
var counting = false
var default_intent_analysis = false
var keyphrase_transformation = false
var shuffle = false
var sequnce_classification = false
var test_gaby = false
var new_dial_stats = false
var test_dataset = false
var prepare_dataset_for_gaby1 = false
var prepare_dataset_for_gaby = false
var do_keyphrase_only_rule = false
var do_small_temporary_serialization_test = false
var do_mlrule = false
var do_test_sagae = false
var do_cross_dataset_testing = false
var do_learning_curves_dialogue = false
var do_final_test = false
var do_cross_validation = false
var do_serialization = false
var do_test_on_training_data = false
var do_small_temporary_test_dataset = false
var do_small_test_multi_threshold = false
var naive = false
var naive1 = false
var count_2_intents_2_attributes = false
var do_comparison = false
var regexnor = false
var just_test = false
var do_keyphrase_annotaiton = false
var do_keyphrase_gold_annotaiton = false
var do_pull_all_utterance_to_file = false

var _ = require('underscore')._;
var fs = require('fs');
var trainAndTest= require('./utils/trainAndTest').trainAndTest_hash;
var Hierarchy = require(__dirname+'/Hierarchy');
var multilabelutils = require('limdu/classifiers/multilabel/multilabelutils');
var trainutils = require('./utils/bars')
var wikipedia = require('./utils/wikipedia')
var bars = require('./utils/bars')
var rules = require("./research/rule-based/rules.js")


var verbosity = 0;
var explain = 0;

var cheapest_paths = require('limdu/node_modules/graph-paths').cheapest_paths;
var natural = require('natural');
var partitions = require('limdu/utils/partitions');
var PrecisionRecall = require('limdu/utils/PrecisionRecall');
var trainAndTest = require('./utils/trainAndTest');
var serialization = require('serialization');
var limdu = require("limdu");
var ftrs = limdu.features;

// var Fiber = require('fibers');

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

function parse_filter(parse)
{
        _.each(parse['sentences'], function(value, key, list){
                delete parse['sentences'][key]['basic-dependencies']
                delete parse['sentences'][key]['collapsed-dependencies']
                delete parse['sentences'][key]['tokens']
        }, this)

        return parse
}


if (wikipedia_prepared1)
{
	var folder = __dirname+"/../wiki/en/categories/"

	var categories = wikipedia.load_category(folder)

	var hier = wikipedia.wikipedia_pickclass(categories, "695042")
	
	console.log(JSON.stringify(hier, null, 4))
	
	wikipedia.check_cross(hier, categories)

	wikipedia.wikipedia_prepared(hier)

	process.exit(0)

}


if (wikipedia_test)
{

	var data = wikipedia.load_wikipedia("social")

	var data = _.map(data, function(value){ var elem = {}
											// value["CORENLP"]["sentences"].splice(3, value["CORENLP"]["sentences"].length)
//											value["CORENLP"]["sentences"].splice(0, 5)
											elem['input'] = value
											elem['input']['input'] = value["text"]
											elem['output'] = value['catid']
											return elem
										})


	data = _.shuffle(data)
	data.splice(300)

	var results = {}
	var resultsm = {}
	var labels = {}

	var dataset = partitions.partition(data, 1, Math.round(data.length*0.5))

	console.log("train "+dataset["train"].length)
	console.log("test "+dataset["test"].length)


	trainAndTest.trainAndTest_async(classifier['TCBOC'], dataset['train'], dataset['test'], function(err, stats){

		console.log(JSON.stringify(stats['stats'], null, 4))

	})
}

if (test_pp)
{
	var ppdb = require("./research/ppdb/utils.js")
	var framework = require("./research/ppdb/evalmeasure_framework")
	var modes = require("./research/ppdb/modes")
	var output = {}


	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core.json"))	
	var train= bars.extractdataset(bars.filterdataset(data, 5))

    async.eachSeries(train, function(value, callback1){
    	async.eachSeries(Object.keys(value['intent_absolute']), function(intent, callback2){
    		var keyphrase = value['intent_absolute'][intent]
			console.log("level 0")
			console.log(keyphrase)
			console.log("-----------------")


    		async.eachSeries(modes.skipexpansion(keyphrase).concat(keyphrase), function(skip, callback3){
    			// if (!(skip in output))
    			// {
		         	ppdb.recursionredis([skip], [2], false, function(err,results) {
						results = results.splice(1,results.length-1)
						output[skip] = results

    					async.eachSeries(results, function(value1, callback4){
    						// if !t((value1 in output))
    						// {
								// console.log("level 1")
								// console.log(value1)

		         				ppdb.recursionredis([value1], [2], false, function(err,results1) {
									results1 = results1.splice(1,results1.length-1)
									output[value1] = results1

    								async.eachSeries(results1, function(value2, callback5){
    									// if (!(value2 in output))
    									// {
											// console.log("level 2")
											// console.log(value2)

		         							ppdb.recursionredis([value2], [2], false, function(err,results2) {
												results2 = results2.splice(1,results2.length-1)
												output[value2] = results2
												callback5()
    												
    										})

    									// }else callback5()
    								},function(err){callback4()})
		         				})
    						// }else callback4()
						}, function(err){callback3()})
		         	})
	         	// }else callback3()
		}, function(err){callback2()})
	}, function(err){callback1()})
	}, function(err){
			fs.writeFileSync(__dirname + "/buffer_ppdb", JSON.stringify(output, null, 4), 'utf-8')
			console.log("end")})

}

if (test_approaches)
{
	var framework = require("./research/ppdb/evalmeasure_framework")
	var modes = require("./research/ppdb/modes")

	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core.json"))	
	var train= bars.extractdataset(bars.filterdataset(data, 5))

	var test = []
	_.each(data, function(value, key, list){test = test.concat(bars.extractdial_test(value))}, this)

	var stats_or = framework.trainandtest(bars.copyobj(train), bars.copyobj(test), [modes.intent_dep])
	var stats_ppdb = framework.trainandtest(bars.copyobj(train), bars.copyobj(test), [modes.predicate])

	console.log("original stats")
	console.log(JSON.stringify(stats_or[0]['stats'], null, 4))
	
	console.log("ppdb stats")
	console.log(JSON.stringify(stats_ppdb[0]['stats'], null, 4))

	console.log("ppdb data")
	console.log(JSON.stringify(stats_ppdb[0]['data'], null, 4))

	// _.each(stats[0]['data'], function(value, key, list){ 
		// if (_.isEqual(value['results']['FN'],["Offer"]))
			// console.log(JSON.stringify(value, null, 4))
	// }, this)

	console.log("contribution of PPDB")
	_.each(stats_ppdb[0]['data'], function(turn, key, list){ 

		if (('FN' in turn['results']) && ('FN' in stats_or[key]['results']))
		{
			if (turn['results']['FN'].length < stats_or[key]['results']['FN'].length)
				{	
					console.log("contribution of PPDB")
					console.log("PPDB")
					console.log(turn)
					console.log("original")
					console.log(stats_or[key])
					console.log("---------------------------------")
				}
		}

		if (('FP' in turn['results']) && ('FP' in stats_or[key]['results']))
		{
			if (turn['results']['FP'].length > stats_or[key]['results']['FP'].length)
				{	
					console.log("FP of PPDB")
					console.log("PPDB")
					console.log(turn)
					console.log("original")
					console.log(stats_or[key])
					console.log("---------------------------------")
				}			
		}

	}, this)
}

if (test_proportion)
{


	var output = []
	var test = []
	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core.json"))	
	_.each(data, function(value, key, list){test = test.concat(bars.extractdial_test(value))}, this)

	console.log(test.length)
	
	// var  data= bars.filterdataset(data, 5)

	// _.each(data, function(dial, key, list){ 
	// 	console.log(dial['users'][0])
	// }, this)

	// var ext = bars.extractdataset(data)	
	ext = test
	console.log(ext.length)

	_.each(ext, function(value, key, list){ 
		output = output.concat(Hierarchy.splitPartEquallyIntent(value['output']))
	}, this)

	var gr = _.countBy(output, function(num){ return num });

	var sum = 0
	_.each(gr, function(value, key, list){ 
		sum += value
	}, this)

	_.each(gr, function(value, key, list){ 
		gr[key] = gr[key]/sum
	}, this)

	console.log(JSON.stringify(gr, null, 4))

	process.exit(0)
}

if (test_clust)
{


	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core_tr.json"))	
	var filtered = bars.filterdataset(data, 5)
	var ext = bars.extractdataset(filtered)

	var lab = {}
	
	_.each(ext, function(value, key, list){ 

		var senlab = Hierarchy.splitPartEquallyIntent(value['output'])

		if (senlab.length == 1)
			{
				if (!(senlab[0] in lab))
					lab[senlab[0]] = []

				lab[senlab[0]].push(smart_normalizer(value['input']))
			}

	}, this)


console.log("@RELATION kNN")
console.log("@ATTRIBUTE\tDATA\tSTRING")
console.log("@ATTRIBUTE\tclass\t{"+Object.keys(lab).join(",")+"}")
console.log("@DATA")

_.each(lab, function(value, key, list){ 
	_.each(value, function(value1, key1, list1){
		console.log("'"+value1+"',"+key) 
	}, this)
}, this)

}	
		


if (trans)
{	
	var MsTranslator = require('mstranslator');

	var client = new MsTranslator({
      client_id: "kbNsIlbmg"
      , client_secret: "kbNsIlbmg4mPZUW9bvhUBCRWmihEOHYWpRziHzRCW14="
    }, true);

	var lag = 'ru'
	var dialogues = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core_tr.json"))	
	var dial = []

	_.each(dialogues, function(dialogue, key, list){ 
		if (bars.isactivedialogue(dialogue))
			{	
				var turns = _.filter(dialogue['turns'], function(turn){ return (bars.isactiveturn(turn) && bars.ishumanturn(turn) && bars.isseqturn(turn) && bars.ispermittedturn(turn)) == true; })
				if (turns.length>=10)
					dial.push(key)
			}
	}, this)

	async.eachSeries(dial, function(index, callback1){ 

		dialogues[index]['status'] = 'paraconv'
		var key = -1

		async.eachSeries(dialogues[index]['turns'], function(turn, callback2){ 

			key += 1

			if (bars.isactiveturn(turn) && bars.ishumanturn(turn) && bars.isseqturn(turn) && bars.ispermittedturn(turn))
			{
				
				if (!('paraphrases' in turn))
					dialogues[index]['turns'][key]['paraphrases'] = {}

				if (!(lag in dialogues[index]['turns'][key]['paraphrases']))
				{

					var input = normalizer(turn['input'])
					var params = { text: input, from: 'en', to: lag}
				
					client.translate(params, function(err, translated) {
	          			
	          			var params = { text: translated, from: lag, to: 'en'}
	          			
	          			console.log(translated)

						client.translate(params, function(err, translatedback) {

							console.log(translatedback)

							var sentence = []
							sentence.push(turn['input'])
							sentence.push(input)
							sentence.push(translated)
							sentence.push(translatedback)
							sentence.push(normalizer(translatedback))

							dialogues[index]['turns'][key]['paraphrases'][lag] = sentence

							callback2()
						})
	    			})
				}
				else callback2()
    		}
    		else callback2()
			
		}, function(err){
			callback1()
		})
	}, function(err){

		console.log(JSON.stringify(dialogues, null, 4))
		process.exit(0)
			
	},this)

}

// 91% - 85%
if (test_label)
{
	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core.json"))
	var filtered = bars.filterdataset(data, 5)
	var ext = bars.extractdataset(filtered)

	console.log("dialogues " + filtered.length)

	var doubles = []
	
	var all = ext.length
	var single = 0

	_.each(ext, function(value, key, list){ 
		if (Hierarchy.splitPartEquallyIntent(value['output']).length == 1)
			single += 1
		else
			doubles.push(Hierarchy.splitPartEquallyIntent(value['output']))
	}, this)

	console.log(JSON.stringify(filtered, null, 4))


	console.log(all)
	console.log(single)
	console.log(single/all)
	process.exit(0)
}

if (test_phrases)
{
	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core.json"))

	_.filter(data, function(num){ return num[""] == 0; });

	var filtered = bars.filterdataset(data, 5)
	var ext = bars.extractdataset(data)
	
	console.log(JSON.stringify(ext, null, 4))
	process.exit(0)


	var dataset = partitions.partition(ext, 1, Math.round(dataset.length*0.5))
	

	stats = trainAndTest_hash(classifier.IntentClass, bars.copyobj(testset), 5)


	

	process.exit(0)


	var distances = []

	var count = 0

	_.each(ext, function(value, key, list){ 
		if ('intent_absolute' in value)
		{
			if (Object.keys(value['intent_absolute']).length == 1)
			{
				count += 1
				// console.log(value["input"])
				var norm = smart_normalizer(value["input"]).trim()
				var keyphrase = _.values(value['intent_absolute'])[0].trim()
				var dist = natural.DiceCoefficient(norm,keyphrase)

				console.log(norm)
				console.log(keyphrase)
				console.log(dist)
				console.log("")

				distances.push(dist)

			}
		}
	}, this)

	
	var dist = _.countBy(distances, function(num) { return num.toFixed(1) })
	// var dist = _.countBy(distances, function(num) { return num % 10 })

	console.log(JSON.stringify(dist, null, 4))
	console.log(count)
	process.exit(0)
}

if (test_distance)
{
	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core.json"))
	// var filtered = bars.filterdataset(data, 5)
	var ext = bars.extractdataset(data)
	var distances = []

	var count = 0

	_.each(ext, function(value, key, list){ 
		if ('intent_absolute' in value)
		{
			if (Object.keys(value['intent_absolute']).length == 1)
			{
				count += 1
				// console.log(value["input"])
				var norm = smart_normalizer(value["input"]).trim()
				var keyphrase = _.values(value['intent_absolute'])[0].trim()
				var dist = natural.DiceCoefficient(norm,keyphrase)

				console.log(norm)
				console.log(keyphrase)
				console.log(dist)
				console.log("")

				distances.push(dist)

			}
		}
	}, this)

	
	var dist = _.countBy(distances, function(num) { return num.toFixed(1) })
	// var dist = _.countBy(distances, function(num) { return num % 10 })

	console.log(JSON.stringify(dist, null, 4))
	console.log(count)
	process.exit(0)
}


// man
// {
//     "Greet": 40,
//     "Offer": 195,
//     "Accept": 98,
//     "Reject": 49,
//     "Insist": 1
// }
// agn
// {
//     "Reject": 264,
//     "Greet": 41,
//     "Accept": 50,
//     "Offer": 139
// }

// mixed - initiatiive negotiation
if (test_initiative)
{
	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core.json"))
	// var filtered = bars.filterdataset(data, 5)
	var ext = bars.extractdatasetallturns(data)

	var man = []
	var agn = []

	_.each(ext, function(value, key, list){ 

		
		var intents = Hierarchy.splitPartEquallyIntent(value['output'])

		intents = _.unique(intents)

		if (bars.ishumanturn(value))
			man = man.concat(intents)
		else
			agn = agn.concat(intents)
	}, this)

	var manh = _.countBy(man, function(num) { return num })
	var agnh = _.countBy(agn, function(num) { return num })

	console.log("man")
	console.log(JSON.stringify(manh, null, 4))

	console.log("agn")
	console.log(JSON.stringify(agnh, null, 4))

	console.log()
	process.exit(0)

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

function hashtoar(hash)
{

	//console.log(hash)
	var output = []
	_.each(hash, function(value, key, list){
		if (_.isObject(value))
		{
			_.each(value, function(value1, key1, list){
				var rec = {}
				rec[key] = {}
				rec[key][key1]=value1
				output.push(rec)
			}, this)
		}
		else
		{
			var rec = {}
			rec[key]=value
			output.push(rec)
		}
	}, this)
//	console.log(output)
//	process.exit(0)
	return output
}

if (check_ds)
{
	var files = []
	var folder = "../dialogues_arb"

	var dialfiles = fs.readdirSync(folder)

    dialfiles = _.without(dialfiles, ".git");
    
	// files  = walkSync(fodler, files)
	// files = _.filter(files, function(filename){ 
		// return (filename.indexOf("gold")!=-1)
	// });

	var train = []
	var test = []

	_.each(dialfiles, function(file, key, list){
		if (file.split(".")[0]<70)
			train.push(JSON.parse(fs.readFileSync(folder+"/"+file)))
		else
			test.push(JSON.parse(fs.readFileSync(folder+"/"+file)))
	}, this)

	_.each(train, function(di, key, list){
		_.each(di['turns'], function(utt, key1, list){
			train[key]['turns'][key1]['output'] = hashtoar(utt.output)
			train[key]['turns'][key1]['output'] = _.map(train[key]['turns'][key1]['output'], function(num){ return JSON.stringify(num) });

		}, this)

		train[key]['turns'] = _.filter(train[key]['turns'], function(num){ return (num.output.length > 0 && num.role == "Employer"); });

	}, this)

	_.each(test, function(di, key, list){
		_.each(di['turns'], function(utt, key1, list){
			test[key]['turns'][key1]['output'] = hashtoar(utt.output)
			test[key]['turns'][key1]['output'] = _.map(test[key]['turns'][key1]['output'], function(num){ return JSON.stringify(num) });

		}, this)
		test[key]['turns'] = _.filter(test[key]['turns'], function(num){ return (num.output.length > 0 && num.role == "Employer"); });
	}, this)

	console.log(test.length)
	console.log(train.length)

	var train_turns = []
	var test_turns = []

	_.each(train, function(value, key, list){
		train_turns = train_turns.concat(value['turns'])
	}, this)

	_.each(test, function(value, key, list){
		test_turns = test_turns.concat(value['turns'])
	}, this)

	// var dataset = partitions.partition(dataset, 1, Math.round(dataset.length*0.5))
	// var stats = trainAndTest.trainAndTestbatch(classifier.DS, train_turns, test_turns, 5)

	var stats = trainAndTest.trainAndTest_hash(classifier.DS, train_turns, test_turns, 5)

	console.log(JSON.stringify(stats['stats'], null, 4))

	process.exit()


	// console.log("sadasd")
}

if (test_knn)
{
	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core.json"))
	var dataset = bars.extractdataset(data)
	// var dataset = dataset.splice(0,4)
	var dataset = partitions.partition(dataset, 1, Math.round(dataset.length*0.5))

	var stats = trainAndTest.trainAndTest_hash(classifier.kNNnoBR, dataset['train'], dataset['test'], 5)
	// var stats = trainAndTest.trainAndTest_hash(classifier.IntentClassificationNoExpansion, dataset['train'], dataset['test'], 5)
	console.log(JSON.stringify(stats, null, 4))
	process.exit(0)
}

if (test_ppdb)
{
	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core.json"))
	var dataset = bars.extractdataset(data)
	// var dataset = dataset.splice(0,30)
	var dataset = partitions.partition(dataset, 1, Math.round(dataset.length*0.3))

	var stats = trainAndTest.trainAndTest_hash(classifier.IntentClassificationNoExpansion, dataset['train'], dataset['test'], 5)
	console.log(JSON.stringify(stats, null, 4))
	process.exit(0)
}

if (check_dial)
{
	var turns = {}
	console.log("start")
	var dialogues = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core.json"))	
	console.log("start")
	_.each(dialogues, function(dialogue, key, list){ 
		if (bars.isactivedialogue(dialogue))
			{	
				turns[dialogue['id']] = _.filter(dialogue['turns'], function(turn){ return (bars.isactiveturn(turn) && bars.ishumanturn(turn) && bars.isseqturn(turn) && bars.ispermittedturn(turn)) == true; }).length
			}
	}, this)
	
	console.log(JSON.stringify(turns, null, 4))
	console.log(turns['2014-07-28T15:01:25.194Z'])

	process.exit(0)
}

if (do_test_seed)
{
	var ppdb_utils = require("./research/ppdb/utils.js")
	console.log("here")
	val = 0
	var dialogues = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core.json"))
	_.each(dialogues, function(dialogue, key, list){
		_.each(dialogue['turns'], function(turn, key, list){
			if ('intent_absolute' in turn)
			{
				var sentence = turn['input'].toLowerCase().trim()
				sentence = regexpNormalizer(sentence)
				_.each(turn['intent_absolute'], function(value, key, list){ 
					if (value != 'DEFAULT INTENT')
					{
						value = ppdb_utils.cleanupkeyphrase(value)
						var pos = rules.compeletePhrase(sentence, value)
						if (pos == -1)
						{
							console.log(turn['input'])
						}
					}
				}, this)
			}

		 }, this) 
	}, this)
	console.log(val)
}

// var f = Fiber(function() {
  		// var fiber = Fiber.current;

if (counting)
{
	// 346 total
	// 218 permitted
	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule.json"))
	var dataset = bars.extractturns(data)
	console.log(dataset.length)
	process.exit(0)
}

if (default_intent_analysis)
{
	var data = JSON.parse(fs.readFileSync("../datasets/Employer/Dialogue/turkers_keyphrases_only_rule.json"))
	// var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule.json"))
	var dataset = bars.extractturns(data)

	_.each(dataset, function(turn, key, list){
		var sentence = turn['input']
		sentence = sentence.toLowerCase().trim()
   		sentence = regexpNormalizer(sentence)

   		if ('intent_keyphrases_rule' in turn)
   		{
   			if ('Offer' in turn['intent_keyphrases_rule'])
   			{
   				if (turn['intent_keyphrases_rule']['Offer'] == 'DEFAULT INTENT')
   				{
   					sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
   					console.log(sentence)
   				}
   			}
   		}

	}, this)
}

if (keyphrase_transformation)
{
	// var data = JSON.parse(fs.readFileSync("../datasets/Employer/Dialogue/turkers_keyphrases_only_rule.json"))
	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule.json"))

	_.each(data, function(dial, key, list){
		_.each(dial['turns'], function(turn, keyt, listt){
			if ('intent_keyphrases_rule' in turn)
			{	
				data[key]['turns'][keyt]['intent_core'] = turn['intent_keyphrases_rule'] 
				data[key]['turns'][keyt]['intent_absolute'] = turn['intent_keyphrases_rule'] 
				delete data[key]['turns'][keyt]['intent_keyphrases_rule'] 
		 	}
		 }, this) 
	}, this)
	console.log(JSON.stringify(data, null, 4))
	process.exit(0)
}

if (sequnce_classification)
{

	var ppdb = require("./research/ppdb/evalmeasure_5ed_embed.js")
	var ppdb_utils = require("./research/ppdb/utils.js")

	var datasets = [
              'turkers_keyphrases_only_rule_shuffled.json',
              // 'students_keyphrases_only_rule.json'
              // 'dial_usa_rule.json'
            ]

	var data = []

	_.each(datasets, function(value, key, list){
	    data = JSON.parse(fs.readFileSync("../datasets/Employer/Dialogue/"+value))
	    // data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/"+value))
	}, this)

	// data = _.shuffle(data)

	var datas = partitions.partition(data, 1, Math.round(data.length*0.6))

	console.log("test dialogues "+ datas['test'].length)
	console.log("train dialogues "+ datas['train'].length)

	var testset = trainutils.extractturns(datas['test'])
	var trainset = trainutils.extractturns(datas['train'])

	console.log("test turn "+ testset.length)
	console.log("train turns "+ trainset.length)

	var seeds = ppdb_utils.loadseeds(trainset)
	// var seeds_original = ppdb_utils.enrichseeds_original(seeds)

	var stats_ppdb = []

	ppdb_utils.enrichseeds(seeds, function(err, seeds_ppdb){
		ppdb.trainandtest(trainset, testset, seeds_ppdb, 1, function(err, response_ppdb){
			setTimeout(function() {
				fiber.run(response_ppdb)
			}, 1000)
		})
	})
	
   	var stats_ppdb = Fiber.yield()

   	_.each(stats_ppdb['data'], function(value, key, list){ 
   		if ((value['eval']['FP'].length != 0) || (value['eval']['FN'].length != 0))
   		{
   			console.log(JSON.stringify(value, null, 4))
   		}
   	}, this)

   	console.log(JSON.stringify(stats_ppdb['stats'], null, 4))

   	process.exit(0)
}



if (do_keyphrase_only_rule)
{
	var datalist = [
				"students_keyphrases_gold_rule.json"
				// "turkers_keyphrases_only_rule.json"
			]

	var data = []
	_.each(datalist, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("./datasets/Employer/Dialogue/"+value)))
	})

	_.each(data, function(dialogue, key, list){ 
		_.each(dialogue['turns'], function(turn, key1, list1){ 
			
			if (!('intent_keyphrases_rule' in turn))
				turn['intent_keyphrases_rule'] = {}

			if ('intent_keyphrases_gold' in turn)
				{
					_.each(turn['intent_keyphrases_gold'], function(value, intent, list){ 
						if (!(intent in turn['intent_keyphrases_rule']))
							turn['intent_keyphrases_rule'][intent] = value[1]
					}, this)
				}

			if ('Offer' in turn['intent_keyphrases_rule'])
				{
				if (turn['intent_keyphrases_rule']['Offer'] == "")	
					turn['intent_keyphrases_rule']['Offer'] = "DEFAULT INTENT"
				}

			delete data[key]['turns'][key1]['intent_keyphrases_gold']
			delete data[key]['turns'][key1]['is_correct']
			
			turn['status'] = 'active'

		}, this)
	}, this)

	console.log(JSON.stringify(data, null, 4))
	process.exit(0)
}



if (do_pull_all_utterance_to_file)
	{
	var datalist = [
			// "turkers_keyphrases_gold.json"
				// "students_keyphrases_.json"
				'turkers_keyphrases_only_rule.json',
				'students_keyphrases_only_rule.json'
			]

	var data = []
	_.each(datalist, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("./datasets/Employer/Dialogue/"+value)))
	})
	
	var data = trainutils.extractturns(data)
	// normalizer
	var output = []
	_.each(data, function(value, key, list){ 
		output.push(normalizer(value['input']))
	}, this)
	
	output = _.unique(output)
	_.each(output, function(value, key, list){ 
		console.log(value)
	}, this)
	process.exit(0)
	}


// takes the dialogues dataset and senetnce with only single label, then omit attribute and value and add
// only salient phrase of intent to the dataset
if (do_keyphrase_predict_annotaiton)
	{

		/*var turn = {}
		turn['output'] = [
                    {
                        "Offer": {
                            "Salary": "90,000 USD"
                        }
                    },
                    {
                        "Offer": {
                            "Job Description": "Programmer"
                        }
                    },
                    {
                        "Offer": {
                            "Leased Car": "Without leased car"
                        }
                    }]
	
	console.log(Hierarchy.splitPartEquallyIntent(turn['output']))
	process.exit(0)*/
	// var datalist = [
			// "turkers_keyphrases_gold.json"
				// "students_keyphrases_gold.json"
			// ]

	// var data = []
	// _.each(datalist, function(value, key, list){ 
		// data = data.concat(JSON.parse(fs.readFileSync("../datasets/Employer/Dialogue/"+value)))
	// })
	data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule.json"))


	_.each(data, function(dialogue, key, list){ 
        // if (dialogue['status'].indexOf("goodconv") != -1)
		_.each(dialogue['turns'], function(turn, key1, list1){ 
			if ((turn['status'] == "active") && (!('intent_keyphrases_rule' in turn)))
			{
			turn['input'] = turn['input'].replace(/[^\x00-\x7F]/g, "")
        		if ('user' in turn)
          			if (turn['user'].indexOf('Agent') == -1)
            			if (turn['input'] != "")
            			{
						var intent_list = Hierarchy.splitPartEquallyIntent(turn['output'])

						if (intent_list.length == 1)
						{
							var intent = intent_list[0] 
							if (!('intent_keyphrases_rule' in turn))
								turn['intent_keyphrases_rule'] = {}
							// var intent = Hierarchy.splitPartEquallyIntent(turn['output'])
							if (!(intent in turn['intent_keyphrases_rule']))
								{
								var sentence = turn['input']
								var original = turn['input']
								sentence = sentence.toLowerCase().trim()
								sentence = regexpNormalizer(sentence)
								sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
								sentence = sentence.replace(/<VALUE>/g,'')
								sentence = sentence.replace(/<ATTRIBUTE>/g,'')
								sentence = sentence.replace(/NIS/,'')
								sentence = sentence.replace(/nis/,'')
								sentence = sentence.replace(/track/,'')
								sentence = sentence.replace(/USD/,'')
								sentence = sentence.trim()

								var keyphrase = sentence
								// console.log("intent "+intent)
								// console.log("original "+original)
								// console.log("sentence "+sentence)
								if (sentence.replace(" ","").length == 0)
									keyphrase = "DEFAULT INTENT"

								data[key]['turns'][key1]['intent_keyphrases_rule'][intent] = keyphrase
								}
								// else
							// process.exit(0)
							}
							else
							{
						// console.log(turn['output'])
							}
						}
					}
				// }
		}, this)
	}, this)

	// var keyphrases = JSON.parse(fs.readFileSync("./research/test_aggregate_keyphases/keyphases.09.2014.json"))

console.log(JSON.stringify(data, null, 4))
process.exit(0)
}

// takes dialogues datasets and keyphrase set and combines them = dialogues with gold standard keyphrases
if (do_keyphrase_gold_annotaiton)
	{
	var datalist = [
			"turkers.json"
			]

	var data = []
	_.each(datalist, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("./datasets/Employer/Dialogue/"+value)))
	})

	var keyphrases = JSON.parse(fs.readFileSync("./research/test_aggregate_keyphases/keyphases.09.2014.json"))



// [
//     {
//         "sentence": "it is much too high.",
//         "labels": {
//             "Reject": [
//                 ""
//             ],
//             "Salary": [
//                 ""
//             ]
//         }
//     },
//     {
//         "sentence": "i think 7000 is good",
//         "labels": {
//             "Offer": [
//                 "i think"
//             ],
//             "Salary": [
//                 "VALUE"
//             ],
//             "7,000 NIS": [
//                 "7000"
//             ]
//         }
//     },

// console.log("keyphrases "+keyphrases.length)
// console.log("data "+data.length)

var got = 0
var Itents = ['Append', 'Offer', 'Accept', 'Reject', 'Insist', 'Query', 'Greet', 'Quit', 'accept', 'compromise', 'bid', 'issues']

	_.each(keyphrases, function(keysentence, key2, list2){ 
		// console.log("@"+key2)
		_.each(data, function(dialogue, key, list){ 
			// console.log(key)
			_.each(dialogue['turns'], function(utterance, key1, list1){
				if (keysentence['sentence'] == utterance['input'])
					{
					got = got + 1
					data[key]['turns'][key1]['intent_keyphrases_gold'] = {}

					_.each(keysentence['labels'], function(keyphrase, intent, list){ 
						keyphrase = keyphrase['0']
						if (keyphrase.length>0)
						{
							if (Itents.indexOf(intent)!=-1)
								{

								var begin = utterance['input'].indexOf(keyphrase)
								var end = begin + keyphrase.length - 1

								if (keyphrase == "DEFAULT INTENT")
									{
										begin = -2
										end = -2
									}

								if (begin == -1)
									{	console.log("error"+keyphrase+" "+utterance['input'])
											process.exit(0)
									}

								data[key]['turns'][key1]['intent_keyphrases_gold'][intent] = []
								data[key]['turns'][key1]['intent_keyphrases_gold'][intent].push([begin, end])
								data[key]['turns'][key1]['intent_keyphrases_gold'][intent].push(keyphrase)
								}
						}
					}, this)
					}
			}, this)
		}, this)
	}, this)

console.log(JSON.stringify(data, null, 4))
// console.log()
process.exit(0)
}

// new prototype


if (new_dial_stats)
	{

		// dial_usa.json
		// dial_isr.json

		// dialogies = JSON.parse(fs.readFileSync("./dialogue_restore/dial_isr.json"))
		dialogies = JSON.parse(fs.readFileSync("./dialogue_restore/dial_usa.json"))

		var gooddial = 0
		var utter = 0

		_.each(dialogies, function(dialogue, key, list){ 
			if (dialogue['status'] == 'goodconv')
				gooddial = gooddial + 1
		}, this)

		
		var agents = []
		_.each(dialogies, function(dialogue, key, list){ 
			if (dialogue['status'] == 'goodconv')
			{
				utter = utter  + dialogue['turns'].length
				var agent = ""
				_.each(dialogue['turns'], function(turn, key1, list1){ 
					if (turn['user'].indexOf('NewAgent')!=-1)	agent = 'NewAgent'
					if (turn['user'].indexOf('KBAgent')!=-1)	agent = 'KBAgent'
				}, this)
			agents.push(agent)
			}
		}, this)

		
		var agentshash = _.countBy(agents, function(num) { return num})


		console.log("good dialogues")
		console.log(gooddial)

		console.log("agents")
		console.log(agentshash)

		console.log("utterances")
		console.log(utter)

		process.exit(0)
	}


if (do_mlrule)
	{

	// trainset = trainutils.filteraccept(JSON.parse(fs.readFileSync("datasets/Employer/trainonelabel.json")))
	// testset = trainutils.filteraccept(JSON.parse(fs.readFileSync("datasets/Employer/testalllabels.json")))

	var datalist = [
			// "datasetrules.js",
			// "datasetrules1.js"
			// "trainonelabel.json",
			// "testalllabels.json"	
			"turkers_keyphrases_only_rule.json",
			"students_keyphrases_only_rule.json"
			]

	var data = []
	_.each(datalist, function(value, key, list){ 
		// data = data.concat(JSON.parse(fs.readFileSync("./datasets/Employer/"+value)))
		data = data.concat(JSON.parse(fs.readFileSync("../datasets/Employer/Dialogue/"+value)))
	})

	// var ppdb = require("./research/ppdb/utils.js")

	var data = trainutils.extractturns(data)

	_.each(data, function(value, key, list){ 
		var str = value['input'].toLowerCase().trim();
		data[key]['input'] = regexpNormalizer(str)
		
		// ppdb.cachepos(data[key]['input'].replace(/\./g,""), function(err, response){	
  		// })
	}, this)

	// console.log()
	// process.exit(0)

	data = _.shuffle(data)

	var dataset = partitions.partition(data, 1, Math.round(data.length*0.3))

	// console.log(trainutils.dividedataset(dataset['train'])['one'].length)
	// console.log(dataset['test'].length)
	// console.log(JSON.stringify(trainutils.dividedataset(dataset['train'])['one'], null, 4))
	// process.exit(0)
	
	console.log("sizes")
	console.log("train "+trainutils.dividedataset(dataset['train'])['one'].length)
	console.log("test "+dataset['test'].length)

	// console.log()
	// process.exit(0)

    // var stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, train, trainutils.dividedataset(test)['one'], 5)
   		var stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, trainutils.dividedataset(dataset['train'])['one'], dataset['test'], 5)
   		console.log(JSON.stringify(stats, null, 4))
   
	}

if (just_test)
	{
	var datalist = [
			"usd-nlu_ncagent_students_negonlpnc.json",
			]

	var data = []
	_.each(datalist, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer-usa/"+value)))
	})

	_.each(data, function(value, key, list){ 

	}, this)
	
	var dataset = partitions.partition(data, 1, Math.round(data.length*0.3))

	var stats = trainAndTest.trainAndTest_hash(createNewClassifier, dataset['train'], dataset['test'], 5)

	// console.log(stats[0]['data'])
	console.log(JSON.stringify(stats[0]['data'], null, 4))
	
	process.exit(0)
	}




if (do_learning_curves) {

	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core.json"))
	var dataset = bars.extractdataset(data)
	// var dataset = dataset.splice(0,50)
	// var dataset = partitions.partition(dataset, 1, Math.round(dataset.length*0.3))

	classifiers  = {
			Expansion1:   classifier.IntentClassificationExpansion1,
			Expansion2:   classifier.IntentClassificationExpansion2,
			NoExpansion: classifier.IntentClassificationNoExpansion,
			Expansion1Phrase: classifier.IntentClassificationExpansion1Phrase
		// Baseline_0: classifier.PartialClassificationEquallyIntent

		// Baseline_1: classifier.SvmPerfClassifier,
		// Baseline_2: classifier.PartialClassificationEquallySagae,

		// Composite_Sagae: classifier.WinnowSegmenter, 
		
		// Component: classifier.PartialClassificationEqually_Component,
		// Composite: classifier.SvmOutputPartialEqually_Composite

		// Intent_AttributeValue: classifier.PartialClassificationJustTwo,
		 //SVM_Separated: classifier.SvmPerfClassifierPartial,
		// Intent_Attribute_Value: classifier.PartialClassificationEqually
		//New_approach: classifier.PartialClassificationEquallyNoOutput, 
		// SVM_SeparatedAfter: classifier.SvmOutputPartialEqually,
		// SVM_SeparatedClassification: classifier.PartialClassificationEqually,
		// SVM_SeparatedClassification_IS: classifier.PartialClassificationEquallyIS

		// Intent_Attribute_AttributeValue: classifier.PartialClassificationVersion1,
		// Intent_AttributeValue: classifier.PartialClassificationVersion2,

	// HomerSvmPerf: classifier.HomerSvmPerf,
	// SvmPerf: classifier.SvmPerfClassifier,

	// HomerWinnow: classifier.HomerWinnow, 
	// Winnow: classifier.WinnowClassifier,  

	// HomerAdaboost: classifier.HomerAdaboostClassifier,
	// Adaboost: classifier.AdaboostClassifier, 

	// SVM: classifier.SvmPerfClassifier,
	// Homer: classifier.HomerWinnow,
	// PartialClassificationEquallyGreedy: classifier.PartialClassificationEquallyGreedy,
		// PartialClassificationEquallyGreedyISNoTrick: classifier.PartialClassificationEquallyGreedyISNoTrick,
		// PartialClassificationEquallyGreedyISTrick: classifier.PartialClassificationEquallyGreedyISTrick,
		// SVM: classifier.SvmPerfClassifier,

		// PartialClassificationEquallyGreedyNoISBiagram: classifier.PartialClassificationEquallyGreedyTrick,
		
		// Component_Sagae_Improved: classifier.PartialClassificationEquallySagaeImp,

		// Component_Sagae: classifier.PartialClassificationEquallySagae,
		// Component_Sagae: classifier.PartialClassificationEquallySagae,

		// Component_Sagae_NoCompletion: classifier.PartialClassificationEquallySagaeNoCompletion,

		// Composite_SVM_IS: classifier.SvmPerfClassifierIS,


		// Component_Sagae_Imp: classifier.PartialClassificationEquallySagaeImp,
		// Component_Sagae_Nospell: classifier.PartialClassificationEquallySagaeNospell,
		// Component_Sagae_no_Completion: classifier.PartialClassificationEquallySagaeNoCompletition,
		// Composite_Sagae: classifier.WinnowSegmenter, 
		// Composite_SVM_noIS_nospell: classifier.SvmPerfClassifierNoIS,
		// Composite_SVM: classifier.SvmPerfClassifier
		// Composite_SVM_noIS_spell: classifier.SvmPerfClassifierSpell
// 
	

		// SvmPerfClassifier: classifier.SvmPerfClassifier,
		// SvmPerfClassifierStemmer: classifier.SvmPerfClassifierLematization,
		// SvmPerfClassifierNatural: classifier.SvmPerfClassifierSimilarity
		
	};

	// parameters = ['F1','TP','FP','FN','Accuracy','Precision','Recall']
	parameters = ['F1','Precision','Recall', 'Accuracy']
	// curves.learning_curves(classifiers, dataset, parameters, 10, 5, data2)
	curves.learning_curves(classifiers, dataset, parameters, 2, 2,  5)
	console.log()
	process.exit(0)
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



// })


// f.run();
