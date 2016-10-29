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
var execSync = require('child_process').execSync
var async_adapter = require('./utils/async_adapter')
var async = require('async');
var stopwords = JSON.parse(fs.readFileSync(__dirname+'/stopwords.txt', 'UTF-8')).concat(JSON.parse(fs.readFileSync(__dirname+'/smart.json', 'UTF-8')))
var log_file = "./logs/" + process.pid


var antonyms = {}
//var data = fs.readFileSync("./antonyms.txt", 'utf8').split("\n")

/*_.each(data, function(value, key, list){
        var value1 = value.split(",")
        antonyms[value1[0]] = value1[1]
        antonyms[value1[1]] = value1[0]
}, this)
*/


var old_unused_tokenizer = {tokenize: function(sentence) { return sentence.split(/[ \t,;:.!?]/).filter(function(a){return !!a}); }}

var tokenizer = new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9\-\?]+/});

console.vlog = function(data) { fs.appendFileSync(log_file, data + '\n', 'utf8') };

// var tokenizer = new natural.WordTokenizer({'pattern':(/(\W+|\%)/)}); // WordTokenizer, TreebankWordTokenizer, WordPunctTokenizer
// var ngrams = new natural.NGrams.ngrams()

// var enhance = function (classifierType, featureExtractor, inputSplitter, featureLookupTable, labelLookupTable, preProcessor, postProcessor, TestSplitLabel, multiplyFeaturesByIDF, featureExpansion, featureExpansionScale, featureExpansionPhrase, featureFine, expansionParam) {
var enhance = function (classifierType, featureExtractor, inputSplitter, featureLookupTable, labelLookupTable, preProcessor, postProcessor, TestSplitLabel, multiplyFeaturesByIDF, featureOptions) {
// var enhance = function (classifierType, featureLookupTable, labelLookupTable) {
	return classifiers.EnhancedClassifier.bind(0, {
		normalizer: normalizer,

		inputSplitter: inputSplitter,
		featureOptions:featureOptions,

		// featureExpansion: featureExpansion,
		// featureExpansionScale: featureExpansionScale,
		// featureExpansionPhrase: featureExpansionPhrase,
		// featureFine: featureFine,feExpansion
		// expansionParam: expansionParam,
		// stopwords: JSON.parse(fs.readFileSync(__dirname+'/stopwords.txt', 'UTF-8')).concat(JSON.parse(fs.readFileSync(__dirname+'/smart.json', 'UTF-8'))),
		// spellChecker: [require('wordsworth').getInstance(), require('wordsworth').getInstance()],

		featureExtractor: featureExtractor,

		featureLookupTable: featureLookupTable,
		labelLookupTable: labelLookupTable,
		
		// featureExtractorForClassification: [
			// ftrs.Hypernyms(JSON.parse(fs.readFileSync(__dirname + '/knowledgeresources/hypernyms.json'))),
		// ],

		multiplyFeaturesByIDF: multiplyFeaturesByIDF,
//		multiplyFeaturesByIDF: false,
		TfIdfImpl: natural.TfIdf,

		// tokenizer: new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9%'$,]+/}),
		//minFeatureDocumentFrequency: 2,
		// pastTrainingSamples: [], // to enable retraining
			
		classifierType: classifierType,

		preProcessor: preProcessor,
		postProcessor: postProcessor,

	});
};


