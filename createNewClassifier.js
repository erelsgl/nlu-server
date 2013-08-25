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

createPassiveAggressiveClassifier: function() {
	var classifiers = require(__dirname+'/../machine-learning/classifiers');
	var FeaturesUnit = require(__dirname+'/../machine-learning/features');
	var fs = require('fs');

	return new classifiers.EnhancedClassifier({
		classifierType: classifiers.multilabel.PassiveAggressive,
		classifierOptions: {
			Constant: 5.0,
			retrain_count: 12,
		},
		inputSplitter: FeaturesUnit.RegexpSplitter(/[.,;?!]|and/i),
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
	
	var winnowOptions = {
				retrain_count: 12,  /* much better than 5, better than 10 */
				do_averaging: false,
				margin: 1,
	};
	
	var ngramExtractors = [
				FeaturesUnit.WordsFromText(1,false/*,4,0.8*/),
				FeaturesUnit.WordsFromText(2,false/*,4,0.6*/),
	];

	return new classifiers.EnhancedClassifier({
		normalizer: [FeaturesUnit.RegexpNormalizer(
			        JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json'))
			.concat(JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/ChatNormalizations.json')))
		)],
		inputSplitter: FeaturesUnit.RegexpSplitter(/[.,;?!]|and/i),
		pastTrainingSamples: [], // to enable retraining

		classifierType: classifiers.multilabel.BinarySegmentation,
		classifierOptions: {
			binaryClassifierType: classifiers.Winnow,
			binaryClassifierOptions: winnowOptions,
			featureExtractor: ngramExtractors,
			//segmentSplitStrategy: 'shortestSegment',
			//segmentSplitStrategy: 'longestSegment',
			segmentSplitStrategy: null,
		},
	});
},



createWinnowClassifierWithSpeller: function() {
	var classifiers = require(__dirname+'/../machine-learning/classifiers');
	var FeaturesUnit = require(__dirname+'/../machine-learning/features');
	var fs = require('fs');
	
	var spellChecker = require('wordsworth').getInstance();
	// pre-train the spellChecker with a large file:
	//fs.readFileSync(__dirname+'/knowledgeresources/spelling/seed.txt','utf-8').split("\n").forEach(function(word) {
	//	spellChecker.understand(word);
	//});

	return new classifiers.EnhancedClassifier({
		normalizer: [FeaturesUnit.RegexpNormalizer(
			JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json'))
		)],
		inputSplitter: FeaturesUnit.RegexpSplitter(/[.,;?!]|and/i),
		spellChecker: spellChecker,
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
		    FeaturesUnit.WordsFromText(1,false/*,4,0.8*/),
			FeaturesUnit.WordsFromText(2,false/*,4,0.6*/),
	 	],
		featureExtractorForClassification: [
			FeaturesUnit.Hypernyms(JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/hypernyms.json'))),
		],
		pastTrainingSamples: [], // to enable retraining
	});
},


createWinnowClassifierWithoutSpeller: function() {
	var classifiers = require(__dirname+'/../machine-learning/classifiers');
	var FeaturesUnit = require(__dirname+'/../machine-learning/features');
	var fs = require('fs');

	return new classifiers.EnhancedClassifier({
		normalizer: [FeaturesUnit.RegexpNormalizer(
			JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json'))
		)],
		inputSplitter: FeaturesUnit.RegexpSplitter(/[.,;?!]|and/i),
		spellChecker: null,
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
		    FeaturesUnit.WordsFromText(1,false/*,4,0.8*/),
			FeaturesUnit.WordsFromText(2,false/*,4,0.6*/),
	 	],
		featureExtractorForClassification: [
			FeaturesUnit.Hypernyms(JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/hypernyms.json'))),
		],
		pastTrainingSamples: [], // to enable retraining
	});
},

}

//module.exports.defaultClassifier = module.exports.createPassiveAggressiveClassifier;
//module.exports.defaultClassifier = module.exports.createWinnowClassifierWithoutSpeller;
//module.exports.defaultClassifier = module.exports.createWinnowSegmenter;
module.exports.defaultClassifier = module.exports.createPassiveAggressiveClassifier;
if (!module.exports.defaultClassifier) throw new Error("Default classifier is null");
