// TP - the number of retrieved paraphrases that cover at least one phrase in the gold standard data
// FP - the number of retrieved paraphases that doesn't cover any record
// FN - the number of records that was left uncovered in gold standard data

var _ = require('underscore')._; 
var fs = require('fs');
var natural = require('natural');
var utils = require('./utils');
var Fiber = require('fibers');
var async = require('async');

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

var keyph = ['offer','accept','reject','insist','query','greet','quit']
var cross = crosslist(keyph)
var crossX = _.map(cross, function(num){ return num['X']; });

var f = Fiber(function() {
    
    var fiber = Fiber.current;

    async.mapSeries(crossX, utils.cleanredis, function(err, resp) {
        fiber.run(resp)
    })

    var resultArr = Fiber.yield()

    _.each(resultArr, function(pairlist, key, list){ 

        pairlist.push(cross[key]['X'])

        var convertlist = _.map(pairlist, function(num){ return [num,cross[key]['Y']] });

        async.mapSeries(convertlist, utils.compare, function(err, resp) {
            fiber.run(resp)
        })

        var bestlist = Fiber.yield();
        bestlist = _.sortBy(bestlist, function(num){ return num[4] });
        bestlist.reverse()

        if (bestlist.length != 0)
        {

            cross[key]['X best fitted from PPDB to Y'] = bestlist[0][0]
            // cross[key5]['Y control poin'] = bestlist[0][1]
            cross[key]['X part to compare'] = bestlist[0][2]
            cross[key]['Y part to compare'] = bestlist[0][3]
            cross[key]['score'] = bestlist[0][4]            
        }
    })
        
    cross = _.sortBy(cross,  function(num){ return num['score'] })
    cross.reverse()
    console.log(JSON.stringify(cross, null, 4))
    utils.closeredis()
})

f.run()