var regexpNormalizer = ftrs.RegexpNormalizer(
		JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json')));

// var regexpNormalizer_simple = ftrs.RegexpNormalizer(
// 		JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/SimpleNormalizations.json')));

// output: only intent
// and only single labeled or null output

// shoud be prepared for train(input and output) and test(input)

// sentence is a hash and not an array
// lemma and pos are required
function getRule(sen, text)
{

/*	if (!('tokens' in sen))
		{
		console.vlog("DEBUGRULE: for some reason tokens is not in the sentence " + JSON.stringify(sen, null, 4))
		throw new Error("DEBUGRULE: for some reason tokens is not in the sentence " + JSON.stringify(sen, null, 4))
		}
*/	var sentence = JSON.parse(JSON.stringify(sen))
 
	console.vlog("getRule: sentence: "+JSON.stringify(sentence, null, 4))

	// change tokens 
  	var tokenizer = new natural.RegexpTokenizer({pattern: /[^\%a-zA-Z0-9\-\?]+/});
	
	text = regexpNormalizer(text.toLowerCase())
	var tkns = natural.NGrams.ngrams(tokenizer.tokenize(text), 1)
	sentence['tokens'] = []

	_.each(tkns, function(value, key, list){
		sentence['tokens'].push({
			"word": value[0],
			"lemma": value[0]
			})
	}, this)

	// first fix % sign
	_.each(sentence['tokens'], function(token, key, list){
		
		if (_.isNull(token))
			throw new Error("DEBUGRULE: token is null: " + JSON.stringify(sentence, null, 4))

		if (key > 0)
		if (token.lemma=='%')
		{
			sentence['tokens'][key-1].lemma = sentence['tokens'][key-1].lemma + "%"
			sentence['tokens'][key-1].word = sentence['tokens'][key-1].word + "%"
		}

		if (key > 0)
		if ((token.lemma == 'agreement') && (sentence['tokens'][key-1]["lemma"] == "no"))
		{
			sentence['tokens'][key-1].lemma = "no agreement"
			sentence['tokens'][key-1].word = "no agreement"
		}
		
		if (key > 0)
		if ((token.lemma == 'car') && (sentence['tokens'][key-1]["lemma"] == "no"))
		{
			sentence['tokens'][key-1].lemma = "no car"
			sentence['tokens'][key-1].word = "no car"
		}
	
	}, this)

	// filter punct symbols
	var temp = JSON.parse(JSON.stringify(sentence['tokens']))	
	sentence['tokens'] = []

	_.each(temp, function(token, key, list){

		// if (!('pos' in token))
			// throw new Error('DEBUGRULE: pos is not in the token')
		
		if (!('lemma' in token))
			throw new Error('DEBUGRULE: lemma is not in the token')

		// if (!('word' in token))
			// throw new Error('DEBUGRULE: word is not in the token')

		if ((token.lemma!='.')&&(token.lemma!=',')&&(token.lemma!='%')&&(token.lemma!='$')&&(token.lemma!=':'))
			sentence['tokens'].push(token)
	}, this)

//	if (sentence['tokens'].length == 0)
//		throw new Error("DEBUGRULE: for some reason tokens is empty")

	var RuleValues = {

		  'Salary': [['60000','60,000 USD'],['90000','90,000 USD'],['120000','120,000 USD']],
		  'Pension Fund': [['0%','0%'],['10%','10%'],['15%','15%'],['20%','20%']],
		  'Promotion Possibilities': [['fast','Fast promotion track'],['slow','Slow promotion track']],
		  'Working Hours': [['8','8 hours', '8 hour'],['9','9 hours', '9 hour'],['10','10 hours', '10 hour']],
		  'Job Description': [['QA','QA'],['Programmer','Programmer'],['Team','Team Manager'],['Project','Project Manager']]
		  // 'Job Description': ['QA','Programmer','Team Manager','Project Manager'],
		   //'Leased Car': ['Without leased car', 'With leased car', 'No agreement']
		   // 'Leased Car': [['without','Without leased car'], ['with', 'With leased car'], ['agreement','No agreement']]
		}

	var arAttrVal = ['000','salary','pension','fund','promotion','possibilities','working','hours','hour',
					'job','description','60000','90000','120000','usd','fast','slow','track','8','9','10',
					'qa','programmer','team','project','manager','agreement',
					'0%','10%','15%','20%', 'no agreement', 'position','workday', 'with', 'car', 'no car', 'leased', 'without',
					'quick', 'rental', 'taxi', 'vehicles', 'vehicle', 'rent-a-car', 'rented', 'wages', 'wage', 'pay', 'fee', 'non-rented']

//	arAttrVal = arAttrVal.concat(['no car', "company car", "leased", "car", "leased", "with", "without"])

	var ar_values = {}
	var ar_attrs = {}

	// check the salary
	sentence['tokens'] = _.map(sentence['tokens'], function(unigram){ unigram.lemma = unigram.lemma.replace(/[,.]/g,''); return unigram });	
	sentence['tokens'] = _.map(sentence['tokens'], function(unigram){ unigram.lemma = unigram.lemma.replace(/0k/g,'0000'); return unigram });	
	sentence['tokens'] = _.map(sentence['tokens'], function(unigram){ if (unigram.lemma == "90") {unigram.lemma = "90000"; return unigram}
														else if (unigram.lemma=="60") {unigram.lemma = "60000"; return unigram}
														else if (unigram.lemma=="120") {unigram.lemma = "120000"; return unigram}
															else return unigram});

	var cleaned = JSON.parse(JSON.stringify(sentence))

	var unigrams = _.map(sentence['tokens'], function(token){ return token.lemma.toLowerCase()});
	// var words = _.map(sentence['tokens'], function(token){ return token.word.toLowerCase()});
	


	_.each(RuleValues, function(values, attr, list){

		// the biggest intersection
		if (_.intersection(unigrams, attr.toLowerCase().split(" ")).length != 0)
			ar_attrs[attr] = 1
		
		_.each(values, function(value, key, list){
			var temp = []
			if (!_.isArray(value))
				{
					temp.push(value)
					temp.push(value)
				}
			else
				temp=value

			if (_.intersection(unigrams, temp[0].toLowerCase().split(" ")).length != 0)
			{
				ar_attrs[attr] = 1
				ar_values[temp[1]] = 1
			}

		}, this)
		
	}, this)

	if (unigrams.indexOf("no car")!=-1)
	{
		ar_attrs["Leased Car"]= 1
		ar_values['Without leased car']=1
	}

	if (unigrams.indexOf("car")!=-1)
	{
		ar_attrs["Leased Car"]= 1

		if (unigrams.indexOf("without")!=-1) 		ar_values['Without leased car']=1
		if (unigrams.indexOf("with")!=-1) 			ar_values['With leased car']=1
		if (unigrams.indexOf("no")!=-1)				ar_values['Without leased car']=1
		
		
		/*if ('basic-dependencies' in sentence)
		{
			_.each(sentence['basic-dependencies'], function(dep, key, list){
				if ((dep['dep']=='neg')&&(['car','leased'].indexOf(dep['governorGloss']!=-1)))
						ar_values['Without leased car']=1
			}, this)
		}
		*/
		if (unigrams.indexOf("agreement")!=-1)			
		{
			delete ar_values['With leased car']
			delete ar_values['Without leased car']
		}
	}

	// work around for missing car

	
	if (("Leased Car" in ar_attrs) || ("Pension Fund" in ar_attrs) || ("Promotion Possibilities" in ar_attrs))
		if (unigrams.indexOf("no agreement")!=-1)
			ar_values["No agreement"]=1

	if ("Leased Car" in ar_attrs)
		if (!("With leased car" in ar_values))
			if (!("Without leased car" in ar_values))
				if (!("No agreement" in ar_values))
					if (unigrams.indexOf("car")!=-1)
						ar_values["With leased car"]=1
	
	cleaned['tokens'] = []
	_.each(sentence['tokens'], function(token, key, list){
		if (arAttrVal.indexOf(token.lemma.toLowerCase())==-1)
			cleaned['tokens'].push(token)
	}, this)

	return {
		'labels':[_.unique(_.keys(ar_attrs)), _.unique(_.keys(ar_values))],
		'cleaned': cleaned
	}
}

// convert array of sentences into one sentence
function preProcessor_onlyIntent(value)
{
	var initial = value

	if ("input" in value)
	{
		if (value.input.sentences.length > 1)
		{
			console.vlog(process.pid + "DEBUG: the train instance is filtered due to multiple sentences "+initial.output)
			return undefined
		}

		// clean all the attr and values stuff from the sentence
		// every fe... clean by itself
		//	value.input.sentences = getRule(value.input.sentences[0]).cleaned
		value.input.sentences = value.input.sentences[0]
	}

	if ("output" in value)
	{
		value.output = _.map(value.output, Hierarchy.splitPartEquallyIntent);
		value.output = _.unique(_.flatten(value.output))

		if (value.output.length > 1)
			{
			console.log(process.pid + "DEBUG: the train instance is filtered "+initial.output)
			return undefined
		}
		else
			return value
	}
	else
		return value



	/*var initial = value
	
	if (_.isObject(value))
	{
		// it's from test and it's object
		if ("text" in value)
		{	
			console.log("its test")
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
				console.log(process.pid + "DEBUG: the train instance is filtered "+initial.output)
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
*/
}


function postProcessor(sample,classes)
{
	
	// console.log(JSON.stringify(sample, null, 4))
	if (!('context' in sample))
		throw new Error("context is not in the sampe "+ sample)

	if (!_.isArray(classes))
		classes = [classes]

	if (classes.length > 1)
		console.log("DEBUGPOST: more than one intent "+ classes)

	feContext(sample, {}, false, {'offered': true, 'unoffered':true}, function(err, feat){
		console.log("DEBUGPOST: features to find uniffered "+feat)
		if ('UNOFFEREDVALUE' in feat)
		{
			console.log("DEBUGPOST: unoffered is inside")
			var index = classes.indexOf("Accept");
			if (index !== -1) 
    			classes[index] = "Offer"
			console.log("DEBUGPOST: classes "+classes)
		}
	})

	// no accept:true after reject
	if (sample['context'].length > 0)
	{
		if (_.keys(JSON.parse(sample['context'][0]))[0] == "Reject")
		{
			var index = classes.indexOf("Accept");
			if (index !== -1) 
	    		classes[index] = "NoIntent"
		}
	}

	var attrval = getRule(sample.sentences).labels

	console.log("DEBUGPOST: classes before check "+classes+classes.length)
	if ((attrval[1].length > 0) && (classes.length==0))
	{
		console.log("DEBUGPOST: Offer was added as default intent")
		classes.push("Offer")
	}

	console.log("DEBUGPOST: classes after check"+classes+classes.length)
	console.log("DEBUGPOST: labels "+JSON.stringify(attrval))

	return bars.coverfilter(bars.generate_possible_labels(bars.resolve_emptiness_rule([classes, attrval[0], attrval[1]])))
}

/*
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
*/
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

var regexpString = "([,.;?!]| and | if | however | but )";  // to capture the delimiters
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

// function featureExtractorB(sentence, features) {
// 	var words = tokenizer.tokenize(sentence);
// 	var feature = natural.NGrams.ngrams(words, 2)	
// 	_.each(feature, function(feat, key, list){ features[feat.join(" ")] = 1 }, this)
// 	return features;
// }

 /*function featureExtractorU(sentence, features) {
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
*/
// function featureExtractorUB(sentence, features) {
// 	var words = tokenizer.tokenize(sentence);
// 	// var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2, '[start]', '[end]'))
// 	var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))
// 	_.each(feature, function(feat, key, list){ features[feat.join(" ")] = 1 }, this)
// 	return features;
// }


//  if train then true
/*function feExpansion(sample, features, train, featureOptions, callback) {

// featureOptions.scale
// featureOptions.relation
// featureOptions.allow_offer
// featureOptions.expand_test
// featureOptions.best_results

	var sentence = ""
	var innerFeatures = JSON.parse(JSON.stringify(features))

	if (_.isObject(sample)) 
		if ("input" in sample)
			sentence = sample.input.text
		else
			sentence = sample.text
	else
		sentence = sample

	if (!('input' in sample))
	{	
		var sampleTemp = {}
		sampleTemp['input']= sample
		sample=sampleTemp
	}
	
	if (!('sentences' in sample['input']))
		throw new Error("sentences not in the sample")

	console.log(process.pid + " DEBUG: train: "+train + " options: "+JSON.stringify(featureOptions))

	sentence = sentence.toLowerCase().trim()
	var words = tokenizer.tokenize(sentence);
	var unigrams = _.flatten(natural.NGrams.ngrams(words, 1))
	
	//_.each(unigrams, function(unigram, key, list){ if (stopwords.indexOf(unigram)==-1) features[unigram] = 1 }, this)
	// _.each(unigrams, function(unigram, key, list){ if (stopwords.indexOf(unigram)==-1) features[unigram] = 1 }, this)
	_.each(unigrams, function(unigram, key, list){ innerFeatures[unigram] = 1 }, this)

//	if (((!featureOptions.expand_test) && (train)) || (featureOptions.expand_test))
//	{	
		async.waterfall([
			function(callbackl1){
			  if (((!featureOptions.expand_test) && (train)) || (featureOptions.expand_test))
				{	
				console.log("DEBUG: train"+train + " unigrams "+unigrams)
				callbackl1(null)
				}
			 else
				{	
				console.log(process.pid + " DEBUG: callback classify noexpansion"+ train +" "+ _.keys(features))
				callback(null, innerFeatures)
				}
			},
			function(callbackl) {

				 if ((!featureOptions.allow_offer)&&(train))
					{ 
					if (sample.output[0] == "Offer")
				 		{
				 		console.log("Offer no expansion")
				 		callback(null, innerFeatures)	
				 		}
					}
	
				var poses = {}
				var roots = []
	
				console.log("DEBUG train" + train)	
				_.each(sample['input']['sentences'], function(sentence, key, list){ 
					_.each(sentence['tokens'], function(token, key, list){ 	
						poses[token.word.toLowerCase()] = token.pos
					}, this)	
					_.each(sentence['basic-dependencies'], function(dep, key, list){ 	
						if (dep.dep == "ROOT")
							roots.push(dep.dependentGloss.toLowerCase())
					}, this)	
				}, this)

			console.log("poses train" + train + " " + JSON.stringify(poses))
        		callbackl(null, poses, roots);
    		},
		    function(poses, roots, callbackll) {
			async.forEachOfSeries(unigrams, function(unigram, dind, callback2){ 
			// async.forEachOfSeries(_.keys(poses), function(unigram, dind, callback2){ 
				if (((!featureOptions.onlyroot) && (stopwords.indexOf(unigram)==-1))
					|| ((featureOptions.onlyroot) && (roots.indexOf(unigram)!=-1)))
				{
					if (!(unigram in poses))
						throw new Error(unigram + " is not found in "+poses)
				
					async_adapter.getppdb(unigram, poses[unigram], featureOptions.scale, featureOptions.relation,  function(err, results){
						
						console.log("getppdb train" + train + " "+JSON.stringify(unigram))			
		
						// get rid of phrases
						console.log(process.pid + " DEBUG EXP: results with phrases "+results.length)
						results = _.filter(results, function(num){ return num[0].indexOf(" ") == -1 })
						console.log(process.pid + " DEBUG EXP: results without phrases "+results.length)

						results = _.map(results, function(num){ return num[0] });
						results = _.uniq(results)	
		
						if (!_.isUndefined(featureOptions.best_results))
							results = results.slice(0, featureOptions.best_results)

						_.each(results, function(expan, key, list){ 
							innerFeatures[expan.toLowerCase()] = 1
						}, this)
						callback2()
					})
				}
				else
				callback2()
			}, function(err){callbackll()})
		}],
		function (err, result) {
			console.log(process.pid + " DEBUG EXP: "+unigrams+ " EXPANSIONED "+_.keys(innerFeatures)+ " train"+train+" featureOptions"+JSON.stringify(featureOptions))
			callback(null, innerFeatures)
	     });

//	}
//	else
//	{
//		console.log(process.pid + " DEBUG: callback classify noexpansion"+ train +" "+ _.keys(features))
//		return callback(null, features)	
//	}
	
}
*/

// as a feature source it gets it from upper feature extraction level
function feExpansion(sample_or, features, train, featureOptions, callback) {
// featureOptions.scale
// featureOptions.relation
	var sample = JSON.parse(JSON.stringify(sample_or))	

	if (!('allow_offer' in featureOptions)) throw new Error("allow_offer is not in the featureOptions")
	if (!('expand_test' in featureOptions)) throw new Error("expand_test is not in the featureOptions")
	if (!('best_results' in featureOptions)) throw new Error("best_results is not in the featureOptions")

	var sentence = ""
	var innerFeatures = JSON.parse(JSON.stringify(features))

	var output = []

	if (!("input" in sample))
		{
		var temp = JSON.parse(JSON.stringify(sample))
		var sample ={'input':temp}
		
		}
	if (!('sentences' in sample['input']))
		throw new Error("sentences not in the sample")

	console.vlog("DEBUGEXP: START: train: "+train + " options: "+JSON.stringify(featureOptions)+ "text: "+sample.input.text)
	//console.vlog("DEBUGEXP: START: sample: "+JSON.stringify(sample, null, 4))

	var cleaned = getRule(sample["input"]["sentences"]).cleaned
	var cleaned_tokens = _.map(cleaned.tokens, function(num){ return num.word; });

	// feAsync(sample, {}, train, {}, function(err, featuresAsync){
	// innerFeatures = _.extend(innerFeatures, featuresAsync)

		async.waterfall([
			function(callbackl1){
			  if (((!featureOptions.expand_test) && (train)) || (featureOptions.expand_test))
				{	
				callbackl1(null)
				}
			 else
				{	
				console.vlog("DEBUGEXP: callback classify noexpansion"+ train +" "+ _.keys(features))
				callback(null, innerFeatures)
				}
			},
			function(callbackl) {

				console.vlog("DEBUGEXP: continue")

				 if ((!featureOptions.allow_offer)&&(train))
					{ 
					if (sample.output[0] == "Offer")
				 		{
						console.vlog("Offer no expansion")
				 		callback(null, innerFeatures)	
				 		}
					}
	
				var poses = {}
				var roots = []
	
//				console.vlog("DEBUG train" + train)	
				
				_.each(sample['input']['sentences']['tokens'], function(token, key, list){ 
					// _.each(sentence['tokens'], function(token, key, list){ 	
					poses[token.word.toLowerCase()] = {
														'pos':token.pos,
														'lemma': token.lemma.toLowerCase(),
														'word': token.word.toLowerCase(),
														'neg': false
														}
				}, this)	

//				console.vlog("DEBUGEXP: found tokens: "+JSON.stringify(poses, null, 4))
				
				_.each(sample['input']['sentences']['basic-dependencies'], function(dep, key, list){ 	

					if (dep.dep == "ROOT")
						roots.push(dep.dependentGloss.toLowerCase())

	//				if (dep.dep == "xcomp")
 	//		                       roots.push(dep.dependentGloss.toLowerCase())

					if (dep.dep == "neg")
						{
						poses[dep.governorGloss.toLowerCase()]["neg"] = true
						delete poses[dep.dependentGloss.toLowerCase()]
						
						}
					}, this)	
				// }, this)

			// eliminate number from root
			var roots = _.filter(roots, function(num){ return num.indexOf("0") == -1 });
			
			
			console.vlog("DEBUGEXP: words to expand: " + roots)

//			console.vlog("DEBUGEXP: poses: " + JSON.stringify(poses))
        		callbackl(null, poses, roots);
    		},
		    function(poses, roots, callbackll) {

		//	var allowedpos = ["vb","vbd","vbg","vbn","vbp","vbz","uh","wp","wdt"]

			async.forEachOfSeries(poses, function(token, unigram, callback2){ 
			// async.forEachOfSeries(_.keys(poses), function(unigram, dind, callback2){ 
				if (((!featureOptions.onlyroot) && (stopwords.indexOf(unigram)==-1))
					//|| ((featureOptions.onlyroot) && (roots.indexOf(unigram)!=-1) && (allowedpos.indexOf(token.pos.toLowerCase())!=-1) && (cleaned_tokens.indexOf(unigram)!=-1)))
					|| ((featureOptions.onlyroot) && (roots.indexOf(unigram)!=-1) && (cleaned_tokens.indexOf(unigram)!=-1)))
				{

				// we any case we are taking lemma and verb so take VB pos tag
					
//					if ((featureOptions.onlyroot) && (token.pos.toLowerCase().indexOf("vb")!=-1))
//						token.pos = "VB"

					// if (!(unigram in poses))
						// throw new Error(unigram + " is not found in "+poses)
				
					console.vlog("DEBUGEXP: ready to expand train:" + train + " "+JSON.stringify(token))			

					async_adapter.getppdb(token.lemma, token.pos, featureOptions.scale, featureOptions.relation,  function(err, results){
					// async_adapter.getwordnet(token.lemma, token.pos, function(err, results){
						
						// get rid of phrases				
						console.vlog("DEBUGEXP: number of results with phrases "+results.length)
						results = _.filter(results, function(num){ return num[0].indexOf(" ") == -1 })
						console.vlog("DEBUGEXP: number of results without phrases "+results.length)

						results = _.map(results, function(num){ return num[0] });
						results = _.uniq(results)	
		
						if (!_.isUndefined(featureOptions.best_results))
							results = results.slice(0, featureOptions.best_results)
		
						console.vlog("DEBUGEXP: results to add for token:"+ JSON.stringify(token)+ " results:"+JSON.stringify(results))
						console.log("DEBUGEXP: results to add for token:"+ JSON.stringify(token)+ " results:"+JSON.stringify(results))
						
			                //Lem.lemmatize(results, function(err, lemmas) {
	
								_.each(results, function(expan, key, list){ 	
									var temp = JSON.parse(JSON.stringify(innerFeatures))
									if (token.neg)
										expan+="-"
									delete temp[token.word+"-"]
									delete temp[token.word]
									// innerFeatures[expan.toLowerCase()] = 1
									temp[expan.toLowerCase()] = 1

									output.push(JSON.parse(JSON.stringify((temp))))
									
									console.vlog("DEBUGEXP: temp: "+JSON.stringify(temp))

								}, this)
	
//								console.vlog("DEBUGEXP: permanent features "+JSON.stringify(innerFeatures))
								callback2()
					//		})
					})
				}
				else
				callback2()
			}, function(err){callbackll()})
		}],
		function (err, result) {

			// callback(null, innerFeatures)
			console.vlog("DEBUGEXP: finish with "+output.length +" generated instances")
			callback(null, output)
	     });

//	}
//	else
//	{
//		console.log(process.pid + " DEBUG: callback classify noexpansion"+ train +" "+ _.keys(features))
//		return callback(null, features)	
//	}
	
	// })
}


// as a feature source it gets it from upper feature extraction level
function feExpansionW(sample_or, features, train, featureOptions, callback) {
// featureOptions.scale
// featureOptions.relation
	var sample = JSON.parse(JSON.stringify(sample_or))	

	if (!('allow_offer' in featureOptions)) throw new Error("allow_offer is not in the featureOptions")
	if (!('expand_test' in featureOptions)) throw new Error("expand_test is not in the featureOptions")
	if (!('best_results' in featureOptions)) throw new Error("best_results is not in the featureOptions")

	var sentence = ""
	var innerFeatures = JSON.parse(JSON.stringify(features))

	var output = []

	if (!("input" in sample))
		{
		var temp = JSON.parse(JSON.stringify(sample))
		var sample ={'input':temp}
		
		}
	if (!('sentences' in sample['input']))
		throw new Error("sentences not in the sample")

	console.vlog("DEBUGEXP: START: train: "+train + " options: "+JSON.stringify(featureOptions)+ "text: "+sample.input.text)
	//console.vlog("DEBUGEXP: START: sample: "+JSON.stringify(sample, null, 4))

	var cleaned = getRule(sample["input"]["sentences"]).cleaned
	var cleaned_tokens = _.map(cleaned.tokens, function(num){ return num.word; });

	// feAsync(sample, {}, train, {}, function(err, featuresAsync){
	// innerFeatures = _.extend(innerFeatures, featuresAsync)

		async.waterfall([
			function(callbackl1){
			  if (((!featureOptions.expand_test) && (train)) || (featureOptions.expand_test))
				{	
				callbackl1(null)
				}
			 else
				{	
				console.vlog("DEBUGEXP: callback classify noexpansion"+ train +" "+ _.keys(features))
				callback(null, innerFeatures)
				}
			},
			function(callbackl) {

				console.vlog("DEBUGEXP: continue")

				 if ((!featureOptions.allow_offer)&&(train))
					{ 
					if (sample.output[0] == "Offer")
				 		{
						console.vlog("Offer no expansion")
				 		callback(null, innerFeatures)	
				 		}
					}
	
				var poses = {}
				var roots = []
	
//				console.vlog("DEBUG train" + train)	
				
				_.each(sample['input']['sentences']['tokens'], function(token, key, list){ 
					// _.each(sentence['tokens'], function(token, key, list){ 	
					poses[token.word.toLowerCase()] = {
														'pos':token.pos,
														'lemma': token.lemma.toLowerCase(),
														'word': token.word.toLowerCase(),
														'neg': false
														}
				}, this)	

//				console.vlog("DEBUGEXP: found tokens: "+JSON.stringify(poses, null, 4))
				
				_.each(sample['input']['sentences']['basic-dependencies'], function(dep, key, list){ 	

					if (dep.dep == "ROOT")
						roots.push(dep.dependentGloss.toLowerCase())

	//				if (dep.dep == "xcomp")
 	//		                       roots.push(dep.dependentGloss.toLowerCase())

					if (dep.dep == "neg")
						{
						poses[dep.governorGloss.toLowerCase()]["neg"] = true
						delete poses[dep.dependentGloss.toLowerCase()]
						
						}
					}, this)	
				// }, this)

			// eliminate number from root
			var roots = _.filter(roots, function(num){ return num.indexOf("0") == -1 });
			
			
			console.vlog("DEBUGEXP: words to expand: " + roots)

//			console.vlog("DEBUGEXP: poses: " + JSON.stringify(poses))
        		callbackl(null, poses, roots);
    		},
		    function(poses, roots, callbackll) {

		//	var allowedpos = ["vb","vbd","vbg","vbn","vbp","vbz","uh","wp","wdt"]

			async.forEachOfSeries(poses, function(token, unigram, callback2){ 
			// async.forEachOfSeries(_.keys(poses), function(unigram, dind, callback2){ 
				if (((!featureOptions.onlyroot) && (stopwords.indexOf(unigram)==-1))
					//|| ((featureOptions.onlyroot) && (roots.indexOf(unigram)!=-1) && (allowedpos.indexOf(token.pos.toLowerCase())!=-1) && (cleaned_tokens.indexOf(unigram)!=-1)))
					|| ((featureOptions.onlyroot) && (roots.indexOf(unigram)!=-1) && (cleaned_tokens.indexOf(unigram)!=-1)))
				{

				// we any case we are taking lemma and verb so take VB pos tag
					
//					if ((featureOptions.onlyroot) && (token.pos.toLowerCase().indexOf("vb")!=-1))
//						token.pos = "VB"

					// if (!(unigram in poses))
						// throw new Error(unigram + " is not found in "+poses)
				
					console.vlog("DEBUGEXP: ready to expand train:" + train + " "+JSON.stringify(token))			

					// async_adapter.getppdb(token.lemma, token.pos, featureOptions.scale, featureOptions.relation,  function(err, results){
					async_adapter.getwordnet(token.lemma, token.pos, function(err, results){
						
						// get rid of phrases				
						// console.vlog("DEBUGEXP: number of results with phrases "+results.length)
						// results = _.filter(results, function(num){ return num[0].indexOf(" ") == -1 })
						// console.vlog("DEBUGEXP: number of results without phrases "+results.length)

						_.each(["synonyms","antonyms"], function(type, key, list){
							// results = _.map(results, function(num){ return num[0] });
							var res = results[type]	

							if ((token.neg) && (type == "synonyms"))
								res = _.map(res, function(num){ return num+"-"; });

							if ((!token.neg) && (type == "antonyms"))
								res = _.map(res, function(num){ return num+"-"; });

							if (!_.isUndefined(featureOptions.best_results))
								res = res.slice(0, featureOptions.best_results)
		
							console.log("DEBUGEXP: type: "+type+ " res: "+res)

							_.each(res, function(expan, key, list){ 	
								var temp = JSON.parse(JSON.stringify(innerFeatures))
								delete temp[token.word+"-"]
								delete temp[token.word]
									// innerFeatures[expan.toLowerCase()] = 1
								temp[expan.toLowerCase()] = 1
								output.push(JSON.parse(JSON.stringify((temp))))
									
								console.vlog("DEBUGEXP: temp: "+JSON.stringify(temp))
							}, this)
						}, this)

						callback2()
					})
				}
				else
				callback2()
			}, function(err){callbackll()})
		}],
		function (err, result) {

			// callback(null, innerFeatures)
			console.vlog("DEBUGEXP: finish with "+output.length +" generated instances")
			callback(null, output)
	     });

//	}
//	else
//	{
//		console.log(process.pid + " DEBUG: callback classify noexpansion"+ train +" "+ _.keys(features))
//		return callback(null, features)	
//	}
	
	// })
}


function feWordnet(sample, features, train, featureOptions, callback) {

	if (!("synonyms" in featureOptions))
		throw new Error("synonyms not in the featureOptions")

	if (!("antonyms" in featureOptions))
		throw new Error("antonyms not in the featureOptions")

	var sentence = ""
	var innerFeatures = JSON.parse(JSON.stringify(features))

	if (!("input" in sample))
		{
		var temp = JSON.parse(JSON.stringify(sample))
		var sample ={'input':temp}
		}

	if (!('sentences' in sample['input']))
		throw new Error("sentences not in the sample")

	console.log(process.pid + " DEBUGWORD: train: "+train + " options: "+JSON.stringify(featureOptions))

	var cleaned = getRule(sample["input"]["sentences"]).cleaned
	var cleaned_tokens = _.map(cleaned.tokens, function(num){ return num.word; });

	async.waterfall([
	//	function(callbackl1){
			// if (((!featureOptions.expand_test) && (train)) || (featureOptions.expand_test))
				// {	
				// console.log("DEBUG: train"+train)
	//			callbackl1(null)
				// }
			 // else
				// {	
				// console.log(process.pid + " DEBUG: callback classify noexpansion"+ train +" "+ _.keys(features))
				// callback(null, innerFeatures)
				// }
	//		},
			function(callbackl) {

				/* if ((!featureOptions.allow_offer)&&(train))
					{ 
					if (sample.output[0] == "Offer")
				 		{
				 		console.log("Offer no expansion")
				 		callback(null, innerFeatures)	
				 		}
					}
	*/
				var poses = {}
				var roots = []
	
				console.log("DEBUG train" + train)	
				
				_.each(sample['input']['sentences']['tokens'], function(token, key, list){ 
					// _.each(sentence['tokens'], function(token, key, list){ 	
					poses[token.word.toLowerCase()] = {
														'pos':token.pos,
														'lemma': token.lemma.toLowerCase(),
														'neg': false,
														'root': false
														}
				}, this)	
				
				_.each(sample['input']['sentences']['basic-dependencies'], function(dep, key, list){ 	
					if (dep.dep == "ROOT")
						poses[dep.dependentGloss.toLowerCase()]["root"] = true

					if (dep.dep == "neg")
						poses[dep.governorGloss.toLowerCase()]["neg"] = true
				}, this)	
				// }, this)

				console.log("DEBUGWORD : poses: " + JSON.stringify(poses))
				// console.log("poses train" + train + " " + JSON.stringify(poses))
        		callbackl(null, poses);
    		},
		    function(poses, callbackll) {

			var allowedpos = ["vb","vbd","vbg","vbn","vbp","vbz","uh","wp","wdt"]

			var poses = _.filter(poses, function(num){ return ((num.root==true) && (allowedpos.indexOf(num.pos)!=-1)) });
	        console.log("DEBUGWORD: poses after root and pos filtering"+JSON.stringify(poses))

			async.eachSeries(poses, function(token, callback5){ 
			// async.forEachOfSeries(_.keys(poses), function(unigram, dind, callback2){ 
				// if (((!featureOptions.onlyroot) && (stopwords.indexOf(unigram)==-1))
					// || ((featureOptions.onlyroot) && (roots.indexOf(unigram)!=-1) && (allowedpos.indexOf(token.pos.toLowerCase())!=-1) && (cleaned_tokens.indexOf(unigram)!=-1)))
			//		if (token.root == false) callback2()
				//{

				// we any case we are taking lemma and verb so take VB pos tag
					
				//	if ((featureOptions.onlyroot) && (token.pos.toLowerCase().indexOf("vb")!=-1))
				//		token.pos = "VB"
					// if (!(unigram in poses))
						// throw new Error(unigram + " is not found in "+poses)
				
					console.log("DEBUGWORD: ready to expand train" + train + " "+JSON.stringify(token))			

					// async_adapter.getppdb(token.lemma, token.pos, featureOptions.scale, featureOptions.relation,  function(err, results){
					async_adapter.getwordnet(token.lemma, token.pos, function(err, results){
						
						// if (results.length == 0) callback5(null)	
						// else
						// {
						// get rid of phrases
						// console.log("DEBUG EXP: results with phrases "+results.length)
						// results = _.filter(results, function(num){ return num[0].indexOf(" ") == -1 })
						// console.log("DEBUG EXP: results without phrases "+results.length)

						// results = _.map(results, function(num){ return num[0] });
						// results = _.uniq(results)	
		
						// if (!_.isUndefined(featureOptions.best_results))
							// results = results.slice(0, featureOptions.best_results)
		
						console.log("DEBUGWORD: results to add: "+token.lemma+": "+results)

/*						_.each(results, function(expan, key, list){ 
						
							// reverse antonyms and synonyms
							if (token.neg) 
							{
								if (expan.indexOf("-")!=-1)
									expan = expan.substr(0,expan.indexOf("-"))
								else
									expan += "-"									
							}

								innerFeatures[expan.toLowerCase()] = 1
							}, this)
*/
						if (featureOptions.synonyms)
						{
							_.each(results["synonyms"], function(value, key, list){
								if (token.neg) value += "-"
								innerFeatures[value.toLowerCase()] = 1
							}, this)
						}

						if (featureOptions.antonyms)
						{
							_.each(results["antonyms"], function(value, key, list){
								if (!token.neg) value += "-"
								innerFeatures[value.toLowerCase()] = 1
							}, this)
						}

						console.log("DEBUGWORD: permanent features: "+token.lemma+": "+JSON.stringify(innerFeatures))
			
						callback5(null)
						// }
					})
				//}
				//else
				//callback2()

			}, function(err){
				console.log("DEBUGWORDERR:"+err)
				callbackll()})
		}],
		function (err, result) {
//			console.log(process.pid + " DEBUG EXP: "+sample.input.text)
			console.log(process.pid + " DEBUG EXP: EXPANSIONED "+_.keys(innerFeatures)+ " train"+train+" featureOptions"+JSON.stringify(featureOptions))
			callback(null, innerFeatures)
	     });

//	}
//	else
//	{
//		console.log(process.pid + " DEBUG: callback classify noexpansion"+ train +" "+ _.keys(features))
//		return callback(null, features)	
//	}
	
	// })
}


function feEmbed(sample, features, train, featureOptions, callback) {

	console.vlog("DEBUGEMBED: sample: "+JSON.stringify(features, null, 4))

/*	if (!("input" in sample))
		{
			var temp = JSON.parse(JSON.stringify(sample))
			var sample ={'input':temp}	
		}
*/	
	if (!('operation' in featureOptions)) throw new Error("operation is not in the featureOptions")

	if (["sum", "extremum"].indexOf(featureOptions.operation)==-1)
		throw new Error("unknown value for featureOptions.operation")		

	var bars = require('./utils/bars')
	var embFeatures = {}
	var embs = []

	if (_.keys(features).length == 0)
		callback(null, {})
	
	async.eachSeries(_.keys(features), function(word, callback1){
		
		var negated = false
		
		// if (featureOptions.minus_neg && word.indexOf("-")!=-1)
		//if (word.indexOf("-")!=-1)
		if (word.substr(-1,1)=="-")
		{
			console.vlog("DEBUGEMB: word: "+word+" is negated")
			word = word.replace(/-/g, '')
			word  = antonyms[word]
			console.vlog("DEBUGEMB: the antonyms is "+word)

			// negated = true
		}

		console.vlog("feEmbed: "+word)
		
		if (word=="ca") word = "can"
		if (word=="n't") word = "not"
		if (word=="wo") word = "will"
		if (word=="'m") word = "am"
		if (word=="'s") word = "us"
		
		async_adapter.getembed(word, featureOptions.embdeddb, function(err, emb){

			if (emb.length != 0)
			{
				// if (negated)
				// {
					// emb =_.map(emb, function(num){ return num * (-1); });
					// console.vlog("DEBUGEMB: word: "+word+" vector is reversed")
				// }

				embs.push(bars.copyobj(emb))
			}	
			callback1()
		})

 	}, function(err) {


		console.vlog("DEBUGEMBED: all vectores are loaded: "+embs.length)
		if (embs.length > 0)		 		
		{
			
			if (featureOptions.operation == "sum")
				var res = bars.vecsumaverage(embs)

			if (featureOptions.operation == "extremum")
				throw new Error("error")
				// var res = bars.vecextremum(embs)

			_.each(res, function(value, key, list){ 
				embFeatures['w2v'+key] = value
			}, this)

			console.vlog("DEBUGEMBED: embFeatures is populated")
	    		
			callback(null, embFeatures)
		}
else
			callback(null, embFeatures)


	})
}	

// function feEmbedAverageUnigram(sample, features, train, featureOptions, callback) {
// 	var sentence = ""
	
// 	if (_.isObject(sample)) 
// 		if ("input" in sample)
// 			sentence = sample.input.text
// 		else
// 			sentence = sample.text

// 	sentence = sentence.toLowerCase().trim()
// 	var words = tokenizer.tokenize(sentence);
// 	var unigrams = _.flatten(natural.NGrams.ngrams(words, 1))

// 	var embs = []
// 	async.eachSeries(unigrams, function(word, callback1){
		
// 		async_adapter.getembed(word, function(err, emb){
// 			embs.push(emb)
// 			callback1()
// 		})

//  	}, function(err) {

//  		var sumvec = Array.apply(null, Array(300)).map(function () { return 0})

//  		_.each(embs, function(value, key, list){ 
// 			sumvec = bars.vectorsum(sumvec, value)
// 		}, this)

// 		if (embs.length > 0)
// 			var sumvec = _.map(sumvec, function(value){ return value/embs.length })

// 		_.each(sumvec, function(value, key, list){ 
// 			features['w2v'+key] = value
// 		}, this)
	
// 		_.each(unigrams, function(value, key, list){ 
// 			features[value] = 1
// 		}, this)

//     	    //console.log(_.keys(features).length)
// 	    callback(null, features)
// 	})	
// }	

/*function feEmbedAverage(sample, features, train, featureOptions, callback) {

	var sentence = ""
	
	if (_.isObject(sample)) 
		if ("input" in sample)
			sentence = sample.input.text
		else
			sentence = sample.text
	else
		sentence = sample

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
}*/


function feSplitted(sample, features, train, featureOptions, callback) {

	var splitted = false

	if ('input' in sample)
		splitted  = sample.input.splitted
	else
		splitted  = sample.splitted

	if (splitted)
		features['IS_SPLITTED'] = 1

	callback(null, features)
}

/*function feNeg(sample, features, train, featureOptions, callback) {

	var sentence = ""
	if ('input' in sample)
		sample = sample.input
	

	if (_.isObject(sample)) 
		if ("input" in sample)
			sentence = sample.input.text
		else
			sentence = sample.text
	else
		sentence = sample

	if (!('input' in sample))
	{	
		var sampleTemp = {}
		sampleTemp['input']= sample
		sample=sampleTemp
	}

	if (!('sentences' in sample['input']))
		throw new Error("sentences not in the sample")

	async.each(sample['input']['sentences'], function(sentence, callbacks) {

		var root = _.find(sentence['basic-dependencies'], function(n){
			return (n.dep == "ROOT")
		});

		var res = _.findIndex(sentence['basic-dependencies'], function(n){
			return (n.dep=="neg" && n.governor == root.dependent)
		});

		if (res!=-1)
			{
				console.log("DEBUGNEG:"+root.dependentGloss+" is negated")
				delete features[root.dependentGloss]
				features[root.dependentGloss+"-"] = 1
			}

    	callbacks();
  
		}, function(err){
			callback(null, features)
    
	})
}
*/

/*function feNeg(sample, features, train, featureOptions, callback) {

	var sentence = ""

	if ('input' in sample)
		sample = sample.input
	
	if (!('sentences' in sample))
		throw new Error("sentences not in the sample")

	if (!('basic-dependencies' in sample['sentences']))
		throw new Error("basic-dependencies not in the sample")

	if (!('tokens' in sample['sentences']))
		throw new Error("tokens not in the sample")

	var samplecopy = JSON.parse(JSON.stringify(sample))
	var word_lemma = {}

	_.each(samplecopy['sentences']['tokens'], function(token, key, list){
		// word_lemma[token.word.toLowerCase()] = token.lemma.toLowerCase()
		word_lemma[token.word.toLowerCase()] = token.lemma.toLowerCase()
	}, this)

	_.each(samplecopy['sentences']['basic-dependencies'], function(dep, key, list){
		if (dep.dep=="neg")
		{
			var lem = word_lemma[dep.governorGloss.toLowerCase()]
			var negword = word_lemma[dep.dependentGloss.toLowerCase()]

			console.vlog("feNeg: "+lem+" is negated "+negword+" is negation word")
			if (lem in features)
			{
				delete features[lem]
				delete features[negword]
				features[lem+"-"] = 1		
			}
		}
	}, this)
	callback(null, features)
}
*/
function feSentiment(sample, features, train, featureOptions, callback) {

	var sentence = ""

	//var sens = ['SENTIMENT_Neutral', 'SENTIMENT_Negative', 'SENTIMENT_Positive']
	var sens = [ 'SENTIMENT_Negative', 'SENTIMENT_Positive']

	if ('input' in sample)
		sample = sample.input
	
	if (!('sentences' in sample))
		throw new Error("sentences not in the sample")

	if (!('sentiment' in sample['sentences']))
		throw new Error("sentiment not in the sample")

	if (!('tokens' in sample['sentences']))
		throw new Error("tokens not in the sample")

	var sen = sample['sentences']['sentiment']
	
	if (sen == "Verypositive") sen = "Positive"
	if (sen == "Verynegative") sen = "Negative"

	features['SENTIMENT_'+sen]=1

	_.each(sens, function(sen, key, list){
		if (!(sen in features))
			features["NON_"+sen] = 1
	}, this)

	if ('SENTIMENT_Neutral' in features)
	{ 
		delete features['SENTIMENT_Neutral']
		delete features['NON_SENTIMENT_Positive']
		delete features['NON_SENTIMENT_Negative']
	}

	callback(null, features)
}


function feSalient(sample_or, features, train, featureOptions, callback) {
	
	var salient = {
		'REJECT':['no', 'not'],
		'QUERY': ['how', 'about', 'let', 'discuss']
	}

	var wh = ["what", "which", "how"]

	var sample = JSON.parse(JSON.stringify(sample_or)) 

	if ('input' in sample)
		sample = sample.input

	console.vlog("DEBUGSALIENT: text : "+ sample.text)	

	var attrval = getRule(sample.sentences, sample.text).labels
	var tokenizer = new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9\-\?]+/});

	text = regexpNormalizer(sample.text.toLowerCase())

	console.vlog("DEBUGSALIENT: normalized: "+text)

	var tkns = _.flatten(natural.NGrams.ngrams(tokenizer.tokenize(text), 1))
	console.vlog("DEBUGSALIENT: tokens: "+tkns)
	  
	 var features_add = {}
	_.each(salient, function(value, key, list){
		var inter = _.intersection(value, tkns).length
		if (inter != 0)
			{
			console.vlog("DEBUGSALIENT: GOT IT " +key+" "+inter)
			features[key] = inter
			}
	}, this)

	if ((_.intersection(tkns, wh).length > 0) && (tkns.indexOf("?")!=-1))
		features["QUERY"] = 1

	if (attrval[1].length != 0)
		delete features["QUERY"]

	if (attrval[1].indexOf("Without leased car") != -1)
		delete features["REJECT"]

	console.vlog("DEBUGSALIENT: "+JSON.stringify(features, null, 4))

	callback(null, features)
}

