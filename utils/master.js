var cluster = require('cluster');
var fs = require('fs');
var _ = require('underscore')._;

var folds = 2
var len = 2
// var classifiers = ['TC', 'TCBOC']
var classifiers = ['TC']

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

var stat = {}

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
		})

		worker.on('disconnect', function() {
		  	console.log("finished")

		  	if (Object.keys(cluster.workers) == 0)
		  	{
				console.log("all wordkers are disconnected")
				console.log(JSON.stringify(stat, null, 4))
		  	}
		})

	})

}, this)