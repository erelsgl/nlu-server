/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../classifiers');
var _ = require('underscore');
var limdu_classifiers = require('limdu/classifiers');
var ftrs = require('limdu/features');
var natural = require('natural');
var Hierarchy = require(__dirname+'/../Hierarchy');

var SvmPerfBinaryClassifier = limdu_classifiers.SvmPerf.bind(0, {
	learn_args: "-c 100 --i 1",   // see http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html 
	model_file_prefix: "trainedClassifiers/tempfiles/SvmPerf"
});

var SvmPerfBinaryRelevanceClassifier = limdu_classifiers.multilabel.BinaryRelevance.bind(0, {
	binaryClassifierType: SvmPerfBinaryClassifier
});

describe('Classifiers functions', function() {

	// it('word2vec', function() {
	// 	var features = []
	// 	var output = classifiers.featureword2vec('the of', features)
	// 	Object.keys(features).length.should.equal(300)
	// 	features['w2v299'].should.equal((-0.0599376048847 + 0.0405294302343)/2)
	// })

	// it('featureExpansion', function() {
	// 	// phrase:
	// 	// 0 - everything
	// 	// 1 - only unigram seed generated unigram paraphrase

	// 	var out1 = classifiers.featureExpansion(["offer","propose","give"], '[1]', 0)
	// 	var out2 = classifiers.featureExpansion(["offer","propose","give"], '[2]', 0)

	// 	Object.keys(out2).length.should.be.above(Object.keys(out1).length)
	// })
	
	it('correctly separate utterance to tokens', function() {
		// console.log(classifiers.tokenizer.tokenize("I offer your a pension of 15%"))
		// process.exit(0)

		_.isEqual(classifiers.tokenizer.tokenize("I offer your a salary of 10000"), [ 'I', 'offer', 'your', 'a', 'salary', 'of', '10000' ]).should.equal(true)
		// _.isEqual(classifiers.tokenizer.tokenize("I offer your a pension of 15%"), [ 'I', 'offer', 'your', 'a', 'pension', 'of', '15%' ]).should.equal(true)
	})

	//TODO in different domain currency witth have digits after decimal point.

	it('correctly normalize', function() {

		// console.log(JSON.stringify(classifiers.normalizer("10hours"), null, 4))
		// process.exit(0)

		classifiers.normalizer("12,000 NIS").should.equal("12000 nis")
		classifiers.normalizer("12.000 NIS").should.equal("12000 nis")
		classifiers.normalizer("pension 14%").should.equal("pension 14%")
		// classifiers.normalizer("14hours").should.equal("14 hours")
		classifiers.normalizer("pension 14 % I offer").should.equal("pension 14% i offer")
		// classifiers.normalizer("abc 10,000NIS xyz").should.equal("abc 10000 nis xyz")
		// classifiers.normalizer("abc 10.000NIS xyz").should.equal("abc 10000 nis xyz")
		classifiers.normalizer("5.450 EGP").should.equal("5450 egp")
		classifiers.normalizer("5,450 EGP").should.equal("5450 egp")
	});


	it('correctly normalize', function() {

		var SvmClassifierStringFeatures = limdu_classifiers.EnhancedClassifier.bind(0, 	{
			classifierType: SvmPerfBinaryRelevanceClassifier, 
			featureLookupTable: new ftrs.FeatureLookupTable(),
			normalizer: classifiers.normalizer,
			featureExtractor: classifiers.featureExtractorUB,
			multiplyFeaturesByIDF: true,
			TfIdfImpl: natural.TfIdf
		});

		var cl = new SvmClassifierStringFeatures();

		var data = cl.normalizedSample("I offer 10,000NIS or 20.000 NIS and 15  % pension");
		
		data.should.equal("i offer 10000 nis or 20000 nis and 15% pension")

		var features = cl.sampleToFeatures(data, cl.featureExtractors);

		_.isEqual(features, { '10000': 1, '20000': 1, i: 1, offer: 1, nis: 1, or: 1, and: 1, '15%': 1, pension: 1, 'i offer': 1, 'offer 10000': 1, '10000 nis': 1, 'nis or': 1, 'or 20000': 1, '20000 nis': 1, 'nis and': 1, 'and 15%': 1, '15% pension': 1 }).should.equal(true)
		
		if (cl.tfidf) cl.tfidf.addDocument(features);

		cl.normalizedSample("I offer 10,000NIS or 20.000NIS");

		if (cl.tfidf) cl.tfidf.addDocument(cl.sampleToFeatures(cl.normalizedSample("I offer 10,000NIS or 20.000NIS"), cl.featureExtractors));

		cl.editFeatureValues(features, /*remove_unknown_features=*/false);

		var gold = { '10000': 0.5945348918918356,'20000': 0.5945348918918356,i: 0.5945348918918356,offer: 0.5945348918918356,
	  				nis: 0.5945348918918356, or: 0.5945348918918356, and: 1, '15%': 1,
  					pension: 1, 'i offer': 0.5945348918918356, 'offer 10000': 0.5945348918918356,
  					'10000 nis': 0.5945348918918356, 'nis or': 0.5945348918918356, 'or 20000': 0.5945348918918356, '20000 nis': 0.5945348918918356, 'nis and': 1, 'and 15%': 1, '15% pension': 1 }

		// _.isEqual(features, { '10000': 0, '20000': 0, i: 0, offer: 0, nis: 0, or: 0, and: 0.6931471805599453, '15%': 0.6931471805599453, pension: 0.6931471805599453, 'i offer': 0, 'offer 10000': 0, '10000 nis': 0, 'nis or': 0, 'or 20000': 0, '20000 nis': 0, 'nis and': 0.6931471805599453, 'and 15%': 0.6931471805599453, '15% pension': 0.6931471805599453 }).should.equal(true)
		_.isEqual(features, gold).should.be.true

	})

	// it('correctly classify IDF and Binary', function() {

	// 	var classifiertype =  classifiers.enhance(classifiers.PartialClassification
	// 		(classifiers.SvmPerfBinaryRelevanceClassifier), classifiers.featureExtractorU, 
	// 		undefined, new ftrs.FeatureLookupTable(),undefined, Hierarchy.splitPartEqually, 
	// 		Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent, false, classifiers.featureExpansionEmpty)
		
	// 	var classifier = new classifiertype();

	// 	var dataset = [
	// 		{input:"aaa bbb ccc", output:[{Insist: true}]},
	// 		{input:"aaa bbb", output:[{Insist: true}]},
	// 		{input:"ccc", output:[{Insist: true}]},
	// 		{input:"bbb ccc", output:[{Insist: true}]}
	// 		]

	// 	classifier.trainBatch(dataset)

	// 	_.isEqual(classifier.featureLookupTable["featureNameToFeatureIndex"], {
 //        	"undefined": 0,"aaa": 1,"bbb": 2,"ccc": 3}).should.be.true

	// 	var input = "I classify aaa and ddd aaa"
	// 	input = classifier.normalizedSample(input);
	// 	var features = classifier.sampleToFeatures(input, classifier.featureExtractors);
	// 	_.isEqual(features, { i: 1, classify: 1, aaa: 1, and: 1, ddd: 1 }).should.be.true

	// 	classifier.editFeatureValues(features, /*remove_unknown_features=*/false);
	// 	_.isEqual(features, { i: 1, classify: 1, aaa: 1, and: 1, ddd: 1 }).should.be.true

	// 	var classifiertype1 =  classifiers.enhance(classifiers.PartialClassification
	// 		(classifiers.SvmPerfBinaryRelevanceClassifier), classifiers.featureExtractorU, 
	// 		undefined, new ftrs.FeatureLookupTable(),undefined, Hierarchy.splitPartEqually, 
	// 		Hierarchy.retrieveIntent,  Hierarchy.splitPartEquallyIntent, true, classifiers.featureExpansionEmpty)

		
	// 	var classifier1 = new classifiertype1();
	// 	classifier1.trainBatch(dataset)
	// 	input = classifier1.normalizedSample(input);
	// 	var features = classifier1.sampleToFeatures(input, classifier1.featureExtractors);
	// 	classifier1.editFeatureValues(features, /*remove_unknown_features=*/false);

	// 	_.isEqual(features, { i: 2.386294361119891,classify: 2.386294361119891,aaa: 1.2876820724517808,and: 2.386294361119891,ddd: 2.386294361119891 }).should.be.true

	// })

})
