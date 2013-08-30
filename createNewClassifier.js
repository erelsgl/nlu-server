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
		classifierType: classifiers.multilabel.PassiveAggressive.bind(this, {
			Constant: 5.0,
			retrain_count: 12,
		}),
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

		classifierType: classifiers.multilabel.BinarySegmentation.bind(this, {
			binaryClassifierType: classifiers.Winnow.bind(this, winnowOptions),
			featureExtractor: ngramExtractors,
			//segmentSplitStrategy: 'shortestSegment',
			//segmentSplitStrategy: 'longestSegment',
			//segmentSplitStrategy: 'cheapestSegment',
			segmentSplitStrategy: null,
		}),
	});
},



createWinnowClassifier: function() {
	var classifiers = require(__dirname+'/../machine-learning/classifiers');
	var FeaturesUnit = require(__dirname+'/../machine-learning/features');
	var fs = require('fs');

	return new classifiers.EnhancedClassifier({
		normalizer: [FeaturesUnit.RegexpNormalizer(
			JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json'))
		)],
		inputSplitter: FeaturesUnit.RegexpSplitter(/[.,;?!]|and/i),
		spellChecker: null,
		classifierType: classifiers.multilabel.BinaryRelevance.bind(this, {
				binaryClassifierType: classifiers.Winnow.bind(this, {
					retrain_count: 12,  /* much better than 5, better than 10 */
					do_averaging: false,
					margin: 1,
				}),
		}),
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



createBayesClassifier: function() {
	var classifiers = require(__dirname+'/../machine-learning/classifiers');
	var FeaturesUnit = require(__dirname+'/../machine-learning/features');
	var fs = require('fs');

	return new classifiers.EnhancedClassifier({
		normalizer: [FeaturesUnit.RegexpNormalizer(
			JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json'))
		)],
		inputSplitter: FeaturesUnit.RegexpSplitter(/[.,;?!]|and/i),
		spellChecker: null,
		classifierType: classifiers.multilabel.BinaryRelevance.bind(this, {
				binaryClassifierType: classifiers.Bayesian.bind(this, {
				}),
		}),
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


createBayesSegmenter: function() {
	var classifiers = require(__dirname+'/../machine-learning/classifiers');
	var FeaturesUnit = require(__dirname+'/../machine-learning/features');
	var fs = require('fs');
	
	var ngramExtractors = [
			//	FeaturesUnit.WordsFromText(1,false/*,4,0.8*/),
				FeaturesUnit.WordsFromText(2,false/*,4,0.6*/),
	];

	return new classifiers.EnhancedClassifier({
		normalizer: [FeaturesUnit.RegexpNormalizer(
			        JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json'))
			.concat(JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/ChatNormalizations.json')))
		)],
		inputSplitter: FeaturesUnit.RegexpSplitter(/[.,;?!]|and/i),
		pastTrainingSamples: [], // to enable retraining

		classifierType: classifiers.multilabel.MulticlassSegmentation.bind(this, {
			multiclassClassifierType: classifiers.Bayesian.bind(this, {
				calculateRelativeProbabilities: true,
			//	normalizeOutputProbabilities: true
			}),
			featureExtractor: ngramExtractors,
		}),
	});
},



createHomerClassifier: function() {
	var classifiers = require(__dirname+'/../machine-learning/classifiers');
	var FeaturesUnit = require(__dirname+'/../machine-learning/features');
	var Hierarchy = require(__dirname+'/Hierarchy');
	var fs = require('fs');

	return new classifiers.EnhancedClassifier({
		normalizer: [FeaturesUnit.RegexpNormalizer(
			JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json'))
		)],
		inputSplitter: FeaturesUnit.RegexpSplitter(/[.,;?!]|and/i),
		spellChecker: null,
		classifierType: classifiers.multilabel.Homer.bind(this, {
			multilabelClassifierType: classifiers.multilabel.BinaryRelevance.bind(this, {
				binaryClassifierType: classifiers.Winnow.bind(this, {
					retrain_count: 12,  /* much better than 5, better than 10 */
					do_averaging: false,
					margin: 1,
				}),
			}),
			splitLabel: Hierarchy.splitJson,
			joinLabel:  Hierarchy.joinJson,
		}),
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
//module.exports.defaultClassifier = module.exports.createWinnowClassifier;
//module.exports.defaultClassifier = module.exports.createWinnowSegmenter;
//module.exports.defaultClassifier = module.exports.createBayesSegmenter;
module.exports.defaultClassifier = module.exports.createHomerClassifier;

if (!module.exports.defaultClassifier) throw new Error("Default classifier is null");
