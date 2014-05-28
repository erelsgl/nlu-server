/**
 * Trains and tests the NLU component.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var Hierarchy = require(__dirname+'/Hierarchy');

var sample_kbagent = false
var do_coverage = false
var do_separate_datasets = false
var test_aggregate_errors = false
var test_aggregate_keyphases = false
var test_underscore = false
var test_error_analysis = false
var test_keywords = false
var test_egypt = false
var test_natural = false
var test_spell = false
var test_segmentation = true
var do_spell_correction_test = false
var do_compare_approach = false
var do_partial_classification = false
var do_unseen_word_fp = false
var do_unseen_word_curve = false
var do_checking_tag = false
var do_small_temporary_test = false
var do_small_temporary_serialization_test = false
var do_learning_curves = false
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

var _ = require('underscore')._;
var fs = require('fs');
var trainAndTest= require('./utils/trainAndTest').trainAndTest_hash;
var Hierarchy = require(__dirname+'/Hierarchy');
var multilabelutils = require('limdu/classifiers/multilabel/multilabelutils');
var trainutils = require('./utils/bars')
// var Lemmer = require('node-lemmer').Lemmer;


var grammarDataset = JSON.parse(fs.readFileSync("datasets/Employer/0_grammar.json"));
var collectedDatasetMulti = JSON.parse(fs.readFileSync("datasets/Employer/1_woz_kbagent_students.json"));
var collectedDatasetSingle = JSON.parse(fs.readFileSync("datasets/Employer/1_woz_kbagent_students1class.json"));
var collectedDatasetMulti2 = JSON.parse(fs.readFileSync("datasets/Employer/2_experts.json"));
var collectedDatasetSingle2 = JSON.parse(fs.readFileSync("datasets/Employer/2_experts1class.json"));
var collectedDatasetMulti4 = JSON.parse(fs.readFileSync("datasets/Employer/3_woz_kbagent_turkers_negonlp2.json"));
var collectedDatasetMulti8 = JSON.parse(fs.readFileSync("datasets/Employer/4_various.json"));

var verbosity = 0;
var explain = 0;

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
var classifier = require(__dirname+'/classifiers')
var limdu = require("limdu");
var ftrs = limdu.features;

var regexpNormalizer = ftrs.RegexpNormalizer(
		JSON.parse(fs.readFileSync('knowledgeresources/BiuNormalizations.json')));

var stringifyClass = function (aClass) {
  	return (_(aClass).isString()? aClass: JSON.stringify(aClass));
  };

var createNewClassifier = function() {
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

// var clonedataset  = function(dataset) {

// 	trainSet1 = []
// 		_.each(dataset, function(value, key, list){
// 			trainSet1.push(_.clone(value))
// 			})
// 		return trainSet1
// };

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

if (count_2_intents_2_attributes)
	{
	dataset = [
			"5_woz_ncagent_turkers_negonlp2ncAMT.json",
			"nlu_ncagent_students_negonlpnc.json",
			"nlu_ncagent_turkers_negonlpncAMT.json"
			]

	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})

	data = _.shuffle(data)

	Observable = {}
		_.each(data, function(datum, key, list){				
			_.each(multilabelutils.normalizeOutputLabels(datum.output), function(lab, key, list){				
				_.each(Hierarchy.splitJson(lab), function(element, key, list){
						console.log(lab)
					if (key==0)
						if (!(element in Observable))
								Observable[element] = {}
					if (key==1)
						if (!(element in Observable[list[key-1]]))
								Observable[list[key-1]][element] = {}
					if (key==2)
						if (!(element in Observable[list[key-2]][list[key-1]]))
								Observable[list[key-2]][list[key-1]][element] = {}

				}, this)
			}, this)
		}, this)

	count = 0
	_.each(data, function(value, key, list){ 
				output = (Hierarchy.splitPartEqually(multilabelutils.normalizeOutputLabels(value.output)))	
				if ((output[0].length >=2) && (output[1].length>=2))
					{
						count = count + 1
							// console.log(output)
					}
	}, this)
		
	
	ambiguity = []
	_.each(data, function(value, key, list){ 
			output = (Hierarchy.splitPartEqually(multilabelutils.normalizeOutputLabels(value.output)))	
			_.each(output[1], function(attr, key, list){
				listt = []
				_.each(output[0], function(intent, key, list){
					if (Object.keys(Observable[intent]).indexOf(attr) != -1)
						{
						listt.push(intent)
						} 
					}, this)

				if (listt.length >= 2)
					{
						amb = {}
						amb['attr'] = attr
						amb['list'] = listt
						ambiguity.push(amb)
					}
				}, this)
		}, this)
	console.log(ambiguity)
	console.log(ambiguity.length)
	}



if (test_underscore)
{
}
if (test_aggregate_errors)
{

	// var filenamejson = "errors_composite1.json"
	var filenamejson = "errors_component1.json"
	// var filenamehtml = "errors_composite1.html"
	var filenamehtml = "errors_component1.html"
	var data = JSON.parse(fs.readFileSync(filenamejson))
	// composite-wise
	// var error_hash = {
	// 	'1': "negation:with and without car",
	// 	'2': "Offer:Attribute:Negative Value vs Reject:Attribute",
	// 	//'3': "Reject FP negation",
	// 	'4': "Query:compomise FN",
	// 	'5': "Reject:previous vs Reject:specific",
	// 	'6': "Accept FP: grip accept word",
	// 	'7': "with Leased car correlated with 'with'",
	// 	'8': "Reject FP: grip negative meaning word",
	// 	'9': "Reject vs Accept: confusing",
	// 	'10': "unknown words/misspelling/complex",
	// 	'11': "Offer: grip offer word",
	// 	'12': "Insist FN",
	// 	'13': "Query:accept vs Query:specific",
	// 	'14': "Insist FP",
	// 	'15': "no agreement FN",
	// 	'16': "Insist specific: Insist previous",
	// 	'17': "Apeend FP",
	// 	'18': "Append FN",
	// 	'19': "Offer wrong attribute same value"
	// }

// component-wise
var error_hash = {
"1": "Insist FP",
"2": "Query FP: grip query word (ok, only, compomise)",
"4": "Query FN",
"3": "Append FN",
"5": "Insist vs Offer",
"6": "Query vs Reject",
"7": "Accept FP: grip accept related word",
"8": "Reject FP: grip reject related word",
"9": "Offer FP: grip  the value string",
"10": "Accept vs Reject in the same sentence",
"11": "Offer:nothing vs Reject:something",
"12": "Append FP",
"13": "unknown word/misspelled/complicated phrase",
"15": "Accept Query",
"16": "Offer Accept",
"17": "Taggging questionable",
"18": "Quit FP",
"19": "Leased car and with connecion",
"20": "Salary FP",
"21": "Job description FP correlated 'job'",
"22": "Append FP",
"23": "Append FN",
"24": "Offer FP: grip the value string",
"25": "Pension fund FN",
"26": "Salary FN",
"27": "previous FP",
"28": "Value confusion with vs without",
"29": "Value where there is no value just string",
"30": "confusiong between similar values"
}

	var label_count = []
	_(Object.keys(error_hash).length+2).times(function(n){label_count.push(0)})

	_(3).times(function(n){
		_.each(data[n], function(value, key, list){ 
			if (!(_.isEqual(value['errorclass'], [''])))
				{
				_.each(value['errorclass'], function(err, key, list){
					label_count[parseInt(err)] = label_count[parseInt(err)] + 1
				}, this)
				}
		}, this)
	})

	var overallsum = _.reduce(_.compact(label_count), function(memo, num){ return memo + num; }, 0);

	fs.writeFileSync(filenamehtml, "<html><body>", 'utf-8')
	// fs.writeFileSync(filenamehtml, "<a href=\"#chapter4\">blabla</a>", 'utf-8')

	// fs.appendFileSync(filenamehtml, "<table style=\"white-space: pre-wrap;\"><tr><td>"+JSON.stringify(data[0][0]['stat'], null, 4)+"</td></tr></table>", 'utf-8')
	fs.appendFileSync(filenamehtml, "<table border=\"1\" style=\"white-space: pre-wrap;\">", 'utf-8')

	_.each(label_count, function(value, key, list){
		if (label_count[key]>0) 
			fs.appendFileSync(filenamehtml, "<tr><td><a href=\"#"+key+"\">"+error_hash[key]+"</a></td><td>"+label_count[key]+"</td><td>"+(label_count[key]/overallsum).toFixed(2)+"%</td></tr>", 'utf-8')
	}, this)	
	fs.appendFileSync(filenamehtml, "</table>", 'utf-8')

	_.each(error_hash, function(value, key, list){ 
		if (label_count[parseInt(key)]>0)
		{
		fs.appendFileSync(filenamehtml, "<a name=\""+key+"\"><i>"+value+"</i></a>", 'utf-8')
		fs.appendFileSync(filenamehtml, "<table style=\"white-space: pre-wrap;\">", 'utf-8')
			_(3).times(function(n){
				_.each(data[n], function(item, key1, list){
				// _.each(list, function(value, key, list){ 
				// }, this)
					if (item['errorclass'].indexOf(key)!=-1)
						{
						fs.appendFileSync(filenamehtml, "<tr><td><b>"+item['input']+"</b></td></tr>", 'utf-8')
						fs.appendFileSync(filenamehtml, "<tr><td>"+JSON.stringify(item['stat'], null, 4)+"</td></tr>", 'utf-8')
						}
				}, this)
			})
		fs.appendFileSync(filenamehtml, "</table>", 'utf-8')
		}
	}, this)

	// fs.appendFileSync(filenamehtml, "<table style=\"white-space: pre-wrap;\">", 'utf-8')
	// fs.appendFileSync(filenamehtml, "<a name=\"chapter4\"></a>", 'utf-8')
	fs.appendFileSync(filenamehtml, "</body></html>", 'utf-8')
}

if (test_aggregate_keyphases)
{
	var data = JSON.parse(fs.readFileSync("keyphases.json"))
	var stats = {}

	_.each(data, function(item, key, list){ 
		_.each(item['labels'], function(values, label, list){
			if (!(label in stats)) 
					stats[label] = {}
 			// _.each(values, function(value, key, list){
 				if (!(_.isEqual(values,[''])))
 				// if (values.length > 0)
 					{
	 					_.each(values, function(value, key1, list){ 
							if (!(value in stats[label]))
								 stats[label][value] = []
							stats[label][value].push(item['sentence'])
	 						
	 					}, this)
 					}
	 					// stats[label] = stats[label].concat(values)

			 // }, this) 
		}, this)
	}, this)

	// console.log(stats)
	// process.exit(0)

	// _.each(stats, function(values, label, list){
		// stats[label] = _.countBy(values, function(num) { return num });
	// }, this)


	// var filename = "keyphases.csv"

	// fs.writeFileSync(filename, Object.keys(stats).join(";")+"\n", 'utf-8')

	// _(10).times(function(n){
	// 	var row = []
	// 	_.each(stats, function(values, label, list){
	// 		if (Object.keys(values).length>n-1) 
	// 			row.push(Object.keys(values)[n])
	// 		else
	// 			row.push('')
	// 	}, this)
	// 	fs.appendFileSync(filename, row.join(";")+"\n", 'utf-8')
	// })
	
	var filenamehtml = "keyphases.html"
	fs.writeFileSync(filenamehtml, "<html>", 'utf-8')
	fs.appendFileSync(filenamehtml, "<head>", 'utf-8')
	fs.appendFileSync(filenamehtml, "<style>ul li ul { display: none; }</style>", 'utf-8')
	
	fs.appendFileSync(filenamehtml, "<script src='http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js'></script>\n",'utf-8')
	fs.appendFileSync(filenamehtml, "</head>", 'utf-8')
	fs.appendFileSync(filenamehtml, "<body>", 'utf-8')
	fs.appendFileSync(filenamehtml, "<script>$(document).ready(function() { $('.list > li a').click(function() {$(this).parent().find('ul').toggle();});});</script>\n", 'utf-8')

	fs.appendFileSync(filenamehtml, "set size "+data.length+" utterances<br>", 'utf-8')
	fs.appendFileSync(filenamehtml, "date of the report "+new Date().toJSON().slice(0,10)+"<br>", 'utf-8')

	fs.appendFileSync(filenamehtml, "<table border=\"1\" style=\"white-space: pre-wrap;\">", 'utf-8')

	_.each(stats, function(keylist, label, list){

		fs.appendFileSync(filenamehtml, "<tr><td><b>"+label+"</b></td><td></td></tr>", 'utf-8')
		// fs.appendFileSync(filenamehtml, "<ul class='list'><li><a>"+label+"</a><ul><li>adda</li><li>ssss</li></ul></li></ul>", 'utf-8')

		var tolist = _.pairs(keylist)
		tolist = _.sortBy(tolist, function(num){ return num[1].length; });
		_.each(tolist.reverse(), function(value, key, list){ 
			// fullist = ""
			// _.each(list, function(value, key, list){ 

			// }, this)
			fs.appendFileSync(filenamehtml, "<tr><td><ul class='list'><li><a>"+value[0]+"</a><ul><il>"+value[1].join("</il><br><il>")+"</il></ul></il></ul></td><td>"+value[1].length+"</td></tr>", 'utf-8')
		}, this)
	}, this)

	fs.appendFileSync(filenamehtml, "</table>", 'utf-8')
	fs.appendFileSync(filenamehtml, "</body></html>", 'utf-8')

	console.log(stats)
	process.exit(0)
}




if (test_error_analysis)
{
	var data = []
	var errors = [[],[],[]]
	
	var dataset = ["nlu_ncagent_students_negonlpnc.json"]//"nlu_ncagent_turkers_negonlpncAMT.json"]
	// var dataset = ["5_woz_ncagent_turkers_negonlp2ncAMT.json"]
	
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})

	partitions.partitions(data, 10, function(trainSet, testSet, index) {
		// var stats = trainAndTest.trainAndTest_hash(classifier.WinnowSegmenter, trainSet, testSet, 5)
		var stats = trainAndTest.trainAndTest_hash(classifier.CompositeSagaeSeparation, trainSet, testSet, 5)
		// over intent attribute value
		_.each(stats, function(stat, key1, list){ 
			var samp = _.sample(stat['data'], 20)
			_.each(samp, function(value, key, list){
				if ((value['explanation']['FP'].length != 0) || (value['explanation']['FN'].length != 0))
					// {
					// console.log(key1)
					errors[key1].push({'input':value['input'],'errorclass':[''],'stat':value['explanation'],'original':value['original']})	
					// }
			}, this)
		});
	});
	
	console.log(JSON.stringify(errors, null, 4))
	process.exit(0)
}

if (test_keywords)
{
	
	var data = []
	var dataset = ["students.json","turkers.json"]
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	})

	var output = []
	var setoflab = {}


	_.each(data, function(item, key, list){ 
		_.each(item['turns'], function(turn, key, list){ 
			setoflab = {'sentence': turn['input'], 'labels':{}}
			_.each(turn['output'], function(label, key, list){
				_.each(Hierarchy.splitPartEqually(multilabelutils.normalizeOutputLabels(label)), function( elem, key, list){ 
					if (elem.length != 0)
						setoflab['labels'][elem]=[""]
				 }, this) 
			}, this)
			output.push(setoflab)
		}, this)
	}, this)

	console.log(JSON.stringify(output, null, 4))
	console.log()
	process.exit(0)

}

if (do_unseen_word_curve)
	{
	dataset = [			"5_woz_ncagent_turkers_negonlp2ncAMT.json",
			// "nlu_ncagent_students_negonlpnc.json",
			"nlu_ncagent_turkers_negonlpncAMT.json"


			]

	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})
	
	unseen_words_curves(data)

	}


if (test_natural)
{
// var tokenizer = new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9%,'$]+/});

	// var tokenizer = new natural.WordTokenizer({'pattern':(/(\W+|\%|)/)}); // WordTokenizer, TreebankWordTokenizer, WordPunctTokenizer
	var words = tokenizer.tokenize("I will , offer 12,000 NIS");
	console.log(words)
	process.exit(0)


	// TfIdf = natural.TfIdf,
    // tfidf = new TfIdf();

	// var features = natural.NGrams.ngrams('this node document is about this node.', 2)

	// tfidf.addDocument(features)

	// tfidf.addDocument('this node document is about node.');
	// tfidf.addDocument('this document is about ruby.');
	// tfidf.addDocument('this document is about ruby and node.');

// document #0 is 0.4054651081081644 3/2*1
// document #1 is 3/2*0
// document #2 is 0.4054651081081644


	// tfidf.tfidfs('node')
	// console.log()
	// process.exit(0)

	// tfidf.tfidfs('node', function(i, measure) {
   	 	// console.log('document #' + i + ' is ' + measure);
	// });
	// var a = tfidf.idf("node")
	// sentence = "I have 15% from the deal"
	// var tokenizer = new natural.WordTokenizer(); // WordTokenizer, TreebankWordTokenizer, WordPunctTokenizer
	// var tokenizer = new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9%]+/});
	
	// var words = tokenizer.tokenize(sentence);
//
	// console.log(words)
	// process.exit(0)

	// var features = natural.NGrams.ngrams('hi, i will offer 12000  with a car and a pension', 1)
	// console.log(features)
	// process.exit(0)
	// var a = natural.NGrams.ngrams("aaa bbb ccc ddd", 2)
	// console.log(a)
	// process.exit(0)
	// sentence = "I offer you a salaries of 20000 NIS and 9 hours"
	// dist = natural.JaroWinklerDistance(a,"house")
	// console.log(dist)
	// process.exit(0)
	// a = trainutils.sentenceStem(sentence)
	// console.log(a)
	// var lemmerEng = new Lemmer('english');
	// a = lemmerEng.lemmatize('10%');
	// console.log(a)
	// natural.LancasterStemmer.attach();
	// var words = sentence.tokenizeAndStem()
	// console.log(sentence)
		
	// console.log(words)
	// process.exit(0)

	// lis = trainutils.retrievelabels()
	// console.log(lis)
	// process.exit(0)

	var EdgeWeightedDigraph = natural.EdgeWeightedDigraph;
	var digraph = new EdgeWeightedDigraph();

	// digraph.add(1,1,0);
	// digraph.add(1,2,0.35);
	digraph.add(1,3,1);
	// digraph.add(1,4,0);
	// digraph.add(1,5,0.93);
	digraph.add(3,6,0);

	// digraph.add(2,2,0);
	// digraph.add(2,3,0);
	// digraph.add(2,4,0);
	// digraph.add(2,5,0.32);
	// digraph.add(2,6,0);

	// digraph.add(3,3,0);
	// digraph.add(3,4,0);
	// digraph.add(3,5,0.40);
	// digraph.add(3,6,0);

	// digraph.add(4,4,0);
	// digraph.add(4,5,0);
	// digraph.add(4,6,0.52);

	// digraph.add(5,5,0);
	// digraph.add(5,6,0);

	// digraph.add(6,6,0);

	// digraph.add(1,2,1);
	// digraph.add(2,3,1);
	// digraph.add(1,3,3);

	var ShortestPathTree = natural.ShortestPathTree;
	var spt = new ShortestPathTree(digraph, 1);
	var path = spt.pathTo(6);

	console.log(JSON.stringify(path, null, 4))
	console.log()
	console.log()
	process.exit(0)

	var costs = [
    [0,0.35,0.29,0,0.93,0],
    [Infinity,0,0,0,0.32,0],
    [Infinity,Infinity,0,0,0.40,0],
    [Infinity,Infinity,Infinity,0,0,0.52],
    [Infinity,Infinity,Infinity,Infinity,0,0],
    [Infinity,Infinity,Infinity,Infinity,Infinity,0],
	];

	var cheapest_paths_from_0 = cheapest_paths(costs, 0);

	console.log(JSON.stringify(cheapest_paths_from_0, null, 4))
}

if (test_egypt)
{
	dataset = [
			// "5_woz_ncagent_turkers_negonlp2ncAMT.json",
			// "egp-nlu_ncagent_students_negonlpnc.json",
	  		// "egp-nlu_ncagent_turkers_negonlpncAMT.json",
	  		// "egp-2_experts1class.json",
	  		// "egp-4_various1class.json"
	  		// "nlu_ncagent_students_negonlpnc.json",
			// "nlu_ncagent_turkers_negonlpncAMT.json",

			"usd-nlu_ncagent_students_negonlpnc.json",
			"usd-nlu_ncagent_turkers_negonlpncAMT.json"
	]

	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer-usa/"+value)))
		// data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer-usa/"+value)))
	})

	// datatrain = _.shuffle(data)

	// datatest = JSON.parse(fs.readFileSync("datasets/Employer-egypt/egp-from-HvH.json"))

	dataset = partitions.partition(data, 1, Math.round(data.length*0.3))

	stats = trainAndTest.trainAndTest_hash(classifier.HomerWinnow, dataset['train'], dataset['test'], 5)
// 
	console.log(JSON.stringify(stats[0]['stats'], null, 4))
	
	stats1 = trainAndTest.trainAndTest_hash(classifier.HomerWinnowNoSpell, dataset['train'], dataset['test'], 5)

	console.log(JSON.stringify(stats1[0]['stats'], null, 4))

// stats = trainAndCompare(
		// classifier.HomerWinnow, 
		// classifier.HomerWinnowNoSpell,
		// datatrain, datatest, 5) 
	
	// console.log(JSON.stringify(stats, null, 4))

	process.exit(0)
}	

if (naive1)
	{
	dataset = [
			"5_woz_ncagent_turkers_negonlp2ncAMT.json",
			"nlu_ncagent_students_negonlpnc.json",
	  		"nlu_ncagent_turkers_negonlpncAMT.json"
	]

	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})


	data = _.shuffle(data)
	dataset = partitions.partition(data, 1, Math.round(data.length*0.3))

	var classifier = new classifier.PartialClassificationEquallyNaive;
	classifier.trainBatch(clonedataset(dataset['train']));

	// repla = {"previous":"and","Leased Car": "car","7,000 NIS": "7000", "12,000 NIS":"12000", "20,000 NIS":"20000","Promotion Possibilities":"fast slow", "Without leased car":"without car","Query": "how","Slow promotion track":"slow track","Fast promotion track":"fast track","10 hours": "10 hours", "9 hours": "9 hours", "8 hours": "8 hours", "Working Hours": "hours", "Job Description": "job", "Greet": "hi", "60,000 USD": "60000", "90,000 USD": "90000", "120,000 USD":"12000"}
	// repla = {"previous":"and","7,000 NIS": "7000", "12,000 NIS":"12000", "20,000 NIS":"20000","60,000 USD": "60000", "90,000 USD": "90000", "120,000 USD":"12000"}
	repla = {"previous":"and","Leased Car": "car","7,000 NIS": "7000", "12,000 NIS":"12000", "20,000 NIS":"20000"}

	bag_of_labels = []

	Observable = {}

	_.each(clonedataset(dataset['train']), function(datum, key, list){
		// datum.input = regexpNormalizer(datum.input)
		_.each(multilabelutils.normalizeOutputLabels(datum.output), function(label, key, list){				
			_.each(Hierarchy.splitJson(label), function(element, key, list){
				if (element in repla)
					{
					element = repla[element]
					list[key] = element
					}
				// if ((element != "Accept") && (element != "Reject")&& (element != "No agreement")&& (element != "how"))
				if ((element != "No agreement"))
				if (key != 0)
					bag_of_labels.push(element)
				// if (key==0)
				// 	if (!(element in Observable))
				// 			Observable[element] = {}
				// if (key==1)
				// 	if (!(element in Observable[list[key-1]]))
				// 			Observable[list[key-1]][element] = {}
				// if (key==2)
				// 	if (!(element in Observable[list[key-2]][list[key-1]]))
				// 			Observable[list[key-2]][list[key-1]][element] = {}

			}, this)
		}, this);
	}, this)

	bag_of_labels = _.uniq(bag_of_labels)

	// defining threshold for labels
	string_to_file = ""
	_.each(bag_of_labels, function(value, key, list){ 
		_.each(bag_of_labels, function(value1, key, list){ 
			string_to_file = string_to_file +value+"&"+value1+"&BLA\n"
			}, this)
	}, this)

	fs.writeFileSync("/tmp/toJava", string_to_file)
	// var result = execSync("cd /home/com/SEMILAR-API-1.0/sim; java -jar /home/com/SEMILAR-API-1.0/sim/similar_greedyComparerWNLin.jar")
	var result = execSync("cd /home/com/SEMILAR-API-1.0/sim; java -jar /home/com/SEMILAR-API-1.0/sim/similar_cmComparer.jar")

	var stats = fs.readFileSync("/tmp/toNode", "utf8");
	stats=stats.split("\n")
	stats.pop()

	threshold = {}
	_.each(stats, function(value, key, list){
		text = value.split("&")

		if (!(text[0] in threshold))
			threshold[text[0]] = 0


		if ((parseFloat(text[2])>threshold[text[0]]) &&
			(text[1] != text[0]))
			threshold[text[0]] = parseFloat(text[2])
	})

	// end defining threhold for labels
		

	labels = {}

	string_to_file = ""
		_.each(dataset['test'], function(value, key, list){ 
			value.input = regexpNormalizer(value.input)

			_.each(bag_of_labels, function(label, key, list){ 
				string_to_file = string_to_file +value.input+"&"+label+"&"+value.output+"\n"
				}, this)
			}, this)


	_.each(clonedataset(dataset['test']), function(value, key, list){ 
			labels[value.input] = {}
			labels[value.input]['actual_separated'] = []
			labels[value.input]['labels_similarity_evaluation'] = []
			classification = classifier.classify(value.input)
			labels[value.input]['actual_separated'] = labels[value.input]['actual_separated'].concat(_.flatten(classification))
			}, this)


	fs.writeFileSync("/tmp/toJava", string_to_file)

	// var result = execSync("cd /home/com/SEMILAR-API-1.0/sim; java -jar /home/com/SEMILAR-API-1.0/sim/similar_greedyComparerWNLin.jar")
	var result = execSync("cd /home/com/SEMILAR-API-1.0/sim; java -jar /home/com/SEMILAR-API-1.0/sim/similar_cmComparer.jar")
	var stats = fs.readFileSync("/tmp/toNode", "utf8");
	stats=stats.split("\n")
	stats.pop()

	_.each(stats, function(value, key, list){
		// bag_of_labels = []
		text = value.split("&")

		for (mask in repla)
			if (repla[mask] == text[1])
				text[1] = mask 

		text[3] = JSON.parse("["+text[3]+"]")

		labels[text[0]]['correct_gold_standard'] = text[3]
		// labels[text[0]]['expected']=[]

		
		labels[text[0]]['labels_similarity_evaluation'].push([text[1],text[2]])
		// if ((parseFloat(text[2]))>0.02)
		if ((parseFloat(text[2]))>threshold[text[1]])
			labels[text[0]]['actual_separated'].push(text[1])

		// labels[text[0]]['expected'] = _.uniq(labels[text[0]]['expected'].concat(bag_of_labels))

	}, this)

	// process.exit(0)
	
	var currentStats = new PrecisionRecall();

	Observable = {}
			for (label in labels)
			{
			_.each(multilabelutils.normalizeOutputLabels(labels[label]['correct_gold_standard']), function(lab, key, list){				
				_.each(Hierarchy.splitJson(lab), function(element, key, list){
					// if (element in repla)
					// 	{
					// 	element = repla[element]
					// 	list[key] = element
					// 	}
					bag_of_labels.push(element)
					if (key==0)
						if (!(element in Observable))
								Observable[element] = {}
					if (key==1)
						if (!(element in Observable[list[key-1]]))
								Observable[list[key-1]][element] = {}
					if (key==2)
						if (!(element in Observable[list[key-2]][list[key-1]]))
								Observable[list[key-2]][list[key-1]][element] = {}

				}, this)
			}, this);
		// }, this)
		}

for (label in labels)
		{
			possib = []
	for (intent in Observable)
			{
				if ((labels[label]['actual_separated'].indexOf(intent)!=-1) && ((intent == "Greet") || (intent == "Quit")))
				{
				possib.push(Hierarchy.joinJson([intent,true]))
				}
			// console.log(intent)
			manyofattr = []
			for (attr in Observable[intent])
				{
				// console.log(attr)
				if (Object.keys(Observable[intent][attr]).length==0)
					// if ((values.indexOf(intent)!=-1) && (values.indexOf(attr)!=-1))
						if ((labels[label]['actual_separated'].indexOf(intent)!=-1) && (labels[label]['actual_separated'].indexOf(attr)!=-1))
						{
						_.each(labels[label]['labels_similarity_evaluation'], function(v, key, list){
						if (v[0] == attr)
							num = v[1]  
						}, this)

						manyofattr.push([Hierarchy.joinJson([intent,attr]), parseFloat(num)])
						}
				manyof = []
				for (value in Observable[intent][attr])
					{

					_.each(labels[label]['labels_similarity_evaluation'], function(v, key, list){
							if (v[0] == value)
								num = v[1]  
							}, this)
					// console.log(intent+attr+value)
					if (((labels[label]['actual_separated'].indexOf(intent)!=-1) && (labels[label]['actual_separated'].indexOf(attr)!=-1) && (labels[label]['actual_separated'].indexOf(value)!=-1)) ||
						((labels[label]['actual_separated'].indexOf(intent)!=-1) && (labels[label]['actual_separated'].indexOf(value)!=-1) && (parseFloat(num)>0.1)) || 
						((labels[label]['actual_separated'].indexOf(attr)!=-1) && (labels[label]['actual_separated'].indexOf(value)!=-1)))

						{


						_.each(labels[label]['labels_similarity_evaluation'], function(v, key, list){
							if (v[0] == value)
								num = v[1]  
							}, this)


						manyof.push([Hierarchy.joinJson([intent,attr,value]), parseFloat(num)])
						
						// possib.push(Hierarchy.joinJson([intent,attr,value]))
						}
					}

					if (manyof.length != 0)
				{
				manyof = _.sortBy(manyof, function(num){ return num[1]; });
			
					{possib.push(manyof.reverse()[0][0])}
				}
				}


				if (manyofattr.length != 0)
				{
				manyofattr = _.sortBy(manyofattr, function(num){ return num[1]; });
			
					{possib.push(manyofattr.reverse()[0][0])}
				}
			}


		console.log(label)
		labels[label]['joined'] = possib
		console.log(JSON.stringify(labels[label], null, 4))


		console.log("-----------------")
			currentStats.addCases(labels[label]['correct_gold_standard'], possib);
	}
		console.log("SUMMARY: "+currentStats.calculateStats().shortStats());

	}
if (naive)
	{

	dataset = [
			   "nlu_ncagent_turkers_negonlpncAMT.json"
			]
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})

	repla = {"Leased Car": "car","7,000 NIS": "7000", "12,000 NIS":"12000", "20,000 NIS":"20000","Promotion Possibilities":"fast slow", "Without leased car":"without no car","Query": "how","Slow promotion track":"slow track","Fast promotion track":"fast track","10 hours": "10", "9 hours": "9", "8 hours": "8", "Working Hours": "hours", "Job Description": "job", "Greet": "hi", "60,000 USD": "60000", "90,000 USD": "90000", "120,000 USD":"12000"}

	bag_of_labels = []

	Observable = {}
	_.each(data, function(datum, key, list){
		datum.input = regexpNormalizer(datum.input)
		_.each(multilabelutils.normalizeOutputLabels(datum.output), function(label, key, list){				
			_.each(Hierarchy.splitJson(label), function(element, key, list){
				if (element in repla)
					{
					element = repla[element]
					list[key] = element
					}
				if ((element != "Accept") && (element != "Reject")&& (element != "No agreement")&& (element != "how"))
				//if ((element != "Reject"))
					bag_of_labels.push(element)
				// if (key==0)
				// 	if (!(element in Observable))
				// 			Observable[element] = {}
				// if (key==1)
				// 	if (!(element in Observable[list[key-1]]))
				// 			Observable[list[key-1]][element] = {}
				// if (key==2)
				// 	if (!(element in Observable[list[key-2]][list[key-1]]))
				// 			Observable[list[key-2]][list[key-1]][element] = {}

			}, this)
		}, this);
	}, this)

	bag_of_labels = _.uniq(bag_of_labels)
	labels = {}

	string_to_file = ""
		_.each(data, function(value, key, list){ 
			_.each(bag_of_labels, function(label, key, list){ 
				string_to_file = string_to_file +value.input+"&"+label+"&"+value.output+"\n"
				}, this)
			}, this)

	fs.writeFileSync("/tmp/toJava", string_to_file)

	var result = execSync("cd /home/com/SEMILAR-API-1.0/sim; java -jar /home/com/SEMILAR-API-1.0/sim/similar.jar")

	var stats = fs.readFileSync("/tmp/toNode", "utf8");
	stats=stats.split("\n")
	stats.pop()
	_.each(stats, function(value, key, list){
		// bag_of_labels = []
		text = value.split("&")

		for (mask in repla)
			if (repla[mask] == text[1])
				text[1] = mask 

			console.log(value)
		text[3] = JSON.parse("["+text[3]+"]")

		_.each(multilabelutils.normalizeOutputLabels(normalizeClasses(text[3])), function(value, key, list){
			_.each(Hierarchy.splitJson(value), function(lab, key, list){ 
				// bag_of_labels.push(lab)
					}, this) 
			}, this)

		if (!(text[0] in labels))
			{
			labels[text[0]] = {}
			labels[text[0]]['labels'] = []
			labels[text[0]]['correct'] = text[3]
			labels[text[0]]['expected']=[]
			labels[text[0]]['actual']=[]

			}

		labels[text[0]]['labels'].push([text[1],text[2]])
		if ((parseFloat(text[2]))>0)
			labels[text[0]]['actual'].push(text[1])

		labels[text[0]]['expected'] = _.uniq(labels[text[0]]['expected'].concat(bag_of_labels))

	}, this)

	var currentStats = new PrecisionRecall();

	for (label in labels)
	{
		currentStats.addCases(labels[label]['expected'], labels[label]['actual']);
	}
	console.log("SUMMARY: "+currentStats.calculateStats().shortStats());


	bag_of_labels = []

		Observable = {}
			for (label in labels)
			{
			_.each(multilabelutils.normalizeOutputLabels(labels[label]['correct']), function(lab, key, list){				
				_.each(Hierarchy.splitJson(lab), function(element, key, list){
					// if (element in repla)
					// 	{
					// 	element = repla[element]
					// 	list[key] = element
					// 	}
					bag_of_labels.push(element)
					if (key==0)
						if (!(element in Observable))
								Observable[element] = {}
					if (key==1)
						if (!(element in Observable[list[key-1]]))
								Observable[list[key-1]][element] = {}
					if (key==2)
						if (!(element in Observable[list[key-2]][list[key-1]]))
								Observable[list[key-2]][list[key-1]][element] = {}

				}, this)
			}, this);
		// }, this)
		}



	var currentStats = new PrecisionRecall();

	for (label in labels)
		{
			possib = []
			for (intent in Observable)
			{
				if ((labels[label]['actual'].indexOf(intent)!=-1) && (intent == "Greet"))
				{
				possib.push(Hierarchy.joinJson([intent,true]))

				}
			// console.log(intent)
			for (attr in Observable[intent])
				{
				// console.log(attr)
				if (Object.keys(Observable[intent][attr]).length==0)
					if ((labels[label]['actual'].indexOf(intent)!=-1) && (labels[label]['actual'].indexOf(attr)!=-1))
						possib.push(Hierarchy.joinJson([intent,attr]))

				manyof = []
				for (value in Observable[intent][attr])
					{

					// console.log(intent+attr+value)
					// if ((labels[label]['actual'].indexOf(intent)!=-1) && (labels[label]['actual'].indexOf(attr)!=-1) && (labels[label]['actual'].indexOf(value)!=-1))
					
					if ((labels[label]['actual'].indexOf(attr)==-1) && (labels[label]['actual'].indexOf(value)!=-1))
					{

						_.each(labels[label]['labels'], function(v, key, list){
							if (v[0] == value)
								if  (parseFloat(v[1])>0.13)  {
									manyof.push([Hierarchy.joinJson([intent,attr,value]), parseFloat(v[1])])
								}
							}, this)

					}

					if ((labels[label]['actual'].indexOf(attr)!=-1) && (labels[label]['actual'].indexOf(value)!=-1))
					// if ((labels[label]['actual'].indexOf(value)!=-1) && (value != "No agreement"))

						{

						_.each(labels[label]['labels'], function(v, key, list){
							if (v[0] == value)
								num = v[1]  
							}, this)


						manyof.push([Hierarchy.joinJson([intent,attr,value]), parseFloat(num)])
						}


					}

				if (manyof.length != 0)
				{
				manyof = _.sortBy(manyof, function(num){ return num[1]; });
			
				// if ((manyof.length > 2) && (manyof.reverse()[0][0].indexOf("No agreement") != -1))
				// {
				// 	possib.push(manyof.reverse()[1][0])
				// }
				// else
					{possib.push(manyof.reverse()[0][0])}
				}
			}}
		console.log(label)
		console.log(labels[label])
		console.log(labels[label]['correct'])
		console.log(possib)
		console.log("-----------------")
			currentStats.addCases(labels[label]['correct'], possib);


		}

	console.log("SUMMARY: "+currentStats.calculateStats().shortStats());


	// console.log(JSON.stringify(labels, null, 4))
	process.exit(0)

	}

if (do_compare_approach)
	{
	dataset = [
		    // "5_woz_ncagent_turkers_negonlp2ncAMT.json",
		    // "nlu_ncagent_students_negonlpnc.json",
		    "nlu_ncagent_turkers_negonlpncAMT.json"
			]
	data = []

	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})

	data = _.shuffle(data)
	// data = _.sample(data, 200)
	dataset = partitions.partition(data, 1, Math.round(data.length*0.5))




	stats = trainAndTest.trainAndCompare(
		classifier.PartialClassificationEquallySagae, 
		classifier.WinnowSegmenter,
		dataset['train'], dataset['test'], 5) 
	console.log()
	process.exit(0)
	// PartialClassificationEquallySagae: classifier.PartialClassificationEquallySagae,
		// StandardSagae: classifier.WinnowSegmenter, 

	var composite = new classifier.PartialClassificationEquallySagae
	composite.trainBatch(dataset['train'])

	var component = new classifier.WinnowSegmenter
	component.trainBatch(dataset['train'])

	_.each(dataset['test'], function(value, key, list){
		actual_composite = composite.classify(value.input, 50, true)
		actual_component = component.classify(value.input, 50, true)
		// console.log(actual_component)
		// console.log(value)
		// console.log(actual_component)
		// process.exit(0)
		// var amb = trainutils.intent_attr_label_ambiguity(actual_component.classes)


		// if (amb.length>0)
			{
			// var gen = trainutils.generate_labels(actual_component.classes)
			console.log(value)
			// console.log(gen)
			console.log(actual_component.classes)
			console.log(actual_composite.classes)
			// process.exit(0)
			// _.each(gen, function(lab, key, list){
				// console.log(lab)
				// console.log(actual_composite['scores'][lab])	 
			// }, this)
			console.log("------------------------------------------")

			}

		// console.log("------------------------------------------")

		// console.log("___________________-")
		// console.log(actual_component.classes)
		// console.log(trainutils.generate_labels(actual_component.classes))
		// console.log()
		// process.exit(0)
		// trainutils.generate_labels
		// if (amb.length > 0)
		// 	{

		// 	console.log("_________________________________")
		// 	console.log(amb)
		// 	console.log(value)
		// 	console.log(actual_composite)
		// 	console.log(actual_component)
		// 	process.exit(0)
		// 	}
	}, this)
		// trainutils.intent_attr_label_ambiguity = function(output)

	console.log()
	process.exit(0)
	}

if (do_spell_correction_test)
	{
	var a = ["iam speak english . france and am a good team manager ",
		"but i can work as aprogrammer if you pay to me 9000",
		"nd give me 9000",
		"i will give you 9000 but with pensino fund 10%",
		"yes i can start from tomorrwo if you want",
		"yes i honour to be one of your company ",
		"yeah surethere are know anavaliable job ",
		"as asalary",
		"dou you want alealesed car",
		"but we will incrase the working hour to 10 hours you agree?",
		"Thank you very mush",
		"no thanxx that is good ",
		"good afteroon mr osama",
		"what your opinin about the salary",
		"and i accept you as a project maager so now you are the one who will make the last choice",
		"no its good with every thing we agreed abought it",
		"i am a gddo qualfied and u need me ",
		"ok no proplem iam agree",
		" what about the job descreption",
		"yes iam good in the pc anad iam good read and write english",
		"its the reason that i left my company the low salay ",
		" i'm here to gitting a jop  can u tell me about the work here in this company "
	]

	var dataset = [
			 //    "0_grammar.json",
				// "1_woz_kbagent_students.json",
				// "1_woz_kbagent_students1class.json",
				// "2_experts.json",
				// "2_experts1class.json",
				// "4_various.json",
				// "4_various1class.json",
				// "6_expert.json",
				// "3_woz_kbagent_turkers_negonlp2.json",
				"5_woz_ncagent_turkers_negonlp2ncAMT.json",
				// "nlu_kbagent_turkers_negonlpAMT.json",
				"nlu_ncagent_students_negonlpnc.json",
				"nlu_ncagent_turkers_negonlpncAMT.json",
				// "woz_kbagent_students_negonlp.json"
			]
	var data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})

	data = _.shuffle(data)

	var composite = new classifier.SvmPerfClassifier
	composite.trainBatch(data)

	_.each(a, function(sen, key, list){ 
		console.log("Initial sentence : "+ sen.trim())
		clean = ""
		_.each(sen.split(" "), function(value, key, list){ 
			if (!(composite.spellChecker.exists(value)))
			{	
				var suggestions = composite.spellChecker.suggest(value); // If feature exists, returns empty. Otherwise, returns ordered list of suggested corrections from the training set.
				if (suggestions.length!=0) 
					// {
					// console.log("'"+value+"'")
					// console.log(suggestions)
					clean = clean + " " + suggestions[0]	
					// }
				else
					clean = clean + " " + value
			}
			else
				clean = clean + " " + value
		}, this)
		console.log("Corrected sentence: "+clean.trim())
	}, this)

	console.log()
	process.exit(0)

	}

if (test_spell)
{
	dataset = [	"turkers.json" ]
	data = []

	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/Platinum/"+value)))
	})

	data1 = []

	_.each(data, function(value, key, list){ 
		data1 = data1.concat(value['turns'])
	}, this)

	data1 = _.shuffle(data1)

	dataset = partitions.partition(data1, 1, Math.round(data1.length*0.3))

	// var composite = new classifier.SvmPerfClassifier
	// composite.trainBatch(data1)


			a = [{
                // "input": "A Programmer does not have a leased car, I'm afraid",
                // "input": "i would only offer 10",
                "input": "I offer a 10 NIS pemsion",
                "is_correct": false,
                "timestamp": "2014-04-04T16:03:52.763Z",
                "turn": "61",
                "output": [
                    "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
                    "{\"Offer\":{\"Leased Car\":\"With leased car\"}}"
                ]
            }]

	stats = trainAndTest.trainAndTest_hash(classifier.SvmPerfClassifierSpell, dataset['train'], a, 5)
	// stats = trainAndTest.trainAndTest_hash(classifier.SvmPerfClassifier, dataset['train'], dataset['test'], 5)

	// var value = "least"
	// var ex = composite.spellChecker[1].exists(value)
	// var suggestions = composite.spellChecker[0].suggest(value); // If feature exists, returns empty. Otherwise, returns ordered list of suggested corrections from the training set.
	// console.log(ex)
	// console.log(suggestions)

	console.log()
	process.exit(0)

}

if (test_segmentation)
	{


	// dataset = [
	// "5_woz_dialogue.json",
	// "students.json",
	// "turkers.json"
				//    "0_grammar.json",
				// "1_woz_kbagent_students.json",
				// "1_woz_kbagent_students1class.json",
				// "2_experts.json",
				// "2_experts1class.json",
				// "4_various.json",
				// "4_various1class.json",
				// "6_expert.json",
				// "3_woz_kbagent_turkers_negonlp2.json",
				// "5_woz_ncagent_turkers_negonlp2ncAMT.json",
				// "nlu_kbagent_turkers_negonlpAMT.json",
				// "nlu_ncagent_students_negonlpnc.json",
				// "nlu_ncagent_turkers_negonlpncAMT.json",
				// "woz_kbagent_students_negonlp.json"
					// "turkers.json"
// 	]
	
// 	data = []
// 	_.each(dataset, function(value, key, list){ 
// 		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/Platinum/"+value)))
// 		// data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
// 	})
// // 
// 	data = _.shuffle(data)

	// data1 = []

	// _.each(data, function(value, key, list){ 
	// 	data1 = data1.concat(value['turns'])
	// }, this)

	// data = _.shuffle(data1)
	// // console.log(data1.length)

	// data = trainutils.filteraccept(data)

	// dataset = partitions.partition(data, 1, Math.round(data.length*0.3))


	// var trainset = trainutils.filteraccept(JSON.parse(fs.readFileSync("datasets/Employer/trainonelabel.json")))
	// var testset = trainutils.filteraccept(JSON.parse(fs.readFileSync("datasets/Employer/testalllabels.json")))


	var trainset = JSON.parse(fs.readFileSync("datasets/Employer/trainonelabel.json"))
	var testset = JSON.parse(fs.readFileSync("datasets/Employer/testalllabels.json"))

	// testset = _.shuffle(testset)
// testset = _.sample(testset, 100)
// trainset = _.sample(trainset, 100)
// stats = trainAndTest.trainAndCompare(
// 		classifier.PartialClassificationEquallySagae, 
// 		classifier.PartialClassificationEquallySagaeNegation,
// 		trainset, testset, 5) 

// console.log(JSON.stringify(stats, null, 4))
// console.log()
// process.exit(0)

	// dataset['train'] = _.sample(dataset['train'], 20)
	
	// a = [{"input":" I offer salary 20,000 NIS","output":["{\"Accept\":\"previous\"}","{\"Insist\":\"Leased Car\"}","{\"Offer\":{\"Leased Car\":\"Without leased car\"}}","{\"Offer\":{\"Pension Fund\":\"20%\"}}"],"is_correct":false,"timestamp":"2013-10-08T08:35:57.698Z"}]
	// a = [{"input":"Okay pension fund 10% salary I 7,000 NIS agree.","output":["{\"Accept\":\"previous\"}","{\"Insist\":\"Leased Car\"}","{\"Offer\":{\"Leased Car\":\"Without leased car\"}}","{\"Offer\":{\"Pension Fund\":\"20%\"}}"],"is_correct":false,"timestamp":"2013-10-08T08:35:57.698Z"}]

            // "is a fast promotion track, you will start with 10%",


a = [{
                // "input": "A Programmer does not have a leased car, I'm afraid",
                // "input": "i would only offer 10",
                // "input": "without leased car, 0% pension, fast promotion track, 9 hours",
                "input": "Pension funds cannot be given",
                "is_correct": false,
                "timestamp": "2014-04-04T16:03:52.763Z",
                "turn": "61",
                "output": [
                    "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
                    "{\"Offer\":{\"Leased Car\":\"With leased car\"}}"
                ]
            }]

	// stats = trainAndTest_hash(classifier.WinnowSegmenter, dataset['train'], a, 5)
	// stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, dataset['train'], a, 5)
	// stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, dataset['train'], dataset['test'], 5)
// var stats1 = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagaeImp, trainset, testset, 5)
// var stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, trainset, testset, 5)
	// var stats1 = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, trainset, testset, 5)
	// var stats = trainAndTest.trainAndTest_hash(classifier.WinnowSegmenter, trainset, testset, 5)
	
	var stats = trainAndTest.trainAndTest_hash(classifier.SagaeIntent, trainset, a, 5)

	console.log(stats)
	process.exit(0)
	// SagaeIntent

	// var stats = trainAndTest.trainAndTest_hash(classifier.SvmPerfClassifier, trainset, testset, 5)
	// console.log()
	// stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, dataset['train'], dataset['test'], 5)
	// console.log(JSON.stringify(stats[0]['labels'], null, 4))
	// console.log(JSON.stringify(stats[0]['stats'], null, 4))
	// console.log(JSON.stringify(stats[0], null, 4))
	console.log(JSON.stringify(stats[0]['stats'], null, 4))
	console.log(JSON.stringify(stats1[0]['stats'], null, 4))
	// console.log(JSON.stringify(stats[0]['labels'], null, 4))

// 
	// var lab = trainutils.comparelabels(stats1[0]['labels'], stats[0]['labels'])
	// console.log(lab)

	process.exit(0)
	// stats1 = trainAndTest_hash(classifier.WinnowSegmenter, dataset['train'], dataset['test'], 5)
	// console.log(JSON.stringify(stats1[0]['labels'], null, 4))
	// console.log(JSON.stringify(stats1[0]['stats'], null, 4))

	// console.log()
	// process.exit(0)

stats = trainAndTest.trainAndCompare(
		classifier.PartialClassificationEquallySagae, 
		classifier.WinnowSegmenter,
		dataset['train'], dataset['test'], 5) 

	console.log(stats)

	// stats1 = trainAndTest_hash(classifier.SvmPerfClassifier, dataset['train'], dataset['test'], 5)
	// console.log(JSON.stringify(stats1[0]['stats'], null, 4))

	console.log()
	process.exit(0)
	// stats = trainAndTest_hash(classifier.SvmPerfClassifier, dataset['train'], dataset['test'], 5)
	// stats = trainAndTest_hash(classifier.WinnowSegmenter, data1, a, 5)

	// console.log(stats)
	// console.log(JSON.stringify(stats, null, 4))

	// process.exit(0)
		// BayesSegmenter
	}	

if (do_partial_classification)
	{
	// a= ['{"Insist":"Working Hours"}','{"Offer":{"Job Description":"Programmer"}}','{"Offer":{"Working Hours":"10 hours"}}']
	// a = [{"input":"Okay. pension fund 10%, salary I 20,000 NIS agree.","output":["{\"Accept\":\"previous\"}","{\"Insist\":\"Leased Car\"}","{\"Offer\":{\"Leased Car\":\"Without leased car\"}}","{\"Offer\":{\"Pension Fund\":\"20%\"}}"],"is_correct":false,"timestamp":"2013-10-08T08:35:57.698Z"}]
	// a = [{"input":"Okay. I 20k agree. I accept lease you the car with a 20% pension.","output":["{\"Accept\":\"previous\"}","{\"Insist\":\"Leased Car\"}","{\"Offer\":{\"Leased Car\":\"Without leased car\"}}","{\"Offer\":{\"Pension Fund\":\"20%\"}}"],"is_correct":false,"timestamp":"2013-10-08T08:35:57.698Z"}]
	// a = [{"input":"Buy it with your own money.","output":[{"Reject":"Leased Car"}],"is_correct":false,"timestamp":"2013-10-07T13:30:54.177Z"}]
	// a = [{"input":"its a little bit high dont you think?","output":["{\"Reject\":\"Salary\"}"],"is_correct":true,"timestamp":"2013-09-09T16:55:42.510Z"}]
	// dataset = [
	// 		    // "5_woz_ncagent_turkers_negonlp2ncAMT.json",
	// 		    "nlu_ncagent_students_negonlpnc.json",
	// 		    "nlu_ncagent_turkers_negonlpncAMT.json"
	// 		]
	// data = []
	// _.each(dataset, function(value, key, list){ 
	// 	data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	// })

	// data = _.shuffle(data)

	dataset = [
		// "5_woz_dialogue.json",
		"students.json",
		"turkers.json"
		]
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	})

	data = _.shuffle(data)

	data1 = []

	_.each(data, function(value, key, list){ 
		data1 = data1.concat(value['turns'])
	}, this)

	// data1 = _.sample(data1,20)

	// data1=[{'input':'hi'}]

	// a= [ '{"Offer":{"Working Hours":"8 hours"}}',
     // '{"Offer":{"Salary":"7,000 NIS"}}' ]

     // a = a.reverse()
    // b= _.sortBy(a, function(num){ num });
    // a.sort()
	// console.log(a)
	// process.exit(0)
	// labhash = {}

	// _.each(data, function(value, key, list){ 
		// _.each(value.output, function(lab, key, list){ 
			// if (!(lab in labhash))
			// labhash[lab] = 1
		// }, this)
	// }, this)

	// console.log(Object.keys(labhash))
	// process.exit(0)
	// sa = trainutils.intent_attr_dataset_ambiguity(data)
	// console.log(JSON.stringify(sa, null, 4))
	// console.log(sa.length)
	// process.exit(0)
	
	// console.log(trainutils.bars_original(data))
	// process.exit(0)
	// test = trainutils.clonedataset(data)
	// console.log(trainutils.intent_attr_matrix(data))
	// process.exit(0)

	dataset = partitions.partition(data1, 1, Math.round(data1.length*0.5))

	// dataset['test'] = [{'input':'hi', 'output':['original']}]
// 
	// dataset['test'] = [{"input":"how about 10,000 NIS, QA, no agreement on pension, no agreement on car","output":["{\"Offer\":{\"Salary\":\"10,000 NIS\"}}", "{\"Offer\":{\"Job Description\":\"QA\"}}", "{\"Offer\":{\"Leased Car\":\"No agreement\"}}", "{\"Offer\":{\"Pension Fund\":\"No agreement\"}}"],"is_correct":true,"timestamp":"2013-09-09T16:55:44.244Z"}]

// dataset['test'] = [{"input":"QA job","output":["{\"Offer\":{\"Job Description\":\"QA\"}}"],"is_correct":true,"timestamp":"2013-09-09T16:55:45.400Z"}]
// classifier.PartialClassificationEquallyIS
// classifier.PartialClassificationEqually
	// stats = trainAndTest_hash(createNewClassifier, _.sample(data,500), _.sample(test,100), 5)
	
// PartialClassificationEquallyGreedyISNoTrick: classifier.PartialClassificationEquallyGreedyISNoTrick,
		// PartialClassificationEquallyGreedyISTrick: classifier.PartialClassificationEquallyGreedyISTrick,
		// PartialClassificationEquallyIS: classifier.PartialClassificationEquallyIS,
		// PartialClassificationEqually: classifier.PartialClassificationEqually,
		// SVM_SeparatedAfter: classifier.SvmOutputPartialEqually,
		// SVM: classifier.SvmPerfClassifier
// stats = trainAndCompare(
// 		classifier.PartialClassificationEquallyGreedyISTrick, 
// 		classifier.SvmPerfClassifier,
// 		dataset['train'], dataset['test'], 5) 
	
// console.log()
// process.exit(0)

	// stats = trainAndTest_hash(classifier.WinnowSegmenter, dataset['train'], dataset['test'], 5)
	stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallyGreedyNoISTrick, dataset['train'], dataset['test'], 5, classifier.SvmPerfClassifierNoIS)
	// stats = trainAndTest.trainAndTest_hash(classifier.HomerWinnow, dataset['train'], dataset['test'], 5, classifier.SvmPerfClassifier)
	// stats = trainAndTest_hash(classifier.PartialClassificationEquallyGreedyISTrick, dataset['train'], dataset['test'], 5)
	// stats1 = trainAndTest_hash(classifier.SvmPerfClassifier, dataset['train'], dataset['test'], 5)

	// stats = trainAndTest_hash(createNewClassifier, dataset['train'], dataset['test'], 5)

	console.log(JSON.stringify(stats[0], null, 4))
	// console.log(JSON.stringify(stats1[0]['labels'], null, 4))
	console.log()
	process.exit(0)
	// stats = trainAndTest_hash(createNewClassifier, data, a, 5)
	// console.log(JSON.stringify(stats, null, 4))
// process.exit(0)


	// stats = trainAndTestLite(createNewClassifier, dataset['train'], dataset['test'], 5)

	console.log(JSON.stringify(stats, null, 4))
	console.log()
	process.exit(0)
	// console.log(JSON.stringify(stats[0], null, 4))
	// console.log(JSON.stringify(stats[0]['labels'], null, 4))


	// console.log(JSON.stringify(trainutils.confusion_matrix(stats[0]), null, 4))
	// console.log()
	// process.exit(0)
	// console.log(trainutils.hash_to_htmltable(trainutils.confusion_matrix(stats[2])))
	// console.log()
	// process.exit(0)
	// stat = trainAndTest_hash(classifier.PartialClassificationEquallyIS, dataset['train'], dataset['test'], 5)
	// console.log(trainutils.hash_to_htmltable(trainutils.confusion_matrix(stat[2])))
	// process.exit(0)



	console.log(stats[0]['stats'])
	onsole.log(stats[1]['stats'])

	console.log(stats[2]['stats'])

	process.exit(0)
		// console.log(stats[0]['starts'])
	// 	console.log(stats[1]['starts'])

	// console.log(stats[2]['starts'])

	process.exit(0)
	// intent = trainutils.filtererror(stats[0])
	// attributes = trainutils.filtererror(stats[1])
	// values = trainutils.filtererror(stats[2])


	// console.log("intent")
	// console.log(stats[0]['stats'])

	// console.log("attributes")
	// console.log(stats[1]['stats'])

	// console.log("values")
	// console.log(stats[2]['stats'])

	// console.log("number of intent errors")
	// console.log(intent.length)
	// console.log("number of attribute errors")
	// console.log(attributes.length)
	// console.log("number of value errors")
	// console.log(values.length)


	// g = 0
	// _.each(intent, function(value, key, list){
	// 	_.each(values, function(value1, key, list){ 
	// 		if (value['input'] == value1['input'])
	// 			g = g+1
	// 	 	}, this) 
	// 	}, this)

	// w = 0

	// _.each(intent, function(value, key, list){
	// 	_.each(attributes, function(value1, key, list){ 
	// 		if (value['input'] == value1['input'])
	// 			w = w+1
	// 	 	}, this) 
	// 	}, this)

	// p = 0

	// _.each(values, function(value, key, list){
	// 	_.each(attributes, function(value1, key, list){ 
	// 		if (value['input'] == value1['input'])
	// 			p = p+1
	// 	 	}, this) 
	// 	}, this)


	// 	console.log("number of mistakenly classified sentence with mistake in intent and value")
	// 	console.log(g)
	// 	console.log("number of mistakenly classified sentence with mistake in intent and attribute")
	// 	console.log(w)
	// 	console.log("number of mistakenly classified sentence with mistake in attribute and value")
	// 	console.log(p)



	// process.exit(0)
	

	// _.each(stats, function(value, key, list){ 
	// 	_.each(value['labels'], function(value1, label, list){
	// 				if (value1["F1"] != -1)
	// 				console.log("\""+label+"\"\t"+value1['F1']+"\t"+value1['Train']) 
	// 		}, this)
	// 	}, this)

	console.log()
	process.exit(0)

	console.log(stats[0]['stats'])
	console.log(stats[1]['stats'])
	console.log(stats[2]['stats'])
	process.exit(0)

	console.log(trainutils.hash_to_htmltable(trainutils.confusion_matrix(stats[2])))
	process.exit(0)
	matlist = []
	partitions.partitions(data, 5, function(trainSet1, testSet1, index) {
		testSet = trainutils.clonedataset(testSet1)
		trainSet = trainutils.clonedataset(trainSet1)

		stats =	trainAndTest.trainAndTest_hash(createNewClassifier, trainSet, testSet, 5)
		console.log()
		process.exit(0)
		matrix = trainutils.confusion_matrix(stats[0])
		matlist.push(matrix)
		})

		trainutils.hash_to_htmltable(trainutils.aggregate_two_nested(matlist))
		console.log()
		process.exit(0)
}



if (do_comparison)
	{
	stud = [
			"nlu_ncagent_students_negonlpnc.json",
			]
	turk = [
		    "5_woz_ncagent_turkers_negonlp2ncAMT.json",
		    "nlu_ncagent_turkers_negonlpncAMT.json"
			]

	turkdata = []
	_.each(turk, function(value, key, list){ 
		turkdata = turkdata.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})

	studdata = []
	_.each(stud, function(value, key, list){ 
		studdata = studdata.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})
	// console.log(studdata.length)
	// console.log(turkdata.length)
	// process.exit(0)

	studdata = _.shuffle(studdata)
	turkdata = _.shuffle(turkdata)

	turkstats = [[],[],[]]
	studstats = [[],[],[]]

	partitions.partitions(turkdata, 5, function(trainSet1, testSet1, index) {

		data = _.sample(trainSet1, 300)

		test = trainutils.clonedataset(data)
		test1 = trainutils.clonedataset(data)

		studtest = _.sample(studdata, 100)
		turktest = _.sample(testSet1, 100)

		stats1 =	trainAndTest.trainAndTest_hash(createNewClassifier, test, studtest, 5)
		
		studstats[0].push(stats1[0]['stats'])
		studstats[1].push(stats1[1]['stats'])
		studstats[2].push(stats1[2]['stats'])

		stats =	trainAndTest.trainAndTest_hash(createNewClassifier, test1, turktest, 5)
				
		turkstats[0].push(stats[0]['stats'])
		turkstats[1].push(stats[1]['stats'])
		turkstats[2].push(stats[2]['stats'])

		})

		// trainutils.hash_to_htmltable(trainutils.aggregate_two_nested(matlist))
		// console.log()
		// process.exit(0)

		console.log("turkstats")
		console.log("intents")
		console.log(trainutils.aggregate_results(turkstats[0]))		
		console.log("attr")
		console.log(trainutils.aggregate_results(turkstats[1]))		
		console.log("values")
		console.log(trainutils.aggregate_results(turkstats[2]))		

		console.log("studstats")
		console.log("intents")
		console.log(trainutils.aggregate_results(studstats[0]))		
		console.log("attr")
		console.log(trainutils.aggregate_results(studstats[1]))		
		console.log("values")
		console.log(trainutils.aggregate_results(studstats[2]))		

		process.exit(0)
}


if (do_unseen_word_fp)
	 {
	dataset = [
			"5_woz_ncagent_turkers_negonlp2ncAMT.json",
			"nlu_ncagent_students_negonlpnc.json",
			"nlu_ncagent_turkers_negonlpncAMT.json"
			// "test.json"
			]
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})

	console.log(unseen_correlation(data, createNewClassifier, tokenize))
	}


if (do_checking_tag) {

	// datasetNames = [
	// 		"5_woz_ncagent_turkers_negonlp2ncAMT.json",
	// 		"nlu_ncagent_students_negonlpnc.json",
	// 		"nlu_ncagent_turkers_negonlpncAMT.json",
	// 		// "3_woz_kbagent_turkers_negonlp2.json",
	// 		// "woz_kbagent_students_negonlp.json",
	// 		// "nlu_kbagent_turkers_negonlpAMT.json"
	// 		]

	dataset = []
	tagdict = {}
	all = 0

	_.each(datasetNames, function(value, key, list){ 
		data = JSON.parse(fs.readFileSync("datasets/Employer/"+value))
			_.each(data, function(record, key, list){ 
				classes = record['output'].map(stringifyClass);
					_.each(classes, function(clas, key, list){ 
						all += 1
						if (!tagdict[clas])
							{	
							tagdict[clas]={}
							tagdict[clas]['input'] = []
							tagdict[clas]['file'] = []
							}
						tagdict[clas]['input'].push(record['input'])
						tagdict[clas]['file'].push(value)
						})
			})
	})


	commonfile = {}
	_.each(tagdict, function(tag, key, list){ 
		commonfile[key] = {}
		commonfile[key]['count'] = tag['input'].length
		commonfile[key]['ratio'] = tag['input'].length/all
		commonfile[key]['files'] = _.uniq(tag['file'])
		commonfile[key]['input'] = tag['input']
	})

	console.log(commonfile)
}   

if (do_small_temporary_test) {
	// var dataset = JSON.parse(fs.readFileSync("datasets/Employer/2_experts.json"))
	dataset = grammarDataset.concat(collectedDatasetMulti).concat(collectedDatasetSingle).concat(collectedDatasetMulti2).concat(collectedDatasetSingle2).concat(collectedDatasetMulti4).concat(collectedDatasetMulti8)
	dataset = _.shuffle(dataset)
   
    stats = trainAndTest.trainAndTest_hash(createNewClassifier, dataset, dataset, verbosity+3)

    _.each(stats['data'], function(value, key, list){ 
		if ((value['explanations']['FP'].length != 0) || (value['explanations']['FN'].length != 0))
		{
		console.log(value)	
		}
	});
}   


if (do_learning_curves_dialogue)
	{
	dataset = [
		// "5_woz_dialogue.json",
		"students.json",
		"turkers.json"
		]
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	})

	data = _.shuffle(data)

	classifiers  = {
		// SVM_SeparatedAfter: classifier.SvmOutputPartialEqually,
		// SVM_SeparatedClassification: classifier.PartialClassificationEqually,
		// SVM_SeparatedClassification_IS: classifier.PartialClassificationEquallyIS
	
		// SVM_SeparatedAfter: classifier.SvmOutputPartialAttVal,
		// SVM_SeparatedClassification: classifier.PartialClassificationAttVal,
		// SVM_SeparatedClassification_IS: classifier.PartialClassificationAttValIS

		// PartialClassificationEquallyGreedyISNoTrick: classifier.PartialClassificationEquallyGreedyISNoTrick,
		
		// PartialClassificationEquallyGreedyNoISBiagram: classifier.PartialClassificationEquallyGreedyTrick,
		// PartialClassificationEquallySagae: classifier.PartialClassificationEquallySagae,
		// StandardSagae: classifier.WinnowSegmenter,
		// SVMNoIS: classifier.SvmPerfClassifierNoIS,
		// SVMIS: classifier.SvmPerfClassifier
		CompositeIS: classifier.SvmOutputPartialEquallyIS,
		CompositeNoIS: classifier.SvmOutputPartialEquallyNoIS,
		ComponentIS: classifier.PartialClassificationEquallyIS,
		ComponentNoIS: classifier.PartialClassificationEquallyNoIS,
		// SVM_SeparatedAfter: classifier.SvmOutputPartialEqually,
		// Homer: classifier.HomerWinnow
		};

	// parameters = ['F1','TP','FP','FN','Accuracy','Precision','Recall']
	parameters = ['F1', 'Precision','Recall']
	curves.learning_curves(classifiers, data, parameters, 3, 5)
	}




if (do_coverage)
	{
	// index is the amount of records taken so far
	var li = []
	var cur = {}
	coverage = JSON.parse(fs.readFileSync("keyphases.json"))


	_.each(coverage, function(value, key, list){ 
		_.each(value['labels'], function(key1, label, list){
			if (!(label in cur)) 
				cur[label] = {'total':0,'current':0}
			cur[label]['total'] = cur[label]['total'] + 1
		})
	}, this)

	_.each(coverage, function(value, key, list){ 
		// var cur = {}
		_.each(value['labels'], function(key1, label, list){
			// var keyword = key1[0] 
			// if (!(label in cur)) cur[label] = {'total':0,'current':0}
			// var total = 0
				_.each(coverage, function(value1, key2, list){
					if (label in value1['labels'])
						{
						// cur[label]['total'] = cur[label]['total'] + 1
						if (value1['labels'][label][0] == key1[0])
							{	
							cur[label]['current'] = cur[label]['current'] + 1
							delete coverage[key2]['labels'][label]
							}
						}
				}, this)
			// cur[label] = cur[label] / total
		}, this)
		var cor = _.clone(cur)
		_.each(cor, function(value, key, list){ 
			cor[key] = value['current']/value['total']
		}, this)
		li.push(cor)
	}, this)


	var lablist = []
	_.each(li, function(value, key, list){ 
		_.each(value, function(value, key, list){ 
			lablist.push(key)
		}, this)
	}, this)

	lablist = _.uniq(lablist)

	_.each(lablist, function(label, key, list){
		// fs.writeFileSync("./coverage/"+label, "\t"+label+"\n", 'utf-8')
		_.each(li, function(value, key, list){
			var score = 0
			if (label in value)
				score = value[label]
			fs.appendFileSync("./coverage/"+label, key+"\t"+score+"\n", 'utf-8')
		 }, this) 
		var command = "gnuplot -p -e \"reset; set term png truecolor  size 1000,1000; set grid ytics; set grid xtics; set title \'"+label+"\';  set key top right; set output \'coverage/"+label+".png\'; set key autotitle columnhead; plot \'coverage/"+label+"\' with lines\""
		console.log(command)
		result = execSync(command)

	}, this)

	// _.each(li, function(value, key, list){

		// command = "gnuplot -p -e \"reset; set term png truecolor  size 1000,1000; set grid ytics; set grid xtics; set title \'"+sample.replace(/\'/g,'')+"\';  set key top right; set output \'image/"+sample.replace(/\'/g,'')+".png\'; set key autotitle columnhead; set label \'"+(JSON.stringify(original)).replace(/[\",\\]/g,"")+"\' at screen 0.1, 0.9;"+labb+" plot for [i=3:"+(labellist.length+2)+"] \'"+senid+"\' using 1:i:xticlabels(2) smooth frequency with boxes\""
		// if (labellist.length > 0)
			// result = execSync.run(command)
		// } 
	// }, this)

	// console.log(li)
	process.exit(0)
	}

if (do_test_sagae)
	{

	trainset = trainutils.filteraccept(JSON.parse(fs.readFileSync("datasets/Employer/trainonelabel.json")))
	testset = trainutils.filteraccept(JSON.parse(fs.readFileSync("datasets/Employer/testalllabels.json")))

	// console.log(trainutils.dividedataset(test)['one'].length)
	// console.log(trainutils.dividedataset(test)['two'].length)
	// 292
	// 157

	// console.log(train.length)
	// console.log(test.length)
	// 293
	// 449

	// partitions.partitions(dataset, numOfFolds, function(train, test, fold) {

	// })

	// var stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, train, trainutils.dividedataset(test)['one'], 5)
	// var stats1 = trainAndTest.trainAndTest_hash(classifier.WinnowSegmenter, train, trainutils.dividedataset(test)['one'], 5)
	// var stats2 = trainAndTest.trainAndTest_hash(classifier.SvmPerfClassifier, train, trainutils.dividedataset(test)['one'], 5)

	trainset = _.sample(trainset, 90)

	// testset = trainutils.dividedataset(testset)['two']

	var attr = ['F1', 'Precision', 'Recall', 'Accuracy']
	var classifiers = [classifier.PartialClassificationEquallySagae, classifier.WinnowSegmenter,classifier.WinnowSegmenterStd, classifier.SvmPerfClassifier]
	var globalstart = [[],[],[],[]]
	
	partitions.partitions(trainset, 3, function(trainfold, testfold, fold) {

		var test = _.sample(testset, trainfold.length)
		

		var stt = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, trainfold, test, 5)
		console.log(JSON.stringify(stt[0]['labels'], null, 4))
		var sttt = trainAndTest.trainAndTest_hash(classifier.WinnowSegmenter, trainfold, test, 5)
		console.log(JSON.stringify(sttt[0]['labels'], null, 4))
		console.log()
		process.exit(0)

		_.each(classifiers, function(classi, key, list){ 
			globalstart[key].push(trainAndTest.trainAndTest_hash(classi, trainfold, test, 5)[0]['stats'])
		}, this)

		// console.log(stats[0]['stats'])
		// console.log(stats1[0]['stats'])
		// console.log(stats2[0]['stats'])

	})

	console.log(JSON.stringify(globalstart, null, 4))
	// process.exit(0)

	var gl = [{},{},{},{}]
	_.each(globalstart, function(value, key, list){ 
		_.each(attr, function(value1, key1, list){ 
			gl[key][value1] = _.reduce(_.pluck(value, value1), function(memo, num){ return memo + num; }, 0)/value.length
		}, this)
	}, this)


	console.log(JSON.stringify(gl, null, 4))
	process.exit(0)

	}

if (sample_kbagent)
	{
	datasetNames = [
			"3_woz_kbagent_turkers_negonlp2.json",
			]
	dataset = []
	_.each(datasetNames, function(value, key, list){ 
		dataset = dataset.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
		// dataset = dataset.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/Platinum/"+value)))
	});
	var data = _.sample(dataset, 200)
	fs.writeFileSync("datasets/Employer/testkbagent.json", JSON.stringify(data, null, 4), 'utf8');
	process.exit(0)
	
	}

if (do_separate_datasets)
	{
		datasetNames = [
			"nlu_ncagent_students_negonlpnc.json",
			"nlu_ncagent_turkers_negonlpncAMT.json",
			]
	dataset = []

	_.each(datasetNames, function(value, key, list){ 
		dataset = dataset.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
		// dataset = dataset.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/Platinum/"+value)))
	});

	dataset = _.shuffle(dataset)
	dataset = _.shuffle(dataset)

	var data = partitions.partition(dataset, 1, Math.round(dataset.length*0.3))

	fs.writeFileSync("datasets/Employer/trainonelabel.json", JSON.stringify(trainutils.dividedataset(data['train'])['one'], null, 4), 'utf8');
	fs.writeFileSync("datasets/Employer/testalllabels.json", JSON.stringify(data['test'], null, 4), 'utf8');



	// console.log(JSON.stringify(str, null, 4))
	// console.log(dataset.length)
	// console.log()
	process.exit(0)




	}

if (do_learning_curves) {

	// datasetNames = [
			// "5_woz_ncagent_turkers_negonlp2ncAMT.json",
			// "nlu_ncagent_students_negonlpnc.json",
			// "nlu_ncagent_turkers_negonlpncAMT.json",
			// "3_woz_kbagent_turkers_negonlp2.json",
			// "woz_kbagent_students_negonlp.json",
			// "nlu_kbagent_turkers_negonlpAMT.json"
			// "turkers.json"
			// ]
	// dataset = []

	// _.each(datasetNames, function(value, key, list){ 
		// dataset = dataset.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
		// dataset = dataset.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/Platinum/"+value)))
	// });

	// data1 = []
	// _.each(dataset, function(value, key, list){ 
	// 	data1 = data1.concat(value['turns'])
	// }, this)
	// data1 = _.shuffle(data1)
	// dataset = data1

	// dataset = _.shuffle(dataset)

	// console.log(dataset)
	// process.exit(0)
	// dataset= _.sample(dataset, 120)


	// console.log(trainutils.dividedataset(data2)['one'].length)



	// datasetNames = ["students.json"]
	// datasettest = []

	// _.each(datasetNames, function(value, key, list){ 
		// dataset = dataset.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
		// datasettest = datasettest.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	// });

	// data2 = []
	// _.each(datasettest, function(value, key, list){ 
		// data2 = data2.concat(value['turns'])
	// }, this)

	// data2 = _.shuffle(data2)
	// var trainset = trainutils.filteraccept(JSON.parse(fs.readFileSync("datasets/Employer/trainonelabel.json")))
	// var testset = trainutils.filteraccept(JSON.parse(fs.readFileSync("datasets/Employer/testalllabels.json")))

	var trainset = _.shuffle(JSON.parse(fs.readFileSync("datasets/Employer/trainonelabel.json")))
	var testsetncagent = _.shuffle(JSON.parse(fs.readFileSync("datasets/Employer/testalllabels.json")))
	// var testsetkbagent = _.shuffle(JSON.parse(fs.readFileSync("datasets/Employer/testkbagent.json")))


	// console.log(testsetncagent.length)

	// console.log(trainutils.dividedataset(testsetncagent)['two'].length)

	// console.log(trainutils.dividedataset(testsetncagent)['one'].length)


	// testsetkbagent
	// console.log(testsetkbagent.length)
	// 132
	// console.log(trainutils.dividedataset(testsetkbagent)['two'].length)
	// 93
	// console.log(trainutils.dividedataset(testsetkbagent)['one'].length)
	// 39
	var testset = testsetncagent

	// console.log(trainutils.dividedataset(testset)['two'].length)
	// console.log(trainutils.dividedataset(testset)['one'].length)
	// console.log()
	// process.exit(0)

	// testset = trainutils.dividedataset(testset)['two']
// more than 2
// 103
// exactly one
// 166

// mix - test set with length of global trainutils
// 293 3 fold and test 293

// one 
// train 293 3 fold test 275

// two
// test 174


	// console.log(trainutils.dividedataset(test)['one'].length)


	// console.log(trainset.length)
	// console.log(testset.length)
	// console.log()
	// process.exit(0)

	classifiers  = {
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
		Component_Sagae: classifier.PartialClassificationEquallySagae,

		Component_Sagae_NoCompletion: classifier.PartialClassificationEquallySagaeNoCompletion,



		// Component_Sagae_Imp: classifier.PartialClassificationEquallySagaeImp,
		// Component_Sagae_Nospell: classifier.PartialClassificationEquallySagaeNospell,
		// Component_Sagae_no_Completion: classifier.PartialClassificationEquallySagaeNoCompletition,
		Composite_Sagae: classifier.WinnowSegmenter, 
		// Composite_SVM_noIS_nospell: classifier.SvmPerfClassifierNoIS,
		Composite_SVM: classifier.SvmPerfClassifier
		// Composite_SVM_noIS_spell: classifier.SvmPerfClassifierSpell
// 
	

		// SvmPerfClassifier: classifier.SvmPerfClassifier,
		// SvmPerfClassifierStemmer: classifier.SvmPerfClassifierLematization,
		// SvmPerfClassifierNatural: classifier.SvmPerfClassifierSimilarity
		
	};

	// parameters = ['F1','TP','FP','FN','Accuracy','Precision','Recall']
	parameters = ['F1','Precision','Recall', 'Accuracy']
	// curves.learning_curves(classifiers, dataset, parameters, 10, 5, data2)
	curves.learning_curves(classifiers, trainset, parameters, 20, 100,  4, testset)
}

if (do_small_temporary_test_dataset) {

	dataset = []

	_.each(datasetNames, function(value, key, list){ 
		console.log(value)
		dataset.push(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	});

	_.each(dataset, function(value, key, list){ 
		value = _.shuffle(value)
		console.log(datasetNames[key])

		output = []
		input = []
		testset = []

		_(100).times(function(n){
			rnd = Math.floor(Math.random() * value.length);
			output.push(JSON.stringify(value[rnd]['output']))
			input.push(JSON.stringify(value[rnd]['input']))
			testset.push(value[rnd])
      	});

      	console.log(output)
      	console.log(input)

      	console.log(trainAndTest.trainAndTest(createNewClassifier, collectedDatasetSingle2, testset, verbosity+3));

	}, this);

	
    // var datasettest = JSON.parse(fs.readFileSync("datasets/Dataset9Manual.json"))
    // console.log("Train on woz single class, test on manual dataset: "+
    //     trainAndTest(createNewClassifier, datasettest, datasettest, verbosity+3).shortStats())+"\n";

	// console.log("Train on woz single class, test on manual dataset: "+
	// 	trainAndTestLite(createNewClassifier, collectedDatasetSingle, JSON.parse(fs.readFileSync("datasets/Dataset9Manual.json")), verbosity+3).shortStats())+"\n";
}

if (do_small_test_multi_threshold)
	{

	var classifier = createNewClassifier(); 

	var train = JSON.parse(fs.readFileSync("datasets/Dataset9Manual4.json"))
	var test = JSON.parse(fs.readFileSync("datasets/Dataset9Manual4.json"))

    classifier.trainBatch(train);

    console.log(classifier.classifier.stats)
    	
    Threshold = classifier.classifier.multiclassClassifier.threshold

	partitions.partitions_consistent(train, classifier.classifier.validateThreshold, (function(trainSet, testSet, index) {
		classifier.trainBatch(trainSet);
		stats = ToTest(classifier, testSet, 0)
		console.log(stats)
		process.exit(0)
	
	}))
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