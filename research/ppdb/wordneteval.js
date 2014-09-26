// TP - the number of retrieved paraphrases that cover at least one phrase in the gold standard data
// FP - the number of retrieved paraphases that doesn't cover any record
// FN - the number of records that was left uncovered in gold standard data

var _ = require('underscore')._; 
var fs = require('fs');
var natural = require('natural');
var utils = require('./utils');
var async = require('async');

// create cross product from an array
var crosslist = function (list)
{

    var crossl = []

    for (i = 0; i < list.length; i++) { 
        for (j = i + 1; j < list.length; j++) { 
            crossl.push({'X':list[i],
                         'Y':list[j]
                        })
        }    
    }
    return crossl
}


// no cleaning before unisg ppdb, but might be useful to use substring to feath 
// in order to improve recall
// mayeb it's usefull to use 
// *the entire phrase 
// *separated lemmatized content words

// lemmatizing only when comparing distance (optionally)
// very carefull comparison
// -- when y has content words - compare only content words - lemmatized


// retrieve all possible substring 
// INPUT: [ '1234567' ]
// OUTPUT: [ '12',
  // '12 34',
  // '12 34 56',
  // '12 34 56 78',
  // '34',
  // '34 56',
  // '34 56 78',
  // '56',
  // '56 78',
  // '78' ]

var subst = function (str) {
	var subst = []
	var str = str.split(" ")
	for (var start=0; start<=str.length; ++start) {
		for (var end=start+1; end<=str.length; ++end) {
				subst.push(str.slice(start,end).join(" "));
  };
}
return subst
}

// get the list of seeds and calculate the number of substrings
// INPUT ['11 22','22 33']
// OUTPUT 6

var seednum = function (seeds)
{
    var ind = 0
    _.each(seeds, function(seed, key, list){
        ind = ind + subst(seed).length
    }, this)
    return ind
}

var outstats = []
var keyphrases = JSON.parse(fs.readFileSync("../test_aggregate_keyphases/keyphases.08.2014.json"))
var stats = utils.formkeyphrases(keyphrases)
var keyph = _.without(Object.keys(stats['Offer']), "default intent")
var size = _.reduce(stats['Offer'], function(memo, num){ return memo + num.length; }, 0);
size = size - stats['Offer']["default intent"].length

var seeds = ['offer']
var expected = keyph 
var expectedcopy = keyph
var TP = 0
var FP = 0
var FN = 0

// utils.wordnetsynonyms(['offer','provide'], function(err,results){
  // console.log(results)
// })

utils.wordnetsynonyms(['offer'], function(err,actual){
  utils.listeval(actual,expected, function(err, result)
  {
    console.log(utils.stat(result))
    utils.closeredis()
  })
// utils.threelayer(seeds, function(err,actual) {
  // async.series([
  //   function(callback){
  //     async.eachSeries(actual, function(actkey, callbackact){
  //       // console.log(actkey)
  //       var found = false
  //       async.series([
  //         function(callback){
  //           async.eachSeries(expected, function(expkey, callbackexp){
  //             // console.log("-"+expkey)
  //             utils.compare([actkey,expkey], function(err, res){
  //               // console.log("@ "+actkey+" "+expkey)
  //               // console.log(res)
  //               if (res[4] == 1)
  //                 expectedcopy = _.without(expectedcopy,expkey)

  //               if ((res[4] == 1) && (found == false))
  //                 {
  //                 TP = TP + 1
  //                 found = true
  //                 }
  //             callbackexp()
  //             })
  //           }, function (err) {
  //               callback(null, "ok")
  //             })
  //         },
  //         function(callback){

  //           if (found == false) FP = FP + 1
  //           callbackact()
  //         }])
  //     }, function (err) {
  //               callback(null, "ok")
  //             })
  //   },
  //   function(callback){
  //     FN = expectedcopy.length
  //     console.log(TP)      
  //     console.log(FP)      
  //     console.log(FN)
  //     var Precision = TP/(TP+FP)
  //     var Recall = TP/(TP+FN)
  //     var F1 = 2*Precision*Recall/(Precision+Recall)
  //     console.log("Precision="+Precision)
  //     console.log("Recall="+Recall)
  //     console.log("F1="+F1)
  //     utils.closeredis()
  //   }])
})

