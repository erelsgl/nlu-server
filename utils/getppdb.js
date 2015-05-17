var _ = require('underscore')._;
var async = require('async');
var redis = require("redis")
var client = redis.createClient(6369)

var params = process.argv.slice();
params.splice(0,2)

var string = params[0]
var pos = params[1]
var relation = params[2]
var db = 2

var output = []

if (process.argv[1] === __filename)
{	
	client.select(db, function(err, response) {
		client.zrange(string, 0, -1, 'WITHSCORES', function(err, replies) {

			_.each(replies, function(value, key, list){ 

				var wordpos = value.split("^")
				if (wordpos[1] = pos) 
					if (key % 2 == 0)
						output.push(wordpos[0])
			}, this)

			output.push(string)
			console.log(JSON.stringify(_.uniq(output), null, 4))
			process.exit(0)

        })
	})	
}


