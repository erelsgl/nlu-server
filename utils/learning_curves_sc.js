/*
	Draw learning curves of classifiers
	A "learning curve" is a graph of the performance of a certain classifier, as a function of the number of training instances.
	You can draw learning curves of several classifiers on the same graph, for the sake of comparison.
	You can measure the performance can using several parameters, such as: accuracy, F1, etc.
	The graphs are drawn by "gnuplot", so you must have gnuplot installed in order to use this unit.
	@author Vasily Konovalov
 */


var _ = require('underscore')._;
var fs = require('fs');
var execSync = require('execSync')
var classifier = require(__dirname+"/../classifiers.js")
var partitions = require('limdu/utils/partitions');
var trainAndTest_hash = require(__dirname+'/trainAndTest').trainAndTest_hash;
var bars = require(__dirname+'/bars');
var distance = require(__dirname+'/distance');
var path = require("path")

// var gnuplot = __dirname + '/gnuplot5'
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
function plot(fold, parameter, stat, classifiers)
{
	classifiers = Object.keys(classifiers)
	stat = stat[parameter]
	
	var output = []
		
	if (fold != 'average')
	{
		_.each(stat, function(rowvalue, row, list){ 
			_.each(rowvalue, function(data, column, list){ 
				var result = data[classifiers[0]][fold] - data[classifiers[1]][fold]
				output.push([row, column, result])
			}, this)
		}, this)	
	}
	else
	{
		_.each(stat, function(rowvalue, row, list){ 
			_.each(rowvalue, function(data, column, list){ 
				var result = distance.vec_minus(data[classifiers[0]], data[classifiers[1]])
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

    fs.writeFileSync(__dirname+"/map", string)

    execSync.run(gnuplot +" -e \"set output 'utils/"+parameter+"_"+fold+".png'\" "+__dirname+"/com")
}

function extractGlobal(classifiers, train, length, report, stat)
{
	var attributes = ["F1", "macroF1"]

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

function filtrain(train, index)
{
	var output = []
	_.each(train, function(value, key, list){ 
		value["input"]["CORENLP"]["sentences"].splice(0,index)
		output.push(value)
	}, this)
	return output
}

function learning_curves(classifiers, dataset, numOfFolds) 
{

		checkGnuPlot

		if (dataset.length == 0)
			throw new Error("Dataset is empty");
		
		stat = {}

		partitions.partitions_consistent(dataset, numOfFolds, function(train, test, fold) {
			var index = 0
			var stats

			while (index <= train.length)
	  		{
			  	var report = []
				
				index += 1
				var mytrainset = train.slice(0, index)
				

				if (mytrainset.length > 100)
					break
			  	
			  	_(3).times(function(n){

			  		n += 1

					mytrainset = filtrain(mytrainset, n)
			  				  	
				  	_.each(classifiers, function(classifier, name, list){ 
				  		console.log("start trainandTest")
		    			stats = trainAndTest_hash(classifier, mytrainset, test, 5)
			    		console.log("stop trainandTest")
			    		
			    		report.push(stats['stats'])
				  	}, this)
			  	
			   	    extractGlobal(classifiers, mytrainset.length, n,  report, stat)

                    _.each(stat, function(data, param, list){
	                	// build plot for param 
						plot(fold, param, stat, classifiers)
						plot('average', param, stat, classifiers)
					})
				})
			} //while (index < train.lelearning_curveslearning_curvesngth)
		})

}

if (process.argv[1] === __filename)
{

	var path = "../wikipedia"
	var files = fs.readdirSync(path)
	files = _.filter(files, function(num){ return num.indexOf("json") != -1 })
	var data = []

	_.each(files, function(file, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("../wikipedia/" + file)))
	}, this)


	// var field = "BODY"
	
	// var path = __dirname + "/../../reuters2json/R8/"

	// var train_files = fs.readdirSync(path + "train")
	// var test_files = fs.readdirSync(path + "test")

	// var train_data = []

	// _.each(train_files, function(file, key, list){ 
	// 	console.log("load train"+key)
	// 	train_data = train_data.concat(JSON.parse(fs.readFileSync(path+"train/"+file)))
	// }, this)

	// var test_data = []

	// _.each(test_files, function(file, key, list){ 
	// 	console.log("load test"+key)
	// 	test_data = test_data.concat(JSON.parse(fs.readFileSync(path+"test/"+file)))
	// }, this)

	// var train_data = _.compact(_.map(train_data, function(value){ var elem = {}
	// 														if ('BODY' in value['TEXT']) 
	// 															{
	// 															value['CORENLP'] = value['BODY_CORENLP']
	// 															delete value['TITLE_CORENLP']
	// 															elem['input'] =  value
	// 															elem['output'] = value['TOPICS'][0]
	// 															return elem
	// 															} 
	// 														}))

	// console.log("train is loaded")

	// var test_data = _.compact(_.map(test_data, function(value){ var elem = {}
	// 														if ((field in value['TEXT']) && (value['$']['NEWID'] != '20959')) 
	// 															{
	// 															value['CORENLP'] = value[field+'_CORENLP']
	// 															// delete value['TITLE_CORENLP']
	// 															elem['input'] = value
	// 															elem['input']['input'] = value['TEXT'][field]
	// 															elem['output'] = value['TOPICS'][0]
	// 															return elem
	// 															}
	// 														}))


	// console.log("test is ready")

	// console.log(train_data.length)
	// console.log(test_data.length)

	// test_data = _.shuffle(test_data)

	var data = _.map(data, function(value){ var elem = {}
											// value["CORENLP"]["sentences"].splice(3, value["CORENLP"]["sentences"].length)
											// value["CORENLP"]["sentences"].splice(0, 5)
											elem['input'] = value
											elem['input']['input'] = value["text"]
											elem['output'] = value['categories']
											return elem
										})


	data = _.shuffle(data)

	var classifiers  = {
				
				TC: classifier.TC,
				TCPPDB: classifier.TCPPDB

			}

	learning_curves(classifiers, data, 5/*numOfFolds*/, function(){
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
	thereisdata:thereisdata
}
