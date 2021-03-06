// var sync = require('synchronize')
// docker run -t -i -p 9000:9000 cuzzo/stanford-pos-tagger
 // sudo tcpdump -s 0 -A 'tcp dst port 10345 and (tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x504f5354)' -i lo

//var Fiber = require('fibers');
var fs = require('fs');
var _ = require('underscore')._;
var natural = require('natural');
//var Lemmer = require('node-lemmer').Lemmer;
//var lemmerEng = new Lemmer('english');
var Hierarchy = require('../../Hierarchy');
var splitJson = Hierarchy.splitJson
var bars = require('../../utils/bars')
var rules = require('../rule-based/rules')
//var wordnet = new natural.WordNet();

var Tagger = require("../../node_modules/node-stanford-postagger/postagger").Tagger;
var tagger = new Tagger({
  port: "2020"
});

var async = require('async');
var redis = require("redis")

var client = redis.createClient(6369)
var clientpos = redis.createClient(6369);


var buffer = {}

var DBSELECT = 0

var requestify = require('requestify'); 
//var querystring = require('querystring');


var intent_field = 'intent_core'

// sync(client,'select')
// sync(client,'smembers')

// var POSS = {}

// just - RB - consider to eliminate
// able - JJ ?
// [ 'you_PRP ca_MD n\'t_RB get_VB\n' ]
// is_VBZ
// [ 'be_VB working_VBG\n' ]
var CONTENT = ['NN','VBN','VBP','JJ', 'VB','VBD','RB', 'NNS', 'VBG', 'VBZ', 'JJS', 'MD']
// FW - foreign word

function wordnetsyn(word, callback) {
var out = []
	wordnet.lookup('offer', function(results) {
		out.concat = out.concat(results['synonyms'])
		callback(null, out)
	})
}

function dep(tagged_data, callback)
{
var post_data = {'tagged_text' : tagged_data}

requestify.request('http://localhost:10345/parse', {
    method: 'POST',
    body: post_data,
    dataType: 'form-url-encoded'
})
.then(function(response) {
    callback(normalizedepbody(response['body']))
    // console.log(response['body'])
});
// return "123"
}

function normalizedepbody(body)
{
	var output = []

	_.each(body.split('\n'), function(row, key, list){
		// console.log(encodeURI(row))
		// row = row.replace(/\s+/g,'')
		row = row.trim()
		row = row.replace('\n','')
		var elems = row.split(" ")
		output.push({'num': elems[0],
					 'word': elems[1],
					 'lemma': elems[2],
					 'pos': elems[3],
					 'pos1': elems[4],
					 'root': elems[6],
					 'role': elems[7]})
	}, this)

	return output.slice(0, -2)
}

function lookupSynonyms(word, callback) {
  quickfetch(word, function(err,results) {
    loadResultSynonyms([word], results, function(err, res)
    	{
    		// console.log(res)
    		// process.exit(0)
    	});
  });
}

function wordnetquickfetch(seed, callback)
{
	// wordnet.lookupSynonyms(seed, function(results) {
	// 	var output = []
	// 	_.each(results, function(value, key, list){ 
	// 		if (value['pos'] = "v")
	// 			output.push(value['lemma'].split("_").join(" "))
	// 	}, this)
	// 	callback(null, _.unique(output))
	// })

console.log(seed)

	var output = []
	wordnet.lookupSynonyms(seed, function(results) {
		console.log(results)
		_.each(results, function(value, key, list){ 
			var list = _.map(value['synonyms'], function(num){ return num.split("_").join(" ") })
			output = output.concat(list)
		}, this)
		callback(null, _.unique(output))
	})
}


// function wordnetquickfetchlayer(seed, callback)
// {

	// wordnet.lookup('node', function(results) {
	// wordnet.lookupSynonyms(seed, function(results) {
	// 	var output = []
	// 	_.each(results, function(value, key, list){ 
	// 		output.push(value['lemma'].split("_").join(" "))
	// 	}, this)
	// 	callback(null, _.unique(output))
	// })
// }

function wordnetsynonyms(seeds, callback)
{
	console.log(seeds)
	async.mapSeries(seeds, wordnetquickfetch, function(err, result) {
		callback(null, _.unique(_.flatten(result)))
	})
}

function clusteration(list, callback)
{
	var found = false
	var clusthash = {}
	async.eachSeries(list, function(input, callback1){ 
		found = false	
		async.eachSeries(Object.keys(clusthash), function(key, callback2){ 
			// console.log(input1)
			compare([input, key], function(err, result){
				if (result[4] == 1)
					{
						found = true
						clusthash[key].push(input)
					}
				callback2()
				})
		}, function(err){
			if (found == false)
				clusthash[input] = []
			callback1()
		})
	}, function(err){
		var clustlist = []
		_.each(clusthash, function(value, key, list){ 
			clustlist.push(value.concat(key))
		}, this)
		
		callback(err, clustlist)
	})
}

