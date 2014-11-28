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
var _ = require('underscore')._;
var extend = require('util')._extend;
var fs = require('fs');
var limdu = require("limdu");
var trainutils = require('./utils/bars')
var rules = require("./research/rule-based/rules.js")
var natural = require('natural');

var classifiers = limdu.classifiers;
var ftrs = limdu.features;
var Hierarchy = require(__dirname+'/Hierarchy');

var old_unused_tokenizer = {tokenize: function(sentence) { return sentence.split(/[ \t,;:.!?]/).filter(function(a){return !!a}); }}

var tokenizer = new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9%'$+-]+/});
// var tokenizer = new natural.WordTokenizer({'pattern':(/(\W+|\%)/)}); // WordTokenizer, TreebankWordTokenizer, WordPunctTokenizer
// var ngrams = new natural.NGrams.ngrams()
/*
 * ENHANCEMENTS:
 */

var regexpNormalizer = ftrs.RegexpNormalizer(
		JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json')));

function instanceFilterShortString(datum)
{
	if (_.isString(datum))
	{
		if (datum.trim().split(/\s+/).length < 4)
			return true
	}
	else
	if (datum.input.trim().split(/\s+/).length < 4)
		if (datum.output.length > 0)
			if (datum.output[0].length > 0)
				if (datum.output[0][0] == "Offer")
					{
						// console.log("it's short offer and it's excluded")
						return true
					}
	return false
}

function normalizer1(sentence) {
  	var truth = require("./research/rule-based/truth_utils.js")
  	var truth_filename =  "../truth_teller/sentence_to_truthteller.txt"

	sentence = sentence.toLowerCase().trim();
	sentence = regexpNormalizer(sentence)
	// if ((sentence.indexOf("+")==-1) && (sentence.indexOf("-")==-1))
		// {
		// console.log("verbnegation")
	var verbs = truth.verbnegation(sentence.replace('without','no'), truth_filename)
		// }
	sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
	
	_.each(verbs, function(value, key, list){ 
		if (value['polarity'] == 'P')
			{
			if (sentence.indexOf(value['form']+" ") != -1)
				sentence = sentence.replace(value['form']+" ", value['form']+"+ ")
			else
				sentence = sentence.replace(" "+value['form'], " "+value['form']+"+")
			}
		else
			{
			if (sentence.indexOf(value['form']+" ") != -1)
				sentence = sentence.replace(value['form']+" ", value['form']+"- ")
			else
				sentence = sentence.replace(" "+value['form'], " "+value['form']+"-")
			}
	}, this)

	sentence = sentence.replace(/<VALUE>/g,'')
	sentence = sentence.replace(/<ATTRIBUTE>/g,'')
	sentence = sentence.trim()
	// console.log("normalized")
	// console.log(sentence)
	// sentence = sentence.replace(/\s+/g,' ')
	return sentence
}

function normalizer(sentence) {
	sentence = sentence.toLowerCase().trim();
	return regexpNormalizer(sentence)
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


function featureExtractorUnigram(sentence, features) {
	var words = tokenizer.tokenize(sentence);

	var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))

	_.each(feature, function(feat, key, list){
		 features[feat.join(" ")] = 1
	}, this)

	return features;
}

function featureExtractorBeginEnd(sentence, features) {
	var words = tokenizer.tokenize(sentence);

	var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2, '[start]', '[end]'))
	// var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))

	_.each(feature, function(feat, key, list){
		 features[feat.join(" ")] = 1
	}, this)
	return features;
}


function featureExtractorBeginEndTruthTeller(sentence, features) {
	
	var sentence = trainutils.truth_sentence(sentence)

	var words = tokenizer.tokenize(sentence);

	var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2, '[start]', '[end]'))
	// var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))

	_.each(feature, function(feat, key, list){
		 features[feat.join(" ")] = 1
	}, this)
	return features;
}


function featureExtractorTruth(sentence, features) {
	var sentence = trainutils.truth_sentence(sentence)

	var words = tokenizer.tokenize(sentence);

	// var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2, '[start]', '[end]'))
	var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))

	_.each(feature, function(feat, key, list){
		 features[feat.join(" ")] = 1
	}, this)

	delete features['\'start\'']
	delete features['\'end\'']
	return features
}

