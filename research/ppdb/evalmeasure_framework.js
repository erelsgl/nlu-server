/*

The idea here is to load a dataaset, get several dialogues as train for generating paraphrases.
Prove train with keyphrases. Fetch new paraphrases from PPDB and run eva

*/

var fs = require('fs');
var _ = require('underscore')._; 
var natural = require('natural');
var utils = require('./utils');
var PrecisionRecall = require("limdu/utils/PrecisionRecall");
var rules = require("../rule-based/rules.js")
var truth = require("../rule-based/truth_utils.js")
var truth_filename =  __dirname+ "/../../../truth_teller/sentence_to_truthteller.txt"
var modes = require("./modes.js")
var Hierarchy = require('../../Hierarchy');

var limdu = require("limdu");
var ftrs = limdu.features;
var regexpNormalizer = ftrs.RegexpNormalizer(
    JSON.parse(fs.readFileSync(__dirname+'/../../knowledgeresources/BiuNormalizations.json')));

function normaliz(dataset)
{
  var output = dataset
  
  _.each(output, function(utterance, key, list){ 
    var sentence = utterance['input']
    output[key]['input_original'] = sentence
    sentence = sentence.toLowerCase().trim()
    sentence = regexpNormalizer(sentence)
    output[key]['input_normalized'] = sentence
    sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence, false)})['generated']
    output[key]['input_modified'] = sentence
    
    output[key]['output'] = Hierarchy.splitPartEquallyIntent(utterance['output'])

  }, this)

  return output
}

function trainandtest(train, test, modes)
{

  var data = []

  var test_turns = normaliz(test)
  var train_turns = normaliz(train)
  
  var stats = new PrecisionRecall()

  // async.eachSeries(test_turns, function(turn, callback1){
  _.each(test_turns, function(test, key, list){
    
    var classes = []
    var explanation = []
    
    _.each(modes, function(mode, key, list){ 
      _.each(train_turns, function(train, key, list){ 
        _.each(train['intent_absolute'], function(keyphrase, intent, list){ 

          if (mode(test['input_normalized'], keyphrase))
            {
              classes.push(intent)
              explanation.push({  'train': train,
                                  'class': intent,
                                  'mode': mode.name})
            }

          }, this)

       }, this) 
    }, this)
  
    test_turns[key]['classified'] = _.unique(classes)
    test_turns[key]['results'] = stats.addCasesHash(test['output'], _.unique(classes), true)    
    test_turns[key]['explanation'] = explanation

  }, this)
  
  

  // console.log("calc retrieveStats")
  var output = []
  output.push({
    'data': test_turns,
    'stats': stats.retrieveStats()
  })
  // console.log("end calc retrieveStats")

  return output


  // }, function(err){
  //     var output = {}
  //     output['data'] = test_turns
  //     output['stats'] = stats.retrieveStats()
  //     callback9(err, output)
  // })
}


module.exports = {
  trainandtest: trainandtest
}
