//http://wordnet.princeton.edu/man/wninput.5WN.html
// n for noun files, v for verb files, a for adjective files, r for adverb files
// http://stackoverflow.com/questions/1833252/java-stanford-nlp-part-of-speech-labels

// @    Hypernym 
// ~    Hyponym 

// synset diambiguation = [all, the most frequent]
// relation = [ syn, hypo_0, cohypo ]

var _ = require('underscore')._;
var natural = require('natural');
var wordnet = new natural.WordNet();
var async = require('async');

var params = process.argv.slice();
params.splice(0,2)

var POS = {

	'n': ['NN', 'NNS', 'NNP', 'NNPS'],
	'a': ['JJ', 'JJR', 'JJS'],
	's': ['JJ', 'JJR', 'JJS'],
	'r': ['RB', 'RBR', 'RBS','WRB'],
	'v': ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ']
}

var string = params[0]
var pos = params[1]
var relation = params[2]
var result = []

if (_.flatten(_.toArray(POS)).indexOf(pos) == -1)
{
	console.log([])
	process.exit(0)
}

var output = []

if (process.argv[1] === __filename)
{
async.waterfall([
    function(callback) {

    	var output = []
	
    	wordnet.lookup(string, function(results) {

    		_.each(results, function(value, key, list){
				
				if (POS[value['pos']].indexOf(pos) != -1)
					output.push(value) 

			}, this)

    		callback(null, output)
		})
    },
    function(results, callback) {

    	var output = []

    	if (relation == "synonym")
    	{
			_.each(results, function(value, key, list){
				output = output.concat(value['synonyms']) 
			}, this)

			callback(null, _.unique(output))
    	}

    	if (relation == "hypernym")
    	{
    		async.eachSeries(results, function(result, callback1){ 

				async.eachSeries(result['ptrs'], function(res, callback2){

					if (res['pointerSymbol'] == '@')
					{
						wordnet.get(res['synsetOffset'], res['pos'], function(subres) {
							output = output.concat(subres['synonyms'])
							callback2()
						})
    				}
    				else
    				callback2()

				}, function(err){ callback1() })
			},  function(err){ callback(null, output) })
		}

		if (relation == "hyponym")
    	{
    		async.eachSeries(results, function(result, callback1){ 

				async.eachSeries(result['ptrs'], function(res, callback2){

					if (res['pointerSymbol'] == '~')
					{
						wordnet.get(res['synsetOffset'], res['pos'], function(subres) {
							output = output.concat(subres['synonyms'])
							callback2()
						})
    				}
    				else
    				callback2()

				}, function(err){ callback1() })
			},  function(err){ callback(null, output) })
		}

    	if (relation == "cohyponym")
    	{
		
			async.eachSeries(results, function(result, callback1){ 

				async.eachSeries(result['ptrs'], function(res, callback2){

					if (res['pointerSymbol'] == '@')
					{

						wordnet.get(res['synsetOffset'], res['pos'], function(subres) {

							async.eachSeries(subres['ptrs'], function(subsubres, callback3){
					
								if (subsubres['pointerSymbol'] == '~')
								{

									wordnet.get(subsubres['synsetOffset'], subsubres['pos'], function(susubsubbres) {

										output = output.concat(susubsubbres['synonyms'])
										callback3()

									})
								}
								else
								callback3()

							},  function(err){ callback2() })
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

