/**
 * Static utility function for training and testing classifiers.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var fs = require('fs');
var _ = require('underscore')._;
var utils = require('limdu/utils/list');
var hash = require('limdu/utils/hash');
var PrecisionRecall = require("limdu/utils/PrecisionRecall");
var list = require('limdu/utils/list');
var async = require('async');

/**
 * A short light-weight test function. Tests the given classifier on the given dataset, and 
 * writes a short summary of the mistakes and total performance.
 * @param explain level of explanations for mistakes (0 for none) 
 */

module.exports.testLite = function(classifier, testSet, explain) {
	var currentStats = new PrecisionRecall();
	
 	labeltree = {}

    if ((typeof classifier.TestSplitLabel === 'function')) {
		testSet = classifier.outputToFormat(testSet)
    }

    for (var i=0; i<testSet.length; ++i) {
		expectedClasses = list.listembed(testSet[i].output)
		// classified = classifier.classify(testSet[i].input, 10, testSet[i].input);
		classified = classifier.classify(testSet[i].input);

		// console.log(JSON.stringify(classified, null, 4))
		// process.exit(0)

		actualClasses = list.listembed(classified)

		for (type in  classified.explanation)
		{
			for (label in classified.explanation[type])
				{
					if (!(label in labeltree))
						{
						labeltree[label] = {}
						labeltree[label]['positive'] = {}
						labeltree[label]['negative'] = {}
						}

					_.each(classified.explanation[type][label], function(value, key, list){ 
						if (!(value[0] in labeltree[label][type]))
							{
							labeltree[label][type][value[0]] = {}
							labeltree[label][type][value[0]]['count'] = 0
							labeltree[label][type][value[0]]['weight'] = 0
							}

						labeltree[label][type][value[0]]['count'] = labeltree[label][type][value[0]]['count']+ 1
						labeltree[label][type][value[0]]['weight'] = labeltree[label][type][value[0]]['weight'] + value[1]
						}, this)
				}
		}
		
		// var expectedClasses = normalizeClasses(dataset[i].output); 
		// var actualClassesWithExplanations = classifier.classify(dataset[i].input, explain, dataset[i].input);		
		// actualClasses = (actualClassesWithExplanations.classes? actualClassesWithExplanations.classes: actualClassesWithExplanations);
		// actualClasses.sort();
		// if (!_(expectedClasses).isEqual(actualClasses)) {
		// 	console.log(
		// 		"\t"+JSON.stringify(dataset[i].input)+":"+
		// 		" expected "+expectedClasses+
		// 		" but got "+(explain>0? JSON.stringify(actualClassesWithExplanations,null,"\t"): actualClasses));
		// }
		// currentStats.addCases(expectedClasses, actualClasses);
	}

	for (label in labeltree)
	{
		for (type in labeltree[label])
		{
			lis = []

			for (label1 in labeltree[label][type])
			{
				lis.push([label1,labeltree[label][type][label1]['count'], labeltree[label][type][label1]['weight']])
			}

		labeltree[label][type]['LIST'] = _.sortBy(lis, function(num){ return Math.abs(num[2]); });
		}
	}


	for (label in labeltree)
	{
		for (type in labeltree[label])
		{
		console.log(label+" "+type)
		console.log(JSON.stringify(labeltree[label][type]['LIST'].reverse().slice(0,10), null, 4))
		}

	}


	console.log("SUMMARY: "+currentStats.calculateStats().shortStats());
	return currentStats;
};

module.exports.testLite1 = function(classifier, testSet, explain) {
	var currentStats = new PrecisionRecall();
    labeltree = utils.labeltree(testSet)

    ambig = []
    for (var i=0; i<testSet.length; ++i) {
    	expectedClasses = testSet[i].output
		actualClasses = classifier.classify(testSet[i].input);
		amb = utils.intent_attr_label_ambiguity(actualClasses, labeltree)
		if (amb.length >0) ambig.push(amb)
    }
    // console.log(JSON.stringify(ambig, null, 4))
 	console.log(ambig.length)
    // process.exit(0)
}
/**
 * Test the given classifier on the given test-set, the result is detailed with with all input data.
 * the method is still in developemnt and the output data might be changed
 * @param classifier a (trained) classifier.
 * @param testSet array with objects of the format: {input: "sample1", output: "class1"}
 * @param verbosity [int] level of details in log (0 = no log)
 * @param microAverage, macroSum [optional; output] - objects of type PrecisionRecall, used to return the results. 
 * @return the currentStats.
 * @author Vasily Konovalov
 */
