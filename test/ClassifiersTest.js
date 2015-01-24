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

// curves.learning_curves(classifiers, data, parameters, 3, 5)

describe('Classifiers functions', function() {

	it('featureExpansion', function() {
		var out = classifiers.featureExpansion(["offer","propose","give"])
		Object.keys(out).length.should.be.above(3)
	})

	it('correctly filters instances', function() {
		classifiers.instanceFilter("1 2  3").should.be.equal.true
	})
	
	it('correctly separate utterance to tokens', function() {
		_.isEqual(classifiers.tokenizer.tokenize("I offer your a salary of 10000"), [ 'I', 'offer', 'your', 'a', 'salary', 'of', '10000' ]).should.equal(true)
		_.isEqual(classifiers.tokenizer.tokenize("I offer your a pension of 15%"), [ 'I', 'offer', 'your', 'a', 'pension', 'of', '15%' ]).should.equal(true)

	})

	it('correctly create bigram', function() {
		var features = {}
		classifiers.featureExtractor("pension,", features)
		// _.isEqual(features,{ pension: 1, '[start] pension': 1, 'pension [end]': 1 }).should.equal(true)
		_.isEqual(features,{ pension: 1 }).should.equal(true)
	});

	//TODO in different domain currency witth have digits after decimal point.

	it('correctly normalize', function() {
		classifiers.normalizer("12,000 NIS").should.equal("12000 nis")
		classifiers.normalizer("12.000 NIS").should.equal("12000 nis")
		classifiers.normalizer("pension 14%").should.equal("pension 14%")
		classifiers.normalizer("14hours").should.equal("14 hours")
		classifiers.normalizer("pension 14 % I offer").should.equal("pension 14% i offer")
		classifiers.normalizer("abc 10,000NIS xyz").should.equal("abc 10000 nis xyz")
		classifiers.normalizer("abc 10.000NIS xyz").should.equal("abc 10000 nis xyz")
		

		classifiers.normalizer("5.450 EGP").should.equal("5450 egp")
		classifiers.normalizer("5,450 EGP").should.equal("5450 egp")
		// process.exit(0)
		// var a  = classifiers.normalizer("10,000NIS")
		// console.log(a)
		// console.log()
		// process.exit(0)
	});


	it('correctly normalize', function() {

		var SvmPerfBinaryClassifier = limdu_classifiers.SvmPerf.bind(0, {
			learn_args: "-c 100 --i 1",   // see http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html 
			model_file_prefix: "trainedClassifiers/tempfiles/SvmPerf",
		});

		var SvmPerfBinaryRelevanceClassifier = limdu_classifiers.multilabel.BinaryRelevance.bind(0, {
			binaryClassifierType: SvmPerfBinaryClassifier,
		});

		var SvmClassifierStringFeatures = limdu_classifiers.EnhancedClassifier.bind(0, 	{
			classifierType: SvmPerfBinaryRelevanceClassifier, 
			featureLookupTable: new ftrs.FeatureLookupTable(),
			normalizer: classifiers.normalizer,
			featureExtractor: classifiers.featureExtractorUnigram,
			multiplyFeaturesByIDF: true,
			TfIdfImpl: natural.TfIdf
		});

		var cl = new SvmClassifierStringFeatures();

		var data = cl.normalizedSample("I offer 10,000NIS or 20.000 NIS and 15  % pension");
		
		data.should.equal("i offer 10000 nis or 20000 nis and 15% pension")

		var features = cl.sampleToFeatures(data, cl.featureExtractors);

		_.isEqual(features, { '10000': 1, '20000': 1, i: 1, offer: 1, nis: 1, or: 1, and: 1, '15%': 1, pension: 1, 'i offer': 1, 'offer 10000': 1, '10000 nis': 1, 'nis or': 1, 'or 20000': 1, '20000 nis': 1, 'nis and': 1, 'and 15%': 1, '15% pension': 1 }).should.equal(true)
		
		// features['@checkfeature'] = 1

		if (cl.tfidf) cl.tfidf.addDocument(features);

		cl.normalizedSample("I offer 10,000NIS or 20.000NIS");

		if (cl.tfidf) cl.tfidf.addDocument(cl.sampleToFeatures(cl.normalizedSample("I offer 10,000NIS or 20.000NIS"), cl.featureExtractors));

		cl.editFeatureValues(features, /*remove_unknown_features=*/false);

		_.isEqual(features, { '10000': 0, '20000': 0, i: 0, offer: 0, nis: 0, or: 0, and: 0.6931471805599453, '15%': 0.6931471805599453, pension: 0.6931471805599453, 'i offer': 0, 'offer 10000': 0, '10000 nis': 0, 'nis or': 0, 'or 20000': 0, '20000 nis': 0, 'nis and': 0.6931471805599453, 'and 15%': 0.6931471805599453, '15% pension': 0.6931471805599453 }).should.equal(true)

	})


})
