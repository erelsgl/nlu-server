var _ = require('underscore')._;
var natural = require('natural');
var wordnet = new natural.WordNet();

var params = process.argv.slice();
params.splice(0,2)

string = params[0]
var syn = []

if (process.argv[1] === __filename)
{	
	wordnet.lookupSynonyms(string, function(results) {
    	results.forEach(function(result) {
      		syn = syn.concat(result.synonyms)
    	})

    syn = _.map(syn, function(value){ return value.split("_").join(" ") });
	// console.log(_.unique(syn))
	console.log(JSON.stringify(_.unique(syn), null, 0))
    })
}