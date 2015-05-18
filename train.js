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
var wikipedia_test = true
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
var test_label = false
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
var bars = require('./utils/bars')
// var Lemmer = require('node-lemmer').Lemmer;
var rules = require("./research/rule-based/rules.js")
// var ppdb_utils = require("./research/ppdb/utils.js")

// var grammarDataset = JSON.parse(fs.readFileSync("datasets/Employer/0_grammar.json"));
// var collectedDatasetMulti = JSON.parse(fs.readFileSync("datasets/Employer/1_woz_kbagent_students.json"));
// var collectedDatasetSingle = JSON.parse(fs.readFileSync("datasets/Employer/1_woz_kbagent_students1class.json"));
// var collectedDatasetMulti2 = JSON.parse(fs.readFileSync("datasets/Employer/2_experts.json"));
// var collectedDatasetSingle2 = JSON.parse(fs.readFileSync("datasets/Employer/2_experts1class.json"));
// var collectedDatasetMulti4 = JSON.parse(fs.readFileSync("datasets/Employer/3_woz_kbagent_turkers_negonlp2.json"));
// var collectedDatasetMulti8 = JSON.parse(fs.readFileSync("datasets/Employer/4_various.json"));

var verbosity = 0;
var explain = 0;

// var extractor = require('unfluff');
var cheapest_paths = require('limdu/node_modules/graph-paths').cheapest_paths;
var natural = require('natural');
var execSync = require('execSync').exec
var partitions = require('limdu/utils/partitions');
var PrecisionRecall = require('limdu/utils/PrecisionRecall');
// var trainAndTest = require('limdu/utils/trainAndTest').trainAndTest;
var trainAndTest = require('./utils/trainAndTest');
// var trainAndCompare = require('limdu/utils/trainAndTest').trainAndCompare;
// var trainAndTestLite = require('limdu/utils/trainAndTest').trainAndTestLite;
// var trainAndTestLite = require('./utils/trainAndTest').trainAndTestLite;
// var ToTest = require('limdu/utils/trainAndTest').test;
// var ToTest = require('./utils/trainAndTest').test;
var serialization = require('serialization');
var curves = require('./utils/learning_curves');
// var unseen_words_curves = require('limdu/utils/unseen_curves').unseen_word_curves;
// var unseen_correlation = require('limdu/utils/unseen_correlation').unseen_correlation;
// var tokenize = require('limdu/utils/unseen_correlation').tokenize;

var limdu = require("limdu");
var ftrs = limdu.features;

// var Fiber = require('fibers');

var classifier = require(__dirname+'/classifiers')

// var regexpNormalizer = ftrs.RegexpNormalizer(
		// JSON.parse(fs.readFileSync('knowledgeresources/BiuNormalizations1.json')));

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



var datasetNames = [
			"0_grammar.json",
			"1_woz_kbagent_students.json",
			"1_woz_kbagent_students1class.json",
			"2_experts.json",
			"2_experts1class.json",
			"4_various.json",
			"4_various1class.json",
			"6_expert.json",
			"3_woz_kbagent_turkers_negonlp2.json",
			"5_woz_ncagent_turkers_negonlp2ncAMT.json",
			"nlu_kbagent_turkers_negonlpAMT.json",
			"nlu_ncagent_students_negonlpnc.json",
			"nlu_ncagent_turkers_negonlpncAMT.json",
			"woz_kbagent_students_negonlp.json"
			];

function parse_filter(parse)
{
        _.each(parse['sentences'], function(value, key, list){
                delete parse['sentences'][key]['basic-dependencies']
                delete parse['sentences'][key]['collapsed-dependencies']
                delete parse['sentences'][key]['tokens']
        }, this)

        return parse
}