module.exports.test_hash = function( classifier, testSet1, verbosity, microAverage, macroSum, sequence) {
	var stat_hash = {}
	var sentence_hash = {}
	var data_stats = []
	var currentStats = []
	var data_stats = []
	var indexes = []
	var startTime = new Date();
	var explain = 50;

	// testSetOriginal = utils.clonedataset(testSet1)

	// if ((typeof classifier.TestSplitLabel === 'function')) 
		// testSet = classifier.outputToFormat(testSet1)
    // else
    testSet = JSON.parse(JSON.stringify(testSet1, null, 4))

	currentStats = new PrecisionRecall()

	for (var i=0; i<testSet.length; ++i) 
	{
		var id = 0
		if ("$" in testSet[i]['input'])
				if ("NEWID" in testSet[i]['input']['$'])
					id = testSet[i]['input']['$']['NEWID']	

			if ("_id" in testSet[i]['input'])
				id = testSet[i]['input']['_id']	


		// if (i % 100)
			// console.log("Test index is " +  i + " from " + testSet.length + " ID " + id)

		// expectedClasses = list.listembed(testSet[i].output)
		expectedClasses = testSet[i].output

		// console.log(JSON.stringify(testSet[i], null, 4))
		// classified = classifier.classify(testSet[i].input, 50, testSet[i].input)
		// classesWithExplanation = classifier.classify(testSet[i].input, explain, true, testSet[i].output, classifier_compare)
		classesWithExplanation = classifier.classify(testSet[i].input, explain, true, testSet[i])
		

		// console.log(JSON.stringify(classesWithExplanation, null, 4))
		// console.log("-----------------------")

		// if (explain > 0)
			// classes = classesWithExplanation.classes
		// else
			// classes = classesWithExplanation
		// actualClasses = list.listembed(classes)
	
		actualClasses = classesWithExplanation.classes
	
		// _(expectedClasses.length).times(function(n){
			// if (currentStats.length<n+1) 
				// {	
				// currentStats.push(new PrecisionRecall())
				// data_stats.push([])
				// }


			var sentence_hash = {}
			data_stats.push(sentence_hash);
			expl = currentStats.addCasesHash(expectedClasses, actualClasses, (verbosity>2));
			currentStats.addCasesLabels(expectedClasses, actualClasses);
			sentence_hash['input'] = testSet[i].input['input'];
			// sentence_hash['expected'] = expectedClasses[n];
			// sentence_hash['classified'] = actualClasses[n];
			sentence_hash['id'] = id
			sentence_hash['expansioned'] = classesWithExplanation.expansioned
			sentence_hash['features'] = classesWithExplanation.features
			sentence_hash['explanation'] = expl;

			sentence_hash['explanation_source'] = {}

			_.each(_.unique(_.flatten(_.toArray(expl))), function(lab, key, list){ 
				sentence_hash['explanation_source'][lab] = _.filter(classesWithExplanation.explanation['all'][lab], function(num){ return num[1] != 0 })
			}, this)
			
			if ('expansioned' in classesWithExplanation)
			{
				var label = actualClasses[0]
				var explan = _.object(sentence_hash['explanation_source'][label])

				_.each(sentence_hash['expansioned'], function(value, key, list){ 
					var exp = []
					
					_.each(value['expansion_with_context'], function(valuep, key, list){
						if (valuep in explan)
							exp.push([valuep, explan[valuep]])
						else
							exp.push([valuep, 0])

					}, this)
					
					if (exp.length > 0)
						sentence_hash['expansioned'][key]['expansion_with_context_result'] = exp 
				
					var exp = []

					_.each(value['expansion_without_context'], function(valuep, key, list){
						if (valuep in explan)
							exp.push([valuep, explan[valuep]])
						else
							exp.push([valuep, 0])

					}, this)
					
					if (exp.length > 0)
						sentence_hash['expansioned'][key]['expansion_without_context_result'] = exp 
				
				
				}, this)

			}

			data_stats.push(sentence_hash);

			// sentence_hash['expected original'] = testSetOriginal[i]['output']
			// sentence_hash['classified original'] = classified
			
		
		// if (microAverage) microAverage.addCases(expectedClasses, actualClasses);

	}
	
	// testResult = []

		// _(expectedClasses.length).times(function(n){
		classifierstats = {}
		classifierstats['labels'] = currentStats.retrieveLabels()
		classifierstats['data'] = data_stats
		classifierstats['stats'] = currentStats.retrieveStats()
		// testResult.push(classifierstats)
		// }, this)

	return classifierstats
};