function feContext(sample_or, features, train, featureOptions, callback) {

	var sample = JSON.parse(JSON.stringify(sample_or)) 

	if (!("full" in featureOptions))
		featureOptions["full"] = false

	if (_.isArray(features))	
		throw new Error("For some reason features is an array")

	if ('input' in sample)
		sample = sample.input

	if (!('context' in sample))
		throw new Error("Hey guys where is a context "+ JSON.stringify(sample))

	var context = sample['context']

	console.vlog("DEBUGCONTEXT: text : "+ sample.text)	
	console.vlog("DEBUGCONTEXT: context " + JSON.stringify(context) + " train "+train+" featureOptions "+JSON.stringify(featureOptions))

	var intents = ["Offer", "Accept", "Reject", "Query", "Greet", "Quit"]
	_.each(intents, function(intent, key, list){
		features["INTENT_"+intent] = 0
	}, this)

	_.each(context, function(label, key, list){
		if (featureOptions.full)
			features["INTENT_"+label] = 1
		
		label = JSON.parse(label)
		var intent = _.keys(label)[0]
		features["INTENT_"+intent] = 1
	}, this)		

	var attrval = getRule({}, sample.text).labels

	var intents = []
	var values = [] 

	console.vlog("DEBUGCONTEXT: labels of the sample "+JSON.stringify(attrval))
	
	if (attrval[0].length > 0)	
        features['THERE_IS_ATTRIBUTES'] = 1
    else
    	features['THERE_IS_NO_ATTRIBUTES'] = 1

    if (attrval[1].length > 0)
        features['THERE_IS_VALUES'] = 1
    else
        features['THERE_IS_NO_VALUES'] = 1
	
	_.each(context, function(feat, key, list){ 
		var obj = JSON.parse(feat)
		if (_.keys(obj)[0] == "Offer")
			values.push(_.values(_.values(obj)[0])[0])
	}, this)

	_.each(attrval[1], function(value, key, list){
		features['OFFEREDVALUE'] = 1
		features['UNOFFEREDVALUE'] = 1
	}, this)

	console.vlog("DEBUGCONTEXT: " + JSON.stringify(features))	
	callback(null, features)
}

