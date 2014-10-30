/*
Retieves Offer keyphrases from two dialogue datasets and 
perform cross comparison between them 
should be reorganized and simplified
*/

var _ = require('underscore')._; 
var fs = require('fs');
var natural = require('natural');
var utils = require('./utils');
var async = require('async');
var Fiber = require('fibers');


var datasets = [
              'turkers_keyphrases_only_rule.json',
              'students_keyphrases_only_rule.json'
            ]

var data = []
_.each(datasets, function(value, key, list){
        data = data.concat(JSON.parse(fs.readFileSync("../../datasets/Employer/Dialogue/"+value)))
}, this)

var keyphrases = []
keyphrases = utils.extractkeyphrases(data)
keyphrases = _.compact(_.unique(keyphrases))
keyphrases = _.sample(keyphrases, 40)

console.log("Keyphrases for Intent Offer")
console.log("size "+keyphrases.length)
console.log(keyphrases)

var output = []

var f = Fiber(function() {
  var fiber = Fiber.current;

    // outer loop for VALUE as keyphrase
    _.each(keyphrases, function(value, key, list){ 
        utils.recursionredis([value], 2, function(err, resp){
          fiber.run(resp)
        })
        
        // paraphases = value + paraphrases(value)
        var paraphases = Fiber.yield()
        
        // inner loop for SALIENT as keyphrase
        _.each(keyphrases, function(salient, key, list){ 

            // if they are not the same
            if (salient != value)
            {
                var comparisonlist = _.map(paraphases, function(phrase){ return [phrase,salient] });
    
                if (comparisonlist.length != 0)
                {
                  async.mapSeries(comparisonlist, utils.compare, function(err,resp){
                    fiber.run(resp)
                  })

                  var scoredlist = Fiber.yield();
                }
                else
                {
                  var scoredlist = []
                }
                
                var sorted  = _.sortBy(scoredlist, function(num){ return num[4] });
                sorted = sorted.reverse()

                if (sorted.length != 0)
                {
                    output.push({ 'X': value,
                                  'Y': salient,
                                  'X best fitted from PPDB to Y': sorted[0][0],
                                  'Y control poin' : sorted[0][1],
                                  'X part to compare' : sorted[0][2],
                                  'Y part to compare' : sorted[0][3],
                                  'score' : sorted[0][4]
                                })
                }
            }
        }, this)
    }, this)
        
        output = _.sortBy(output,  function(num){ return num['score'] })
        output.reverse()

        var crossdist = _.map(output, function(num){
                num['score floored'] = Math.floor(num['score']*10)*10 
                return num });

            crossdist = _.groupBy(crossdist, function(num) {return num['score floored']})

            console.log(JSON.stringify(crossdist, null, 4))

            for (var col=100; col>=0; col -= 10) {
                var ind = 0
                _.each(output, function(value, key, list){ 
                    if (value['score']*100 >= col)
                        ind = ind + 1
                }, this)
                console.log(col/100 + " -- " +(ind/output.length*100).toFixed()+"%")
            }

            utils.closeredis()
        

})
f.run()