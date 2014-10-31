var _ = require('underscore')._; 
var fs = require('fs');
var natural = require('natural');
var utils = require('./utils');
var async = require('async');
var Fiber = require('fibers');

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


var f = Fiber(function() {
  var fiber = Fiber.current;

  utils.wordnetsynonyms(['offer'], function(err,actual){
    fiber.run(actual);
  })
  var actual = Fiber.yield();
  // console.log(actual)
  var results = utils.cleanlisteval(actual,expected)
  // console.log(utils.stat(results))
  console.log(results)
  console.log(utils.stat(results['stats']))
  utils.closeredis()
})

f.run()