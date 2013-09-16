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

var old_unused_tokenizer = {tokenize: function(sentence) { return sentence.split(/[ \t,;:.!?]/).filter(function(a){return !!a}); }}

var natural = require('natural');
var tokenizer = new natural.WordPunctTokenizer(); // WordTokenizer, TreebankWordTokenizer, WordPunctTokenizer

/*
 * ENHANCEMENTS:
 */

function featureExtractor(sentence, features) {
	var words = tokenizer.tokenize(sentence);
	ftrs.NGramsFromArray(1, 0, words, features);  // unigrams
	ftrs.NGramsFromArray(2, 0, words, features);  // bigrams
	//ftrs.NGramsFromArray(3, 1, words, features);  // trigrams   // much slower, not better at all
	//ftrs.LastLetterExtractor(sentence, features); // last letter - not needed when using WordPunctTokenizer
	return features;
}

var normalizer = [
      			ftrs.LowerCaseNormalizer,
    			ftrs.RegexpNormalizer(
    				JSON.parse(fs.readFileSync('knowledgeresources/BiuNormalizations.json'))
    		)];

var inputSplitter = ftrs.RegexpSplitter("[.,;?!]|and", /*include delimiters = */{"?":true});


/*
 * BINARY CLASSIFIERS (used as basis to other classifiers):
 */

var WinnowBinaryClassifier = classifiers.Winnow.where({
	retrain_count: 15,  /* 15 is much better than 5, better than 10 */
	promotion: 1.5,
	demotion: 0.5,
	do_averaging: false,
	margin: 1,
	//debug: true,
});

var BayesBinaryClassifier = classifiers.Bayesian.where({
});

var SvmPerfBinaryClassifier = classifiers.SvmPerf.where({
	learn_args: "-c 100 --i 1",   // see http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html 
	model_file_prefix: "trainedClassifiers/tempfiles/SvmPerf",
});


var SvmLinearBinaryClassifier = classifiers.SvmLinear.where({
	learn_args: "-c 100", 
	model_file_prefix: "trainedClassifiers/tempfiles/SvmLinearBinary",
});


var SvmLinearMulticlassifier = classifiers.SvmLinear.where({
	learn_args: "-c 100", 
	model_file_prefix: "trainedClassifiers/tempfiles/SvmLinearMulti",
	multiclass: true,
})



/*
 * MULTI-LABEL CLASSIFIERS (used as basis to other classifiers):
 */

var WinnowBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.where({
	binaryClassifierType: WinnowBinaryClassifier,
});

var BayesBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.where({
	binaryClassifierType: BayesBinaryClassifier,
});

var SvmPerfBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.where({
	binaryClassifierType: SvmPerfBinaryClassifier,
});

var SvmLinearBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.where({
	binaryClassifierType: SvmLinearBinaryClassifier,
});

var PassiveAggressiveClassifier = classifiers.multilabel.PassiveAggressive.where({
	retrain_count: 1,
	Constant: 5.0,
});

var LanguageModelClassifier = classifiers.multilabel.CrossLanguageModel.bind(this, {
	smoothingFactor : 0.9,
	labelFeatureExtractor: Hierarchy.splitJsonFeatures,
});

/*
 * SEGMENTERS (unused):
 */

var WinnowSegmenter = classifiers.EnhancedClassifier.where({
		normalizer: normalizer,
		inputSplitter: inputSplitter,
		pastTrainingSamples: [], // to enable retraining

		classifierType: classifiers.multilabel.BinarySegmentation.where({
			binaryClassifierType: WinnowBinaryClassifier,
			featureExtractor: featureExtractor,
			//segmentSplitStrategy: 'shortestSegment',
			//segmentSplitStrategy: 'longestSegment',
			//segmentSplitStrategy: 'cheapestSegment',
			segmentSplitStrategy: null,
		}),
});

var BayesSegmenter = classifiers.EnhancedClassifier.where({
		normalizer: normalizer,
		inputSplitter: inputSplitter,
		pastTrainingSamples: [], // to enable retraining

		classifierType: classifiers.multilabel.MulticlassSegmentation.where({
			multiclassClassifierType: classifiers.Bayesian.where({
				calculateRelativeProbabilities: true,
			}),
			featureExtractor: featureExtractor,
		}),
});




/*
 * CONSTRUCTORS:
 */

