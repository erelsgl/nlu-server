var fs = require('fs');
var async = require('async');
var bars = require(__dirname+"/bars.js");
var ppdb = require(__dirname+"/../research/ppdb/utils.js");
var _ = require('underscore')._;

if (process.argv[1] === __filename)
{
	var output = {}

	console.log("inside scale "+process.argv[2]+" phrase "+process.argv[3])

	var scale = JSON.parse(process.argv[2])
	var phrase = JSON.parse(process.argv[3])

	// console.log("inside scale parse "+scale+" phrase "+phrase)
	// console.log(scale)

	// phrase:
	// 0 - everything
	// 1 - only unigram seed generated unigram paraphrase

	var seeds = JSON.parse(fs.readFileSync(__dirname+"/featureexp_input"))

	seeds = seeds.splice(1,seeds.length-1)

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
		
		if (phrase == 1)
			output = bars.onlyunigrams(output)

		_.each(output, function(value, key, list){ 
			output[key] = _.sortBy(output[key], function(num){ return num[2]; });
		}, this)

		console.log("output "+Object.keys(output).length)
		fs.writeFileSync(__dirname+"/featureexp_output", JSON.stringify(output, null, 4), 'utf-8')
		ppdb.closeredis()
	})
}