module.exports.testBatch_async = function(classifier, testSet, callback) {

	var testStart = new Date().getTime()

	classifier.classifyBatch_async(testSet, function(err, results){
		
		var testEnd = new Date().getTime()
		results['testtime'] = testEnd - testStart
		callback(err, results)
	})
}

module.exports.test_async = function(classifier, testSet, callback) {

	var data_stats = []
	currentStats = new PrecisionRecall()

	var testStart = new Date().getTime()

	async.forEachOfSeries(testSet, function (testRecord, testKey, callback1) {

		// console.log("Test "+testKey+" from "+testSet.length)

		if (_.isUndefined(testRecord))
			callback1()

		classifier.classify_async(testRecord["input"], testRecord, function(error, classesWithExplanation){
			actualClasses = classesWithExplanation.classes

			currentStats.addCasesLabels(testRecord.output, actualClasses);

			classesWithExplanation['explanation'] = currentStats.addCasesHash(testRecord.output, actualClasses, true)
			classesWithExplanation["input"] = testRecord.input['input']
			data_stats.push(classesWithExplanation)
			callback1()

		})
	}, function(err){

		var testEnd = new Date().getTime()		
		
		classifierstats = {}
		classifierstats['labels'] = currentStats.retrieveLabels()
		classifierstats['data'] = data_stats
		classifierstats['stats'] = currentStats.retrieveStats()
		classifierstats['testtime'] = testEnd - testStart

		callback(err, classifierstats)
	})
}

/**
 * Test the given classifier on the given test-set.
 * @param classifier a (trained) classifier.
 * @param testSet array with objects of the format: {input: "sample1", output: "class1"}
 * @param verbosity [int] level of details in log (0 = no log)
 * @param microAverage, macroSum [optional; output] - objects of type PrecisionRecall, used to return the results. 
 * @return the currentStats.
 */
module.exports.test = function(
	classifier, testSet, 
	verbosity, microAverage, macroSum) {

	if (typeof classifier.OutputSplitLabel === 'function') {
		testSet = classifier.outputToFormat(testSet)
    }

	var currentStats = new PrecisionRecall();
	for (var i=0; i<testSet.length; ++i) {
		var expectedClasses = normalizeClasses(testSet[i].output);
		var actualClasses = classifier.classify(testSet[i].input);
		var explanations = currentStats.addCases(expectedClasses, actualClasses, (verbosity>2));
		currentStats.addCasesLabels(expectedClasses, actualClasses);
		if (verbosity>1 && explanations.length>0) console.log("\t"+testSet[i].input+": \n"+explanations.join("\n"));
		if (microAverage) microAverage.addCases(expectedClasses, actualClasses);
	}
	currentStats.calculateStats();
	if (macroSum) hash.add(macroSum, currentStats.fullStats());
	return currentStats;
};

/**
 * Compare two classifiers on the same dataset. 
 * writes a short summary of the differences between them and total performance.
 * @param explain level of explanations for mistakes (0 for none) 
 */
