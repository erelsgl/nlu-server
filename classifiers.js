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
var classifiers = limdu.classifiers;
var ftrs = limdu.features;
var Hierarchy = require(__dirname+'/Hierarchy');
var bars = require('./utils/bars')
var distance = require('./utils/distance.js')
var execSync = require('child_process').execSync
var async_adapter = require('./utils/async_adapter')


// var async_adapter = require('./utils/async_adapter.js')
var async = require('async');

var old_unused_tokenizer = {tokenize: function(sentence) { return sentence.split(/[ \t,;:.!?]/).filter(function(a){return !!a}); }}

var tokenizer = new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9\-]+/});
// var tokenizer = new natural.WordTokenizer({'pattern':(/(\W+|\%)/)}); // WordTokenizer, TreebankWordTokenizer, WordPunctTokenizer
// var ngrams = new natural.NGrams.ngrams()
/*
 * ENHANCEMENTS:
 */

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

/*var rule = function (classifierType, featureExtractor, featureLookupTable, labelLookupTable, multiplyFeaturesByIDF) {
	return classifiers.multilabel.Rulebased.bind(0, {
		ClassifierType:  classifiers.EnhancedClassifier.bind(0, {
			// normalizer: function normalizer(sentence){return sentence},
			// normalizer: function normalizer(sentence){return sentence},
			featureExtractor: featureExtractor,
			featureLookupTable: featureLookupTable,
			labelLookupTable: labelLookupTable,
			multiplyFeaturesByIDF: multiplyFeaturesByIDF,
			TfIdfImpl: natural.TfIdf,		
			classifierType: classifierType})
	})
}
*/
var enhance = function (classifierType, featureExtractor, inputSplitter, featureLookupTable, labelLookupTable, preProcessor, postProcessor, TestSplitLabel, multiplyFeaturesByIDF, featureExpansion, featureExpansionScale, featureExpansionPhrase, featureFine, expansionParam) {
// var enhance = function (classifierType, featureLookupTable, labelLookupTable) {
	return classifiers.EnhancedClassifier.bind(0, {
		normalizer: normalizer,

		inputSplitter: inputSplitter,

		// featureExpansion: featureExpansion,
		// featureExpansionScale: featureExpansionScale,
		// featureExpansionPhrase: featureExpansionPhrase,
		// featureFine: featureFine,
		// expansionParam: expansionParam,
		stopwords: JSON.parse(fs.readFileSync(__dirname+'/stopwords.txt', 'UTF-8')).concat(JSON.parse(fs.readFileSync(__dirname+'/smart.json', 'UTF-8'))),
		
		// inputSplitter: inputSplitter,
		// spellChecker: [require('wordsworth').getInstance(), require('wordsworth').getInstance()],

		featureExtractor: featureExtractor,

		featureLookupTable: featureLookupTable,
		labelLookupTable: labelLookupTable,
		
		// featureExtractorForClassification: [
			// ftrs.Hypernyms(JSON.parse(fs.readFileSync(__dirname + '/knowledgeresources/hypernyms.json'))),
		// ],

		multiplyFeaturesByIDF: multiplyFeaturesByIDF,

		TfIdfImpl: natural.TfIdf,

		// tokenizer: new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9%'$,]+/}),
		//minFeatureDocumentFrequency: 2,
		// pastTrainingSamples: [], // to enable retraining
			
		classifierType: classifierType,

		preProcessor: preProcessor,
		postProcessor: postProcessor,
		// TestSplitLabel: TestSplitLabel
	});
};


