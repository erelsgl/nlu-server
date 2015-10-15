var cluster = require('cluster');
var async = require('async')
var _ = require('underscore')._;
var fs = require('fs');
var wikipedia = require(__dirname + '/../utils/wikipedia');
var master = require('./master');
var classifiers = require(__dirname+"/../classifiers.js")
var trainAndTest_async = require(__dirname+'/../utils/trainAndTest').trainAndTest_async;
var clc = require('cli-color')
var bars = require(__dirname+'/../utils/bars');

var fold = process.env["fold"]
var folds = process.env["folds"]
var classifier = process.env["classifier"]
var thread = process.env["thread"]
var msg = clc.xterm(thread)

if (cluster.isWorker)
	console.log(msg("worker: started"))

process.on('message', function(message) {
    console.log(msg('worker ' + process.pid + ' received message from master.'))
	
	var train = JSON.parse(message['train'])
	var test  = JSON.parse(message['test'])

	console.log(msg("train is array:"+_.isArray(train) + " and its size "+train.length))
	console.log(msg("test is array:"+_.isArray(test) + " and its size "+test.length))

	var index = 0

	async.whilst(
	    function () { return index <= train.length },
	    function (callbackwhilst) {

			// var len = 5
	       	index += (index < 20 ? 1 : 25)

	       	var mytrain = train.slice(0, index)

	       	var mytrainex = (bars.isDialogue(mytrain) ? bars.extractdataset(mytrain) : mytrain)
			var mytestex  = (bars.isDialogue(test) ? bars.extractdataset(test) : test)

	       	// var mytrainset = master.trainlen(train, index)

			console.log(msg("worker "+process["pid"]+": index=" + index +
				" train_dialogue="+mytrain.length+" train_turns="+mytrainex.length+
				" test_dialogue="+test.length +" test_turns="+mytestex.length+
				" classifier="+classifier+ " fold="+fold))

		    trainAndTest_async(classifiers[classifier], mytrainex, mytestex, function(err, stats){

		    	var uniqueid = new Date().getTime()

		    	console.log(msg("worker "+process["pid"]+": traintime="+
		    		stats['traintime']/1000 + " testtime="+ 
		    		stats['testtime']/1000 + " classifier="+classifier + 
		    		" Accuracy="+stats['stats']['Accuracy']+ " fold="+fold + " id="+stats['id']))

		    	var stats1 = {}
		    	_.each(stats['stats'], function(value, key, list){ 
		    		if ((key.indexOf("F1") != -1) || (key.indexOf("Accuracy") != -1 ))
		    			stats1[key] = value
		    	}, this)

				var results = {
					'classifier': classifier,
					'fold': fold,
					'trainsize': mytrainset.length/classes.length,
					'trainlen': len,
					// 'F1': stats['stats']['F1'],
					// 'macroF1': stats['stats']['macroF1'],
					// 'Accuracy': stats['stats']['Accuracy'],
					// 'stats': stats['stats'],
					'stats': stats1,
					'uniqueid': stats['id']
				}

				process.send(JSON.stringify(results))
		   		callbackwhilst()
		   	})
						
    	},
    	function (err) {
			console.log(msg("worker "+process["pid"]+": exiting"))
			process.exit()
		})
			  	
	// fs.appendFileSync(statusfile, JSON.stringify(stat, null, 4))
	// console.log(JSON.parse(cluster.worker.process.argv[3]))
	// // console.log(cluster.worker.process.config)
	// setTimeout(function() {
	// process.send({ msg: 'test' })      
	//     }, _.random(10)*1000);

	});