module.exports.compare = function(classifier1, classifier2, dataset, explain) {
	var currentStats = []
	var data_stats = []


	explain = 50
	verbosity = explain

	testSetOriginal = utils.clonedataset(dataset)

	if ((typeof classifier1.TestSplitLabel === 'function')) {
		testSet1 = classifier1.outputToFormat(dataset)
    }
    else
    {
    	testSet1 = dataset
    }

    if ((typeof classifier2.TestSplitLabel === 'function')) {
		testSet2 = classifier2.outputToFormat(dataset)
    }
    else
    {
    	testSet2 = dataset
    }


	for (var i=0; i<testSetOriginal.length; ++i) 
	{
		expectedClasses = list.listembed(testSetOriginal[i].output)
		// expectedClasses2 = list.listembed(testSet2[i].output)

		// classified = classifier.classify(testSet[i].input, 50, testSet[i].input)
		classesWithExplanation1 = classifier1.classify(testSet1[i].input, explain, true, testSet1[i].output)
		classesWithExplanation2 = classifier2.classify(testSet2[i].input, explain, true, testSet2[i].output)


		if (explain > 0)
		{	
			classes1 = classesWithExplanation1.classes
			classes2 = classesWithExplanation2.classes
		}
		else
		{
			classes1 = classesWithExplanation1
			classes2 = classesWithExplanation2
		}

		actualClasses1 = list.listembed(classes1)
		actualClasses2 = list.listembed(classes2)

		_(expectedClasses.length).times(function(n){
			if (currentStats.length<n+1) 
				{	
				currentStats.push(new PrecisionRecall())
				data_stats.push([])
				}

			var sentence_hash = {}
			data_stats[n].push(sentence_hash);
			expl1 = currentStats[n].addCasesHash(expectedClasses[n], actualClasses1[n], (verbosity>2));
			expl2 = currentStats[n].addCasesHash(expectedClasses[n], actualClasses2[n], (verbosity>2));
			// console.log(expl1)
			// console.log(expl2)

			if (!(_.isEqual(expl1,expl2)))
				{
					console.log(testSetOriginal[i].input)
					console.log(expl1)
					console.log(expl2)
				}
			// currentStats[n].addCasesLabels(expectedClasses[n], actualClasses[n]);
			// sentence_hash['input'] = testSet[i].input;
			// sentence_hash['expected'] = expectedClasses[n];
			// sentence_hash['classified'] = actualClasses[n];
			// sentence_hash['explanation'] = expl;
			// sentence_hash['expected original'] = testSetOriginal[i]['output']
			// sentence_hash['classified original'] = classified
			})	
		
		// if (microAverage) microAverage.addCases(expectedClasses, actualClasses);

	}
	
	// testResult = []

		// _(expectedClasses.length).times(function(n){
		// classifierstats = {}
		// classifierstats['labels'] = currentStats[n].retrieveLabels()
		// classifierstats['data'] = data_stats[n]
		// classifierstats['stats'] = currentStats[n].retrieveStats()
		// testResult.push(classifierstats)
		// }, this)testSetOriginal

	// return testResult
};


	// for (var i=0; i<dataset.length; ++i) {
	// 	var expectedClasses = normalizeClasses(dataset[i].output); 
	// 	var actualClassesWithExplanations1 = classifier1.classify(dataset[i].input, explain);
	// 	var actualClassesWithExplanations2 = classifier2.classify(dataset[i].input, explain);
	// 	actualClasses1 = (explain>0? actualClassesWithExplanations1.classes: actualClassesWithExplanations1);
	// 	actualClasses2 = (explain>0? actualClassesWithExplanations2.classes: actualClassesWithExplanations2);
	// 	actualClasses1.sort();
	// 	actualClasses2.sort();
	// 	if (!_(actualClasses1).isEqual(actualClasses2)) {
	// 		console.log("\t"+JSON.stringify(dataset[i].input)+
	// 			" : classes1="+(explain>0? JSON.stringify(actualClassesWithExplanations1,null,"\t"): actualClasses1)+
	// 			" ; classes2="+(explain>0? JSON.stringify(actualClassesWithExplanations2,null,"\t"): actualClasses2)+
	// 			"");
	// 		if (_(actualClasses1).isEqual(expectedClasses)) {
	// 			console.log("\t\tClassifier1 is correct");
	// 		} else if (_(actualClasses2).isEqual(expectedClasses)) {
	// 			console.log("\t\tClassifier2 is correct");
	// 		} else {
	// 			console.log("\t\tboth are incorrect");
// 			}
// 		}
// 	}
// };

/**easy
 * Split the given dataset to two datasets: 
 ** easy (the classifier gets right), 
 ** and hard (the classifier errs).  
 */
module.exports.splitToEasyAndHard = function(classifier, dataset) {
	var easyDataset = [];
	var hardDataset = [];
	for (var i=0; i<dataset.length; ++i) {
		var expectedClasses = normalizeClasses(dataset[i].output); 
		var actualClasses = classifier.classify(dataset[i].input);
		actualClasses.sort();
		if (_(expectedClasses).isEqual(actualClasses)) {
			easyDataset.push(dataset[i]);
		} else {
			hardDataset.push(dataset[i]);
		}
	}
	return {easy: easyDataset, hard: hardDataset};
};