// function cleanlisteval(actual, expected)
// { 

// var expectedcopy = expected
// var TP = 0
// var FP = 0
// var FN = 0

// var TPdetails = []
// var FPdetails = []
// var FNdetails = []
// var found = false

// // var f = Fiber(function() {
//  var fiber = Fiber.current

// 	_.each(actual, function(actkey, key, list){ 
// 		if ((actual.indexOf(actkey)%10 == 0) && (actual.indexOf(actkey) != 0))
// 	        console.log(actual.indexOf(actkey))
		
// 		found = false
// 		var tempTP = []
// 		_.each(expected, function(expkey, key, list){ 
// 	        compare([actkey,expkey], function (err, resp){
//     			fiber.run(resp);
// 			})

// 	        var res = Fiber.yield();

// 	        if (res[4] == 1 )
// 		        {
// 	            expectedcopy = _.without(expectedcopy,expkey)
// 	            tempTP.push(expkey)
// 	            }

// 	    })
	    
// 	    if (tempTP.length > 0)
// 		{
// 	    	TPdetails.push([actkey, tempTP])
// 	    	TP = TP + 1
// 		}
// 		else
//        	{
// 	        FP = FP + 1
// 	       	FPdetails.push(actkey)
//         }
// 	})

// 	FN = expectedcopy.length
// 	FNdetails = expectedcopy

// 	return {'stats':{'TP':TP,'FP':FP,'FN':FN},
// 		    'data': {'TP': TPdetails,
// 				     'FP': FPdetails,
// 				     'FN': FNdetails
// 				    }}
  		
// }      

function stat(data)
{
	var Precision = data['TP']/(data['TP']+data['FP'])
	var Recall = data['TP']/(data['TP']+data['FN'])
return {
		'Precision':Precision,
		'Recall':Recall,
		'F1':2*Precision*Recall/(Precision+Recall),
		'TP':data['TP'],
		'FP':data['FP'],
		'FN':data['FN']
		}
}

function loadSynonyms(synonyms, results, ptrs, callback) {

  if(ptrs.length > 0) {
    var ptr = ptrs.pop();

    this.get(ptr.synsetOffset, ptr.pos, function(result) {
      synonyms.push(result);
      loadSynonyms(synonyms, results, ptrs, callback);
    });
  } else {
    loadResultSynonyms(synonyms, results, callback);
  }
}


var cleanposfromredis = function(data, withscores)
{
	if (withscores == false)
	{
		var output = []
		_.each(data, function(value, key, list){
			if (key % 2 == 0)
				output.push(value.split("^")[0])
		}, this)
		//  if you don't need score and POS than unique on seeds
		return _.unique(output)
	}
	else
	{
		var output = []
		var temp = []
		_.each(data, function(value, key, list){ 
			if (key % 2 == 0)
				{
				temp = temp.concat(value.split("^"))
				}
			else
				{
				temp.push(parseFloat(value))
				output.push(temp.slice(0))
				temp = []
				}
		}, this)

		output = _.sortBy(output, function(num){ return num[0] })

		return output
	}
}

var recursionredis = function (seeds, order, withscores, callback)
{	
	var fetched = seeds
	// var fetched = []
	async.timesSeries(order.length, function(n, next)
		{
		DBSELECT = order[n]

		async.mapSeries(fetched, cleanredis, function(err, bestli) 
			{
				bestli = cleanposfromredis(_.flatten(bestli), withscores)
				fetched = fetched.concat(bestli)
				// fetched = _.unique(_.flatten(fetched))
				next()
			})
		},
		function(err, res)
		{
			// callback(null, cleanposfromredis(_.unique(_.flatten(fetched))))
			callback(err, fetched)
		}
	)
}

// don't count Query labels 
var onlyIntents = function(labels)
{	
  var output = []
  _.each(labels, function(label, key, list){ 
    var lablist = splitJson(label)
    	output = output.concat(lablist[0])  
  }, this)
  
  return _.unique(output)
}

