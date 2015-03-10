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
var execSync = require('execSync');
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

function featureExpansion(listoffeatures, scale, phrase)
{
	var listoffeatures = _.unique(listoffeatures)
	// console.log("featureExpansion scale"+scale+ " phrase "+phrase  )
	fs.writeFileSync(__dirname+"/utils/featureexp_input", JSON.stringify(listoffeatures, null, 4), 'utf-8')
	var result = execSync.run("node "+__dirname+"/utils/featureexp.js '"+scale+"' "+phrase);
	var results = JSON.parse(fs.readFileSync(__dirname+"/utils/featureexp_output"))
	
	fs.unlinkSync(__dirname+"/utils/featureexp_input")
	fs.unlinkSync(__dirname+"/utils/featureexp_output")

	console.log("featureExpansion finished")

	// console.log("featureExpansion "+ Object.keys(results).length)
	return results
}

function featureExpansionEmpty(listoffeatures)
{
	return {}
}

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
	// var verbs = truth.verbnegation(sentence.replace('without','no'), truth_filename)
		// }
	// sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
	
	/*_.each(verbs, function(value, key, list){ 
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
	}, this)*/

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
	sentence = regexpNormalizer(sentence)
	sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
	
	sentence = sentence.replace(/<VALUE>/g,'')
	sentence = sentence.replace(/<ATTRIBUTE>/g,'')
	sentence = regexpNormalizer(sentence)
	
	return sentence
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


function featureExtractorUB(sentence, features) {
	var words = tokenizer.tokenize(sentence);
	// var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2, '[start]', '[end]'))
	var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))
	_.each(feature, function(feat, key, list){ features[feat.join(" ")] = 1 }, this)
	return features;
}

function featureExtractorB(sentence, features) {
	var words = tokenizer.tokenize(sentence);
	var feature = natural.NGrams.ngrams(words, 2)
	_.each(feature, function(feat, key, list){ features[feat.join(" ")] = 1 }, this)
	return features;
}

function featureExtractorU(sentence, features) {
	var words = tokenizer.tokenize(sentence);
	var feature = natural.NGrams.ngrams(words, 1)
	_.each(feature, function(feat, key, list){ features[feat.join(" ")] = 1 }, this)
	return features;
}


function featureword2vec(sentence, features) {
	var words = tokenizer.tokenize(sentence);
	var vector = []

	console.log("featureword2vec start "+words.length)

	_.each(words, function(word, key, list){ 
		var result = execSync.exec("node "+__dirname+"/utils/getred.js '" + word + "'");
	
		var output = result['stdout'].replace(/(\r\n|\n|\r)/gm,"");
		output = output.split(",")
		output = _.map(output, function(value){ return parseFloat(value); });
		vector.push(output)
	}, this)

	console.log("featureword2vec stop")
	
	// AVERAGING
	var vectorAveraged = []
	_(vector[0].length).times(function(n){
		var avg = 0
		_.each(vector, function(value, key, list){ 
			avg += value[n]
		}, this)
		vectorAveraged.push(avg/vector.length)
	})

	// FULLFILL THE VECTOR
	_.each(vectorAveraged, function(value, key, list){ 
		features['w2v'+key] = value
	}, this)

	return features
}

/*function featureExtractorBeginEndTruthTeller(sentence, features) {
	
	var sentence = trainutils.truth_sentence(sentence)

	var words = tokenizer.tokenize(sentence);

	var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2, '[start]', '[end]'))
	// var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))

	_.each(feature, function(feat, key, list){
		 features[feat.join(" ")] = 1
	}, this)
	return features;
}
*/

/*function featureExtractor(sentence, features) {

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

*/

function FilterIntents(input)
{
	if ((input.length > 1) && (input.indexOf("Offer") != -1))
		return ['Offer']
	else
		return input
}

function weightInstance1(instance) {
	return 1
}

