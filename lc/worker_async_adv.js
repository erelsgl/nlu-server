var cluster = require('cluster');
var async = require('async')
var _ = require('underscore')._;
var fs = require('fs');
// var wikipedia = require(__dirname + '/../utils/wikipedia');
var master = require('./master');
var classifiers = require(__dirname+"/../classifiers.js")
var trainAndTest = require(__dirname+'/../utils/trainAndTest');
var bars = require(__dirname+'/../utils/bars');
var log_file = fs.createWriteStream("/tmp/logs/" + process.pid, {flags : 'w'});
var util = require('util');

var fold = process.env["fold"]
// var folds = process.env["folds"]
var classifier = process.env["classifier"]
var thread = process.env["thread"]

var log_stdout = process.stdout;

console.log = function(d) { 
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

if (cluster.isWorker)
	console.log("DEBUG: worker "+ process.pid+": started")

process.on('message', function(message) {
    console.log('DEBUG: worker ' + process.pid + ' received message from master.')
	
	var train = bars.processdatasettrain(JSON.parse(message['train']))
	var test  = bars.processdatasettest(JSON.parse(message['test']))

	var max  = JSON.parse(message['max'])
	var max = 70

	console.log("DEBUGWORKER: train.length before filter = "+train.length)
        train = _.filter(train, function(num){ return _.keys(num.outputhash).length <= 1 })
        console.log("DEBUGWORKER: train.length after filter = "+train.length)

	console.log("DEBUG: worker "+process.pid+" : train.length="+train.length + " test.length="+test.length + " max="+max)
	console.log("DEBUG: max "+max)

	var index = 0

	async.whilst(
	    function () { return index < max },
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

			console.log("DEBUG: worker "+process["pid"]+": index=" + index +
				" train_dialogue="+mytrain.length+" train_turns="+mytrainex.length+
				" test_dialogue="+test.length +" test_turns="+mytestex.length+
				" classifier="+classifier+ " fold="+fold)

		    	// stats = trainAndTest_hash(classifiers[classifier], mytrainex, mytestex, false)

/*		    	if (classifier == "DS_primitive")
		    	{
		    		console.log("DEBUGWORKER: It's old fashion classifier, flatten the dataset")
		    		mytrainex = bars.flattendataset(mytrainex)
		    		mytestex = bars.flattendataset(mytestex)
		    	}
*/
			var realmytrainex = []

			if (classifier=="NLU_Oversampled") {
				var realmytrainex = bars.oversample(bars.copyobj(mytrainex))
			} else if (classifier=="NLU_Undersampled") {
				var realmytrainex = bars.undersample(bars.copyobj(mytrainex))
				
			} else {
				var realmytrainex = bars.copyobj(mytrainex)
				}
		
	//		console.log("DEBUGWORKER: mytrainex.length before filter = "+mytrainex.length)
	//		var realmytrainex = _.filter(mytrainex, function(num){ return _.keys(num.outputhash).length <= 1 })
	//		console.log("DEBUGWORKER: mytrainex.length after filter = "+realmytrainex.length)
	//		var mytrainex = bars.copyobj(realmytrainex)
	
		    	trainAndTest.trainAndTest_async(classifiers[classifier], bars.copyobj(realmytrainex), bars.copyobj(mytestex), function(err, stats){

		    		//var uniqueid = new Date().getTime()

			    	console.log("DEBUG: worker "+process["pid"]+": traintime="+
			    		stats['traintime']/1000 + " testtime="+ 
			    		stats['testtime']/1000 + " classifier="+classifier + 
			    		" Accuracy="+stats['stats']['Accuracy']+ " fold="+fold)

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
						'trainsizeuttr': realmytrainex.length,
						'stats': stats1
						// 'uniqueid': stats['id']
					}

					process.send(JSON.stringify(results))
			   		callbackwhilst()
			   	})
	    	},
    	function (err) {
			console.log("DEBUG: worker "+process["pid"]+": exiting")
			process.exit()
		})
			  	
	// fs.appendFileSync(statusfile, JSON.stringify(stat, null, 4))
	// console.log(JSON.parse(cluster.worker.process.argv[3]))
	// // console.log(cluster.worker.process.config)
	// setTimeout(function() {
	// process.send({ msg: 'test' })      
	//     }, _.random(10)*1000);

	});