// input 
// i can offer a <VALUE>
// not clean input
var retrieveIntent = function(input, seeds, callback)
{
    var output = []
   	async.eachSeries(Object.keys(seeds), function(intent, callback1){
   		async.eachSeries(Object.keys(seeds[intent]), function(keyphrase, callback2){
   			async.eachSeries(Object.keys(seeds[intent][keyphrase]), function(ngram, callback3){
   				async.eachSeries(Object.keys(seeds[intent][keyphrase][ngram]), function(seed, callback4){
   			// async.eachSeries(seeds[intent][keyphrases], function(phrase, callback3){
   					// input - test utterances
		      		var input_list = input.split(" ")

		      		onlycontent(seed, function(err, responses) {

		      			_.each(responses, function(response, key, list){ 
		      				var content_phrase = (response.length != 0 ? response : phrase.split(" "));
	     		 			var content_phrase = phrase.split(" ")
					        
					        // var pos = rules.compeletePhrase(input_list.join(" "), content_phrase.join(" "))
					        var pos = rules.compeletePhrase(input_list.join(" "), response)
					        if (pos != -1)
	  					      	{
	        					var elem = {}
	        					elem[intent] = {}
	        					elem[intent]['original seed'] = keyphrases
	        					elem[intent]['ppdb phrase'] = phrase
	        					// elem[intent]['content of ppdb phrase'] = content_phrase
	        					elem[intent]['content of ppdb phrase'] = response
	        					// elem[intent]['position'] = [pos, pos + content_phrase.join(" ").length]
	        					elem[intent]['position'] = [pos, pos + response.length]
	          					output.push(elem)
	        					}
        				}, this)
        				callback4()
        			})
				},function(err){
				callback3()})
			},function(err){
				callback2()})
		},function(err){
			callback1()})
	},function(err){
	    
	    // working on DEFAULT intent
	    // if ((output.length == 0) && (cleanupkeyphrase(input)<10))
	    /*if ((output.length == 0))
	    	{
	    		var elem = {}
        		elem['Offer'] = {}
        		elem['Offer']['original seed'] = 'default intent'
        		elem['Offer']['content of ppdb phrase'] = ['default', 'intent']
        		elem['Offer']['position'] = [-1,-1]
				output.push(elem)
	    	}
		*/
		callback(err, output)})
  // _.each(seeds, function(value, intent, list){ 
  //   _.each(value, function(paraphrases, originalphrase, list2){ 
  //     _.each(paraphrases, function(phrases, key1, list1){ 
  //     	_.each(phrases, function(phrase, key4, list4){ 
  //     		var input_list = input.split(" ")

  //     		console.log("start")
  //     		console.log(phrase)

  //     		onlycontent(phrase, function(err, response) {

  //     			var content_phrase = (response.length != 0 ? response : phrase.split(" "));
  //     			var phrase_list = onlycontent(phrase).split(" ")
      			
  //        if (_.isEqual(content_phrase, _.intersection(input_list, content_phrase)) == true)
  //       	{
  //       	var elem = {}
  //       	elem[intent] = phrase
  //         	output.push(elem)
  //       	}
  //     	}, this)
  //     }, this)
  //   }, this)
  // }, this)
  // return output
}




var retrieveIntentsync = function(input, seeds)
{
    var output = []

	_.each(seeds, function(value, intent, list){ 
		_.each(seeds[intent], function(value, keyphrase, list){ 
			_.each(seeds[intent][keyphrase], function(value, ngram, list){
				_.each(seeds[intent][keyphrase][ngram], function(value, ppdb, list){
					_.each(seeds[intent][keyphrase][ngram][ppdb], function(value, seed, list){
				
						var response = seed
				        var pos = rules.compeletePhrase(input, response)
				        if (pos != -1)
						{
	    					var elem = {}
	    					elem['intent'] = intent
	    					elem['keyphrase'] = keyphrase
	    					elem['ngram'] = ngram
	    					elem['ppdb'] = ppdb
	    					elem['seed'] = seed
	       					elem['position'] = [pos, pos + response.length]
	      					output.push(elem)
	    				}
	    			}, this)
				}, this)
    		}, this)
    	}, this)
    }, this)

	// return maximizer(localizeinter(output))
	return output
}

var  localizeinter = function(list)
{
	var output = []

	_.each(list, function(value, key, list){
		var inserted = false
		_.each(output, function(cluster, keycl, list){
			_.each(cluster, function(elem, key, list){
				if (!inserted)
					{
					if ((bars.intersection(elem['position'], value['position']))
						&&
						(elem['intent'] == value['intent']))
						{ 
						output[keycl].push(value)
						inserted = true
						}
					}
			}, this)
		 }, this) 
		if (!inserted)
			output.push([value])
	}, this)

	return output
}

var maximizer = function(list)
{
	var output = []

	_.each(list, function(cluster, key, list){ 
		var max = 0
		var elem = []
		_.each(cluster, function(value, key, list){
			if ((value['position'][1] - value['position'][0]) > max)
				{
				max = value['position'][1] - value['position'][0]
				elem = value
				}
		}, this)
		output.push(elem)
	}, this)

	return output
}

var afterppdb = function(seeds)
{
	var seeds = bars.copyobj(seeds)
	_.each(seeds, function(values, intent, list){ 
		_.each(seeds[intent], function(value, keyphrase, list){ 
			_.each(seeds[intent][keyphrase], function(value, ngram, list){ 
				_.each(seeds[intent][keyphrase][ngram], function(value, ppdb, list){
					_.each(generatengrams(ppdb), function(phrase, key, list){ 
						seeds[intent][keyphrase][ngram][ppdb][bars.biunormalizer(phrase)] = {}
					}, this)	
				}, this)	
			}, this)
		}, this)	
	}, this)	

	return seeds
}




