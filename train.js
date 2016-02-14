/**
 * Trains and tests the NLU component.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var async = require('async');
var distances = require(__dirname+'/utils/distance.js');
var async_adapter = require(__dirname+'/utils/async_adapter.js');
var Hierarchy = require(__dirname+'/Hierarchy');
var _ = require('underscore')._;
var fs = require('fs');
var Hierarchy = require(__dirname+'/Hierarchy');
var multilabelutils = require('limdu/classifiers/multilabel/multilabelutils');
var trainutils = require('./utils/bars')
var wikipedia = require('./utils/wikipedia')
var bars = require('./utils/bars')
var rules = require("./research/rule-based/rules.js")
var cheapest_paths = require('limdu/node_modules/graph-paths').cheapest_paths;
var natural = require('natural');
var partitions = require('limdu/utils/partitions');
var PrecisionRecall = require('limdu/utils/PrecisionRecall');
var trainAndTest = require('./utils/trainAndTest');
var serialization = require('serialization');
var limdu = require("limdu");
var ftrs = limdu.features;

var stat_sig = false
var check_ds = true
var do_serialization_prod = false
var check_single_multi = false
var shuffling = false
var check_word = false
var multi_lab = false
var mmm = false
var check_cross_batch = false
var check_ds_context = false
var binary_seg = false
var do_small_temporary_serialization_test=  false
var do_cross_dataset_testing = false
var do_final_test = false
var do_cross_validation= false
var do_serialization = false

var verbosity = 0;
var explain = 0;

var classifier = require(__dirname+'/classifiers')

var regexpNormalizer = ftrs.RegexpNormalizer(
		JSON.parse(fs.readFileSync(__dirname+'/knowledgeresources/BiuNormalizations.json')));

var stringifyClass = function (aClass) {
  	return (_(aClass).isString()? aClass: JSON.stringify(aClass));
  };

var createNewClascheck_dialsifier = function() {
	var defaultClassifier = require(__dirname+'/classifiers').defaultClassifier;
	return new defaultClassifier();
}
var normalizeClasses = function (expectedClasses) {
	if (!_(expectedClasses).isArray())
		expectedClasses = [expectedClasses];
	expectedClasses = expectedClasses.map(stringifyClass);
	expectedClasses.sort();
	return expectedClasses;
};

function normalizer(sentence) {
	sentence = sentence.toLowerCase().trim();
	return regexpNormalizer(sentence);
}

function smart_normalizer(sentence) {
	sentence = sentence.toLowerCase().trim();
	sentence = regexpNormalizer(sentence)
	sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
	
	sentence = sentence.replace(/<VALUE>/g,'')
	sentence = sentence.replace(/<ATTRIBUTE>/g,'')
	sentence = regexpNormalizer(sentence)
	
	return sentence
}

function createNewClassifier()
{
	var defaultClassifier = require(__dirname+'/classifiers').defaultClassifier
	return new defaultClassifier()
}

function parse_filter(parse)
{
        _.each(parse['sentences'], function(value, key, list){
                delete parse['sentences'][key]['basic-dependencies']
                delete parse['sentences'][key]['collapsed-dependencies']
                delete parse['sentences'][key]['tokens']
        }, this)

        return parse
}

		
function walkSync(dir, filelist) {
	files = fs.readdirSync(dir);
  	filelist = filelist || [];
  	
  	files.forEach(function(file) {
    	if (fs.statSync(dir + file).isDirectory()) {
      		filelist = walkSync(dir + file + '/', filelist);
    	}
    	else {
      	filelist.push(dir+file);
    	}
  	})
  return filelist;
}


if (binary_seg)
{
	var dataset = bars.loadds("../negochat_private/dialogues")
	var utterset = bars.getsetnocontext(dataset)
	var stats = trainAndTest.trainAndTest_hash(classifier.BinarySegmentation, utterset["train"], utterset["test"], 5)
}

if (mmm)
{

	var single = []
	var multi = []

	var dataset = bars.loadds("../negochat_private/dialogues")
	var utterset = bars.getsetcontext(dataset)

	var data = _.flatten(utterset['train'].concat(utterset['test']))

	_.each(data, function(value, key, list){
		if (value.output.length>1)
			console.log(JSON.stringify(value, null, 4))
	}, this)
}

if (check_word)
{
	var wordembs = {}
	var inc = 0
	var distance = []

	async_adapter.getembedall(9, function(err, results){
		console.log("List is loaded"+ results.length)
		async.forEachOfSeries(results, function(word, dind, callback2){ 
			inc += 1
			if (inc % 10000 == 0) console.log(inc)
			async_adapter.getembed(word, 9, function(err, wordemb){
				wordembs[word] = wordemb
				callback2()
			})
		}, function(err){
			console.log("Finished")
			console.log(_.keys(wordembs).length)
			inc = 0

			_.each(wordembs, function(value, key, list){
				inc += 1
				if (inc % 10000 == 0) console.log(inc)
				distance.push([key, distances.cosine_distance(wordembs['offer'], value)])
			}, this)

			distance = _.sortBy(distance, function(num){ return num[1] }).reverse()

			console.log(distance.slice(0,50))

		})
	})
}

if (multi_lab)
{
	var dataset = bars.loadds("../negochat_private/dialogues")
	var utterset = bars.getsetcontext(dataset)

	var data = _.flatten(utterset['train'].concat(utterset['test']))

	var unlab = 0
	var single = 0
	var multi = 0

	var multiaccept = 0
	var multireject = 0
	var multioffer = 0

	var multihash = 0

	var truemulti = []
	var multistats = []
	var offerreject = []

	_.each(data, function(value, key, list){
		if (value.output.length==0)
			unlab += 1

		if (value.output.length==1)
			single += 1

		if (value.output.length>1)
		{
			multi += 1
			var intents = _.map(value.output, Hierarchy.splitPartEquallyIntent);
			intents = _.flatten(intents)

			// console.log(JSON.stringify(intents, null, 4))
			if ((_.unique(intents).length==1)&&(_.unique(intents)[0]=='Offer'))
				multioffer += 1

			if ((_.unique(intents).length==1)&&(_.unique(intents)[0]=='Accept'))
				multiaccept += 1

			if ((_.unique(intents).length==1)&&(_.unique(intents)[0]=='Reject'))
				multireject += 1

		}

		if (_.keys(value.outputhash).length>1)
		{	
			multihash += 1
			truemulti.push(value)
		}

		if (_.isEqual(['Offer','Reject'],_.sortBy(_.keys(value.outputhash),function(num){ return num } ))==true)
			offerreject.push(value)

		multistats.push(_.sortBy(_.keys(value.outputhash),function(num){ return num } ))

	}, this)

	console.log(JSON.stringify(offerreject, null, 4))

	multistats = _.countBy(multistats, function(num) { return num });
	// console.log(JSON.stringify(truemulti, null, 4))
	console.log(JSON.stringify(multistats, null, 4))

	console.log(JSON.stringify("unlab "+unlab, null, 4))
	console.log(JSON.stringify("single "+single, null, 4))
	console.log(JSON.stringify("multi "+multi, null, 4))
	console.log(JSON.stringify("multioffer "+multioffer, null, 4))
	console.log(JSON.stringify("multiaccept "+multiaccept, null, 4))
	console.log(JSON.stringify("multireject "+multireject, null, 4))
	console.log(JSON.stringify("multihash "+multihash, null, 4))
}

if (check_single_multi)
{

	var single = []
	var multi = []

	var dataset = bars.loadds("../negochat_private/dialogues")
	var utterset = bars.getsetcontext(dataset)

	var data = _.flatten(utterset['train'].concat(utterset['test']))
	
	// the third of the utterances are multi-label utterances
	// var sing = 0	
	// var mult = 0	

	// _.each(data, function(value, key, list){
	// 	if (value.output.length > 1)
	// 		mult += 1
	// 	else
	// 		sing += 1
	// }, this)

	// console.log(JSON.stringify(data.length, null, 4))	
	// console.log(JSON.stringify(mult, null, 4))
	// console.log(JSON.stringify(sing, null, 4))
	
	_.each(data, function(value, key, list){
		if (value.output.length > 1)
			multi = multi.concat(value.output)
		else
			single = single.concat(value.output)
	}, this)

	console.log(JSON.stringify(multi.length, null, 4))
	console.log(JSON.stringify(single.length, null, 4))
	
	var multis = _.countBy(multi, function(num) { return num })
	var singles = _.countBy(single, function(num) { return num })

	console.log(JSON.stringify(multis, null, 4))
	console.log(JSON.stringify(singles, null, 4))

	var aggree = {}

	_.each(multis, function(value, label, list){
		aggree[label] = {}
		aggree[label]['multi'] = value
	}, this)

	_.each(singles, function(value, label, list){
		if (!(label in aggree))
			aggree[label] = {}
		
		aggree[label]['single'] = value
	}, this)

	console.log(JSON.stringify(aggree, null, 4))
	process.exit(0)
}

    // "{\"Offer\":{\"Pension Fund\":\"20%\"}}": {
    //     "multi": 45,
    //     "single": 2


if (check_cross_batch)
{
	var dataset = bars.loadds("../negochat_private/dialogues")
	var utterset = bars.getsetcontext(dataset)

	// utterset["train"] = utterset["train"].slice(0,20)
	// utterset["test"] = utterset["test"].slice(0,5)

	console.log(utterset["train"].length)
	console.log(_.flatten(utterset["train"]).length)
	console.log("----")
	
	console.log(utterset["test"].length)
	console.log(_.flatten(utterset["test"]).length)

	utterset["test"] = _.flatten(utterset["test"])
	utterset["train"] = _.flatten(utterset["train"])

	var stats = trainAndTest.cross_batch(classifier.DS_bigram, bars.copyobj(utterset["train"]), 2)

	console.log(JSON.stringify(stats, null, 4))
	process.exit(0)
}


if (shuffling)
{
        var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	data = _.shuffle(data)
	data = _.shuffle(data)
	data = _.shuffle(data)
	data = _.shuffle(data)
	data = _.shuffle(data)
	data = _.shuffle(data)
	console.log(JSON.stringify(data, null, 4))	               
	process.exit(0)
}

/*if (stat_sig)
{
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	var utterset = bars.getsetcontext(data)
	var dataset = utterset["train"].concat(utterset["test"])

	var train = dataset.splice(70)

	var res = {'1':[],'2':[]}
	
	async.timesSeries(25, function(n, callback){

		trainAndTest.trainAndTest_async(classifier.DS_comp_exp_3_root_5_unoffered_yes_offer_yes_test, train, dataset[n]), function(err, stats1){
			res['1'].push(stats1.average_macroF1)

			trainAndTest.trainAndTest_async(classifier.DS_comp_unigrams_async_context_unoffered, train, dataset[n]), function(err, stats2){
				res['2'].push(stats2.average_macroF1)

				callback()

			})
		})
    }, function(err, users) {
    	console.log(JSON.stringify(res, null, 4))
	})
}
*/
if (check_ds)
{

// 70
// 966
// ----
// 35
// 518

// PERF
// "TP": 487,
// "FP": 95,
// "FN": 181,

// Linear
// "TP": 492,
// "FP": 100,
// "FN": 176,

//	var dataset = bars.loadds("../negochat_private/dialogues")
//
	var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
	var utterset = bars.getsetcontext(data)

	// var stats = {}

	// _.each(data, function(value, key, list){
	// 	stats[value['gameid']] = _.countBy(value['turns'], function(turn) { if (turn.role == "Employer") return 'match' });
	// }, this)	

	
	//utterset["train"] = utterset["train"].slice(0,20)
	//utterset["test"] = utterset["test"].slice(0,5)

	console.log(utterset["train"].length)
	console.log(_.flatten(utterset["train"]).length)
	console.log("----")
	
	console.log(utterset["test"].length)
	console.log(_.flatten(utterset["test"]).length)

	utterset["test"] = _.shuffle(_.flatten(utterset["test"]))
	utterset["train"] = _.shuffle(_.flatten(utterset["train"]))
	
	

	// _.each(utterset["train"], function(value, key, list){
	// 	if (value.input.context.lenght == 0)
	// 		console.log(JSON.stringify(value, null, 4))
	// }, this)
	// process.exit(0)

	// var stats = trainAndTest.trainAndTest_batch(classifier.DS_bigram, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), 50)
	// var stats = trainAndTest.trainAndTest_hash(classifier.DS_bigram, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), 50)
	// var stats_cl = trainAndTest.trainAndTest_hash(classifier.DS_bigram, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), 5)

	// var stats = trainAndTest.trainAndTest_hash(classifier.DS_bigram_split, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), 50)
	// console.log(JSON.stringify(stats, null, 4))

	//trainAndTest.trainAndTest_async(classifier.DS_bigram_split_embed, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), function(err, results){
	



	trainAndTest.trainAndTest_async(classifier.DS_comp_unigrams_async_context_unoffered, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), function(err, results){
		console.log("DONEDONE")
		// console.log(JSON.stringify(results['stats'], null, 4))
		// process.exit(0)

		// _.each(results['data'], function(val, key, list){
		// 	// if (('FP' in val.explanation) && ('FN' in val.explanation))
		// 	if ('FP' in val.explanation)
		// 	{
		// 		// if (val.explanation.FP.indexOf("{\"Reject\":true}")!=-1)
		// 			if (val.explanation.FP.indexOf("{\"Reject\":{\"Leased Car\":\"With leased car\"}}")!=-1)
		// 					console.log(JSON.stringify(val, null, 4))

				
		// 		// delete val.input.sentences
		// 		// console.log(JSON.stringify(val, null, 4))
		// 	}
		// }, this)

		console.log(JSON.stringify(results, null, 4))

		process.exit(0)

		// _.each(results.data, function(value, key, list){
		// 	if (!_.isEqual(results.data[key].explanation, stats.data[key].explanation))
		// 	{
		// 		console.log("sync")
		// 		console.log(JSON.stringify(stats.data[key], null, 4))
		// 		console.log("async")
		// 		console.log(JSON.stringify(results.data[key], null, 4))
		// 	}
		// }, this)
	})
	


	// trainAndTest.trainAndTest_async(classifier.DS_bigram_split, bars.copyobj(utterset["train"]), bars.copyobj(utterset["test"]), function(error, results){
	// 	console.log(JSON.stringify(results, null, 4))
	// })
}

