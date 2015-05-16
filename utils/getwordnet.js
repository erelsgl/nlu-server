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

	'n': ['NN', 'NNS', 'NNP', 'NNPS', 'noun'],
	'a': ['JJ', 'JJR', 'JJS', 'adj'],
	's': ['JJ', 'JJR', 'JJS', 'adj'],
	'r': ['RB', 'RBR', 'RBS','WRB', 'adv'],
	'v': ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ', 'verb']
}

var gl_relations = ['synonym', 'hypernym', 'hypernym_1','hypernym_2','hypernym_3', 'hyponym', 'cohyponym']

var string = params[0]
var pos = params[1]
var relation = params[2]
var result = []

if (gl_relations.indexOf(relation) == -1)
{
	console.log("Relation is not in the list")
	process.exit(0)
}

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

    	if (relation.indexOf("_") != -1)
    	{
    		var list = relation.split("_")
    		var rel = list[0]
    		var count = list[1]
    		var ptrs = JSON.parse(JSON.stringify(results))

    		if (rel == "hypernym")
    		{
	    		async.timesSeries(count, function(n, nextt){
	    			var temp = []
	    			
	    			async.eachSeries(ptrs, function(result, callback1){ 
	    				
						async.eachSeries(result['ptrs'], function(res, callback4){

							if (res['pointerSymbol'] == '@')
							{

								wordnet.get(res['synsetOffset'], res['pos'], function(subres) {
									output = output.concat(subres['synonyms'])
									temp.push(subres)
									callback4()
								})
							}
							else
							callback4()

						}, function(err, users) {
							callback1()
						})
    				}, function(err, users) {
    					ptrs = JSON.parse(JSON.stringify(temp))
						nextt()
					})
    			}, function(err, users) {
					callback(null, _.unique(_.flatten(output)))	
				})
			}
		}

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
	process.exit(0)
});

}

