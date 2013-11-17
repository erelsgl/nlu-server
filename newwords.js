/*
This script calculates the statistic and influence of unseen words
It seaches for words that appear in testSet and not in the trainSet
Then it trains the classifier on trainSet after that it evaluates the influence of unseen words in testSet
*/
var _ = require('underscore')._;
var fs = require('fs');
var natural = require('natural');
var hash = require('limdu/utils/hash');
var trainAndTest_hash= require('limdu/utils/trainAndTest').trainAndTest_hash;
var partitions = require('limdu/utils/partitions');

var tokenizer = new natural.WordPunctTokenizer(); // WordTokenizer, TreebankWordTokenizer,

var createNewClassifier = function() {
  var defaultClassifier = require(__dirname+'/classifiers').defaultClassifier;
  return new defaultClassifier();
}

function normalizer(sentence) {
  sentence = sentence.toLowerCase().trim();
  // return regexpNormalizer(sentence);
  return sentence;
}

function tokenizedataset(dataset)
{ 
  vocabulary = []
  for (var sample in dataset) 
   {
  var words = tokenizer.tokenize(normalizer(dataset[sample]['input']));
  vocabulary = vocabulary.concat(words);
   }
  return _.uniq(vocabulary);
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
datasetfile[8] = '5_woz_ncagent_turkers_negonlp2ncAMT.json';
datasetfile[8] = '6_expert.json';

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
   // var dataset = JSON.parse(fs.readFileSync("datasets/Employer/2_experts1class.json"));

  console.log("test set size "+testSet.length)
  console.log("train set size "+trainSet.length)
  
  testvocabulary = tokenizedataset(testSet)
  trainvocabulary = tokenizedataset(trainSet)

  console.log("test vocabulary "+ testvocabulary.length)
  console.log("train vocabulary "+ trainvocabulary.length)

  unseenvocabulary = _.difference(testvocabulary, trainvocabulary);
  
  console.log("unseen vocas size")
  console.log(unseenvocabulary.length)
  

  console.log("unseen vocas")
  console.log(unseenvocabulary)

  // console.log("train vocas")
  // console.log(trainvocabulary)
  
  // console.log("test vocas")
  // console.log(testvocabulary)
  
  
  unseendataset =[];
  unseenwords = {}
  unseensetences = 0
  
  for (var word in unseenvocabulary)
    {
    data = []  
    for (var sample in testSet) 
      {
        tuple = {}
      if ((tokenizer.tokenize(normalizer(testSet[sample]['input']))).indexOf(unseenvocabulary[word]) != -1)
        {
        tuple['utterance'] = testSet[sample]['input'].trim()
        tuple['number'] = sample
        // sentences = sentences.concat(testSet[sample]['input'].trim());
        data = data.concat(tuple)
        unseendataset = unseendataset.concat(testSet[sample]);
        }
      }
      unseenwords[unseenvocabulary[word]] = data
      unseensetences += data.length
    }

    console.log("senteces with unseen words ")
    console.log(unseensetences)
    console.log(unseenwords)




    var stats  = trainAndTest_hash(createNewClassifier, trainSet, testSet, 5);
 // //  // var common = _.intersection(stats[1], indexes);
 // //  // console.log(JSON.stringify(st1ats['data'], null, 4));
 //   _.each(unseenwords.keys(), function(num, key, list) 
 //       { 
 //        console.log(num)
 // //      if ((stats['data'][num]['explanations']['FP'].length > 0 ) || (stats['data'][num]['explanations']['FN'].length > 0 ))
 //        {
 //         console.log(words[key]);
 //         console.log(JSON.stringify(stats['data'][num], null, 4));
 //        }
         // ;});

var total = 0
for (var number in testSet)
  {
      if ((stats['data'][number]['explanations']['FP'].length > 0 ) || (stats['data'][number]['explanations']['FN'].length > 0 ))
        {
          total += 1
        }
 
  }

console.log("total error sentence "+ total)

for (var index in unseenwords)
  {
    console.log(index);
    for (var utterance in unseenwords[index])
      {
        number = unseenwords[index][utterance]['number']
        console.log(number);
        if ((stats['data'][number]['explanations']['FP'].length > 0 ) || (stats['data'][number]['explanations']['FN'].length > 0 ))
        {
           console.log(unseenwords[index]);
           console.log(JSON.stringify(stats['data'][number], null, 4));
           for (var er in stats['data'][number]['explanations'])
           {
            console.log(er)
            for (var err in stats['data'][number]['explanations'][er])
              {
                console.log(stats['data'][number]['explanations'][er][err].replace(/[{}'/"]/g,""))
              }
           }
        }
        else
        {
         console.log("zero error") 
        }
 
      }

  }
 });