if (wikipedia_test)

	// +190074 Category:Art movements
	// +176859 Category:Arts
{

	var cat = [ 140002, 6582, 11221, 221702, 380549, 176859, 25644, 59198, 379420, 176796, 380539, 88393, 190074, 26711,
  		209587, 264364, 379948, 380552, 29677, 63275, 29357, 306221, 306219, 15311 ]

	var path = "../wikipedia"
	var files = fs.readdirSync(path)
	files = _.filter(files, function(num){ return num.indexOf("json") != -1 })
	var data = []

	_.each(files, function(file, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("../wikipedia/" + file)))
	}, this)

	console.log(data.length)
	var count = _.reduce(data, function(memo, num){ return memo + num["categories"].length }, 0)
	console.log(count)

	_.each(data, function(value, key, list){ 
		var cati = []
		_.each(value["categories"], function(categ, key1, list){ 
			if (cat.indexOf(categ)!= -1)
				cati.push(categ)
		}, this)
		data[key]["categories"] = JSON.parse(JSON.stringify(cati, null, 4))
	}, this)

	data = _.filter(data, function(num){ return num["categories"].length == 1 });
	var count = _.reduce(data, function(memo, num){ return memo + num["categories"].length }, 0)

	console.log(data.length)
	console.log(count)

	var aggr = {}
	_.each(data, function(value, key, list){
		if (!(value["categories"][0] in aggr))
			aggr[value["categories"][0]] = []
		aggr[value["categories"][0]].push(value)
	}, this)

	var data = []
	_.each(aggr, function(value, key, list){ 
		if (value.length > 0)
			data = data.concat(value)
	}, this)

	console.log(data.length)
	
	console.log("loaded")

	var data = _.map(data, function(value){ var elem = {}
											value["CORENLP"]["sentences"].splice(3, value["CORENLP"]["sentences"].length)
											elem['input'] = value
											// elem['input']['input'] = value["text"]
											elem['output'] = value['categories']
											return elem
										})

	
	console.log("ready")				

	data = _.shuffle(data)

	var compare = {
		// 'TCBOC':classifier.TCBOC, 
		// 'TCSynHyp1': classifier.TCSynHyp1, 
		'TC':classifier.TC}
	var results = {}
	var labels = {}

	partitions.partitions_reverese(data, 5, function(train, test, index) {
		_.each(compare, function(classifier, key, list){ 
			if (!(key in results)) results[key] = []
			var stats = trainAndTest.trainAndTest_hash(classifier, train, test, 5)
			results[key].push(stats['stats']['F1'])
			labels[key].push(stats['labels'])
		}, this)
		
		console.log("PERF")
		console.log(JSON.stringify(results, null, 4))
		console.log(JSON.stringify(labels, null, 4))

		var aggr = {}
		_.each(results, function(value, clas, list){ 
			aggr[clas] = _.reduce(value, function(memo, num){ return memo + num; }, 0)/value.length
		}, this)

		console.log(JSON.stringify(aggr, null, 4))

	});
	
	process.exit(0)
}


if (wikipedia_parsed)
{
	var cat = [ 140002, 6582, 11221, 221702, 380549, 176859, 25644, 59198, 379420, 176796, 380539, 88393, 190074, 26711,
  209587, 264364, 379948, 380552, 29677, 63275, 29357, 306221, 306219, 15311 ]
	var files = ["./part1.json", "./part2.json", "./part3.json"]
	var data = []
	var parsed = __dirname+"/../wikipedia/prepared/"

	_.each(files, function(file, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync(file)))
	}, this)

	var dataset = []
	_.each(data, function(value, key, list){ 
		if (value["_category"]==0)
			if (_.intersection(value['categories'], cat).length>0)
			{
				value['categories'] = _.intersection(value['categories'], cat)
				var corenlp = JSON.parse(fs.readFileSync("../wikipedia/parsed/"+value["_id"]+".json"))
				value['CORENLP'] = corenlp
				dataset.push(value)
			}
	}, this)

	var data_splited = _.groupBy(dataset, function(element, index){
        return index%5;
 	})

 	_.each(_.toArray(data_splited), function(data, key, list){
        console.log("writing "+key)
        fs.writeFileSync('../wikipedia/wiki.'+key+'.corenlp.json', JSON.stringify(data, null, 4))
 	}, this)

	process.exit(0)
}

