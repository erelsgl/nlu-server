var cluster = require('cluster');
var async = require('async')
var _ = require('underscore')._;
var fs = require('fs');
// var wikipedia = require(__dirname + '/../utils/wikipedia');
var master = require('./master');
var classifiers = require(__dirname+"/../classifiers.js")
var trainAndTest = require(__dirname+'/../utils/trainAndTest');
var clc = require('cli-color')
var bars = require(__dirname+'/../utils/bars');

var fold = process.env["fold"]
var folds = process.env["folds"]
var classifier = process.env["classifier"]
var thread = process.env["thread"]
var msg = clc.xterm(thread)

if (cluster.isWorker)
	console.log(msg("DEBUG: worker "+ process.pid+": started"))

process.on('message', function(message) {
    console.log(msg('DEBUG: worker ' + process.pid + ' received message from master.'))
	
	var train = JSON.parse(message['train'])
	var test  = JSON.parse(message['test'])
	var max  = JSON.parse(message['max'])

	console.log(msg("DEBUG: worker "+process.pid+": train is array:"+_.isArray(train) + " and its size "+train.length))
	console.log(msg("DEBUG: worker "+process.pid+": test is array:"+_.isArray(test) + " and its size "+test.length))
	console.log(msg("DEBUG: max "+max))

	var index = 0

	async.whilst(
	    function () { return index <= max },
	    function (callbackwhilst) {

			// var len = 5
//	       	index += (index < 20 ? 3 : 5)
		
/*		if (index<10)
		{
			index += 1
		} else if (index<20)
		{
			index += 2
		}
		else index += 5
*/
//biased

		index += 10

	       	var mytrain = train.slice(0, index)

	       	var mytrainex = (bars.isDialogue(mytrain) ? _.flatten(mytrain) : mytrain)
			var mytestex  = (bars.isDialogue(test) ? _.flatten(test) : test)

			console.log(msg("DEBUG: worker "+process["pid"]+": index=" + index +
				" train_dialogue="+mytrain.length+" train_turns="+mytrainex.length+
				" test_dialogue="+test.length +" test_turns="+mytestex.length+
				" classifier="+classifier+ " fold="+fold))

		    	// stats = trainAndTest_hash(classifiers[classifier], mytrainex, mytestex, false)

		    	if (classifier == "DS_primitive")
		    	{
		    		console.log("DEBUGWORKER: It's old fashion classifier, flatten the dataset")
		    		mytrainex = bars.flattendataset(mytrainex)
		    		mytestex = bars.flattendataset(mytestex)
		    	}

		    	trainAndTest.trainAndTest_async(classifiers[classifier], JSON.parse(JSON.stringify(mytrainex)), JSON.parse(JSON.stringify(mytestex)), function(err, stats){

		    		//var uniqueid = new Date().getTime()

			    	console.log(msg("DEBUG: worker "+process["pid"]+": traintime="+
			    		stats['traintime']/1000 + " testtime="+ 
			    		stats['testtime']/1000 + " classifier="+classifier + 
			    		" Accuracy="+stats['stats']['Accuracy']+ " fold="+fold))

			    	console.log(JSON.stringify(stats['stats'], null, 4))

			    	var stats1 = {}
			    	_.each(stats['stats'], function(value, key, list){ 
			    		if ((key.indexOf("Precision") != -1) || (key.indexOf("Recall") != -1 ) || (key.indexOf("F1") != -1) || (key.indexOf("Accuracy") != -1))
			    			stats1[key] = value
			    	}, this)

				console.log("STATS: fold:"+fold+" trainsize:"+mytrain.length+" classifier:"+classifier+" "+JSON.stringify(stats1, null, 4))

					var results = {
						'classifier': classifier,
						'fold': fold,
						'trainsize': mytrain.length,
						'trainsizeuttr': mytrainex.length,
						'stats': stats1
						// 'uniqueid': stats['id']
					}

					process.send(JSON.stringify(results))
			   		callbackwhilst()
			   	})
	    	},
    	function (err) {
			console.log(msg("DEBUG: worker "+process["pid"]+": exiting"))
			process.exit()
		})
			  	
	// fs.appendFileSync(statusfile, JSON.stringify(stat, null, 4))
	// console.log(JSON.parse(cluster.worker.process.argv[3]))
	// // console.log(cluster.worker.process.config)
	// setTimeout(function() {
	// process.send({ msg: 'test' })      
	//     }, _.random(10)*1000);

	});
