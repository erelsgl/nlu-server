/**
 * Create a new classifier for the ML server.
 *
 * This is the file where the classifier specification (type, options, etc.) is defined.
 *
 * The selection of which classifier to actually use is made in the last line of this file.
 *
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

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

var createPassiveAggressiveClassifier = function() {
	var classifiers = require(__dirname+'/../machine-learning/classifiers');
	var FeatureExtractor = require(__dirname+'/../machine-learning/features');
	var fs = require('fs');

	return new classifiers.EnhancedClassifier({
		classifierType: classifiers.MultiLabelPassiveAggressive,
		classifierOptions: {
			Constant: 5.0,
			retrain_count: 100,
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

//module.exports = createPassiveAggressiveClassifier;
module.exports = createWinnowClassifier;