/**
 * Test the given classifier-type on the given train-set and test-set.
 * @param createNewClassifierFunction a function that creates a new, empty, untrained classifier
 * @param trainSet, testSet arrays with objects of the format: {input: "sample1", output: "class1"}
 * @param verbosity [int] level of details in log (0 = no log)
 * @param microAverage, vmacroSum [output] - objects of type PrecisionRecall, used to return the results. 
 * @return the currentStats.
 */
module.exports.trainAndTestLite = function(
		createNewClassifierFunction, 
		trainSet1, testSet1, 
		verbosity, microAverage, macroSum) {
		// TRAIN:

		trainSet = utils.clonedataset(trainSet1)
		testSet = utils.clonedataset(testSet1)

		var classifier = createNewClassifierFunction();

		if (verbosity>0) console.log("\nstart training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes': ''));
		var startTime = new Date();
		classifier.trainBatch(trainSet);
		var elapsedTime = new Date()-startTime;
		if (verbosity>0) console.log("end training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes, ': '')+elapsedTime+" [ms]");
	
		// TEST:
		return module.exports.testLite(classifier, testSet, /*explain=*/verbosity-1);
};

function label_enrichment(dataset, func)
	{	
		aggreg = []

		_.each(dataset, function(value, key, list){ 
			_.each(func(value.output), function(value1, key1, list){
				if (aggreg.length<=key1)
					aggreg.push([])
				aggreg[key1] = aggreg[key1].concat(value1) 
				}, this)
		}, this)

		_.each(aggreg, function(value, key, list){ 
			aggreg[key] = _.countBy(value, function(num) {return num});
			}, this)

		return aggreg
	}

/**
 * Test the given classifier-type on the given train-set and test-set and return a hash.
 * The only difference between trainAndTest_hash and trainAndTest is trainAndTest_hash doesn't allow inner console.log 
 * calls to test_hash method and allocate all statistics in hash, the method is still in development
 * @param createNewClassifierFunction a function that creates a new, empty, untrained classifier
 * @param trainSet, testSet arrays with objects of the format: {input: "sample1", output: "class1"}
 * @param verbosity [int] level of details in log (0 = no log)
 * @param microAverage, macroSum [output] - objects of type PrecisionRecall, used to return the results. 
 * @return the currentStats.
 * @author Vasily Konovalov
 */

module.exports.trainAndTest_async = function(classifierType, trainSet, testSet, callback) {

	var classifier = new classifierType()

	var trainStart = new Date().getTime()

	classifier.trainBatch_async(trainSet, function(err, results){
		var trainEnd = new Date().getTime()
		module.exports.testBatch_async(classifier, testSet, function(error, results){
		// module.exports.test_async(classifier, testSet, function(error, results){
		results['traintime'] = trainEnd - trainStart
		callback(error, results)
		})
	})
}

module.exports.trainAndTest_hash = function(
		classifierType, 
		trainSet, testSet, 
		verbosity, microAverage, macroSum) {
		var startTime = new Date();
		var classifier = new classifierType();
		TrainCountEmbed = true

		testSet1 = JSON.parse(JSON.stringify(testSet))
		
		trainSet1 = JSON.parse(JSON.stringify(trainSet))

		// if ((typeof classifier.InputSplitLabel === 'function')) {
 	// 		agghash = label_enrichment(trainSet1, classifier.InputSplitLabel)
 	// 	}


 		// var classifier_compare = new classifierType1()

 		// classifier_compare.trainBatch(utils.clonedataset(trainSet1))

 		// console.log(trainSet1)
		classifier.trainBatch(trainSet1);

		console.log("classifier is trained")


		// stat_hash = module.exports.test_hash(classifier, testSet1, verbosity, microAverage, macroSum, classifier_compare);
		var stat_hash = module.exports.test_hash(classifier, testSet1, verbosity, microAverage, macroSum);
		
		// stat_hash['train_time'] = new Date()-startTime;


		// if (TrainCountEmbed)
		// {
		// _.each(stat_hash, function(value, key, list){ 
		// 	_.each(agghash, function(value1, key1, list){ 
		// 		_.each(value1, function(count, label, list){
		// 			if (label in value['labels'])
		// 				stat_hash[key]['labels'][label]['Train'] = count 
		// 			}, this)
		// 		}, this)
		// 	}, this)
		// }

		return stat_hash;
};

/*
trainAndTest_batch is created solely for short text classification
*/
module.exports.trainAndTest_batch = function(
		classifierType, 
		trainSet, testSet, 
		verbosity, microAverage, macroSum) {

		var startTime = new Date();
		var classifier = new classifierType();

		testSet1 = utils.clonedataset(testSet)
		trainSet1 = utils.clonedataset(trainSet)

		classifier.trainBatch(trainSet1);

		var output = classifier.classifyBatch(testSet1);

		if (output.length != testSet1.length)
			throw new Error('Lengths are not equal');

		var currentStats = new PrecisionRecall();
		
		var data_stats = []
		_.each(testSet1, function(value, key, list){ 
			var sentence_hash = {}
			sentence_hash['input'] = value.input;
			sentence_hash['expected'] = value.output
			sentence_hash['classified'] = [output[key]]
			sentence_hash['explanation'] = currentStats.addCasesHash(value.output, [output[key]], (verbosity>2));
			data_stats.push(sentence_hash)
		}, this)

		classifierstats = {}
		classifierstats['labels'] = currentStats.retrieveLabels()
		classifierstats['data'] = data_stats
		classifierstats['stats'] = currentStats.retrieveStats()

		return classifierstats
};


/**
 * Test the given classifier-type on the given train-set and test-set.
 * @param createNewClassifierFunction a function that creates a new, empty, untrained classifier
 * @param trainSet, testSet arrays with objects of the format: {input: "sample1", output: "class1"}
 * @param verbosity [int] level of details in log (0 = no log)
 * @param microAverage, macroSum [output] - objects of type PrecisionRecall, used to return the results. 
 * @return the currentStats.
 */
module.exports.trainAndTest = function(
		classifierType, 
		trainSet, testSet, 
		verbosity, microAverage, macroSum) {
		// TRAIN:
		var classifier = new classifierType();

		if (verbosity>0) console.log("\nstart training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes': ''));
		var startTime = new Date();
		classifier.trainBatch(trainSet);
		//console.log(classifier.featureDocumentFrequency['i']);
		var elapsedTime = new Date()-startTime;
		if (verbosity>0) console.log("end training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes, ': '')+elapsedTime+" [ms]");
	
		// TEST:
		return module.exports.test(classifier, testSet, verbosity, microAverage, macroSum);
};

module.exports.trainAndCompare = function(
		createNewClassifier1Function, createNewClassifier2Function,
		trainSet, testSet, verbosity) {
		// TRAIN:
		var classifier1 = new createNewClassifier1Function();
		var classifier2 = new createNewClassifier2Function();

		trainSet1 = utils.clonedataset(trainSet)
		trainSet2 = utils.clonedataset(trainSet)

		if (verbosity>0) console.log("\nstart training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes': ''));
		var startTime = new Date();
		classifier1.trainBatch(trainSet1);
		var elapsedTime = new Date()-startTime;
		if (verbosity>0) console.log("end training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes, ': '')+elapsedTime+" [ms]");

		if (verbosity>0) console.log("start training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes': ''));
		var startTime = new Date();
		classifier2.trainBatch(trainSet2);
		var elapsedTime = new Date()-startTime;
		if (verbosity>0) console.log("end training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes, ': '')+elapsedTime+" [ms]");
	
		// TEST:
		return module.exports.compare(classifier1, classifier2, testSet, verbosity);
};


/**
 * Train on datasets[0], test on datasets[1].
 * Train on datasets[0+1], test on datasets[2].
 * Train on datasets[0+1+2], test on datasets[3].
 * etc...
 */
module.exports.learningCurve = function(createNewClassifierFunction, datasets, verbosity) {

	var trainSet = [];
	for (var i=1; i<datasets.length; ++i) {
		trainSet = trainSet.concat(datasets[i-1]);
		var testSet = datasets[i];

		var classifier = createNewClassifierFunction();
		var startTime = new Date();
		classifier.trainBatch(trainSet);
		var elapsedTime = new Date()-startTime;
		var testStats = module.exports.test(classifier, testSet, verbosity).shortStats();

		console.log("Train on "+trainSet.length+" samples ("+elapsedTime+" ms): "+testStats);
	}
};






var stringifyClass = function (aClass) {
	return (_(aClass).isString()? aClass: JSON.stringify(aClass));
};

var normalizeClasses = function (expectedClasses) {
	if (!_(expectedClasses).isArray())
		expectedClasses = [expectedClasses];
	expectedClasses = expectedClasses.map(stringifyClass);
	expectedClasses.sort();
	return expectedClasses;
};
