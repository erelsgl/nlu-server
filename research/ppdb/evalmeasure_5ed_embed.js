/*

The idea here is to load a dataaset, get several dialogues as train for generating paraphrases.
Prove train with keyphrases. Fetch new paraphrases from PPDB and run eva

*/

var Fiber = require('fibers');


var _ = require('underscore')._; 
var fs = require('fs');
var natural = require('natural');
var utils = require('./utils');
var async = require('async');
var bars = require('../../utils/bars.js');
var partitions = require('limdu/utils/partitions');
var PrecisionRecall = require("limdu/utils/PrecisionRecall");
var partitions = require('limdu/utils/partitions');
var rules = require("../rule-based/rules.js")
var truth = require("../rule-based/truth_utils.js")
var truth_filename =  "../../../truth_teller/sentence_to_truthteller.txt"

var limdu = require("limdu");
var ftrs = limdu.features;
var regexpNormalizer = ftrs.RegexpNormalizer(
    JSON.parse(fs.readFileSync('../../knowledgeresources/BiuNormalizations.json')));


function ccc(hass)
{
  return hass
}

var outstats = []
// var keyphrases = JSON.parse(fs.readFileSync("../test_aggregate_keyphases/keyphases.08.2014.json"))
// var stats = utils.formkeyphrases(keyphrases)
// var keyph = _.without(Object.keys(stats['Offer']), "default intent")
// var size = _.reduce(stats['Offer'], function(memo, num){ return memo + num.length; }, 0);
// size = size - stats['Offer']["default intent"].length

var datasets = [
              'turkers_keyphrases_only_rule.json',
              // 'students_keyphrases_only_rule.json'
            ]

var data = []



function trainandtest(train, test, mode, callback)
{

/*
  mode = 'original'
  mode = 'ppdb'
*/
  if ((mode != 'ppdb') && (mode != 'original'))
  {
    console.log("incorrect mode")
    process.exit(0)
  }

  var data = []
  data = data.concat(train).concat(test)

  _.each(data, function(dialogue, dialoguekey, list){ 
    _.each(dialogue['turns'], function(utterance, utterancekey, list){ 
        if (utterance['status'] == 'active')
        {
          var sentence = data[dialoguekey]['turns'][utterancekey]['input']
          data[dialoguekey]['turns'][utterancekey]['input_original'] = sentence
          
          sentence = sentence.toLowerCase().trim()
          sentence = regexpNormalizer(sentence)
          data[dialoguekey]['turns'][utterancekey]['input_normalized'] = sentence
          data[dialoguekey]['turns'][utterancekey]['polarity'] = truth.verbnegation(sentence.replace('without','no'), truth_filename)

          sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
          data[dialoguekey]['turns'][utterancekey]['input'] = sentence


        }
    }, this)
  }, this)

  // 15 conversations
  // 170 utterances

  
  var testset = test
  var trainset = train

  if (trainset.length > testset.length)
    {
      console.log("incorrect size proportion")
      process.exit(0)
    }

  var train_turns = bars.extractturns(trainset)
  var test_turns = bars.extractturns(testset)

// [ { form: 'be', polarity: 'P' } ]

  console.log("fold "+fold)
  console.log("size of train " + trainset.length + " in utterances " + train_turns.length)
  console.log("size of test " + testset.length + " in utterances " + test_turns.length)

  // load only keyphrases from train
  var seeds = utils.loadseeds(train_turns)

  // create original seeds for baseline comparison
  // var seeds_origial = bars.clone(seeds)

  if (mode == 'original')
    {
      _.each(seeds, function(value, key, list){ 
        _.each(value, function(value1, key1, list){ 
          seeds[key][key1] = {}
          seeds[key][key1][value1] = [value1]
        }, this)
      }, this)
    }

  if (mode == 'ppdb')
    {
    _.each(seeds, function(intentkeys, intent, list){ 
      _.each(intentkeys, function(value1, key, list){ 
          utils.recursionredis([value1], [1], false, function(err,actual) {
            fiber.run(actual)
          })
          var list = Fiber.yield()
          seeds[intent][key] = {}
          seeds[intent][key][value1] = list
      }, this)
    }, this)
    }

  var stats = new PrecisionRecall()

  _.each(test_turns, function(turn, key, list){ 
    if (key % 50 == 0)
      console.log(key)

      utils.retrieveIntent(turn['input'], seedvalue, function(err, results){
        fiber.run(results)
      })

      var out = Fiber.yield()
      var labs = _.unique(_.map(out, function(num, key){ return Object.keys(num)[0] }))
      
      stats.addCasesLabels(_.unique(utils.onlyIntents(turn['output'])), _.unique(labs))
  }, this)

  var output = {}
  var output['stats'] = stats.retrieveStats()
  return output

}
