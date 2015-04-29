//http://wordnet.princeton.edu/man/wninput.5WN.html
// n for noun files, v for verb files, a for adjective files, r for adverb files
// http://stackoverflow.com/questions/1833252/java-stanford-nlp-part-of-speech-labels

var _ = require('underscore')._;
var natural = require('natural');
var wordnet = new natural.WordNet();

var params = process.argv.slice();
params.splice(0,2)

var POS = {

	'NN': 'n',
	'NNS': 'n',
	'NNP': 'n',
	'NNPS': 'n',

	'JJ': 'a',
	'JJR': 'a',
	'JJS': 'a',

	'RB': 'r',
	'RBR': 'r',
	'RBS': 'r',
	'WRB': 'r',

	'VB': 'v',
	'VBD': 'v',
	'VBG': 'v',
	'VBN': 'v',
	'VBP': 'v',
	'VBZ': 'v'
}


var string = params[0]
var pos = params[1]
var relation = params[2]
var result = []

if (!(pos in POS))
{
	console.log([])
	process.exit(0)
}

if (process.argv[1] === __filename)
{	
	wordnet.lookup(string, function(results) {
		_.each(results, function(value, key, list){
			if (value['pos'] == POS[pos])
				result = result.concat(value['synonyms']) 
		}, this)
		console.log(JSON.stringify(_.unique(result), null, 0))
	})
}