var retrieveIntentKeyphrase = function(turn, seeds, callback)
{
    var output = []
   	async.eachSeries(Object.keys(seeds), function(intent, callback1){
   		async.eachSeries(Object.keys(seeds[intent]), function(keyphrases, callback2){
   			async.eachSeries(seeds[intent][keyphrases], function(phrase, callback3){
 				
				// input - test utterances
	      		var input_list = input.split(" ")

	      		// console.log("before olycontent")
	      		onlycontent(phrase, function(err, response) {

	      			// response - content of the seed
 		 			var content_phrase = (response.length != 0 ? response : phrase.split(" "));
			        if (_.isEqual(content_phrase, _.intersection(input_list, content_phrase)) == true)
					      	{
    					var elem = {}
    					elem[intent] = {}
    					elem[intent]['original seed'] = keyphrases
    					elem[intent]['ppdb phrase'] = phrase
    					elem[intent]['content of ppdb phrase'] = content_phrase
      					output.push(elem)
    					}
    				callback3()
    			})
			},function(err){callback2()})
		},function(err){callback1()})
	},function(err){
	    // console.log("end retrieveIntent")
		callback(err, output)})
}


var threelayercross = function (seed, callback)
{	
	var fetched = [seed]
	async.mapSeries([seed], quickfetch, function(err, bestlist1) {
		// async.mapSeries(_.flatten(bestlist1), quickfetch, function(err, bestlist2) {
			// async.mapSeries(_.flatten(bestlist2), quickfetch, function(err, bestlist3) {
				// fetched = fetched.concat(bestlist1).concat(bestlist2).concat(bestlist3)
				// fetched = fetched.concat(bestlist1).concat(bestlist2)
				fetched = fetched.concat(bestlist1)

				callback(null, _.unique(_.flatten(fetched)))
			// })
		// })
	})
}

var onepairfetch = function (seed, callback)
{
    var toretrieve = []
    toretrieve.push(seed)

    onlycontent(seed, function (err,replies){

    	toretrieve.push(replies.join(" "))
	    toretrieve = toretrieve.concat(replies)
	    toretrieve = _.compact(_.unique(toretrieve))

	   	async.mapSeries(toretrieve, quickfetch, function(err, resultArr) {
	        callback(err,_.compact(_.unique(_.flatten(resultArr))))
	    })
    })
}

// what it does?
// it looks like it just rearrange the keyphrases to the structure of stats
function formkeyphrases(keyphrases)
{
	var stats = {}
	_.each(keyphrases, function(item, key, list){
	        _.each(item['labels'], function(values, label, list){
	                if (!(label in stats))
	                                stats[label] = {}
	                // _.each(values, function(value, key, list){
	                        if (!(_.isEqual(values,[''])))
	                        // if (values.length > 0)
	                                {
	                                        _.each(values, function(value, key1, list){
	                                                value = value.toLowerCase();
	                                                if (!(value in stats[label]))
	                                                         stats[label][value] = []
	                                                stats[label][value].push(item['sentence'])

	                                        }, this)
	                                }
	                                        // stats[label] = stats[label].concat(values)

	                 // }, this) 
	        }, this)
	}, this)
	return stats
}

// function onlycontent(string)
// {
// 	var out = []

// console.log(string)
// tagger.tag(string).then(function(resp) 
// {		console.log("resp")

//       var cleaned = resp[0].replace(/\n|\r/g, "");
// 		var pairlist = cleaned.split(" ")
// 		var POS = []

// 		_.each(pairlist, function(value, key, list){
// 			POS.push(value.split("_"))
// 		}, this)


// 		_.each(POS, function(value, key, list){ 
// 			if (CONTENT.indexOf(value[1]) != -1)
// 				out.push(value[0])
// 		}, this)

// 	},
//     function(err) {
//       console.log(err);
//     }
//   );
//  }
function getcontent(string,callback)
{
	tagger.tag(string, function(err, resp) {
		callback(err, resp)
	})
}

function cleanposoutput(resp)
{
	var out = []

	var cleaned = resp.replace(/\n|\r/g, "");
	var pairlist = cleaned.split(" ")
	var POS = []

	_.each(pairlist, function(value, key, list){
		POS.push(value.split("_"))
	}, this)

	_.each(POS, function(value, key, list){ 
		// if (value[0] == "not")
			// out.push(value[0])
		if (CONTENT.indexOf(value[1]) != -1)
			out.push(value[0])
	}, this)
	
	return out
}

// tagger returns list
// in redis we store strings

