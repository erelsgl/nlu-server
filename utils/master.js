var cluster = require('cluster');
var fs = require('fs');
var _ = require('underscore')._;
var bars = require(__dirname+'/bars');
var distance = require(__dirname+'/distance');
var execSync = require('execSync')

var folds = 2
var len = 2
// var classifiers = ['TC', 'TCBOC']
var classifiers = ['TCBOC', 'TC']
var gnuplot = 'gnuplot'
var corpus = "JEL"
var statusfile = __dirname + "/learning_curves/status"

// var classifiers = ['TC', ]

var curves_path = __dirname + "/learning_curves"
var graph_files = fs.readdirSync(curves_path)

_.each(graph_files, function(value, key, list){ 
	fs.unlinkSync(curves_path+"/"+value)
}, this)


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

	var mapfile = __dirname+"/learning_curves/map_"+fold+"_"+parameter+"_"+sota+"-"+baseline

    fs.writeFileSync(mapfile, string)

    var command = gnuplot +" -e \"set title '"+corpus+" : "+sota+" - "+baseline+"'; set output 'utils/learning_curves/"+fold+"_"+parameter+"_"+sota+"-"+baseline+".png'\" "+__dirname+"/com " + "-e \"plot \'"+mapfile+"\' using 2:1:3 with image\""
    console.log(command)
    execSync.run(command)

}


var stat = {}
fs.writeFileSync(statusfile, "")

_.each(classifiers, function(classifier, key, list){ 

	_(folds).times(function(fold){

		cluster.setupMaster({
		  exec: __dirname + '/worker.js',
		  // args: [JSON.stringify({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})],
		  // silent: false
		});

		worker = cluster.fork({'fold': fold, 'folds':folds, 'classifier':classifier, 'len':len})

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
				// console.log(JSON.stringify(stat, null, 4))
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
		  	}
		})

	})

}, this)