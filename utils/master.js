var cluster = require('cluster');
var fs = require('fs');
var _ = require('underscore')._;
var bars = require(__dirname+'/bars');
var distance = require(__dirname+'/distance');
var wikipedia = require('./wikipedia')
var child_process = require('child_process')
var gnuplot = 'gnuplot'
var corpus = "Social Science"
var statusfile = __dirname + "/status"

function groupbylabel(dataset, minsize, sizetrain)
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
		labdist[key] = value.length
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
		findist[key] = value.length
	}, this)
	console.log(JSON.stringify(findist, null, 4))

	return gro
}

function extractGlobal(workerstats, stat)
{
	// var attributes = ["F1", "Accuracy", "macroF1"]
	var attributes = ["Accuracy"]
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

function plot(fold, parameter, stat, baseline, sota)
{
	var stat = stat[parameter]

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
							output.push([row, column, result])
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
					if (_.toArray(data[baseline]).length == _.toArray(data[sota]).length)
					{
						var result = distance.vec_minus(_.toArray(data[baseline]), _.toArray(data[sota]))
						var average = distance.average(result)
						output.push([row, column, average])
					}
				}
			}, this)
		}, this)
	}

	if ((output.length == 0) || (output.length<4) || (output.length % 2 != 0))
		return

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

    var command = gnuplot +" -e \"set title '"+corpus+" : "+sota+" - "+baseline+"'; set output 'utils/hm/"+fold+"_"+parameter+"_"+sota+"-"+baseline+".png'\" "+__dirname+"/hm.plot " + "-e \"plot \'"+mapfile+"\' using 2:1:3 with image \""
    
    console.log(command)
	child_process.execSync(command)
}


function plotlcagr(fold, stat)
{

	var classifiers = []

	console.log("plotlcagr")
	console.log(stat)

	var output = []
		
	if (fold != 'average')
	{
		_.each(stat, function(trainlens, trainsize, list){
			var len = _.max(Object.keys(trainlens), function(n){ return n })

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
			var len = _.max(Object.keys(trainlens), function(n){ return n })

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

	console.log("plotlcagr end")
	console.log(output)

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

	var output = plotlcagr(fold, stat[parameter])

	var classifiers = output[0].slice(1)

	var string = getstringlc(output)

	var mapfile = __dirname+"/lc/"+fold+"_"+parameter

    fs.writeFileSync(mapfile, string)

    var command = gnuplot +" -e \"set output 'utils/lc/"+fold+"_"+parameter+".png'\" "+__dirname+"/lc.plot " + "-e \"plot for [i=2:"+(classifiers.length+1)+"] \'"+mapfile+"\' using 1:i:xtic(1) with linespoints linecolor i pt "+(fold == 'average' ? 0 : fold)+" ps 3\""
    console.log(command)
    child_process.execSync(command)

}

function learning_curves(classifiers, len, folds, datafile, callback)
{
	var stat = {}
	var thr = 0

	_.each(classifiers, function(classifier, key, list){ 

		_(folds).times(function(fold){

			cluster.setupMaster({
		  	exec: __dirname + '/worker.js',
		  // args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
		  // silent: false
			});

			worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len, 'datafile': datafile, 'thread': thr})

			thr += 1

			worker.on('message', function(message){
				workerstats = JSON.parse(message)
				extractGlobal(workerstats, stat)
				fs.appendFileSync(statusfile, JSON.stringify(workerstats, null, 4))

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

			worker.on('disconnect', function() {
			  	console.log("master: " + worker.process.pid + " finished")

			  	if (Object.keys(cluster.workers) == 0)
					console.log("all workers are disconnected")
					
			})
		})
	}, this)
}

if (process.argv[1] === __filename)
{
	var folds = 10
	var len = 5
	var classifiers = ['TC', 'TCBOC']
	fs.writeFileSync(statusfile, "")

	var datafilepath = __dirname+"/../../wiki/en/social/cluster/"
	var lc = __dirname + "/lc"
	var hm = __dirname + "/hm"

	// clean graphs
	_.each([lc,hm,datafilepath], function(type, key, list){ 
		var graph_files = fs.readdirSync(type)

		_.each(graph_files, function(value, key, list){ 
			fs.unlinkSync(type+"/"+value)
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
	var datahash = groupbylabel(st_data, len, 200)
	console.log("master: dataset groupped")

	_.each(datahash, function(value, key, list){ 
		console.log("master: write "+key)
		fs.writeFileSync(datafilepath + key, JSON.stringify(value))
	}, this)


	console.log("master: dataset size "+_.flatten(_.toArray(datahash)).length)
	console.log("master: labels "+ Object.keys(datahash).length)
	console.log("master: dataset saved")

	learning_curves(classifiers, len, folds, datafilepath, function(){
		console.log()
		process.exit(0)
	})	
}

module.exports = {
	plotlcagr: plotlcagr,
	filtrain:filtrain,
	trainlen:trainlen,
	getstringlc:getstringlc
} 
