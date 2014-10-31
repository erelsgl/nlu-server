// TP - the number of retrieved paraphrases that cover at least one phrase in the gold standard data
// FP - the number of retrieved paraphases that doesn't cover any record
// FN - the number of records that was left uncovered in gold standard data

var _ = require('underscore')._; 
var fs = require('fs');
var natural = require('natural');
var redis = require("redis")
var client = redis.createClient();
// var client = redis.createClient(6369, 132.70.6.156")
var client = redis.createClient(6369, "127.0.0.1", {})
// var async = require('async');


// client.select(1, function() {

    // client.smembers("offer", function (err, replies) {
            // if(!err){
                // console.log(replies)
                // console.log(err)
                // process.exit(0)
                // afterAll();
            // })


// });

// client.quit();

// console.log()
// process.exit(0)tr

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

var seednum = function (seeds)
{
    var ind = 0
    _.each(seeds, function(seed, key, list){
        ind = ind + subst(seed).length
    }, this)
    return ind
}

var Distance_threshold = 0.8

// console.log(natural.JaroWinklerDistance('you here','so lets make it'))
// process.exit(0)

var keyphrases = JSON.parse(fs.readFileSync("keyphases.08.2014.json"))

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



// console.log(Object.keys(stats['Offer']).length)
// process.exit(0)

var seeds = ['I offer you', 'I suggest']
var retrieved = []
var calls = []

var callback=function(){
    console.log("ex")
    console.log(retrieved.length)
    retrieved = _.uniq(retrieved)
    console.log(retrieved.length)
    console.log(retrieved)

    var TPlist = []
    var TPlistret = []
    var flag = 0
    var TP = 0
    var FP = 0
    var rightpairs = []
    var wrongpairs = []

    _.each(retrieved, function(value, key, list){
        var flag = 0
        
        var comparison = value.replace("you","")
        comparison = comparison.replace("we","")

        _.each(Object.keys(stats['Offer']), function(gold, key, list){ 
            if (natural.JaroWinklerDistance(comparison, gold)>Distance_threshold)
                {
                    // if (!(gold in TPlist))
                        // {
                        // TP = TP + 1
                        TPlist.push(gold)
                        TPlistret.push(value)
                        flag = 1
                        // rightpairs.push([value,gold])
                        // }
                }
        }, this) 

        if (flag == 0) 
            {
                FP = FP + 1
                wrongpairs.push(value)
            }
    }, this)

    var FN = Object.keys(stats['Offer']).length - _.unique(TPlist).length

    TPlistret = _.unique(TPlistret)
    TP = TPlistret.length
    
    var Precision = TP/(TP+FP)
    var Recall = TP/(TP+FN)
    var F1 = 2*Precision*Recall/(Recall+Precision)

    console.log("TP"+TP)
    console.log("FP"+FP)
    console.log("FN"+FN)
    console.log("TP list")
    console.log(TPlistret)
    console.log("FP list")
    console.log(wrongpairs)
    console.log('Precision '+Precision)
    console.log('Recall '+Recall)
    console.log('F1 '+F1)
    process.exit(0)
}

var afterAll = _.after(seednum(seeds),callback) //afterAll's callback is a function which will be run after be called 10 times

_.each(seeds, function(seed, key, list){
    _.each(subst(seed), function(subseed, key, list){ 
        client.smembers(subseed, function (err, replies) {
            if(!err){
                retrieved = retrieved.concat(replies)
                afterAll();
            }
        })
    }, this) 
}, this)

client.quit();

// console.log(natural.JaroWinklerDistance("I wont to offer you","offer"))
// console.log(stats)
// // client.smembers("more than", function (err, replies) {
// 		// console.log(replies)
//         // client.quit();
//     // });