function feAsyncPrimitive(sam, features, train, featureOptions, callback) {


	var sample = JSON.parse(JSON.stringify(sam))
	if ("input" in sample)
		sample = sample.input

	if (!('sentences' in sample))
	   throw new Error("for some reason sentences not in sample")

	if (!_.isArray(sample['sentences']))
		sample['sentences'] = [sample['sentences']]

	var tokens = _.compact(_.flatten(_.pluck(sample['sentences'], 'tokens')))

	var words = []
	_.each(tokens, function(token, key, list){
		words.push(token.word.toLowerCase())
	}, this)

	// var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))
	var feature = natural.NGrams.ngrams(words, 1)

	_.each(feature, function(value, key, list){
		features[value] = 1
	}, this)

	console.log("feAsyncPrimitive: train: "+train+" FEATURES: "+JSON.stringify(features, null, 4))
	callback(null, features)
}


function feAsyncPrimitiveClean(sam, features, train, featureOptions, callback) {

	var sample = JSON.parse(JSON.stringify(sam))

	if ("input" in sample)
		sample = sample.input

	if (!('sentences' in sample))
	   throw new Error("for some reason sentences not in sample")

	if (_.isArray(sample['sentences']))
		sample['sentences'] = sample['sentences'][0]

	console.log(JSON.stringify(sample['sentences'], null, 4))

	var rule = getRule(sample["sentences"])
	var attrval = rule.labels

	sample.sentences = rule.cleaned

	console.log("TOKENSAFTERCLEAN: cleaned: "+JSON.stringify(sample.sentences, null, 4))


	//if (!_.isArray(sample['sentences']))
//		sample['sentences'] = [sample['sentences']]

//	var tokens = _.compact(_.flatten(_.pluck(sample['sentences'], 'tokens')))
	var tokens = sample['sentences']['tokens']

	console.log("TOKENSAFTERCLEAN:"+JSON.stringify(tokens, null, 4))

	var words = []
	_.each(tokens, function(token, key, list){
		words.push(token.word.toLowerCase())
	}, this)

	// var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))
	var feature = natural.NGrams.ngrams(words, 1)

	_.each(feature, function(value, key, list){
		features[value] = 1
	}, this)

//	if (attrval[0].length !=0)
//		features["ATT"] = 1

//	if (attrval[1].length !=0)
//		features["VAL"] = 1
	
	console.log("feAsyncPrimitive: train: "+train+" FEATURES: "+JSON.stringify(features, null, 4))
	callback(null, features)
}


