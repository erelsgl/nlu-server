/**
 * Utilities for analyzing datasets - calculating the distribution of features, size of vocabulary, etc. 
 * 
 * @author Erel Segal-Halevi
 * @since 2013-09
 */


var _ = require('underscore')._;
var ftrs = require('../machine-learning/features');
var fs = require('fs');

/**
 * Analyze a single dataset.
 * @param dataset an array of samples in the format {input: {feature1: xxx, feature2: yyy, ...}, output: [1,2,3]}
 * @param relationName first name of files.
 * @param normalizers [array of functions, optional]
 * @param featureExtractor [function, optional]
 */
exports.analyze = function(dataset, relationName, normalizers, featureExtractor) {
	if (!normalizers) normalizers = [];
	if (!featureExtractor) featureExtractor=_.identity;
	
	var featureCounts = {};
	var totalFeatureCount = 0;

	// Extract the input attributes (- features):
	dataset.forEach(function(datum) {
		normalizers.forEach(function(normalizer){
			datum.input = normalizer(datum.input);
		});
		datum.features = featureExtractor(datum.input, {});
		if (!_.isObject(datum.features))
			throw new Error("Expected feature vector to be a hash, but found "+JSON.stringify(datum.features));

		for (var feature in datum.features) {
			featureCounts[feature] = (featureCounts[feature]||0) + 1;
			totalFeatureCount++;
		}
	});
	
	var featureCountsCounts = {};
	for (var feature in featureCounts) {
		var count = featureCounts[feature];
		featureCountsCounts[count] = (featureCountsCounts[count]||0)+1;
	}

	return "== "+ relationName + " ==\n"+
		"Avg. occurances: "+totalFeatureCount+" / "+Object.keys(featureCounts).length+" = "+(totalFeatureCount/Object.keys(featureCounts).length) + "\n" +
		"Distribution: "+JSON.stringify(featureCountsCounts);
}




if (process.argv[1] === __filename) {
	// demo program
	
	var grammarDataset = JSON.parse(fs.readFileSync("datasets/Employer/Dataset0Grammar.json"));
	var collectedDatasetMulti = JSON.parse(fs.readFileSync("datasets/Employer/Dataset1Woz.json"));
	var collectedDatasetSingle = JSON.parse(fs.readFileSync("datasets/Employer/Dataset1Woz1class.json"));
	var collectedDatasetMulti2 = JSON.parse(fs.readFileSync("datasets/Employer/Dataset2Woz.json"));
	var collectedDatasetMulti2Easy = JSON.parse(fs.readFileSync("datasets/Employer/Dataset2WozEasy.json"));
	var collectedDatasetSingle2 = JSON.parse(fs.readFileSync("datasets/Employer/Dataset2Woz1class.json"));
	var collectedDatasetSingle2Hard = JSON.parse(fs.readFileSync("datasets/Employer/Dataset2WozHard1class.json"));
	var collectedDatasetMulti4 = JSON.parse(fs.readFileSync("datasets/Employer/Dataset4WozAmt.json"));
	var collectedDatasetMulti8 = JSON.parse(fs.readFileSync("datasets/Employer/Dataset8WozAll.json"));
	var collectedDatasetMulti8Easy = JSON.parse(fs.readFileSync("datasets/Employer/Dataset8WozAllEasy.json"));
	var collectedDatasetSingle8Hard = JSON.parse(fs.readFileSync("datasets/Employer/Dataset8WozAllHard1class.json"));
	
	var normalizers = [
					ftrs.LowerCaseNormalizer,
					ftrs.RegexpNormalizer(
						JSON.parse(fs.readFileSync('knowledgeresources/BiuNormalizations.json'))
				)];
	var unigrams = ftrs.WordsFromText(1,false/*,4,0.8*/);
	var bigrams = ftrs.WordsFromText(2,false/*,4,0.6*/);
	
	console.log(
		exports.analyze(
			grammarDataset, "Grammar Dataset - Unigrams",
			normalizers, unigrams) + "\n\n" +
		exports.analyze(
			grammarDataset, "Grammar Dataset - Bigrams",
			normalizers, bigrams) + "\n\n\n" +
		exports.analyze(
			collectedDatasetMulti, "Old woz dataset - Unigrams",
			normalizers, unigrams) + "\n\n" +
		exports.analyze(
			collectedDatasetMulti, "Old woz dataset - Bigrams",
			normalizers, bigrams) + "\n\n\n" +
		exports.analyze(
			collectedDatasetMulti4, "Amazon Dataset - Unigrams",
			normalizers, unigrams) + "\n\n" +
		exports.analyze(
			collectedDatasetMulti4, "Amazon Dataset - Bigrams",
			normalizers, bigrams) + "\n\n\n" +
		exports.analyze(
			collectedDatasetMulti8, "Amazon and Expert Dataset - Unigrams",
			normalizers, unigrams) + "\n\n" +
		exports.analyze(
			collectedDatasetMulti8, "Amazon and Expert Dataset - Bigrams",
			normalizers, bigrams) + "\n\n\n" +
		""
	);
}
