var cluster = require('cluster');
var fs = require('fs');
var _ = require('underscore')._;
var bars = require(__dirname+'/../utils/bars');
var distance = require(__dirname+'/../utils/distance');
var child_process = require('child_process')
var partitions = require('limdu/utils/partitions');

var gnuplot = 'gnuplot'
var statusfile = __dirname + "/status"
var plotfile = __dirname + "/plotstatus"

var disc = 0

var log_file = "/tmp/logs/master"

console.vlog = function(data) {
    fs.appendFileSync(log_file, data + '\n', 'utf8')
};
// function groupbylabel(dataset, minsize, sizetrain, catnames)
// {

// 	var sends = _.groupBy(dataset , function(num){ return num['input']['CORENLP']['sentences'].length })
// 	console.log("sentence distribution")
// 	var sendist = {}tats
// 	_.each(sends, function(value, key, list){ 
// 		sendist[key]=value.length
// 	}, this)
// 	console.log(JSON.stringify(sendist, null, 4))

// 	var gro = _.groupBy(dataset, function(num){ return num["output"][0] })

// 	console.log("number of classses")
// 	console.log(Object.keys(gro).length)

// 	console.log("label distribution")
	
// 	var labdist = {}
// 	_.each(gro, function(value, key, list){ 
// 		labdist[catnames[key]] = value.length
// 	}, this)

// 	console.log(JSON.stringify(labdist, null, 4))

// 	_.each(gro, function(value, key, list){ 

// 		value = _.filter(value, function(num){ return num['input']['CORENLP']['sentences'].length >= minsize })
// 		value = _.map(value, function(num){ num["input"]["CORENLP"]["sentences"].splice(10) 
// 											return num });

// 		if (value.length < sizetrain)
// 			delete gro[key]
// 		else
// 			gro[key] = _.sample(value, sizetrain)
// 	}, this)

// 	var findist = {}
// 	_.each(gro, function(value, key, list){ 
// 		findist[catnames[key]] = value.length
// 	}, this)
// 	console.log(JSON.stringify(findist, null, 4))

// 	return gro
// }

// {
//     "Accuracy": {
//         "19": {
//             "DS_unigram": {
//                 "0": 0.27348643006263046
//             }
//         }
//     },
//     "macroF1": {
//         "19": {
//             "DS_unigram": {
//                 "0": 0.08459750095387453
//             }
//         }
//     },
//     "microF1": {
//         "19": {
//             "DS_unigram": {
//                 "0": 0.4589823468328141
//             }
//         }
//     }
// }


function extractGlobal(workerstats, stat)
{
	// var attributes = ["F1", "Accuracy", "macroF1"]
	// var attributes = ["Accuracy"]
	var attributes = Object.keys(workerstats['stats'])
	var trainsize = workerstats["trainsize"] //+ "_" + workerstats["trainsizeuttr"]
	var classifier = workerstats["classifier"]
	var classifiers = workerstats["classifiers"]
	var fold = workerstats["fold"]

	console.log("DEBUGMASTER: workerstats: "+JSON.stringify(workerstats, null, 4))
	console.log("DEBUGMASTER: clas:"+classifiers)

	_.each(attributes, function(attr, key, list){ 
	//	if (!_.isNull(workerstats['stats'][attr]))
	//	{
			if (!(attr in stat)) stat[attr]={}
			if (!(trainsize in stat[attr])) stat[attr][trainsize]={}
			
			if (!('dial' in stat[attr][trainsize])) 
					stat[attr][trainsize]['dial'] = {}
			
			_.each(classifiers, function(cls, key, list){

				if (!(cls in stat[attr][trainsize]))
                                        stat[attr][trainsize][cls] = {}
					
				if (!(fold in stat[attr][trainsize][cls]))
					stat[attr][trainsize][cls][fold] = null

			}, this)
	
			console.log("DEBUGMASTER: stat: "+JSON.stringify(stat, null, 4))
			
			stat[attr][trainsize][classifier][fold] = workerstats['stats'][attr]
			stat[attr][trainsize]["dial"][fold] = workerstats["trainsizeuttr"]
	//	}
	}, this)
}


function hmstring(output)
{
       return _.map(output, function(value){ return value.join(" ") }).join("\n")
}