/*function feAsync(sam, features, train, featureOptions, callback) {

	var sample = JSON.parse(JSON.stringify(sam))
	//var filtr = ["PRP","IN","CC","DT","PRP$","TO"]
	var filtr = []
	//var lemfil = ['be']
	var lemfil = []
	
	if (!('toextract' in featureOptions))
	           throw new Error("toextract is not defined")

	if ("input" in sample)
		sample = sample.input

	if (!('sentences' in sample))
	   throw new Error("for some reason sentences not in sample "+JSON.stringify(sample))

	if (!('tokens' in sample['sentences']))
	   throw new Error("for some reason tokens not in sample"+JSON.stringify(sample, null, 4))

	if (_.isArray(sample['sentences']))
	   throw new Error("feAsync is only for object sentences")

	// clean the parse tree from attr and values 
	sample.sentences = getRule(sample.sentences).cleaned

	// console.log(JSON.stringify("CLEANED", null, 4))
	// console.log(JSON.stringify(sample.sentences, null, 4))

	// sentence = sentence.toLowerCase().trim()
	// sentence = regexpNormalizer(sentence)
	// var words = tokenizer.tokenize(sentence);

	if (featureOptions.bigrams)
	   throw new Error("this version doesn't support bigrams")

	if (sample['sentences'].length>1)
		throw new Error("feAsync: more than one sentence "+sample['sentences'].length)

	async.eachSeries(sample['sentences']['tokens'], function(token, callback_local) {
	//	if ((filtr.indexOf(token.pos)==-1) && (lemfil.indexOf(token.lemma)==-1))
	//	{
    		if (featureOptions.toextract == "lemma")
		features[token.lemma.toLowerCase()] = 1

	        if (featureOptions.toextract == "word")
	        features[token.word.toLowerCase()] = 1

    		//features[token.word.toLowerCase()] = 1
    		callback_local()
    	//}
    	//else
    	//	callback_local()

 	}, function(err){
	        console.log("DEBUGASYNC:"+JSON.stringify(features, null, 4))
 		callback(null, features)
	})
}
*/


function feAsyncStanfordRoot(sam, features, train, featureOptions, callback) {

	var sample = JSON.parse(JSON.stringify(sam))

	if ("input" in sample)
                sample = sample.input

	if (!('basic-dependencies' in sample['sentences']))
		throw new Error("basic-dependencies not in the sample "+JSON.stringify(sample))

	if (!('sentences' in sample))
	   throw new Error("for some reason sentences not in sample "+JSON.stringify(sample))

	if (!('tokens' in sample['sentences']))
	   throw new Error("for some reason tokens not in sample"+JSON.stringify(sample, null, 4))

	if (_.isArray(sample['sentences']))
	   throw new Error("feAsync is only for object sentences")

	var rootwords = {}
	var negatedwords = []

	_.each(sample['sentences']["basic-dependencies"], function(value, key, list){
		if (value.dep == "ROOT")
			rootwords[value.dependentGloss] = 1

		if (value.dep == "neg")
			negatedwords.push(value.governorGloss)
	}, this)

	console.vlog("feAsyncStanfordRoot: found roots: "+rootwords)
	console.vlog("feAsyncStanfordRoot: found negations: "+negatedwords)

	_.each(negatedwords, function(value, key, list){
		if (value in rootwords)
		{
			delete rootwords[value]
			rootwords[value+"-"] = 1
		}
	}, this)

	console.vlog("DEBUGASYNCSTANFORD: "+rootwords)
 	callback(null, rootwords)
}

