/**
 * Demonstrates a full text-categorization system, with feature extractors and cross-validation.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var mlutils = require('../machine-learning/utils');
var _ = require('underscore')._;
var fs = require('fs');

console.log("machine learning trainer start\n");

//var domainDataset = JSON.parse(fs.readFileSync("datasets/Employer/Dataset0Domain.json"));
var grammarDataset = JSON.parse(fs.readFileSync("datasets/Employer/Dataset0Grammar.json"));
//grammarDataset.forEach(function(datum) {
//	console.log(datum.input);
//});

var collectedDatasetMulti = JSON.parse(fs.readFileSync("datasets/Employer/Dataset1Woz.json"));
var collectedDatasetSingle = JSON.parse(fs.readFileSync("datasets/Employer/Dataset1Woz1class.json"));
var collectedDatasetMulti2 = JSON.parse(fs.readFileSync("datasets/Employer/Dataset2Woz.json"));
var collectedDatasetMulti3 = JSON.parse(fs.readFileSync("datasets/Employer/Dataset3Expert.json"));
var collectedDatasetMulti4 = JSON.parse(fs.readFileSync("datasets/Employer/Dataset4WozAmt.json"));
var collectedDatasetMulti8 = JSON.parse(fs.readFileSync("datasets/Employer/Dataset8WozAll.json"));

var createNewClassifier = require('./createNewClassifier').defaultClassifier;

var do_cross_dataset_testing = true;
var do_cross_validation = true;
var do_serialization = true;

var verbosity = 0;
var explain = 0;

var partitions = mlutils.partitions;
var PrecisionRecall = mlutils.PrecisionRecall;
var trainAndTest = mlutils.trainAndTest;
var trainAndCompare = mlutils.trainAndCompare;
var trainAndTestLite = mlutils.trainAndTestLite;

if (do_cross_dataset_testing) {
	verbosity=0;
	//console.log("Train on woz single class, test on woz multi class: "+
	//	trainAndTestLite(createNewClassifier, collectedDatasetSingle, collectedDatasetMulti, verbosity).shortStats())+"\n";

	//2-grams:
	//Longest : Accuracy=54/99=55% HammingGain=235/319=72% Precision=94% Recall=77% F1=85% timePerSample=30[ms]
	//Shortest: Accuracy=61/99=62% HammingGain=284/340=82% Precision=89% Recall=93% F1=91% timePerSample=25[ms]

	//2-grams and 1-grams:
	//Longest : Accuracy=79/99=80% HammingGain=297/319=93% Precision=95% Recall=98% F1=96% timePerSample=45[ms]
	//Shortest: Accuracy=69/99=70% HammingGain=301/337=88% Precision=90% Recall=99% F1=94% timePerSample=33[ms]
	//null    : Accuracy=78/99=79% HammingGain=276/308=89% Precision=99% Recall=91% F1=95% timePerSample=12[ms]
	
	//process.exit(1);
	
	/*
	
	var newData = [
	   {"input":"I offer 7000 NIS ",
	    "output":["{\"Offer\":{\"Salary\":\"7,000 NIS\"}}"]}
	 , {"input":"I offer 7k NIS ",
	    "output":["{\"Offer\":{\"Salary\":\"7,000 NIS\"}}"]}
	    ];*/
	/*var newData = [
   {"input":"How about 12k, programmer, with leased car, 10% pension, slow promotion track, and 9 hours?","output":["{\"Offer\":{\"Job Description\":\"Programmer\"}}","{\"Offer\":{\"Leased Car\":\"With leased car\"}}","{\"Offer\":{\"Pension Fund\":\"10%\"}}","{\"Offer\":{\"Promotion Possibilities\":\"Slow promotion track\"}}","{\"Offer\":{\"Salary\":\"12,000 NIS\"}}","{\"Offer\":{\"Working Hours\":\"9 hours\"}}"]}
 , {"input":"How about 12k, programmer, 10% pension, slow promotion track, and 8 hours?","output":["{\"Offer\":{\"Job Description\":\"Programmer\"}}","{\"Offer\":{\"Pension Fund\":\"10%\"}}","{\"Offer\":{\"Promotion Possibilities\":\"Slow promotion track\"}}","{\"Offer\":{\"Salary\":\"12,000 NIS\"}}","{\"Offer\":{\"Working Hours\":\"8 hours\"}}"]}
 , {"input":"How about 12k, programmer, 10% pension, slow promotion track, and 8 hours, no agreement on car?","output":["{\"Offer\":{\"Job Description\":\"Programmer\"}}","{\"Offer\":{\"Leased Car\":\"No agreement\"}}","{\"Offer\":{\"Pension Fund\":\"10%\"}}","{\"Offer\":{\"Promotion Possibilities\":\"Slow promotion track\"}}","{\"Offer\":{\"Salary\":\"12,000 NIS\"}}","{\"Offer\":{\"Working Hours\":\"8 hours\"}}"]}
 , {"input":"How about 12k, programmer, 10% pension, slow promotion track, and 8 hours, without leased car?","output":["{\"Offer\":{\"Job Description\":\"Programmer\"}}","{\"Offer\":{\"Leased Car\":\"Without leased car\"}}","{\"Offer\":{\"Pension Fund\":\"10%\"}}","{\"Offer\":{\"Promotion Possibilities\":\"Slow promotion track\"}}","{\"Offer\":{\"Salary\":\"12,000 NIS\"}}","{\"Offer\":{\"Working Hours\":\"8 hours\"}}"]}
 , {"input":"How about 7k, programmer, 10% pension, slow promotion track, and 8 hours, with leased car?","output":["{\"Offer\":{\"Job Description\":\"Programmer\"}}","{\"Offer\":{\"Leased Car\":\"With leased car\"}}","{\"Offer\":{\"Pension Fund\":\"10%\"}}","{\"Offer\":{\"Promotion Possibilities\":\"Slow promotion track\"}}","{\"Offer\":{\"Salary\":\"7,000 NIS\"}}","{\"Offer\":{\"Working Hours\":\"8 hours\"}}"]}
 , {"input":"How about 7000 salary, programmer, 10% pension, slow promotion track, and 8 hours, with leased car?","output":["{\"Offer\":{\"Job Description\":\"Programmer\"}}","{\"Offer\":{\"Leased Car\":\"With leased car\"}}","{\"Offer\":{\"Pension Fund\":\"10%\"}}","{\"Offer\":{\"Promotion Possibilities\":\"Slow promotion track\"}}","{\"Offer\":{\"Salary\":\"7,000 NIS\"}}","{\"Offer\":{\"Working Hours\":\"8 hours\"}}"]}	
		];*/

	var newData = collectedDatasetMulti4;
	console.log("Train on grammar, test on new data: "+
		trainAndTest(createNewClassifier, grammarDataset, newData, verbosity).shortStats())+"\n";
	//process.exit(1);
	console.log("Train on grammar-single1, test on new data: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle), newData, verbosity).shortStats())+"\n";
	console.log("Train on grammar-single1-multi2, test on new data: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti2), newData, verbosity).shortStats())+"\n";
	console.log("Train on grammar-single1-multi1-multi2, test on new data: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti).concat(collectedDatasetSingle).concat(collectedDatasetMulti2), newData, verbosity).shortStats())+"\n";

	//console.log("Train on old data, compare on new data: "+
	//	trainAndCompare(require('./createNewClassifier').createWinnowClassifierWithoutNormalizer, require('./createNewClassifier').createWinnowClassifierWithNormalizer, oldData, newData, verbosity+3))+"\n";

	console.log("Train on grammar data, test on woz single class: "+
		trainAndTest(createNewClassifier, grammarDataset, collectedDatasetSingle, verbosity).shortStats())+"\n";
	console.log("Train on grammar data, test on woz multi class: "+
		trainAndTest(createNewClassifier, grammarDataset, collectedDatasetMulti, verbosity).shortStats())+"\n";
	console.log("Train on woz single class, test on woz multi class: "+
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

if (do_cross_validation) {
	verbosity=0;

	var numOfFolds = 3; // for k-fold cross-validation
	var microAverage = new PrecisionRecall();
	var macroAverage = new PrecisionRecall();
	
	var devSet = collectedDatasetSingle.concat(collectedDatasetMulti2).concat(collectedDatasetMulti8);
	var startTime = new Date();
	console.log("\nstart "+numOfFolds+"-fold cross-validation on "+grammarDataset.length+" grammar samples and "+devSet.length+" collected samples");
	partitions.partitions(devSet, numOfFolds, function(trainSet, testSet, index) {
		console.log("partition #"+index+": "+(new Date()-startTime)+" [ms]");
		trainAndTest(createNewClassifier,
			trainSet.concat(grammarDataset), testSet, verbosity,
			microAverage, macroAverage
		);
	});
	//_(macroAverage).each(function(value,key) { macroAverage[key] = value/numOfFolds; });
	console.log("\nend "+numOfFolds+"-fold cross-validation: "+(new Date()-startTime)+" [ms]");

	//if (verbosity>0) {console.log("\n\nMACRO AVERAGE FULL STATS:"); console.dir(macroAverage.fullStats());}
	//console.log("\nMACRO AVERAGE SUMMARY: "+macroAverage.shortStats());

	microAverage.calculateStats();
	if (verbosity>0) {console.log("\n\nMICRO AVERAGE FULL STATS:"); console.dir(microAverage.fullStats());}
	console.log("\nMICRO AVERAGE SUMMARY: "+microAverage.shortStats());
} // do_cross_validation

if (do_serialization) {
	verbosity=0;
	["Employer","Candidate"].forEach(function(classifierName) {
		console.log("\nBuilding classifier for "+classifierName);
		var classifier = createNewClassifier();

		var grammarDataset = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset0Grammar.json"));
		//var collectedDatasetMulti = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset1Woz.json"));
		var collectedDatasetSingle = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset1Woz1class.json"));
		var collectedDatasetMulti2 = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset2Woz.json"));
		var collectedDatasetMulti3 = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset8WozAll.json"));

		var dataset = grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti2).concat(collectedDatasetMulti3);

		console.log("\nstart training on "+dataset.length+" samples");
		var startTime = new Date();
		classifier.trainBatch(dataset);
		console.log("end training on "+dataset.length+" samples, "+(new Date()-startTime)+" [ms]");

		console.log("\ntest on training data: "+mlutils.test(classifier, dataset).shortStats());
		//mlutils.testLite(classifier, dataset);

		var resultsBeforeReload = [];
		for (var i=0; i<dataset.length; ++i) {
			var actualClasses = classifier.classify(dataset[i].input);  
			actualClasses.sort();
			resultsBeforeReload[i] = actualClasses;
		}
		
		fs.writeFileSync("trainedClassifiers/"+classifierName+"/MostRecentClassifier.json", 
			mlutils.serialize.toString(classifier, createNewClassifier), 'utf8');
	
		var classifier2 = mlutils.serialize.fromString(
			fs.readFileSync("trainedClassifiers/"+classifierName+"/MostRecentClassifier.json"), __dirname);
	
		console.log("\ntest on training data after reload:")
		for (var i=0; i<dataset.length; ++i) {
			var actualClasses = classifier2.classify(dataset[i].input);
			actualClasses.sort();
			if (!_(resultsBeforeReload[i]).isEqual(actualClasses)) {
				throw new Error("Reload does not reproduce the original classifier! before reload="+resultsBeforeReload[i]+", after reload="+actualClasses);
			}
			if (verbosity>0) console.log(dataset[i].input+": "+actualClasses);
		}
	});
} // do_serialization

console.log("machine learning trainer end");
