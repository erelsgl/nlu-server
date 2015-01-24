var fs = require('fs');
var ppdb = require(__dirname+"/research/utils.js");

if (process.argv[1] === __filename)
{
	var scale = JSON.parse(process.argv[2])
	var seeds = JSON.parse(fs.readFileSync(__dirname+"/featureexp"))

	ppdb.recursionredis(seeds, scale, false, function(err,results) {
		console.log(results)
	})
}