function plot(fold, parameter, stat, baseline, sota)
{

	var output = hmcalc(fold, stat[parameter], baseline, sota)
	
	if ((output.length == 0) || (output.length<4) || (output.length % 2 != 0))
		return

	var string = hmstring(output)

	var mapfile = __dirname+"/hm/"+fold+"_"+parameter+"_"+sota+"-"+baseline

    fs.writeFileSync(mapfile, string)

    var command = gnuplot +" -e \"set title '"+corpus+" : "+sota+" - "+baseline+"'; set output 'lc/hm/"+fold+"_"+parameter+"_"+sota+"-"+baseline+".png'\" "+__dirname+"/hm.plot " + "-e \"plot \'"+mapfile+"\' using 2:1:3 with image \""
    
    console.log(command)
	child_process.execSync(command)
}


function plotlcagrlenaverge(stat)
{
	var values = _.values(stat)

//	var uniq = _.uniq(values)

//	if ((uniq.length == 1) && ((_.isNaN(uniq[0]) || _.isUndefined(uniq[0]) || _.isNull(uniq[0]))))
//		return NaN
	
//	values = _.map(values, function(num){ if (_.isNaN(num) || _.isUndefined(num) || _.isNull(num))
//											return 0 
//										else
//
//											return num}, this)

	if (isVectorNumber(values)) 
		return distance.average(values)
	else
		return null
}


function isVectorNumber(a) {
  var n;
  for (n=0; n < a.length; n++) {
   if (isNaN(parseFloat(a[n])) || !isFinite(a[n]))
    return false
  }
  return true
}

// "DS_unigram": {
//                   "0": 0.27348643006263046
//					 "1"
// 					 "2"
//             }


// return the hash of classifiers with the requried fold performance
// or get average over all folds
function plotlcagrlen(fold, stat)
{

// sort the hash 
var statmod = {}

if ('size' in stat)
	statmod['size'] = stat['size']

if ('dial' in stat)
    statmod['dial'] = stat['dial']

var stat_arr = _.sortBy(_.pairs(stat), function(num){ return num })
stat = _.extend(statmod, _.object(stat_arr))

/*{
    "dial": {
        "0": 33,
        "1": 18,
        "2": 18,
        "3": 18,
        "4": 18,
        "5": 18,
        "6": 18,
        "7": 18,
        "8": 18,
        "9": 18
    },
    "DS_comp_unigrams_async_context_unoffered": {
        "0": 0.496551724137931,
        "1": 0.48427672955974843,
        "2": 0.5401459854014599,
        "3": 0.42953020134228187,
        "4": 0.55,
        "5": 0.4365079365079365,
        "6": 0.47333333333333333,
        "7": 0.3485714285714286,
        "8": 0.41843971631205673,
        "9": 0.47183098591549294
    }
}
*/

	var classifier_hash = {}

		_.each(stat, function(folds, clas, list){
			if (!(clas in classifier_hash))
				classifier_hash[clas] = undefined
			else
				throw new Error("for some reason "+clas+" is already defined")

			if (fold in folds)
				// classifier_hash[clas].push(folds[fold])
				classifier_hash[clas] = folds[fold]
			else if (fold == "average")

				/*
				here "average" is calculated
				what if some folds doesn't have a value when it's undefined like F1
				then in any case we should devide by the number of real folds
				PrecisionRecall should always return a undefined value
				*/

				// classifier_hash[clas].push(plotlcagrlenaverge(folds))
				classifier_hash[clas] = plotlcagrlenaverge(folds)
			else 
				// throw new Error("for some reason we don't have stats for this fold")
				// classifier_hash[clas].push(undefined)
				classifier_hash[clas] = undefined
			
		}, this)

	/*_.each(classifier_hash, function(value, key, list){ 

		if (value.length > 1)
			console.log("DEBUGMASTER: classifier_hash has more than one value")
	
		value = _.map(value, function(num){ if (_.isNaN(num) || _.isUndefined(num) || _.isNull(num))
											return 0 
										else
											return num})


		classifier_hash[key] = distance.average(value)
	}, this)
*/
// 	{
//     "DS_unigram": [
//         0.5693558216457713
//     ]
// }
	return classifier_hash
}

// per specific parameter
// "19": {
//             "DS_unigram": {
//                 "0": 0.27348643006263046
//             }
//         }

function plotlcagr(fold, stat)
{

// {
//     "10": {
//         "DS_unigram": {
//             "1": 0.022029384491482732,
//             "2": 0.018839412499273584
//         }
//     },
//     "19": {
//         "DS_unigram": {
//             "0": 0.07032280959584986
//         }
//     },
//     "33": {
//         "DS_unigram": {
//             "0": 0.10935534821205
//         }
//     }
// }

	var output = []
	// go over all trainsizes
	// value    // key
	_.each(stat, function(class_folds, trainsize, list){
		var avr = plotlcagrlen(fold, class_folds)

		if (output.length == 0)
			// the first array is the header in file
			output.push(["size"].concat(_.keys(avr)))

		output.push([trainsize].concat(_.values(avr)))
	})

// 	[
//     [
//         "size",
//         "DS_unigram"
//     ],
//     [
//         "10",
//         0.020434398495378158
//     ],
//     [
//         "19",
//         0.08459750095387453
//     ],
//     [
//         "33",
//         0.10935534821205
//     ]
// ]

	return output
}

