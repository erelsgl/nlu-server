var redis = require("redis")
var async = require('async');
var _ = require('underscore')._;
var client = redis.createClient(6369)

var params = process.argv.slice();
params.splice(0,2)

if (process.argv[1] === __filename)
{	
	async.mapSeries(params, function(word, callback){
		client.select(15, function(err, response) {
			client.get(word, function (err, response) {

				if (response == null)
					callback(err, [])

				var vec = response.split(",")
				vec = _.map(vec, function(value){ return parseFloat(value); });
				callback(err, vec)
			})
		})	
	}, function(err, result) {
		console.log(result)
		process.exit(0)	
	})	
}