var enhance = function (classifierType, featureLookupTable, labelLookupTable) {
	return classifiers.EnhancedClassifier.where({
		normalizer: normalizer,
		inputSplitter: inputSplitter,
		//spellChecker: require('wordsworth').getInstance(),
		featureExtractor: featureExtractor,
		
		featureLookupTable: featureLookupTable,
		labelLookupTable: labelLookupTable,
		
		featureExtractorForClassification: [
			ftrs.Hypernyms(JSON.parse(fs.readFileSync('knowledgeresources/hypernyms.json'))),
		],

		multiplyFeaturesByIDF: true,
		//minFeatureDocumentFrequency: 2,

		pastTrainingSamples: [], // to enable retraining
			
		classifierType: classifierType,
	});
};

var homer = function(multilabelClassifierType) {
	return classifiers.multilabel.Homer.where({
		splitLabel: Hierarchy.splitJson, 
		joinLabel:  Hierarchy.joinJson,
		multilabelClassifierType: multilabelClassifierType,
	});
};

var metalabeler = function(rankerType, counterType) {
	if (!counterType) counterType=rankerType;
	return classifiers.multilabel.MetaLabeler.where({
		rankerType:  rankerType,
		counterType: counterType,
	});
}



/*
 * FINAL CLASSIFIERS (exports):
 */

module.exports = {
		WinnowClassifier: enhance(WinnowBinaryRelevanceClassifier),
		BayesClassifier: enhance(BayesBinaryRelevanceClassifier),
		SvmPerfClassifier: enhance(SvmPerfBinaryRelevanceClassifier),
		SvmLinearClassifier: enhance(SvmLinearBinaryRelevanceClassifier),
		PassiveAggressiveClassifier: enhance(PassiveAggressiveClassifier),

		MetaLabelerWinnow: enhance(metalabeler(WinnowBinaryRelevanceClassifier)),
		MetaLabelerSvmPerf: enhance(metalabeler(SvmPerfBinaryRelevanceClassifier), new ftrs.FeatureLookupTable()),
		MetaLabelerSvmLinear: enhance(metalabeler(SvmLinearBinaryRelevanceClassifier), new ftrs.FeatureLookupTable()),
		MetaLabelerPassiveAggressive: enhance(metalabeler(PassiveAggressiveClassifier)),
		MetaLabelerPassiveAggressiveSvm: enhance((metalabeler(PassiveAggressiveClassifier,SvmLinearMulticlassifier)), new ftrs.FeatureLookupTable()),
		MetaLabelerLanguageModelWinnow: enhance(metalabeler(LanguageModelClassifier,WinnowBinaryRelevanceClassifier)),
		MetaLabelerLanguageModelSvm: enhance(metalabeler(LanguageModelClassifier,SvmLinearMulticlassifier)),

		HomerSvmPerf: enhance(homer(SvmPerfBinaryRelevanceClassifier), new ftrs.FeatureLookupTable()),
		HomerSvmLinear: enhance(homer(SvmLinearBinaryRelevanceClassifier), new ftrs.FeatureLookupTable()),
		HomerWinnow: enhance(homer(WinnowBinaryRelevanceClassifier)),
		HomerPassiveAggressive: enhance(homer(PassiveAggressiveClassifier)),
		
		HomerMetaLabelerWinnow: enhance(homer(metalabeler(WinnowBinaryRelevanceClassifier))),
		HomerMetaLabelerSvmPerf: enhance(homer(metalabeler(SvmPerfBinaryRelevanceClassifier,SvmLinearMulticlassifier)), new ftrs.FeatureLookupTable()),
		HomerMetaLabelerSvmLinear: enhance(homer(metalabeler(SvmLinearBinaryRelevanceClassifier,SvmLinearMulticlassifier)), new ftrs.FeatureLookupTable()),
		HomerMetaLabelerPassiveAggressive: enhance(homer(metalabeler(PassiveAggressiveClassifier))),
		HomerMetaLabelerPassiveAggressiveWithMulticlassSvm: enhance(homer(metalabeler(PassiveAggressiveClassifier,SvmLinearMulticlassifier)), new ftrs.FeatureLookupTable()),
};

module.exports.defaultClassifier = module.exports.HomerSvmPerf;

if (!module.exports.defaultClassifier) throw new Error("Default classifier is null");