if (do_small_temporary_serialization_test) {
	var classifier = createNewClassifier(); 
	classifier.trainBatch(collectedDatasetSingle);
	console.log("\nConvert to string, and test on training data again");
	serialization.toStringVerified(classifier, createNewClassifier, __dirname, collectedDatasetSingle, /*explain=*/4);
	process.exit(1);
}

if (do_cross_dataset_testing) {
	verbosity=0;
	
	console.log("Train on grammar, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset, collectedDatasetMulti8, verbosity).shortStats())+"\n";
//	console.log("Train on grammar+single1, test on multi8: "+
//			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+multi1, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single1+multi1, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti), collectedDatasetMulti8, verbosity).shortStats())+"\n";

	console.log("Train on grammar+multi2, test on multi8: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
//	console.log("Train on grammar+single2, test on multi8: "+
//		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single2+multi2, test on multi8: "+
			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle2).concat(collectedDatasetMulti2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	
//	console.log("Train on grammar+multi1+multi2, test on multi8: "+
//		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti).concat(collectedDatasetMulti2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
//	console.log("Train on grammar+single1+single2, test on multi8: "+
//		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetSingle2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	console.log("Train on grammar+single1+multi1+single2+multi2, test on multi8: "+
		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti).concat(collectedDatasetSingle2).concat(collectedDatasetMulti2), collectedDatasetMulti8, verbosity).shortStats())+"\n";
	