var regexpNormalizer = ftrs.RegexpNormalizer(
		JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json')));

// var regexpNormalizer_simple = ftrs.RegexpNormalizer(
// 		JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/SimpleNormalizations.json')));

var TCSyn = 
{
	'redisId_words':14,
	'redisId_context':13,
	'comparison': distance.Add,
	'redis_exec': redis_exec,
	'wordnet_exec': wordnet_exec,
	'context': true,
	'wordnet_relation':['synonym']
}

var TCSynHypHypo = 
{
	'redisId_words':14,
	'redisId_context':13,
	'comparison': distance.Add,
	'redis_exec': redis_exec,
	'wordnet_exec': wordnet_exec,
	'context': true,
	'wordnet_relation': ['synonym','hypernym','hyponym']
}

var TCDemo = 
{
	'redisId_words':14,
	'redisId_context':13,
	'comparison': distance.Add,
	'redis_exec': redis_exec,
	'wordnet_exec': wordnet_exec,
	'context': true,
	'wordnet_relation':'all',
	'detail': true,
	'detail_distance': distance.cosine_distance
}

var TCPPDBNoCon = 
{
	'redisId_words':14,
	'redisId_context':13,
	'comparison': distance.cosine_distance,
	'redis_exec': redis_exec,
	'wordnet_exec': ppdb_exec,
	'context': false,
	'wordnet_relation':['ppdb'],
	'detail': false,
	// 'detail_distance': distance.cosine_distance
}

var TCPPDB = 
{
	'redisId_words':14,
	'redisId_context':13,
	'comparison': distance.Add,
	'redis_exec': redis_exec,
	'wordnet_exec': ppdb_exec,
	'context': true,
	'wordnet_relation':['ppdb'],
	'detail': false,
	// 'detail_distance': distance.cosine_distance
}

var TCSynHypHypoNoCon = 
{
	'redisId_words':14,
	'redisId_context':13,
	'comparison': distance.cosine_distance,
	'redis_exec': redis_exec,
	'wordnet_exec': wordnet_exec,
	'context': false,
	'wordnet_relation':['synonym','hypernym','hyponym']
}

var TCSynHyp1 = 
{
	'redisId_words':14,
	'redisId_context':13,
	'comparison': distance.Add,
	'redis_exec': redis_exec,
	'wordnet_exec': wordnet_exec,
	'context': true,
	'wordnet_relation':['synonym','hypernym_1']
}

var TCSynHypHypoCohypo = 
{
	'redisId_words':14,
	'redisId_context':13,
	'comparison': distance.Add,
	'redis_exec': redis_exec,
	'wordnet_exec': wordnet_exec,
	'context': true,
	'wordnet_relation':['synonym','hypernym','hyponym','cohyponym']
}

function wordnet_exec(word, pos, relations, callback)
{

	async_adapter.getwordnet(word, pos, relations, function(err, candidates){
		callback(err, candidates)
	})
}

function ppdb_exec(word, pos, relations, callback)
{
	async_adapter.getppdb(word, pos, relations, function(err, candidates){
		callback(err, candidates)
	})
}

// output: only intent
// and only single labeled or null output

// shoud be prepared for train(input and output) and test(input)
function preProcessor_onlyIntent(value)
{
	var initial = value

	if (_.isObject(value))
	{
		// it's from test and it's object
		if ("text" in value)
		{	
			var sentence = rules.generatesentence({'input':value.text, 'found': rules.findData(value.text)})['generated']
			sentence = sentence.replace(/<VALUE>/g,'').replace(/<ATTRIBUTE>/g,'').replace(/NIS/,'').replace(/nis/,'').replace(/track/,'').replace(/USD/,'').trim()
			value.text = sentence
			return value	
		}

		// it's from train
		if ("input" in value)
		{
			value.output = _.map(value.output, Hierarchy.splitPartEquallyIntent);
			value.output = _.unique(_.flatten(value.output))
			if (value.output.length > 1)
			{
				console.log("FILTERED")
				console.log(JSON.stringify(initial.output, null, 4))
				return undefined
			}

			// text in input
			if (_.isObject(value.input))
				{
					var sentence = rules.generatesentence({'input':value.input.text, 'found': rules.findData(value.input.text)})['generated']
					sentence = sentence.replace(/<VALUE>/g,'').replace(/<ATTRIBUTE>/g,'').replace(/NIS/,'').replace(/nis/,'').replace(/track/,'').replace(/USD/,'').trim()
					value.input.text = sentence

					return value	
				}
			else
				{
					var sentence = rules.generatesentence({'input':value.input, 'found': rules.findData(value.input)})['generated']
					sentence = sentence.replace(/<VALUE>/g,'').replace(/<ATTRIBUTE>/g,'').replace(/NIS/,'').replace(/nis/,'').replace(/track/,'').replace(/USD/,'').trim()
					value.input = sentence

					return value	
				}
		}
	}
	else
	{
		// it's just string from test
		sentence_clean = rules.generatesentence({'input':value, 'found': rules.findData(value)})['generated']
		sentence_clean = sentence_clean.replace(/<VALUE>/g,'').replace(/<ATTRIBUTE>/g,'').replace(/NIS/,'').replace(/nis/,'').replace(/track/,'').replace(/USD/,'').trim()
		return sentence_clean
	}

}

function postProcessor(sample,classes)
{

	// console.log(JSON.stringify(classes, null, 4))

	if (!_.isArray(classes))
		classes = [classes]

	if (classes.length > 1)
		console.log("WARNING")

	var attrval = rules.findData(sample)

	var attrs = []
	var values = []

	_.each(attrval[0], function(value, key, list){
		attrs.push(value[0])
	}, this)

	_.each(attrval[1], function(value, key, list){
		values.push(value[0])
	}, this)

	console.log("rulezzz")
	console.log(JSON.stringify(attrval, null, 4))

	// console.log(JSON.stringify(attrval, null, 4))
	// console.log(JSON.stringify(classes, null, 4))
	// console.log(JSON.stringify(attrs, null, 4))
	// console.log(JSON.stringify(values, null, 4))

	var labels = bars.coverfilter(bars.generate_possible_labels(bars.resolve_emptiness_rule([classes, attrs, values])))
	// console.log(JSON.stringify(labels, null, 4))

	// console.log("==========================================")

	return labels
}

function redis_exec(data, db, callback)
{

	var output = []

	async.whilst(
    function () { return data.length > 0},
    function (callback) {
        
        async_adapter.getred(data, db, function (err, result){

		_.each(data, function(value, key, list){
			if (value in result)
				output.push(result[value])
			else
				output.push([])
		}, this)

		// console.log(output.length)
		data = []
		callback(err, output)
	})

    },
    function (err) {
		callback(err, output)
    }
)}

function featureExpansion(listoffeatures, scale, phrase)
{
	var listoffeatures = _.unique(listoffeatures)
	// console.log("featureExpansion scale"+scale+ " phrase "+phrase  )
	fs.writeFileSync(__dirname+"/utils/featureexp_input", JSON.stringify(listoffeatures, null, 4), 'utf-8')
	var result = execSync("node "+__dirname+"/utils/featureexp.js '"+scale+"' "+phrase);
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

//	console.log("norm")
//	console.log(sentence)
		
//	if (_.isObject(sentence))
//		sentence.text = regexpNormalizer(sentence.text.toLowerCase().trim())
//	else
	if (_.isUndefined(sentence))
	{
	
	throw new Error("For some reason sentence is undefined")
	process.exit(0)
	}	

	sentence = regexpNormalizer(sentence.toLowerCase().trim())
	
//	console.log(sentence)

	// sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
	
	// sentence = sentence.replace(/[\<,\>]/g,' ')
	// sentence = sentence.replace(/\n/g,' ')
	
	// sentence = sentence.replace(/<ATTRIBUTE>/g,'')
	// sentence = regexpNormalizer_simple(sentence)
	
	return sentence
}

var regexpString = "([.;?!]|and)";  // to capture the delimiters
var regexp = new RegExp(regexpString, "i");
var delimitersToInclude = {"?":true};

function inputSplitter(text) {

	if (_.isObject(text)) text = text.text

	console.log(JSON.stringify(text, null, 4))

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

	console.log(JSON.stringify(normalizedParts, null, 4))
	console.log("-------------------------------")

	return normalizedParts;
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

// function featureExtractorUB(sentence, features) {
// 	var words = tokenizer.tokenize(sentence);
// 	// var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2, '[start]', '[end]'))
// 	var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))
// 	_.each(feature, function(feat, key, list){ features[feat.join(" ")] = 1 }, this)
// 	return features;
// }

function feEmbedAverageUnigram(sentence, features, callback) {
if (_.isObject(sentence)) sentence = sentence['text']
	sentence = sentence.toLowerCase().trim()
	var words = tokenizer.tokenize(sentence);
	var unigrams = _.flatten(natural.NGrams.ngrams(words, 1))

	var embs = []
	async.eachSeries(unigrams, function(word, callback1){
		
		async_adapter.getembed(word, function(err, emb){
			embs.push(emb)
			callback1()
		})

 	}, function(err) {

 		var sumvec = Array.apply(null, Array(300)).map(function () { return 0})

 		_.each(embs, function(value, key, list){ 
			sumvec = bars.vectorsum(sumvec, value)
		}, this)

		if (embs.length > 0)
			var sumvec = _.map(sumvec, function(value){ return value/embs.length })

		_.each(sumvec, function(value, key, list){ 
			features['w2v'+key] = value
		}, this)
	
		_.each(unigrams, function(value, key, list){ 
			features[value] = 1
		}, this)

    	    //console.log(_.keys(features).length)
	    callback(null, features)
	})	
}	

function feEmbedAverage(sentence, features, callback) {

	if (_.isObject(sentence)) sentence = sentence['text']
	sentence = sentence.toLowerCase().trim()
	var words = tokenizer.tokenize(sentence);
	var feature = _.flatten(natural.NGrams.ngrams(words, 1))

	var embs = []
	async.eachSeries(feature, function(word, callback1){
		
		async_adapter.getembed(word, function(err, emb){
			embs.push(emb)
			callback1()
		})

 	}, function(err) {

 		var sumvec = Array.apply(null, Array(300)).map(function () { return 0})

 		_.each(embs, function(value, key, list){ 
			sumvec = bars.vectorsum(sumvec, value)
		}, this)

		if (embs.length > 0)
			var sumvec = _.map(sumvec, function(value){ return value/embs.length })

		_.each(sumvec, function(value, key, list){ 
			features['w2v'+key] = value
		}, this)

    	    //console.log(_.keys(features).length)
	    callback(null, features)
	})	
}

function featureExtractorUBCAsync(sentence, features, callback) {

	if (_.isObject(sentence)) sentence = sentence['text']

	sentence = sentence.toLowerCase().trim()
	sentence = regexpNormalizer(sentence)

	var words = tokenizer.tokenize(sentence);
	var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))
	// var feature = natural.NGrams.ngrams(words, 1)

	_.each(feature, function(feat, key, list){ features[feat] = 1 }, this)

	callback(null, features)
}

