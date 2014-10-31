var _ = require('underscore')._; 
var fs = require('fs');
var natural = require('natural');
var utils = require('./utils');
var async = require('async');
var Fiber = require('fibers');

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

var keyphrases = JSON.parse(fs.readFileSync("../test_aggregate_keyphases/keyphases.08.2014.json"))

var stats = utils.formkeyphrases(keyphrases)

var keyph = _.without(Object.keys(stats['Offer']), "default intent") 

keyph = keyph.slice(0,30)
// keyph = _.sample(keyph, 20)
// keyph = ['I can offer','I offer','can you give','you will start','there is','lets make it','how about','i will accept']

console.log("Keyphrases for Intent Offer")
console.log("size "+keyph.length)
console.log(keyph)
console.log()

var cross = crosslist(keyph)
var crossX = _.map(cross, function(num){ return num['X']; });

var output = []

var f = Fiber(function() {
  var fiber = Fiber.current;
    _.each(keyph, function(value, key, list){ 
        utils.recursionredis([value], 2, function(err, resp){
          fiber.run(resp)
        })
        // var paraphases = []
        // paraphases.push(value)
        var paraphases = Fiber.yield()
        _.each(keyph, function(salient, key, list){ 

            if (salient != value)
            {
                var comparisonlist = _.map(paraphases, function(phrase){ return [phrase,salient] });
                
                // console.log('SIZE'+comparisonlist.length)
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
                // var scoredlist = _.map(comparisonlist, utils.compare)

                var sorted  = _.sortBy(scoredlist, function(num){ return num[4] });
                // console.log(JSON.stringify(sorted, null, 4))

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
                // console.log(output.length)
            }
        }, this)
    }, this)
        
        output = _.sortBy(output,  function(num){ return num['score'] })

        output.reverse()

        // console.log(output)

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