function crosslist(list)
{

    var crossl = []

    for (i = 0; i < list.length; i++) { 
        for (j = i + 1; j < list.length; j++) { 
            crossl.push([
            				list[i],
                         	list[j]
                        ])
        }    
    }
    return crossl
}

/*
input: data - dialogues where turn consist of 'intent_keyphrases_rule'
output: keyphrases of intent Offer and not DEFAULT INTENT
*/
/*function extractkeyphrases(data)
{
var keyphrases = []
	_.each(data, function(dialogue, key, list){ 
	    _.each(dialogue['turns'], function(turn, key, list){
	        if (turn['status'] == 'active')
	            if ('intent_keyphrases_rule' in turn)    
	                _.each(turn['intent_keyphrases_rule'], function(keyphrase, intent, list){ 
	                    if ((intent == 'Offer') && (keyphrase != 'DEFAULT INTENT'))
	                        {
	                        keyphrase = keyphrase.replace('<VALUE>','')
	                        keyphrase = keyphrase.replace('<ATTRIBUTE>','')
	                        keyphrase = keyphrase.replace('^','')
	                        keyphrase = keyphrase.replace('$','')
	                        keyphrase = keyphrase.replace('?','')
	                        keyphrase = keyphrase.trim()
	                        keyphrases.push(keyphrase)
	                        }
	                }, this)
	    }, this)
	}, this)
return keyphrases
}
*/
function retrievepos(string, callback)
{
	// console.log(string)	
	tagger.tag(string, function(err, tag) {
	   	clientpos.select(10, function(err, response) {
			clientpos.set(string, tag, function (err, response) {
				callback(err, tag[0].replace(/\n|\r/g, ""))
			})
		})
	})
}

function onlycontent(string, callback)
{
			cachepos(string,function(err, response){
				var output = cleanposoutput(response)
				buffer[string] = output 			
				callback(err, [output])
			})
}

function cachepos(string, callback)
{
    clientpos.select(10, function() {
		clientpos.get(string, function (err, pos) {
			// console.log("location " + pos)
            if ((pos == null) || (pos == "OK"))
	        {
		        retrievepos(string, function (err, response){
		        	// console.log("tagger " + response)
					callback(err, response)
		        })
		    }
		    else
		    {
		    	// console.log(pos)
				callback(err, pos)
		    }
         })
    })
}

function subst(str) {
	var subst = []	
	var str = str.split(" ")
	for (var start=0; start<=str.length; ++start) {
		for (var end=start+1; end<=str.length; ++end) {
			subst.push(str.slice(start,end).join(" "));
  		}
	}
return _.compact(subst)
}


function elimination(strcontentlemma)
{
	var elim = ['i','follow','good','instead','do','maximum','mind','actually','prepare','willing','want','ha', 'has','have','is', 'are', 'be', 'will', 'let', 'i', 'I', 'to', 'you', 'we', 'for',
		'i\'ll', 'so', 'the', 'can\'t', 'let\'s', 'only', 'can', 'on','her','an', 'it', 'is', 'on', 'this', 'make', 'made'
		, 'am']

	_.each(elim, function(value, key, list){ 
		strcontentlemma = _.without(strcontentlemma,value)
	}, this)

	return strcontentlemma
}

// input: string
// output: normlized string
function normalizer(str, callback)
{
	if (_.isArray(str))
		{
		// console.log("array")
		str = str[0]
		}
	str = str.trim()
	str = bars.biunormalizer(str)

	
	onlycontent(str, function (err,strcontent){

		if (_.compact(strcontent).length == 0) 
       		strcontent = str.split(" ")
    
    	strcontentlemma = lemmatize(strcontent)

   		strcontentlemma = elimination(strcontentlemma)

    	if (strcontentlemma.length == 0) 
       		strcontentlemma = strcontent
       	
       	strcontentlemma = _.compact(strcontentlemma)
       	callback(err, strcontentlemma)
    })
}

/*
input: [X-string,Y-string]
output: distance*/
function compare(ar,callback)
{

var X = ar[0]
var Y = ar[1]

normalizer(X, function (err, norm_X){
	normalizer(Y, function (err1, norm_Y){
	   	callback(err1+err,[X, Y, norm_X, norm_Y, distance(norm_X, norm_Y)])
	})
})
}
/*
input: ['offered','found']
output ['offer','find']
*/
var lemmatize = function(X)
{

var newX = []

_.each(X, function(value, key, list){ 
	var lem = lemmerEng.lemmatize(value)
	if ((lem.length > 0) && ('text' in lem[0])) 
		{
		lem = _.sortBy(lem, function(num){ return num['text'].length });
		newX.push(lem[0]['text'].toLowerCase())
		}
	else
		newX.push(value)
}, this)

// console.log("lem output"+newX)
return newX
}

var distance = function (X,Y)
{
    
    if ((X.length == 0) || (Y.length == 0))
        return 0
    return natural.DiceCoefficient(X.join(" "),Y.join(" "))    
}

