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

var tocomp = utils.crosslist(keyph)


var f = Fiber(function() {
  var fiber = Fiber.current;

  async.mapSeries(tocomp, utils.compare, function(err,results){
   fiber.run(results);
  })

  var results = Fiber.yield();

  _.each(results, function(value, key, list){ 
  	if (value[4] == 1)
  		keyph = _.without(keyph, value[1])
  }, this)

  // console.log(keyph.length)
  // console.log(keyph)

	var seeds = ['offer']
	var expected = keyph 
	var expectedcopy = keyph
	var TP = 0
	var FP = 0
	var FN = 0

	console.log("Gold Standard Keyphrases for Intent 'Offer' after Filtering")
	console.log("size "+expected.length)
	console.log(expected)
	console.log()

// var f = Fiber(function() {
  // var fiber = Fiber.current;

  utils.recursionredis(seeds, 1, function(err,actual) {
    fiber.run(actual);
  })

  var actual = Fiber.yield();
  console.log("Generated Keyphrases for seed 'offer'")
  console.log("size "+actual.length)
  console.log(actual)
  console.log()

  var stats = utils.cleanlisteval(actual, expected)
  console.log(JSON.stringify(stats, null, 4))
  console.log(JSON.stringify(utils.stat(stats['stats']), null, 4))
  utils.closeredis()

})
f.run();

