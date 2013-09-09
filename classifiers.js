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

var extend = require('util')._extend;
var fs = require('fs');

var classifiers = require(__dirname+'/../machine-learning/classifiers');
var ftrs = require(__dirname+'/../machine-learning/features');
var Hierarchy = require(__dirname+'/Hierarchy');

var featureExtractor = [
                              			ftrs.WordsFromText(1,false/*,4,0.8*/),
                            			ftrs.WordsFromText(2,false/*,4,0.6*/),
                            			ftrs.LastLetterExtractor,
                            		//	ftrs.WordsFromText(3,true/*,4,0.6*/), // much slower, only a little better
                       ];

var normalizer = [
      			ftrs.LowerCaseNormalizer,
    			ftrs.RegexpNormalizer(
    				JSON.parse(fs.readFileSync('knowledgeresources/BiuNormalizations.json'))
    		)];

var inputSplitter = ftrs.RegexpSplitter("[.,;?!]|and", /*include delimiters = */{"?":true});

var settings = function() {return {
		normalizer: normalizer,
		inputSplitter: inputSplitter,
		//spellChecker: require('wordsworth').getInstance(),
		featureExtractor: featureExtractor,
		
		featureExtractorForClassification: [
			ftrs.Hypernyms(JSON.parse(fs.readFileSync('knowledgeresources/hypernyms.json'))),
		],

		multiplyFeaturesByIDF: true,
		//minFeatureDocumentFrequency: 2,

		pastTrainingSamples: [], // to enable retraining
}};


/*
 * BINARY CLASSIFIERS (base):
 */

var WinnowBinaryClassifier = classifiers.Winnow.bind(this, {
	retrain_count: 15,  /* 15 is much better than 5, better than 10 */
	promotion: 1.5,
	demotion: 0.5,
	do_averaging: false,
	margin: 1,
	//debug: true,
});

var BayesBinaryClassifier = classifiers.Bayesian.bind(this, {
});

var SvmPerfBinaryClassifier = classifiers.SvmPerf.bind(this, {
	learn_args: "-c 100 --i 1",   // see http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html 
	classify_args: "", 
	model_file_prefix: "trainedClassifiers/SvmPerf/data",
	continuous_output:false,
	debug:false,
});




/*
 * MULTI-LABEL CLASSIFIERS (base):
 */

var WinnowBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.bind(this, {
	binaryClassifierType: WinnowBinaryClassifier,
});

var BayesBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.bind(this, {
	binaryClassifierType: BayesBinaryClassifier,
});

var SvmPerfBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.bind(this, {
	binaryClassifierType: SvmPerfBinaryClassifier,
});

var PassiveAggressiveClassifier = classifiers.multilabel.PassiveAggressive.bind(this, {
	retrain_count: 1,
	Constant: 5.0,
});




/*
 * SEGMENTERS (unused):
 */

var WinnowSegmenter = classifiers.EnhancedClassifier.bind(this, {
		normalizer: normalizer,
		inputSplitter: inputSplitter,
		pastTrainingSamples: [], // to enable retraining

		classifierType: classifiers.multilabel.BinarySegmentation.bind(this, {
			binaryClassifierType: WinnowBinaryClassifier,
			featureExtractor: featureExtractor,
			//segmentSplitStrategy: 'shortestSegment',
			//segmentSplitStrategy: 'longestSegment',
			//segmentSplitStrategy: 'cheapestSegment',
			segmentSplitStrategy: null,
		}),
});

var BayesSegmenter = classifiers.EnhancedClassifier.bind(this, {
		normalizer: normalizer,
		inputSplitter: inputSplitter,
		pastTrainingSamples: [], // to enable retraining

		classifierType: classifiers.multilabel.MulticlassSegmentation.bind(this, {
			multiclassClassifierType: classifiers.Bayesian.bind(this, {
				calculateRelativeProbabilities: true,
			}),
			featureExtractor: featureExtractor,
		}),
});




/*
 * FINAL CLASSIFIERS (exports):
 */

module.exports = {
		WinnowClassifier: classifiers.EnhancedClassifier.bind(this, extend(settings(), {
			classifierType: WinnowBinaryRelevanceClassifier,
		})),

		BayesClassifier: classifiers.EnhancedClassifier.bind(this, extend(settings(), {
			classifierType: BayesBinaryRelevanceClassifier,
		})),
		
		PassiveAggressiveClassifier: classifiers.EnhancedClassifier.bind(this, extend(settings(), {
			classifierType: PassiveAggressiveClassifier,
		})),
		
		HomerSvmPerfClassifier: classifiers.EnhancedClassifier.bind(this, extend(settings(), {
			classifierType: classifiers.multilabel.Homer.bind(this, {
				splitLabel: Hierarchy.splitJson, joinLabel:  Hierarchy.joinJson,
				multilabelClassifierType: SvmPerfBinaryRelevanceClassifier,
			}),
			featureLookupTable: new ftrs.FeatureLookupTable(), 
		})),
		
		HomerWinnowClassifier: classifiers.EnhancedClassifier.bind(this, extend(settings(), {
			classifierType: classifiers.multilabel.Homer.bind(this, {
				splitLabel: Hierarchy.splitJson, joinLabel:  Hierarchy.joinJson,
				multilabelClassifierType: WinnowBinaryRelevanceClassifier,
			}),
		})),
		
		HomerPassiveAggressiveClassifier: classifiers.EnhancedClassifier.bind(this, extend(settings(), {
			classifierType: classifiers.multilabel.Homer.bind(this, {
				splitLabel: Hierarchy.splitJson, joinLabel:  Hierarchy.joinJson,
				multilabelClassifierType: PassiveAggressiveClassifier,
			}),
		})),
};

module.exports.defaultClassifier = module.exports.HomerSvmPerfClassifier;

if (!module.exports.defaultClassifier) throw new Error("Default classifier is null");