function closeredis()
{
    client.quit()
    clientpos.quit()

}

function writepos(key, value, callback)
{
	clientpos.select(10, function() {
		clientpos.set(key, value, function (err, pos) {
			callback(err, pos)
		})
	})
}

function readpos(key, callback)
{
	clientpos.select(10, function() {
		clientpos.get(key, function (err, pos) {
			// console.log("YAH")
			callback(err, pos)
		})
	})	
}

function sortedredis(string, callback)
{
	client.select(DBSELECT, function() {
        client.smembers(string, function(err, replies) {
            callback(err, replies)
         })
    })
}


function cleanredis(string, callback)
{
	if (_.isArray(string) == true)
		string = string[0]

	client.select(DBSELECT, function() {
        // client.smembers(string, function(err, replies) {
        client.zrange(string, 0, -1, 'WITHSCORES', function(err, replies) {
            callback(err, replies)
         })
    })
}

function cleandb(callback)
{
	client.select(DBSELECT, function() {
        // client.smembers(string, function(err, replies) {
            callback()
         // })
    })
}

// function checkinclusion(actuals, inputs, callback)
// {	
// 	// generate all pairs of actual and inputs
// 	var tocompare = []
// 	_.each(inputs, function(input, key, list){
// 		var pairs = subst(input)
// 		_.each(actuals, function(actual, key, list){ 
// 			var mappedpairs = _.map(pairs, function(pair){return [pair, actual, input]})
// 			tocompare = tocompare.concat(mappedpairs)
// 		}, this)
// 	}, this)

// 	var output = {}
// 	// compare all pairs
// 	var actualsindata = []
// 	async.mapSeries(tocompare, compare, function(err, responses){
// 		// console.log(JSON.stringify(responses, null, 4))
// 		_.each(responses, function(response, key, list){ 
// 			if (response[4] == 1)
// 				{
// 				if (!(response[1] in output))
// 					output[response[1]] = []
// 				output[response[1]].push(response)
// 				output[response[1]] = _.compact(_.unique(output[response[1]]))
// 				}
// 		}, this)

// 		callback(err, output)
// 		// callback(err, _.compact(_.unique(actualsindata)))
// 	})
// }


function checkinclusion(actuals, inputs, callback)
{	
	// generate all pairs of actual and inputs
	// var tocompare = []

	var output = {}
    async.eachSeries(inputs, function(input, callback1){
		var pairs = subst(input)
    	async.eachSeries(actuals, function(actual, callback2){
		// _.each(actuals, function(actual, key, list){ 
			var mappedpairs = _.map(pairs, function(pair){return [pair, actual]})
			async.mapSeries(mappedpairs, compare, function(err, responses){		
				_.each(responses, function(response, key, list){ 
					if (response[4] == 1)
						{
						if (!(actual in output))
							output[actual] = []
						output[actual].push(input)
						output[actual] = _.compact(_.unique(output[actual]))
					}
				}, this)
				callback2()
				})
		},function(err){callback1()})
	}, function(err){
		callback(err, output)
	})
}


function cleanpos(string)
{
	
	var pos = sync.await(readpos(string, sync.defer()))
	if (pos == null)
		{
		pos = sync.await(tagger.tag(string, sync.defer()))
		sync.await(writepos(string, pos, sync.defer()))
		}

	return pos
	// var tagged =  tagger.tag(string)
	// writepos(string, tagged)
	// return tagged
}


// Given features and the list of seeds with scores return for the feature the list of 
// keys with scores
// [ 'an agreement',
//      [ 'a convention', 'NP', 14.105069 ],
//      [ 'a convention', 'NP/VP', 19.212010999999997 ],
//      [ 'a deal', 'NP', 9.953975 ],
//      [ 'a settlement', 'NP', 14.615390000000001 ],
//      [ 'accord', 'NP', 22.119474 ],
//      [ 'accordance', 'NP', 25.968919 ],
//      [ 'agree', 'NP', 28.473899000000003 ],
//      [ 'agreements', 'NP', 19.644709000000002 ],
//      [ 'an accord', 'NP', 12.791467 ],
//      [ 'an arrangement', 'NP', 12.66407 ],
//      [ 'an understanding', 'NP', 14.932433999999999 ],
//      [ 'arrangement', 'NP', 29.012425999999998 ],
//      [ 'consensus', 'NP', 22.773567999999997 ],
//      [ 'convention', 'NP', 25.112699 ],
//      [ 'convention', 'X', 33.757616 ],
//      [ 'deal', 'NP', 21.92968 ],

function seekfeature(feature, seeds)
{

  if (feature in seeds)
    return [[feature,1]]

	var output = []
	_.each(seeds, function(value, key, list){
		output = output.concat(indexOflist(key, value, feature))
	}, this)

  // there is no replacement then this will get 0 in any case
  if (output.length == 0)
      output.push([feature,0])

  return output
}