function featureExtractorUBC(sentence, features) {

	if (_.isObject(sentence)) sentence = sentence['text']

	sentence = sentence.toLowerCase().trim()
	sentence = regexpNormalizer(sentence)

	var words = tokenizer.tokenize(sentence);
	var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))
	// var feature = natural.NGrams.ngrams(words, 1)

	_.each(feature, function(feat, key, list){ features[feat] = 1 }, this)

	return features;
}

function featureExtractorUBContext(sentence, features) {
	
	var stopwords = JSON.parse(fs.readFileSync(__dirname+'/stopwords.txt', 'UTF-8')).concat(JSON.parse(fs.readFileSync(__dirname+'/smart.json', 'UTF-8')))

	var context = sentence['context']
	sentence = sentence['text']

	sentence = sentence.toLowerCase().trim()

	sentence = regexpNormalizer(sentence)

	var attrval = rules.findData(sentence)

	var attrs = attrval[0]
	var values = attrval[1]

	sentence_clean = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
	sentence_clean = sentence_clean.replace(/<VALUE>/g,'')
	sentence_clean = sentence_clean.replace(/<ATTRIBUTE>/g,'')
	sentence_clean = sentence_clean.replace(/NIS/,'')
	sentence_clean = sentence_clean.replace(/nis/,'')
	sentence_clean = sentence_clean.replace(/track/,'')
	sentence_clean = sentence_clean.replace(/USD/,'')
	sentence_clean = sentence_clean.trim()


	// var words = tokenizer.tokenize(sentence);
	var words_clean = tokenizer.tokenize(sentence);
	// var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2, '[start]', '[end]'))
	// var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))

	var feature_clean = _.flatten(natural.NGrams.ngrams(words_clean, 1))

	// _.each(stopwords, function(stopvalue, key, list){
		// feature_clean = _.without(feature_clean, stopvalue);
	// }, this)

	_.each(feature_clean, function(feat, key, list){ features[feat] = 1 }, this)

	// if (attrs.length > 0)
	// 	_.each(attrs, function(attr, key, list){ features[attr[0]] = 1 }, this)

	// if (values.length > 0)
	// 	_.each(values, function(value, key, list){ features[value[0]] = 1 }, this)

	_.each(context, function(feat, key, list){ 

		var obj = JSON.parse(feat)
		features["CON_"+_.keys(obj)[0]] = 1 
		features["CON_"+_.keys(obj)[0]+"_"+_.keys(_.values(obj)[0])[0]] = 1 

	}, this)

	return features;
	// callback()
}

