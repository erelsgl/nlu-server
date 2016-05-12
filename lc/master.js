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

	console.log(workerstats)
	
	console.log("clas:"+classifiers)

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

function cleanFolder(dir)
{
	var graph_files = fs.readdirSync(dir)

	_.each(graph_files, function(value, key, list){ 
		fs.unlinkSync(dir+"/"+value)
	}, this)
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

	fs.appendFileSync(plotfile, string)
    fs.writeFileSync(mapfile, string)

    var command = gnuplot +" -e \"set output 'lc/learning_curves/"+fold+"_"+parameter+".png'\" "+__dirname+"/lc.plot " + "-e \"plot for [i=3:"+(classifiers.length+2)+"] \'"+mapfile+"\' using 1:i:xtic(1) with linespoints linecolor i pt i ps 3\""
    // var command = gnuplot +" -e \"set output 'lc/learning_curves/"+fold+"_"+parameter+".png'\" "+__dirname+"/lc.plot " + "-e \"plot for [i=3:"+(classifiers.length+2)+"] \'"+mapfile+"\' using 1:i:xtic(1) with linespoints linecolor i pt "+(fold == 'average' ? 0 : fold)+" ps 3\""
//    var command = gnuplot +" -e \"set output 'lc/learning_curves/"+fold+"_"+parameter+".png'\" "+__dirname+"/lc.plot " + "-e \"plot for [i=3:"+(classifiers.length+2)+"] \'"+mapfile+"\' using 1:i:xtic(1) with linespoints linecolor i pt "+(fold == 'average' ? 0 : fold)+" ps 3\""//, \'\' using 1:(NaN):x2tic(2) axes x2y1\"" 
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
	var thr = 0

	cluster.setupMaster({
  	exec: __dirname + '/worker_async_std.js',
  	// exec: __dirname + '/worker.js',
	// args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
	// silent: false
	});

	_.each(classifiers, function(classifier, key, list){ 
		_(folds).times(function(fold){
		
			// worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len, 'datafile': datafile, 'thread': thr})
			var worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'thread': thr})
			
			var data = partitions.partitions_consistent_by_fold(dataset, folds, fold)

			console.log("DEBUG: fold "+ fold + " train size "+data.train.length)
                        console.log("DEBUG: fold "+ fold + " test size "+data.test.length)
	
			worker.send({ 
						'train': JSON.stringify(data['train']), 
						'test': JSON.stringify(data['test']) 
						})
			thr += 1	

			worker.on('disconnect', function(){
			  	console.log("DEBUG: master: finished")
			  	if (Object.keys(cluster.workers).length == 1)
			  	{
					console.log("DEBUG: all workers are disconnected")
			  		_.each(stat, function(data, param, list){
						// update the graph for current fold per parameter
						_(folds).times(function(fold){
							plotlc(fold, param, stat)
							console.log("DEBUG: param "+param+" fold "+fold+" build")
						})
						// build average per parameters
						plotlc('average', param, stat)
				
					})
					console.log(JSON.stringify(stat, null, 4))
			  	}
			})

			worker.on('message', function(message){
				var workerstats = JSON.parse(message)
				workerstats['classifiers'] = classifiers

				console.log("DEBUGMASTER: "+message)
				fs.appendFileSync(statusfile, JSON.stringify(workerstats, null, 4))
				extractGlobal(workerstats, stat)
			})
		})
	}, this)
}

// function isInt(value) {
  // return !isNaN(value) && 
         // parseInt(Number(value)) == value && 
         // !isNaN(parseInt(value, 10));
// }

if (process.argv[1] === __filename)
{
	var folds = 10

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
    var classifiers = [
    				
				"DS_Composite_wise",
				"DS_Component_wise"
				
				]


	
	fs.writeFileSync(statusfile, "")
	fs.writeFileSync(plotfile, "")
	cleanFolder(__dirname + "/learning_curves")
	
	// var dataset = bars.loadds(__dirname+"/../../negochat_private/dialogues")
	// var utterset = bars.getsetnocontext(dataset)
	
	var data = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed.json"))
	var utterset = bars.getsetcontext(data)
	var dataset = utterset["train"].concat(utterset["test"])

	// dataset = _.filter(dataset, function(num){ return num.length > 15 });

	dataset = dataset.slice(0,100)

	console.log("Dataset "+ dataset.length)
	console.log("DEBUG: master: dataset size "+ dataset.length)

	learning_curves(classifiers, folds, dataset, function(){
		console.log()
		process.exit(0)
	})	
}

module.exports = {
	plotlc:plotlc,
	plotlcagr: plotlcagr,
	getstringlc:getstringlc,
	plotlcagrlen:plotlcagrlen,
	plotlcagrlenaverge:plotlcagrlenaverge,
	extractGlobal:extractGlobal,
	cleanFolder:cleanFolder
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