// universal search of feature in value where value can be the list of elements or another lists
function indexOflist(key, value, feature)
{
	var withscore = []
	_.each(value, function(value1, key1, list1){ 
		if (_.isArray(value1))
		{
			if (value1[0] == feature)
				withscore.push([key, value1[2]])
		}
		else
		{
			if (value1 == feature)
				withscore.push([key, 1])
		}
	}, this)
	return withscore
}

function dot(v1, v2) {
  return _.reduce(_.zip(v1, v2), function(acc, els) {
    return acc + els[0] * els[1];
  }, 0); 
};
 
function mag(v) {
  return Math.sqrt(_.reduce(v, function(acc, el) {
    return acc + el * el; 
  }, 0));
};

function cosine(v1, v2)
{
	return dot(v1, v2) / (mag(v1) * mag(v2));	
}

function buildvector(featuremap, features)
{
	var output = []
	_.each(featuremap, function(feature, key, list){ 
		if (feature in features)
			output.push(features[feature])
		else
			output.push(0)
	}, this)
	return output
}

// var features = {'dog':1, 'cat': 1, 'shark':1, 'salomon':1}
// var seeds = {'animals':[['dog',5], ['cat',6]], 
				// 'fish': [['shark',7]]}

// add details what was replaced 
function replacefeatures(features, seeds, idf)
{

  var replace = {}
  var details = {}

// place first priority features, features that appear in train should be placed first
	_.each(Object.keys(features), function(value, key, list){
  		if (value in seeds)
	 		replace[value] = idf(value)
	})

  	_.each(Object.keys(features), function(value, key, list){
  		if (!(value in replace))
  		{
	    	var list = seekfeature(value, seeds)

	        _.each(list, function(element, key1, list1){ 
		      	// the actual score from ppdb is a fine
		   		list[key1][1] = (list[key1][1] == 0 ? 0 : idf(element[0])/Math.sqrt(list[key1][1]))
	      	}, this)
	    
	      	list = _.sortBy(list, function(num){ return num[1] })
	      	
	      	var atleastone = false

	      	_.each(list, function(elem, key, list){ 
	      		if (!(elem[0] in replace))
	      			{
	      			replace[elem[0]] = elem[1]
	      			
	      			if (value != elem[0])
	      				details[value] = elem[0]

	      			atleastone = true
	      			}
	      	}, this)

	      	if ((atleastone == false) && (list.length > 0))
	      		details[value] = list[0][0]
      	}
  	}, this)
  
  return {'features': replace, 'details': details}
}


function takeIntent(evalution)
{
	var output = []

	_.each(evalution, function(value, key, list){ 
		if (value.length > 0)
			{
			evalution[key] = _.sortBy(value, function(num){ return num[0] })
			evalution[key] = evalution[key].reverse()
			output.push([key, evalution[key][0][0]])
			}
	}, this)

	output = _.sortBy(output, function(num){ return num[1] })
	output = output.reverse()

	if (output.length > 0) return output[0][0]
		else
			return []

}

function comparefeatures(original, features)
{
	var dif = 0
	_.each(original, function(value, key, list){ 
		if (!(key in features))
			dif += 1
	}, this)
	return dif
}


function enrichseeds_original(seeds)
{

	var seeds = bars.copyobj(seeds) 

	_.each(seeds, function(keyphrases, intent, list){ 
		_.each(keyphrases, function(grams, keyphrase, list){ 
			_.each(grams, function(value, gram, list){ 
				seeds[intent][keyphrase][gram] = {}
				seeds[intent][keyphrase][gram][gram] = {}
			}, this)
		}, this)
	}, this)
  return seeds
}

function enrichseeds(seeds, callback)
{
	var seeds = bars.copyobj(seeds) 

    async.eachSeries(Object.keys(seeds), function(intent, callback1){
    	async.eachSeries(Object.keys(seeds[intent]), function(keyphrase, callback2){
    		async.eachSeries(Object.keys(seeds[intent][keyphrase]), function(ngram, callback3){
         		 recursionredis([ngram], [2], false, function(err,results) {
          		  	_.each(results, function(result, key, list){ 
          		  		seeds[intent][keyphrase][ngram][result] = {}
          		  	}, this)
          		  callback3()
	      		 })
			},function(err){callback2()})
		},function(err){callback1()})
	},function(err){callback(err,seeds)})
}

function generatengramsasync(sentence, callback)
{
	callback("",generatengrams(sentence))
}

