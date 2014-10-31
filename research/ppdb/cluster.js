/*
This is a try to create a clustering of keyphrases
Currently not in developing
*/

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


var X = "offer"
var Y = "how about"
var MAX = 10
var stack = []
stack.push(X)

var history = []

var f = Fiber(function() {
    var fiber = Fiber.current

    utils.cleandb(function(){
        // fiber.run()
    })
    // var w = Fiber.yield()


    _(MAX).times(function(n){
        console.log(n)
        console.log(stack.length)
        async.mapSeries(stack, utils.cleanredis, function(err,resp){
            history = history.concat(stack)            
            fiber.run(_.flatten(resp))
        })
        stack = Fiber.yield()
        stack = _.without(stack, history)
        if (history.indexOf(Y) != -1)
            {
                console.log(n)
                console.log()
                process.exit(0)
            }
    })
})

f.run()