//	console.log("\nTrain on grammar+single1+multi8, test on multi2: "+
//		trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti8), collectedDatasetMulti2, verbosity).shortStats())+"\n";
//	console.log("Train on grammar+single1+multi1+multi8, test on multi2: "+
//			trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti).concat(collectedDatasetMulti8), collectedDatasetMulti2, verbosity).shortStats())+"\n";

//	console.log("\nTrain on grammar data, test on woz single class: "+
//		trainAndTest(createNewClassifier, grammarDataset, collectedDatasetSingle, verbosity).shortStats())+"\n";
//	console.log("Train on grammar data, test on woz multi class: "+
//		trainAndTest(createNewClassifier, grammarDataset, collectedDatasetMulti, verbosity).shortStats())+"\n";
	console.log("\nTrain on woz single class, test on woz multi class: "+
		trainAndTest(createNewClassifier, collectedDatasetSingle, collectedDatasetMulti, verbosity).shortStats())+"\n";
	console.log("Train on woz multi class, test on woz single class: "+
		trainAndTest(createNewClassifier, collectedDatasetMulti, collectedDatasetSingle, verbosity).shortStats())+"\n";

	collectedDatasetMultiPartition = partitions.partition(collectedDatasetMulti, 0, collectedDatasetMulti.length/2);
	collectedDatasetSinglePartition = partitions.partition(collectedDatasetSingle, 0, collectedDatasetSingle.length/2);
	console.log("Train on mixed, test on mixed: "+
		trainAndTest(createNewClassifier, 
			collectedDatasetMultiPartition.train.concat(collectedDatasetSinglePartition.train), 
			collectedDatasetMultiPartition.test.concat(collectedDatasetSinglePartition.test), 
			verbosity).shortStats())+"\n";
	console.log("Train on mixed, test on mixed (2): "+
		trainAndTest(createNewClassifier, 
			collectedDatasetMultiPartition.test.concat(collectedDatasetSinglePartition.test), 
			collectedDatasetMultiPartition.train.concat(collectedDatasetSinglePartition.train), 
			verbosity).shortStats())+"\n";
} // do_cross_dataset_testing

