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

// data = data.concat(JSON.parse(fs.readFileSync("../../../datasets/DatasetDraft/dial_usa_rule.json")))

var dataset = partitions.partition(data, 1, Math.round(data.length*0.8))

// console.log(dataset['train'].length)
// console.log(dataset['test'].length)

var train_turns = bars.extractturns(dataset['train'])

// load only keyphrases from train
var seeds = {}
_.each(train_turns, function(turn, key, list){
  if ('intent_keyphrases_rule' in turn)
    _.each(turn['intent_keyphrases_rule'], function(keyphrase, intent, list){ 
      if (!(intent in seeds))
        seeds[intent] = []

      if ((keyphrase != 'DEFAULT INTENT') && (keyphrase != ''))
      {

        keyphrase = keyphrase.replace("<VALUE>", "")
        keyphrase = keyphrase.replace("<ATTRIBUTE>", "")
        keyphrase = keyphrase.replace("^", "")
        keyphrase = keyphrase.replace(".", "")
        keyphrase = keyphrase.replace("!", "")
        keyphrase = keyphrase.replace("$", "")
        keyphrase = keyphrase.replace(/ +(?= )/g,'')
        keyphrase = keyphrase.toLowerCase()

        seeds[intent].push(keyphrase)
        seeds[intent] = _.unique(seeds[intent])
      } 
    }, this)
}, this)

_.each(seeds, function(value, key, list){ 
  _.each(value, function(value1, key1, list){ 
      utils.recursionredis([value1], [1], function(err,actual) {
        fiber.run(actual)
      })
      var list = Fiber.yield()
      seeds[key][key1] = {}
      seeds[key][key1][value1] = list
  }, this)
}, this)

var stats = new PrecisionRecall();
var test_turns = bars.extractturns(dataset['test'])

/*console.log(JSON.stringify(seeds, null, 4))

_.each(test_turns, function(turn, key, list){ 

    utils.retrieveIntent(turn['input'], seeds, function(err, results){
        fiber.run(results)
    })

    var out = Fiber.yield()

    var labs = _.map(out, function(num, key){ return Object.keys(num)[0] });

    var output = stats.addPredicition(_.unique(utils.onlyIntents(turn['output'])), _.unique(labs))

    console.log("exp")
    console.log(_.unique(utils.onlyIntents(turn['output'])))
    console.log("act")
    console.log(_.unique(labs))
    console.log("out")
    console.log(JSON.stringify(out, null, 4))
    console.log(turn)

}, this)

console.log(stats.retrieveStats())
console.log(stats.retrieveLabels())
process.exit(0)
*/


_.each(seeds, function(valuelist, intent, list){ 
  console.log("intent")
  console.log(intent)

  _.each(valuelist, function(elem, key, list){
    console.log("keyphrase")
    console.log(elem) 
    var dist = []
    _.each(utils.subst(elem), function(sub, key1, list1){
      console.log("substring")
      console.log(sub)
      utils.recursionredis([sub], [2], function(err,actual) {
        fiber.run(actual)
      })
      var paraphr = Fiber.yield()

      utils.onlycontent(sub, function (err,strcontent){
        fiber.run(utils.elimination(strcontent))
      })
      var paraphrcontent = Fiber.yield()

      console.log("length of paraphrases")
      console.log(paraphr.length)

      console.log("content part")
      console.log(paraphrcontent)

      var score = paraphrcontent.length==1? 1: Math.pow(paraphr.length, paraphrcontent.length)
      console.log("score")
      console.log(score)

      dist.push(score)
      // console.log(paraphr)
    }, this)
    dist = _.sortBy(dist, function(num){ return num });
    console.log(dist)
  }, this)
}, this)

process.exit(0)
// turns = filtered

// filtering the gold standard keyphrases that are equal according to the comparison scheme

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