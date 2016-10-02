var XML = require('pixl-xml');
var fs = require('fs');
var bars = require('../utils/bars')
var _ = require('underscore')._;
var async = require('async');
var async_tran = require(__dirname + "/../utils/async_tran.js")

var dataset = []

var files = bars.walkSync("./corpus/")

function generator()
{
	var output = []

	var lang = {
	French:"fr",
	German:"de",
	Portuguese: "pt",
	Hebrew:"he",
	Arabic:"ar",
	Russian:"ru",
	Chinese:"zh",
	Hungarian:"hu",
	Finish:"fi",

	Spanish:"es",
	Italian: "it",
	Poland: "pl",
	Dutch: "nl"
	// Japanese: "ja"
	}

	//var sys = { "yandex": "Y", "microsoft": "M", "google": "G" }
	var sys = { "google": "G", "yandex": "Y", "microsoft": "M" }

	_.each(sys, function(engine1liter, engine1, list){
		_.each(sys, function(engine2liter, engine2, list){
			_.each(lang, function(ln, lnkey, list){
				if (engine1liter = engine2liter)						
    					output.push({
    						'engine1':engine1liter,
    						'ln':ln,
    						'engine2':engine2liter})
			}, this)
		}, this)
	}, this)
		
	return output
}


function cleanstr(str)
{
	var str1 = str.split(" ")
	str1 = _.filter(str1, function(num){ return (num.indexOf("-")==-1 && num.indexOf("\\")==-1) });
	return str1.join(" ")
}

function parse()
{
	_.each(files, function(file, key, list){

		var room = XML.parse(fs.readFileSync(file))

		_.each(room["Posts"]["Post"], function(post, key, list){
			var mypost = {}
			mypost["source"] = file
			mypost["user"] = post["user"]
			mypost["input"] = {
								"text": cleanstr(post["_Data"]),
								"original": post["_Data"]
								}
			mypost["output"] = [post["class"]]

			dataset.push(mypost)
		}, this)

	}, this)
	console.log(JSON.stringify(dataset, null, 4))
	process.exit(0)
}

function test()
{
	var dataset = JSON.parse(fs.readFileSync("./dataset.json"))
	console.log(dataset.length)
}

function trans()
{	
	var dataset = JSON.parse(fs.readFileSync("./dataset.json"))

		async.eachOfSeries(dataset, function(value, keyd, callback2){ 
		
			if (!("trans" in value["input"])) callback2()
			else
			{
				var trans = {}
				console.log(keyd)
				async.eachOfSeries(generator(), function(composition, key, callback3){ 

		    			var compkey = composition["engine1"]+":"+composition["ln"]+":"+composition["engine2"]
		    			var engine1 = composition["engine1"]
		    			var engine2 = composition["engine2"]
		    			var ln = composition["ln"]

						if (!(compkey in trans))
						{
							async_tran.tran(engine1, ln, engine2, value["input"]["text"], function(err, out){
								out = out.replace(/\n$/, '')
								trans[compkey] = out
								callback3()
							})
						}
						else if (trans[compkey].indexOf("TranslateApiException")!=-1)
						{
							async_tran.tran(engine1, ln, engine2, value["input"]["text"], function(err, out){
								out = out.replace(/\n$/, '')
								trans[compkey] = out
								callback3()
							})	
						}
						else
							callback3()	

				}, function(err){
					dataset[keyd]["input"]["trans"] = JSON.parse(JSON.stringify(trans))
					
					if (keyd%10 == 0)
					{
					fs.writeFileSync("./buffer_dial_switch2.json", JSON.stringify(dataset, null, 4))
					console.log("saved")
					}

					callback2()
				})
			}
	}, 
		function(err){
	console.log(JSON.stringify(dataset, null, 4))
	})
}

function marktrans()
{	
	var dataset = JSON.parse(fs.readFileSync("./dataset.json"))
	
	var dataset_limited = _.sample(dataset, 2000)

	_.each(dataset_limited, function(value, key, list){
		if (!("trans" in value["input"]) && value["output"][0]!="System" && value["input"]["text"].split(" ").length > 2)
			value["input"]["trans"] = {}
	}, this)

	console.log(JSON.stringify(dataset, null, 4))
	process.exit()
}



// test()
trans()
// marktrans()