function featureExtractor(sentence, features) {

	// console.log("+++++++++++++++++++++++++")
	// console.log(sentence)
	// console.log("featuresEx")
	// console.log(sentence)

	var original = sentence

	sentence = sentence.replace("['end']",'')
	sentence = sentence.replace("['start']",'')
	sentence = sentence.replace("a <value>",'')
	sentence = sentence.replace("a <attribute>",'')
	sentence = sentence.replace("<value>",'')
	sentence = sentence.replace("<attribute>",'')
	// for some reason it was not enough to eliminate <attribute> and <value> 
	sentence = sentence.replace("value",'')
	sentence = sentence.replace("attribute",'')
	sentence = sentence.replace("\,/g",'')
	sentence = sentence.trim()
	// sentence = sentence.replace(/\s+/g,' ')

	// console.log(sentence)
	var words = tokenizer.tokenize(sentence);

	// console.log(words)

	// var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2, '[start]', '[end]'))
	var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))

	_.each(feature, function(feat, key, list){
		 features[feat.join(" ")] = 1
	}, this)

	// if (original.indexOf("attribute") != -1)
		// features["attribute_present"] = 1

	// if (original.indexOf("value") != -1)
		// features["value_present"] = 1

	if ((original.indexOf("value") != -1) || (original.indexOf("value")!=-1))
		features["value_or_attribute_present"] = 1

	if (original.indexOf("?") != -1)
		features["?_sign"] = 1

	var question_words = ['what', 'which', 'why', 'how', 'do']

	// if (original.substring(0,2) == 'do')
		// features["do_at_start"] = 1

	if (_.some(question_words, function(num){return original.substring(0,num.length) == num}))
		features["wh_word_at_start"] = 1

	if (_.some(question_words, function(num){return original.indexOf(num) != -1}))
		features["wh_word"] = 1


	// console.log(features)

	// delete features['\'ATTRIBUTE\'']
	// delete features['\'ATTRIBUTE\'']

	// delete features['\'start\'']
	// delete features['\'end\'']


	// if ((sentence.toLowerCase().indexOf("no car")!=-1)||
	// 	(sentence.toLowerCase().indexOf("no leased")!=-1)||
	// 	(sentence.toLowerCase().indexOf("without car")!=-1)||
	// 	(sentence.toLowerCase().indexOf("without leased")!=-1)
	// 	)
	// 	features["@noleased"] = 1 

	// if ((sentence.toLowerCase().indexOf("no pension")!=-1))
	// 	features["@nopension"] = 1 

	// if 	((sentence.toLowerCase().indexOf("not ")!=-1)||
		// (sentence.toLowerCase().indexOf("no ")!=-1))
		// features["@negation"] = 1 


	// lis = trainutils.retrievelabels()

	// sentence = sentence.replace(/[\,,\.]/,"");
	// _.each(lis, function(value, key, list){ 
		// if (sentence.toLowerCase().indexOf(value)!=-1)
			// features["@"+value+"_similarity"] = 1 
	// }, this)
// 
	return features;
}


function featureExtractorLemma(sentence, features) {
	var words = trainutils.sentenceStem(sentence)
	ftrs.NGramsFromArray(1, 0, words, features);  // unigrams
	ftrs.NGramsFromArray(2, 0, words, features);  // unigrams
	return features;
}

