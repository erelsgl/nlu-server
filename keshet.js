/**
 * Static Utilities for writing files in Joseph Keshet format.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */


var _ = require('underscore')._;
var ftrs = require('../machine-learning/features');
var fs = require('fs');

/**
 * convert a single dataset to Weka ARFF string.
 * @param dataset an array of samples in the format {input: {feature1: xxx, feature2: yyy, ...}, output: [1,2,3]}
 * @param relationName first name of files.
 * @param featureExtractor [optional]
 * @return an ARFF string. 
 */
exports.toKeshet = function(dataset, relationName, featureExtractor) {
	if (!featureExtractor) featureExtractor=_.identity;

	var inputFeatureLookupTable = new ftrs.FeatureLookupTable();
	var outputFeatureLookupTable = new ftrs.FeatureLookupTable();

	// Extract the input attributes (- features):
	dataset.forEach(function(datum) {
		datum.features = featureExtractor(datum.input, {});
		if (!_.isObject(datum.features))
			throw new Error("Expected feature vector to be a hash, but found "+JSON.stringify(datum.features));
		inputFeatureLookupTable.addFeatures(datum.features);
	});
	
	// Extract the target attributes (- classes):
	dataset.forEach(function(datum) {
		if (!_.isArray(datum.output))
			datum.output = [datum.output];
		datum.output = datum.output.map(function(anOutput) {
			return _.isString(anOutput)? anOutput: JSON.stringify(anOutput);
		});
		outputFeatureLookupTable.addFeatures(datum.output);
	});

	toKeshetLocal(dataset, relationName, inputFeatureLookupTable, outputFeatureLookupTable);
	fs.writeFileSync(relationName+".data.dict", JSON.stringify(inputFeatureLookupTable.featureNameToFeatureIndex,null,"\t"), "utf-8");
	fs.writeFileSync(relationName+".labels.dict", JSON.stringify(outputFeatureLookupTable.featureNameToFeatureIndex,null,"\t"), "utf-8");
}



/**
 * convert many dataset to Joseph Keshet files.
 * @param mapFileNameToDataset 
 */
exports.toKeshets = function(outputFolder, mapFileNameToDataset, featureExtractor) {
	if (!featureExtractor) featureExtractor=_.identity;

	var inputFeatureLookupTable = new ftrs.FeatureLookupTable();
	var outputFeatureLookupTable = new ftrs.FeatureLookupTable();
	
	// Extract the input attributes (- features):
	for (var relationName in mapFileNameToDataset) {
		var dataset = mapFileNameToDataset[relationName];
		dataset.forEach(function(datum) {
			datum.features = featureExtractor(datum.input, {});
			if (!_.isObject(datum.features))
				throw new Error("Expected feature vector to be a hash, but found "+JSON.stringify(datum.features));
			inputFeatureLookupTable.addFeatures(datum.features);
		});
	}
	
	
	// Extract the target attributes (- classes):
	for (var relationName in mapFileNameToDataset) {
		var dataset = mapFileNameToDataset[relationName];
		dataset.forEach(function(datum) {
			if (!_.isArray(datum.output))
				datum.output = [datum.output];
			datum.output = datum.output.map(function(anOutput) {
				return _.isString(anOutput)? anOutput: JSON.stringify(anOutput);
			});
			outputFeatureLookupTable.addFeatures(datum.output);
		});
	}
	
	for (var relationName in mapFileNameToDataset) 
		toKeshetLocal(
			mapFileNameToDataset[relationName], 
			outputFolder+"/"+relationName, 
			inputFeatureLookupTable, outputFeatureLookupTable);
	fs.writeFileSync(outputFolder+"/"+"data.dict", JSON.stringify(inputFeatureLookupTable.featureNameToFeatureIndex,null,"\t"), "utf-8");
	fs.writeFileSync(outputFolder+"/"+"labels.dict", JSON.stringify(outputFeatureLookupTable.featureNameToFeatureIndex,null,"\t"), "utf-8");
}



/**
 * convert a single dataset to Weka ARFF string.
 * @param dataset an array of samples in the format {input: {feature1: xxx, feature2: yyy, ...}, output: [1,2,3]}
 * @param relationName first name of files.
 * @param featureLookupTable maps features to indices
 * @return an ARFF string. 
 */
var toKeshetLocal = function(dataset, relationName, inputFeatureLookupTable, outputFeatureLookupTable) {
	var input = "";
	var output = "";
	dataset.forEach(function(datum) {
		if (datum.output.length>=1) {
			for (var feature in datum.features) 
				input += inputFeatureLookupTable.featureToNumber(feature) + ":" + datum.features[feature] + " ";
			input += "\n";
			for (var i in datum.output) {
				output += outputFeatureLookupTable.featureToNumber(datum.output[i]);
				if (i<datum.output.length-1)
					 output += ", ";
			}
			output += "\n";
		}
	});
	fs.writeFileSync(relationName+".data", input, "utf-8");
	fs.writeFileSync(relationName+".labels", output, "utf-8");
};




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
	
	var ngramExtractors = ftrs.CollectionOfExtractors([
		ftrs.WordsFromText(1,false/*,4,0.8*/),
		ftrs.WordsFromText(2,false/*,4,0.6*/),
	]);
	
	exports.toKeshets(
		"datasets/keshet",
		{
			train_single: grammarDataset.concat(collectedDatasetSingle),
			train_multi: grammarDataset.concat(collectedDatasetMulti),
			train_both: grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti),
			test: collectedDatasetMulti8,
		},
		ngramExtractors);
}
