// Here is a advanced methods that were disccused with Ido
// ? get full statistics for 2 fiels with statistics for keyphrases
// ? consider to add keyphases to each utterance
// 

// - load dataset
// - omit all phrases that don't occur in dataset
// - on phrases that left do evaluation

var _ = require('underscore')._; 
var fs = require('fs');
var natural = require('natural');
var utils = require('./utils');
var async = require('async');
var Fiber = require('fibers');
var bars = require('../../utils/bars.js');

var outstats = []
// var keyphrases = JSON.parse(fs.readFileSync("../test_aggregate_keyphases/keyphases.08.2014.json"))
// var stats = utils.formkeyphrases(keyphrases)
// var keyph = _.without(Object.keys(stats['Offer']), "default intent")
// var size = _.reduce(stats['Offer'], function(memo, num){ return memo + num.length; }, 0);
// size = size - stats['Offer']["default intent"].length

var datasets = [
              'turkers_keyphrases_gold_rule.json',
              'students_keyphrases_gold_rule.json'
            ]

var data = []
_.each(datasets, function(value, key, list){
        data = data.concat(JSON.parse(fs.readFileSync("../../datasets/Employer/Dialogue/"+value)))
}, this)

// intent_keyphrases_gold
// intent_keyphrases_rule

var turns = bars.extractturns(data)

// collect only offer keyphrases
var keyph = []
_.each(turns, function(value, key, list){ 
  if ('intent_keyphrases_rule' in value)
    if ('Offer' in value['intent_keyphrases_rule'])
      {
        var phrase = value['intent_keyphrases_rule']['Offer']
        // phrase = phrase.replace("<ATTRIBUTE>","")
        // phrase = phrase.replace("<VALUE>","")
        if ((phrase != 'DEFAULT INTENT') && (phrase != '') &&
            (phrase.indexOf("<VALUE>") == -1) && (phrase.indexOf("<ATTRIBUTE>") == -1))
          keyph.push(phrase)
      }
}, this)

keyph = _.compact(_.unique(keyph))

// var tocomp = utils.crosslist(keyph)

// filtering the gold standard keyphrases that are equal according to the comparison scheme
var f = Fiber(function() {
  var fiber = Fiber.current;

  // async.mapSeries(tocomp, utils.compare, function(err,results){
   // fiber.run(results);
  // })

  // var results = Fiber.yield();

  // _.each(results, function(value, key, list){ 
  	// if (value[4] == 1)
  		// keyph = _.without(keyph, value[1])
  // }, this)


  // keyph is the gold standard list of keyphrases

	var seeds = ['offer']
	var expected = keyph 
	var expectedcopy = keyph
	var TP = 0
	var FP = 0
	var FN = 0

	// console.log("Gold Standard Keyphrases for Intent 'Offer' after Filtering")
	// console.log("size "+expected.length)
	// console.log(expected)
	// console.log()

// var f = Fiber(function() {
  // var fiber = Fiber.current;

  // retrieve all generated paraphases to the seeds
  utils.recursionredis(seeds, 1, function(err,actual) {
    fiber.run(actual);
  })

  var actuals = Fiber.yield()
  
  console.log("size of actuals "+actuals.length)
  console.log(actuals)
  
  // return only paraphrases that appear in the dataset 
  var inputs = _.pluck(turns, 'input') 

  console.log("size of inputs to compare "+inputs.length)

  utils.checkinclusion(actuals, inputs, function(err, actualsindata){
    fiber.run(actualsindata)
  })

  var actualsindata = Fiber.yield()

  console.log(actualsindata)
  process.exit(0)
  
  console.log("size of actuals in data "+actualsindata.length)   
  console.log(actualsindata)

  var stats = utils.cleanlisteval(actualsindata, expected)
  console.log(JSON.stringify(stats, null, 4))
  console.log(JSON.stringify(utils.stat(stats['stats']), null, 4))
  utils.closeredis()

})
f.run();