function featureExtractorWords(sentence, features) {
	features = ftrs.call(ftrs.NGramsOfWords(1), sentence)
	features = _.extend(features, ftrs.call(ftrs.NGramsOfWords(2), sentence))
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

// var RulebasedClassifier = classifiers.multilabel.Rulebased.bind(0, {
// 	// ngram_length: 2,
// 	// iterations: 2000
// });

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

//  var enhance5is = function (classifierType, featureLookupTable, labelLookupTable, InputSplitLabel, OutputSplitLabel, TestSplitLabel) {
// 	return classifiers.EnhancedClassifier.bind(0, {
// 		normalizer: normalizer,
// 		inputSplitter: inputSplitter,

// 		classifierType: classifierType,

// 		InputSplitLabel: InputSplitLabel,
// 		OutputSplitLabel: OutputSplitLabel,
// 		TestSplitLabel: TestSplitLabel
// 	});
// };

 var enhance5 = function (classifierType, featureLookupTable, labelLookupTable, InputSplitLabel, OutputSplitLabel, TestSplitLabel) {
	return classifiers.EnhancedClassifier.bind(0, {
		normalizer: normalizer1,
		classifierType: classifierType,
		// filter only external classifier data
		instanceFilter: instanceFilterShortString,
		InputSplitLabel: InputSplitLabel,
		OutputSplitLabel: OutputSplitLabel,
		TestSplitLabel: TestSplitLabel
	});
};

/*
 * CONSTRUCTORS:
 */

// var enhancesagae = function (classifierType, featureExtractor, featureLookupTable, labelLookupTable, InputSplitLabel, OutputSplitLabel, TestSplitLabel) {
// 	return classifiers.EnhancedClassifier.bind(0, {
// 		normalizer: normalizer,

// 		// inputSplitter: inputSplitter,
// 		// inputSplitter: IS,
// 		// spellChecker: [require('wordsworth').getInstance(), require('wordsworth').getInstance()],

// 		featureExtractor: featureExtractor,
		
// 		featureLookupTable: featureLookupTable,
// 		labelLookupTable: labelLookupTable,
		
// 		featureExtractorForClassification: [
// 			ftrs.Hypernyms(JSON.parse(fs.readFileSync(__dirname + '/knowledgeresources/hypernyms.json'))),
// 		],

// 		multiplyFeaturesByIDF: true,
// 		//minFeatureDocumentFrequency: 2,
// 		pastTrainingSamples: [], // to enable retraining
// 		classifierType: classifierType,

// 		InputSplitLabel: InputSplitLabel,
// 		OutputSplitLabel: OutputSplitLabel,
// 		TestSplitLabel: TestSplitLabel
// 	});
// };

// var enhance2 = function (classifierType, TestSplitLabel) {
// 	return classifiers.EnhancedClassifier.bind(0, {
// 		normalizer: normalizer,
// 		inputSplitter: inputSplitter,
// 		pastTrainingSamples: [], // to enable retraining
// 		classifierType: classifierType,
// 		TestSplitLabel: TestSplitLabel
// 	});
// };



var enhance = function (classifierType, featureExtractor, inputSplitter, featureLookupTable, labelLookupTable, InputSplitLabel, OutputSplitLabel, TestSplitLabel) {
// var enhance = function (classifierType, featureLookupTable, labelLookupTable) {
	return classifiers.EnhancedClassifier.bind(0, {
		normalizer: normalizer,

		inputSplitter: inputSplitter,
		// inputSplitter: inputSplitter,
		// spellChecker: [require('wordsworth').getInstance(), require('wordsworth').getInstance()],

		featureExtractor: featureExtractor,

		featureLookupTable: featureLookupTable,
		labelLookupTable: labelLookupTable,
		
		featureExtractorForClassification: [
			ftrs.Hypernyms(JSON.parse(fs.readFileSync(__dirname + '/knowledgeresources/hypernyms.json'))),
		],

		multiplyFeaturesByIDF: true,

		TfIdfImpl: natural.TfIdf,

		tokenizer: new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9%'$,]+/}),

		//minFeatureDocumentFrequency: 2,

		pastTrainingSamples: [], // to enable retraining
			
		classifierType: classifierType,

		InputSplitLabel: InputSplitLabel,
		OutputSplitLabel: OutputSplitLabel,
		TestSplitLabel: TestSplitLabel
	});
};
// var enhanceis = function (classifierType, featureLookupTable, labelLookupTable, InputSplitLabel, OutputSplitLabel, TestSplitLabel) {
// // var enhance = function (classifierType, featureLookupTable, labelLookupTable) {
// 	return classifiers.EnhancedClassifier.bind(0, {
// 		normalizer: normalizer,
// 		inputSplitter: inputSplitter,
// 		// spellChecker: [require('wordsworth').getInstance(), require('wordsworth').getInstance()],
// 		featureExtractor: featureExtractor,
// 		// featureExtractor: featureExtractor,

// 		featureLookupTable: featureLookupTable,
// 		labelLookupTable: labelLookupTable,
		
// 		featureExtractorForClassification: [
// 			ftrs.Hypernyms(JSON.parse(fs.readFileSync(__dirname + '/knowledgeresources/hypernyms.json'))),
// 		],

// 		multiplyFeaturesByIDF: true,
// 		//minFeatureDocumentFrequency: 2,

// 		pastTrainingSamples: [], // to enable retraining
			
// 		classifierType: classifierType,

// 		InputSplitLabel: InputSplitLabel,
// 		OutputSplitLabel: OutputSplitLabel,
// 		TestSplitLabel: TestSplitLabel
// 	});
// };
// var WinnowSegmenter3 = 
var WinnowSegmenterTruth = 
			classifiers.multilabel.BinarySegmentation.bind(0, {
			binaryClassifierType: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorTruth, undefined,  new ftrs.FeatureLookupTable()),
			segmentSplitStrategy: 'cheapestSegment',
			// strandard: true,
});

