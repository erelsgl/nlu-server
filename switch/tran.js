	
	var async = require('async');
	var child_process = require('child_process')
	var _ = require('underscore')._;
	var fs = require('fs');

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

	var sys = { "yandex": "Y" }

	var data = JSON.parse(fs.readFileSync("/tmp/buffer_dial_switch.json"))
	
	_.each(data, function(value, keyd, list){
		var trans = {}

		_.each(sys, function(engine1liter, engine1, list){
			_.each(sys, function(engine2liter, engine2, list){
				_.each(lang, function(ln, lnkey, list){						
	    				var compkey = engine1liter+":"+ln+":"+engine2liter
					

					if ("trans" in value)
						if (compkey in value["trans"])
							trans[compkey] = value["trans"][compkey]
					
					if (!(compkey in trans))
					{
						var out = child_process.execSync("node ../utils/async_tran.js \""+engine1+"\" \""+engine2+"\" \""+ln+"\" \""+value.utt+"\"", {encoding: 'utf8'})
	   					out = out.replace(/\n$/, '')
						trans[compkey] = out
					}

				}, this)
			}, this)
		}, this)

		data[keyd]["trans"] = JSON.parse(JSON.stringify(trans))
		fs.writeFileSync("/tmp/buffer_dial_switch.json", JSON.stringify(data, null, 4))
	}, this)

	console.log(JSON.stringify(data, null, 4))
	process.exit(0)	