if (do_final_test) {
	verbosity=0;
	
	["Employer"/*,"Candidate"*/].forEach(function(classifierName) {
		console.log("\nFinal test for "+classifierName);

		var grammarDataset = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/0_grammar.json"));
		var collectedDatasetMulti = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/1_woz_kbagent_students.json"));
		var collectedDatasetSingle = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/1_woz_kbagent_students1class.json"));
		var collectedDatasetMulti2 = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/2_experts.json"));
		var collectedDatasetSingle2 = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/2_experts1class.json"));
		var amtDataset = JSON.parse(fs.readFileSync("datasets/"+classifierName+"/3_woz_kbagent_turkers_negonlp2.json"));
		
		console.log("Train on grammar, test on AMT: "+
				trainAndTest(createNewClassifier, grammarDataset, amtDataset, verbosity).shortStats())+"\n";
		console.log("Train on grammar+multi1, test on AMT: "+
				trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti), amtDataset, verbosity).shortStats())+"\n";
		console.log("Train on grammar+single1+multi1, test on AMT: "+
				trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti), amtDataset, verbosity).shortStats())+"\n";
		console.log("Train on grammar+multi2, test on AMT: "+
				trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetMulti2), amtDataset, verbosity).shortStats())+"\n";
		console.log("Train on grammar+single2+multi2, test on AMT: "+
				trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle2).concat(collectedDatasetMulti2), amtDataset, verbosity).shortStats())+"\n";
		console.log("Train on grammar+single1+multi1+single2+multi2, test on AMT: "+
				trainAndTest(createNewClassifier, grammarDataset.concat(collectedDatasetSingle).concat(collectedDatasetMulti).concat(collectedDatasetSingle2).concat(collectedDatasetMulti2), amtDataset, verbosity).shortStats())+"\n";
	});
} // do_final_test

