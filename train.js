/**
 * Demonstrates a full text-categorization system, with feature extractors and cross-validation.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var mlutils = require('../machine-learning/utils');
var _ = require('underscore')._;
var fs = require('fs');

console.log("machine learning trainer start");

//var domainDataset = JSON.parse(fs.readFileSync("datasets/Dataset0Domain.json"));
var grammarDataset = JSON.parse(fs.readFileSync("datasets/Dataset0Grammar.json"));
var collectedDatasetMulti = JSON.parse(fs.readFileSync("datasets/Dataset1Woz.json"));
var collectedDatasetSingle = JSON.parse(fs.readFileSync("datasets/Dataset1Woz1class.json"));
var collectedDatasetMulti2 = JSON.parse(fs.readFileSync("datasets/Dataset2Woz.json"));
var collectedDatasetMulti3 = JSON.parse(fs.readFileSync("datasets/Dataset3Woz.json"));

var createWinnowClassifier = function() {
	var classifiers = require(__dirname+'/../machine-learning/classifiers');
	var FeatureExtractor = require(__dirname+'/../machine-learning/features');
	var fs = require('fs');

	return new classifiers.EnhancedClassifier({
		classifierType: classifiers.BinaryClassifierSet,
		classifierOptions: {
				binaryClassifierType: classifiers.Winnow,
				binaryClassifierOptions: {
					retrain_count: 12,  /* much better than 5, better than 10 */
					do_averaging: false,
					margin: 1,
				},
		},
		normalizer: FeatureExtractor.RegexpNormalizer(
			JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json'))
		),
		featureExtractor: [
			//FeatureExtractor.WordsFromText(1,false/*,4,0.8*/),
			FeatureExtractor.WordsFromText(2,false/*,4,0.6*/),
			//FeatureExtractor.WordsFromText(3,false/*,4,0.6*/),
		],
		featureExtractorForClassification: [
			FeatureExtractor.Hypernyms(JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/hypernyms.json'))),
		],
		pastTrainingSamples: [], // to enable retraining
	});
}

var createNewClassifier = createWinnowClassifier;

var do_cross_dataset_testing = true;
var do_cross_validation = true;
var do_serialization = true;

var verbosity = 0;
var explain = 0;

var partitions = mlutils.partitions;
var PrecisionRecall = mlutils.PrecisionRecall;
var trainAndTest = mlutils.trainAndTest;

if (do_cross_dataset_testing) {
	//console.log("\nTrain on domain data, test on woz single class: "+
	//	trainAndTest(createNewClassifier, domainDataset, collectedDatasetSingle, verbosity).shortStats());
	//console.log("\nTrain on domain data, test on woz multi class: "+
	//	trainAndTest(createNewClassifier, domainDataset, collectedDatasetMulti, verbosity).shortStats());
	console.log("\nTrain on grammar data, test on woz single class: "+
		trainAndTest(createNewClassifier, grammarDataset, collectedDatasetSingle, verbosity).shortStats());
	console.log("\nTrain on grammar data, test on woz multi class: "+
		trainAndTest(createNewClassifier, grammarDataset, collectedDatasetMulti, verbosity).shortStats());
	console.log("\nTrain on woz single class, test on woz multi class: "+
		trainAndTest(createNewClassifier, collectedDatasetSingle, collectedDatasetMulti, verbosity).shortStats());
	console.log("\nTrain on woz multi class, test on woz single class: "+
		trainAndTest(createNewClassifier, collectedDatasetMulti, collectedDatasetSingle, verbosity).shortStats());
	
	collectedDatasetMultiPartition = partitions.partition(collectedDatasetMulti, 0, collectedDatasetMulti.length/2);
	collectedDatasetSinglePartition = partitions.partition(collectedDatasetSingle, 0, collectedDatasetSingle.length/2);
	console.log("\nTrain on mixed, test on mixed: "+
		trainAndTest(createNewClassifier, 
			collectedDatasetMultiPartition.train.concat(collectedDatasetSinglePartition.train), 
			collectedDatasetMultiPartition.test.concat(collectedDatasetSinglePartition.test), 
			verbosity).shortStats());
	console.log("\nTrain on mixed, test on mixed (2): "+
		trainAndTest(createNewClassifier, 
			collectedDatasetMultiPartition.test.concat(collectedDatasetSinglePartition.test), 
			collectedDatasetMultiPartition.train.concat(collectedDatasetSinglePartition.train), 
			verbosity).shortStats());
} // do_cross_dataset_testing

