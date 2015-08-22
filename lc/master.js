var cluster = require('cluster');
var fs = require('fs');
var _ = require('underscore')._;
var bars = require(__dirname+'/../utils/bars');
var distance = require(__dirname+'/../utils/distance');
var wikipedia = require(__dirname+'/../utils/wikipedia')
var child_process = require('child_process')
var partitions = require('limdu/utils/partitions');

var gnuplot = 'gnuplot'
var corpus = "Social Science"
var statusfile = __dirname + "/status"
var plotfile = __dirname + "/plotstatus"

function groupbylabel(dataset, minsize, sizetrain, catnames)
{

	var sends = _.groupBy(dataset , function(num){ return num['input']['CORENLP']['sentences'].length })
	console.log("sentence distribution")
	var sendist = {}
	_.each(sends, function(value, key, list){ 
		sendist[key]=value.length
	}, this)
	console.log(JSON.stringify(sendist, null, 4))

	var gro = _.groupBy(dataset, function(num){ return num["output"][0] })

	console.log("number of classses")
	console.log(Object.keys(gro).length)

	console.log("label distribution")
	
	var labdist = {}
	_.each(gro, function(value, key, list){ 
		labdist[catnames[key]] = value.length
	}, this)

	console.log(JSON.stringify(labdist, null, 4))

	_.each(gro, function(value, key, list){ 

		value = _.filter(value, function(num){ return num['input']['CORENLP']['sentences'].length >= minsize })
		value = _.map(value, function(num){ num["input"]["CORENLP"]["sentences"].splice(10) 
											return num });

		if (value.length < sizetrain)
			delete gro[key]
		else
			gro[key] = _.sample(value, sizetrain)
	}, this)

	var findist = {}
	_.each(gro, function(value, key, list){ 
		findist[catnames[key]] = value.length
	}, this)
	console.log(JSON.stringify(findist, null, 4))

	return gro
}

function extractGlobal(workerstats, stat)
{
	// var attributes = ["F1", "Accuracy", "macroF1"]
	// var attributes = ["Accuracy"]
	var attributes = Object.keys(workerstats['stats'])
	var trainsize = workerstats["trainsize"]
	var trainlen = workerstats["trainlen"]
	var classifier = workerstats["classifier"]
	var fold = workerstats["fold"]

	_.each(attributes, function(attr, key, list){ 
		if (!(attr in stat)) stat[attr]={}
		if (!(trainsize in stat[attr])) stat[attr][trainsize]={}
		if (!(trainlen in stat[attr][trainsize])) stat[attr][trainsize][trainlen]={}

		if (!(classifier in stat[attr][trainsize][trainlen])) 
				stat[attr][trainsize][trainlen][classifier] = {}
		
		// stat[attr][trainsize][trainlen][classifier][fold] = workerstats[attr]
		stat[attr][trainsize][trainlen][classifier][fold] = workerstats['stats'][attr]

	}, this)
}

