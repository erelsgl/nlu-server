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

module.exports = {

createWinnowClassifierWithNormalizer: function() {
	var classifiers = require(__dirname+'/../machine-learning/classifiers');
	var FeaturesUnit = require(__dirname+'/../machine-learning/features');
	var fs = require('fs');

	return new classifiers.EnhancedClassifier({
		normalizer: [FeaturesUnit.RegexpNormalizer(
			JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json'))
		)],
		classifierType: classifiers.multilabel.BinaryRelevance,
		classifierOptions: {
				binaryClassifierType: classifiers.Winnow,
				binaryClassifierOptions: {
					retrain_count: 12,  /* much better than 5, better than 10 */
					do_averaging: false,
					margin: 1,
				},
		},
		featureExtractor: [
			//FeaturesUnit.WordsFromText(1,false/*,4,0.8*/),
			FeaturesUnit.WordsFromText(2,false/*,4,0.6*/),
			//FeaturesUnit.WordsFromText(3,false/*,4,0.6*/),
		],
		featureExtractorForClassification: [
			FeaturesUnit.Hypernyms(JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/hypernyms.json'))),
		],
		pastTrainingSamples: [], // to enable retraining
	});
},

createPassiveAggressiveClassifier: function() {
	var classifiers = require(__dirname+'/../machine-learning/classifiers');
	var FeaturesUnit = require(__dirname+'/../machine-learning/features');
	var fs = require('fs');

	return new classifiers.EnhancedClassifier({
		classifierType: classifiers.MultiLabelPassiveAggressive,
		classifierOptions: {
			Constant: 5.0,
			retrain_count: 12,
		},
		normalizer: [FeaturesUnit.RegexpNormalizer(
			JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json'))
		)],
		featureExtractor: [
			//FeaturesUnit.WordsFromText(1,false/*,4,0.8*/),
			FeaturesUnit.WordsFromText(2,false/*,4,0.6*/),
			//FeaturesUnit.WordsFromText(3,false/*,4,0.6*/),
		],
		featureExtractorForClassification: [
			FeaturesUnit.Hypernyms(JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/hypernyms.json'))),
		],
		pastTrainingSamples: [], // to enable retraining
	});
},


createWinnowSegmenter: function() {
	var classifiers = require(__dirname+'/../machine-learning/classifiers');
	var FeaturesUnit = require(__dirname+'/../machine-learning/features');
	var fs = require('fs');

	return new classifiers.EnhancedClassifier({
		normalizer: [FeaturesUnit.RegexpNormalizer(
			        JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json'))
			.concat(JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/ChatNormalizations.json')))
		)],
		inputSplitter: FeaturesUnit.RegexpSplitter(/[.,;?!]|and/i),
		classifierType: classifiers.multilabel.BinarySegmentation,
		classifierOptions: {
			binaryClassifierType: classifiers.Winnow,
			binaryClassifierOptions: {
				retrain_count: 12,  /* much better than 5, better than 10 */
				do_averaging: false,
				margin: 1,
			},
			featureExtractor: [
				FeaturesUnit.WordsFromText(1,false/*,4,0.8*/),
				FeaturesUnit.WordsFromText(2,false/*,4,0.6*/),
			],
			//segmentSplitStrategy: 'shortestSegment',
			//segmentSplitStrategy: 'longestSegment',
			segmentSplitStrategy: null,
		},
		pastTrainingSamples: [], // to enable retraining
	});
},


}

//module.exports.defaultClassifier = module.exports.createWinnowClassifierWithNormalizer;
//module.exports.defaultClassifier = module.exports.createWinnowClassifierWithoutNormalizer;
module.exports.defaultClassifier = module.exports.createWinnowSegmenter;
if (!module.exports.defaultClassifier) throw new Error("Default classifier is null");