if (do_cross_validation) {

	var numOfFolds = 3; // for k-fold cross-validation
	var microAverage = new PrecisionRecall();
	var macroAverage = new PrecisionRecall();
	
	var devSet = collectedDatasetMulti.concat(collectedDatasetSingle).concat(collectedDatasetMulti2).concat(collectedDatasetMulti3);
	var startTime = new Date();
	console.log("\nstart "+numOfFolds+"-fold cross-validation on "+grammarDataset.length+" grammar samples and "+devSet.length+" collected samples");
	partitions.partitions(devSet, numOfFolds, function(trainSet, testSet, index) {
		console.log("partition #"+index+": "+(new Date()-startTime)+" [ms]");
		trainAndTest(createNewClassifier,
			trainSet.concat(grammarDataset), testSet, verbosity,
			microAverage, macroAverage
		);
	});
	_(macroAverage).each(function(value,key) { macroAverage[key]=value/numOfFolds; });
	console.log("\nend "+numOfFolds+"-fold cross-validation: "+(new Date()-startTime)+" [ms]");

	if (verbosity>0) {console.log("\n\nMACRO AVERAGE FULL STATS:"); console.dir(macroAverage.fullStats());}
	console.log("\nMACRO AVERAGE SUMMARY: "+macroAverage.shortStats());

	microAverage.calculateStats();
	if (verbosity>0) {console.log("\n\nMICRO AVERAGE FULL STATS:"); console.dir(microAverage.fullStats());}
	console.log("\nMICRO AVERAGE SUMMARY: "+microAverage.shortStats());
} // do_cross_validation

if (do_serialization) {
	var classifier = createNewClassifier();
	var dataset = grammarDataset.concat(collectedDatasetMulti).concat(collectedDatasetSingle).concat(collectedDatasetMulti2).concat(collectedDatasetMulti3);

	//dataset = dataset.slice(0,20);
	console.log("\nstart training on "+dataset.length+" samples");
	var startTime = new Date();
	classifier.trainBatch(dataset);
	console.log("end training on "+dataset.length+" samples, "+(new Date()-startTime)+" [ms]");

	console.log("\ntest on training data:");
	mlutils.testLite(classifier, dataset);
	
	var resultsBeforeReload = [];
	for (var i=0; i<dataset.length; ++i) {
		var actualClasses = classifier.classify(dataset[i].input);  
		actualClasses.sort();
		resultsBeforeReload[i] = actualClasses;
	}
	
	fs.writeFileSync("trainedClassifiers/MostRecentClassifier.json", 
		mlutils.serialize.toString(classifier, createNewClassifier), 'utf8');

	var classifier2 = mlutils.serialize.fromString(
		fs.readFileSync("trainedClassifiers/MostRecentClassifier.json"), __dirname);

	console.log("\ntest on training data after reload:")
	for (var i=0; i<dataset.length; ++i) {
		var actualClasses = classifier2.classify(dataset[i].input);
		actualClasses.sort();
		if (!_(resultsBeforeReload[i]).isEqual(actualClasses)) {
			throw new Error("Reload does not reproduce the original classifier! before reload="+resultsBeforeReload[i]+", after reload="+actualClasses);
		}
		if (verbosity>0) console.log(dataset[i].input+": "+actualClasses);
	}
} // do_serialization

console.log("machine learning trainer end");
