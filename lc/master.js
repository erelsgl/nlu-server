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
	var trainsize = workerstats["trainsize"]
	var classifier = workerstats["classifier"]
	var fold = workerstats["fold"]

	_.each(attributes, function(attr, key, list){ 
		if (!_.isNull(workerstats['stats'][attr]))
		{
			if (!(attr in stat)) stat[attr]={}
			if (!(trainsize in stat[attr])) stat[attr][trainsize]={}
			
			if (!(classifier in stat[attr][trainsize])) 
					stat[attr][trainsize][classifier] = {}
			
			stat[attr][trainsize][classifier][fold] = workerstats['stats'][attr]
		}
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
	return distance.average(_.values(stat))
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

// 	{
//     "DS_unigram": {
//         "1": 0.5832531280076997,
//         "2": 0.5554585152838428
//     }
// }


	var classifier_hash = {}

		_.each(stat, function(folds, clas, list){
			if (!(clas in classifier_hash))
				classifier_hash[clas] = []

			if (fold in folds)
				classifier_hash[clas].push(folds[fold])
			else
			{
				if (fold == "average")
					classifier_hash[clas].push(plotlcagrlenaverge(folds))
			}

			if (classifier_hash[clas].length > 1)
				console.log("IHA it's an array")

		}, this)

	// console.log(JSON.stringify(classifier_hash, null, 4))
	// console.log("------------------------------------")

	_.each(classifier_hash, function(value, key, list){ 
		classifier_hash[key] = distance.average(value)
	}, this)

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
	return _.map(output, function(value){ return value.join("\t") }).join("\n")
}

//  fold can be 'average'
function plotlc(fold, parameter, stat)
{

	fs.appendFileSync(plotfile, fold)
	fs.appendFileSync(plotfile, JSON.stringify(parameter, null, 4))

	// build output in the format size * classifiers
	var output = plotlcagr(fold, stat[parameter])

	var classifiers = output[0].slice(1)

	var string = getstringlc(output)

	var mapfile = __dirname+"/learning_curves/"+fold+"_"+parameter

	fs.appendFileSync(plotfile, string)
    fs.writeFileSync(mapfile, string)

    var command = gnuplot +" -e \"set output 'lc/learning_curves/"+fold+"_"+parameter+".png'\" "+__dirname+"/lc.plot " + "-e \"plot for [i=2:"+(classifiers.length+1)+"] \'"+mapfile+"\' using 1:i:xtic(1) with linespoints linecolor i pt "+(fold == 'average' ? 0 : fold)+" ps 3\""
    console.log(command)
    child_process.execSync(command)

}

// there is a worker for every classifier and every fold
function learning_curves(classifiers, folds, dataset, callback)
{
	var stat = {}
	var thr = 0

	cluster.setupMaster({
  	exec: __dirname + '/worker_async.js',
  	// exec: __dirname + '/worker.js',
	// args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
	// silent: false
	});

	_.each(classifiers, function(classifier, key, list){ 
		_(folds).times(function(fold){
		
			// worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len, 'datafile': datafile, 'thread': thr})
			var worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'thread': thr})
			
			var data = partitions.partitions_consistent_by_fold(dataset, folds, fold)

			console.log("DEBUG: train size "+data.train.length)
			console.log("DEBUG: test size "+data.test.length)
			
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
				workerstats = JSON.parse(message)
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
	var folds = 2

	//var classifiers = ['DS_bigram_split_async', 'DS_bigram_split_embed', 'DS_bigram_split_embed_unig', 'DS_bigram_split_exp']
	//var classifiers = ['DS_bigram_split_async', 'DS_bigram_split_embed', 'DS_bigram_split_exp']
	var classifiers = ['DS_bigram_split_async']

	fs.writeFileSync(statusfile, "")
	fs.writeFileSync(plotfile, "")

	// var dataset = bars.loadds(__dirname+"/../../negochat_private/dialogues")
	// var utterset = bars.getsetnocontext(dataset)
	
	var data = JSON.parse(fs.readFileSync(__dirname+"/../../negochat_private/parsed.json"))
	var utterset = bars.getsetcontext(data)
	var dataset = utterset["train"].concat(utterset["test"])

	// dataset = dataset.slice(0,20)

	// clean graphs
	var lc = __dirname + "/learning_curves"
	var graph_files = fs.readdirSync(lc)

	_.each(graph_files, function(value, key, list){ 
		fs.unlinkSync(lc+"/"+value)
	}, this)

	console.log("DEBUG: master: dataset size "+ dataset.length)

	learning_curves(classifiers, folds, dataset, function(){
		console.log()
		process.exit(0)
	})	
}

module.exports = {
	plotlcagr: plotlcagr,
	getstringlc:getstringlc,
	plotlcagrlen:plotlcagrlen,
	plotlcagrlenaverge:plotlcagrlenaverge,
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
