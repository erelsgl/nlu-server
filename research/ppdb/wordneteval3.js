/*!    Antonym 
@    Hypernym 
 ~    Hyponym 
*    Entailment 
>    Cause 
^    Also see 
$    Verb Group 
+    Derivationally related form         
;c    Domain of synset - TOPIC 
;r    Domain of synset - REGION 
;u    Domain of synset - USAGE 
*/

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
              'turkers_keyphrases_only_rule.json',
              'students_keyphrases_only_rule.json'
            ]

var data = []
_.each(datasets, function(value, key, list){
        data = data.concat(JSON.parse(fs.readFileSync("../../../datasets/Employer/Dialogue/"+value)))
}, this)

data = data.concat(JSON.parse(fs.readFileSync("../../../datasets/DatasetDraft/dial_usa_rule.json")))

var turns = bars.extractturns(data)

var filtered = []
_.each(turns, function(turn, key, list){
  if ('intent_keyphrases_rule' in turn)
    filtered.push(turn)
}, this)

turns = filtered

// intent_keyphrases_gold
// intent_keyphrases_rule

// collect only offer keyphrases
// var keyph = []
// _.each(turns, function(value, key, list){ 
//   if ('intent_keyphrases_rule' in value)
//     if ('Offer' in value['intent_keyphrawordnetses_rule'])
//       {
//         var phrase = value['intent_keyphrases_rule']['Offer']
//         // phrase = phrase.replace("<ATTRIBUTE>","")
//         // phrase = phrase.replace("<VALUE>","")
//         if ((phrase != 'DEFAULT INTENT') && (phrase != '') &&
//             (phrase.indexOf("<VALUE>") == -1) && (phrase.indexOf("<ATTRIBUTE>") == -1))
//           keyph.push(phrase)
//       }
// }, this)

// keyph = _.compact(_.unique(keyph))

// var tocomp = utils.crosslist(keyph)

// filtering the gold standard keyphrases that are equal according to the comparison scheme
var f = Fiber(function() {
  var fiber = Fiber.current;

	var seeds = ['offer']
	var report = {}
  var FN = []

  console.log("number of seeds "+seeds.length)
  console.log(seeds)
		
  // retrieve all generated paraphases to the seeds
  utils.wordnetsynonyms(['offer'], function(err,actual){
    console.log("number of Wordnet paraphases "+ actual.length)
    utils.clusteration(_.unique(actual), function(err, clusters){
      fiber.run(clusters)
    })
  })

  var clusters = Fiber.yield()

  // _.each(clusters, function(cluster, key, list){ 
  //   report['cluster'+key] = {}
  //   report['cluster'+key]['data'] = cluster
  //   report['cluster'+key]['TP'] = []
  //   report['cluster'+key]['FP'] = []
  // }, this)
      
  console.log("number of clusters "+clusters.length)
  console.log(clusters)
  
  console.log("number of turns " + turns.length)
  _.each(turns, function(turn, key, list){
    if (key%10 == 0) 
          console.log(key)
    if ('intent_keyphrases_rule' in turn) 
      _.each(turn['intent_keyphrases_rule'], function(keyphrase, intent, list){ 
          if ((keyphrase != 'DEFAULT INTENT') && (keyphrase != '') 
            // && (keyphrase.indexOf("<VALUE>") == -1) && (keyphrase.indexOf("<ATTRIBUTE>") == -1)
            )
            {
              keyphrase = keyphrase.replace("<VALUE>", "")
              keyphrase = keyphrase.replace("<ATTRIBUTE>", "")
              keyphrase = keyphrase.replace("$", "")
              keyphrase = keyphrase.replace("^", "")
              var found = false
              _.each(clusters, function(cluster, clusterkey, list){ 
                utils.compare([cluster[0], keyphrase], function(err, result){
                  fiber.run(result)
                })
                var result = Fiber.yield()
                if (result[4] == 1)
                  {
                    found = true
                    if (!('cluster'+clusterkey in report))
                      {
                      report['cluster'+clusterkey]={}
                      report['cluster'+clusterkey]['TP'] = []
                      report['cluster'+clusterkey]['FP'] = []
                      }

                    if (intent == 'Offer')
                      report['cluster'+clusterkey]['TP'].push(turn['input'])

                    if (intent != 'Offer')
                      report['cluster'+clusterkey]['FP'].push(turn['input'])
                  }
                // })
              }, this)
              if ((found == false) && (intent == "Offer"))
                  FN.push(turn['input'])
            }
    }, this)
  }, this)

console.log(report)
console.log("number of FN " + FN.length)
console.log(FN)

var TP = 0
var FP = 0

_.each(report, function(value, key, list){ 
  TP = TP + value['TP'].length
  FP = FP + value['FP'].length
}, this)

var Precision = TP/(TP+FP)
var Recall = TP/(TP+FN.length)

console.log("Precision " + Precision)
console.log("Recall " + Recall)
})
f.run();