function hmcalc(fold, stat, baseline, sota)
{
	var output = []
	if (fold != 'average')
	{
		_.each(stat, function(rowvalue, row, list){ 
			_.each(rowvalue, function(data, column, list){
				if ((sota in data) && (baseline in data))
				{
					if ((fold in data[sota]) && (fold in data[baseline]))
					{
						var result = data[sota][fold] - data[baseline][fold]
						if (bars.isNumber(result))
							output.push([parseInt(row), parseInt(column), result])
					}
				}
			}, this)
		}, this)	
	}
	else
	{
		_.each(stat, function(rowvalue, row, list){ 
			_.each(rowvalue, function(data, column, list){ 
				if ((sota in data) && (baseline in data))
				{
					if ((_.toArray(data[baseline]).length == _.toArray(data[sota]).length) &&
						(distance.isVectorNumber(_.toArray(data[baseline]))) && (distance.isVectorNumber(_.toArray(data[sota]))))
					{
						var result = distance.vec_minus(_.toArray(data[baseline]), _.toArray(data[sota]))
						var average = distance.average(result)
						output.push([parseInt(row), parseInt(column), average])
					}
				}
			}, this)
		}, this)
	}

	output = _.sortBy(output, function(num){ return num[0] })

	return  output
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


function plotlcagrlen(fold, stat)
{

	var classifier_hash = {}

	_.each(stat, function(value, len, list){
		_.each(value, function(folds, clas, list){
			if (!(clas in classifier_hash))
				classifier_hash[clas] = []

			if (fold in folds)
				classifier_hash[clas].push(folds[fold])
			else
			{
				if (fold == "average")
					classifier_hash[clas].push(plotlcagrlenaverge(folds))
			}

		}, this)
	}, this)

	console.log(JSON.stringify(classifier_hash, null, 4))
	console.log("------------------------------------")

	_.each(classifier_hash, function(value, key, list){ 
		classifier_hash[key] = distance.average(value)
	}, this)

	return classifier_hash
}

function plotlcagr(fold, stat)
{
	var output = []
		
	_.each(stat, function(trainlens, trainsize, list){
		var avr = plotlcagrlen(fold, trainlens)

		if (output.length == 0)
			output.push(["size"].concat(_.keys(avr)))

		output.push([trainsize].concat(_.values(avr)))
	})

	return output
}

function filtrain(train, index, startwith)
{
	startwith = 0

	if (index==0)
	{
		console.log("index is 0")
		process.exit(0)
	}
	var output = []
	_.each(train, function(value, key, list){ 
		value1 = JSON.parse(JSON.stringify(value))
		value1["input"]["CORENLP"]["sentences"] = value["input"]["CORENLP"]["sentences"].slice(startwith, index+startwith)	
		output.push(value1)
	}, this)
	return output
}

function trainlen(train, index)
{
	if (index == 0)
	{
		console.log("trainlen index is 0")
		process.exit(0)
	}

	if (!(_.isArray(train[0])))
	{
		console.log("array is not inside")
		process.exit(0)
	}

	if (_.isArray(train[0][0]))
	{
		console.log("object is not inside")
		process.exit(0)
	}

	return _.flatten(train.slice(0, index))
}

function getstringlc(output)
{
	return _.map(output, function(value){ return value.join("\t") }).join("\n")
}

function plotlc(fold, parameter, stat)
{

	fs.appendFileSync(plotfile, fold)
	fs.appendFileSync(plotfile, JSON.stringify(parameter, null, 4))

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

function learning_curves(classifiers, len, folds, dataset, callback)
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
			var worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len, 'thread': thr})
			
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

			var baseline = classifiers[0]
			var sotas = classifiers.slice(1)
			var fold = workerstats["fold"]
   	
   			_.each(sotas, function(sota, key, list){ 
            	_.each(stat, function(data, param, list){
					plot(fold, param, stat, baseline, sota)
					plot('average', param, stat, baseline, sota)
				})
		   	}, this)

		   	_.each(stat, function(data, param, list){
				plotlc(fold, param, stat)
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

function isInt(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}

if (process.argv[1] === __filename)
{
	var folds = 3
	var len = 1
	var perlabelsize = 3

	//var classifiers = ['TC', 'TCBOCWN', 'TCBOCPPDBS', 'TCBOCPPDBM']
	var classifiers = ['IntentClass']
	fs.writeFileSync(statusfile, "")
	fs.writeFileSync(plotfile, "")

	var datafilepath = __dirname+"/../../wiki/en/social_small/cluster/"

	var lc = __dirname + "/lc"
	var hm = __dirname + "/hm"

	var dataset = JSON.parse(fs.readFileSync(__dirname + "/../../datasets/DatasetDraft/dial_usa_rule_core.json"))
	var filtered = bars.filterdataset(dataset, 5)

	// clean graphs
	_.each([lc,hm,datafilepath], function(type, key, list){ 
		var graph_files = fs.readdirSync(type)

		_.each(graph_files, function(value, key, list){ 
			fs.unlinkSync(type+"/"+value)
		}, this)
	}, this)

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

	learning_curves(classifiers, len, folds, filtered, function(){
		console.log()
		process.exit(0)
	})	
}

module.exports = {
	plotlcagr: plotlcagr,
	filtrain:filtrain,
	trainlen:trainlen,
	getstringlc:getstringlc,
	plotlcagrlen:plotlcagrlen,
	plotlcagrlenaverge:plotlcagrlenaverge,
	hmcalc:hmcalc,
	isInt:isInt
} 


