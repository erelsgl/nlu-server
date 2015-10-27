/**
 * Trains and tests the NLU component.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var async = require('async');
var Hierarchy = require(__dirname+'/Hierarchy');
var _ = require('underscore')._;
var fs = require('fs');
var trainAndTest= require('./utils/trainAndTest').trainAndTest_hash;
var Hierarchy = require(__dirname+'/Hierarchy');
var multilabelutils = require('limdu/classifiers/multilabel/multilabelutils');
var trainutils = require('./utils/bars')
var wikipedia = require('./utils/wikipedia')
var bars = require('./utils/bars')
var rules = require("./research/rule-based/rules.js")
var cheapest_paths = require('limdu/node_modules/graph-paths').cheapest_paths;
var natural = require('natural');
var partitions = require('limdu/utils/partitions');
var PrecisionRecall = require('limdu/utils/PrecisionRecall');
var trainAndTest = require('./utils/trainAndTest');
var serialization = require('serialization');
var limdu = require("limdu");
var ftrs = limdu.features;

var check_ds_context = false
var binary_seg = false
var check_ds = true
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


if (binary_seg)
{
	var dataset = bars.loadds("../negochat_private/dialogues")
	var utterset = bars.getsetnocontext(dataset)
	var stats = trainAndTest.trainAndTest_hash(classifier.BinarySegmentation, utterset["train"], utterset["test"], 5)
}

if (check_ds)
{

// 70
// 966
// ----
// 35
// 518

	var dataset = bars.loadds("../negochat_private/dialogues")
	var utterset = bars.getsetnocontext(dataset)

	console.log(utterset["train"].length)
	console.log(_.flatten(utterset["train"]).length)
	console.log("----")
	
	console.log(utterset["test"].length)
	console.log(_.flatten(utterset["test"]).length)

	utterset["test"] = _.flatten(utterset["test"])
	utterset["train"] = _.flatten(utterset["train"])

	var stats = trainAndTest.trainAndTest_hash(classifier.DS_bigram, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), 5)

	// var stats_cl = trainAndTest.trainAndTest_hash(classifier.DS_bigram, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), 5)

	console.log(JSON.stringify(stats["stats"], null, 4))

}

if (check_ds_context)
{
	
	var trainset = []
	var testset = []
	var context = []

	var dataset = bars.loadds("../negochat_private/dialogues")

	var train = dataset['train']
	var test = dataset['test']

	_.each(train, function(di, key, list){
		_.each(di['turns'], function(utt, key1, list){

			// if (utt.role == "Candidate")
			// 	context = hashtoar(utt.output)

			if (utt.role == "Employer")
			{
				if (_.keys(utt.output).length!=0)
				{
					var record = {}
					//record['input'] = {}
					//record['input']['text'] = utt.input
					//record['input']['context'] = context
					record['input'] = utt.input
					record['output'] = hashtoar(utt.output)
					trainset.push(record)
					//context = []
				}
			}

			
		}, this)
	}, this)

	var context = []

	_.each(test, function(di, key, list){
		_.each(di['turns'], function(utt, key1, list){

			//if (utt.role == "Candidate")
			//	context = hashtoar(utt.output)

			if (utt.role == "Employer")
			{
				// if (_.keys(utt.output).length!=0)
				{
					var record = {}
					// record['input'] = {}
					// record['input']['text'] = utt.input
					record['input'] = utt.input
					// record['input']['context'] = context
					record['output'] = hashtoar(utt.output)
					testset.push(record)
					//context = []
					
			
				}
			}
			
		}, this)
	}, this)

	console.log(testset.length)
	console.log(trainset.length)

	var stats = trainAndTest.trainAndTest_hash(classifier.DS, trainset, testset, 5)

	console.log(JSON.stringify(stats, null, 4))

	process.exit()
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
