/*

The idea here is to load a dataaset, get several dialogues as train for generating paraphrases.
Extract seeds from train (think about an approach). Fetch new paraphrases from PPDB and run eva

*/
var Hierarchy = require('../../Hierarchy');
var _ = require('underscore')._; 
var fs = require('fs');
var natural = require('natural');
var utils = require('./utils');
var async = require('async');
var bars = require('../../utils/bars.js');
var partitions = require('limdu/utils/partitions');
var rules = require('../rule-based/rules.js');
var limdu = require("limdu");
var ftrs = limdu.features
var splitJson = Hierarchy.splitJson
var PrecisionRecall = require("limdu/utils/PrecisionRecall");
var regexpNormalizer = ftrs.RegexpNormalizer(
    JSON.parse(fs.readFileSync(__dirname+'/../../knowledgeresources/BiuNormalizations.json')));

function normalizer(sentence) {
  sentence = sentence.toLowerCase().trim();
  return regexpNormalizer(sentence);
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
    data = data.concat(JSON.parse(fs.readFileSync("../../../datasets/Employer/Dialogue/"+value)))
}, this)


var turns = bars.extractturns(data)

// _.each(data, function(dialogue, key, list){ 
_.each(turns, function(turn, key1, list1){ 
  if ('intent_keyphrases_rule' in turn)
    {
      console.log(turn['input'])

      turn['input'] = normalizer(turn['input'])
      
      console.log(turn['input'])

      var sentence = rules.generatesentence({'input':turn['input'], 'found': rules.findData(turn['input'])})['generated']

      console.log(sentence)
      console.log(turn['intent_keyphrases_rule'])
      console.log("----------------------------")
    }
}, this)
// }, this)

// sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']


// data = data.concat(JSON.parse(fs.readFileSync("../../../datasets/DatasetDraft/dial_usa_rule.json")))



