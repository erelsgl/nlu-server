// var sync = require('synchronize')
// docker run -t -i -p 9000:9000 cuzzo/stanford-pos-tagger
 // sudo tcpdump -s 0 -A 'tcp dst port 10345 and (tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x504f5354)' -i lo

var Fiber = require('fibers');
var fs = require('fs');
var limdu = require("limdu");
var ftrs = limdu.features
var _ = require('underscore')._;
var natural = require('natural');
var Lemmer = require('node-lemmer').Lemmer;
var lemmerEng = new Lemmer('english');
var Hierarchy = require('../../Hierarchy');
var splitJson = Hierarchy.splitJson

var Tagger = require("../../node_modules/node-stanford-postagger/postagger").Tagger;
var tagger = new Tagger({
  port: "9000",
  host: "54.191.84.213"
});
// tagger.denodeify(Q);

var wordnet = new natural.WordNet();
var async = require('async');
var redis = require("redis")

var client = redis.createClient(6369)
var clientpos = redis.createClient(6369);

var DBSELECT = 0

var requestify = require('requestify'); 
var querystring = require('querystring');

var regexpNormalizer = ftrs.RegexpNormalizer(
    JSON.parse(fs.readFileSync(__dirname+'/../../knowledgeresources/BiuNormalizations.json')));

function biunormalizer(sentence) {
  sentence = sentence.toLowerCase().trim();
  return regexpNormalizer(sentence);
}

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
    		console.log(res)
    		process.exit(0)
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

	var output = []
	wordnet.onlySynonyms(seed, function(results) {
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

function cleanlisteval(actual, expected)
{ 

var expectedcopy = expected
var TP = 0
var FP = 0
var FN = 0

var TPdetails = []
var FPdetails = []
var FNdetails = []
var found = false

// var f = Fiber(function() {
 var fiber = Fiber.current

	_.each(actual, function(actkey, key, list){ 
		if ((actual.indexOf(actkey)%10 == 0) && (actual.indexOf(actkey) != 0))
	        console.log(actual.indexOf(actkey))
		
		found = false
		var tempTP = []
		_.each(expected, function(expkey, key, list){ 
	        compare([actkey,expkey], function (err, resp){
    			fiber.run(resp);
			})

	        var res = Fiber.yield();

	        if (res[4] == 1 )
		        {
	            expectedcopy = _.without(expectedcopy,expkey)
	            tempTP.push(expkey)
	            }

	    })
	    
	    if (tempTP.length > 0)
		{
	    	TPdetails.push([actkey, tempTP])
	    	TP = TP + 1
		}
		else
       	{
	        FP = FP + 1
	       	FPdetails.push(actkey)
        }
	})

	FN = expectedcopy.length
	FNdetails = expectedcopy

	return {'stats':{'TP':TP,'FP':FP,'FN':FN},
		    'data': {'TP': TPdetails,
				     'FP': FPdetails,
				     'FN': FNdetails
				    }}
  		
}      

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

	console.log("load syn")
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


var cleanposfromredis = function(data)
{
	_.each(data, function(value, key, list){
		data[key] = value.split("^")[0] 
	}, this)
	return data
}

var recursionredis = function (seeds, order, callback)
{	
	var fetched = seeds
	async.timesSeries(order.length, function(n, next)
		{
		DBSELECT = order[n]
		// console.log(n)
		async.mapSeries(fetched, cleanredis, function(err, bestli) 
			{
				bestli = cleanposfromredis(_.flatten(bestli))
				fetched = fetched.concat(bestli)
				fetched = _.unique(_.flatten(fetched))
				// console.log(fetched.length)
				next()
			})
		},
		function(err, res)
		{
			callback(null, cleanposfromredis(_.unique(_.flatten(fetched))))
		}
	)
}

var onlyIntents = function(labels)
{
  var output = []
  _.each(labels, function(label, key, list){ 
    var lablist = splitJson(label)
    output = output.concat(lablist[0])  
  }, this)
  
  return output
}

var retrieveIntent = function(input, seeds, callback)
{
    var output = []

	async.eachSeries(Object.keys(seeds), function(intent, callback1){
   		async.eachSeries(seeds[intent], function(paraphrases, callback2){
   			async.eachSeries(Object.keys(paraphrases), function(originalphrase, callback3){
   				var phrases = paraphrases[originalphrase]
   				async.eachSeries(phrases, function(phrase, callback4){

		      		var input_list = input.split(" ")

		      		onlycontent(phrase, function(err, response) {
     		 			var content_phrase = (response.length != 0 ? response : phrase.split(" "));
				        if (_.isEqual(content_phrase, _.intersection(input_list, content_phrase)) == true)
  					      	{
        					var elem = {}
        					elem[intent] = phrase
          					output.push(elem)
        					}
        				callback4()
        			})
				},function(err){callback3()})
			},function(err){callback2()})
		},function(err){callback1()})
	},function(err){callback(err, output)})
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

	// console.log(resp)
	
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
	
	// console.log(out)
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
function extractkeyphrases(data)
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

function retrievepos(string, callback)
{
	
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
		// console.log("onlycontent")
		// console.log(response)
		callback(err, cleanposoutput(response))
	})
  //   clientpos.select(10, function() {
		// clientpos.get(string, function (err, pos) {
  //           if ((pos == null) || (pos == "OK"))
	 //        {
		//         retrievepos(string, function (err, response){
		// 			callback(err, cleanposoutput(response))
		//         })
		//     }
		//     else
		//     {
		//     	// console.log("redis")
		// 		callback(err, cleanposoutput(pos))
		//     }
  //        })
  //   })
}


function cachepos(string, callback)
{
    clientpos.select(10, function() {
		clientpos.get(string, function (err, pos) {
            if ((pos == null) || (pos == "OK"))
	        {
		        retrievepos(string, function (err, response){
		        	// console.log(response)
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
	str = biunormalizer(str)

	
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
	client.select(DBSELECT, function() {
        // client.smembers(string, function(err, replies) {
        client.zrange(string, 0, -1, function(err, replies) {
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

module.exports = {
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
	cleanlisteval:cleanlisteval,
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
extractkeyphrases:extractkeyphrases,
normalizer:normalizer,
elimination:elimination,
retrieveIntent:retrieveIntent,
onlyIntents:onlyIntents
}