// function featureExtractorUCoreNLPConcept(sentence, features, stopwords, callback) {

// 	var candidates = []

// 	_.each(sentence["CORENLP"]['sentences'], function(sentence, key, list){ 
// 		candidates = candidates.concat(sentence["boc"])
// 	}, this)

//     candidates = _.filter(candidates, function(num){ return ['noun'].indexOf(num['pos']) != -1; });
// 	candidates = _.filter(candidates, function(num){ return stopwords.indexOf(num['string']) == -1 });
// 	// console.log("Candidate after stopwords "+ candidates.length)
	
// 	var expansions = []

// 	async.eachSeries(candidates, function (candidate, callback2) {
// 		// async_adapter.getwordnet(candidate['string'], candidate['pos'], 'hypernym_1', function(err, expansion){
// 		async_adapter.getwordnetCache(candidate['string'], candidate['pos'], 'synonym', function(err, expansion){
// 		// async_adapter.getwordnet(candidate['string'], candidate['pos'], 'synonym', function(err, expansion){

// 			expansions = expansions.concat(expansion)
// 			callback2()
// 		})
// 	}, 	function (err) {

// 		_.each(expansions, function(expansion, key, list){ 
// 			features["C_"+expansion.toLowerCase()] = 1 
// 		}, this)

// 		_.each(sentence['CORENLP']['sentences'], function(sen, key, list){ 
// 			_.each(sen['tokens'], function(value, key, list){
// 				if ('lemma' in value)
// 					// if (['ORGANIZATION', 'DATE', 'NUMBER'].indexOf(value['ner']) == -1)
// 						features[value['lemma'].toLowerCase()] = 1 
// 				else
// 					{
// 						console.log("There is no lemma "+ value)
// 						// process.exit(0)
// 					}
// 			}, this)
// 		}, this)

