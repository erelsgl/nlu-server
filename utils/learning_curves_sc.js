/*
	Draw learning curves of classifiers
	A "learning curve" is a graph of the performance of a certain classifier, as a function of the number of training instances.
	You can draw learning curves of several classifiers on the same graph, for the sake of comparison.
	You can measure the performance can using several parameters, such as: accuracy, F1, etc.
	The graphs are drawn by "gnuplot", so you must have gnuplot installed in order to use this unit.
	@author Vasily Konovalov
 */

var async = require('async');
var Fiber = require('fibers');
var _ = require('underscore')._;
var fs = require('fs');
var execSync = require('execSync')
var classifier = require(__dirname+"/../classifiers.js")
var partitions = require('limdu/utils/partitions');
var trainAndTest_hash = require(__dirname+'/trainAndTest').trainAndTest_hash;
var trainAndTest_async = require(__dirname+'/trainAndTest').trainAndTest_async;
var bars = require(__dirname+'/bars');
var distance = require(__dirname+'/distance');
var path = require("path")

var gnuplot = 'gnuplot'
var dirr = "/learning_curves/"

function onlyNumbers(list)
{
	var output = []
	_.each(list, function(value, key, list){ 
		if (bars.isNumber(value))
			output.push(value)
	}, this)
	return output
}

function getAverage(stat, param, trainsize, classifiers)
	{
		var average = []
		_.each(Object.keys(classifiers), function(classifier, key, list){
			var list = onlyNumbers(stat[param][trainsize][classifier])
			average.push(_.reduce(list , function(memo, num){ if (num >=0) {return (memo + num)} else {return memo} }, 0)/_.filter(list, function(num){ return num >= 0 }).length
)
		}, this)
		
		return average
	}

function checkGnuPlot()
	{
		var result = execSync.run(gnuplot);
		if (result !=0 ) {
			console.log("gnuplot is not found")
			return 0
		}
	}

function isProb(results)
{
	return _.filter(results, function(num){ return ((num > 1)  || (num<0))}).length == 0
}

function filternan(input)
{
	if (_.isArray(input))
	{
		var output = []

		_.each(input, function(value, key, list){ 
			if (bars.isNumber(value))
			{
				if (value != -1)
					output.push(value)
				else
					output.push("?")
			}
			else
				output.push("?")
		}, this)
	}
	else
	{
		var output = ''
		if (bars.isNumber(input))
		{
			if (input != -1)
				output = input
			else
				output = "?"
		}
		else
			output = "?"
	}
	return output
}

function thereisdata(data)
{
	var output = false
	if (_.isArray(data))
		{
			_.each(data, function(elem, key, list){
				if (elem != '?')				
					output = true
			}, this)
		}
	else
		if (data != '?')
			output = true

	return output
}

// only two classifiers in string format
function plot(fold, parameter, stat, baseline, sota)
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
				var result = distance.vec_minus(data[baseline], data[sota])
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

	var mapfile = __dirname+"/learning_curves/map_"+fold+"_"+parameter+"_"+baseline+"_"+sota

    fs.writeFileSync(mapfile, string)

    var command = gnuplot +" -e \"set output 'utils/learning_curves/"+fold+"_"+parameter+"_"+baseline+"_"+sota+".png'\" "+__dirname+"/com " + "-e \"plot \'"+mapfile+"\' using 2:1:3 with image\""
    console.log(command)
    execSync.run(command)

}


function extractGlobal(classifiers, train, length, report, stat)
{
	var attributes = ["F1", "Accuracy", "macroF1"]

	if (_.size(classifiers) == 0)
		throw new Error("List of classifiers is empty");

	_.each(attributes, function(attr, key, list){ 
		if (!(attr in stat)) stat[attr]={}
		if (!(train in stat[attr])) stat[attr][train]={}
		if (!(length in stat[attr][train])) stat[attr][train][length]={}

		_.each(Object.keys(classifiers), function(classifier, clkey, list){
			if (!(classifier in stat[attr][train][length])) 
				stat[attr][train][length][classifier] = []
			
			stat[attr][train][length][classifier].push(report[clkey][attr])

		}, this)

	}, this)
}

function filtrain(train, index, startwith)
{
	var output = []
	_.each(train, function(value, key, list){ 
		var value1 = JSON.parse(JSON.stringify(value))
		value1["input"]["CORENLP"]["sentences"] = value1["input"]["CORENLP"]["sentences"].slice(startwith, index+startwith)
		output.push(value1)
	}, this)
	return output
}

