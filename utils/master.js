var cluster = require('cluster');
var fs = require('fs');
var _ = require('underscore')._;
var bars = require(__dirname+'/bars');
var distance = require(__dirname+'/distance');
var execSync = require('execSync')
var wikipedia = require('./wikipedia')

var gnuplot = 'gnuplot'
var corpus = "JEL"
var statusfile = __dirname + "/status"

function groupbylabel(dataset, minsize, sizetrain)
{

	var sends = _.groupBy(dataset , function(num){ return num['input']['CORENLP']['sentences'].length })
	console.log("sentence distribution")
	_.each(sends, function(value, key, list){ 
		console.log(key)
		console.log(value.length)
		console.log("-------------")
	}, this)

	var gro = _.groupBy(dataset, function(num){ return num["output"][0] })

	console.log("number of classses")
	console.log(Object.keys(gro).length)

	console.log("label distribution")
	_.each(gro, function(value, key, list){ 
		console.log(key)
		console.log(value.length)
		console.log("-------------")
	}, this)

	_.each(gro, function(value, key, list){ 

		value = _.filter(value, function(num){ return num['input']['CORENLP']['sentences'].length >= minsize })
		value = _.map(value, function(num){ num["input"]["CORENLP"]["sentences"].splice(10) 
											return num });

		if (value.length < sizetrain)
			delete gro[key]
		else
			gro[key] = _.sample(value, sizetrain)
	}, this)

	return gro
}

function extractGlobal(workerstats, stat)
{
	var attributes = ["F1", "Accuracy", "macroF1"]
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
		
		stat[attr][trainsize][trainlen][classifier][fold] = workerstats[attr]

	}, this)
}

function plot(fold, patrainlenrameter, stat, baseline, sota)
{
	stat = stat[parameter]

	var output = []
		
	if (fold != 'average')
	{
		_.each(stat, function(rowvalue, row, list){ 
			_.each(rowvalue, function(data, column, list){ 
				var result = data[sota][fold] - data[baseline][fold]
				if (bars.isNumber(result))
					output.push([row, column, result])
			}, this)
		}, this)	
	}
	else
	{
		_.each(stat, function(rowvalue, row, list){ 
			_.each(rowvalue, function(data, column, list){ 
				var result = distance.vec_minus(_.toArray(data[baseline]), _.toArray(data[sota]))
				var average = distance.average(result)
				output.push([row, column, average])
			}, this)
		}, this)
	}

	var results = _.groupBy(output, function(num){ return num[0] })
	var string = ""

	_.each(results, function(value, key, list){ 
		_.each(value, function(value1, key1, list1){ 
			string += value1.join(" ")+"\n"
		}, this)
		string += "\n"
	}, this)

	var mapfile = __dirname+"/hm/map_"+fold+"_"+parameter+"_"+sota+"-"+baseline

    fs.writeFileSync(mapfile, string)

    var command = gnuplot +" -e \"set title '"+corpus+" : "+sota+" - "+baseline+"'; set output 'utils/hm/"+fold+"_"+parameter+"_"+sota+"-"+baseline+".png'\" "+__dirname+"/hm.plot " + "-e \"plot \'"+mapfile+"\' using 2:1:3 with image\""
    console.log(command)
    execSync.run(command)
}


function plotlcagr(fold, len, stat)
{

	var classifiers = []

	var output = []
		
	if (fold != 'average')
	{
		_.each(stat, function(trainlens, trainsize, list){
			if (output.length == 0)
			{
				output.push(['size'].concat(Object.keys(trainlens[len])))
				classifiers = Object.keys(trainlens[len])
			}
			var foldslist = _.toArray(trainlens[len])
			var foldlist = _.pluck(foldslist, fold)
			foldlist.unshift(trainsize)
			output.push(foldlist)
		}, this)	
	}
	else
	{
		_.each(stat, function(trainlens, trainsize, list){ 
			if (output.length == 0)
			{
				output.push(['size'].concat(Object.keys(trainlens[len])))
				classifiers = Object.keys(trainlens[len])
			}
			var foldslisthash = _.toArray(trainlens[len])
			var foldslist = _.map(foldslisthash, function(value){ return _.toArray(value) })
			var foldslistaverage = _.map(foldslist, function(value){ return distance.average(value) })
			foldslistaverage.unshift(trainsize)
			output.push(foldslistaverage)
		}, this)
	}

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
		var value1 = JSON.parse(JSON.stringify(value))
		value1["input"]["CORENLP"]["sentences"] = value1["input"]["CORENLP"]["sentences"].slice(startwith, index+startwith)
		output.push(value1)
	}, this)
	return output
}