// 		callback(err, features)
// 	})
// }

function featureword2vec(sentence, features) {
	var words = tokenizer.tokenize(sentence);
	var vector = []

	console.log("featureword2vec start "+words.length)

	var params = words.join(" ")
	
	console.log(params)

	var result = execSync("node "+__dirname+"/utils/getred.js " + params)

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


var SvmPerfKernelBinaryClassifier = classifiers.SvmPerf.bind(0, {
        learn_args: "-c 100 -t 2",   // see http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html
        model_file_prefix: "trainedClassifiers/tempfiles/SvmPerf",
});

var SvmPerfBinaryClassifier = classifiers.SvmPerf.bind(0, {
        learn_args: "-c 100 ",   // see http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html
        model_file_prefix: "trainedClassifiers/tempfiles/SvmPerf"
});

var SvmPerfKernelBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.bind(0, {
        binaryClassifierType: SvmPerfKernelBinaryClassifier
        // debug: true
});

var SvmPerfBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.bind(0, {
        binaryClassifierType: SvmPerfBinaryClassifier
        // debug: true
});

/*var SvmPerfRulebasedClassifier = classifiers.multilabel.Rulebased.bind(0, {
        ClassifierType: SvmPerfBinaryRelevanceClassifier
        // debug: true
});
*/
var SvmLinearBinaryClassifier = classifiers.SvmLinear.bind(0, {
        
        model_file_prefix: "trainedClassifiers/tempfiles/SvmLinearBinary",
        // debug: true,
        multiclass: false,

        // learn_args: "-c 100 -t 1 -d 2",
        // train_command: "svm-train",
        // test_command: "svm-predict"

        learn_args: "-c 100",
        train_command: "liblinear_train",
        test_command: "liblinear_test"
});

var SvmLinearBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.bind(0, {
        binaryClassifierType: SvmLinearBinaryClassifier,
        // debug: true
});

var SagaeSegmenter =
	classifiers.multilabel.BinarySegmentation.bind(0, {
	binaryClassifierType: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorU, undefined,  new ftrs.FeatureLookupTable()),
	segmentSplitStrategy: 'cheapestSegment'
});

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

