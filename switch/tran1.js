
	var async = require('async');
	var child_process = require('child_process')
	var _ = require('underscore')._;
	var fs = require('fs');
	var async_tran = require(__dirname + "/../utils/async_tran.js")
	var bars = require('./../utils/bars')
	var distance = require('./../utils/distance')


	var correlation = true
	var parsing = false

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
		}

		var sys = { "yandex": "Y", "microsoft": "M", "google": "G" }

		_.each(sys, function(engine1liter, engine1, list){
			_.each(sys, function(engine2liter, engine2, list){
				_.each(lang, function(ln, lnkey, list){
					if (engine1liter == engine2liter)						
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
	var data = JSON.parse(fs.readFileSync("./buffer_dial_switch2.json"))
	
	async.eachOfSeries(data, function(value, keyd, callback2){ 
		var trans = {}

			async.eachOfSeries(generator(), function(composition, key, callback3){ 

	    			var compkey = composition["engine1"]+":"+composition["ln"]+":"+composition["engine2"]
	    			var engine1 = composition["engine1"]
	    			var engine2 = composition["engine2"]
	    			var ln = composition["ln"]

					if ("trans" in value)
						if (compkey in value["trans"])
							trans[compkey] = value["trans"][compkey]
					
					if (!(compkey in trans))
					{
						async_tran.tran(engine1, ln, engine2, value["utt"], function(err, out){
							out = out.replace(/\n$/, '')
							trans[compkey] = out
							callback3()
						})
					}
					else

					callback3()	

			}, function(err){
				data[keyd]["trans"] = JSON.parse(JSON.stringify(trans))
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