if (wikipedia_categories)
{
	var files = ["./part1.json", "./part2.json", "./part3.json"]
	var data = []
	var folder = __dirname+"/../wikipedia/prepared/"

	_.each(files, function(file, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync(file)))
	}, this)

	console.log(data.length)

	var categories = {}
	_.each(data, function(value, key, list){ 
		if (value['_category']==1)
			categories[value["_id"]] = {'id':value["_id"], 'title':value["title"].split(":")[1], 'count_articles':0,'parent': [], 'child':[]}
	}, this)

	_.each(data, function(value, key, list){ 
		if (value['_category']==0)
			_.each(value['categories'], function(cat, key, list){
				categories[cat]['count_articles'] += 1 
			}, this)

		if (value['_category']==1)
			{
			categories[value['_id']]['parent'] = categories[value['_id']]['parent'].concat(value['categories'])
			_.each(value['categories'], function(cat, key, list){
				categories[cat]['child'].push(value["_id"])
			}, this)
			}
	}, this)

	_.each(categories, function(value, key, list){ 
		var cate = []
		_.each(value["parent"], function(cat, key, list){ 
			cate.push([categories[cat]['title'], categories[cat]['count_articles']])
		}, this)
		categories[key]['parent'] = cate

		var cate = []
		_.each(value["child"], function(cat, key, list){ 
			cate.push([categories[cat]['title'], categories[cat]['count_articles']])
		}, this)
		categories[key]['child'] = cate
	}, this)

	var catar = _.toArray(categories)
	catar = _.sortBy(catar, function(num){ return num["count_articles"] }).reverse()
	console.log(JSON.stringify(catar, null, 4))

	var cat = categories[5876]['child']
	console.log(cat)

}

if (wikipedia_prepared)
{
	var files = ["./part1.json", "./part2.json", "./part3.json"]
	var data = []
	var folder = __dirname+"/../wikipedia/prepared/"

	_.each(files, function(file, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync(file)))
	}, this)

	console.log(data.length)

	var categories = {}
	_.each(data, function(value, key, list){ 
		if (value['_category']==1)
			categories[value["_id"]] = {'id':value["_id"], 'title':value["title"].split(":")[1], 'count_articles':0,'parent': [], 'child':[]}
	}, this)

	_.each(data, function(value, key, list){ 
		if (value['_category']==0)
			_.each(value['categories'], function(cat, key, list){
				categories[cat]['count_articles'] += 1 
			}, this)

		if (value['_category']==1)
			{
			categories[value['_id']]['parent'] = categories[value['_id']]['parent'].concat(value['categories'])
			_.each(value['categories'], function(cat, key, list){
				categories[cat]['child'].push(value["_id"])
			}, this)
			}
	}, this)

	
	// console.log(JSON.stringify(categories, null, 4))

	var cat = categories[152992]['child']
	console.log(cat)

	var dataset = {}

	_.each(data, function(value, key, list){ 
		if (value["_category"] == 0)
		{
			var cc =  _.intersection(value["categories"],cat)
			if (cc.length == 1)
			{
				var text = value['text']
				text = text.replace(/\n/g," ")
				text = text.replace(/\*/g," ")
				text = text.replace(/\s{2,}/g, ' ')
				value['text'] = text
				value['categories'] = [cc]

				if (!(cc in dataset))
					dataset[cc] = []

				dataset[cc].push(value)
			}
		}
	}, this)

	_.each(dataset, function(value, key, list){ 
		dataset[key] = _.sortBy(value, function(num){ return num.length }).reverse()
		dataset[key] = dataset[key].slice(0, 100)
	}, this)

	// console.log(Object.keys(dataset).length)

	var listo = []
	_.each(dataset, function(value, key, list){ 
		_.each(value, function(value1, key1, list){ 
			fs.writeFileSync(folder + "/" + value1["_id"], value1["text"], 'utf-8')
			listo.push("/home/ir/konovav/wikipedia/prepared/"+value1["_id"])
		}, this)
	}, this)


	fs.writeFileSync(folder + "/list", listo.join("\n"), 'utf-8')

	process.exit(0)
}

if (index_wordnet)
{
	var path = '/home/com/Shared/natural/node_modules/WNdb/dict/'
	var files = ['index.adv', 'index.noun', 'index.verb', 'index.adj']
	var index = {}

	_.each(files, function(file, key, list){
		index[file] = {}
		var data =fs.readFileSync(path+file, 'UTF-8')
		var lines = data.split("\n")
		_.each(lines, function(line, key, list){ 
			if (line[0] == "")
				return

			var elem = line.split(" ")
			index[file][elem[0].split("_").join(" ")] = ""
		}, this)
	}, this)

	console.log()
	console.log(JSON.stringify(index, null, 4))
	process.exit(0)
}

