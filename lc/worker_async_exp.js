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
var log_file = "/tmp/logs/" + process.pid
var util = require('util');

var fold = process.env["fold"]
// var folds = process.env["folds"]
var classifier = process.env["classifier"]
var thread = process.env["thread"]
var msg = clc.xterm(thread)

console.vlog = function(data) {
    fs.appendFileSync(log_file, data + '\n', 'utf8')
};

if ( 
	cluster.isWorker)
	console.vlog("DEBUG: worker "+ process.pid+": started")

process.on('message', function(message) {

    console.vlog('DEBUG: worker ' + process.pid + ' received message from master.')
	
	var train = JSON.parse(message['train'])
	var test  = JSON.parse(message['test'])

	var train =  bars.processdatasettrain(_.flatten(train))
        var test  = bars.processdatasettest(_.flatten(test))

	console.vlog("DEBUG: worker "+process.pid+" : train.length="+train.length + " test.length="+test.length)

	var index = 0

	async.whilst(
	    //function () { return index < train.length },
	    function () { return index < 50 },
	    function (callbackwhilst) {

		async.waterfall([
    		function(callback) {

        		index += 5
		
	    		var mytrain = train.slice(0, index)
	    		var mytrainex = JSON.parse(JSON.stringify(mytrain))
	    		var mytestex = JSON.parse(JSON.stringify(test))

				// var mytrainex = (bars.isDialogue(mytrain) ? _.flatten(mytrain) : mytrain)
				// var mytestex  = (bars.isDialogue(test) ? _.flatten(test) : test)

				// var mytrainex =  bars.processdatasettrain(_.flatten(mytrain))
				// var mytestex  = bars.processdatasettest(_.flatten(test))
				console.vlog("DEBUG: worker "+process["pid"]+": index=" + index +
					" train_dialogue="+mytrain.length+" train_turns="+mytrainex.length+
					" test_dialogue="+test.length +" test_turns="+mytestex.length+
					" classifier="+classifier+ " fold="+fold)
				
				if (classifier=="NLU_Exp")
					bars.expanbal(mytrainex, function(err, gentra){
						console.vlog("DEBUG: worker: "+classifier+" train size:"+gentra.length)
						callback(null, gentra)
					})
				else
					callback(null, mytrainex, mytestex)

    		},
    		function(mytrainex, mytestex, callback) {
    	
    			trainAndTest.trainAndTest_async(classifiers[classifier], bars.copyobj(mytrainex), bars.copyobj(mytestex), function(err, stats){

				console.vlog("DEBUG: worker "+process["pid"]+": traintime="+
					stats['traintime']/1000 + " testtime="+ 
					stats['testtime']/1000 + " classifier="+classifier + 
					" Accuracy="+stats['stats']['Accuracy']+ " fold="+fold)

				var stats1 = {}
				_.each(stats['stats'], function(value, key, list){ 
				   		if ((key.indexOf("Precision") != -1) || (key.indexOf("Recall") != -1 ) || (key.indexOf("F1") != -1) || (key.indexOf("Accuracy") != -1))
				   			stats1[key] = value
				}, this)

				console.vlog("STATS: fold:"+fold+" trainsize:"+mytrain.length+" classifier:"+classifier+" "+JSON.stringify(stats1, null, 4))

				var results = {
					'classifier': classifier,
					'fold': fold,
					'trainsize': mytrain.length,
					'trainsizeuttr': mytrainex.length,
					'stats': stats1			
				}

				process.send(JSON.stringify(results))
				callbackwhilst()
			 	})
		    			
    		}], function (err, result) {
   
		})},
    function (err) {
			console.log(msg("DEBUG: worker "+process["pid"]+": exiting"))
			process.exit()
		})
	});
