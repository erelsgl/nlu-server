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
var distance = require('./utils/distance')
var rules = require("./research/rule-based/rules.js")
var natural = require('natural');
var execSync = require('execSync');
var classifiers = limdu.classifiers;
var ftrs = limdu.features;
var Hierarchy = require(__dirname+'/Hierarchy');
var bars = require('./utils/bars')
var distance = require('./utils/distance.js')

var old_unused_tokenizer = {tokenize: function(sentence) { return sentence.split(/[ \t,;:.!?]/).filter(function(a){return !!a}); }}

var tokenizer = new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9\-]+/});
// var tokenizer = new natural.WordTokenizer({'pattern':(/(\W+|\%)/)}); // WordTokenizer, TreebankWordTokenizer, WordPunctTokenizer
// var ngrams = new natural.NGrams.ngrams()
/*
 * ENHANCEMENTS:
 */

var regexpNormalizer = ftrs.RegexpNormalizer(
		JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json')));

var regexpNormalizer_simple = ftrs.RegexpNormalizer(
		JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/SimpleNormalizations.json')));


var expansionParam1 = 
{
	'redisId_words':14,
	'redisId_context':13,
	'comparison': distance.Add,
	'redis_exec': redis_exec,
	'wordnet_exec': wordnet_exec,
	'context': true,
	'wordnet_relation':'syn'
}

var expansionParam2 = 
{
	'redisId_words':14,
	'redisId_context':13,
	'comparison': distance.Add,
	'redis_exec': redis_exec,
	'wordnet_exec': wordnet_exec,
	'context': true,
	'wordnet_relation':'all'
}

var expansionParam3 = 
{
	'redisId_words':14,
	'redisId_context':13,
	'comparison': distance.BalAdd,
	'redis_exec': redis_exec,
	'wordnet_exec': wordnet_exec,
	'context': true,
	'wordnet_relation':'all'
}

var expansionParamnoCo = 
{
	'redisId_words':14,
	'redisId_context':13,
	'comparison': distance.cosine_distance,
	'redis_exec': redis_exec,
	'wordnet_exec': wordnet_exec,
	'context': false,
	'wordnet_relation':'all'
}

function redis_exec(data, db, redis_buffer)
	{
		if (data.length == 0)
			return []

		var redis_path = './utils/getred.js'
		var buffer_path = './redis_buffer.json'
		
		if (Object.keys(redis_buffer) == 0)
		{
			var files = fs.readdirSync("./")
			var files = _.filter(files, function(num){ return !_.isNull(num.match(/redis_buffer/g)) });

			_.each(files, function(file, key, list){ 
				var redis_buffer_sub = JSON.parse(fs.readFileSync("./"+file,'UTF-8'))

				_.each(redis_buffer_sub, function(value, key1, list){ 
					redis_buffer[key1] = value
				}, this)
			}, this)
		}

		if (!(db in redis_buffer))
			redis_buffer[db] = {}

		var data_reduced = []
		_.each(data, function(value, key, list){ 
			if (!(value in redis_buffer[db]))
				data_reduced.push(value)
		}, this)

		// var data_reduced_cmd = _.map(data_reduced, function(value){ return value.replace(/\`/g,'\\`') })

		if (data_reduced.length > 0)
		{
			var cmd = "node " + redis_path + " " + JSON.stringify(data_reduced).replace(/[\[\]]/g, ' ').replace(/\"\,\"/g,'" "') + " " + db
			console.log(cmd)
			// result is hash
			var result = JSON.parse(execSync.exec(cmd)['stdout'])

			_.each(result, function(value, key, list){ 
				// this.redis_buffer[db][key] = {'data': value, 'count':0}
				redis_buffer[db][key] = value
			}, this)

			if (_.random(0,50) == 5)
			{
				console.log("redis writing buffer ...")
				
            	// fs.writeFileSync(buffer_path, JSON.stringify(redis_buffer, null, 4))

            	var buffer_splited = _.groupBy(Object.keys(redis_buffer), function(element, index){
        			return index%3;
			 	})

				_.each(_.toArray(buffer_splited), function(data, key, list){
					var buffer_to_write = {}
					_.each(data, function(value, key1, list){ 
						buffer_to_write[value] = redis_buffer[value]
					}, this)
				    console.log("writing "+key)
				    fs.writeFileSync('./redis_buffer.'+key+".json", JSON.stringify(buffer_to_write, null, 4))
				}, this)
        	}
		}

		var data_result = []
		_.each(data, function(value, key, list){ 

			if (!(value in redis_buffer[db]))
				{
				console.log(value+' was not found in redis buffer')	
				data_result.push([])
				}
			else
				data_result.push(redis_buffer[db][value])
		}, this)

		return data_result

}

function wordnet_exec(word, pos, relation, wordnet_buffer)
{
	var wordnet_path = './utils/getwordnet.js'
	var buffer_path = './wordnet_buffer.json'

	if (Object.keys(wordnet_buffer) == 0)
	{
		var wordnet_buffer_sub = JSON.parse(fs.readFileSync(buffer_path,'UTF-8'))
		_.each(wordnet_buffer_sub, function(value, key, list){ 
			wordnet_buffer[key] = value
		}, this)
	}

	if (!(relation in wordnet_buffer))
		wordnet_buffer[relation] = {}

	if (!(word in wordnet_buffer[relation]))
		wordnet_buffer[relation][word] = {}

	if (!(pos in wordnet_buffer[relation][word]))
		{
		var cmd =  "node " + wordnet_path + " \"" + word + "\" " + pos + " " + relation
		console.log(cmd)
		var candidates = JSON.parse(execSync.exec(cmd)['stdout'])
		wordnet_buffer[relation][word][pos] = candidates	
		

		if (_.random(0, 7) == 5)
		{
		console.log("wordnet writing buffer ...")
	    fs.writeFileSync(buffer_path, JSON.stringify(wordnet_buffer, null, 4))
    	}
    }

    return 	wordnet_buffer[relation][word][pos]
}

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
	

// in short text classification, text somethins is several sentences

// KELSEY-HAYES CANADA LTD <KEL.TO> NINE MTHS NET
// kelsey hayes canada ltd lt kel to nine mths net

// CONVERGENT SOLUTIONS INC <CSOL.O> 2ND QTR NET
// convergent solutions inc lt csol o 2nd qtr net

	
	// sentence = sentence.toLowerCase().trim();

	// sentence = regexpNormalizer(sentence)
	// sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
	
	// sentence = sentence.replace(/[\<,\>]/g,' ')
	// sentence = sentence.replace(/\n/g,' ')
	
	// sentence = sentence.replace(/<ATTRIBUTE>/g,'')
	// sentence = regexpNormalizer_simple(sentence)
	
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

	var corp = sentence.match(/\<\w*\.*\w*\>/g)
	var sentence = sentence.replace(/\<\w*\.*\w*\>/g," ")

	var words = tokenizer.tokenize(sentence);

	var feature = natural.NGrams.ngrams(words, 1)
	_.each(feature, function(feat, key, list){ 
		// if (!bars.isstopword(feat.join(" ")))
			features[feat.join(" ")] = 1 } 
		,this)

	_.each(corp, function(co, key, list){ 
		features[co] = 1
	}, this)

	return features;
}

function featureExtractorUCoreNLP(sentence, features) {

	_.each(sentence['CORENLP']['sentences'], function(sen, key, list){ 
		_.each(sen['tokens'], function(value, key, list){
			if ('lemma' in value)
				// if (['ORGANIZATION', 'DATE', 'NUMBER'].indexOf(value['ner']) == -1)
					features[value['lemma'].toLowerCase()] = 1 
			else
				throw new Error("where is lemma '"+value);

		}, this)
	}, this)

	return features;
}

function featureword2vec(sentence, features) {
	var words = tokenizer.tokenize(sentence);
	var vector = []

	console.log("featureword2vec start "+words.length)

	var params = words.join(" ")
	
	console.log(params)

	var result = execSync.exec("node "+__dirname+"/utils/getred.js " + params)

	result = JSON.parse(result['stdout'])

	console.log("featureword2vec stop")
	
	var result = _.filter(result, function(num){ return num.length != 0 });

	var sumvec = []

	_(result[0].length).times(function(n){sumvec.push(0)})

	_.each(result, function(value, key, list){ 
		sumvec = bars.vectorsum(sumvec, value)
	}, this)

	var sumvec = _.map(sumvec, function(value){ return value/result.length })

	// FULLFILL THE VECTOR
	_.each(sumvec, function(value, key, list){ 
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


var SvmPerfMultiClassifier = classifiers.SvmPerf_multi.bind(0, {
	// learn_args: "-c 100 --i 1",   // see http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html 
	// F1 optimization
	learn_args: "-c 100 -w 3",   // see http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html 
	model_file_prefix: "trainedClassifiers/tempfiles/SvmPerf_multi",
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

function weightInstance1(instance) {
	return 1
}

function weightInstance2(instance) {
	return 1/instance
}

/*EuclideanDistance
	ChebyshevDistance
	ManhattanDistance
	AndDistance
	DotDistance
	*/

var kNNClassifierAnd = classifiers.kNN.bind(0, {
	k: 1,
	mode: 'binary',
	distanceFunctionList: [distance.and_distance],
	distanceWeightening: weightInstance1
});

var kNNClassifierEuc = classifiers.kNN.bind(0, {
	k: 1,
	mode: 'binary',
	distanceFunctionList: [distance.euclidean_distance],
	distanceWeightening: weightInstance1
});

var kNNClassifierCosMulti = classifiers.kNN.bind(0, {
	k: 1,
	mode: 'multi',
	distanceFunctionList: [distance.cosine_distance],
	distanceWeightening: weightInstance1
});

var kNNClassifierCosBinary = classifiers.kNN.bind(0, {
	k: 1,
	mode: 'binary',
	distanceFunctionList: [distance.cosine_distance],
	distanceWeightening: weightInstance1
});

var kNNBRAnd = classifiers.multilabel.BinaryRelevance.bind(0, {
	binaryClassifierType: kNNClassifierAnd,
});

var kNNBREuc = classifiers.multilabel.BinaryRelevance.bind(0, {
	binaryClassifierType: kNNClassifierEuc,
});

var kNNBRCos = classifiers.multilabel.BinaryRelevance.bind(0, {
	binaryClassifierType: kNNClassifierCosBinary,
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

var enhance = function (classifierType, featureExtractor, inputSplitter, featureLookupTable, labelLookupTable, InputSplitLabel, OutputSplitLabel, TestSplitLabel, multiplyFeaturesByIDF, featureExpansion, featureExpansionScale, featureExpansionPhrase, featureFine, expansionParam) {
// var enhance = function (classifierType, featureLookupTable, labelLookupTable) {
	return classifiers.EnhancedClassifier.bind(0, {
		normalizer: normalizer,

		inputSplitter: inputSplitter,

		featureExpansion: featureExpansion,
		featureExpansionScale: featureExpansionScale,
		featureExpansionPhrase: featureExpansionPhrase,
		featureFine: featureFine,
		expansionParam: expansionParam,
		stopwords: JSON.parse(fs.readFileSync(__dirname+'/stopwords.txt', 'UTF-8')),
		
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

		kNN: enhance(kNNBRAnd, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true),
		kNN_And: enhance(kNNBRAnd, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true),
		kNN_Euc: enhance(kNNBREuc, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true),
		kNN_Cos: enhance(kNNBRCos, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true),
		
		kNN_Cos_0: enhance(kNNBRCos, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true, featureExpansion, '[0]', 0, false),
		kNN_Cos_1: enhance(kNNBRCos, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true, featureExpansion, '[1]', 0, false),
		kNN_Cos_2: enhance(kNNBRCos, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true, featureExpansion, '[2]', 0, false),
		kNN_Cos_3: enhance(kNNBRCos, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true, featureExpansion, '[3]', 0, false),
		
		kNNnoBR: enhance(kNNClassifierCosMulti, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true),
		
		kNN_word2vec: enhance(kNNBRCos, featureword2vec, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true),
		SVM_unigram: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true),
		SVM_word2vec: enhance(SvmPerfBinaryRelevanceClassifier, featureword2vec, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true),
		SVM_word2vec_unigram: enhance(SvmPerfBinaryRelevanceClassifier, [featureword2vec, featureExtractorU], undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true),

		SVM: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUB, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true),
		SVM_Expansion: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUB, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEquallyIntent, undefined,  Hierarchy.splitPartEquallyIntent, true, featureExpansion, '[2]', 0, false),

		// Reuter: enhance(SvmPerfMultiClassifier, featureExtractorU, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false),
		ReuterBinExpSyn: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUCoreNLP, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, expansionParam1),
		ReuterBinExpSynHyperHypo: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUCoreNLP, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, expansionParam2),
		ReuterBinExpSynHyperHypoBal: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUCoreNLP, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, expansionParam3),
		ReuterBinExpSynHyperHypoNoContext: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUCoreNLP, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, expansionParamnoCo),
		ReuterBin: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUCoreNLP, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, undefined),

};


module.exports.defaultClassifier = module.exports.SvmPerfClassifier

if (!module.exports.defaultClassifier) throw new Error("Default classifier is null");
