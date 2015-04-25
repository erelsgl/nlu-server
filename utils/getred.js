var redis = require("redis")
var async = require('async');
var _ = require('underscore')._;
var client = redis.createClient(6369)

// previouse dataset was 15
// 13 - 1098401 - context emb
// 14 - 173000 - word emb

var params = process.argv.slice();

params.splice(0,2)

var db = params.splice(-1)[0]
var output = []

if (process.argv[1] === __filename)
{	
	async.mapSeries(params, function(word, callback){
		client.select(db, function(err, response) {
			client.get(word, function (err, response) {

				if (response == null)
				{
					output.push([])
					callback(err, [])
				}
				else
				{
					var vec = _.compact(response.split(","))

					vec = _.map(vec, function(value){ return parseFloat(value); });

					output.push(vec)
					callback(err, vec)
				}
			})
		})	
	}, function(err, result) {
    	if (params.length != output.length)
    		throw new Error("Vectors should be of the same size")
		// console.log(output.length)
		console.log(output)
		process.exit(0)
	})	
}
