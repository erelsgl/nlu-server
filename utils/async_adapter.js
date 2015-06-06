var Redis = require('ioredis');
var client = new Redis(6379);
var async = require('async');
var _ = require('underscore')._;

var WordNet = require("node-wordnet")
// var wordnet = new WordNet({
//   // cache: { max: 500000, maxAge: 1000 * 60 * 60 }
//   dataDir: "/mnt/ramdisk/wordnet/dict",
// })

var NodeCache = require( "node-cache" );
var wordnetcache = new NodeCache({'useClones': false});
var wordnetStat = 0

function getppdb(string, pos, relation, callback)
{
	// var client = redis.createClient(6379)
	var db = 4
	var output = []

	client.select(db, function(err, response) {
		if (err) callback(err)

		client.zrange(string, 0, -1, 'WITHSCORES', function(err, replies) {
			if (err) callback(err)

			_.each(replies, function(value, key, list){ 

				var wordpos = value.split("^")
				if (wordpos[1] = pos) 
					if (key % 2 == 0)
						output.push(wordpos[0])
			}, this)

			callback(err, _.uniq(output))
        })
	})	
}


function getwordnetCache(string, pos, relation, callback)
{
	wordnetcache.get(string+"_"+pos+"_"+relation, function(err, value){
  		if( !err ){
    			getwordnet(string, pos, relation, function(err, result){
    				wordnetcache.set(string+"_"+pos+"_"+relation, result)
    				callback(null, result)
    			})	
    	}
    	else
    		callback(null, value)
	})
}

function getwordnet(string, pos, relation, callbackg)
{
	var wordnet = new WordNet({
  		// cache: { max: 500000, maxAge: 1000 * 60 * 60 }
  		dataDir: "/mnt/ramdisk/wordnet/dict",
	})

	if (_.isArray(relation))
	{
		console.log("Relation should not be a list")
		process.exit(0)
	}
	
	var POS = {

		'n': ['NN', 'NNS', 'NNP', 'NNPS', 'noun'],
		'a': ['JJ', 'JJR', 'JJS', 'adj'],
		's': ['JJ', 'JJR', 'JJS', 'adj'],
		'r': ['RB', 'RBR', 'RBS','WRB', 'adv'],
		'v': ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ', 'verb']
	}

	var gl_relations = ['synonym', 'hypernym', 'hypernym_1','hypernym_2','hypernym_3', 'hyponym', 'cohyponym']

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
							
							output = output.concat(result['synonyms'])
		    				
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

		callbackg(null, result)
	})
}

function getred(params, db, callback)
{

	// var client = redis.createClient(6379)

// previouse dataset was 15
// 13 - 1098401 - context emb
// 14 - 173000 - word emb

	var output = {}

	async.mapSeries(params, function(word, callback){
		client.select(db, function(err, response) {
			client.get(word, function (err, response) {

				if (response == null)
				{
					output[word] = []
					callback(err, [])
				}
				else
				{
					var vec = _.compact(response.split(","))

					vec = _.map(vec, function(value){ return parseFloat(value); });

					output[word] = vec
					callback(err, vec)
				}
			})
		})	
	}, function(err, result) {

    	if (params.length != Object.keys(output).length)
    		throw new Error("Vectors should be of the same size")
		callback(err, output)
	})	
}

module.exports = {
  getppdb:getppdb,
  getwordnet:getwordnet,
  getred:getred,
  getwordnetCache:getwordnetCache
}