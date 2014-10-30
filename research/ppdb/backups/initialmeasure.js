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

// keyph = keyph.slice(0,40)

var seeds = ['offer', 'suggest']

console.log("seeds: "+seeds)
console.log(keyph.length)

async.mapSeries(keyph, utils.onepairfetch, function(err, resultArr) {
    var ind = 0
    async.series([
    function(callback){
        async.eachSeries(resultArr, function(pairlist, callbackDone){ 
        console.log(ind)
        
        var preparelist = []

        _.each(seeds, function(seed, key, list){ 
            _.each(pairlist, function(value1, key1, list1){ 
                preparelist.push([value1,seed])
            }, this)
        }, this)

            async.mapSeries(preparelist, utils.compare, function(err, bestlist) {
                bestlist = _.sortBy(bestlist, function(num){ return num[4] });
                bestlist.reverse()

                if (bestlist.length != 0)
                {
                    outstats.push({'keyphrase': keyph[ind],
                            'the nearest seed': bestlist[0][0],
                            'keyphrase to compare': bestlist[0][2],
                            'seed to compare': bestlist[0][3],
                            'score': bestlist[0][4],
                            'keyphrase sentences': stats['Offer'][keyph[ind]].length,
                            'keyphrase influence': stats['Offer'][keyph[ind]].length/size
                            })
                }

                ind = ind + 1
                callbackDone();
            })
        }, 
        
        function (err) {
            callback(null, "ok")
        })
        },

    function(callback){

        outstats = _.sortBy(outstats,  function(num){ return num['score'] })
        outstats.reverse()

        var crossdist = _.map(outstats, function(num){
            num['score floored'] = Math.floor(num['score']*10)*10 
            return num });

        crossdist = _.groupBy(crossdist, function(num) {return num['score floored']})

        console.log(JSON.stringify(crossdist, null, 4))
        
        for (var col=100; col>=0; col -= 10) {
            var ind = 0
            var inf = 0
            _.each(outstats, function(value, key, list){ 
                if (value['score']*100 >= col)
                    {
                    ind = ind + 1
                    inf = inf + value['keyphrase influence']
                    }
            }, this)
            console.log(col/100 + " -- " +(ind/outstats.length*100).toFixed()+"%"+ " -- "+(inf*100).toFixed()+"%")
        }
        utils.closeredis()
    }
    ],
    function(err, results){
        });
    })


    // console.log(toretrieve)
    // process.exit(0)

    // value['X'] = onlycontent(value['X'])
    // comparedist("asd","asd")


    // console.log(value['X'])
    // process.exit(0)

    // var callback3=function(){

    //     console.log(fetched[0])
    //     process.exit(0)

    // }


    // var fetched = []
    // var afterAll = _.after(3,callback3) //afterAll's callback is a function which will be run after be called 10 times

    //     for (var col=0; col<=2; ++col) {

    //         ppdbfetcher(value['X'], col, function(returnValue) {
    //             fetched.push(returnValue)
    //             afterAll();
    //         })
    //     }

// }, this)
// _.each(seeds, function(seed, key, list){
//     _.each(subst(seed), function(subseed, key, list){ 
//         client.smembers(subseed, function (err, replies) {
//             if(!err){
//                 retrieved = retrieved.concat(replies)
//                 afterAll();
//             }
//         })
//     }, this) 
// }, this)


// console.log("ex")
// var seeds = ['I offer you', 'I suggest']
// var retrieved = []
// var calls = []

// var callback=function(){
//     console.log("ex")
//     console.log(retrieved.length)
//     retrieved = _.uniq(retrieved)
//     console.log(retrieved.length)
//     console.log(retrieved)

//     var TPlist = []
//     var TPlistret = []
//     var flag = 0
//     var TP = 0
//     var FP = 0
//     var rightpairs = []
//     var wrongpairs = []

//     _.each(retrieved, function(value, key, list){
//         var flag = 0
        
//         var comparison = value.replace("you","")
//         comparison = comparison.replace("we","")

//         _.each(Object.keys(stats['Offer']), function(gold, key, list){ 
//             if (natural.JaroWinklerDistance(comparison, gold)>Distance_threshold)
//                 {
//                     // if (!(gold in TPlist))
//                         // {
//                         // TP = TP + 1
//                         TPlist.push(gold)
//                         TPlistret.push(value)
//                         flag = 1
//                         // rightpairs.push([value,gold])
//                         // }
//                 }
//         }, this) 

//         if (flag == 0) 
//             {
//                 FP = FP + 1
//                 wrongpairs.push(value)
//             }
//     }, this)

//     var FN = Object.keys(stats['Offer']).length - _.unique(TPlist).length

//     TPlistret = _.unique(TPlistret)
//     TP = TPlistret.length
    
//     var Precision = TP/(TP+FP)
//     var Recall = TP/(TP+FN)
//     var F1 = 2*Precision*Recall/(Recall+Precision)

//     console.log("TP"+TP)
//     console.log("FP"+FP)
//     console.log("FN"+FN)
//     console.log("TP list")
//     console.log(TPlistret)
//     console.log("FP list")
//     console.log(wrongpairs)
//     console.log('Precision '+Precision)
//     console.log('Recall '+Recall)
//     console.log('F1 '+F1)
//     process.exit(0)
// }

// var afterAll = _.after(seednum(seeds),callback) //afterAll's callback is a function which will be run after be called 10 times

// _.each(seeds, function(seed, key, list){
//     _.each(subst(seed), function(subseed, key, list){ 
//         client.smembers(subseed, function (err, replies) {
//             if(!err){
//                 retrieved = retrieved.concat(replies)
//                 afterAll();
//             }
//         })
//     }, this) 
// }, this)

// client.quit();