if (do_cross_validation) {
	verbosity=0;

	var numOfFolds = 5; // for k-fold cross-validation
	var microAverage = new PrecisionRecall();
	var macroAverage = new PrecisionRecall();
	
	var constantTrainSet = (grammarDataset).concat(collectedDatasetSingle);
	var devSet = (collectedDatasetMulti2).concat(collectedDatasetMulti8);
	var startTime = new Date();
	console.log("\nstart "+numOfFolds+"-fold cross-validation on "+grammarDataset.length+" grammar samples and "+collectedDatasetSingle.length+" single samples and "+devSet.length+" collected samples");
	partitions.partitions(devSet, numOfFolds, function(trainSet, testSet, index) {
		var stats = trainAndTest(createNewClassifier,
			trainSet.concat(constantTrainSet), testSet, verbosity,
			microAverage, macroAverage).shortStats();
		console.log("partition #"+index+": "+(new Date()-startTime)+" [ms]: "+stats);
	});
	//_(macroAverage).each(function(value,key) { macroAverage[key] = value/numOfFolds; });
	console.log("end "+numOfFolds+"-fold cross-validation: "+(new Date()-startTime)+" [ms]");

	//if (verbosity>0) {console.log("\n\nMACRO AVERAGE FULL STATS:"); console.dir(macroAverage.fullStats());}
	//console.log("\nMACRO AVERAGE SUMMARY: "+macroAverage.shortStats());

	microAverage.calculateStats();
	console.log("MICRO AVERAGE SUMMARY: "+microAverage.shortStats());
} // do_cross_validation

