// TP - the number of retrieved paraphrases that cover at least one phrase in the gold standard data
// FP - the number of retrieved paraphases that doesn't cover any record
// FN - the number of records that was left uncovered in gold standard data

var _ = require('underscore')._; 
var fs = require('fs');
var natural = require('natural');
var utils = require('./utils');
var async = require('async');
// var WordPOS = require('wordpos')

// var Lemmer = require('../../node-lemmer').Lemmer;

// var redis = require("redis")

// var client = redis.createClient();
// var client = redis.createClient(6369, "127.0.0.1", {})

// var pos = require('pos');

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




// var onlycontent = function(str)
// {
//     var out = []
//     var content = ['NN','VBN','VBP','JJ', 'VB','VBD','RB', 'NNS', 'VBG', 'VBZ', 'JJS']
//     var omit = ['i', 'be', 'so', 'is', 'are']
//     // console.log(str)

//     var words = new pos.Lexer().lex(str);
//     var taggedWords = new pos.Tagger().tag(words);

//     // console.log(taggedWords)

//     _.each(taggedWords, function(value, key, list){ 
//             if ((content.indexOf(value[1]) != -1) && (omit.indexOf(value[0]) == -1))
//                 out.push(value[0])
//     }, this)

//     return out
// }

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


// var distance = function (X,Y)
// {
//     if ((X.length == 0) || (Y.length == 0))
//         return 0
//     return natural.DiceCoefficient(X.join(" "),Y.join(" "))    
// }


// var compare = function (X,Y)
// {
//     var compX = utils.onlycontent(X)
//     var compY = utils.onlycontent(Y)

//     if (utils.onlycontent(Y).length == 0) 
//        compY = Y.split(" ")
    
//     if (utils.onlycontent(X).length == 0)
//         compX = X.split(" ")

//     return [X, Y, compX, compY, distance(compX, compY)]
// }


// console.log(utils.onlycontent("I think"))
// console.log()
// process.exit(0)

var keyphrases = JSON.parse(fs.readFileSync("../test_aggregate_keyphases/keyphases.08.2014.json"))

var stats = utils.formkeyphrases(keyphrases)

var keyph = _.without(Object.keys(stats['Offer']), "default intent") 

keyph = keyph.slice(0,30)
// keyph = _.sample(keyph, 20)

// keyph = ['I can offer','I offer','can you give','you will start','there is','lets make it','how about','i will accept']

console.log(keyph)

var cross = crosslist(keyph)
var crossX = _.map(cross, function(num){ return num['X']; });

console.log(crossX.length)
console.log(crossX)

async.mapSeries(crossX, utils.threelayercross, function(err, resultArr) {

    var ind = 0
    async.series([
    function(callback){

     async.eachSeries(resultArr, function(pairlist, callbackDone){ 

        if (ind % 10==0) console.log(ind)
        var bestlist = []

        console.log("pairlist")
        console.log(pairlist)
        

        pairlist.push(cross[ind]['X'])

        var convertlist = _.map(pairlist, function(num){ return [num,cross[ind]['Y']] });

        console.log("to compare")
        console.log(convertlist)
        // bestlist.push(utils.compare(cross[key5]['X'], cross[key5]['Y']))
        // _.each(pairlist, function(value, key1, list){ 
           // bestlist.push(utils.compare(value, cross[key5]['Y']))
        // }, this) 
            async.mapSeries(convertlist, utils.compare, function(err, bestlist) {

                console.log(bestlist)

                bestlist = _.sortBy(bestlist, function(num){ return num[4] });

                bestlist.reverse()

                console.log("BEST")
                console.log(bestlist[0])

                if (bestlist.length != 0)
                {

                    cross[ind]['X best fitted from PPDB to Y'] = bestlist[0][0]
                    // cross[key5]['Y control poin'] = bestlist[0][1]
                    cross[ind]['X part to compare'] = bestlist[0][2]
                    cross[ind]['Y part to compare'] = bestlist[0][3]
                    cross[ind]['score'] = bestlist[0][4]
                    
                }

                console.log("the record")
                console.log(cross[ind])

                ind = ind + 1
                callbackDone();
            })
        }, 
        function (err) {
            callback(null, "ok")
        })
    },
    function(callback){

        // console.log(cross)
        // process.exit(0)
        cross = _.sortBy(cross,  function(num){ return num['score'] })

        cross.reverse()

        var crossdist = _.map(cross, function(num){
            num['score floored'] = Math.floor(num['score']*10)*10 
            return num });

        crossdist = _.groupBy(crossdist, function(num) {return num['score floored']})

        console.log(JSON.stringify(crossdist, null, 4))
        
        // _.each(crossdist, function(value, key, list){
        //     console.log(key) 
        //     console.log(value.length)
        //     console.log("----")
        // }, this)

        for (var col=100; col>=0; col -= 10) {
            var ind = 0
            _.each(cross, function(value, key, list){ 
                if (value['score']*100 >= col)
                    ind = ind + 1
            }, this)
            console.log(col/100 + " -- " +(ind/cross.length*100).toFixed()+"%")
        }

        utils.closeredis()
        
        callback(null, 'ok');
    }
    ],

    function(err, results){
        // console.log(results)
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