function generatengrams(sentence)
{
	var tokenizer = new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9%'$+-]+/});
	var words = tokenizer.tokenize(sentence);
	
	var feature = []

	_(3).times(function(n){
		feature = feature.concat(bars.skipgrams(words, n, 3))
	})

	var features = []
	_.each(feature, function(value, key, list){ 
		if (!bars.isstopword(value))
			features.push(value.join(" "))
	}, this)

	features = _.unique(features)
	features = _.sortBy(features, function(num){ return num.length })
	features = _.compact(features)

	return features
}

function loadseeds(train_turns, ngram)
{
	var seeds = {}
	_.each(train_turns, function(turn, key, list){
	  if (intent_field in turn)
	    _.each(turn[intent_field], function(keyphrase, intent, list){

	      	if (!(intent in seeds))
	        	seeds[intent] = {}

		      if ((keyphrase != 'DEFAULT INTENT') && (keyphrase != ''))
		      {

		        keyphrase = bars.cleanupkeyphrase(keyphrase)

		        seeds[intent][keyphrase] = {}
		        seeds[intent][keyphrase][keyphrase] = {}

				if (ngram == true)
				{
					_.each(generatengrams(keyphrase), function(value, key, list){
		       			 seeds[intent][keyphrase][value] = {}
					}, this)
				}

		      } 
	      
	    }, this)
	}, this)

	return seeds
}

function calculateparam(results, params)
{
var output = {}
_.each(params, function(param, key, list){ 

	output[param] = {}
	output[param]['list'] = []
	output[param]['average'] = []

	_.each(results[0], function(method, keymethod, list){ 
		output[param]['list'].push(_.map(results, function(num){ return num[keymethod][param]; }))
	}, this)

	
	_.each(output[param]['list'], function(value, key, list){
		var len =  (_.filter(value, function(num){ return num >= 0; })).length
		output[param]['average'].push(_.reduce(value, function(memo, num){ if (num >= 0) {return memo + num} else {return memo + 0} }, 0)/len)
	}, this)
	
}, this)

return output
}

function seqgold(turn)
{
	var seq = []
	
	if (!(intent_field in turn))
		return []
	// var turn_norm = bars.biunormalizer(turn['input'])
	var turn_norm = bars.biunormalizer(turn['input_modified'])

	var intents = onlyIntents(turn['output'])
	_.each(intents, function(intent, key, list){ 
		if (intent in turn[intent_field])
		{
			var keyphrase = turn[intent_field][intent]
			keyphrase = bars.cleanupkeyphrase(keyphrase)
			keyphrase = bars.biunormalizer(keyphrase)
			var pos = rules.compeletePhrase(turn_norm, keyphrase)
			if (keyphrase == 'default intent')
				seq.push(['Offer', [-1, -1], keyphrase ])
			else
				seq.push([intent, [pos, pos + keyphrase.length], keyphrase ])

			if ((keyphrase != 'default intent') && (pos == -1))
			{
				console.log(turn)
				console.log(keyphrase)
				console.log(pos)
				console.log("error seqgold")
				process.exit(0)
			}

		}
	}, this)
	return seq
}

module.exports = {
	seqgold:seqgold,
	distance:distance,
	compare:compare,
	onlycontent: onlycontent,
	onepairfetch:onepairfetch,
	// quickfetch:quickfetch,
	formkeyphrases:formkeyphrases,
	closeredis:closeredis,
	getcontent:getcontent,
	lookupSynonyms:lookupSynonyms,
	lemmatize:lemmatize,
	// threelayer:threelayer,
	wordnetsynonyms:wordnetsynonyms,
	stat:stat,
	// listeval:listeval,
	cleanposoutput:cleanposoutput,
	threelayercross:threelayercross,
	retrievepos:retrievepos,
	cleanpos:cleanpos,
	cleanredis:cleanredis,
	readpos:readpos,
	writepos:writepos,
	// cleancompare:cleancompare,
	// cleanlisteval:cleanlisteval,
	cleandb:cleandb,
	recursionredis:recursionredis,
	crosslist:crosslist,
	sortedredis: sortedredis,
	// cleanthreelayer:cleanthreelayer
subst:subst,
checkinclusion:checkinclusion,
cachepos:cachepos,
clusteration:clusteration,
dep:dep,
// extractkeyphrases:extractkeyphrases,
normalizer:normalizer,
elimination:elimination,
retrieveIntent:retrieveIntent,
onlyIntents:onlyIntents,
seekfeature:seekfeature,
indexOflist:indexOflist,
cosine:cosine,
buildvector:buildvector,
replacefeatures:replacefeatures,
takeIntent:takeIntent,
comparefeatures:comparefeatures,
loadseeds:loadseeds,
calculateparam:calculateparam,
enrichseeds:enrichseeds,
enrichseeds_original:enrichseeds_original,
generatengrams:generatengrams,
generatengramsasync:generatengramsasync,
afterppdb:afterppdb,
retrieveIntentsync:retrieveIntentsync,
localizeinter:localizeinter,
maximizer:maximizer
}
