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
var truth_filename =  __dirname+ "/../../../truth_teller/sentence_to_truthteller.txt"

var limdu = require("limdu");
var ftrs = limdu.features;
var regexpNormalizer = ftrs.RegexpNormalizer(
    JSON.parse(fs.readFileSync(__dirname+'/../../knowledgeresources/BiuNormalizations.json')));


function trainandtest(train, test, seeds, mode, callback9)
{

/*
 mode
 0 regular
 1 sequence
*/
  var data = []

  var test_turns = test

  _.each(test_turns, function(utterance, key, list){ 
    var sentence = utterance['input']
    test_turns[key]['input_original'] = sentence
    sentence = sentence.toLowerCase().trim()
    sentence = regexpNormalizer(sentence)
    test_turns[key]['input_normalized'] = sentence
    // test_turns[key]['polarity'] = truth.verbnegation(sentence.replace('without','no'), truth_filename)

    sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence, false)})['generated']
    test_turns[key]['input_modified'] = sentence
  }, this)

  // 15 conversations
  // 170 utterances

  var train_turns = train
  var stats = new PrecisionRecall()

  async.eachSeries(test_turns, function(turn, callback1){

      var out = utils.retrieveIntentsync(turn['input_modified'], seeds)
    // utils.retrieveIntent(turn['input_modified'], seeds, function(err, out){

      turn['out'] = out

      // regular mode
      if (mode == 0)
      {
        var labs = _.unique(_.map(out, function(num, key){ return Object.keys(num)[0] }))      
        var out = stats.addCasesHash(_.unique(utils.onlyIntents(turn['output'])), _.unique(labs))
        turn['eval'] = out
      }

      // sequence mode
      if (mode == 1)
      {
        
        // var sequence = _.map(out, function(num, key){ return [Object.keys(num)[0], num[Object.keys(num)[0]]['position'],num[Object.keys(num)[0]]['original seed'], num[Object.keys(num)[0]]['ppdb phrase'], num[Object.keys(num)[0]]['content of ppdb phrase']]  });
        var sequence = _.map(out, function(num, key){ return [num['intent'], num['position'], num['keyphrase'], num['ngram'], num['ppdb'], num['seed']] });
        sequence = bars.uniqueArray(sequence)
        turn['sequence_expected'] = utils.seqgold(turn)
        turn['sequence_actual'] = sequence
        var out = stats.addCasesHashSeq(utils.seqgold(turn), sequence,1)
        turn['eval'] = out
      }

      callback1()
    // })
  }, function(err){
      var output = {}
      output['data'] = test_turns
      output['stats'] = stats.retrieveStats()
      callback9(err, output)
  })
}


module.exports = {
  trainandtest: trainandtest
}
