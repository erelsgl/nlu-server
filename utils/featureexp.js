var fs = require('fs');
var async = require('async');
var ppdb = require(__dirname+"/../research/ppdb/utils.js");
var _ = require('underscore')._;

if (process.argv[1] === __filename)
{
	var output = {}
	var scale = JSON.parse(process.argv[2])
	var seeds = JSON.parse(fs.readFileSync(__dirname+"/featureexp_input"))
   
   	async.eachSeries(seeds, function(seed, callback){
		ppdb.recursionredis([seed], scale, true, function(err, results) {

			results = results.splice(1,results.length-1)

			_.each(results, function(value, key, list){ 
				if (!(value[0] in output))
					output[value[0]] = []
				output[value[0]].push([seed, value[1], value[2]])				
			}, this)
			callback()
		})
	},function(err){
		
		_.each(output, function(value, key, list){ 
			output[key] = _.sortBy(output[key], function(num){ return num[2]; });
		}, this)

		fs.writeFileSync(__dirname+"/featureexp_output", JSON.stringify(output, null, 4), 'utf-8')
		ppdb.closeredis()
	})
}