function weightInstance2(instance) {
	return 1/instance
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
	// learn_args: "-c 100 --i 1",   // see http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html 
	// F1 optimization
	learn_args: "-c 100 -l 1 -w 3",   // see http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html 
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

var kNNClassifier = classifiers.kNN.bind(0, {
	k: 3,
	distanceFunction: 'EuclideanDistance',
	/*EuclideanDistance
	ChebyshevDistance
	ManhattanDistance
	DotDistance
	*/

	distanceWeightening: weightInstance2
	/*1/d - Weight by 1/d distance
	No - no distance weightening*/
});

var kNNClassifier1 = classifiers.kNN.bind(0, {
	k: 3,
	distanceFunction: 'EuclideanDistance',
	distanceWeightening: weightInstance1
});

var kNNBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.bind(0, {
	binaryClassifierType: kNNClassifier,
});

var kNNBinaryRelevanceClassifier1 = classifiers.multilabel.BinaryRelevance.bind(0, {
	binaryClassifierType: kNNClassifier1,
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

var enhance = function (classifierType, featureExtractor, inputSplitter, featureLookupTable, labelLookupTable, InputSplitLabel, OutputSplitLabel, TestSplitLabel, multiplyFeaturesByIDF, featureExpansion, featureExpansionScale, featureExpansionPhrase, featureFine) {
// var enhance = function (classifierType, featureLookupTable, labelLookupTable) {
	return classifiers.EnhancedClassifier.bind(0, {
		normalizer: normalizer,

		inputSplitter: inputSplitter,

		featureExpansion: featureExpansion,
		featureExpansionScale: featureExpansionScale,
		featureExpansionPhrase: featureExpansionPhrase,
		featureFine: featureFine,
		// inputSplitter: inputSplitter,
		// spellChecker: [require('wordsworth').getInstance(), require('wordsworth').getInstance()],

		featureExtractor: featureExtractor,

		featureLookupTable: featureLookupTable,
		labelLookupTable: labelLookupTable,
		
		featureExtractorForClassification: [
			ftrs.Hypernyms(JSON.parse(fs.readFileSync(__dirname + '/knowledgeresources/hypernyms.json'))),
		],

		multiplyFeaturesByIDF: multiplyFeaturesByIDF,

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

var WinnowSegmenterTruth = 
			classifiers.multilabel.BinarySegmentation.bind(0, {
			binaryClassifierType: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUB, undefined,  new ftrs.FeatureLookupTable()),
			segmentSplitStrategy: 'cheapestSegment',
			// strandard: true,
});

var WinnowSegmenter1 = 
			classifiers.multilabel.BinarySegmentation.bind(0, {
			binaryClassifierType: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUB, undefined, new ftrs.FeatureLookupTable()),
			segmentSplitStrategy: 'cheapestSegment',
			// strandard: true,
});

// var WinnowSegmenter2 = 
var WinnowSegmenterBeginEnd = 
			classifiers.multilabel.BinarySegmentation.bind(0, {
			binaryClassifierType: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUB, undefined, new ftrs.FeatureLookupTable()),
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
			featureExtractor: featureExtractorUB,
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
		enhance: enhance,
		tokenizer: tokenizer,
		normalizer: normalizer,
		featureExtractorUB: featureExtractorUB,
		featureExtractorB: featureExtractorB,
		featureExtractorU: featureExtractorU,
		featureword2vec:featureword2vec,
		// featureExtractorUnigram: featureExtractorUnigram,
		instanceFilter: instanceFilterShortString,
		featureExpansion:featureExpansion,
		PartialClassification:PartialClassification,
		SvmPerfBinaryRelevanceClassifier:SvmPerfBinaryRelevanceClassifier,
		featureExpansionEmpty:featureExpansionEmpty,

		WinnowSegmenter: WinnowSegmenterBeginEnd,
		WinnowSegmenterSagae: enhance5(WinnowSegmenterBeginEnd,new ftrs.FeatureLookupTable(),undefined,undefined,trainutils.deal,undefined),
		SvmPerfClassifierIS: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUB, inputSplitter, new ftrs.FeatureLookupTable()),
		SvmPerfClassifier: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUB, undefined/*inputSplitter*/, new ftrs.FeatureLookupTable()),
		HomerWinnow: enhance(homer(WinnowBinaryRelevanceClassifier), featureExtractorUB, true),

		IntentClassificationIDF: enhance(PartialClassification(SvmPerfBinaryRelevanceClassifier), featureExtractorUB, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent, true),
		IntentClassificationBin: enhance(PartialClassification(SvmPerfBinaryRelevanceClassifier), featureExtractorUB, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent, false),

		IntentClassificationExpansion2: enhance(PartialClassification(SvmPerfBinaryRelevanceClassifier), featureExtractorUB, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent, true, featureExpansion, '[2]', 0, false),
		IntentClassificationExpansion11: enhance(PartialClassification(SvmPerfBinaryRelevanceClassifier), featureExtractorUB, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent, true, featureExpansion, '[1,1]', 0, false),
		IntentClassificationExpansion1Phrase: enhance(PartialClassification(SvmPerfBinaryRelevanceClassifier), featureExtractorUB, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent, true, featureExpansion, '[1,1]', 1, false),
		IntentClassificationNoExpansion: enhance(PartialClassification(SvmPerfBinaryRelevanceClassifier), featureExtractorUB, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent, true),
		IntentClassificationExpansion1Fine: enhance(PartialClassification(SvmPerfBinaryRelevanceClassifier), featureExtractorUB, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent, true, featureExpansion, '[1]', 0, true),

		PartialClassificationEqually_Component: enhance(PartialClassification(SvmPerfBinaryRelevanceClassifier), featureExtractorUB, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, undefined,  Hierarchy.splitPartEqually),
		PartialClassificationEquallySagae: enhance5(PartialClassification(WinnowSegmenter1),new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, trainutils.aggregate_rilesbased, undefined),

		kNNClassifier: enhance(kNNBinaryRelevanceClassifier, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, FilterIntents,  Hierarchy.splitPartEquallyIntent, true),
		kNNClassifier1: enhance(kNNBinaryRelevanceClassifier1, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, FilterIntents,  Hierarchy.splitPartEquallyIntent, true),
		kNNClassifierExpansion2: enhance(kNNBinaryRelevanceClassifier, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true, featureExpansion, '[2]', 0, false),
		kNNClassifier_word2vec: enhance(kNNBinaryRelevanceClassifier, featureword2vec, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true),


		IntentNoExpansion_Word2Vec: enhance(SvmPerfBinaryRelevanceClassifier, featureword2vec, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true),
		IntentNoExpansion_unigram: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true),
		IntentNoExpansion_word2vec: enhance(SvmPerfBinaryRelevanceClassifier, featureword2vec, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true),

		IntentExpansion2: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true, featureExpansion, '[2]', 0, false),

};

module.exports.defaultClassifier = module.exports.SvmPerfClassifier

if (!module.exports.defaultClassifier) throw new Error("Default classifier is null");