function feAsyncStanford(sam, features, train, featureOptions, callback) {

	var sample = JSON.parse(JSON.stringify(sam))

	if (!('clean' in featureOptions))
		throw new Error("no clean option")

	if (!('toextract' in featureOptions))
	    throw new Error("toextract is not defined")

	if (["word","lemma"].indexOf(featureOptions.toextract)==-1)
	    throw new Error("toextract value is unknown")
	
	// apply negation
	if (!('neg' in featureOptions))
	    throw new Error("neg is not defined")

	if ("input" in sample)
		sample = sample.input

/*	if (!('basic-dependencies' in sample['sentences']))
		throw new Error("train:"+train+" basic-dependencies not in the sample "+JSON.stringify(sample))
*/	
/*	if (!('sentences' in sample))
	   throw new Error("for some reason sentences not in sample "+JSON.stringify(sample))
*/
/*	if (!('tokens' in sample['sentences']))
	   throw new Error("for some reason tokens not in sample"+JSON.stringify(sample, null, 4))
*/
	if (_.isArray(sample['sentences']))
	   throw new Error("feAsync is only for object sentences")

	var tokenizer = new natural.RegexpTokenizer({pattern: /[^\%a-zA-Z0-9\-\?]+/});
	text = regexpNormalizer(sample["text"].toLowerCase())
    var tkns = natural.NGrams.ngrams(tokenizer.tokenize(text), 1)
	sample['sentences'] = {"tokens":[]}

	_.each(tkns, function(value, key, list){
                sample['sentences']['tokens'].push({
                        "word": value[0],
                        "lemma": value[0]
                        })
        }, this)

/*	var word_lemma = {}
	_.each(sample['sentences']['tokens'], function(token, key, list){
		word_lemma[token.word.toLowerCase()] = {
									"lemma":token.lemma.toLowerCase(),
									"word":token.word.toLowerCase()
								}
	}, this)
*/
	if (featureOptions.clean)
		{
		sample.sentences = getRule(sample.sentences, sample.text).cleaned
		console.vlog("feAsyncStanford: cleaned: "+JSON.stringify(sample.sentences, null, 4))
		}
	else
		console.vlog("feAsyncStanford: ATTENTION: no clean method")	


	console.vlog("feAsyncStanford: tokens: "+JSON.stringify(sample['sentences']['tokens'], null, 4))

	_.each(sample['sentences']['tokens'], function(token, key, list){
		switch(featureOptions.toextract) {
    		case "lemma": features[token.lemma.toLowerCase()] = 1; break;
    		case "word": features[token.word.toLowerCase()] = 1; break;
        }
	}, this)
	
	console.vlog("DEBUGASYNCSTANFORD:"+JSON.stringify(features, null, 4))
 	callback(null, features)

/*
	async.eachSeries(sample['sentences']['tokens'], function(token, callback_local) {

		switch(featureOptions.toextract) {
    		case "lemma": features[token.lemma.toLowerCase()] = 1; callback_local(); break;
    		case "word": features[token.word.toLowerCase()] = 1; callback_local(); break;
			default: callback_local()
        }
    	
 	}, function(err){

 		if (featureOptions.neg == true)
 		{
 			console.vlog("feAsyncStanford: negation is applied")
	 		_.each(sample['sentences']['basic-dependencies'], function(dep, key, list){
				if (dep.dep=="neg")
				{
				var word = dep.governorGloss.toLowerCase()
				var negword = dep.dependentGloss.toLowerCase()

				console.vlog("feAsyncStanford: feNeg: "+word+" is negated "+negword+" is negation word")
			
					if (word in word_lemma)
					{
										
						if (word_lemma[word][featureOptions.toextract] in features)
                                                {
                                                        //delete features[word_lemma[negword][featureOptions.toextract]]
                                                        delete features[word_lemma[word][featureOptions.toextract]]
                                                        features[word_lemma[word][featureOptions.toextract]+"-"] =  1
                                                }
                                                else
                                                        console.vlog("feNeg: word " + word + " is part of attributes, no need to negate")
                                               	
					}
					else
						throw new Error(word+" not in "+word_lemma)
				}

			}, this)
		}

	    console.vlog("DEBUGASYNCSTANFORD:"+JSON.stringify(features, null, 4))
 		callback(null, features)
	})*/
}

function feAsync(sam, features, train, featureOptions, callback) {

	var sample = JSON.parse(JSON.stringify(sam))
	//var filtr = ["PRP","IN","CC","DT","PRP$","TO"]
	var filtr = []
	//var lemfil = ['be']
	var lemfil = []
	
	// lemma or word
	if (!('toextract' in featureOptions))
		featureOptions["toextract"] = "word"
	    // throw new Error("toextract is not defined")

	if ("input" in sample)
		sample = sample.input

	var sentence = regexpNormalizer(sample.text.toLowerCase().trim())
	var words = tokenizer.tokenize(sentence);
	var tokens = _.flatten(natural.NGrams.ngrams(words, 1))


	tokens = _.map(tokens, function(num){ return {word: num, lemma: num} });
	console.log("DEBUGASYNC: tokens: "+tokens)

	// Lem.lemmatize(tokens, function(err, lemmas) {
		// var zipped = _.zip(tokens, lemmas);
		// var clean_tokens = _.map(zipped, function(num){ return {word: num[0], lemma: num[1]} });

		// console.log("DEBUGASYNC: tokens: "+clean_tokens)
		sample.sentences = {'tokens':tokens}

		console.log(JSON.stringify(sample, null, 4))

		sample.sentences = getRule(sample.sentences).cleaned

		if (sample['sentences'].length>1)
			throw new Error("feAsync: more than one sentence "+sample['sentences'].length)

		async.eachSeries(sample['sentences']['tokens'], function(token, callback_local) {
			if (featureOptions.toextract == "lemma")
				features[token.lemma.toLowerCase()] = 1

	    	if (featureOptions.toextract == "word")
	        	features[token.word.toLowerCase()] = 1

	    	callback_local()
    
 		}, function(err){
	        console.log("DEBUGASYNC:"+JSON.stringify(features, null, 4))
 			callback(null, features)
		})
	// })
}


/*function feAsyncSeq(sam, features, train, featureOptions, callback) {

	var sentence = ""
	var sample = JSON.parse(JSON.stringify(sam))
	
	if ("input" in sample)
		sample = sample.input

	if (!('sentences' in sample))
	   throw new Error("for some reason sentences not in sample")

	if (!('tokens' in sample['sentences']))
	   throw new Error("for some reason tokens not in sample"+JSON.stringify(sample))

	if (!_.isArray(sample['sentences']))
	   throw new Error("feAsyncSeq is only for array of sentences")

	console.log("DEBUGASYNC:")

	async.eachSeries(sample['sentences'], function(sentence, callback_sen) {
		// don't clean in case of composition classification
		// sentence = getRule(sentence).cleaned

		console.log(JSON.stringify("CLEANED", null, 4))
		console.log(JSON.stringify(sentence, null, 4))

		if (featureOptions.bigrams)
		   throw new Error("this version doesn't support bigrams")

		async.eachSeries(sentence['tokens'], function(token, callback_local) {
	    	features[token.word.toLowerCase()] = 1
    		callback_local()
 		}, function(err){
 			callback_sen(null)
		})
	},function(err){
 		callback(null, features)
	})
}
*/
// function featureExtractorUBC(sentence, features) {

// 	if (_.isObject(sentence)) sentence = sentence['text']

// 	sentence = sentence.toLowerCase().trim()
// 	sentence = regexpNormalizer(sentence)

// 	var words = tokenizer.tokenize(sentence);
// 	var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))
// 	// var feature = natural.NGrams.ngrams(words, 1)

// 	_.each(feature, function(feat, key, list){ features[feat] = 1 }, this)

// 	return features;
// }

// function featureExtractorUBContext(sentence, features) {
	
// 	var stopwords = JSON.parse(fs.readFileSync(__dirname+'/stopwords.txt', 'UTF-8')).concat(JSON.parse(fs.readFileSync(__dirname+'/smart.json', 'UTF-8')))

// 	var context = sentence['context']
// 	sentence = sentence['text']

// 	sentence = sentence.toLowerCase().trim()

// 	sentence = regexpNormalizer(sentence)

// 	var attrval = rules.findData(sentence)

// 	var attrs = attrval[0]
// 	var values = attrval[1]

// 	sentence_clean = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
// 	sentence_clean = sentence_clean.replace(/<VALUE>/g,'')
// 	sentence_clean = sentence_clean.replace(/<ATTRIBUTE>/g,'')
// 	sentence_clean = sentence_clean.replace(/NIS/,'')
// 	sentence_clean = sentence_clean.replace(/nis/,'')
// 	sentence_clean = sentence_clean.replace(/track/,'')
// 	sentence_clean = sentence_clean.replace(/USD/,'')
// 	sentence_clean = sentence_clean.trim()


// 	// var words = tokenizer.tokenize(sentence);
// 	var words_clean = tokenizer.tokenize(sentence);
// 	// var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2, '[start]', '[end]'))
// 	// var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2))

// 	var feature_clean = _.flatten(natural.NGrams.ngrams(words_clean, 1))

// 	// _.each(stopwords, function(stopvalue, key, list){
// 		// feature_clean = _.without(feature_clean, stopvalue);
// 	// }, this)

// 	_.each(feature_clean, function(feat, key, list){ features[feat] = 1 }, this)

// 	// if (attrs.length > 0)
// 	// 	_.each(attrs, function(attr, key, list){ features[attr[0]] = 1 }, this)

// 	// if (values.length > 0)
// 	// 	_.each(values, function(value, key, list){ features[value[0]] = 1 }, this)

// 	_.each(context, function(feat, key, list){ 

// 		var obj = JSON.parse(feat)
// 		features["CON_"+_.keys(obj)[0]] = 1 
// 		features["CON_"+_.keys(obj)[0]+"_"+_.keys(_.values(obj)[0])[0]] = 1 

// 	}, this)

// 	return features;
// 	// callback()
// }

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
        multiclass: false,

        learn_args: "-c 100 -t 0",
        // learn_args: "-c 100 -t 2",

        train_command: "svm-train",
        test_command: "svm-predict"

        // learn_args: "-c 100",
        // train_command: "liblinear_train",
        // test_command: "liblinear_test"
});

var SvmLinearBinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.bind(0, {
        binaryClassifierType: SvmLinearBinaryClassifier,
});

var scikitsvm = classifiers.multilabel.BinaryRelevance.bind(0, {
    binaryClassifierType: classifiers.scikit.bind(0, {classifier: "svm"})
});

var scikitdecisiontree = classifiers.multilabel.BinaryRelevance.bind(0, {
    binaryClassifierType: classifiers.scikit.bind(0, {classifier: "decisiontree"})
});

var scikitdecisiontreemulti = classifiers.scikit.bind(0, {classifier: "decisiontree"})
var scikitrandomforestmulti = classifiers.scikit.bind(0, {classifier: "randomforest"})
var scikitadaboostmulti = classifiers.scikit.bind(0, {classifier: "adaboost"})


var scikitrandomforest = classifiers.multilabel.BinaryRelevance.bind(0, {
    binaryClassifierType: classifiers.scikit.bind(0, {classifier: "randomforest"})
});

var scikitadaboost = classifiers.multilabel.BinaryRelevance.bind(0, {
    binaryClassifierType: classifiers.scikit.bind(0, {classifier: "adaboost"})
});




//var SagaeSegmenter =
//	classifiers.multilabel.BinarySegmentation.bind(0, {
//	binaryClassifierType: enhance(SvmPerfBinaryRelevanceClassifier, featureExtractorU, undefined,  new ftrs.FeatureLookupTable()),
//	segmentSplitStrategy: 'cheapestSegment'
//});

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

// function FilterIntents(input)
// {
// 	if ((input.length > 1) && (input.indexOf("Offer") != -1))
// 		return ['Offer']
// 	else
// 		return input
// }

// function featureExtractorLemma(sentence, features) {
// 	var words = trainutils.sentenceStem(sentence)
// 	ftrs.NGramsFromArray(1, 0, words, features);  // unigrams
// 	ftrs.NGramsFromArray(2, 0, words, features);  // unigrams
// 	return features;
// }

