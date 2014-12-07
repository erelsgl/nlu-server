/*

The idea here is to load a dataaset, get several dialogues as train for generating paraphrases.
Extract seeds from train (think about an approach). Fetch new paraphrases from PPDB and run eva

*/

var Fiber = require('fibers');

var f = Fiber(function() {
  var fiber = Fiber.current;

var _ = require('underscore')._; 
var fs = require('fs');
var natural = require('natural');
var utils = require('./utils');
var async = require('async');
var bars = require('../../utils/bars.js');
var partitions = require('limdu/utils/partitions');
var PrecisionRecall = require("limdu/utils/PrecisionRecall");
var truth = require("../rule-based/truth_utils.js")
var truth_filename =  "../../truth_teller/sentence_to_truthteller.txt"
var limdu = require("limdu");
var ftrs = limdu.features;
var rules = require("../rule-based/rules.js")

TfIdf = natural.TfIdf
tfidf = new TfIdf()

var tokenizer = new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9%'$+-]+/});

function cleanup(sentence)
{
  console.log(sentence)
  sentence = sentence.replace(/<VALUE>/g, "")
  sentence = sentence.replace(/<ATTRIBUTE>/g, "")
  sentence = sentence.replace(/\^/g, "")
  sentence = sentence.replace(/\./g, "")
  sentence = sentence.replace(/\!/g, "")
  sentence = sentence.replace(/\$/g, "")
  sentence = sentence.replace(/ +(?= )/g,'')
  sentence = sentence.toLowerCase()
  console.log("\""+sentence+"\"")
  if ((sentence == "") || (sentence == " "))
    sentence = false
  console.log(sentence)

return sentence
}

function getfeatures(sentence)
{
  var features = {}
  console.log("\""+sentence+"\"")
  var words = tokenizer.tokenize(sentence);
  var feature = natural.NGrams.ngrams(words, 1).concat(natural.NGrams.ngrams(words, 2, '[start]', '[end]')).concat(natural.NGrams.ngrams(words, 3, '[start]', '[end]'))
  _.each(feature, function(feat, key, list){
     features[feat.join(" ")] = 1
  }, this)
  return features;
}

var regexpNormalizer = ftrs.RegexpNormalizer(
    JSON.parse(fs.readFileSync(__dirname+'/../../knowledgeresources/BiuNormalizations.json')));

var outstats = []
// var keyphrases = JSON.parse(fs.readFileSync("../test_aggregate_keyphases/keyphases.08.2014.json"))
// var stats = utils.formkeyphrases(keyphrases)
// var keyph = _.without(Object.keys(stats['Offer']), "default intent")
// var size = _.reduce(stats['Offer'], function(memo, num){ return memo + num.length; }, 0);
// size = size - stats['Offer']["default intent"].length

var datasets = [
              'turkers_keyphrases_only_rule.json'
              // 'students_keyphrases_only_rule.json'
            ]

var data = []
  
/*_.each(datasets, function(value, key, list){
    data = data.concat(JSON.parse(fs.readFileSync("../../../datasets/Employer/Dialogue/"+value)))
}, this)
*/

data = JSON.parse(fs.readFileSync("../../../datasets/DatasetDraft/dial_usa_rule.json"))

// data = data.concat(JSON.parse(fs.readFileSync("../../../datasets/DatasetDraft/dial_usa_rule.json")))

var dataset = partitions.partition(data, 1, Math.round(data.length*0.8))

// console.log(dataset['train'].length)
// console.log(dataset['test'].length)

// Mark train dialogues
// var train_turns = bars.extractturns(dataset['train'])

// console.log(train_turns.length)

_.each(dataset['train'], function(dialogue, key, list1){ 
  _.each(dialogue['turns'], function(turn, key2, list2){ 
    // _.each(train_turns, function(turn1, key3, list3){ 
      // /data[key]['turns'][key2]['separation'] = 'train'
      turn['separation'] = 'train'
    // }, this)
  }, this)
}, this)



var turns = bars.extractturns(data)

// Normalize input, extract features if input allows
_.each(turns, function(turn, key, list){ 
  turns[key]['input_original'] = turn['input']
  var sentence = regexpNormalizer(turn['input'].toLowerCase().trim())
  sentence = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
  sentence = cleanup(sentence)
  turns[key]['input'] = sentence

  if ((sentence != false) && (sentence != "false"))
  {
    var features = getfeatures(turns[key]['input'])
    turns[key]['features'] = features
    tfidf.addDocument(features);
  }
}, this)

var turns = _.filter(turns, function(num){ return ('features' in num) })

// Update feature value for training set
_.each(turns, function(turn, key, list){ 
  if ('separation' in turn)
  {
    _.each(turn['features'], function(value1, key1, list){
      turns[key]['features'][key1] = value1 * tfidf.idf(key1)
    }, this)
  }
}, this)

var seeds = {}

// Fill up seeds with features from train
_.each(turns, function(turn, key, list){ 
  if ('separation' in turn)
  {
    _.each(turn['features'], function(value, key1, list){ 
      if (!(key in seeds))
        {
          utils.recursionredis([key1], [1], true, function(err,actual) {
            fiber.run(actual)
          })
          seeds[key1] = Fiber.yield()
        }
    }, this)
  }
}, this)

// console.log(seeds)
// process.exit(0)

/*
 { hi: 1,
     i: 1,
     want: 1,
     to: 1,
     offer: 1,
     you: 1,
     a: 1,
     '[start] hi': 1,
     'hi i': 1,
     'i want': 1,
     'want to': */
console.log("START")

// replace features and skip sentences that DEFAULT INTENT only
_.each(turns, function(turn, key, list){ 
  if (!('separation' in turn))
    {
    turn['features_original'] = turn['features']
    turn['features'] = utils.replacefeatures(turn['features'], seeds, function (a){return tfidf.idf(a)})
    }
}, this)

// create map of features, simple list of features
var featuremap = []
_.each(turns, function(turn, key, list){ 
  _.each(turn['features'], function(value1, key1, list1){ 
    if (featuremap.indexOf(key1) == -1)
      featuremap.push(key1)
  }, this)
}, this)


// run over all test examples and compare to train examples
// and write results to test example
_.each(turns, function(testturn, key, list){ 
    // only test samples
    if (!('separation' in testturn))
      {
       turns[key]['evaluation']   = {}
       turns[key]['evaluation_original']   = {}
       _.each(turns, function(trainturn, key1, list1){ 
          if (('separation' in trainturn) && (trainturn['input'] != false))
          {
            var intents = utils.onlyIntents(trainturn['output'])
            if (intents.length == 1)
              {
              if (!(intents[0] in  turns[key]['evaluation']))
                {
                  turns[key]['evaluation'][intents[0]] = []
                  turns[key]['evaluation_original'][intents[0]] = []
                }

              var score = utils.cosine(utils.buildvector(featuremap, testturn['features']), utils.buildvector(featuremap, trainturn['features']))
              var score_original = utils.cosine(utils.buildvector(featuremap, testturn['features_original']), utils.buildvector(featuremap, trainturn['features']))

              if (score > 0)
                turns[key]['evaluation'][intents[0]].push([score,trainturn['input']])
              

              if (score_original > 0)
                turns[key]['evaluation_original'][intents[0]].push([score_original,trainturn['input']])
              }
          }
        }, this)
      }
}, this)


var stats = new PrecisionRecall();
var stats_original = new PrecisionRecall();

//evaluations
_.each(turns, function(testturn, key, list){ 
    if (!('separation' in testturn))
      {
      var expected = utils.onlyIntents(testturn['output'])

      var actual = utils.takeIntent(testturn['evaluation'])        
      turns['stats'] = stats.addCasesHash(expected, actual)
      
      var actual_original = utils.takeIntent(testturn['evaluation_original'])        
      turns['stats_original'] = stats_original.addCasesHash(expected, actual_original)
      }
})


var test_filtered = _.filter(turns, function(num){ return (!('separation' in num))})

console.log(JSON.stringify(test_filtered, null, 4))
console.log(stats.retrieveStats())
console.log(stats_original.retrieveStats())


// console.log("train size"+train_turns.length)
process.exit(0)
// if ((sentence.indexOf("+")==-1) && (sentence.indexOf("-")==-1))
    // {
    // console.log("verbnegation")
})
f.run();