var SvmLinearMulticlassifier = classifiers.SvmLinear.bind(0, {
	learn_args: "-c 100", 
	model_file_prefix: "trainedClassifiers/tempfiles/SvmLinearMulti",
	multiclass: true,
	train_command: "liblinear_train",
	test_command: "liblinear_test"
})

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

/*
 * FINAL CLASSIFIERS (exports):
 */

module.exports = {

		/* the set of routines for tests*/
		enhance: enhance,
		tokenizer: tokenizer,
		normalizer: normalizer,
		// featureExtractorUB: featureExtractorUB,
		// featureExtractorB: featureExtractorB,
		// featureExtractorU: featureExtractorU,
		// featureword2vec:featureword2vec,
		// featureExtractorUnigram: featureExtractorUnigram,
		instanceFilter: instanceFilterShortString,
		featureExpansion:featureExpansion,
		featureExpansionEmpty:featureExpansionEmpty,

		// TC: enhance(SvmLinearBinaryRelevanceClassifier, featureExtractorUCoreNLP, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, undefined),
		
		// TCPerf: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUCoreNLPSync, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, undefined),
		// TC: enhance(SvmLinearMulticlassifier, featureExtractorUCoreNLP, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, undefined),
		// TC1: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUCoreNLP, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, undefined),
		// TCDemo: enhance(SvmLinearMulticlassifier, featureExtractorUCoreNLP, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, TCDemo),
		// TCPPDB: enhance(SvmLinearMulticlassifier, featureExtractorUCoreNLP, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, TCPPDB),
		// TCPPDBNoCon: enhance(SvmLinearMulticlassifier, featureExtractorUCoreNLP, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, TCPPDBNoCon),
		// TCSynHypHypoCohypo: enhance(SvmLinearMulticlassifier, featureExtractorUCoreNLP, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, TCSynHypHypoCohypo),
		// TCSynHyp1: enhance(SvmLinearMulticlassifier, featureExtractorUCoreNLP, undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, TCSynHyp1),
		// TCBOCWN: enhance(SvmLinearMulticlassifier, [featureExtractorUCoreNLPConceptWordnet, featureExtractorUCoreNLP], undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, undefined),
		// TCBOCPPDBS: enhance(SvmLinearMulticlassifier, [featureExtractorUCoreNLPConceptPPDBS, featureExtractorUCoreNLP], undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, undefined),
		// TCBOCPPDBM: enhance(SvmLinearMulticlassifier, [featureExtractorUCoreNLPConceptPPDBM, featureExtractorUCoreNLP], undefined, new ftrs.FeatureLookupTable(),undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, undefined),
		// IntentClass: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorUB, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent, true),
		// IntentClass: enhance(SvmLinearMulticlassifier, featureExtractorUB, undefined, new ftrs.FeatureLookupTable(),undefined,Hierarchy.splitPartEqually, Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent, true),
		DS_bigram: enhance(SvmLinearBinaryRelevanceClassifier, featureExtractorUBC, undefined, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, true),
		// DS_bigram_split: enhance(SvmLinearBinaryRelevanceClassifier, featureExtractorUBC, inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true),
		DS_bigram_split_async: enhance(SvmLinearMulticlassifier, featureExtractorUBCAsync, inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true),
		DS_bigram_split_embed: enhance(SvmLinearMulticlassifier, feEmbedAverage, inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false),
		DS_bigram_split_embed_unig: enhance(SvmLinearMulticlassifier, feEmbedAverageUnigram, inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false),
		DS_bigram_split: enhance(SvmLinearBinaryRelevanceClassifier, featureExtractorUBC, inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true),
		DS_bigram_kernel: enhance(SvmPerfKernelBinaryRelevanceClassifier, featureExtractorUBContext, undefined, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, true),
		// DS_unigram: enhance(SvmLinearBinaryRelevanceClassifier, featureExtractorU, undefined, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, true),
		DS_bigram_con: enhance(SvmLinearBinaryRelevanceClassifier, featureExtractorUBContext, undefined, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, true),
		// DS_rule: rule(SvmPerfBinaryRelevanceClassifier, featureExtractorUBC, new ftrs.FeatureLookupTable(), undefined, true)

};

module.exports.defaultClassifier = module.exports.DS_bigram

if (!module.exports.defaultClassifier) throw new Error("Default classifier is null");