function getstringlc(output)
{
	return _.map(output, function(value){ 

		value = _.map(value, function(num){ return (_.isNaN(num)||_.isNull(num))? "null":num })

		return value.join("\t") }).join("\n")
}

function plotlc(fold, parameter, stat)
{
	
	console.log(JSON.stringify(stat, null, 4))

	fs.appendFileSync(plotfile, fold)
	fs.appendFileSync(plotfile, JSON.stringify(parameter, null, 4))

	// build output in the format size * classifiers
	var output = plotlcagr(fold, stat[parameter])

	var classifiers = output[0].slice(1)

	console.log("OUTPUTDATA:")
	console.log(JSON.stringify(output, null, 4))

	var string = getstringlc(output)
	
	console.log("OUTPUTSTRING:")
	console.log(JSON.stringify(string, null, 4))

	var mapfile = __dirname+"/learning_curves/"+fold+"_"+parameter
	var ylabel = _.last(("_"+parameter).split("_"))

	fs.appendFileSync(plotfile, string)
    fs.writeFileSync(mapfile, string)

    var command = gnuplot +" -e \"set ylabel '"+ylabel+"' font ',20'; set output 'lc/learning_curves/"+fold+"_"+parameter+".png'\" "+__dirname+"/lc.plot " + "-e \"plot for [i=3:"+(classifiers.length+2)+"] \'"+mapfile+"\' using 1:i:xtic(1) with linespoints linecolor i pt i ps 3\""

//  var command = gnuplot +" -e \"set output 'lc/learning_curves/"+fold+"_"+parameter+".png'\" "+__dirname+"/lc.plot " + "-e \"plot for [i=3:"+(classifiers.length+2)+"] \'"+mapfile+"\' using 1:i:xtic(1) with linespoints linecolor i pt "+(fold == 'average' ? 0 : fold)+" ps 3\""//, \'\' using 1:(NaN):x2tic(2) axes x2y1\"" 
    console.log(command)

	try {
		child_process.execSync(command)
	} catch (err) {
		console.log(err)
	}
}