if (wikipedia_stats)
{
	// Art - 5876
	// +190074 Category:Art movements
	// +176859 Category:Arts

	var cat = [ 140002, 6582, 11221, 221702, 380549,  25644, 59198, 379420, 176796, 380539, 88393,  26711,
  209587, 264364, 379948, 380552, 29677, 63275, 29357, 306221, 306219, 15311 ]
	// var files = ["./part1.json", "./part2.json", "./part3.json"]
	// var data = []
	// var parsed = __dirname+"/../wikipedia/prepared/"

	var path = "../wikipedia"
	var files = fs.readdirSync(path)
	files = _.filter(files, function(num){ return num.indexOf("json") != -1 })
	var data = []

	_.each(files, function(file, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync(file)))
	}, this)

	console.log("loaded")

	var dataset = []
	var categ = {}
	var multi = []
	_.each(data, function(value, key, list){ 
		if (value["_category"]==1)
			categ[value["_id"]] = value["title"]

		if (value["_category"]==0)
			if (_.intersection(value['categories'], cat).length>0)
			{
				dataset.push(value)
				if (_.intersection(value['categories'], cat).length>1)
					multi.push(value)
			}
	}, this)

	console.log("preprocessed")
	var count = 0
	var count1 = 0
	var single = []

	_.each(dataset, function(value, key, list){ 
		if (value["categories"].length > 1)
		{
			count += 1
			console.log(value["_id"])
			console.log(value["title"])
			_.each(value["categories"], function(val, key, list){ 
				{
					if (cat.indexOf(val)!=-1)
						console.log("+"+val +" "+ categ[val])
					else
						console.log(val +" "+ categ[val])
				}

			}, this)
			console.log("___________________")
		}
		else
		{
		count1 += 1
		single.push(value)
		}

	}, this)

	console.log("SINGLE")

	_.each(single, function(value, key, list){ 
		console.log(value["_id"])
		console.log(value["title"])
		console.log(categ[value["categories"][0]])		
		console.log("___________________")
	}, this)

	console.log("MULTI")

	_.each(multi, function(value, key, list){ 
		console.log(value["_id"])
		console.log(value["title"])
		_.each(value["categories"], function(val, key, list){ 
		{
			if (cat.indexOf(val)!=-1)
				console.log("+"+val +" "+ categ[val])
			else
				console.log(val +" "+ categ[val])
			}
		})

		console.log("++++++++++++++++++++++++++")
	}, this)

	console.log("many "+count)
	console.log("single "+count1)
	console.log("multi "+multi.length)
	
	process.exit(0)
}