function trainlen(train, index)
{
	var train1 = JSON.parse(JSON.stringify(train))

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

	return _.flatten(train1.slice(0, index))
}

function plotlc(fold, parameter, len, stat)
{

	stat = stat[parameter]
	var output = plotlcagr(fold, len, stat)

	var classifiers = output[0].slice(1)

	var string = _.map(output, function(value){ return value.join("\t") }).join("\n")

	var mapfile = __dirname+"/lc/"+fold+"_"+parameter

    fs.writeFileSync(mapfile, string)

    var command = gnuplot +" -e \"set output 'utils/lc/"+fold+"_"+parameter+".png'\" "+__dirname+"/lc.plot " + "-e \"plot for [i=2:"+(classifiers.length+1)+"] \'"+mapfile+"\' using 1:i:xtic(1) with linespoints linecolor i pt "+(fold == 'average' ? 0 : fold)+" ps 3\""
    console.log(command)
    execSync.run(command)
}

function learning_curves(classifiers, len, folds, datafile, callback)
{
	var stat = {}

	_.each(classifiers, function(classifier, key, list){ 

		_(folds).times(function(fold){

			cluster.setupMaster({
		  	exec: __dirname + '/worker.js',
		  // args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
		  // silent: false
			});

			worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len, 'datafile': datafile})

			worker.on('message', function(message){
				workerstats = JSON.parse(message)
				extractGlobal(workerstats, stat)
				fs.appendFileSync(statusfile, JSON.stringify(workerstats, null, 4))
			})

			worker.on('disconnect', function() {
			  	console.log("finished")

			  	if (Object.keys(cluster.workers) == 0)
			  	{
					// console.log("all workers are disconnected")
				   	var baseline = classifiers[0]
				   	var sotas = classifiers.slice(1)

				   	_(folds).times(function(fold){
				   		_.each(sotas, function(sota, key, list){ 
	                  		_.each(stat, function(data, param, list){
								plot(fold, param, stat, baseline, sota)
								plot('average', param, stat, baseline, sota)
							})
				   		}, this)
				   })

					_(folds).times(function(fold){
	                  	_.each(stat, function(data, param, list){
							plotlc(fold, param, len-1, stat)
							plotlc('average', param, len-1, stat)
						})
				   })
			  	}
			})
		})
	}, this)
}

if (process.argv[1] === __filename)
{
	var folds = 2
	var len = 2
	var classifiers = ['TCBOC', 'TC']
	fs.writeFileSync(statusfile, "")

	// clean graphs
	_.each(['lc','hm'], function(type, key, list){ 
		var curves_path = __dirname + "/"+type
		var graph_files = fs.readdirSync(curves_path)

		_.each(graph_files, function(value, key, list){ 
			fs.unlinkSync(curves_path+"/"+value)
		}, this)
	}, this)

	var data = wikipedia.load_wikipedia("social")
	
	// convert corpus
	var st_data = []

	_.each(data, function(value, key, list){ 
		value['input'] = value["text"]
		st_data.push({'input':value, 'output':value["catid"]})
	}, this)

	// modify corpus
	var datahash = groupbylabel(st_data, len, 50)
	console.log("master: dataset groupped")

	var datafile = __dirname+"/../../wiki/en/social/datahash.json"
	fs.writeFileSync(datafile, JSON.stringify(datahash))
	console.log("master: dataset saved")

	learning_curves(classifiers, len, folds, datafile, function(){
		console.log()
		process.exit(0)
	})	
}

module.exports = {
	plotlcagr: plotlcagr,
	filtrain:filtrain,
	trainlen:trainlen
} 
