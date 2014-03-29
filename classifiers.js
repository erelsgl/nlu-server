/**
 * Create a new classifier for the NLU server.
 *
 * This is the file where the classifier specification (type, options, etc.) is defined.
 *
 * The selection of which classifier to actually use is made in the bottom of this file.
 *
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var extend = require('util')._extend;
var fs = require('fs');
var limdu = require("limdu");

var classifiers = limdu.classifiers;
var ftrs = limdu.features;
var Hierarchy = require(__dirname+'/Hierarchy');

var old_unused_tokenizer = {tokenize: function(sentence) { return sentence.split(/[ \t,;:.!?]/).filter(function(a){return !!a}); }}

var natural = require('natural');
var tokenizer = new natural.WordPunctTokenizer(); // WordTokenizer, TreebankWordTokenizer, WordPunctTokenizer

/*
 * ENHANCEMENTS:
 */

var regexpNormalizer = ftrs.RegexpNormalizer(
		JSON.parse(fs.readFileSync('knowledgeresources/BiuNormalizations.json')));

function normalizer(sentence) {
	sentence = sentence.toLowerCase().trim();
	return regexpNormalizer(sentence);
}

var regexpString = "([.,;?!]|and)";  // to capture the delimiters
var regexp = new RegExp(regexpString, "i");
var delimitersToInclude = {"?":true};
function inputSplitter(text) {
	var normalizedParts = [];
	if (/^and/i.test(text)) {   // special treatment to a sentence that starts with "and"
		normalizedParts.push("and");
		text = text.replace(/^and\s*/,"");
	}

	var parts = text.split(regexp);
	for (var i=0; i<parts.length; i+=2) {
		parts[i] = parts[i].trim();
		var part = parts[i];
		if (i+1<parts.length) {
			var delimiter = parts[i+1];
			if (delimitersToInclude[delimiter])
				part += " " + delimiter;
		}
		if (part.length>0)
			normalizedParts.push(part);
	}

	return normalizedParts;
}


function featureExtractor(sentence, features) {
	var words = tokenizer.tokenize(sentence);
	ftrs.NGramsFromArray(1, 0, words, features);  // unigrams
	ftrs.NGramsFromArray(2, 0, words, features);  // bigrams
	//ftrs.NGramsFromArray(3, 1, words, features);  // trigrams   // much slower, not better at all
	//require('./LastLetterExtractor')(sentence, features); // last letter - not needed when using WordPunctTokenizer
	return features;
}

/*
 * BINARY CLASSIFIERS (used as basis to other classifiers):
 */

var WinnowBinaryClassifier = classifiers.Winnow.bind(0, {
	retrain_count: 15,  /* 15 is much better than 5, better than 10 */
	promotion: 1.5,
	demotion: 0.5,
	do_averaging: false,
	margin: 1,
	//debug: true,
});

var BayesBinaryClassifier = classifiers.Bayesian.bind(0, {
});

var SvmPerfBinaryClassifier = classifiers.SvmPerf.bind(0, {
	learn_args: "-c 100 --i 1",   // see http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html 
	model_file_prefix: "trainedClassifiers/tempfiles/SvmPerf",
});


var SvmLinearBinaryClassifier = classifiers.SvmLinear.bind(0, {
	learn_args: "-c 100", 
	model_file_prefix: "trainedClassifiers/tempfiles/SvmLinearBinary",
});


var SvmLinearMulticlassifier = classifiers.SvmLinear.bind(0, {
	learn_args: "-c 100", 
	model_file_prefix: "trainedClassifiers/tempfiles/SvmLinearMulti",
	multiclass: true,
})



/*
 * MULTI-LABEL CLASSIFIERS (used as basis to other classifiers):
 */

var AdaboostClassifier = classifiers.multilabel.Adaboost.bind(0, {
	ngram_length: 2,
	iterations: 2000
});

var WinnowBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.bind(0, {
	binaryClassifierType: WinnowBinaryClassifier,
});

var BayesBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.bind(0, {
	binaryClassifierType: BayesBinaryClassifier,
});

var SvmPerfBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.bind(0, {
	binaryClassifierType: SvmPerfBinaryClassifier,
});

var SvmLinearBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.bind(0, {
	binaryClassifierType: SvmLinearBinaryClassifier,
});

var PassiveAggressiveClassifier = classifiers.multilabel.PassiveAggressive.bind(0, {
	retrain_count: 1,
	Constant: 5.0,
});

var LanguageModelClassifier = classifiers.multilabel.CrossLanguageModel.bind(this, {
	smoothingCoefficient: 0.9,
	labelFeatureExtractor: Hierarchy.splitJsonFeatures,
});

/*
 * SEGMENTERS (unused):
 */

var WinnowSegmenter = classifiers.EnhancedClassifier.bind(0, {
		normalizer: normalizer,
		inputSplitter: inputSplitter,
		pastTrainingSamples: [], // to enable retraining

		classifierType: classifiers.multilabel.BinarySegmentation.bind(0, {
			binaryClassifierType: WinnowBinaryClassifier,
			featureExtractor: featureExtractor,
			//segmentSplitStrategy: 'shortestSegment',
			//segmentSplitStrategy: 'longestSegment',
			//segmentSplitStrategy: 'cheapestSegment',
			segmentSplitStrategy: null,
		}),
});

