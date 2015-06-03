var cluster = require('cluster');
var async = require('async')
var _ = require('underscore')._;
var fs = require('fs');
var wikipedia = require('./wikipedia');
var master = require('./master');
var partitions = require('limdu/utils/partitions');
var classifiers = require(__dirname+"/../classifiers.js")
var trainAndTest_async = require(__dirname+'/trainAndTest').trainAndTest_async;
// var bars = require(__dirname+'/bars');

if (cluster.isWorker)
	console.log("worker: started")

// process.env.worker.process.pid

// var pid = process["pid"]
var fold = process.env["fold"]
var datafile = process.env["datafile"]
var folds = process.env["folds"]
var classifier = process.env["classifier"]
var len = process.env["len"]

var dataset_global = JSON.parse(fs.readFileSync(datafile))
console.log("worker "+process["pid"]+": dataset loaded")

var dataset = partitions.partitions_hash_fold(dataset_global, folds, fold)
console.log("worker "+process["pid"]+": dataset partitioned")

var train = dataset['train']
var test = dataset['test']

var classes = Object.keys(train[0])

var index = 0

async.whilst(
    function () { return index <= train.length },
    function (callbackwhilst) {
       
       	index += (index < 10 ? 1 : 10)

       	var mytrainset = master.trainlen(train, index)
			
		async.timesSeries(len+1, function(n, callbacktime){

			n+=1

			console.log("worker "+process["pid"]+": index=" + index +" alltrain="+_.flatten(train).length+" train="+mytrainset.length/classes.length+" testall="+test.length+" test="+test.length/classes.length +" length="+n+" maxlen="+len+" classifier="+classifier+" classes="+classes.length + " fold="+fold)			

			var mytrain = master.filtrain(mytrainset, n, 0)
			var mytest = master.filtrain(test, n, 0)

		    trainAndTest_async(classifiers[classifier], mytrain, mytest, function(err, stats){

				var results = {
					'classifier': classifier,
					'fold': fold,
					'trainsize': train.length/classes.length,
					'trainlen': n,
					'F1': stats['stats']['F1'],
					'macroF1': stats['stats']['macroF1'],
					'Accuracy': stats['stats']['Accuracy']
				}

				process.send(JSON.stringify(results))      	

				callbacktime()

		    	})


			  	}, function(){
			  		callbackwhilst()
			  	})
    },
    function (err) {
		console.log("worker "+process["pid"]+": exiting")
		process.exit()
	})
			  	
// fs.appendFileSync(statusfile, JSON.stringify(stat, null, 4))
// console.log(JSON.parse(cluster.worker.process.argv[3]))
// // console.log(cluster.worker.process.config)
// setTimeout(function() {
// process.send({ msg: 'test' })      
//     }, _.random(10)*1000);


