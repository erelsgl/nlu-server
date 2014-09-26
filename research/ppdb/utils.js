var sync = require('synchronize')


var _ = require('underscore')._;
var natural = require('natural');
var Lemmer = require('node-lemmer').Lemmer;
var lemmerEng = new Lemmer('english');

var Tagger = require("../../node-stanford-postagger/postagger").Tagger;
var tagger = new Tagger({
  port: "9000",
  host: "localhost"
});
// tagger.denodeify(Q);

var wordnet = new natural.WordNet();
var async = require('async');
var redis = require("redis")
var client = redis.createClient(6369)
// var client = redis.createClient(6369, "132.70.6.156", {})
var clientpos = redis.createClient();
// var clientpos = client
var DBSELECT = 2

// sync(client,'select')
// sync(client,'smembers')

// var POSS = {}

// just - RB - consider to eliminate
// able - JJ ?
// [ 'you_PRP ca_MD n\'t_RB get_VB\n' ]
// is_VBZ
// [ 'be_VB working_VBG\n' ]
var CONTENT = ['FW','NN','VBN','VBP','JJ', 'VB','VBD','RB', 'NNS', 'VBG', 'VBZ', 'JJS']
// FW - foreign word

function wordnetsyn(word, callback) {
var out = []
	wordnet.lookup('offer', function(results) {
		out.concat = out.concat(results['synonyms'])
		callback(null, out)
	})
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
	wordnet.lookupSynonyms(seed, function(results) {
		var output = []
		_.each(results, function(value, key, list){ 
			if (value['pos'] = "v")
				output.push(value['lemma'].split("_").join(" "))
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



// function listeval(actual, expected, maincallback)
// { 

// var expectedcopy = expected
// var TP = 0
// var FP = 0
// var FN = 0

// var TPdetails = []
// var FPdetails = []
// var FNdetails = []

// async.series([
//     function(callback){
//       async.eachSeries(actual, function(actkey, callbackact){
//       	// console.log(actkey)
//       	if (actual.indexOf(actkey)%10==0)
//         	// console.log(actual.indexOf(actkey))
//         var found = false
//         async.series([
//           function(callback){
//             async.eachSeries(expected, function(expkey, callbackexp){
//               // console.log("-"+expkey)
//               compare([actkey,expkey], function(err, res){
//                 // console.log("@ "+actkey+" "+expkey)
//                 // console.log(res)
//                 if (res[4] = 1 )
//                   expectedcopy = _.without(expectedcopy,expkey)

//                 if ((res[4] = 1) && (found == false))
//                   {
//                   TP = TP + 1
//                   found = true
//                   TPdetails.push([actkey, expkey])
//                   }
//               callbackexp()
//               })
//             }, function (err) {
//                 callback(null, "ok")
//               })
//           },
//           function(callback){

//             if (found == false) 
//             	{
//             		FP = FP + 1
//             		FPdetails.push(actkey)

//             	}
//             callbackact()
//         	// console.log()
//         	// process.exit(0)

//           }])
//       }, function (err) {
//                 callback(null, "ok")
//               })
//     },
//     function(callback){
//       FN = expectedcopy.length
//       FNdetails = expectedcopy

//       maincallback(null, {'stats':{'TP':TP,'FP':FP,'FN':FN},
//       					  'data': {'TP': TPdetails,
//       							   'FP': FPdetails,
//       							   'FN': FNdetails
//       							   }})
  		
// 	    }])}


function cleanlisteval(actual, expected, maincallback)
{ 
var expectedcopy = expected
var TP = 0
var FP = 0
var FN = 0

var TPdetails = []
var FPdetails = []
var FNdetails = []

_.each(actual, function(actkey, key, list){ 
	if (actual.indexOf(actkey)%10 == 0)
        // console.log(actual.indexOf(actkey))
    var found = false
	_.each(expected, function(expkey, key, list){ 
        var res = cleancompare([actkey,expkey])
        if (res[4] = 1 )
            expectedcopy = _.without(expectedcopy,expkey)

        if ((res[4] = 1) && (found == false))
          	{
          	TP = TP + 1
          	found = true
          	TPdetails.push([actkey, expkey])
          	}
    })

    if (found == false) 
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
		'F1':2*Precision*Recall/(Precision+Recall)
		}
}

function loadResultSynonyms(synonyms, results, callback2) {
// console.log("loadResultSynonyms")
// console.log(result.ptrs)
// console.log()
// process.exit(0)
  // if(results.length > 0) {
    // var result = results.pop();
    // loadSynonyms(synonyms, results, result.ptrs, callback);
  // } else
    // callback(synonyms);

    // console.log("synonyms")
    // console.log(synonyms)

    // console.log("result")
    // console.log(results)


 async.series([
    function(callback){
    async.eachSeries(results, function(res, callbackDone){ 
    // _.each(results, function(res, key, list){ 
    	// console.log("check "+ res)
    	if (synonyms.indexOf(res) == -1)
		    {
		    	// console.log("yes")
	    		synonyms.push(res)
		    	quickfetch(res, function(err,results) {
	    			loadResultSynonyms(synonyms, results)
	    			callbackDone();
				});
			}
		else
			{
			// console.log("no")
    		callbackDone();
    		}
    	 }
        // function(err){
                // callback(null, "ok")
                // }
                )},
        
        function(callback){
        	callback2(null, synonyms)
        }
         ]
        // function(err){
            
        // }
        )
       

//     function(callback){
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

var quickfetch = function (seed, callback)
{	
    client.select(DBSELECT, function() {
        client.smembers(seed, function (err, replies) {
            callback(err,replies)
         })
    })
}

// var contentlist = function (list, callback)
// {

	// onlycontent()

// }

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


var cleanthreelayer = function (seeds, depth)
{	

	console.log("seeds"+seeds)

	var data = sync.await(cleanredis(seeds[0], sync.defer()))

	console.log(data)
	// return cleanredis(seeds[0])
	// _(depth).times(function(n){
		// seeds = seeds.concat(_.map(seeds, cleanredis))
		// seeds = seeds.concat(_.map(seeds, sync.await(cleanredis(sync.defer()))))
		// return sync.await(cleanredis(seeds[0], sync.defer()))

		return data
	// })
	// return seeds
}
	// async.mapSeries(seed, quickfetch, function(err, bestlist1) {
		// async.mapSeries(_.flatten(bestlist1), quickfetch, function(err, bestlist2) {
			// async.mapSeries(_.flatten(bestlist2), quickfetch, function(err, bestlist3) {
				// fetched = fetched.concat(bestlist1).concat(bestlist2).concat(bestlist3)
				// fetched = fetched.concat(bestlist1).concat(bestlist2)
				// fetched = fetched.concat(bestlist1)

				// console.log(fetched)
				// process.exit(0)
				// callback(null, _.unique(_.flatten(fetched)))
			// })
		// })
	// })
// }

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
		if (CONTENT.indexOf(value[1]) != -1)
			out.push(value[0])
	}, this)
	
	// console.log(out)
	return out
}

// tagger returns list
// in redis we store strings

function retrievepos(string, callback)
{
	tagger.tag(string, function(err, resp) {
		var res = resp
    	clientpos.select(10, function(err, resp) {
			clientpos.set(string,resp, function (err, pos) {
				callback(err, res[0].replace(/\n|\r/g, ""))
			})
		})
	})
}

// function writepos(key, value)
// {
// 	clientpos.select(10, function() {
// 		clientpos.set(key, value, function (err, pos) {
// 		})
// 	})
// }


// function cleanredis(string, callback)
// {
// 	client.select(DBSELECT, function() {
//         client.smembers(string, function (err, replies) {
//             callback(err,replies)
//          })
//     })
// }



// function cleanpos(string)
// {

// 	sync(tagger, 'tag')
// 	var tagged =  tagger.tag(string)
// 	sync(writepos)
// 	writepos(string, tagged)
// 	return tagged
// }


function onlycontent(string,callback)
{
    clientpos.select(10, function() {
		clientpos.get(string, function (err, pos) {
            if (pos == null)
	        {
		        retrievepos(string, function (err, response){
					callback(err, cleanposoutput(response))
		        })
		    }
		    else
		    {
		    	// console.log("redis")
				callback(err, cleanposoutput(pos))
		    }
         })
    })

	// tagger.tag(string, function(err, resp) {
	// 	var cleaned = resp[0].replace(/\n|\r/g, "");
	// 	var pairlist =.split(" ") cleaned.split(" ")
	// 	var POS = []

	// 	_.each(pairlist, function(value, key, list){
	// 		POS.push(value.split("_"))
	// 	}, this)


	// 	_.each(POS, function(value, key, list){ 
	// 		if (CONTENT.indexOf(value[1]) != -1)
	// 			out.push(value[0])
	// 	}, this)

	// 	// POSS[string] = out
	// 	callback(err, out)
	// });

}
/*
input: [X,Y]
output: distance*/
function compare(ar,callback)
// function compare(X,Y)
{

// var elim = []
var elim = ['is', 'are', 'be', 'will', 'let', 'i', 'I', 'no', 'not', 'to', 'you', 'we', 'for',
'i\'ll', 'so', 'the', 'can\'t', 'let\'s', 'only', 'on']

var X = ar[0]
var Y = ar[1]

onlycontent(X, function (err,replies){
	var compX = replies
	onlycontent(Y, function (err1,replies1){
		var compY = replies1

		if (compY.length == 0) 
       		compY = Y.split(" ")
    
    	if (compX.length == 0)
        	compX = X.split(" ")

        compX = lemmatize(compX)
    	compY = lemmatize(compY)

    	var compXX = compX
    	var compYY = compY

    	_.each(elim, function(value, key, list){ 
    		compXX = _.without(compXX,value)
	    	compYY = _.without(compYY,value)
    	}, this)

    	if (compYY.length == 0) 
       		compYY = Y.split(" ")
       	
       	if (compXX.length == 0) 
       		compXX = X.split(" ")
    	
       	compXX = _.compact(compXX)
       	compYY = _.compact(compYY)

    	callback(err1+err,[X, Y, compXX, compYY, distance(compXX, compYY)])

	})
})

}
/*
input: ['offered','found']
output ['offer','find']
*/
var lemmatize = function(X)
{
// console.log("lem input"+X)
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
			console.log("YAH")
			callback(err, pos)
		})
	})	
}