var BayesSegmenter = classifiers.EnhancedClassifier.bind(0, {
		normalizer: normalizer,
		inputSplitter: inputSplitter,
		pastTrainingSamples: [], // to enable retraining

		classifierType: classifiers.multilabel.MulticlassSegmentation.bind(0, {
			multiclassClassifierType: classifiers.Bayesian.bind(0, {
				calculateRelativeProbabilities: true,
			}),
			featureExtractor: featureExtractor,
		}),
});

/*
 * CONSTRUCTORS:
 */

 var enhance3 = function (classifierType, featureLookupTable, labelLookupTable, InputSplitLabel, OutputSplitLabel, TestSplitLabel) {
	return classifiers.EnhancedClassifier.bind(0, {
		normalizer: normalizer,
		// inputSplitter: inputSplitter,
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

		InputSplitLabel: InputSplitLabel,
		OutputSplitLabel: OutputSplitLabel,
		TestSplitLabel: TestSplitLabel
	});
};

var enhance2 = function (classifierType) {
	return classifiers.EnhancedClassifier.bind(0, {
		normalizer: normalizer,
		inputSplitter: inputSplitter,
		pastTrainingSamples: [], // to enable retraining
		classifierType: classifierType,
	});
};

var enhance = function (classifierType, featureLookupTable, labelLookupTable) {
	return classifiers.EnhancedClassifier.bind(0, {
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

// numberofclassifiers - defines how many classifiers should be defined on initialization step,
// current workaround solution for setFeatureLookupTable routine
var PartialClassification = function(multilabelClassifierType) {
	return classifiers.multilabel.PartialClassification.bind(0, {
		multilabelClassifierType: multilabelClassifierType,
		numberofclassifiers: 3,
	});
};

var homer = function(multilabelClassifierType) {
	return classifiers.multilabel.Homer.bind(0, {
		splitLabel: Hierarchy.splitJson, 
		joinLabel:  Hierarchy.joinJson,
		multilabelClassifierType: multilabelClassifierType,
	});
};

var metalabeler = function(rankerType, counterType) {
	if (!counterType) counterType=rankerType;
	return classifiers.multilabel.MetaLabeler.bind(0, {
		rankerType:  rankerType,
		counterType: counterType,
	});
}

var thresholdclassifier = function(multiclassClassifierType) {
        return classifiers.multilabel.ThresholdClassifier.bind(0, {
                multiclassClassifierType: multiclassClassifierType,
                // ['Accuracy','F1']
                evaluateMeasureToMaximize: 'Accuracy',
                // set the number of fold for cross-validation, 
                // =1 use validation set insted of cross - validation
                numOfFoldsForThresholdCalculation: 10,
        });
}

/*
 * FINAL CLASSIFIERS (exports):
 */

module.exports = {

		HomerAdaboostClassifier: enhance2(homer(AdaboostClassifier)), 
		AdaboostClassifier: enhance2(AdaboostClassifier), 

		WinnowClassifier: enhance(WinnowBinaryRelevanceClassifier),
		BayesClassifier: enhance(BayesBinaryRelevanceClassifier),
		SvmPerfClassifier: enhance(SvmPerfBinaryRelevanceClassifier, new ftrs.FeatureLookupTable()),
		SvmLinearClassifier: enhance(SvmLinearBinaryRelevanceClassifier, new ftrs.FeatureLookupTable()),
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

		ThresholdClassifierLanguageModelWinnow: enhance(thresholdclassifier(LanguageModelClassifier)),
		
		PartialClassificationWinnowEqually: enhance3(PartialClassification(WinnowBinaryRelevanceClassifier),undefined,undefined,Hierarchy.splitPartEqually, Hierarchy.splitPartEqually),
		// construct labels according to the rules of location of positive features
		PartialClassificationEquallyPlace: enhance3(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.OrderLabelJoin,  Hierarchy.splitPartEqually),

		// PartialClassificationEquallyPlace: enhance3(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.OrderLabelJoin,  undefined),
		// at the input separate the labels to intent/attribute/value then join them in greedy approach
		PartialClassificationEquallyGreedy: enhance3(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.greedyLabelJoin,  undefined),
		// separate to intent/attribute/value then retrieve just intent and test only on intent
		PartialClassificationEquallyIntent: enhance3(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent),
		PartialClassificationEqually: enhance3(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, undefined,  Hierarchy.splitPartEqually),
	 	// svm train on the standard labels then on output separate labels
	 	SvmOutputPartialEqually: enhance3(SvmPerfBinaryRelevanceClassifier,new ftrs.FeatureLookupTable(),undefined, undefined, Hierarchy.splitPartEqually,  Hierarchy.splitPartEqually),

		PartialClassificationJustTwo: enhance3(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartVersion2, Hierarchy.splitPartVersion2),
		SvmPerfClassifierPartial: enhance3(SvmPerfBinaryRelevanceClassifier, new ftrs.FeatureLookupTable(),undefined,undefined,Hierarchy.splitPartEqually),
		PartialClassificationEquallyNoOutput: enhance3(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, undefined),
};

// module.exports.defaultClassifier = module.exports.SvmOutputPartialEqually;
module.exports.defaultClassifier = module.exports.PartialClassificationEqually;
// module.exports.defaultClassifier = module.exports.HomerWinnow;
// module.exports.defaultClassifier = module.exports.SvmPerfClassifier


if (!module.exports.defaultClassifier) throw new Error("Default classifier is null");