if (reuters)
{

	var field = "BODY"
	
	var path = __dirname + "/../reuters2json/R8/"

	var train_files = fs.readdirSync(path + "train")
	var test_files = fs.readdirSync(path + "test")

	var train_data = []

	_.each(train_files, function(file, key, list){ 
		console.log("load train"+key)
		train_data = train_data.concat(JSON.parse(fs.readFileSync(path+"train/"+file)))
	}, this)

	var test_data = []

	_.each(test_files, function(file, key, list){ 
		console.log("load test"+key)
		test_data = test_data.concat(JSON.parse(fs.readFileSync(path+"test/"+file)))
	}, this)

	// filter EARN

	test_data = _.compact(_.filter(test_data, function(num){ if (num['TOPICS'].indexOf('earn')==-1) return num }))
	train_data = _.compact(_.filter(train_data, function(num){ if (num['TOPICS'].indexOf('earn')==-1) return num }))

	// there is a number of more that one sentence	
	
	var train_data = _.compact(_.map(train_data, function(value){ var elem = {}
															// if (('BODY' in value['TEXT']) && ('TITLE' in value['TEXT']) )
															if (('BODY' in value['TEXT']))
																{
																	// if (value['TITLE_CORENLP']['sentences'].length > 0)
																	{
																		value['CORENLP'] = value['BODY_CORENLP']
																		
																		// value['CORENLP']['sentences'][0]['token'] = value['BODY_CORENLP']['sentences'][0]['tokens'].concat(value['TITLE_CORENLP']['sentences'][0]['tokens'])

																		delete value['TITLE_CORENLP']
																		elem['input'] =  value
																		elem['output'] = value['TOPICS'][0]
																		return elem
																	}
																} 
															}))

	// 	// var test_data = _.compact(_.map(test, function(value){ if (field in value['TEXT']) return value }))
	var test_data = _.compact(_.map(test_data, function(value){ var elem = {}
															if ((field in value['TEXT']) && (value['$']['NEWID'] != '20959')) 
																{
																value['CORENLP'] = value[field + '_CORENLP']
																// delete value['TITLE_CORENLP']
																elem['input'] = value
																elem['input']['input'] = value['TEXT'][field]
																elem['output'] = value['TOPICS'][0]
																return elem
																}
															}))



	// var train_data = _.compact(_.map(train_data, function(value){ var elem = {}
	// 														if ('BODY' in value['TEXT']) 
	// 															{
																	
	// 															value['BODY_CORENLP']['sentences'] = [ value['BODY_CORENLP']['sentences'][0] ]
	// 															value['CORENLP'] = value['BODY_CORENLP']
																	
	// 															delete value['TITLE_CORENLP']
	// 															elem['input'] =  value
	// 															elem['output'] = value['TOPICS'][0]
	// 															return elem
																	
	// 															} 
	// 														}))

	// var test_data = _.compact(_.map(test_data, function(value){ var elem = {}
	// 														if ('BODY' in value['TEXT'])
	// 															{
																
	// 															value['BODY_CORENLP']['sentences'] = [ value['BODY_CORENLP']['sentences'][0] ]
	// 															value['CORENLP'] = value['BODY_CORENLP']
	// 															delete value['TITLE_CORENLP']

	// 															elem['input'] = value
	// 															elem['input']['input'] = _.pluck(value['BODY_CORENLP']['sentences'][0]['tokens'], 'word').join(" ")
	// 															elem['output'] = value['TOPICS'][0]
	// 															return elem
	// 															}
	// 														}))
	console.log("test is ready")

	console.log(train_data.length)
	console.log(test_data.length)

	train_data = _.shuffle(train_data)
	test_data = _.shuffle(test_data)

	// train_data = train_data.splice(0,100)
	// test_data = test_data.splice(0,200)

	// console.log(train_data.length)
	// console.log(test_data.length)

	var dataset = train_data.concat(test_data)
	dataset = _.shuffle(dataset)
	dataset = dataset.splice(0,200)

	var F1 = []
	var stats = []
	partitions.partitions_reverese(dataset, 10, function(train, test, index) {
		stats = trainAndTest.trainAndTest_hash(classifier.TC, train, test, 5)
		F1.push(stats[0]['stats']['F1'])
	});
	console.log("F1")
	console.log(F1)
	console.log(_.reduce(F1, function(memo, num){ return memo + num; }, 0)/F1.length)

	// var stats = trainAndTest.trainAndTest_hash(classifier.ReuterBin, train_data, test_data, 5)
	console.log(JSON.stringify(stats[0]['data'], null, 4))


	var F1 = []
	partitions.partitions_reverese(dataset, 10, function(train, test, index) {
		F1.push(trainAndTest.trainAndTest_hash(classifier.TCPPDB, train, test, 5)[0]['stats']['F1'])
	});
	console.log("F1")
	console.log(F1)
	console.log(_.reduce(F1, function(memo, num){ return memo + num; }, 0)/F1.length)


	var stats = []
	var F1 = []
	partitions.partitions_reverese(dataset, 10, function(train, test, index) {
		stats = trainAndTest.trainAndTest_hash(classifier.TCBOC, train, test, 5)
		F1.push(stats[0]['stats']['F1'])
	});
	console.log("F1")
	console.log(F1)
	console.log(_.reduce(F1, function(memo, num){ return memo + num; }, 0)/F1.length)
	console.log(JSON.stringify(stats[0]['data'], null, 4))

	console.log()
	process.exit(0)

	var F1 = []
	partitions.partitions_reverese(dataset, 10, function(train, test, index) {
		F1.push(trainAndTest.trainAndTest_hash(classifier.TCSynHypHypoCohypo, train, test, 5)[0]['stats']['F1'])
	});
	console.log("F1")
	console.log(F1)
	console.log(_.reduce(F1, function(memo, num){ return memo + num; }, 0)/F1.length)

	var F1 = []
	partitions.partitions_reverese(dataset, 10, function(train, test, index) {
		F1.push(trainAndTest.trainAndTest_hash(classifier.TCSynHyp2, train, test, 5)[0]['stats']['F1'])
	});
	console.log("F1")
	console.log(F1)
	console.log(_.reduce(F1, function(memo, num){ return memo + num; }, 0)/F1.length)

	// var stats = trainAndTest.trainAndTest_hash(classifier.ReuterBinPPDB, train_data, test_data, 5)

	// console.log(JSON.stringify(stats[0]['data'], null, 4))
	// console.log(JSON.stringify(stats[0]['stats'], null, 4))

	// var features_all = 0
	// var features_different_with_lemma = 0
	// var features_with_emb = 0
	// var wordnet_candidates = 0
	// var candidates_in_train = 0
	// var features_expaned_with_context = 0
	// var expansion_useful_with_context = 0
	// var expansion_useful_without_context = 0
	// var candidates_with_emb = 0
	// var expansion_with_context = 0 
	// var expansion_without_context = 0

	// _.each(stats[0]['data'], function(record, key, list){ 
	// 	features_all += Object.keys(record['expansioned']).length

	// 	_.each(record['expansioned'], function(value, key, list){ 

	// 		if (value['lemma'] != value['word'])
	// 			features_different_with_lemma += 1
			
	// 		if ('embedding_true' in value)
	// 			if (value['embedding_true'] == 1)
	// 				features_with_emb += 1
		
	// 		if ('wordnet_candidates' in value)
	// 			if (value['wordnet_candidates'].length > 0)
	// 				wordnet_candidates += 1

	// 		if ('candidates_in_train' in value)
	// 			if (value['candidates_in_train'].length > 0)
	// 				candidates_in_train += 1

	// 		if ('candidates_with_emb' in value)
	// 			if (value['candidates_with_emb'].length > 0)
	// 				candidates_with_emb += 1
		
	// 		if ('expansion_with_context' in value)
	// 			if (value['expansion_with_context'].length > 0)
	// 				expansion_with_context += 1

	// 		if ('expansion_without_context' in value)
	// 			if (value['expansion_without_context'].length > 0)
	// 				expansion_without_context += 1

	// 		if ('expansion_with_context' in value)
	// 			if (value['expansion_with_context_result'][0][1] > 0)
	// 				expansion_useful_with_context += 1

	// 		if ('expansion_without_context' in value)
	// 			if (value['expansion_without_context_result'][0][1] > 0)
	// 				expansion_useful_without_context += 1
		
	// 	}, this)
	// }, this)

	// console.log("features_all "+features_all)
	// console.log("features_different_lemma "+features_different_with_lemma)
	// console.log("features_with_emb "+features_with_emb)
	// console.log("wordnet_candidates "+wordnet_candidates)
	// console.log("candidates_in_train "+candidates_in_train)
	// console.log("candidates_with_emb "+candidates_with_emb)

	// // console.log("expansion_with_context "+expansion_with_context)
	// // console.log("expansion_without_context "+expansion_without_context)

	// console.log("expansion "+expansion_without_context)
	// console.log("expansion_useful_with_context "+expansion_useful_with_context)
	// console.log("expansion_useful_without_context "+expansion_useful_without_context)


	// var stats1 = trainAndTest.trainAndTest_hash(classifier.ReuterBinPPDBNoContext, train_data, test_data, 5)
	// console.log(JSON.stringify(stats1[0]['stats'], null, 4))

	// var stats1 = trainAndTest.trainAndTest_hash(classifier.ReuterBinExpSynHyperHypo, train_data, test_data, 5)
	// console.log(JSON.stringify(stats1[0]['stats'], null, 4))

	// var stats1 = trainAndTest.trainAndTest_hash(classifier.ReuterBinExpSynHyperHypoNoContext, train_data, test_data, 5)
	// console.log(JSON.stringify(stats1[0]['stats'], null, 4))

	process.exit(0)
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

// 91%
if (test_label)
{
	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule_core.json"))
	var filtered = bars.filterdataset(data, 5)
	var ext = bars.extractdataset(filtered)

	var doubles = []
	
	var all = ext.length
	var single = 0

	_.each(ext, function(value, key, list){ 
		if (Hierarchy.splitPartEquallyIntent(value['output']).length == 1)
			single += 1
		else
			doubles.push(Hierarchy.splitPartEquallyIntent(value['output']))
	}, this)

	console.log(all)
	console.log(single)
	console.log(single/all)
	console.log(doubles)
	process.exit(0)
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

if (shuffle)
{
	var data = JSON.parse(fs.readFileSync("../datasets/DatasetDraft/dial_usa_rule.json"))
	data = _.shuffle(data)	
	data = _.shuffle(data)	
	data = _.shuffle(data)	
	data = _.shuffle(data)	
	console.log(JSON.stringify(data, null, 4))
	console.log()
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


if (test_dataset)
{
	var data = JSON.parse(fs.readFileSync("./test2.json"))
	process.exit(0)
}

if (prepare_dataset_for_gaby1)
{

	var utdata = []

	var olddata = JSON.parse(fs.readFileSync("./dialogue_restore/dial_usa.json"))

	var oldddata = JSON.parse(fs.readFileSync("./datasets/Employer/Dialogue/turkers_keyphrases_only_rule.json"))
	oldddata = trainutils.extractturns(oldddata)
	var transfer = []

	var scfg = JSON.parse(fs.readFileSync("./scfg_detailed.json"))
	
	// _.each(trainutils.dividedataset(oldddata)['one'], function(value, key, list){ 
	_.each(oldddata, function(value, key, list){ 
		value['input'] = normalizer(value['input'])
		if (
			(value['input'].indexOf('salary') == -1) &&
			(value['input'].indexOf('NIS') == -1) &&
			(value['input'].indexOf('12000') == -1) &&
			(value['input'].indexOf('7000') == -1)&&
			(value['input'].indexOf('20000') == -1)
			)
		{
			transfer.push({'input':value['input'], 'output':value['output']})
		}
	}, this)

	// 
	// utdata = _.shuffle(utdata)
	// var clean = partitions.partition(utdata, 1, Math.round(utdata.length*0.4))

	// console.log("one "+trainutils.dividedataset(utdata)['one'].length)
	// console.log("two "+trainutils.dividedataset(utdata)['two'].length)
	
	// console.log()
	// process.exit(0)
	// var filename = './dialogue_restore/new_ag1.json'
	// data = JSON.parse(fs.readFileSync(filename))


	_.each(olddata, function(dialogue, key, list){ 
		// console.log(dialogue['status'])
		if (_.find(dialogue['users'], function(num){ return num.indexOf("NewAgent")}) != -1)
		{
			_.each(dialogue['turns'], function(turn, key, list){ 
				if ((turn['user'].toLowerCase().indexOf('agent') == -1) &&
					(turn['output'] != ''))
				{
					utdata.push({'input': normalizer(turn['input']),
								'output': turn['output']})
				}
			}, this)
		}
	}, this)


	utdata = utdata.concat(transfer)
	// console.log(utdata.length)
	// console.log(JSON.stringify(utdata, null, 4))

	// utdata = utdata.concat(olddata)
	utdata = _.shuffle(utdata)

	var dataset = partitions.partition(utdata, 1, Math.round(utdata.length*0.4))

	// console.log("one "+trainutils.dividedataset(utdata)['one'].length)
	// console.log("two "+trainutils.dividedataset(utdata)['two'].length)

	_.each(scfg, function(value, key, list){ 
		dataset['train'].push({'input': normalizer(value['input']),
								'output': value['output']})
	}, this)
	
	var output = {}
	var zero = 0
	var inputs = []

	// _.each(dataset['train'], function(value, key, list){ 
		// if (value["output"]  == "")
			// inputs.push(value['input'])
	// }, this)

	// console.log(inputs)
	// process.exit(0)

	_.each(trainutils.dividedataset(dataset['train'])['one'], function(value, key, list){
		
		// console.log(value)
		// process.exit(0)
		// console.log(value['output'][0])
		var str = _.isString(value['output'][0])? value['output'][0]: JSON.stringify(value['output'][0])
		
		// var str = JSON.stringify(value['output'][0])
		if (!(str in output))
			 output[str] = []
		output[str].push(normalizer(value['input']))
		output[str] = _.compact(_.unique(output[str]))
	}, this)

	// console.log(zero)
		
	_.each(output, function(value, key, list){ 
		output[key] = _.sample(value,50)
	}, this)


	var test = []
	_.each(dataset['test'], function(value, key, list){ 
			var out = []

			// console.log(value['output'])
			_.each(value['output'], function(value1, key1, list1){ 

					out.push(_.isString(value1)? JSON.parse(value1): value1)
			}, this)

		test.push({'input': normalizer(value['input']),
					// 'output': _.isString(value['output'])? value['output']: JSON.stringify(value['output'])})
					'output': out})
	}, this)

	console.log(JSON.stringify(output, null, 4))
	
	
	test = _.sample(test, 200)

	console.log(JSON.stringify(test, null, 4))
	process.exit(0)
}


if (prepare_dataset_for_gaby)
{
	
	var olddata = []
	var utdata = []
	
	olddata = olddata.concat(JSON.parse(fs.readFileSync("./datasets/Employer/Dialogue/students_keyphrases_only_rule.json")))
	olddata = olddata.concat(JSON.parse(fs.readFileSync("./datasets/Employer/Dialogue/turkers_keyphrases_only_rule.json")))
	olddata = trainutils.extractturns(olddata)
	
	// utdata = _.shuffle(utdata)
	// var clean = partitions.partition(utdata, 1, Math.round(utdata.length*0.4))

	// console.log("one "+trainutils.dividedataset(utdata)['one'].length)
	// console.log("two "+trainutils.dividedataset(utdata)['two'].length)
	
	// console.log()
	// process.exit(0)
	var filename = './dialogue_restore/new_ag1.json'
	data = JSON.parse(fs.readFileSync(filename))


	_.each(data, function(dialogue, key, list){ 
		// console.log(dialogue['status'])
		if (dialogue['status'] == 'goodconv')
		{
			_.each(dialogue['turns'], function(turn, key, list){ 
				if (turn['user'].toLowerCase().indexOf('agent') == -1)
				{
					utdata.push({'input': normalizer(turn['input']),
								'output': turn['output']})
				}
			}, this)
		}
	}, this)

	// console.log(utdata.length)
	// console.log(JSON.stringify(utdata, null, 4))

	utdata = utdata.concat(olddata)
	utdata = _.shuffle(utdata)

	var dataset = partitions.partition(utdata, 1, Math.round(utdata.length*0.4))

	// console.log("one "+trainutils.dividedataset(utdata)['one'].length)
	// console.log("two "+trainutils.dividedataset(utdata)['two'].length)
	
	var output = {}
	var zero = 0
	var inputs = []

	// _.each(dataset['train'], function(value, key, list){ 
		// if (value["output"]  == "")
			// inputs.push(value['input'])
	// }, this)

	// console.log(inputs)
	// process.exit(0)

	_.each(trainutils.dividedataset(dataset['train'])['one'], function(value, key, list){
		
		// console.log(value)
		// process.exit(0)
		// console.log(value['output'][0])
		var str = _.isString(value['output'][0])? value['output'][0]: JSON.stringify(value['output'][0])
		
		// var str = JSON.stringify(value['output'][0])
		if (!(str in output))
			 output[str] = []
		output[str].push(normalizer(value['input']))
		output[str] = _.compact(_.unique(output[str]))
	}, this)

	// console.log(zero)
	console.log(JSON.stringify(output, null, 4))


	var test = []
	_.each(dataset['train'], function(value, key, list){ 
		test.push({'input': normalizer(value['input']),
					'output': _.isString(value['output'])? value['output']: JSON.stringify(value['output'])})
	}, this)

	console.log(JSON.stringify(test, null, 4))
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
