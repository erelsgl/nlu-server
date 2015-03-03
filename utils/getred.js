var redis = require("redis")
var client = redis.createClient(6369)

if (process.argv[1] === __filename)
{	
	var word = process.argv[2]
	client.select(15, function(err, response) {
		client.get(word, function (err, response) {
			console.log(response)
			process.exit(0)
		})
	})
}