if (do_serialization_prod) {

        var data = JSON.parse(fs.readFileSync(__dirname+"/../negochat_private/parsed.json"))
        var utterset = bars.getsetcontext(data)

        utterset["test"] = _.flatten(utterset["test"])
        utterset["train"] = _.flatten(utterset["train"])

        var clas = createNewClassifier()

        clas.trainBatchAsync(bars.copyobj(utterset["train"]).concat(bars.copyobj(utterset["test"])), function(err,results){
            fs.writeFileSync("trainedClassifiers/Employer-usa/MostRecentClassifier.json", serialization.toString(clas, createNewClassifier, __dirname), 'utf8')
            console.log("done")
            process.exit()
        })
}

if (do_serialization) {
	verbosity=0;
		["Employer-egypt-translate", "Employer-egypt-generate", "Employer-egypt"].forEach(function(classifierName) {
		console.log("\nBuilding classifier for "+classifierName);
		var classifier = createNewClassifier();
		var jsonEmpty = classifier.toJSON();  // just to check that it works

		try { var datasetNames = fs.readdirSync("datasets/" + classifierName) }

		catch (e)
		{	
			throw new Error(e);
		}

		var dataset = datasetNames.reduce(function(previous, current) {
			return previous.concat(
				JSON.parse(
					fs.readFileSync(
						"datasets/"+classifierName+"/" + current )));
		}, []);

		console.log("\nstart training on "+dataset.length+" samples"); var startTime = new Date();
		classifier.trainBatch(dataset);
		console.log("end training on "+dataset.length+" samples, "+(new Date()-startTime)+" [ms]");

		if (do_test_on_training_data) console.log("\ntest on training data: " + test(classifier, dataset).shortStats());

		console.log("\nConvert to string, and test on training data again");
		fs.writeFileSync("trainedClassifiers/"+classifierName+"/MostRecentClassifier.json", 
			(do_test_on_training_data? 
					serialization.toStringVerified(classifier, createNewClassifier, __dirname, dataset):
					serialization.toString(classifier, createNewClassifier, __dirname))
			, 'utf8');
	});
} // do_serialization



// })


// f.run();
