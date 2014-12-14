/*

The idea here is to load a dataaset, get several dialogues as train for generating paraphrases.
Prove train with keyphrases. Fetch new paraphrases from PPDB and run eva

*/

var fs = require('fs');
var _ = require('underscore')._; 
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

function trainandtest(train, test, seeds, callback)
{

  var data = []

  _.each(test, function(utterance, key, list){ 
    var sentence = utterance['input']
    test[key]['input_original'] = sentence
    
    sentence = sentence.toLowerCase().trim()
    sentence = regexpNormalizer(sentence)
    test[key]['input_normalized'] = sentence
    test[key]['polarity'] = truth.verbnegation(sentence.replace('without','no'), truth_filename)

    sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
    test[key]['input'] = sentence
  }, this)


    // 15 conversations
  // 170 utterances

  var train_turns = train
  var test_turns = test

// [ { form: 'be', polarity: 'P' } ]





  // load only keyphrases from train
  

  var stats = new PrecisionRecall()

  async.eachSeries(test_turns, function(turn, callback1){
  // _.each(test_turns, function(turn, key, list){ 
    // if (key % 50 == 0)
      // console.log(key)

    utils.retrieveIntent(turn['input'], seeds, function(err, out){

      var labs = _.unique(_.map(out, function(num, key){ return Object.keys(num)[0] }))      
      stats.addCasesLabels(_.unique(utils.onlyIntents(turn['output'])), _.unique(labs))
      callback1()

    })
  })
  

  var output = {}
  output['stats'] = stats.retrieveStats()
  return output
}


module.exports = {
  trainandtest: trainandtest
}