function cleanredis(string, callback)
{
	// console.log("cleanredis")
	// console.log(string)

	// var out = sync.await(client.select(DBSELECT, sync.defer()))
	// console.log(out)/
	// var data  = sync.await(client.smembers(string, sync.defer()))
	// return data
	// var out = client.select(DBSELECT)
	// console.log(out)

	// var data = client.smembers(string)
	// console.log(data)

	// return data
	// cleanredis
	client.select(2, function() {
		// console.log("err"+err)
		// console.log("replies"+replies)
        client.smembers(string, function(err, replies) {
        	// console.log("err"+err)
        	console.log("replies"+replies)
            callback(err, replies)
         })
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

function cleancompare(ar)
// function compare(X,Y)
{

// var elim = []
var elim = ['is', 'are', 'be', 'will', 'let', 'i', 'I', 'no', 'not', 'to', 'you', 'we', 'for',
'i\'ll', 'so', 'the', 'can\'t', 'let\'s', 'only', 'on']

var X = ar[0]
var Y = ar[1]

var compX = cleanposoutput(cleanpos(X))
var compY = cleanposoutput(cleanpos(Y))

if (compY.length == 0) 
	compY = Y.split(" ")

if (compX.length == 0)
	compX = X.split(" ")

compX = lemmatize(compX)
compY = lemmatize(compY)

var compXX = compX
var compYY = compY

_.each(elim, function(value, key, list){ 
	compXX = _.without(compXX,value)
	compYY = _.without(compYY,value)
}, this)

if (compYY.length == 0) 
	compYY = Y.split(" ")
	
if (compXX.length == 0) 
	compXX = X.split(" ")
	
compXX = _.compact(compXX)
compYY = _.compact(compYY)

return [X, Y, compXX, compYY, distance(compXX, compYY)]

}

module.exports = {
	distance:distance,
	compare:compare,
	onlycontent: onlycontent,
	onepairfetch:onepairfetch,
	quickfetch:quickfetch,
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
	cleancompare:cleancompare,
	cleanlisteval:cleanlisteval,
	cleanthreelayer:cleanthreelayer
}