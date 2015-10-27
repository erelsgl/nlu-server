var cluster = require('cluster');
var fs = require('fs');
var _ = require('underscore')._;
var bars = require(__dirname+'/../utils/bars');
var distance = require(__dirname+'/../utils/distance');
var child_process = require('child_process')
var partitions = require('limdu/utils/partitions');

var gnuplot = 'gnuplot'
// var corpus = "Social Science"
var statusfile = __dirname + "/status"
var plotfile = __dirname + "/plotstatus"

// function groupbylabel(dataset, minsize, sizetrain, catnames)
// {

// 	var sends = _.groupBy(dataset , function(num){ return num['input']['CORENLP']['sentences'].length })
// 	console.log("sentence distribution")
// 	var sendist = {}
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
		if (!(attr in stat)) stat[attr]={}
		if (!(trainsize in stat[attr])) stat[attr][trainsize]={}
		
		if (!(classifier in stat[attr][trainsize])) 
				stat[attr][trainsize][classifier] = {}
		
		stat[attr][trainsize][classifier][fold] = workerstats['stats'][attr]

	}, this)
}

// function hmcalc(fold, stat, baseline, sota)
// {
// 	var output = []
// 	if (fold != 'average')
// 	{
// 		_.each(stat, function(rowvalue, row, list){ 
// 			_.each(rowvalue, function(data, column, list){
// 				if ((sota in data) && (baseline in data))
// 				{
// 					if ((fold in data[sota]) && (fold in data[baseline]))
// 					{
// 						var result = data[sota][fold] - data[baseline][fold]
// 						if (bars.isNumber(result))
// 							output.push([parseInt(row), parseInt(column), result])
// 					}
// 				}
// 			}, this)
// 		}, this)	
// 	}
// 	else
// 	{
// 		_.each(stat, function(rowvalue, row, list){ 
// 			_.each(rowvalue, function(data, column, list){ 
// 				if ((sota in data) && (baseline in data))
// 				{
// 					if ((_.toArray(data[baseline]).length == _.toArray(data[sota]).length) &&
// 						(distance.isVectorNumber(_.toArray(data[baseline]))) && (distance.isVectorNumber(_.toArray(data[sota]))))
// 					{
// 						var result = distance.vec_minus(_.toArray(data[baseline]), _.toArray(data[sota]))
// 						var average = distance.average(result)
// 						output.push([parseInt(row), parseInt(column), average])
// 					}
// 				}
// 			}, this)
// 		}, this)
// 	}

// 	output = _.sortBy(output, function(num){ return num[0] })

// 	return  output
// }

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

	var mapfile = __dirname+"/lc/"+fold+"_"+parameter

	fs.appendFileSync(plotfile, string)
    fs.writeFileSync(mapfile, string)

    var command = gnuplot +" -e \"set output 'lc/lc/"+fold+"_"+parameter+".png'\" "+__dirname+"/lc.plot " + "-e \"plot for [i=2:"+(classifiers.length+1)+"] \'"+mapfile+"\' using 1:i:xtic(1) with linespoints linecolor i pt "+(fold == 'average' ? 0 : fold)+" ps 3\""
    console.log(command)
    child_process.execSync(command)

}

