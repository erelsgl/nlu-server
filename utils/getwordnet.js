//http://wordnet.princeton.edu/man/wninput.5WN.html
// n for noun files, v for verb files, a for adjective files, r for adverb files
// http://stackoverflow.com/questions/1833252/java-stanford-nlp-part-of-speech-labels

// @    Hypernym 
 // ~    Hyponym 

var _ = require('underscore')._;
var natural = require('natural');
var wordnet = new natural.WordNet();
var async = require('async');

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

var output = []
// wordnet.get(4424418, 'n', function(result) {

if (process.argv[1] === __filename)
{
async.waterfall([
    function(callback) {

    	var output = []
    	
    	wordnet.lookup(string, function(results) {
    		
    		_.each(results, function(value, key, list){
				
				if (value['pos'] == POS[pos])
					output = output.concat(value) 

			}, this)

    		callback(null, _.unique(output))
		})
    },
    function(results, callback) {

    	var output = []

    	if (relation == "syn")
		{
			_.each(results, function(value, key, list){

					output = output.concat(value['synonyms']) 

			}, this)

			callback(null, output)
		}

		if (relation == "all")
		{
			async.eachSeries(results, function(result, callback1){ 

				async.eachSeries(result['ptrs'], function(res, callback2){

					if ((res['pointerSymbol'] == '~') || (res['pointerSymbol'] == '@'))
					{
						wordnet.get(res['synsetOffset'], res['pos'], function(subres) {
							output = output.concat(subres['synonyms'])
							callback2()
						})

					}
					else
					callback2()			
		
				}, function(err){ callback1() })

			}, function(err){
			
				callback(null, output)	
			
			})
	
		}
    }
], function (err, result) {

	var result = _.map(_.unique(result), function(value){ return value.replace(/\_/g," "); });

	console.log(JSON.stringify(result, null, 4))
});

}