var WinnowSegmenter1 = 
			classifiers.multilabel.BinarySegmentation.bind(0, {
			binaryClassifierType: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractor, undefined, new ftrs.FeatureLookupTable()),
			segmentSplitStrategy: 'cheapestSegment',
			// strandard: true,
});

// var WinnowSegmenter2 = 
var WinnowSegmenterBeginEnd = 
			classifiers.multilabel.BinarySegmentation.bind(0, {
			binaryClassifierType: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorBeginEnd, undefined, new ftrs.FeatureLookupTable()),
			segmentSplitStrategy: 'cheapestSegment',
			// strandard: false,
});

var BayesSegmenter = classifiers.EnhancedClassifier.bind(0, {
		normalizer: normalizer,
		inputSplitter: inputSplitter,
		pastTrainingSamples: [], // to enable retraining

		classifierType: classifiers.multilabel.MulticlassSegmentation.bind(0, {
			multiclassClassifierType: classifiers.Bayesian.bind(0, {
				calculateRelativeProbabilities: true,
			}),
			// multiclassClassifierType: enhance(SvmPerfBinaryRelevanceClassifier, new ftrs.FeatureLookupTable()),
			featureExtractor: featureExtractor,
		}),
});

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

		/* the set of routines for tests*/
		tokenizer: tokenizer,
		normalizer: normalizer,
		featureExtractor: featureExtractor,
		featureExtractorUnigram: featureExtractorUnigram,
		instanceFilter: instanceFilterShortString,

		WinnowSegmenter: WinnowSegmenterBeginEnd,

		WinnowSegmenterSagae: enhance5(WinnowSegmenterBeginEnd,new ftrs.FeatureLookupTable(),undefined,undefined,trainutils.deal,undefined),
 // var enhance5 = function (classifierType, featureLookupTable, labelLookupTable, InputSplitLabel, OutputSplitLabel, TestSplitLabel) {


		// WinnowSegmenterStd: WinnowSegmenter5,

		// HomerAdaboostClassifier: enhance2(homer(AdaboostClassifier)), 
		// AdaboostClassifier: enhance2(AdaboostClassifier), 

		// RulebasedClassifier: enhance2(RulebasedClassifier, Hierarchy.splitPartEquallyIntent),

		// WinnowClassifier: enhance(WinnowBinaryRelevanceClassifier),
		// BayesClassifier: enhance(BayesBinaryRelevanceClassifier),

		SvmPerfClassifierIS: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorBeginEnd, inputSplitter, new ftrs.FeatureLookupTable()),

		SvmPerfClassifier: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorBeginEnd, undefined/*inputSplitter*/, new ftrs.FeatureLookupTable()),
		// SvmPerfClassifierTruth: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorBeginEndTruthTeller, new ftrs.FeatureLookupTable()),
		
		// SvmPerfClassifierNoIS: enhancenois(SvmPerfBinaryRelevanceClassifier, new ftrs.FeatureLookupTable()),
		// SvmPerfClassifierSimilarity: enhancesim(SvmPerfBinaryRelevanceClassifier, new ftrs.FeatureLookupTable()),
		// SvmPerfClassifierLematization: enhancelemma(SvmPerfBinaryRelevanceClassifier, new ftrs.FeatureLookupTable()),
		// SvmPerfClassifierSpell: enhancespell(SvmPerfBinaryRelevanceClassifier, new ftrs.FeatureLookupTable()),

		// SvmLinearClassifier: enhance(SvmLinearBinaryRelevanceClassifier, new ftrs.FeatureLookupTable()),
		
		// PassiveAggressiveClassifier: enhance(PassiveAggressiveClassifier),

		// MetaLabelerWinnow: enhance(metalabeler(WinnowBinaryRelevanceClassifier)),
		// MetaLabelerSvmPerf: enhance(metalabeler(SvmPerfBinaryRelevanceClassifier), new ftrs.FeatureLookupTable()),
		// MetaLabelerSvmLinear: enhance(metalabeler(SvmLinearBinaryRelevanceClassifier), new ftrs.FeatureLookupTable()),
		// MetaLabelerPassiveAggressive: enhance(metalabeler(PassiveAggressiveClassifier)),
		// MetaLabelerPassiveAggressiveSvm: enhance((metalabeler(PassiveAggressiveClassifier,SvmLinearMulticlassifier)), new ftrs.FeatureLookupTable()),
		// MetaLabelerLanguageModelWinnow: enhance(metalabeler(LanguageModelClassifier,WinnowBinaryRelevanceClassifier)),
		// MetaLabelerLanguageModelSvm: enhance(metalabeler(LanguageModelClassifier,SvmLinearMulticlassifier)),

		// HomerSvmPerf: enhance(homer(SvmPerfBinaryRelevanceClassifier), new ftrs.FeatureLookupTable()),
		// HomerSvmLinear: enhance(homer(SvmLinearBinaryRelevanceClassifier), new ftrs.FeatureLookupTable()),
		HomerWinnow: enhance(homer(WinnowBinaryRelevanceClassifier), featureExtractorBeginEnd. true),
		// HomerWinnowNoSpell: enhancenospell(homer(WinnowBinaryRelevanceClassifier)),

		// HomerPassiveAggressive: enhance(homer(PassiveAggressiveClassifier)),

		// HomerMetaLabelerWinnow: enhance(homer(metalabeler(WinnowBinaryRelevanceClassifier))),
		// HomerMetaLabelerSvmPerf: enhance(homer(metalabeler(SvmPerfBinaryRelevanceClassifier,SvmLinearMulticlassifier)), new ftrs.FeatureLookupTable()),
		// HomerMetaLabelerSvmLinear: enhance(homer(metalabeler(SvmLinearBinaryRelevanceClassifier,SvmLinearMulticlassifier)), new ftrs.FeatureLookupTable()),
		// HomerMetaLabelerPassiveAggressive: enhance(homer(metalabeler(PassiveAggressiveClassifier))),
		// HomerMetaLabelerPassiveAggressiveWithMulticlassSvm: enhance(homer(metalabeler(PassiveAggressiveClassifier,SvmLinearMulticlassifier)), new ftrs.FeatureLookupTable()),

		// ThresholdClassifierLanguageModelWinnow: enhance(thresholdclassifier(LanguageModelClassifier)),
		
		// PartialClassificationWinnowEqually: enhance3(PartialClassification(WinnowBinaryRelevanceClassifier),undefined,undefined,Hierarchy.splitPartEqually, Hierarchy.splitPartEqually),
		// construct labels according to the rules of location of positive features
		// PartialClassificationEquallyPlace: enhance3(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.OrderLabelJoin,  Hierarchy.splitPartEqually),

		// PartialClassificationEquallyPlace: enhance3(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.OrderLabelJoin,  undefined),
		// at the input separate the labels to intent/attribute/value then join them in greedy approach
		// PartialClassificationEquallyGreedy: enhance3(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_label),
		// PartialClassificationEquallyGreedyNoISTrick: enhancenois(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_label_trick),
		// PartialClassificationEquallyGreedyISNoTrick: enhanceis(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_label_no_trick),

		// PartialClassificationEquallyGreedyTrick: enhance3(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_label_trick),

		// separate to intent/attribute/value then retrieve just intent and test only on intent
		PartialClassificationEquallyIntent: enhance(PartialClassification(SvmPerfBinaryRelevanceClassifier), featureExtractorBeginEnd, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent),
		// PartialClassificationEquallyNoIS: enhancenois(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, undefined,  Hierarchy.splitPartEqually),
	 	// PartialClassificationEquallyIS: enhanceis(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, undefined,  Hierarchy.splitPartEqually),

	 	// svm train on the standard labels then on output separate labels
	 	// SvmOutputPartialEqually_Component: enhance3(SvmPerfBinaryRelevanceClassifier,new ftrs.FeatureLookupTable(), undefined, undefined,  Hierarchy.splitPartEqually, Hierarchy.splitPartEqually),

		PartialClassificationEqually_Component: enhance(PartialClassification(SvmPerfBinaryRelevanceClassifier), featureExtractorBeginEnd, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, undefined,  Hierarchy.splitPartEqually),
	 	// SvmOutputPartialEqually_Composite: enhance(SvmPerfBinaryRelevanceClassifier,new ftrs.FeatureLookupTable(), undefined, undefined,  Hierarchy.splitPartEqually, Hierarchy.splitPartEqually),
	 	// SvmOutputPartialEquallyNoIS: enhancenois(SvmPerfBinaryRelevanceClassifier,new ftrs.FeatureLookupTable(), undefined, undefined,  Hierarchy.splitPartEqually, Hierarchy.splitPartEqually),

	 	// PartialClassificationAttValIS: enhanceis(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartVersion2, undefined,  Hierarchy.splitPartVersion2),
	 	// PartialClassificationAttVal: enhance3(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartVersion2, undefined,  Hierarchy.splitPartVersion2),
	 	// SvmOutputPartialAttVal: enhanceis(SvmPerfBinaryRelevanceClassifier,new ftrs.FeatureLookupTable(),undefined, undefined, Hierarchy.splitPartVersion2,  Hierarchy.splitPartVersion2),

		// PartialClassificationJustTwo: enhance3(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartVersion2, Hierarchy.splitPartVersion2),
		// SvmPerfClassifierPartial: enhance3(SvmPerfBinaryRelevanceClassifier, new ftrs.FeatureLookupTable(),undefined,undefined,Hierarchy.splitPartEqually),
		// PartialClassificationEquallyNoOutput: enhance3(PartialClassification(SvmPerfBinaryRelevanceClassifier),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, undefined),

		// CompositeSagaeSeparation: enhance5(WinnowSegmenter1, undefined, undefined, undefined, Hierarchy.splitPartEqually, Hierarchy.splitPartEqually),

		// SagaeIntent: enhance5(PartialClassification(WinnowSegmenter1),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_rilesbased,  undefined),
		// SagaeIntent: enhance5(PartialClassification(WinnowSegmenter1),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_sagae_completition, undefined),
		// PartialClassificationEquallySagae: enhance5(PartialClassification(WinnowSegmenter1),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_sagae_completition, undefined),
		PartialClassificationEquallySagae: enhance5(PartialClassification(WinnowSegmenter1),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_rilesbased, undefined),
		
		// PartialClassificationEquallySagaeTruth: enhance5(PartialClassification(WinnowSegmenter3),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_sagae_completition, undefined),
		

		// PartialClassificationEquallySagaeIS: enhance5is(PartialClassification(WinnowSegmenter1),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_sagae_completition, undefined),
		// PartialClassificationEquallySagaeNoCompletion: enhance5(PartialClassification(WinnowSegmenter1),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_sagae_no_completition, undefined),
		
		// PartialClassificationEquallySagaeNegation: enhance5(PartialClassification(WinnowSegmenter5),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually1, trainutils.aggregate_sagae, undefined),
		// PartialClassificationEquallySagaeImp: enhance5(PartialClassification(WinnowSegmenter2),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_sagae_improved, undefined),
		// PartialClassificationEquallySagaeNoCompletition: enhance5(PartialClassification(WinnowSegmenter2),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_sagae_no_completition, undefined),
		// PartialClassificationEquallySagaeNospell: enhance5nospell(PartialClassification(WinnowSegmenter2),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_sagae_completition, undefined),

};

// module.exports.defaultClassifier = module.exports.SvmOutputPartialEqually;
// module.exports.defaultClassifier = module.exports.PartialClassificationEquallyPlace;
// module.exports.defaultClassifier = module.exports.HomerWinnow;
module.exports.defaultClassifier = module.exports.SvmPerfClassifier
// module.exports.defaultClassifier = module.exports.PartialClassificationEquallyGreedyISTrick
// module.exports.defaultClassifier = module.exports.RulebasedClassifier
// module.exports.defaultClassifier = module.exports.PartialClassificationEquallyGreedyTrick
// module.exports.defaultClassifier = module.exports.SvmPerfClassifier

if (!module.exports.defaultClassifier) throw new Error("Default classifier is null");