// there is a worker for every classifier and every fold
function learning_curves(classifiers, folds, dataset, callback)
{

	// datafile
	var stat = {}
	var thr = 0

	cluster.setupMaster({
  	exec: __dirname + '/worker.js',
	// args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
	// silent: false
	});

	_.each(classifiers, function(classifier, key, list){ 
		_(folds).times(function(fold){
		
			// worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len, 'datafile': datafile, 'thread': thr})
			var worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'thread': thr})
			
			var data = partitions.partitions_consistent_by_fold(dataset, folds, fold)
			
			worker.send({ 
						'train': JSON.stringify(data['train']), 
						'test': JSON.stringify(data['test']) 
						})
			thr += 1	
		})
	}, this)

	_.each(Object.keys(cluster.workers), function(id, worker, list){ 
	    cluster.workers[id].on('message', function(message){
			workerstats = JSON.parse(message)

			extractGlobal(workerstats, stat)

			fs.appendFileSync(statusfile, JSON.stringify(workerstats, null, 4))
			fs.appendFileSync(statusfile, JSON.stringify(stat, null, 4))

            // var Ac = workerstats['Accuracy']
            // if (_.isNaN(Ac) || _.isNull(Ac) || _.isUndefined(Ac))
            // {
				// console.log("Accuracy is not OK")
				// process.exit(0)
			// }

			// var baseline = classifiers[0]
			// all other classifiers without baseline
			// var sotas = classifiers.slice(1)
			var fold = workerstats["fold"]
   	
   			// _.each(sotas, function(sota, key, list){ 
            	// _.each(stat, function(data, param, list){
					// plot(fold, param, stat, baseline, sota)
					// plot('average', param, stat, baseline, sota)
				// })
		   	// }, this)

		   	_.each(stat, function(data, param, list){
				// update the graph for current fold per parameter
				plotlc(fold, param, stat)
				// build average per parameters
				plotlc('average', param, stat)
			})
		})
	}, this)

	_.each(Object.keys(cluster.workers), function(id, worker, list){ 
	    cluster.workers[id].on('disconnect', function(){
		  	console.log("master: " + id + " finished")
		  	if (Object.keys(cluster.workers) == 0)
				console.log("all workers are disconnected")
		})
	})
}

// function isInt(value) {
  // return !isNaN(value) && 
         // parseInt(Number(value)) == value && 
         // !isNaN(parseInt(value, 10));
// }

if (process.argv[1] === __filename)
{
	var folds = 5

	//var classifiers = ['TC', 'TCBOCWN', 'TCBOCPPDBS', 'TCBOCPPDBM']
	var classifiers = ['DS_unigram', 'DS_bigram']

	fs.writeFileSync(statusfile, "")
	fs.writeFileSync(plotfile, "")

	var lc = __dirname + "/lc"
	// var hm = __dirname + "/hm"
	// var datafilepath = "/tmp/pic"

	var dataset = bars.loadds(__dirname+"/../../negochat_private/dialogues")
	var utterset = bars.getsetnocontext(dataset)
	
	var dataset = utterset["train"].concat(utterset["test"])

	// clean graphs
	// _.each(lc, function(type, key, list){ 
	var graph_files = fs.readdirSync(lc)

	_.each(graph_files, function(value, key, list){ 
		fs.unlinkSync(lc+"/"+value)
	}, this)
	
	// }, this)
// 
	// var data = wikipedia.load_wikipedia("social_small")

	// var catnames = {}
	// _.each(data, function(record, key, list){ 
	// 	catnames[record['catid']] = record['catname']
	// }, this)
	
	// convert corpus
	// var st_data = []

	// _.each(data, function(value, key, list){ 
	// 	value['input'] = value["text"]
	// 	st_data.push({'input':value, 'output':value["catid"]})
	// }, this)

	// console.log("size before filtering "+st_data.length)
	// st_data = _.filter(st_data, function(num){ return isInt(num["output"][0])})
	// console.log("size after filtering "+st_data.length)

	// console.log("catnames")
	// console.log(JSON.stringify(catnames, null, 4))
	// modify corpus
	// var datahash = groupbylabel(st_data, len, perlabelsize, catnames)
	// console.log("master: dataset groupped")

	// _.each(datahash, function(value, key, list){ 
	// 	console.log("master: write "+key)
	// 	fs.writeFileSync(datafilepath + key, JSON.stringify(value))
	// }, this)
	
	// console.log("master: dataset size "+_.flatten(_.toArray(datahash)).length)
	// console.log("master: labels "+ Object.keys(datahash).length)
	// console.log("master: dataset saved")

	// console.log(JSON.stringify(filtered, null, 4))
	// console.log(_.isArray(filtered))
	// console.log()
	// process.exit(0)

	learning_curves(classifiers, folds, dataset, function(){
		console.log()
		process.exit(0)
	})	
}

module.exports = {
	plotlcagr: plotlcagr,
	// filtrain:filtrain,
	// trainlen:trainlen,
	getstringlc:getstringlc,
	plotlcagrlen:plotlcagrlen,
	plotlcagrlenaverge:plotlcagrlenaverge,
	// hmcalc:hmcalc,
	// isInt:isInt
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
