/**
 * Trains and tests the NLU component.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

console.log("machine learning trainer start\n");

var do_learning_curves = true
var run_com = false
var calculate_adaboost = false
var run_adaboost = false
var do_small_temporary_test = false
var do_small_temporary_serialization_test = false;
var do_cross_dataset_testing = false;
var do_final_test = false;
var do_cross_validation = false;
var do_serialization = false;
var do_test_on_training_data = false;
var do_small_temporary_test_dataset = false
var do_small_test_multi_threshold = false

var _ = require('underscore')._;
var fs = require('fs');
var trainAndTest_hash= require('limdu/utils/trainAndTest').trainAndTest_hash;
var execSync = require('execSync')
var classifier = require(__dirname+'/classifiers')


var grammarDataset = JSON.parse(fs.readFileSync("datasets/Employer/0_grammar.json"));
var collectedDatasetMulti = JSON.parse(fs.readFileSync("datasets/Employer/1_woz_kbagent_students.json"));
var collectedDatasetSingle = JSON.parse(fs.readFileSync("datasets/Employer/1_woz_kbagent_students1class.json"));
var collectedDatasetMulti2 = JSON.parse(fs.readFileSync("datasets/Employer/2_experts.json"));
var collectedDatasetSingle2 = JSON.parse(fs.readFileSync("datasets/Employer/2_experts1class.json"));
var collectedDatasetMulti4 = JSON.parse(fs.readFileSync("datasets/Employer/3_woz_kbagent_turkers_negonlp2.json"));
var collectedDatasetMulti8 = JSON.parse(fs.readFileSync("datasets/Employer/4_various.json"));

var createNewClassifier = function() {
	var defaultClassifier = require(__dirname+'/classifiers').defaultClassifier;
	return new defaultClassifier();
}

var verbosity = 0;
var explain = 0;

var partitions = require('limdu/utils/partitions');
var PrecisionRecall = require('limdu/utils/PrecisionRecall');
var trainAndTest = require('limdu/utils/trainAndTest').trainAndTest;
var trainAndCompare = require('limdu/utils/trainAndTest').trainAndCompare;
var trainAndTestLite = require('limdu/utils/trainAndTest').trainAndTestLite;
var ToTest = require('limdu/utils/trainAndTest').test;
var serialization = require('serialization');

if (do_learning_curves) {

	var train = JSON.parse(fs.readFileSync("datasets/Employer/4_various.json"))
	var train1 = JSON.parse(fs.readFileSync("datasets/Employer/4_various1class.json"))
	var train2 = JSON.parse(fs.readFileSync("datasets/Employer/nlu_ncagent_students_negonlpnc.json"))
	var train3 = JSON.parse(fs.readFileSync("datasets/Employer/nlu_kbagent_turkers_negonlpAMT.json"))
	var train4 = JSON.parse(fs.readFileSync("datasets/Employer/nlu_ncagent_turkers_negonlpncAMT.json"))
	var train5 = JSON.parse(fs.readFileSync("datasets/Employer/2_experts.json"))
	var train6 = JSON.parse(fs.readFileSync("datasets/Employer/woz_kbagent_students_negonlp.json"))
	var train7 = JSON.parse(fs.readFileSync("datasets/Employer/6_expert.json"))
	var train8 = JSON.parse(fs.readFileSync("datasets/Employer/1_woz_kbagent_students1class.json"))
	var train9 = JSON.parse(fs.readFileSync("datasets/Employer/1_woz_kbagent_students.json"))

	//dataset = train.concat(train1).concat(train2).concat(train3).concat(train4).concat(train5)
	dataset = train.concat(train1).concat(train2).concat(train3).concat(train4).concat(train5).concat(train6).concat(train7).concat(train8).concat(train9)

	dataset = _.shuffle(dataset)
	dataset = _.shuffle(dataset)

	dataset = partitions.partition(dataset, 1, Math.round(train.length*0.3))
	train = dataset['train']
	test = dataset['test']	

	index = 100
	
	classifiers = [classifier.HomerWinnow, classifier.AdaboostClassifier, classifier.WinnowClassifier]

	report = new Array(classifiers.length);
	
	_.each(classifiers, function(value, key, list){ 
	report[key] = []
	})

	while (index < train.length)
  	{
  	mytrain = train.slice(0, index)
  	index += 100
  	
    _.each(classifiers, function(value, key, list){ 
    	stats = trainAndTest(value, mytrain, test).fullStats()
    	stats['train'] = index
    	report[key].push(stats)
    	})
  }

  
  _.each(classifiers, function(value, key, list){ 
  	str = ""
	_.each(report[key], function(value1, key, list){
		str += value1['train'] + "\t" + value1['F1'] + "\n"
	})
	fs.writeFile("classifier"+key, str, function(err) {})
  })
 
}

if (do_small_temporary_test) {
	

	// var train = JSON.parse(fs.readFileSync("datasets/Dataset9Manual.json"))
	// var test = JSON.parse(fs.readFileSync("datasets/Dataset9Manual.json"))
	

	var train = JSON.parse(fs.readFileSync("datasets/Employer/4_various.json"))
	var train1 = JSON.parse(fs.readFileSync("datasets/Employer/4_various1class.json"))
	var train2 = JSON.parse(fs.readFileSync("datasets/Employer/nlu_ncagent_students_negonlpnc.json"))
	var train3 = JSON.parse(fs.readFileSync("datasets/Employer/nlu_kbagent_turkers_negonlpAMT.json"))
	var train4 = JSON.parse(fs.readFileSync("datasets/Employer/nlu_ncagent_turkers_negonlpncAMT.json"))
	var train5 = JSON.parse(fs.readFileSync("datasets/Employer/2_experts.json"))
	var train6 = JSON.parse(fs.readFileSync("datasets/Employer/woz_kbagent_students_negonlp.json"))
	var train7 = JSON.parse(fs.readFileSync("datasets/Employer/6_expert.json"))
	var train8 = JSON.parse(fs.readFileSync("datasets/Employer/1_woz_kbagent_students1class.json"))
	var train9 = JSON.parse(fs.readFileSync("datasets/Employer/1_woz_kbagent_students.json"))
	
	
	dataset = train.concat(train1).concat(train2).concat(train3).concat(train4).concat(train5).concat(train6).concat(train7).concat(train8).concat(train9)

	dataset = _.shuffle(dataset)

	dataset = partitions.partition(dataset, 1, Math.round(train.length*0.5))
	train = dataset['train']
	test = dataset['test']	

	stats = trainAndTest(createNewClassifier, train, test, verbosity+3).fullStats()

	console.log(stats)
}

if (run_com) {
	 		var command = "./icsiboost -S agent"
		

			var result = execSync.run(command)
			if (result.code>0) {
				console.dir(result);
				// console.log(fs.readFileSync(learnFile, 'utf-8'));
				throw new Error("Failed to execute: "+command);
			}
}

if (run_adaboost) {

	set_of_labels = getmap.getmap()

	var train = JSON.parse(fs.readFileSync("datasets/Employer/4_various.json"))
	var train1 = JSON.parse(fs.readFileSync("datasets/Employer/4_various1class.json"))
	var test = JSON.parse(fs.readFileSync("datasets/Employer/2_experts.json"))

	train = train.concat(train1)
	
	// set_of_labels = []
	// set_of_inputs = []



	// _.each(train, function(value, key, list){ 
	// 	set_of_labels = _.union(set_of_labels,value['output'] )
	// });

	// set_of_labels = _.uniq(set_of_labels)



	_.times(3, function(){train = _.shuffle(train)})



	train = _.map(train, function(value){ 
		values = []
		_.each(value['output'], function(value, key, list){ 
			values.push(set_of_labels.indexOf(value)+1)
		});

		return {'input':value['input'], 'output': values}
	});

	
	test = _.map(test, function(value){ 
		values = []
		_.each(value['output'], function(value1, key, list){ 
			value1 = getmap.stringifyClass(value1)
			values.push(set_of_labels.indexOf(value1)+1)
		});


		return {'input':value['input'], 'output': values}
	});

	ar = []
	_.times(set_of_labels.length, function(n){ar.push(n+1)})

	names = ar.join()+".\nsentence:text:expert_type=ngram expert_length=2."

 	fs.writeFileSync('agent.names', names)
   
    set = {}
	dataset = partitions.partition(train, 1, Math.round(train.length*0.3))
	set['data'] = dataset['train']
	set['dev']  = dataset['test']	
	set['test']  = test

	// dataset = partitions.partition(dataset['test'], 1, Math.round(dataset['test'].length*0.3))
	// set['dev'] = dataset['train']	
	// set['test'] = dataset['test']	
	// set['test1'] = dataset['test']	

	_.each(set, function(valueset, key1, list){ 
		str = ""
		_.each(valueset, function(value, key, list){
		
			  // if (key1 !== 'test') {
    			str += value['input'].replace(/\,/g,'') + ',' + value['output'].join(" ")+ ".\n"
    //  		 }
    //  		else
    //  		{
				// str += value['input'].replace(/\,/g,'') + "\n"
    //  		}
    		})   

		fs.writeFile('agent.'+key1, str, function(err) {})

	})

	
	
}


if (calculate_adaboost)
{
	set_of_labels = getmap.getmap()
	var stats = fs.readFileSync("./output", "utf8");
	var test = JSON.parse(fs.readFileSync("datasets/Employer/2_experts.json"))
	stats = stats.replace(/^\s+|\s+$/g, "");
	stats = stats.split("\n")

	var currentStats = new PrecisionRecall();
	_.each(stats, function(value, key, list){
		ar = value.split(" ")
		// expected = ar.slice(0,ar.length/2)
		actual = ar.slice(ar.length/2, ar.length)

		expected1=[]
		actual1=[]
	
		_.each(test[key]['output'], function(value, key){ 
			value = getmap.stringifyClass(value)
			expected1.push(set_of_labels.indexOf(value))
			})
		
		_.each(actual, function(value, key){ 
			if (value>0) {actual1.push(key)}
			})

		// console.log(actual1)
		// console.log(expected1)
		// process.exit(0)
		currentStats.addCases(expected1, actual1, true);	
})	
// 

console.log(currentStats.calculateStats())
process.exit(0)
}


// if (adaboost_test)
// {
// 	var stats = fs.readFileSync("./output", "utf8");
// 	var currentStats = new PrecisionRecall();
// 	_.each(stats.split("\n"), function(value, key, list){
// 		ar = value.split(" ")
// 		expected = ar.slice(0,ar.length/2)
// 		actual = ar.slice(ar.length/2, ar.length)

// 		expected1=[]
// 		actual1=[]

// 		_.each(expected, function(value, key){ 
// 			if (value>0) {expected1.push(key)}
// 			})
		
// 		_.each(actual, function(value, key){ 
// 			if (value>0) {actual1.push(key)}
// 			})

// 		currentStats.addCases(expected1, actual1, true);	
// })	
// process.exit(0)
// }

if (do_small_temporary_test_dataset) {

	dataset = []

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
	["Employer","Candidate"].forEach(function(classifierName) {
		console.log("\nBuilding classifier for "+classifierName);
		var classifier = createNewClassifier();
		var jsonEmpty = classifier.toJSON();  // just to check that it works

		var datasetNames = [
			"0_grammar",
			"1_woz_kbagent_students",
			"1_woz_kbagent_students1class",
			"2_experts",
			"2_experts1class",
			"4_various",
			"4_various1class"];
		var dataset = datasetNames.reduce(function(previous, current) {
			return previous.concat(
				JSON.parse(
					fs.readFileSync(
						"datasets/"+classifierName+"/" + current + ".json")));
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
