var redis = require("redis")
var async = require('async');
var _ = require('underscore')._;
var Tagger = require("../node_modules/node-stanford-postagger/postagger").Tagger;
var tagger = new Tagger({
  port: "2020"
});

var params = process.argv.slice();
params.splice(0,2)

string = params[0]

if (process.argv[1] === __filename)
{	
	tagger.tag(string, function(err, resp) {
		resp = resp[0].replace(/\n|\r/g, "")

		var pairlist = resp.split(" ")
		var POS = []

		_.each(pairlist, function(value, key, list){
			POS.push(value.split("_"))
		}, this)
		console.log(POS)
	})
}