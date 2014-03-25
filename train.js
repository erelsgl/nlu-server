/**
 * Trains and tests the NLU component.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

 var Hierarchy = require(__dirname+'/Hierarchy');


console.log("machine learning trainer start\n");


var do_partial_classification = true
var do_unseen_word_fp = false
var do_unseen_word_curve = false
var do_checking_tag = false
var do_small_temporary_test = false;
var do_small_temporary_serialization_test = false;
var do_learning_curves = false
var do_cross_dataset_testing = false;
var do_final_test = false;
var do_cross_validation = false;
var do_serialization = false;
var do_test_on_training_data = false;
var do_small_temporary_test_dataset = false
var do_small_test_multi_threshold = false
var naive = false
var naive1 = false
var count_2_intents_2_attributes = false

var _ = require('underscore')._;
var fs = require('fs');
var trainAndTest_hash= require('limdu/utils/trainAndTest').trainAndTest_hash;
var trainAndTestLite = require('limdu/utils/trainAndTest').trainAndTestLite
var Hierarchy = require(__dirname+'/Hierarchy');
var multilabelutils = require('limdu/classifiers/multilabel/multilabelutils');
var trainutils = require('limdu/utils/bars')


var grammarDataset = JSON.parse(fs.readFileSync("datasets/Employer/0_grammar.json"));
var collectedDatasetMulti = JSON.parse(fs.readFileSync("datasets/Employer/1_woz_kbagent_students.json"));
var collectedDatasetSingle = JSON.parse(fs.readFileSync("datasets/Employer/1_woz_kbagent_students1class.json"));
var collectedDatasetMulti2 = JSON.parse(fs.readFileSync("datasets/Employer/2_experts.json"));
var collectedDatasetSingle2 = JSON.parse(fs.readFileSync("datasets/Employer/2_experts1class.json"));
var collectedDatasetMulti4 = JSON.parse(fs.readFileSync("datasets/Employer/3_woz_kbagent_turkers_negonlp2.json"));
var collectedDatasetMulti8 = JSON.parse(fs.readFileSync("datasets/Employer/4_various.json"));

var verbosity = 0;
var explain = 0;

var execSync = require('execSync').exec
var partitions = require('limdu/utils/partitions');
var PrecisionRecall = require('limdu/utils/PrecisionRecall');
var trainAndTest = require('limdu/utils/trainAndTest').trainAndTest;
var trainAndCompare = require('limdu/utils/trainAndTest').trainAndCompare;
var trainAndTestLite = require('limdu/utils/trainAndTest').trainAndTestLite;
var ToTest = require('limdu/utils/trainAndTest').test;
var serialization = require('serialization');
var learning_curves = require('limdu/utils/learning_curves').learning_curves;
var unseen_words_curves = require('limdu/utils/unseen_curves').unseen_word_curves;
var unseen_correlation = require('limdu/utils/unseen_correlation').unseen_correlation;
var tokenize = require('limdu/utils/unseen_correlation').tokenize;
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

var clonedataset  = function(dataset) {

	trainSet1 = []
		_.each(dataset, function(value, key, list){
			trainSet1.push(_.clone(value))
			})
		return trainSet1
};

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
if (do_unseen_word_curve)
	{
	dataset = [
			"5_woz_ncagent_turkers_negonlp2ncAMT.json",
			// "nlu_ncagent_students_negonlpnc.json",
			"nlu_ncagent_turkers_negonlpncAMT.json"
			]

	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})
	
	unseen_words_curves(data)

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

if (do_partial_classification)
	{
	// a= ['{"Insist":"Working Hours"}','{"Offer":{"Job Description":"Programmer"}}','{"Offer":{"Working Hours":"10 hours"}}']
	// a = [{"input":"Okay. I 20k agree. I can't lease you the car with a 20% pension.","output":["{\"Accept\":\"previous\"}","{\"Insist\":\"Leased Car\"}","{\"Offer\":{\"Leased Car\":\"Without leased car\"}}","{\"Offer\":{\"Pension Fund\":\"20%\"}}"],"is_correct":false,"timestamp":"2013-10-08T08:35:57.698Z"}]
	// a = [{"input":"Buy it with your own money.","output":[{"Reject":"Leased Car"}],"is_correct":false,"timestamp":"2013-10-07T13:30:54.177Z"}]
	// a = [{"input":"its a little bit high dont you think?","output":["{\"Reject\":\"Salary\"}"],"is_correct":true,"timestamp":"2013-09-09T16:55:42.510Z"}]
	dataset = [
			    "5_woz_ncagent_turkers_negonlp2ncAMT.json",
			    "nlu_ncagent_students_negonlpnc.json",
			    "nlu_ncagent_turkers_negonlpncAMT.json"
			   // "usd-7_short.json"
			// // "nlu_kbagent_turkers_negonlpAMT.json"
			]
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})

	// data = _.shuffle(data)

	
	// dataset = partitions.partition(data, 1, Math.round(data.length*0.3))

	// for (record in a)	
	// {		
	// 	for (out in a[record]['output'])
	// 		if (a[record]['output'][out].indexOf("Offer")==-1)
	// 			t.push(a[record]['output'][out])
	// console.log(t)
	// }


	// dataset['test'] = [{
	// 					"input":"I propose 9 hours, with car",
	// 					"output":["{\"Offer\":{\"Leased Car\":\"With leased car\"}}","{\"Accept\":{\"Working Hours\":\"9 hours\"}}"]
	// 					}]


		// console.log(Hierarchy.splitPartEquallyIntent(dataset['test'][0]['output']))
		// console.log()
		// process.exit(0)

	// stats = trainAndTest_hash(createNewClassifier, dataset['train'], dataset['test'], 5)
	// data = a

	// stats =	trainAndTest_hash(createNewClassifier, dataset['train'], dataset['test'], 5)
	// stats = trainAndTest_hash(createNewClassifier, data, a, 5)

	// console.log(trainAndTest(createNewClassifier, data, data, 5))
	// console.log(JSON.stringify(stats, null, 4))


	partitions.partitions(data, 5, function(trainSet1, testSet1, index) {
		testSet = trainutils.clonedataset(testSet1)
		trainSet = trainutils.clonedataset(trainSet1)

		// console.log(JSON.stringify(trainutils.bars(trainSet), null, 4))
		// stats =	trainAndTest_hash(createNewClassifier, trainSet, testSet, 5)
		stats =	trainAndTestLite(createNewClassifier, trainSet, trainSet, 5)

		// console.log(JSON.stringify(stats[2]['labels'], null, 4))
		// console.log(JSON.stringify(trainutils.filtererror(stats[2]), null, 4))
		// console.log()
		// process.exit(0)
		});


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
   
    stats = trainAndTest_hash(createNewClassifier, dataset, dataset, verbosity+3)

    _.each(stats['data'], function(value, key, list){ 
		if ((value['explanations']['FP'].length != 0) || (value['explanations']['FN'].length != 0))
		{
		console.log(value)	
		}
	});
}   

if (do_learning_curves) {
	
	datasetNames = [
			"5_woz_ncagent_turkers_negonlp2ncAMT.json",
			"nlu_ncagent_students_negonlpnc.json",
			"nlu_ncagent_turkers_negonlpncAMT.json",
			// "3_woz_kbagent_turkers_negonlp2.json",
			// "woz_kbagent_students_negonlp.json",
			// "nlu_kbagent_turkers_negonlpAMT.json"
			]
	dataset = []

	_.each(datasetNames, function(value, key, list){ 
		dataset = dataset.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	});

	dataset = _.shuffle(dataset)

	classifiers  = {
		// Intent_AttributeValue: classifier.PartialClassificationJustTwo,
		 //SVM_Separated: classifier.SvmPerfClassifierPartial,
		// Intent_Attribute_Value: classifier.PartialClassificationEqually
		//New_approach: classifier.PartialClassificationEquallyNoOutput, 
		SVM_SeparatedAfter: classifier.SvmOutputPartialEqually,
		SVM_SeparatedClassification: classifier.PartialClassificationEqually

		// Intent_Attribute_AttributeValue: classifier.PartialClassificationVersion1,
		// Intent_AttributeValue: classifier.PartialClassificationVersion2,

	// HomerSvmPerf: classifier.HomerSvmPerf,
	// SvmPerf: classifier.SvmPerfClassifier,

	// HomerWinnow: classifier.HomerWinnow, 
	// Winnow: classifier.WinnowClassifier,  

	// HomerAdaboost: classifier.HomerAdaboostClassifier,
	// Adaboost: classifier.AdaboostClassifier, 
	};

	// parameters = ['F1','TP','FP','FN','Accuracy','Precision','Recall']
	parameters = ['F1']
	learning_curves(classifiers, dataset, parameters, 70, 5)
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

      	console.log(trainAndTest(createNewClassifier, collectedDatasetSingle2, testset, verbosity+3));

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
	// ["Employer","Candidate", "Candidate-israel", "Employer-israel", "Candidate-usa", "Employer-usa"].forEach(function(classifierName) {
		["Employer-israel", "Candidate-israel"].forEach(function(classifierName) {
		console.log("\nBuilding classifier for "+classifierName);
		var classifier = createNewClassifier();
		var jsonEmpty = classifier.toJSON();  // just to check that it works

		try { datasetNames = fs.readdirSync("datasets/" + classifierName) }

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

console.log("machine learning trainer end");