function setstat(data)
{


var bytrainsize = _.groupBy(data, function(num){ return num["output"][0] })
var bytrainsizecount = {}

_.each(bytrainsize, function(value, key, list){
	bytrainsizecount[key] = value.length 
}, this)

var bynumsen = {}
_.each(bytrainsize, function(value, key, list){ 
	var sen = 0
	_.each(value, function(value1, key1, list){ 
		sen += value1["input"]["CORENLP"]["sentences"].length
	}, this)
	bynumsen[key] = sen
}, this)

var bychar = {}
_.each(bytrainsize, function(value, key, list){ 
	var tokens = 0
	_.each(value, function(value1, key1, list){ 
		_.each(value1["input"]["CORENLP"]["sentences"], function(sen, key, list){ 
			tokens += sen['tokens'].length
		}, this)
	}, this)
	bychar[key] = tokens
}, this)

var output = "bytrainsize\n" +JSON.stringify(bytrainsizecount, null, 4) + "\n" +
			 "bynumsen\n" + JSON.stringify(bynumsen, null, 4) + "\n" +
			 "bychar\n" + JSON.stringify(bychar, null, 4)

return output
}

function trainlen(train, index)
{
	return _.flatten(JSON.parse(JSON.stringify(train)).slice(0, index))
}

function learning_curves(classifiers, dataset, len, numOfFolds) 
{
	var f = Fiber(function() {

        var fiber = Fiber.current

		checkGnuPlot
		var statusfile = __dirname + "/learning_curves/status"

   		fs.writeFileSync(statusfile, "")

		if (Object.keys(dataset) == 0)
			throw new Error("Dataset is empty");
		
		stat = {}

		partitions.partitions_hash(dataset, numOfFolds, function(train, test, fold) {
			var index = 0
			var stats

			while (index <= train.length)
	  		{
				
			  	index += (index < 10 ? 1 : 15)
				
				var mytrainset = trainlen(train, index)

				if (!_.isObject(mytrainset[0]))
					throw new Error("flatten is not correct")
				
				if (_.isArray(mytrainset[0]))
					throw new Error("flatten is not correct")
				
				if (!("input" in mytrainset[0]))
					throw new Error("flatten is not correct")

			  	_(len).times(function(n){

			  		var report = []

			  		n += 1

					mytrain = filtrain(mytrainset, n, 1)

					async.eachSeries(Object.keys(classifiers), function(classifier, callback1){ 
				  	// _.each(classifiers, function(classifier, name, list){ 
				  		console.log("start trainandTest")
		    			trainAndTest_async(classifiers[classifier], mytrain, test, function(err, stats){
				    		console.log("stop trainandTest")
			   	    		fs.appendFileSync(statusfile, classifier+"\n")
			   	    		fs.appendFileSync(statusfile, JSON.stringify(stats['stats'], null, 4))
			   	    		report.push(stats['stats'])
				    		callback1()
		    			})
			    		
				  	}, function(err){
						fiber.run(report)
					})

					var report1 = Fiber.yield()

			   	    extractGlobal(classifiers, mytrain.length, n,  report1, stat)

			   	    fs.appendFileSync(statusfile, JSON.stringify(stat, null, 4))

			   	    console.log("calc stats")
			   	    fs.appendFileSync(statusfile, setstat(mytrain))
			   	    console.log("stop stats")
			   	    
			   	    var cllist = Object.keys(classifiers)
			   	    var baseline = cllist[0]
			   	    var sotas = cllist.slice(1)

			   	    _.each(sotas, function(sota, key, list){ 
                    	_.each(stat, function(data, param, list){
							plot(fold, param, stat, baseline, sota)
							plot('average', param, stat, baseline, sota)
						})
			   	    }, this)
				})
			} //while (index < train.lelearning_curveslearning_curvesngth)
		})

	})
f.run()
}

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

if (process.argv[1] === __filename)
{

	var curves_path = __dirname + "/learning_curves"
	var graph_files = fs.readdirSync(curves_path)

	_.each(graph_files, function(value, key, list){ 
		fs.unlinkSync(curves_path+"/"+value)
	}, this)

	var path = "../wiki/en/notempl/"
	var files = fs.readdirSync(path)
	files = _.filter(files, function(num){ return num.indexOf("json") != -1 })
	var data = []

	_.each(files, function(file, key, list){ 
		console.log(file)
		data = data.concat(JSON.parse(fs.readFileSync(path + file)))
	}, this)


	var st_data = []

	_.each(data, function(value, key, list){ 
		value['input'] = value["text"]
		st_data.push({'input':value, 'output':value["categories"]})
	}, this)

	// data = _.shuffle(data)
	
	var datahash = groupbylabel(st_data, 5, 50)
	console.log("dataset groupped")

	var classifiers  = {
				// first should be the baseline
				TC: classifier.TC,
				TCPPDB: classifier.TCPPDB

			}

	// learning_curves(classifiers, datahash, 5/*len*/, 5/*numOfFolds*/)
	learning_curves(classifiers, datahash, 5/*len*/, 5/*numOfFolds*/, function(){
		console.log()
		process.exit(0)
	})
		
}

module.exports = {
	learning_curves: learning_curves, 
	extractGlobal: extractGlobal,
	getAverage: getAverage,
	filternan:filternan,
	onlyNumbers:onlyNumbers,
	isProb:isProb,
	thereisdata:thereisdata,
	filtrain:filtrain,
	groupbylabel:groupbylabel,
	trainlen:trainlen
}
