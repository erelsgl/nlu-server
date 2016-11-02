var _ = require('underscore')._;
var fs = require('fs');
var labels = JSON.parse(fs.readFileSync('./lab.json'));
var async = require('async');
var async_tran = require(__dirname + "/../utils/async_tran.js")
var bars = require(__dirname + "/../utils/bars.js")
var distances = require(__dirname + "/../utils/distance.js")

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

//	Spanish:"es",
//	Italian: "it",
//	Poland: "pl",
//	Dutch: "nl"
	// Japanese: "ja"
	}

	//var sys = { "yandex": "Y", "microsoft": "M", "google": "G" }
	var sys = { "google": "G", "yandex": "Y", "microsoft": "M" }

	_.each(sys, function(engine1liter, engine1, list){
		_.each(sys, function(engine2liter, engine2, list){
			_.each(lang, function(ln, lnkey, list){
				//if (engine1liter = engine2liter)						
    					output.push({
    						'engine1':engine1liter,
    						'ln':ln,
    						'engine2':engine2liter})
			}, this)
		}, this)
	}, this)
		
	return output
}

function gettrans()
{
	var dataset = JSON.parse(fs.readFileSync("./dataset.json", "utf-8"))
	var trans = JSON.parse(fs.readFileSync("./dataset_temp.json", "utf-8"))

	var trans_hash = {}

	_.each(trans, function(value, key, list){
		trans_hash[value["input"]["text"]] = value["input"]["trans"]
	}, this)

	var found = 0
	_.each(dataset, function(value, key, list){
		if (value["input"]["text"] in trans_hash)
		{
			value["input"]["trans"] = trans_hash[value["input"]["text"]]
			found += 1
		}
	}, this)

	console.log(JSON.stringify(dataset, null, 4))
	console.log(JSON.stringify(found, null, 4))
	process.exit()
}

function convert()
{

	var data = fs.readFileSync("./discourse", "utf-8").split("\n")
	var dataset = []
	var unknown = []

	_.each(data, function(value, key, list){

		var parts = value.split(" ")
		var act = parts[0]
		act = act.replace(/\^.*/g,'')
		var string = value.substring(value.indexOf(":")+2)

		// if (["x", "%", "% -", "+", "b", "o@", "+@", ""].indexOf(act)==-1)
		// {
		var str = string.replace(/\{.*\}/g,'')	
		var str = str.replace(/\[.*\]/g,'')	
		var str = str.replace(/\<.*\>/g,'')	
		var str = str.replace(/\(\(.*\)\)/g,'')	
		var str = str.replace(/\//g,'')	
		var str = str.replace(/[\-\#\+\[\]\{\}]/g,'')	
		var str = str.replace(/\s+/g, ' ');
		var str = str.trim()
			// console.log(value)
		// console.log(str)

		var elem = {
			"input": {
				"text": str
				},
				'output_original': act
			}

			if (act in labels)
			{
				elem["output"] = [labels[act]]
				elem["output_hash"] = { }
				elem["output_hash"][labels[act]] = 1	
			}
			else
			unknown.push(act)

		dataset.push(elem)
		
	}, this)

	console.log(JSON.stringify(dataset, null, 4))
	// console.log(JSON.stringify(_.countBy(unknown, function(num) {return num}), null, 4))
	process.exit(0)
}

function marktrans()
{
	var marked = 0
	var dataset = JSON.parse(fs.readFileSync("./dataset.json", "utf-8"))
	_.each(dataset, function(value, key, list){
		if ("output" in value)
			if (["Statement-non-opinion", "Statement-opinion"].indexOf(value["output"][0])==-1)
			{
				marked += 1 
				value["input"]["trans"] = {}
			}
	}, this)

	console.log(JSON.stringify(dataset, null, 4))
	console.log(JSON.stringify(marked, null, 4))
	process.exit(0)
}

function trans()
{	
	var dataset = JSON.parse(fs.readFileSync("./dataset.json"))

	async.eachOfSeries(dataset, function(value, keyd, callback2){ 
			
//		if (value["input"]["text"].length < 5) callback2()
//		else if (!("trans" in value["input"])) callback2()
//		if (["Yes-No-Question", "Agree_Accept", "Hedge", "Conventional-closing", "Appreciation", "Statement-opinion"].indexOf(value["output"][0])) 
//		else
		{
			var trans = {}
			if ("trans" in value["input"])
				trans = value["input"]["trans"]
				
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
				
				// if (keyd%10 == 0)
				// {
				fs.writeFileSync("./dataset_temp.json", JSON.stringify(dataset, null, 4))
				console.log("saved")
				// }

				callback2()
			})
		}
	}, 
		function(err){
		console.log(JSON.stringify(dataset, null, 4))
		fs.writeFileSync("./dataset_temp.json", JSON.stringify(dataset, null, 4))
	})
}


function correlation()
{
	var total_ln={}

	var data = JSON.parse(fs.readFileSync("./dataset.json"))

	_.each(data, function(turn, key, list){
		if ("trans" in turn["input"])
		{
			_.each(turn["input"]["trans"], function(text, key, list){
				
				var ln = key.substr(2,2)
				var engine1 = key.substr(0,1)
				var engine2 = key.substr(-1,1)
				
				// var par = engine1+engine2
				var par = ln

				console.log("language:"+ln + " engine1: "+engine1+ " engine2:"+engine2)
				console.log("par:"+par)
													
				// if (!(par in lang))
					// lang[par] = {}

				if (!(par in total_ln))
				total_ln[par] = []
				
				var txt1 = text
				var txt2 = turn["input"]["text"]

				//var txt1 = regexpNormalizer(text.toLowerCase())
				//var txt2 = regexpNormalizer(turn["input"]["text"].toLowerCase())

				var dst = bars.distances(txt1, txt2)
						
				if (isNaN(parseFloat(dst)) || !isFinite(dst))
					console.log("FUCK: " + txt1 + " " + txt2 + " " + dst)
		  		else
					{	
						// lang[par][intents[0]].push(dst)
						total_ln[par].push(dst)
					}
			})
		}
	}, this)

	var chk = -1

	_.each(total_ln, function(value, key, list){
		if (chk == -1)
			chk = value.length
		else
			if (chk != value.length)
				throw new Error("anomaly: "+key)
			
		total_ln[key] = distances.average(_.flatten(value))
	}, this)

	console.log(JSON.stringify(_.sortBy(_.pairs(total_ln), function(num){ return num[1] }), null, 4))
	process.exit(0)
}

// convert()
// gettrans()
// marktrans()
// trans()
correlation()
