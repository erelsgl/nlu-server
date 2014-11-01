//NOT is RD but should be included in the comparison scheme because it's crucial for semantics 

/* Reject
negation of any Accept or Offer keyphrase
phrasal verb problem

'I don't accept'
'I don't offer'

Offer: do we agree on
Reject: do not agree

Offer: and we'll throw in
Reject: thrown out

Query (accept): do you accept
Reject: do not accept

Offer: I said wihtout leased car
Reject: say no
*/

/*
Accept
context resolution
'accept' in future is Offer
  'I will accept 20,000'
'accept' in question is Offer
  'do we agree on salary of 15000'
  'do you agree to start with'
'accept' in let's construction
  'let us agree on salary of 15000'

Offer: fast promotion track is ok
Accept: ok

Offer: let us agree on 12000 NIS
Accept: agree on

Reject: i cannot agree to that
Accept: agree

Offer: will you accept

Offer: I say 10% pension
Accept: say yes

Offer: Are you willing to take 10% pension?
Accept: take it

Offer: do you accept?
Accept: accept

*/

/*
Offer
negation is reject

Reject: Pension funds cannot be given
Offer: give
*/



var _ = require('underscore')._; 
var fs = require('fs');
var natural = require('natural');
var utils = require('./utils');
var async = require('async');
var Fiber = require('fibers');
var bars = require('../../utils/bars.js');
var INTENT = "Offer"

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

// filtering the gold standard keyphrases that are equal according to the comparison scheme
var f = Fiber(function() {
  var fiber = Fiber.current;

	var seeds = ['offer']
	var report = {}
  var FN = []

  console.log("number of seeds "+seeds.length)
  console.log(seeds)
		
  // retrieve all generated paraphases to the seeds
  utils.recursionredis(seeds, [1,1], function(err,actual) {
    console.log("number of PPDB paraphrases " + actual.length)
    utils.clusteration(_.unique(actual), function(err, clusters){
      fiber.run(clusters)
    })
  })

  var clusters = Fiber.yield()
     
  console.log("number of clusters "+clusters.length)
  console.log(clusters)
  
  console.log("number of turns " + turns.length)
  _.each(turns, function(turn, key, list){
    if (key%10 == 0) console.log(key)
    if (turn['status'] == "active")
    if ('intent_keyphrases_rule' in turn)
      _.each(turn['intent_keyphrases_rule'], function(keyphrase, intent, list){ 
          if ((keyphrase != 'DEFAULT INTENT') && (keyphrase != '') 
            // && (keyphrase.indexOf("<VALUE>") == -1) && (keyphrase.indexOf("<ATTRIBUTE>") == -1)
             )
            {

              keyphrase = keyphrase.replace("<VALUE>", "")
              keyphrase = keyphrase.replace("<ATTRIBUTE>", "")
              keyphrase = keyphrase.replace("^", "")
              keyphrase = keyphrase.replace("$", "")
              keyphrase = keyphrase.replace(/ +(?= )/g,'')
              
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
                      report['cluster'+clusterkey]['keyphrases'] = clusters[clusterkey]
                      }

                    if (intent == INTENT)
                      report['cluster'+clusterkey]['TP'].push([turn['input'], keyphrase])

                    if (intent != INTENT)
                      report['cluster'+clusterkey]['FP'].push([turn['input'], keyphrase, intent])
                  }
                // })
              }, this)
              if ((found == false) && (intent == INTENT))
                  FN.push([turn['input'], keyphrase])
            }
    }, this)
  }, this)

console.log(JSON.stringify(report, null, 4))
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