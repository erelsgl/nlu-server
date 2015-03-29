/*

The idea here is to load a dataaset, get several dialogues as train for generating paraphrases.
Prove train with keyphrases. Fetch new paraphrases from PPDB and run eva

*/

var fs = require('fs');
var _ = require('underscore')._; 
var natural = require('natural');
var PrecisionRecall = require("limdu/utils/PrecisionRecall");
var rules = require("../rule-based/rules.js")
var truth = require("../rule-based/truth_utils.js")
var truth_filename =  __dirname+ "/../../../truth_teller/sentence_to_truthteller.txt"
var modess = require("./modes.js")
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

  var keyphrases = {}
  _.each(train_turns, function(turn, key, list){ 
    _.each(turn['intent_absolute'], function(value, key, list){ 
      if (!(key in keyphrases))
        keyphrases[key] = []

      keyphrases[key].push(value)
    }, this)
  }, this)
  
  var stats = new PrecisionRecall()

  console.log("Test length "+ test_turns.length)
  console.log("Train length "+ train_turns.length)
  // async.eachSeries(test_turns, function(turn, callback1){
  _.each(test_turns, function(test, key, list){

    console.log(test)
    console.log("Test number "+ key)
    
    var classes = []
    var explanation = []
    var test1 = {
                 'original': test['input_original'],
                 'filtered':test['input_normalized'],
                 'filtered':test['input_modified'],
                    }
    
    _.each(modes, function(mode, key, list){ 
      if (classes.length == 0)
      _.each(train_turns, function(train, key, list){ 
        console.log("Train number "+ key)
        _.each(train['intent_absolute'], function(keyphrase, intent, list){ 

          var train1 = {
                      'original': train['input_original'],
                     'filtered':train['input_normalized'],
                     'modified':train['input_modified'],
                     'keyphrase':[keyphrase],
                     'intent': intent
                    }

          var results = mode(test1, train1)
          console.log(JSON.stringify(results, null, 4))
          if (results['classes'].length > 0)
            if (modess.permit(results, test))
            {
          
              classes = classes.concat(results['classes'])

              if (results['classes'].length > 0)
              {
              results['explanation']['reason'] = results['reason']
              results['explanation']['turn'] = train
              results['explanation']['classes'] = results['classes']
              explanation.push(results['explanation'])
              }
            }

          }, this)
       }, this) 
    }, this)

    if (classes.length == 0)
      if (modess.isOK(test1))
        classes.push('Accept')

    if (classes.length == 0)
      if (modess.isNO(test1))
        classes.push('Reject')

    if (classes.length == 0)
      if (modess.onlyOffer(test))
        classes.push('Offer')

    test_turns[key]['classified'] = _.unique(classes)
    test_turns[key]['results'] = stats.addCasesHash(test['output'], _.unique(classes), true)    
    stats.addCasesLabels(test['output'], _.unique(classes), true)    
    
    test_turns[key]['explanation'] = explanation

  }, this)
  
  // console.log("calc retrieveStats")
  var output = []
  output.push({
    'data': test_turns,
    'stats': stats.retrieveStats()
  })
  
  console.log(JSON.stringify(keyphrases, null, 4))

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
