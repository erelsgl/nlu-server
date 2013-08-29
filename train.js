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
var collectedDatasetMulti2Easy = JSON.parse(fs.readFileSync("datasets/Employer/Dataset2WozEasy.json"));
//var collectedDatasetMulti2Hard = JSON.parse(fs.readFileSync("datasets/Employer/Dataset2WozHard.json"));
var collectedDatasetSingle2 = JSON.parse(fs.readFileSync("datasets/Employer/Dataset2Woz1class.json"));
var collectedDatasetSingle2Hard = JSON.parse(fs.readFileSync("datasets/Employer/Dataset2WozHard1class.json"));
var collectedDatasetMulti4 = JSON.parse(fs.readFileSync("datasets/Employer/Dataset4WozAmt.json"));
var collectedDatasetMulti8 = JSON.parse(fs.readFileSync("datasets/Employer/Dataset8WozAll.json"));
var collectedDatasetMulti8Easy = JSON.parse(fs.readFileSync("datasets/Employer/Dataset8WozAllEasy.json"));
var collectedDatasetSingle8Hard = JSON.parse(fs.readFileSync("datasets/Employer/Dataset8WozAllHard1class.json"));

var createNewClassifier = require('./createNewClassifier').defaultClassifier;

var do_split = false;
var do_cross_dataset_testing = true;
var do_cross_validation = true;
var do_serialization = false;

var verbosity = 0;
var explain = 0;

var partitions = mlutils.partitions;
var PrecisionRecall = mlutils.PrecisionRecall;
var trainAndTest = mlutils.trainAndTest;
var trainAndCompare = mlutils.trainAndCompare;
var trainAndTestLite = mlutils.trainAndTestLite;

if (do_split) {
	console.log("\nSPLIT TO EASY AND HARD: ");
	var classifier = createNewClassifier();
	classifier.trainBatch(
			       JSON.parse(fs.readFileSync("datasets/Employer/Dataset0Grammar.json")).
			concat(JSON.parse(fs.readFileSync("datasets/Employer/Dataset1Woz1class.json"))));
	var datasets = mlutils.splitToEasyAndHard(classifier, JSON.parse(fs.readFileSync("datasets/Employer/Dataset2Woz.json")));
	console.log("Easy - "+datasets.easy.length+": ");
	console.log(mlutils.json.toJSON(datasets.easy));
	console.log("Hard - "+datasets.hard.length+": ");
	console.log(mlutils.json.toJSON(datasets.hard));
}

if (do_cross_dataset_testing) {
	verbosity=0;
	
	var newData = collectedDatasetMulti8;
	//trainAndCompare(require('./createNewClassifier').createWinnowClassifierWithoutSpeller, 
	//		        require('./createNewClassifier').createWinnowClassifierWithSpeller, 
	//		        grammarDataset, newData, verbosity+2);
	//process.exit(1);
	
	/*console.log("Calculate learning curve");
	mlutils.learningCurve(createNewClassifier, [
	    grammarDataset.concat(collectedDatasetSingle), 
	    //collectedDatasetMulti.slice(0,50), 
	    //collectedDatasetMulti.slice(50,100), 
	    collectedDatasetMulti2.slice(0,50), 
	    collectedDatasetMulti2.slice(50,100), 
	    collectedDatasetMulti8.slice(0,50), 
	    collectedDatasetMulti8.slice(50,100), 
	    collectedDatasetMulti8.slice(100,150), 
	    collectedDatasetMulti8.slice(150,200)],
	  verbosity);
	console.log("");*/
	
	//console.log("Train on grammar+single1, test on multi8: "+
	//		trainAndTestLite(createNewClassifier, grammarDataset.concat(collectedDatasetSingle), collectedDatasetMulti8.slice(10,15), verbosity+3).shortStats())+"\n";
	//process.exit(1);
	
	console.log("Train on grammar, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset, collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single1, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+multi1, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single1+multi1, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti), collectedDatasetMulti8, verbosity).shortStats())+"\n";

	console.log("Train on grammar+multi2, test on multi8: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single2hard, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle2Hard), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single2, test on multi8: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single2hard+multi2, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle2Hard).concat(collectedDatasetMulti2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single2+multi2, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle2).concat(collectedDatasetMulti2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	
	console.log("Train on grammar+multi1+multi2, test on multi8: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti).concat(collectedDatasetMulti2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single1+single2, test on multi8: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetSingle2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single1+multi1+single2+multi2, test on multi8: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti).concat(collectedDatasetSingle2).concat(collectedDatasetMulti2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	
	console.log("Train on grammar+single1+multi8, test on multi2: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti8), collectedDatasetMulti2, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single1+single8hard, test on multi2: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetSingle8Hard), collectedDatasetMulti2, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single1+single8hard+multi8easy, test on multi2: "+
			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetSingle8Hard).concat(collectedDatasetMulti8Easy), collectedDatasetMulti2, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single1+single8hard+multi8, test on multi2: "+
			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetSingle8Hard).concat(collectedDatasetMulti8), collectedDatasetMulti2, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single1+single8hard+multi1+multi8, test on multi2: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti).concat(collectedDatasetSingle).concat(collectedDatasetMulti8).concat(collectedDatasetSingle8Hard), collectedDatasetMulti2, verbosity).shortStats())+"\n";

	//console.log("Train on old data, compare on new data: "+
	//	trainAndCompare(require('./createNewClassifier').createWinnowClassifierWithoutNormalizer, require('./createNewClassifier').createWinnowClassifierWithNormalizer, oldData, newData, verbosity+3))+"\n";

	console.log("\nTrain on grammar data, test on woz single class: "+
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

	var numOfFolds = 5; // for k-fold cross-validation
	var microAverage = new PrecisionRecall();
	var macroAverage = new PrecisionRecall();
	
	var constantTrainSet = (grammarDataset).concat(collectedDatasetSingle);
	var devSet = (collectedDatasetMulti2).concat(collectedDatasetMulti8);
	var startTime = new Date();
	console.log("\nstart "+numOfFolds+"-fold cross-validation on "+grammarDataset.length+" grammar samples and "+collectedDatasetSingle.length+" single samples and "+devSet.length+" collected samples");
	partitions.partitions(devSet, numOfFolds, function(trainSet, testSet, index) {
		console.log("partition #"+index+": "+(new Date()-startTime)+" [ms]");
		trainAndTest(createNewClassifier,
			trainSet.concat(constantTrainSet), testSet, verbosity,
			microAverage, macroAverage
		);
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

		var grammarDataset = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset0Grammar.json"));
		//var collectedDatasetMulti = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset1Woz.json"));
		var collectedDatasetSingle = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset1Woz1class.json"));
		var collectedDatasetMulti2 = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset2Woz.json"));
		var collectedDatasetMulti2Easy = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset2WozEasy.json"));
		var collectedDatasetSingle2Hard = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset2WozHard1class.json"));
		var collectedDatasetSingle2 = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset2Woz1class.json"));
		var collectedDatasetMulti8 = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset8WozAll.json"));
		var collectedDatasetMulti8Easy = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset8WozAllEasy.json"));
		var collectedDatasetSingle8Hard = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/Dataset8WozAllHard1class.json"));

		var dataset = grammarDataset.
			concat(collectedDatasetSingle).
			concat(collectedDatasetMulti2).
			concat(collectedDatasetSingle2).
			concat(collectedDatasetMulti8).
			concat(collectedDatasetSingle8Hard)
			;

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