// function featureExtractorWords(sentence, features) {
// 	features = ftrs.call(ftrs.NGramsOfWords(1), sentence)
// 	features = _.extend(features, ftrs.call(ftrs.NGramsOfWords(2), sentence))
// 	return features;
// }

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

var Boosting = classifiers.multilabel.Boosting.bind(0, {
	learn_args: "1000", 
	model_file_prefix: "trainedClassifiers/tempfiles/Boosting",
	train_command: "tbb-train",
	test_command: "tbb-predict"
})

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
		feContext:feContext,
		feEmbed:feEmbed,
		feExpansionW:feExpansionW,
		feExpansion:feExpansion,
		feAsync:feAsync,
		feWordnet:feWordnet,
		getRule:getRule,
		// featureExtractorUB: featureExtractorUB,
		// featureExtractorB: featureExtractorB,
		// featureExtractorU: featureExtractorU,
		// featureword2vec:featureword2vec,
		// featureExtractorUnigram: featureExtractorUnigram,
		//instanceFilter: instanceFilterShortString,
//		featureExpansion:featureExpansion,
//		featureExpansionEmpty:featureExpansionEmpty,

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
//		DS_bigram: enhance(SvmLinearBinaryRelevanceClassifier, featureExtractorUBC, undefined, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, true),
		// DS_bigram_split: enhance(SvmLinearBinaryRelevanceClassifier, featureExtractorUBC, inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true),

		DS_comp_embed_d100_avr_root_false_uni_false: enhance(SvmLinearMulticlassifier, [feAsync, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'embdeddb': 9, 'aggregate':'average', 'unigrams':true,'offered':true, 'unoffered':true, 'unigrams':false, 'root':false}),
		DS_comp_embed_d100_avr_root_false_uni_true: enhance(SvmLinearMulticlassifier, [feAsync, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'embdeddb': 9, 'aggregate':'average', 'unigrams':true,'offered':true, 'unoffered':true, 'unigrams':true, 'root':false}),
		DS_comp_embed_d100_avr_root_true_uni_true: enhance(SvmLinearMulticlassifier, [feAsync, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'embdeddb': 9, 'aggregate':'average', 'unigrams':true,'offered':true, 'unoffered':true, 'unigrams':true, 'root':true}),
		DS_comp_embed_d100_avr_root_true_uni_false: enhance(SvmLinearMulticlassifier, [feAsync, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'embdeddb': 9, 'aggregate':'average', 'unigrams':true,'offered':true, 'unoffered':true, 'unigrams':false, 'root':true}),

		DS_comp_embed_d300_average_unoffered: enhance(SvmLinearMulticlassifier, [feAsync, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'embdeddb': 10, 'aggregate':'average', 'allow_stopwords': true, 'unigrams':true, 'bigrams':false, 'offered':false, 'unoffered':true}),
		DS_comp_embed_d50_average_unoffered: enhance(SvmLinearMulticlassifier, [feAsync, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'embdeddb': 8, 'aggregate':'average', 'allow_stopwords': true, 'unigrams':true, 'bigrams':false, 'offered':false, 'unoffered':true}),
		DS_comp_embed_d25_average_unoffered: enhance(SvmLinearMulticlassifier, [feAsync, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'embdeddb': 7, 'aggregate':'average', 'allow_stopwords': true,'unigrams':true, 'bigrams':false,'offered':false, 'unoffered':true }),

		DS_comp_embed_d100_sub_average: enhance(SvmLinearMulticlassifier, [feAsync, feEmbed], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'embdeddb': 5, 'aggregate':'average', 'allow_stopwords': true, 'unigrams':true, 'bigrams':false}),
		DS_comp_embed_d100_dep_average: enhance(SvmLinearMulticlassifier, [feAsync, feEmbed], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'embdeddb': 6, 'aggregate':'average', 'allow_stopwords': true, 'unigrams':true, 'bigrams':false}),
		DS_comp_embed_d100_average: enhance(SvmLinearMulticlassifier, [feAsync, feEmbed], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'embdeddb': 9, 'aggregate':'average', 'allow_stopwords': true, 'unigrams':true, 'bigrams':false}),
		DS_comp_embed_d100_average_context: enhance(SvmLinearMulticlassifier, [feAsync, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'embdeddb': 9, 'aggregate':'average', 'allow_stopwords': true, 'unigrams':true, 'bigrams':false}),

		DS_comp_exp_3_undefined_context_embed_d100_average: enhance(SvmLinearMulticlassifier, [feExpansion, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': true, 'embdeddb': 9, 'aggregate':'average', 'allow_stopwords': true, 'best_results': 5}),

		DS_comp_exp_0_undefined: enhance(SvmLinearMulticlassifier, [feExpansion], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':0, 'onlyroot': false, 'relation': undefined, 'allow_offer': true, 'best_results': undefined}),
		DS_comp_exp_1_undefined: enhance(SvmLinearMulticlassifier, [feExpansion], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':1, 'onlyroot': false, 'relation': undefined, 'allow_offer': true, 'best_results': undefined}),
		DS_comp_exp_2_undefined: enhance(SvmLinearMulticlassifier, [feExpansion], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':2, 'onlyroot': false, 'relation': undefined, 'allow_offer': true, 'best_results': undefined}),
		DS_comp_exp_3_undefined: enhance(SvmLinearMulticlassifier, [feExpansion], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': false, 'relation': undefined, 'allow_offer': true, 'best_results': undefined}),
		DS_comp_exp_3_root_3_unoffered_no_offer_yes_test: enhance(SvmLinearMulticlassifier, [feExpansion, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': false, 'best_results':3, 'offered':false, 'unoffered':true, 'expand_test':true}),
		DS_comp_exp_3_root_3_unoffered_yes_offer_yes_test: enhance(SvmLinearMulticlassifier, [feExpansion, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': true, 'best_results':3, 'offered':false, 'unoffered':true, 'expand_test':true}),
		DS_comp_exp_3_root_7_unoffered_yes_offer_yes_test: enhance(SvmLinearMulticlassifier, [feExpansion, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': true, 'best_results':7, 'offered':false, 'unoffered':true, 'expand_test':true}),
		DS_comp_exp_3_root_5_unoffered_yes_offer_yes_test: enhance(SvmLinearMulticlassifier, [feAsync, feExpansion, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': true, 'best_results':5, 'offered':true, 'unoffered':true, 'expand_test':true}),
		DS_comp_exp_3_root_3_unoffered_yes_offer_no_test: enhance(SvmLinearMulticlassifier, [feExpansion, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': true, 'best_results':3, 'offered':false, 'unoffered':true, 'expand_test':false}),
		DS_comp_exp_3_root_3_unoffered_no_offer_no_test: enhance(SvmLinearMulticlassifier, [feExpansion, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': false, 'best_results':3, 'offered':false, 'unoffered':true, 'expand_test':false}),
		DS_comp_exp_3_undefined_root: enhance(SvmLinearMulticlassifier, [feExpansion], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': true, 'best_results': undefined}),
		DS_comp_exp_3_undefined_root_context_offer: enhance(SvmLinearMulticlassifier, [feExpansion, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': true, 'best_results': 5, 'expand_test':false}),
		DS_comp_exp_3_undefined_root_context: enhance(SvmLinearMulticlassifier, [feExpansion, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': false, 'best_results': 5, 'expand_test':false, 'offered':false, 'unoffered':true}),
		DS_comp_exp_3_undefined_root_context_test: enhance(SvmLinearMulticlassifier, [feExpansion, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': false, 'best_results': 5, 'expand_test':true, 'offered':false, 'unoffered':true}),
		DS_comp_exp_3_undefined_root_context_test_offer: enhance(SvmLinearMulticlassifier, [feExpansion, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': true, 'best_results': 5, 'expand_test':true}),
		DS_comp_exp_3_undefined_root_context_offer: enhance(SvmLinearMulticlassifier, [feExpansion, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': true, 'best_results': 5, 'expand_test':false}),

		DS_comp_exp_3_ref: enhance(SvmLinearMulticlassifier, [feExpansion], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'scale':3, 'onlyroot': false, 'relation': ['ReverseEntailment','Equivalence','ForwardEntailment'], 'allow_offer': true, 'best_results': undefined}),
		
		DS_vanilla_svm: enhance(SvmLinearBinaryRelevanceClassifier, [feAsync], undefined, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, true, {'unigrams':true, 'bigrams':true, 'allow_stopwords':true}),
		
		// DS_comp_unigrams_sync: enhance(SvmLinearMulticlassifier, [feSync], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true}),
		DS_boost_comp_unigrams_async: enhance(Boosting, [feAsync], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true}),

		DS_comp_unigrams_async_context: enhance(SvmLinearMulticlassifier, [feAsync, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true}),
		DS_comp_unigrams_async_context_splitted: enhance(SvmLinearMulticlassifier, [feAsync, feContext, feSplitted], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true}),
		DS_comp_unigrams_bigrams_async: enhance(SvmLinearMulticlassifier, [feAsync], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'unigrams':true, 'bigrams':true, 'allow_stopwords':true}),

		DS_comp_unigrams_async_context_both: enhance(SvmLinearMulticlassifier, [feAsync, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true, 'previous_intent':false}),
		DS_comp_unigrams_async_context_offered: enhance(SvmLinearMulticlassifier, [feAsync, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':false, 'previous_intent':false}),
		
		// DS_comp_unigrams_async_context_unoffered_05: enhance(SvmLinearMulticlassifier, [feAsync, feNeg, feContext, feSentiment], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true}),
		// DS_comp_unigrams_async_context_unoffered_0125: enhance(SvmLinearMulticlassifier, [feAsync, feNeg, feContext, feSentiment], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true}),
//		DS_comp_unigrams_async: enhance(SvmLinearMulticlassifier, [feAsync/*, feNeg, feContext*/], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true}),
		DS_comp_unigrams_async_biased_old: enhance(SvmLinearMulticlassifier, [feAsync, /*feNeg, feContext*/], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true}),
		//DS_comp_unigrams_async_biased: enhance(SvmLinearMulticlassifier, [feAsync, /*feNeg, feContext*/], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true}),
		
//		NLU_Biased_no_rephrase: enhance(SvmLinearMulticlassifier, [feAsync,  feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, /*postProcessor*/false, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'unoffered':true}),
//		NLU_Biased_with_rephrase: enhance(SvmLinearMulticlassifier, [feAsync,  feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, /*postProcessor*/false, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'unoffered':true}),
//		NLU_Biased: enhance(SvmLinearMulticlassifier, [feAsync,  feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent,/*postProcessor*/false, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'unoffered':true}),
//		NLU_Unbiased: enhance(SvmLinearMulticlassifier, [feAsync,  feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, /*postProcessor*/ false, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'unoffered':true}),
//		NLU_Baseline: enhance(SvmLinearMulticlassifier, [feAsync, feNeg, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, /*postProcessor*/ false, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'unoffered':true}),
//		NLU_Exp: enhance(SvmLinearMulticlassifier, [feAsync, feNeg, feExpansion/*feAsync*/,  feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, /*postProcessor*/ false, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'unoffered':true, 'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': false, 'best_results':3, 'offered':false, 'unoffered':true, 'expand_test':false}),


		NLU_Emb_300: enhance(SvmLinearBinaryRelevanceClassifier, [feAsync, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'embdeddb': 10, 'aggregate':'average', 'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'toextract':'word','unoffered':true, }),
		NLU_Emb_100: enhance(SvmLinearBinaryRelevanceClassifier, [feAsync, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'embdeddb': 9, 'aggregate':'average', 'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'toextract':'word','unoffered':true, }),
		NLU_Emb_50: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'embdeddb': 8, 'aggregate':'average', 'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'toextract':'word','unoffered':true, }),
		NLU_Emb_25: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'embdeddb': 7, 'aggregate':'average', 'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'toextract':'word','unoffered':true, }),
		NLU_Emb_Trans_50: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'embdeddb': 8, 'aggregate':'average', 'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'toextract':'word','unoffered':true, }),
		NLU_Emb_Trans_25: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'embdeddb': 7, 'aggregate':'average', 'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'toextract':'word','unoffered':true, }),
		NLU_Emb_Trans_100: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'embdeddb': 9, 'aggregate':'average', 'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'toextract':'word','unoffered':true, }),
		Natural_Trans_Emb: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'operation':'sum', 'embdeddb': 8, 'toextract':'word','unoffered':true, 'offered':true, 'neg':false }),
		Natural_Trans_Emb_Neg: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'operation':'sum', 'embdeddb': 8, 'toextract':'word','unoffered':true, 'offered':true, 'neg':true }),
		Balanced_Trans_Emb: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'operation':'sum', 'embdeddb': 8, 'toextract':'word','unoffered':true, 'offered':true, 'neg':false}),
		Balanced_Trans_Emb_Neg: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'operation':'sum', 'embdeddb': 8, 'toextract':'word','unoffered':true, 'offered':true, 'neg':true}),
		Balanced_Emb: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'operation':'sum', 'embdeddb': 8, 'toextract':'word','unoffered':true, 'offered':true, 'neg':true }),
		Natural_Emb: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'operation':'sum', 'embdeddb': 8, 'toextract':'word','unoffered':true, 'offered':true, 'neg': true }),
		
		// INITIAL
		"Component+Context": enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'neg':false, 'toextract':'word', 'clean': true, 'unoffered':true, 'offered':true,}),
		"Component": enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'neg':false, 'toextract':'word', 'clean': true}),		
		"MYMO": enhance(SvmLinearBinaryRelevanceClassifier, [ feAsyncStanford ], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'neg':false, 'toextract':'word', 'clean': false}),
		"Natural_SVM": enhance(SvmLinearBinaryRelevanceClassifier, [ feAsyncStanford ], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'neg':false, 'toextract':'word', 'clean': false}),
		"Natural_SVM+Context": enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'neg':false, 'toextract':'word', 'clean': false, 'unoffered':true, 'offered':true,}),
		"Natural_ADA": enhance(scikitadaboost, [ feAsyncStanford ], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'neg':false, 'toextract':'word', 'clean': false}),
		"Natural_ADA+Context": enhance(scikitadaboost, [feAsyncStanford, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'neg':false, 'toextract':'word', 'clean': false, 'unoffered':true, 'offered':true,}),
		"Natural_RF": enhance(scikitrandomforest, [ feAsyncStanford ], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'neg':false, 'toextract':'word', 'clean': false}),
		"Natural_RF+Context": enhance(scikitrandomforest, [feAsyncStanford, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'neg':false, 'toextract':'word', 'clean': false, 'offered':true, 'unoffered':true}),
		// INITIAL END


		"Natural+Context": enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'neg':false, 'offered':true, 'toextract':'word','unoffered':true}),

		//Natural_Root: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanfordRoot, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":true}),
		Emb_300: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feSalient], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":false, 'embdeddb': 11, 'operation':'sum'}),
		Emb_200: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feSalient], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":false, 'embdeddb': 10, 'operation':'sum'}),
		Emb_100: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feSalient], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":false, 'embdeddb': 9, 'operation':'sum', "clean": true}),
		Balanced_Emb_100: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feSalient], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":false, 'embdeddb': 9, 'operation':'sum'}),
		Balanced_Emb_100_Hungarian: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feSalient], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":false, 'embdeddb': 9, 'operation':'sum'}),
		

		Emb_50: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feAsyncStanford], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":false, 'embdeddb': 8, 'operation':'sum'}),
		Emb_25: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feAsyncStanford], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":false, 'embdeddb': 7, 'operation':'sum'}),

		// Emb_100_Dep: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feSalient], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":false, 'embdeddb': 1, 'operation':'sum'}),
		// Emb_100_Sub: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feSalient], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":false, 'embdeddb': 2, 'operation':'sum'}),
		// Emb_100_Bow5: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feSalient], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":false, 'embdeddb': 3, 'operation':'sum'}),
		// Emb_100_Bow10: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feSalient], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":false, 'embdeddb': 4, 'operation':'sum'}),
		Emb_100_Hungarian: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feSalient], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":false, 'embdeddb': 9, 'operation':'sum'}),
		Emb_100_German: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feSalient], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":false, 'embdeddb': 9, 'operation':'sum'}),
		Emb_100_All: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feEmbed, feSalient], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {'toextract':'word','unoffered':true, 'offered':true, "neg":false, 'embdeddb': 9, 'operation':'sum'}),
		
		// INTENTS
		"Unigram_SVM": enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {"neg":false, 'toextract':'word', "clean":true}),
		"Unigram+Context_SVM": enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {"neg":false, 'toextract':'word','unoffered':true, 'offered':true, "clean":true}),
		"Unigram+ContextFull_SVM": enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {"neg":false, 'toextract':'word','unoffered':true, 'offered':true, "full": true, "clean":true}),
		"Unigram_ADA": enhance(scikitadaboost, [feAsyncStanford], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {"neg":false, 'toextract':'word', "clean":true}),
        "Unigram+Context_ADA": enhance(scikitadaboost, [feAsyncStanford, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {"neg":false, 'toextract':'word','unoffered':true, 'offered':true, "clean":true}),
		"Unigram_RF": enhance(scikitrandomforest, [feAsyncStanford], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {"neg":false, 'toextract':'word', "clean":true}),
        "Unigram+Context_RF": enhance(scikitrandomforest, [feAsyncStanford, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {"neg":false, 'toextract':'word','unoffered':true, 'offered':true, "clean":true}),
		"Unigram_No_Clean": enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncStanford], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined/*preProcessor_onlyIntent*/, /*postProcessor*/ false, undefined, false, {"neg":false, 'toextract':'word','unoffered':true, 'offered':true, "clean":false}),
		// END INTENTS


		DS_Prim_Clean: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncPrimitiveClean], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, false/*tf-idf*/, {'unigrams':true}),
