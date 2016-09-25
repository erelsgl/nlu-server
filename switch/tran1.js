
	var async = require('async');
	var child_process = require('child_process')
	var _ = require('underscore')._;
	var fs = require('fs');
	var async_tran = require(__dirname + "/../utils/async_tran.js")
	var bars = require('./../utils/bars')
	var distance = require('./../utils/distance')
	var md5 = require('md5');

	var norma = false
	var correlation = false
	var parsing = true
	var convert = false
	var stand = false
	var dist = false

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
		Dutch: "nl",
		Japanese: "jp"
		}

		//var sys = { "yandex": "Y", "microsoft": "M", "google": "G" }
		var sys = { "google": "G", "yandex": "Y" }

		_.each(sys, function(engine1liter, engine1, list){
			_.each(sys, function(engine2liter, engine2, list){
				_.each(lang, function(ln, lnkey, list){
					//if (engine1liter != engine2liter)						
	    					output.push({
	    						'engine1':engine1liter,
	    						'ln':ln,
	    						'engine2':engine2liter})
				}, this)
			}, this)
		}, this)
		
		return output
	}

	
if (parsing)
{	
	//var data = JSON.parse(fs.readFileSync("./buffer_dial_switch2.json"))
	var data = JSON.parse(fs.readFileSync("./buffer_dial_switch2.gold.final.std.json"))
	
		async.eachOfSeries(data, function(value, keyd, callback2){ 
		
			var trans = {}
			if ("trans" in value["input"])
                        	trans = value["input"]["trans"]     
                        else throw new Error("anomaly")

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
				data[keyd]["input"]["trans"] = JSON.parse(JSON.stringify(trans))
				fs.writeFileSync("./buffer_dial_switch2.json", JSON.stringify(data, null, 4))
				callback2()
			})
	}, 
		function(err){
	})
}

if (correlation)
{
	var lang = {}
	var total_ln={}

	var data = JSON.parse(fs.readFileSync("./buffer_dial_switch2.gold.json"))

	_.each(data, function(value, key, list){
		if ("trans" in value)
			{

				var temp = {}

				_.each(value["trans"], function(text, key, list){
							
					var ln = key.substr(2,2)
					var engine1 = key.substr(0,1)
					var engine2 = key.substr(-1,1)		
					var par = ln

					if (!(par in lang))
						lang[par] = []

					var dst = bars.distances(text, value["utt"])
						
					if (isNaN(parseFloat(dst)) || !isFinite(dst))
						{
						console.log("FUCK")
						console.log(text)
						console.log(value["utt"])
						console.log(dst)
						}
					else
						lang[par].push(dst)
								
				}, this)
			}
	}, this)

	var lang_copy = JSON.parse(JSON.stringify(lang))

	_.each(lang_copy, function(value, key, list){
		lang_copy[key] = distance.average(value)
	}, this)

	lang_copy = _.pairs(lang_copy)
	lang_copy = _.sortBy(lang_copy, function(num){ return num[1] });


	console.log(JSON.stringify(lang_copy, null, 4))
}

if (norma)
{
	var data = JSON.parse(fs.readFileSync("./buffer_dial_switch2.gold.json"))

	_.each(data, function(value, key, list){
		_.each(value["trans"], function(tran, key1, list){

			    tran = tran.replace(/\s+/g, ' ');
			    tran = tran.trim()

			    if ([".", "!", ",", "?"].indexOf(tran[0]) != -1)
			    {
			    	console.log(tran)
			    	tran = tran.substring(1)
			    	tran = tran.trim()
			    	console.log(tran)
			    }

				tran = tran.replace(/\.\s+\./g, ".");

			    data[key]["trans"][key1] = tran
		}, this)
	}, this)

	console.log(data.length)
	data = _.filter(data, function(num){ return num.utt != "" });
	console.log(data.length)

	console.log(JSON.stringify(data, null, 4))
}

if (convert)
{
	var data = JSON.parse(fs.readFileSync("./buffer_dial_switch2.gold.json"))

	_.each(data, function(value, key, list){
		_.each(value["trans"], function(tran, key1, list){

			    tran = tran.replace(/\s+/g, ' ');
			    tran = tran.trim()

			    if ([".", "!", ",", "?"].indexOf(tran[0]) != -1)
			    {
			    	console.log(tran)
			    	tran = tran.substring(1)
			    	tran = tran.trim()
			    	console.log(tran)
			    }

				tran = tran.replace(/\.\s+\./g, ".");

			    data[key]["trans"][key1] = tran
		}, this)
	}, this)

	console.log(data.length)
	data = _.filter(data, function(num){ return num.utt != "" });
	console.log(data.length)

	console.log(JSON.stringify(data, null, 4))
}


if (stand)
{
	var data = JSON.parse(fs.readFileSync("./buffer_dial_switch2.gold.final.json"))

	_.each(data, function(value, key, list){


		if (!fs.existsSync("../json/"+md5(value["utt"])+".json"))
			throw new Error("no file")


		value["input"] = {}
		value["input"]["text"] = value["utt"]
		value["input"]["sentences"] =  JSON.parse(fs.readFileSync("../json/"+md5(value["utt"])+".json"))["sentences"]
		value["input"]["trans"] = JSON.parse(JSON.stringify(value["trans"]))
		value["output"] = [value["dsc"]]
		value["outputhash"] = {}
		value["outputhash"][value["dsc"]] = 1


		delete value["trans"]
		delete value["utt"]
		delete value["dsc"]
	}, this)

	console.log(JSON.stringify(data, null, 4))
	process.exit(0)
}

if (dist)
{
      // var data = JSON.parse(fs.readFileSync("./buffer_dial_switch2.gold.final.std.json"))
    //   var dst = _.countBy(data, function(num) {return num["output"][0] });
  //     console.log(JSON.stringify(dst, null, 4))
//       data = _.filter(data, function(num){ return ["Yesanswers", "Conventionalclosing", "Actiondirective", "Hedge", "WhQuestion", "Summarizereformulate"].indexOf(num[

//       var dst = _.countBy(data, function(num) {return num["output"][0] });
  //     console.log(JSON.stringify(dst, null, 4))
    //   console.log(JSON.stringify(data.length, null, 4))
}