// there is a worker for every classifier and every fold
function learning_curves(classifiers, folds, dataset, callback)
{
	var stat = {}

//	var classifiers = [ 'NLU_Tran', 'NLU_Tran_Oversample']
//	var classifiers = [ 'NLU_Baseline', 'NLU_Tran', 'NLU_Oversample', 'NLU_Tran_Oversample']
	//var classifiers = [ 'NLU_Baseline', 'NLU_Emb_300', 'NLU_Emb_100', 'NLU_Emb_50']
	//var classifiers = [ 'NLU_Baseline', 'NLU_Tran_Yandex', 'NLU_Tran_Microsoft', 'NLU_Tran_Google']
/*	var classifiers = [  
			     'NLU_Tran_Yandex_Microsoft', 'NLU_Tran_Yandex_Google', 
			     'NLU_Tran_Google_Microsoft', 'NLU_Tran_Google_Yandex', 
			     'NLU_Tran_Microsoft_Google', 'NLU_Tran_Microsoft_Yandex']
*/
/*	var classifiers = [ 	'NLU_Baseline', 
				'NLU_Tran_Yandex_Microsoft_French', 'NLU_Tran_Yandex_Microsoft_German',
				'NLU_Tran_Yandex_Microsoft_Spanish', 'NLU_Tran_Yandex_Microsoft_Portuguese',
				'NLU_Tran_Yandex_Microsoft_Hebrew', 'NLU_Tran_Yandex_Microsoft_Arabic',
				'NLU_Tran_Yandex_Microsoft_Russian', 'NLU_Tran_Yandex_Microsoft_Chinese' ]

*/	
/*var classifiers = [ 	'NLU_Baseline', 
				'NLU_Tran_French', 'NLU_Tran_German',
				'NLU_Tran_Spanish', 'NLU_Tran_Portuguese',
				'NLU_Tran_Hebrew', 'NLU_Tran_Arabic',
				'NLU_Tran_Russian', 'NLU_Tran_Chinese' ]
*/
	//var classifiers = [ 'NLU_Baseline', 'NLU_Bal', 'NLU_Tran_Arabic' ]
//	var classifiers = [ 'NLU_Bal', 'NLU_Tran_Arabic' ]
//	var classifiers = [ 'NLU_Bal', 'NLU_Tran_Spanish' ]
	//var classifiers = [ 'NLU_Tran_Arabic', 'NLU_Tran_Urdu', 'NLU_Tran_Finish', 'NLU_Tran_Hungarian' ]
	//var classifiers = [ 'NLU_Tran_Finish', 'NLU_Tran_Finish_Arabic' ]
	var classifiers = [ 'NLU_Tran_Finish', 'NLU_Tran_Yandex_Microsoft_Finish' ]

	//var classifiers = [ 'NLU_Baseline']

	var data1 = (JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed_trans_new.json")))
 	var utterset1 = bars.getsetcontext(data1, true)
	var train1 = utterset1["train"].concat(utterset1["test"])

	cluster.setupMaster({
  	exec: __dirname + '/worker_async_tran.js',
  	// exec: __dirname + '/worker.js',
	// args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
	// silent: false
	});
	
	console.vlog("DEBUGMASTER")

	_.each(classifiers, function(classifier, key, list){ 
		_(folds).times(function(fold){
		
			// worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len, 'datafile': datafile, 'thread': thr})
			var worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier})
			
			var data = partitions.partitions_consistent_by_fold(train1, folds, fold)

			console.vlog("DEBUGMASTER: class: "+classifier+" fold:"+ fold + " train size:"+data.train.length + " test size:" + data.test.length)
			//console.vlog(JSON.stringify(worker, bars.censor(worker), 4))
			console.vlog("DEBUGMASTER: process.pid:"+worker.process.pid)

			worker.send({ 		
					'train': JSON.stringify(data.test), 
					'test': JSON.stringify(data.train)
		     		})
			
			worker.on('disconnect', function(){
			  	console.vlog("DEBUGMASTER: finished: workers.length: "+Object.keys(cluster.workers).length + " disc: "+disc)
				disc += 1
			  	//if (Object.keys(cluster.workers).length == 1)
			  	{
				//	console.log("DEBUGMASTER: all workers are disconnected")
			  		_.each(stat, function(data, param, list){
						// update the graph for current fold per parameter
						//_(folds).times(function(fold){
						//	plotlc(fold, param, stat)
						//	console.log("DEBUG: param "+param+" fold "+fold+" build")
						//})
						// build average per parameters
						plotlc('average', param, stat)
				
					})
					console.vlog(JSON.stringify(stat, null, 4))
			  	}
			})

			worker.on('message', function(message){
				var workerstats = JSON.parse(message)
				workerstats['classifiers'] = classifiers
				console.vlog("DEBUGMASTER: on message: "+message)
				// fs.appendFileSync(statusfile, JSON.stringify(workerstats, null, 4))
				extractGlobal(workerstats, stat)
			})
		})
	}, this)
}