//		
		//NLU_Biased_no_rephrase: enhance(SvmLinearBinaryRelevanceClassifier, [/*feAsyncPrimitiveClean*/feAsync, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, false, {'unigrams':true, 'offered':false, 'unoffered':true}),
		//NLU_Biased_with_rephrase: enhance(SvmLinearBinaryRelevanceClassifier, [/*feAsyncPrimitiveClean*/feAsync, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, false, {'unigrams':true, 'offered':false, 'unoffered':true}),
		NLU_Biased: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncPrimitiveClean, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, false, {'unigrams':true, 'offered':false, 'unoffered':true}),
		//NLU_Unbiased: enhance(SvmLinearBinaryRelevanceClassifier, [/*feAsyncPrimitiveClean*/feAsync, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, false, {'unigrams':true, 'offered':false, 'unoffered':true, 'toextract': 'word'}),
		//NLU_Oversampled: enhance(SvmLinearBinaryRelevanceClassifier, [feAsync/*feAsyncPrimitiveClean*/, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, false, {'unigrams':true}),

		//NLU_Undersampled: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncPrimitiveClean, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, false, {'unigrams':true}),
		
		DS_Composite_wise: enhance(SvmLinearBinaryRelevanceClassifier, [feAsyncPrimitive], inputSplitter, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, false/*tf-idf*/, {'unigrams':true}),
		DS_Component_wise: enhance(SvmLinearBinaryRelevanceClassifier, [feAsync], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'unoffered':true}),
		
		DS_comp_unigrams_async_1: enhance(SvmLinearMulticlassifier, [feAsync, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true}),
		DS_comp_unigrams_async_05: enhance(SvmLinearMulticlassifier, [feAsync, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true}),
		DS_comp_unigrams_async_00625: enhance(SvmLinearMulticlassifier, [feAsync, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true}),
		DS_comp_unigrams_async_0: enhance(SvmLinearMulticlassifier, [feAsync, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true}),

		DS_comp_unigrams_async_context_unoffered: enhance(SvmLinearMulticlassifier, [feAsync/*, feNeg, feContext*/], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true}),
		DS_comp_unigrams_async_context_unoffered_generated: enhance(SvmLinearMulticlassifier, [feAsync/*, feNeg, feContext*/], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true}),
	
//		DS_comp_unigrams_async_context_unoffered_wordnet_syn: enhance(SvmLinearMulticlassifier, [feAsync, feWordnet, feNeg, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true, 'synonyms': true, 'antonyms': false}),
//		DS_comp_unigrams_async_context_unoffered_wordnet_ant: enhance(SvmLinearMulticlassifier, [feAsync, feWordnet, feNeg, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true, 'synonyms': false, 'antonyms': true}),
//		DS_comp_unigrams_async_context_unoffered_wordnet_ant_syn: enhance(SvmLinearMulticlassifier, [feAsync, feWordnet, feNeg, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':true, 'unoffered':true, 'synonyms': true, 'antonyms': true}),


		// DS_comp_unigrams_sync_context_unoffered: enhance(SvmLinearMulticlassifier, [feAsync, feContextSync], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'unoffered':true, 'previous_intent':false,'car':true}),
		
		DS_comp_unigrams_async_context_unoffered_prev: enhance(SvmLinearMulticlassifier, [feAsync, feContext], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true, 'offered':false, 'unoffered':true, 'previous_intent':true}),

		// DS_comp_unigrams_sync_sim: enhance(SvmLinearMulticlassifier, [feSync], inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true}),

		DS_composition: enhance(SvmLinearBinaryRelevanceClassifier, [feAsync], undefined, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, true, {'unigrams':true, 'bigrams':false, 'allow_stopwords':true})
//		DS_bigram_split_embed: enhance(SvmLinearMulticlassifier, feEmbedAverage, inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false),
//		DS_bigram_split_embed_unig: enhance(SvmLinearMulticlassifier, feEmbedAverageUnigram, inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, false),
//		DS_bigram_split: enhance(SvmLinearBinaryRelevanceClassifier, featureExtractorUBC, inputSplitter, new ftrs.FeatureLookupTable(), undefined, preProcessor_onlyIntent, postProcessor, undefined, true),
//		DS_bigram_kernel: enhance(SvmPerfKernelBinaryRelevanceClassifier, featureExtractorUBContext, undefined, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, true),
		// DS_unigram: enhance(SvmLinearBinaryRelevanceClassifier, featureExtractorU, undefined, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, true),
//		DS_bigram_con: enhance(SvmLinearBinaryRelevanceClassifier, featureExtractorUBContext, undefined, new ftrs.FeatureLookupTable(), undefined, undefined, undefined, undefined, true),
		// DS_rule: rule(SvmPerfBinaryRelevanceClassifier, featureExtractorUBC, new ftrs.FeatureLookupTable(), undefined, true)


};

module.exports.defaultClassifier = module.exports.DS_comp_unigrams_async_context_unoffered

if (!module.exports.defaultClassifier) throw new Error("Default classifier is null");
