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

_.each(datasets, function(value, key, list){
    data = JSON.parse(fs.readFileSync("../../../datasets/Employer/Dialogue/"+value))
}, this)

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


data = _.shuffle(data)
var stats = []

var f = Fiber(function() {
  var fiber = Fiber.current;

partitions.partitions(data, data.length/3, function(train, test, fold) {

  var testset = train
  var trainset = test

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

  stats.push([new PrecisionRecall(), new PrecisionRecall()])

  // load only keyphrases from train
  var seeds = utils.loadseeds(train_turns)

  // create original seeds for baseline comparison
  // var seeds_origial = bars.clone(seeds)

  // enhance seeds original
  // var expansion_original = 0
  // _.each(seeds_origial, function(value, key, list){ 
  //   _.each(value, function(value1, key1, list){ 
  //     seeds_origial[key][key1] = {}
  //     seeds_origial[key][key1][value1] = [value1]
  //     expansion_original += 1
  //   }, this)
  // }, this)

  // fetch ppdb for seeds
  console.log("ppdb seed fetching ...")

  // var expansion = 0
  // _.each(seeds, function(intentkeys, intent, list){ 
  //   _.each(intentkeys, function(value1, key, list){ 
  //       utils.recursionredis([value1], [1], false, function(err,actual) {
  //         fiber.run(actual)
  //       })
  //       var list = Fiber.yield()
  //       seeds[intent][key] = {}
  //       seeds[intent][key][value1] = list

  //       expansion += list.length
  //   }, this)
  // }, this)
  utils.enrichseeds(seeds,function(err, response){
    setTimeout(function() {
      fiber.run(response)
    }, 1000);  
  })

  var seeds_ppdb = Fiber.yield()
  var seeds_origial = utils.enrichseeds_original(seeds)

  // console.log(seeds_ppdb)
  // console.log(seeds_origial)
  // process.exit(0)
  // console.log("ppdb seed expansion "+ expansion)
  // console.log("ppdb seed original expansion "+ expansion_original)

  _.each([seeds_ppdb, seeds_origial], function(seedvalue, seedkey, seedlist){ 

    console.log("Evaluation "+seedkey + " ...")

    _.each(test_turns, function(turn, key, list){ 

        if (key % 50 == 0)
          console.log(key)

        utils.retrieveIntent(turn['input'], seedvalue, function(err, results){
          setTimeout(function() {
             fiber.run(results)
          }, 100);

        })

        var out = Fiber.yield()
        var labs = _.unique(_.map(out, function(num, key){ return Object.keys(num)[0] }))
        
        stats[fold][seedkey].addCasesLabels(_.unique(utils.onlyIntents(turn['output'])), _.unique(labs))
        
        test_turns[key][seedkey] = {}
        test_turns[key][seedkey]['stats'] = stats[fold][seedkey].addCasesHash(_.unique(utils.onlyIntents(turn['output'])), _.unique(labs),1)
        test_turns[key][seedkey]['out'] = out
    
    }, this)
  }, this)

console.log("1 - ppdb 2 - original")
console.log("----------------------FOLD " + fold + "--------------------")

console.log("----differences between two methods----")

_.each(test_turns, function(value, key, list){ 
  if (_.isEqual(value['0']['stats'], value['1']['stats']) == false)
    console.log(JSON.stringify(value, null, 4))
}, this)

console.log("----what are the utterances that benefit from ppdb----")

_.each(test_turns, function(value, key, list){ 
  if (value['0']['stats']['TP'].length > value['1']['stats']['TP'].length)
    console.log(JSON.stringify(value['0']['out'], null, 4))
}, this)

})

_.each(stats, function(fold, keyfold, list){ 
  _.each(fold, function(method, keymethod, list){ 
    stats[keyfold][keymethod].calculateStatsNoReturn()
    stats[keyfold][keymethod].retrieveLabels()
  }, this)
}, this)

// console.log(JSON.stringify(utils.calculateparam(stats, ['macroF1', 'macroRecall', 'macroPrecision','Precision', 'Recall', 'F1']), null, 4))
console.log(JSON.stringify(utils.calculateparam(stats, ['Precision', 'Recall', 'F1']), null, 4))
console.log("----------------------")
console.log(JSON.stringify(utils.calculateparam(stats, ['Offer', 'Accept', 'Reject','Greet','Query']), null, 4))
process.exit(0)

})
f.run();