if (process.argv[1] === __filename)
{

	// 	var classifiers = ['DS_bigram_split_async', 'DS_bigram_split_embed', 'DS_bigram_split_exp']
	//	var classifiers = ['DS_bigram_split_async', 'DS_bigram_split_exp']
	//	var classifiers = ['DS_comp_exp_0_undefined','DS_comp_exp_1_undefined','DS_comp_exp_2_undefined','DS_comp_exp_3_ref','DS_comp_exp_4_ref']
	//	var classifiers = [ 'DS_comp_embed_d300_average_unoffered', 'DS_comp_embed_d100_average_unoffered', 'DS_comp_embed_d50_average_unoffered', 'DS_comp_embed_d25_average_unoffered', 'DS_comp_unigrams_async_context_unoffered']
	//	var classifiers = ['DS_comp_unigrams_bigrams_async', 'DS_vanilla_svm']

	//	var classifiers = ['DS_comp_unigrams_async', 'DS_comp_embed_d100_average', 'DS_comp_embed_d100_dep_average', 'DS_comp_embed_d100_sub_average']
	//	var classifiers = ['DS_comp_exp_3_undefined_root', 'DS_comp_exp_3_undefined', 'DS_comp_embed_d100_average']
	//var classifiers = ['DS_comp_exp_3_undefined_root_context', 'DS_comp_exp_3_undefined_context', 'DS_comp_embed_d100_average_context']
	//var classifiers = ['DS_comp_unigrams_async_context', 'DS_comp_exp_3_undefined_context_embed_d100_average', 'DS_comp_embed_d100_average_context', 'DS_comp_exp_3_undefined_root_context']
	 //var classifiers = ['DS_comp_unigrams_async_context', 'DS_comp_exp_3_undefined_root','DS_comp_exp_3_undefined_root_context_offer', 'DS_comp_exp_3_undefined_root_context', 'DS_comp_exp_3_undefined_root_context_test', 'DS_comp_exp_3_undefined_root_context_test_offer']
	//var classifiers = ['DS_comp_unigrams_async_context_both', 'DS_comp_unigrams_async_context_offered','DS_comp_unigrams_async_context_unoffered', 'DS_comp_unigrams_async']

	//var classifiers = ['DS_comp_unigrams_async_context_unoffered','DS_comp_exp_3_root_5_unoffered','DS_comp_exp_3_root_5_unoffered_test']
	//var classifiers = ['DS_comp_unigrams_async_context_unoffered','DS_comp_unigrams_async']
	//var classifiers = ['DS_comp_unigrams_async_context_unoffered','DS_comp_unigrams_async_context_unoffered_prev']
	//var classifiers = ['DS_composition','DS_comp_embed_d100_average_unoffered','DS_comp_unigrams_async_context_unoffered','DS_comp_exp_3_root_3_unoffered_yes_offer_yes_test']
	// var classifiers = ['DS_comp_unigrams_async_context_unoffered']
	// var classifiers = ['DS_comp_embed_d100_average_unoffered','DS_comp_unigrams_async_context_unoffered','DS_comp_exp_3_root_5_unoffered_yes_offer_yes_test']
	//var classifiers = ['DS_comp_embed_d100_average_unoffered','DS_comp_unigrams_async_context_unoffered','DS_comp_exp_3_root_3_unoffered_yes_offer_yes_test']
	//var classifiers = ['DS_comp_unigrams_async_context_unoffered','DS_comp_embed_d300_average_unoffered']

    /*var classifiers = [
    				'DS_comp_unigrams_async_context_unoffered_wordnet_syn',
     				'DS_comp_unigrams_async_context_unoffered_wordnet_ant',
     				'DS_comp_unigrams_async_context_unoffered_wordnet_ant_syn',
     				'DS_comp_unigrams_async_context_unoffered',
					'DS_comp_embed_d100_average_unoffered',
					'DS_primitive'
     				]
    */ 				
/*    var classifiers = [
    				
				"DS_comp_embed_d100_avr_root_false_uni_false",
				"DS_comp_embed_d100_avr_root_false_uni_true",
				"DS_comp_embed_d100_avr_root_true_uni_true",
				"DS_comp_embed_d100_avr_root_true_uni_false"
				
				]
*/

	
	fs.writeFileSync(statusfile, "")
	fs.writeFileSync(plotfile, "")
	bars.cleanFolder(__dirname + "/learning_curves")
    bars.cleanFolder("/tmp/logs")

	// var dataset = bars.loadds(__dirname+"/../../negochat_private/dialogues")
	// var utterset = bars.getsetnocontext(dataset)
	
/*	var data = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed.json"))
	var utterset = bars.getsetcontext(data)
	var dataset = utterset["train"].concat(utterset["test"])

*/	// dataset = _.filter(dataset, function(num){ return num.length > 15 });

//	dataset = dataset.slice(0,100)

	var folds = 20

	//console.log("Dataset "+ dataset.length)
//	console.log("DEBUG: master: dataset size "+ dataset.length)

	learning_curves([], folds, [], function(){
		process.exit(0)
	})	
}

module.exports = {
	plotlc:plotlc,
	plotlcagr: plotlcagr,
	getstringlc:getstringlc,
	plotlcagrlen:plotlcagrlen,
	plotlcagrlenaverge:plotlcagrlenaverge,
	extractGlobal:extractGlobal
} 

// {
//     "Accuracy": {
//         "10": {
//             "DS_unigram": {
//                 "1": 0.1601642710472279,
//                 "2": 0.12548262548262548
//             },
//             "DS_bigram": {
//                 "1": 0.13552361396303902,
//                 "2": 0.0888030888030888
//             }
//         },
//         "19": {
//             "DS_unigram": {
//                 "0": 0.23173277661795408
//             },
//             "DS_bigram": {
//                 "0": 0.24843423799582465
//             }
//         },
//         "31": {
//             "DS_unigram": {
//                 "1": 0.21765913757700206,
//                 "2": 0.21235521235521235
//             }
//         },
//         "33": {
//             "DS_unigram": {
