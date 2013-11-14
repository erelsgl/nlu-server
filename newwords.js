/*
This script calculates the statistic and influence of unseen words
It seaches for words that appear in testSet and not in the trainSet
Then it trains the classifier on trainSet after that it evaluates the influence of unseen words in testSet
*/
var _ = require('underscore')._;
var fs = require('fs');
var hash = require('limdu/utils/hash');
var trainAndTest_hash= require('limdu/utils/trainAndTest').trainAndTest_hash;
var partitions = require('limdu/utils/partitions');


var createNewClassifier = function() {
  var defaultClassifier = require(__dirname+'/classifiers').defaultClassifier;
  return new defaultClassifier();
}

var datasetcollected = new Array();
var datasetfile = new Array();
datasetfile[0] = '0_grammar.json';
datasetfile[1] = '1_woz_kbagent_students.json';
datasetfile[2] = '1_woz_kbagent_students1class.json';
datasetfile[3] = '2_experts.json';
datasetfile[4] = '2_experts1class.json';
datasetfile[5] = '3_woz_kbagent_turkers_negonlp2.json';
datasetfile[6] = '4_various.json';
datasetfile[7] = '4_various1class.json';
// datasetfile[8] = '5_woz_ncagent_turkers_negonlp2ncAMT.json';

var datasetcollectedcommon = [];
for (var i=0;i<datasetfile.length;i++)
  { 
  datasetcollected[i] = JSON.parse(fs.readFileSync("datasets/Employer/"+datasetfile[i]));
  datasetcollectedcommon = datasetcollectedcommon.concat(datasetcollected[i]);
  }

_.each([1, 2, 3], function(num) { datasetcollectedcommon = _.shuffle(datasetcollectedcommon);});

partitions.partitions(datasetcollectedcommon, 3, function(trainSet, testSet, index) { 

// process.exit();  
//var datasetHash = hash.fromString(fs.readFileSync("datasets/Employer/2_experts1class.json", 'utf8'));
 
  var dataset = JSON.parse(fs.readFileSync("datasets/Employer/2_experts1class.json"));
  dataset = testSet;
  vocabulary = [];
  for (var sample in dataset) 
    {
    vocabulary = vocabulary.concat(dataset[sample]['input'].replace(/[ \t,;:.!?]/g,' ').split(' '));
    }
  vocabulary = _.uniq(vocabulary);

  var dataset = JSON.parse(fs.readFileSync("datasets/Employer/4_various.json"));
  dataset = trainSet;
  goldvocabulary = [];
  for (var sample in dataset) 
    {
    goldvocabulary = goldvocabulary.concat(dataset[sample]['input'].replace(/[ \t,;:.!?]/g,' ').split(' '));
    }

  hoser = [];
  hoser = _(vocabulary).difference(goldvocabulary);

  fullhoser = [];
  hoserdataset =[];

  var dataset = JSON.parse(fs.readFileSync("datasets/Employer/2_experts1class.json"));
  dataset = testSet;

  var indexes = []
  var words = []
  for (var word in hoser)
    {
      el = {}
      el['word'] = hoser[word];
      el['sentences'] = [];
        
    for (var sample in dataset) 
      {
      if ((' '+dataset[sample]['input'].replace(/[ \t,;:.!?]/g,' ')+' ').indexOf(' '+hoser[word]+' ') != -1)
        {
        el['sentences'] = el['sentences'].concat(dataset[sample]['input'].trim());
        hoserdataset = hoserdataset.concat(dataset[sample]);
        indexes.push(parseInt(sample));
        words.push(hoser[word]);
        }
      }
      fullhoser = fullhoser.concat(el);
    }
  console.log("Train on trainSet size " + trainSet.length +" testSet size "+ testSet.length+"\n");
  console.log(fullhoser);

  var stats  = trainAndTest_hash(createNewClassifier, trainSet, testSet, 5);
  // var common = _.intersection(stats[1], indexes);
  // console.log(JSON.stringify(stats['data'], null, 4));
 _.each(indexes, function(num, key, list) 
     { 
     if ((stats['data'][num]['explanations']['FP'].length > 0 ) || (stats['data'][num]['explanations']['FN'].length > 0 ))
       {
        console.log(words[key]);
        console.log(JSON.stringify(stats['data'][num], null, 4));
       }
       ;});
 });
