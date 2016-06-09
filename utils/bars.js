/*
	This module was created as a utils for limdu, many of the routines were copied from train.js of nlu-server.
	The main function of the following methods is helping to represent the analysis of given data.
	This module contains: 
		* the hierarchical representation of the labels.
		* routines for aggregating statistics after cross - validation.
		* routine for building confusion matrix.
		* auxiliary routine for building table in html format.
		* routine for building intent attribute distribution.
		* etc.

	@author Vasily Konovalov
 */
// var s = require('net').Socket();
// var Fiber = require('fibers');
var natural = require('natural');
var _ = require('underscore')._;
var fs = require('fs');
var multilabelutils = require('limdu/classifiers/multilabel/multilabelutils');
var Hierarchy = require(__dirname+'/../Hierarchy');
var distance = require(__dirname+'/distance');
var async_adapter = require(__dirname+'/async_adapter');
var async = require('async');
var classifiers = require(__dirname+'/../classifiers');

const walker = require('walker-sample');

// var limdu = require("limdu");
// var ftrs = limdu.features

var splitJson = Hierarchy.splitJson
var joinJson = Hierarchy.joinJson
var splitJsonRecursive = Hierarchy.splitJsonRecursive
var splitPartEqually = Hierarchy.splitPartEqually
var splitPartEqually1 = Hierarchy.splitPartEqually1
var joinJsonRecursive = Hierarchy.joinJsonRecursive

// var regexpNormalizer = ftrs.RegexpNormalizer(
    // JSON.parse(fs.readFileSync(__dirname+'/../knowledgeresources/BiuNormalizations.json')));

// Tokenizer = require('natural').WordTokenizer,
  // tokenizer = new Tokenizer();

// var indexWN = JSON.parse(fs.readFileSync(__dirname + "/../wordnet_index.json", 'UTF-8'))

// var stopwords = loadstopwords(__dirname+"/../stopwords")
// var intent_field = 'intent_core'
var ValueTransition =
{
	"8 hours": "8",
	"9 hours": "9",
	"10 hours": "10",
	"7,000 NIS": "7000",
	"12,000 NIS": "12000",
	"20,000 NIS": "20000",
	"60,000 USD": "60000",
  "90,000 USD": "90000",
  "120,000 USD": "120000",
  "0%": "0%",
	"10%": "10%",
	"20%": "20%",
	"Fast promotion track": "fast",
	"Slow promotion track": "slow"
} 


semlang = [ 

  '{"Offer":{"Leased Car":"With leased car"}}',
  '{"Offer":{"Leased Car":"No agreement"}}',
  '{"Offer":{"Leased Car":"Without leased car"}}',
  '{"Offer":{"Working Hours":"8 hours"}}',
  '{"Offer":{"Working Hours":"9 hours"}}',
  '{"Offer":{"Working Hours":"10 hours"}}',
  '{"Offer":{"Job Description":"Project Manager"}}',
  '{"Offer":{"Job Description":"Programmer"}}',
  '{"Offer":{"Job Description":"QA"}}',  
  '{"Offer":{"Job Description":"Team Manager"}}',
  // '{"Offer":{"Salary":"7,000 NIS"}}',
  '{"Offer":{"Salary":"60,000 USD"}}',
  '{"Offer":{"Salary":"90,000 USD"}}',
  '{"Offer":{"Salary":"120,000 USD"}}',
  '{"Offer":{"Pension Fund":"0%"}}',
  '{"Offer":{"Pension Fund":"10%"}}',
  '{"Offer":{"Pension Fund":"20%"}}',
  '{"Offer":{"Pension Fund":"No agreement"}}',
  '{"Offer":{"Promotion Possibilities":"Fast promotion track"}}',
  '{"Offer":{"Promotion Possibilities":"Slow promotion track"}}',

  '{"Accept":{"Leased Car":"With leased car"}}',
  '{"Accept":{"Leased Car":"No agreement"}}',
  '{"Accept":{"Leased Car":"Without leased car"}}',
  '{"Accept":{"Working Hours":"8 hours"}}',
  '{"Accept":{"Working Hours":"9 hours"}}',
  '{"Accept":{"Working Hours":"10 hours"}}',
  '{"Accept":{"Job Description":"Project Manager"}}',
  '{"Accept":{"Job Description":"Programmer"}}',
  '{"Accept":{"Job Description":"QA"}}',  
  '{"Accept":{"Job Description":"Team Manager"}}',
  // '{"Accept":{"Salary":"7,000 NIS"}}',
  '{"Accept":{"Salary":"60,000 USD"}}',
  '{"Accept":{"Salary":"90,000 USD"}}',
  '{"Accept":{"Salary":"120,000 USD"}}',
  '{"Accept":{"Pension Fund":"0%"}}',
  '{"Accept":{"Pension Fund":"10%"}}',
  '{"Accept":{"Pension Fund":"20%"}}',
  '{"Accept":{"Pension Fund":"No agreement"}}',
  '{"Accept":{"Promotion Possibilities":"Fast promotion track"}}',
  '{"Accept":{"Promotion Possibilities":"Slow promotion track"}}',

  '{"Accept":"true"}',

  '{"Accept":"Salary"}',
  '{"Accept":"previous"}',
  '{"Accept":"Leased Car"}',
  '{"Accept":"Pension Fund"}',
  '{"Accept":"Working Hours"}',
  '{"Accept":"Job Description"}',
  '{"Accept":"Promotion Possibilities"}',
  
  '{"Reject":{"Leased Car":"With leased car"}}',
  '{"Reject":{"Leased Car":"No agreement"}}',
  '{"Reject":{"Leased Car":"Without leased car"}}',
  '{"Reject":{"Working Hours":"8 hours"}}',
  '{"Reject":{"Working Hours":"9 hours"}}',
  '{"Reject":{"Working Hours":"10 hours"}}',
  '{"Reject":{"Job Description":"Project Manager"}}',
  '{"Reject":{"Job Description":"Programmer"}}',
  '{"Reject":{"Job Description":"QA"}}',  
  '{"Reject":{"Job Description":"Team Manager"}}',
  // '{"Reject":{"Salary":"7,000 NIS"}}',
  '{"Reject":{"Salary":"60,000 USD"}}',
  '{"Reject":{"Salary":"90,000 USD"}}',
  '{"Reject":{"Salary":"120,000 USD"}}',
  '{"Reject":{"Pension Fund":"0%"}}',
  '{"Reject":{"Pension Fund":"10%"}}',
  '{"Reject":{"Pension Fund":"20%"}}',
  '{"Reject":{"Pension Fund":"No agreement"}}',
  '{"Reject":{"Promotion Possibilities":"Fast promotion track"}}',
  '{"Reject":{"Promotion Possibilities":"Slow promotion track"}}',

  '{"Reject":"true"}',
  // '{"Reject":"previous"}',
  '{"Reject":"Salary"}',
  '{"Reject":"Leased Car"}',
  '{"Reject":"Working Hours"}',
  '{"Reject":"Pension Fund"}',
  '{"Reject":"Job Description"}',
  '{"Reject":"Promotion Possibilities"}',

  // '{"Append":"previous"}',
  // '{"Insist":"Working Hours"}',
  // '{"Insist":"Job Description"}',
  

  '{"Query":"Offer"}',
  '{"Query":{"Offer":"Salary"}}',
  '{"Query":{"Offer":"Job Description"}}',
  '{"Query":{"Offer":"Leased Car"}}',
  '{"Query":{"Offer":"Promotion Possibilities"}}',
  '{"Query":{"Offer":"Working Hours"}}',
  '{"Query":{"Offer":"Pension Fund"}}',
  

  // '{"Query":"accept"}',
  '{"Greet":true}',
  '{"Greet":"true"}',
  '{"Quit":"true"}'
  // '{"Query":"issues"}',
  // '{"Query":"Salary"}',
  // '{"Query":"compromise"}',
  // '{"Query":"Job Description"}',
  // '{"Insist":"previous"}',
  // '{"Insist":"Salary"}',
  // '{"Query":"Leased Car"}',
  // '{"Insist":"Promotion Possibilities"}',
  // '{"Query":"Promotion Possibilities"}',
  // // '{"Offer":{"Salary":"10,000 NIS"}}',
  // '{"Query":"Working Hours"}',
  // '{"Insist":"Pension Fund"}',
  // '{"Query":"bid"}',
  // '{"Query":"Pension Fund"}',
  // '{"Insist":"Leased Car"}' 
  ]


// semlang = [ '{"Reject":"previous"}',
//   '{"Append":"previous"}',
//   '{"Offer":{"Leased Car":"With leased car"}}',
//   '{"Accept":{"Leased Car":"With leased car"}}',
//   '{"Reject":{"Leased Car":"With leased car"}}',
//   '{"Reject":"Salary"}',
//   '{"Offer":{"Working Hours":"9 hours"}}',
//   '{"Accept":{"Working Hours":"9 hours"}}',
//   '{"Reject":{"Working Hours":"9 hours"}}',
//   '{"Insist":"Job Description"}',
//   '{"Offer":{"Job Description":"Programmer"}}',
//   '{"Accept":{"Job Description":"Programmer"}}',
//   '{"Reject":{"Job Description":"Programmer"}}',
//   '{"Offer":{"Working Hours":"10 hours"}}',
//   '{"Accept":{"Working Hours":"10 hours"}}',
//   '{"Reject":{"Working Hours":"10 hours"}}',
//   '{"Reject":"Leased Car"}',
//   '{"Offer":{"Leased Car":"No agreement"}}',
//   '{"Offer":{"Leased Car":"Without leased car"}}',
//   '{"Accept":{"Leased Car":"Without leased car"}}',
//   '{"Reject":{"Leased Car":"Without leased car"}}',
//   '{"Accept":"Salary"}',
//   '{"Insist":"Working Hours"}',
//   '{"Offer":{"Promotion Possibilities":"Slow promotion track"}}',
//   '{"Accept":{"Promotion Possibilities":"Slow promotion track"}}',
//   '{"Reject":{"Promotion Possibilities":"Slow promotion track"}}',
//   '{"Accept":"previous"}',
//   '{"Offer":{"Working Hours":"8 hours"}}',
//   '{"Accept":{"Working Hours":"8 hours"}}',
//   '{"Reject":{"Working Hours":"8 hours"}}',
//   '{"Offer":{"Job Description":"Project Manager"}}',
//   '{"Accept":{"Job Description":"Project Manager"}}',
//   '{"Reject":{"Job Description":"Project Manager"}}',
//   '{"Offer":{"Salary":"7,000 NIS"}}',
//   '{"Accept":{"Salary":"7,000 NIS"}}',
//   '{"Reject":{"Salary":"7,000 NIS"}}',
//   '{"Offer":{"Salary":"10,000 NIS"}}',
//   '{"Accept":{"Salary":"10,000 NIS"}}',
//   '{"Reject":{"Salary":"10,000 NIS"}}',
//   '{"Offer":{"Pension Fund":"10%"}}',
//   '{"Accept":{"Pension Fund":"10%"}}',
//   '{"Reject":{"Pension Fund":"10%"}}',
//   '{"Offer":{"Promotion Possibilities":"Fast promotion track"}}',
//   '{"Accept":{"Promotion Possibilities":"Fast promotion track"}}',
//   '{"Reject":{"Promotion Possibilities":"Fast promotion track"}}',
//   '{"Offer":{"Salary":"12,000 NIS"}}',
//   '{"Accept":{"Salary":"12,000 NIS"}}',
//   '{"Reject":{"Salary":"12,000 NIS"}}',
//   '{"Offer":{"Pension Fund":"0%"}}',
//   '{"Accept":{"Pension Fund":"0%"}}',
//   '{"Reject":{"Pension Fund":"0%"}}',
//   '{"Offer":{"Job Description":"QA"}}',
//   '{"Accept":{"Job Description":"QA"}}',
//   '{"Reject":{"Job Description":"QA"}}',
//   '{"Query":"accept"}',
//   '{"Greet":true}',
//   '{"Offer":{"Pension Fund":"20%"}}',
//   '{"Accept":{"Pension Fund":"20%"}}',
//   '{"Reject":{"Pension Fund":"20%"}}',
//   '{"Offer":{"Job Description":"Team Manager"}}',
//   '{"Accept":{"Job Description":"Team Manager"}}',
//   '{"Reject":{"Job Description":"Team Manager"}}',
//   '{"Quit":true}',
//   '{"Query":"issues"}',
//   '{"Query":"Salary"}',
//   '{"Query":"compromise"}',
//   '{"Query":"Job Description"}',
//   '{"Reject":"Working Hours"}',
//   '{"Accept":"Leased Car"}',
//   '{"Accept":"Pension Fund"}',
//   '{"Reject":"Pension Fund"}',
//   '{"Insist":"previous"}',
//   '{"Insist":"Salary"}',
//   '{"Query":"Leased Car"}',
//   '{"Reject":"Job Description"}',
//   '{"Reject":"Promotion Possibilities"}',
//   '{"Offer":{"Salary":"20,000 NIS"}}',
//   '{"Accept":{"Salary":"20,000 NIS"}}',
//   '{"Reject":{"Salary":"20,000 NIS"}}',
//   '{"Accept":"Working Hours"}',
//   '{"Accept":"Job Description"}',
//   '{"Insist":"Promotion Possibilities"}',
//   '{"Query":"Promotion Possibilities"}',
//   // '{"Offer":{"Salary":"10,000 NIS"}}',
//   '{"Query":"Working Hours"}',
//   '{"Insist":"Pension Fund"}',
//   '{"Query":"bid"}',
//   '{"Accept":"Promotion Possibilities"}',
//   '{"Query":"Pension Fund"}',
//   '{"Offer":{"Pension Fund":"No agreement"}}',
//   '{"Insist":"Leased Car"}' ]

// newsemlang = [ '{"Reject":null}',
//   '{"Append":null}',
//   '{"Offer":{"Leased Car":"With leased car"}}',
//   '{"Reject":"Salary"}',
//   '{"Reject":"Leased Car"}',
//   '{"Offer":{"Leased Car":"With leased car"}}',
//   '{"Offer":{"Working Hours":"9 hours"}}',
//   '{"Insist":"Job Description"}',
//   '{"Offer":{"Job Description":"Programmer"}}',
//   '{"Offer":{"Working Hours":"10 hours"}}',
//   '{"Offer":{"Leased Car":"No agreement"}}',
//   '{"Offer":{"Leased Car":"Without leased car"}}',
//   '{"Accept":null}',
//   '{"Accept":"Salary"}',
//   '{"Insist":"Working Hours"}',
//   '{"Offer":{"Promotion Possibilities":"Slow promotion track"}}',
//   '{"Offer":{"Working Hours":"8 hours"}}',
//   '{"Offer":{"Job Description":"Project Manager"}}',
//   '{"Offer":{"Salary":"7,000 NIS"}}',
//   '{"Offer":{"Salary":"10,000 NIS"}}',
//   '{"Offer":{"Pension Fund":"10%"}}',
//   '{"Offer":{"Promotion Possibilities":"Fast promotion track"}}',
//   '{"Offer":{"Salary":"12,000 NIS"}}',
//   '{"Offer":{"Pension Fund":"0%"}}',
//   '{"Offer":{"Job Description":"QA"}}',
//   '{"Query":"accept"}',
//   '{"Greet":null}',
//   '{"Offer":{"Pension Fund":"20%"}}',
//   '{"Offer":{"Job Description":"Team Manager"}}',
//   '{"Quit":null}',
//   '{"Query":"issues"}',
//   '{"Query":"Salary"}',
//   '{"Query":"compromise"}',
//   '{"Query":"Job Description"}',
//   '{"Reject":"Working Hours"}',
//   '{"Accept":"Leased Car"}',
//   '{"Accept":"Pension Fund"}',
//   '{"Reject":"Pension Fund"}',
//   '{"Insist":"previous"}',
//   '{"Insist":"Salary"}',
//   '{"Query":"Leased Car"}',
//   '{"Reject":"Job Description"}',
//   '{"Reject":"Promotion Possibilities"}',
//   '{"Offer":{"Salary":"20,000 NIS"}}',
//   '{"Accept":"Working Hours"}',
//   '{"Accept":"Job Description"}',
//   '{"Insist":"Promotion Possibilities"}',
//   '{"Query":"Promotion Possibilities"}',
//   // '{"Offer":{"Salary":"10,000 NIS"}}',
//   '{"Query":"Working Hours"}',
//   '{"Insist":"Pension Fund"}',
//   '{"Query":"bid"}',
//   '{"Accept":"Promotion Possibilities"}',
//   '{"Query":"Pension Fund"}',
//   '{"Offer":{"Pension Fund":"No agreement"}}',
//   '{"Insist":"Leased Car"}' ]


Itents = ['Offer', 'Accept', 'Reject', 'Insist', 'QueryYN', 'QueryWH']
IntentsSingle = ['Greet', 'Quit']
Attributes = ['Salary', 'Pension Fund', 'Working Hours', 'Promotion Possibilities', 'Job Description', 'Leased Car']
Values = {'Salary': ['7000','10000','12000'],
		  'Pension Fund': ['10','15','20'],
		  'Promotion Possibilities': ['fast','slow'],
		  'Working Hours': ['8','9','10'],
		  'Job description': ['QA','Programmer','Team Manager','Project Manager']
		}

labeltree = { Offer: 
   { Salary: { '60,000 USD': {}, '90,000 USD': {}, '120,000 USD': {} },
     'Job Description': 
      { QA: {},
        'Team Manager': {},
        Programmer: {},
        'Project Manager': {} },
     'Pension Fund': { '10%': {}, '0%': {}, '20%': {}, 'No agreement': {} },
     'Working Hours': { '10 hours': {}, '9 hours': {}, '8 hours': {} },
     'Promotion Possibilities': { 'Fast promotion track': {}, 'Slow promotion track': {} },
     'Leased Car': 
      { 'Without leased car': {},
        'With leased car': {},
        'No agreement': {} } },
  Insist: 
   { 'Pension Fund': {},
     'Working Hours': {},
     previous: {},
     'Job Description': {},
     'Promotion Possibilities': {},
     Salary: {},
     'Leased Car': {} },
  Greet: { true: {} },
  Reject: 
   { Salary: {},
     'Leased Car': {},
     previous: {},
     'Pension Fund': {},
     'Job Description': {},
     'Working Hours': {},
     'Promotion Possibilities': {} },
  Accept: 
   { previous: {},
     Salary: {},
     'Pension Fund': {},
     'Working Hours': {},
     'Leased Car': {},
     'Job Description': {},
     'Promotion Possibilities': {} },
  Query: 
   { 'Job Description': {},
     accept: {},
     compromise: {},
     bid: {},
     'Working Hours': {},
     'Leased Car': {},
     'Pension Fund': {},
     Salary: {},
     issues: {},
     'Promotion Possibilities': {} },
  Append: { previous: {} },
  Quit: { true: {} } }


function joinfolds(global_stats)
{
  var output = {}
  _.each(global_stats, function(value, fold, list){
    _.each(value, function(data, trainsize, list){ 
        _.each(data, function(out, param, list){
          if (!(trainsize in output))
            output[trainsize] = {}
          if (!(param in output[trainsize]))
            output[trainsize][param]=[]
          
            output[trainsize][param]=output[trainsize][param].concat(out)

        }, this)
     }, this) 
  }, this)
  return output
}

function listdiff(list1, list2)
{
  list1 = _.map(list1, function(value){ return JSON.stringify(value); });
  list2 = _.map(list2, function(value){ return JSON.stringify(value); });

  var diff = _.difference(list1,list2)
  diff = _.map(diff, function(value){ return JSON.parse(value); });
  return diff
}

function listint(list1, list2)
{
  list1 = _.map(list1, function(value){ return JSON.stringify(value); });
  list2 = _.map(list2, function(value){ return JSON.stringify(value); });

  var diff = _.intersection(list1,list2)
  diff = _.map(diff, function(value){ return JSON.parse(value); });
  return diff
}

function lisunique(list1)
{
  list1 = _.map(list1, function(value){ return JSON.stringify(value); });
  
  var diff = _.unique(list1)
  diff = _.map(diff, function(value){ return JSON.parse(value); });
  return diff
}

function aggregateintents(global_stats)
{
var output = {}
_.each(global_stats, function(value, trainsize, list){ 
  _.each(value, function(value1, param, list){ 
    _.each(value1, function(value2, key, list){ 
      _.each(value2['intent_core'], function(value3, intent, list){ 
        
        var lime = []
        var phrase = ""
        var valbuf = ""

        _.each(value2['sequence_actual_ppdb'], function(value4, key, list){ 
          if (value4[0] == intent)
          { 
            if (listint([value4], value2['diff_'+param]).length > 0)
              lime.push("<b>"+value4[0]+":"+value4[2]+"|"+value4[3]+"|"+value4[4]+"|"+value4[5]+"</b>")
            else
              lime.push(value4[0]+":"+value4[2]+"|"+value4[3]+"|"+value4[4]+"|"+value4[5])
          }
        }, this)

        _.each(value2['diff_'+param], function(value5, key, list){ 
          if (value5[0] == intent)
          {
            phrase = cleanupkeyphrase(value5[2]) + "-" + cleanupkeyphrase(value3)

            if (!(trainsize in output))
              output[trainsize] = {}
            if (!(param in output[trainsize]))
              output[trainsize][param] = {}
            if (!(intent in output[trainsize][param]))
              output[trainsize][param][intent] = {}
            if (!(phrase in output[trainsize][param][intent]))
              output[trainsize][param][intent][phrase] = []
                
            output[trainsize][param][intent][phrase].push({
                                              'input': value2['input'], 
                                              'output':value2['intent_core'], 
                                              'match':lime,
                                              'eval_original':value2['eval_original'], 
                                              'eval_ppdb':value2['eval_ppdb']
                                            })
          }
        }, this)
      }, this)
    }, this)
  }, this)
}, this)
return output
}

function cleanupkeyphrase(keyphrase)
{
  keyphrase = keyphrase.replace("<VALUE>", "")
    keyphrase = keyphrase.replace("<ATTRIBUTE>", "")
    keyphrase = keyphrase.replace("^", "")
    keyphrase = keyphrase.replace(".", "")
    keyphrase = keyphrase.replace("!", "")
    keyphrase = keyphrase.replace("$", "")
    keyphrase = keyphrase.replace(/ +(?= )/g,'')
    keyphrase = keyphrase.toLowerCase()
    return keyphrase
}

function sorthash(ha)
{
  var li = _.pairs(ha) 
  ha = _.sortBy(li, function(num){ return num[1].length; });
  ha = ha.reverse()

  var output = {}
  _.each(ha, function(value, key, list){ 
    output[value[0]] = value[1]
  }, this)
  return output
}

function sortintent(ha)
{
  var li = _.pairs(ha) 
  ha = _.sortBy(li, function(num){ return Object.keys(num[1]).length; });
  ha = ha.reverse()
  
  var output = {}
  _.each(ha, function(value, key, list){ 
    output[value[0]] = value[1]
  }, this)
  return output
}

function writehtml(global_stats)
{

  global_stats = joinfolds(global_stats)
  global_stats = aggregateintents(global_stats)

  filename = "stats.html"

  var header = "<html><head><style>ul li ul li ul li ul{ display: none; } table {width: 4500px;table-layout: fixed;} </style><script src='http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js'></script></head><body><script>$(document).ready(function() { $('.list > li a').click(function() {$(this).parent().find('ul').toggle();});});</script>"
  fs.writeFileSync(filename, header + "\n", 'utf-8')
  

  fs.appendFileSync(filename, "<table border=\"1\" style=\"white-space: pre-wrap;\"><tr>", 'utf-8')
  _.each(global_stats, function(value, trainsize, list){ 
    fs.appendFileSync(filename, "<th>"+trainsize+"</th>", 'utf-8')
  }, this)
  fs.appendFileSync(filename, "</tr><tr>", 'utf-8')

    _.each(global_stats, function(value, trainsize, list){ 
      fs.appendFileSync(filename, "<td>", 'utf-8') 
      fs.appendFileSync(filename, "<table><tr><td>", 'utf-8') 
        _.each(value, function(value1, param, list){ 
          fs.appendFileSync(filename, "<ul class='list'><li><a>"+param+"</a><ul><il>",'utf-8')
            value1 = sortintent(value1)
            _.each(value1, function(value2, intent, list){
              fs.appendFileSync(filename, "<ul class='list'><li><a>"+intent+"</a><ul><il>",'utf-8')
                  value2 = sorthash(value2)
                _.each(value2, function(value3, phrase, list){ 
                  fs.appendFileSync(filename, "<ul class='list'><li><a><b>"+value3.length+"</b>-"+phrase+"</a><ul><il>",'utf-8')
                    var data = []
                    fs.appendFileSync(filename,"<table border=\"1\" style=\"white-space: pre-wrap; width: 450px\">", 'utf-8')
                    _.each(value3, function(value4, key, list){
                      fs.appendFileSync(filename,"<tr><td>", 'utf-8')
                      fs.appendFileSync(filename,"<i>"+biunormalizer(value4['input'])+"</i>"+"<br>", 'utf-8')
                      fs.appendFileSync(filename,"<i>"+JSON.stringify(value4['output'])+"</i>"+"<br>", 'utf-8')
                      fs.appendFileSync(filename,"<i>Original:"+JSON.stringify(value4['eval_original'])+"</i>"+"<br>", 'utf-8')
                      fs.appendFileSync(filename,"<i>PPDB:"+JSON.stringify(value4['eval_ppdb'])+"</i>"+"<br>", 'utf-8')
                      fs.appendFileSync(filename,value4['match'].join("<br>"), 'utf-8')
                      fs.appendFileSync(filename,"</td></tr>", 'utf-8')

                    }, this)
                    fs.appendFileSync(filename,"</table>", 'utf-8')
                  fs.appendFileSync(filename,"</il></ul></il></ul>", 'utf-8')

                }, this)
              fs.appendFileSync(filename,"</il></ul></il></ul>", 'utf-8')
            }, this)
          fs.appendFileSync(filename,"</il></ul></il></ul>", 'utf-8')
        }, this)
      fs.appendFileSync(filename, "</td></tr></table>", 'utf-8') 

      fs.appendFileSync(filename, "</td>", 'utf-8')
    }, this)

  fs.appendFileSync(filename, "</tr></table>", 'utf-8')
  fs.appendFileSync(filename, "</body></html>", 'utf-8')
}

/*function writecvs(global_stats, mode)
{
  _.each(global_stats, function(value, fold, list){
        fs.writeFileSync("/tmp/" + fold + ".csv", Object.keys(value).join("\t") + "\n", 'utf-8')
        maxlen = _.min(Object.keys(global_stats[0]))
        _(maxlen).times(function(n){
          var row = []
          _.each(value, function(value1, size, list){
            
            value1 = value1[mode]

            if (value1.length -1 >= n)
            {
            var match = []
            _.each(value1[n]['match'], function(value, key, list){
              match.push([value[0], value[2], value[3], value[4], value[5]]) 
            }, this)

              row.push('\\'+value1[n]['input'] + "\n" +
                      JSON.stringify(value1[n]['intent_core']) + " \n " +
                      JSON.stringify(match)+'\\'
                      )
            }
            else
              row.push()

          }, this)
          fs.appendFileSync("/tmp/" + fold + ".csv", row.join("\t") + " \n", 'utf-8')
        }) 
      }, this)
}
*/

function skipgrams(sequence, ngr, k, start, end)
{
  Tokenizer = require('natural').WordTokenizer,
  tokenizer = new Tokenizer();

  if (!_(sequence).isArray()) {
        sequence = tokenizer.tokenize(sequence);
    }
    
  var output = []

  _(k).times(function(n){
    _.each(sequence, function(value, key, list){ 
      var some = sequence.slice()
      some.splice(key, n+1)
      output = output.concat(natural.NGrams.ngrams(some, ngr, start, end))
    }, this)
  })

  output = output.concat(natural.NGrams.ngrams(sequence, ngr, start, end))

  output = _.map(output, function(num){ return num.join(",") });
  output = _.uniq(output)
  output = _.map(output, function(num){ return num.split(",") });

  return output 
}

function barint(ar1, ar2)
{
  ar1 =_.map(ar1, function(value){ return value.join(','); });
  ar2 =_.map(ar2, function(value){ return value.join(','); });
  
  return _.intersection(ar1, ar2)
}

function returnValues()
{

}

/*

[ [ 'Accept', 'i agree+ to with', [ 0, 4 ] ] ]

rules : [
    [
        [
            "Working Hours",
            "hours",
            [
                4,
                4
            ],
            [
                11,
                16
            ]
        ]
    ],
    [
        [
            "8 hours",
            "8",
            [
                3,
                3
            ],
            [
                9,
                10
            ]
        ],

depparsed: [
    {
        "num": "1",
        "word": "i",
        "lemma": "i",
        "pos": "FW",
        "pos1": "FW",
        "root": "3",
        "role": "nsubj"
    },


        */

function uniqueArray(array)
{
  var output = []
  _.each(array, function(elem, key, list){
    var pos = _.filter(output, function(num){ return _.isEqual(num, elem) });
    if (pos.length == 0)
        output.push(elem)
  }, this)
  return output
}

function buildlabel(ruled, depparse, intents)
{

  var output = []
  // console.log("beg")
  _.each(intents, function(intent, key1, list1){ 
    var intfound = false
    // console.log(intent)
    var intentbegin = intent[2][0] + 1
    var intentend = intent[2][1] + 1
    _(3).times(function(n){
      // console.log("times")
      // console.log(n)
      _.each(ruled[n], function(value, key, list){ 
          // console.log(value)
          var begin = value[2][0] + 1
          var end = value[2][1] + 1
          var found = false
          while (depparse[begin-1]['role']!='root') {
            // var next = _.findWhere(depparse, {"num": begin})
            // console.log(next)
            // begin = depparse[next]['root']
            // console.log(begin)
            if ((begin >= intentbegin) && (begin <= intentend))
              found = true
            begin = depparse[begin-1]['root']
            intfound = found
          }
          if (found)
            if (n==0)
              output.push([[intent[0]],[value[0]], []])
            if (n==1)
              output.push([[intent[0]],[],[value[0]]])
      }, this)
    })

  if (intfound == false)
    output.push([[intent[0]],[],[]])
  }, this)

  return output
}


function labelFilter(labels)
{
    // var lab = splitPartEqually(multilabelutils.normalizeOutputLabels(semval))
        // if (_.isEqual([intent,value],_.flatten(lab)))
  var output = []
  _.each(labels, function(orlabel, key, list){
    label = (splitPartEqually(multilabelutils.normalizeOutputLabels(JSON.parse(orlabel))))
    var champion = true
    _.each(labels, function(orlabel1, key1, list1){ 
      label1 = (splitPartEqually(multilabelutils.normalizeOutputLabels(JSON.parse(orlabel1))))
      if (key != key1)
        {
          // console.log("ocompare")
          // console.log(label)
          // console.log(label1)
          // console.log(label[0][0] == label1[0][0])
          // console.log(label[1][0] == label1[1][0])
          // console.log(label[2].length == 0)
          // console.log(label1[2].length != 0)
          if ((label[0][0] == label1[0][0]) && (label[1][0] == label1[1][0]) && (label[2].length == 0) && (label1[2].length != 0))
            {
            // console.log("trigger")
            champion = false
            }
        }
    }, this)  
    if (champion == true) output.push(orlabel)
  }, this)
  // console.log(output)
  // process.exit(0)
  return output
}

function treatstring(num, str, ind)
{
	if (num == 0) return num
	if (str[num] == " ") return num

		// console.log(str[num])
	if (str[num-1] != " ")
		{	
		var findex = num - str.substring(0, num).lastIndexOf(" ")
		var lindex = str.substring(num).indexOf(" ")
		// console.log("findex"+findex)
		// console.log("lindex"+lindex)

		if (ind == 'last')
			if (findex > lindex)
				return num + lindex + 1
			else
				return num - findex

		if (ind == 'first')
			if (findex > lindex)
				return num - findex
			else
				return num + lindex
		}

	return num
}
// { sentence: 'I said without leased car',
    // input: 'without leased car',
    // output: 'Without leased car' },
function convert_to_train(data)
{
	var newdataset = []
	_.each(data, function(value, key, list){ 
		_.each(value['output']['single_labels'], function(value1, key1, list){ 
			if (value1['position'][0].length != 0)
			_.each(value1['position'], function(value3, key3, list){
				// console.log(JSON.stringify(value3, null, 4))
				// console.log(JSON.stringify("INP", null, 4)) 
				// console.log(JSON.stringify(value['input'], null, 4))
				// console.log(JSON.stringify(value['input'][value3[0]], null, 4))
				// console.log(JSON.stringify(value['input'][value3[1]+1], null, 4))
				var sttt = value['input'].substring(treatstring(value3[0],value['input'], 'first'),treatstring(value3[1]+1,value['input'], 'last')).trim()
				if (sttt.length > 0)
					newdataset.push({
								'sentence': value['input'],
								'input': value['input'].substring(treatstring(value3[0],value['input'], 'first'),treatstring(value3[1]+1,value['input'], 'last')).trim(),
								'output': key1})
				// console.log(JSON.stringify({'input': value['input'].substring(value3[0],value3[1]+1),
								// 'output': key1}, null, 4))
			}, this)
		}, this)
	}, this)
	return newdataset
}

function convert_to_test(data)
{
	// var test = []

	_.each(data, function(record, key, list){ 
		_.each(record['output']['single_labels'], function(value1, key1, list1){
			if (value1['position'][0].length > 0)
				_.each(value1['position'], function(value2, key2, list2){
					if (value2[0]!=0) value2[0] = value2[0] + 1
					var str = record['input'].substr(0,value2[0])
					var spaces = str.split(" ")
					var innerspace = record['input'].substring(value2[0],value2[1] + 1).trim().split(" ")
					// console.log("str_before "+str)
					// console.log("inner text "+ innerspace)
					// console.log("coord:"+value2)
					// console.log("inner original:" +record['input'].substring(value2[0],value2[1] + 1))
					// console.log("spaces_start "+spaces.length)
					// console.log("inner_space"+ innerspavbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbce.length)
					data[key]['output']['single_labels'][key1]['position'][key2] = [spaces.length, spaces.length + innerspace.length]
			 	}, this) 
		}, this)
		// console.log(JSON.stringify(record, null, 4))
	}, this)

// console.log("DATA")
// console.log(JSON.stringify(data, null, 4))
// console.log()
// process.exit(0)
	return data
}

function intersection(begin, end)
{
	if ((begin[0]<=end[0])&&(begin[1]>=end[0]))
		return true
	if ((begin[0]>=end[0])&&(begin[0]<=end[1]))
		return true
	return false
}

function extractactual(data)
{
	// if (data.length == 0) return []
	var acdata = []
	_.each(data['explanation'], function(value, key, list){ 
		// console.log(value)
		// process.exit(0)
		acdata.push([value[0],value[2]])
	}, this)
	return acdata
}

function sequencetest(original)
{
	var classes = []
	_.each(original['single_labels'], function(value, key, list){ 
		if (_.flatten(value['position']).length > 0)
			classes.push(key)
	}, this)
	return classes
}

function deal(classes, classifier, parts, explanations, original)
{
	// console.log(parts)
	// console.log(JSON.stringify(classes, null, 4))
	// console.log(JSON.stringify(explanations, null, 4))
	// console.log(JSON.stringify(original, null, 4))

	var convertedexp = []
	_.each(explanations, function(value, key, list){ 
		value[1] = value[1].replace(" 'end'", "")
		value[1] = value[1].replace("'start' ", "")
		convertedexp.push([value[0],[parts.indexOf(value[1]), parts.indexOf(value[1])+value[1].length]])
	}, this)

	// console.log(convertedexp)
	var classes = []
	_.each(convertedexp, function(value, key, list){ 
		if (value[0] in original['single_labels'])
			_.each(original['single_labels'][value[0]]['position'], function(value1, key, list){ 
				if (intersection(value1, value[1]))
					classes.push(value[0])
			}, this)
	}, this)

	return classes
	// console.log(classes)
	// process.exit(0)
}

function average(list)
	{
		var sum = _.reduce(list, function(memo, num){ return memo + num; }, 0);
		return sum/list.length
	}

function extractturnssingle(dataset)
	{
		data = []
		_.each(dataset, function(value, key, list){ 
			_.each(value['turns'], function(set, key1, list1){ 

				if ('output' in set)
					{
					_.each(set['parts'], function(value2, key2, list2){ 
						// if (value2['input'].split(" ").length > 3)
						data.push({'input': value2['input'], 'output': value2['output']})
					}, this)
					}
				}, this)
		}, this)
		return data
	}

/*
extract only active turns from dataset that active
*/
// set['input'] = set['input'].replace(/[^\x00-\x7F]/g, "")

function filterturn(turn)
{
  if (intent_field in turn)
  {
    if (turn['output'].length > 0)
    {
     if (Object.keys(turn[intent_field]).length > 0) 
      return turn
    }
    else
      return turn
  }
  else
    return turn

return []
}

function isactivedialogue(dial)
{
    if ('status' in dial)
    {
      if (_.isArray(dial['status']))
        {
          if ((dial['status'].indexOf('goodconv') != -1) || (dial['status'].indexOf('paraconv') != -1))
            return true
          else
            return false
        }
      if (_.isString(dial['status']))
        { 
          if ((dial['status'] == 'goodconv') || (dial['status'] == 'paraconv'))
            return true
        }
        return false
    }
  else return true
}


function ispermittedturn(turn)
{
  var permitted = true
  // var forbid = ['Query', 'compromise', 'accept', 'Leased Car']
  var forbid = ['Query', 'compromise', 'accept']
  var output = []
  _.each(turn['output'], function(label, key, list){ 
    var lablist = splitJson(label)
      output = output.concat(lablist)  
  }, this)

  var match = _.filter(output, function(elem){ return forbid.indexOf(elem) != -1; });
  if (match.length != 0)
    permitted = false

  if (intent_field in turn)
  {
    if ('Offer' in turn[intent_field])
    {
      if (turn[intent_field]['Offer'] == 'DEFAULT INTENT')
        permitted = false    
    }
  }
  return permitted
}

function isnotokaccept(turn)
{
  // if (!isactiveturn(turn)) return false
  // if (!ishumanturn(turn)) return false
  // if (!isseqturn(turn)) return false
  // if (!ispermittedturn(turn)) return false

  var ok = ['Ok','OK','okay','ok', 'Ok.','Okay', 'yes', 'yes.','YES']
  var no = ['NO','No','no']
  var intents = Hierarchy.splitPartEquallyIntent(turn['output'])
  var unig = _.flatten(natural.NGrams.ngrams(turn['input'], 1))

  if (_.filter(unig, function(num){ return ok.indexOf(num) != -1 }).length > 0)
  {
    if (_.isEqual(intents, ['Accept']))
      return false
  }

  if (_.filter(unig, function(num){ return no.indexOf(num) != -1 }).length > 0)
  {
    if (_.isEqual(intents, ['Reject']))
      return false
  }
  
  return true
}

function isactiveturn(turn)
{
  if ('status' in turn)
  {
    if (_.isArray(turn['status']))
      if (turn['status'].indexOf('active') != -1)
        return true
      else
        return false
    else
      if (turn['status'] == 'active')
        return true
      else
        return false
    return false
  }
  else
  {
    return false
  }
}

function ishumanturn(turn)
{
  if ('user' in turn)
  {
    if (turn['user'].match(/Agent/g) == undefined )
      return true
    else
      return false
  }
  else
    return true
} 

function isseqturn(turn)
{
  // if (intent_field in turn)
  // {
    if (('output' in turn) && (_.isArray(turn['output'])) == true)
      {
        if (turn['output'].length == 1)
          return true
      }
    else
      return false
  // }
  // else
    // return false
}

function isgoodturn(turn)
{  
  if (isactiveturn(turn) && ishumanturn(turn) && isseqturn(turn) /*single label*/ && ispermittedturn(turn) /*no accept no DEFAULT INTENT*/ )
    // return isnotokaccept(turn)
    return true
  return false
}

function isoutput(turn)
{
  if (_.isArray(turn['output']))
    if (turn['output'].length > 0)
      return true
  return false
}

function isgoodturn_test(turn)
{
  return (isactiveturn(turn) && ishumanturn(turn) && isoutput(turn))
}

function extractdatasetallturns(dataset)
{
  var output = []
  _.each(dataset, function(dial, key, list){ 
    output = output.concat(extractdialall(dial))
  }, this)
  return output
}

function extractdialall(dialogue)
{
  var output = []
  _.each(dialogue['turns'], function(turn, key, list){ 
    if (isgoodturnall(turn))
      output.push(turn)
  }, this)
  return output
}

function isgoodturnall(turn)
{  
  // if (isactiveturn(turn) && ishumanturn(turn) && isseqturn(turn) && ispermittedturn(turn))
  if (isactiveturn(turn) && ispermittedturn(turn) && isseqturn(turn))
    return true
    // return isnotokaccept(turn)
  return false
}

function extractdial(dialogue)
{
  var output = []
  _.each(dialogue['turns'], function(turn, key, list){ 
    if (isgoodturn(turn))
      output.push(turn)
  }, this)
  return output
}

function extractdial_test(dialogue)
{
  if (dialogue['status'].indexOf("badconv") == -1)
    return []

  var output = []
  _.each(dialogue['turns'], function(turn, key, list){ 
    if (isgoodturn_test(turn))
      output.push(turn)
  }, this)
  return output
}

function extractdataset(dataset)
{
  var output = []
  _.each(dataset, function(dial, key, list){ 
    output = output.concat(extractdial(dial))
  }, this)
  return output
}

function extractintent(dataset, intent)
{
  dataset = _.flatten(dataset)
  var output = []

  _.each(dataset, function(dial, key, list){ 
    if (Hierarchy.splitPartEquallyIntent(dial['output']).indexOf(intent) != -1)
      output.push(dial)
  }, this)

  return output
}

// take all dialogues where number of utterances is exceeds min
function filterdataset(dataset, min)
{
  var output = []
  _.each(dataset, function(dial, key, list){
     if (extractdial(dial).length >= min)
      output.push(dial)
  }, this)
  return output
}

function extractturnsold(dataset)
	{
		data = []
		_.each(dataset, function(value, key, list){ 
        if ('status' in value)
          {
          if (value['status'].indexOf("goodconv") != -1)
            {
        			_.each(value['turns'], function(set, key, list){ 
                if (set['user'].match(/Agent/g) == undefined)
                {
          				if (('output' in set) && (_.isArray(set['output'])) == true)
                    if ('status' in set)
                      {
                        if (_.isArray(set['status'] == true))
                        {
                          if (set['status'].indexOf("active") != -1)
                            data.push(filterturn(set))
                          else
                            data.push(filterturn(set))
                        }
                        else
                        {
                          if (set['status'] == 'active')
                            data.push(filterturn(set))
                        }
                      }
                    else
                      data.push(filterturn(set))
                }
        			}, this)
            }
          }
          else
          {
            _.each(value['turns'], function(set, key, list){ 
                  if (('output' in set) && (_.isArray(set['output'])) == true)
                    if ('status' in set)
                      {
                        if (_.isArray(set['status'] == true))
                        {
                          if (set['status'].indexOf("active") != -1)
                            data.push(filterturn(set))
                        }
                        else
                        {
                          if (set['status'] == 'active')
                            data.push(filterturn(set))
                        }
                      }
                    else
                      data.push(filterturn(set))
              }, this)
          }
		}, this)

		return _.compact(_.flatten(data))
	}

// function extractkeyphrasesgold(dataset)
//   {
//     data = []
//     _.each(dataset, function(value, key, list){ 
//       _.each(value['turns'], function(set, key, list){ 
//         if ('intent_keyphrases_gold' in set)
//           data.push(set[''])
//         }, this)
//     }, this)
//     return data
//   }


function isDialogue(dataset)
	{
	return _.isArray(dataset[0])
	}


function comparelabels(labels1, labels2)
{


	var result = []
	_.each(labels1, function(value, key, list){ 
		if (key in labels2)
			{
			result.push([key, ((value['F1']!=-1) ? value['F1'] : 0) - ((labels2[key]['F1'] != -1) ? labels2[key]['F1'] : 0), value['TP']+value['FN']])
			}
			// result[key] = value['F1'] - labels2[key]['F1']
	}, this)

	result = _.sortBy(result, function(num){ return num[1];})
	result = _.filter(result, function(num){ return num[1]!=0 });

	return result
}

function filteraccept(dataset)
	{
	// var datasetfiltered = []
	_.each(dataset, function(value, key, list){ 
		// var bo = true
		var labels = []
		_.each(value['output'], function(value1, key1, list1){
			if (value1.indexOf("previous") == -1)
				// bo = false
				labels.push(value1)
		}, this)
		// if (bo)
			// datasetfiltered.push(value)
		dataset[key]['output'] = labels
	}, this)
	return dataset
	}
function sentenceStem(sentence)
{
	sentence = sentence.replace(/\%/," percent");
	sentenceout = []

	_.each(sentence.split(" "), function(word, key, list){ 
		stem = natural.PorterStemmer.stem(word)
		if (stem.length == 0)
			sentenceout.push(word)
		else
			sentenceout.push(stem)
	}, this)
	
	return 	sentenceout
}

/*
translates 20,000 NIS to 20000
*/
function translateLabel(label)
{
var lablist = splitJson(label)
if (lablist.length == 3 )
	if (lablist[2] in ValueTransition)
		{
		lablist[2] = ValueTransition[lablist[2]]
		return Hierarchy.joinJson(lablist)
		}
return label
}

function retrievelabels()
{
	lis = []
	_.each(semlang, function(value, key, list){ 
		lablist = splitJson(value)
		_.each(lablist, function(labitem, key, list){ 
			lis.push(labitem)
		}, this)
	}, this)
	return _.uniq(lis)
}

function retrievelabelsbytypes()
{
	lis = []
	_.each(newsemlang, function(value, key, list){ 
		lablist = splitJson(value)
		console.log(lablist)
		process.exit(0)
		_.each(lablist, function(labitem, key, list){ 
			lis.push(labitem)
		}, this)
	}, this)
	return _.uniq(lis)
}

function convertlabeltree()
{
	labels = []
	_.each(labeltree, function(attval, intent, list){ 
		_.each(attval, function(value, attr, list){
			if (Object.keys(value).length != 0)
				{ 
				_.each(value, function(value1, key, list){ 
						labels.push([intent,attr,key])
				}, this)
				}
			else
				labels.push([intent,attr])
		},this)
	}, this)
	return labels
}


// module.exports.expl_struct = function(explanation)
function expl_struct(explanation)
{
	exp = []

	_.each(explanation, function(value, key, list){ 
		if (typeof(value)==="object")
			exp.push(value)
	}, this)


	list = []
	listpos = []

	list.push(_.pluck(exp, 'positive'))
	list.push(_.pluck(exp, 'negative'))

	// poslist = _.pluck(exp, 'positive')
	_.each(list, function(poslist, key, list){ 
		pos = {}

	// concat same labels 
	_.each(poslist, function(hashlab, key, list){
		_.each(hashlab, function(weightlist, lab, list){
			if (!(lab in pos))
				pos[lab] = []
			// pos[lab] = pos[lab].concat(weightlist)
			_.each(weightlist, function(wei, key, list){
				even = _.find(pos[lab], function(num){ return num[0] == wei[0]; });
				// console.log(even)
				// process.exit(0)
				if ((typeof(even)!="undefined"))
					{
					_.each(pos[lab], function(value5, key5, list){
						if (_.isEqual(value5,even))
							pos[lab][key5][1] =  pos[lab][key5][1] + wei[1]
					}, this)
					}
				else
					pos[lab].push(wei)
			}, this)
		 }, this) 
	}, this)

	listpos.push(pos)
}, this)



	hashpos = 
	{
		'positive': listpos[0],
		'negative': listpos[1]
	}
	// // merge same weight and aggreagde values
	// _.each(pos, function(weigths, lab, list){
	// 	_.each(weigths, function(wei, key, list){ 
	// 		_.each(weigths, function(wei1, key1, list){ 
	// 			if ((wei[0] == wei1[0])&& (key != key1))
	// 				pos[lab][key][1] = pos[lab][key][1] + pos[lab][key1][1]
	// 		}, this)
	// 	 }, this) 
	// }, this)

	// console.log(JSON.stringify(hashpos, null, 4))

	// console.log(JSON.stringify(ab, null, 4))

	// bc = _.extend(ab[0], ab[1])

	// console.log(JSON.stringify(bc, null, 4))
	// // console.log(exp)
	// process.exit(0)
	return hashpos
}

// module.exports.aggregate_results = function(stats)
function aggregate_results(stats)
{
	results = _.reduce(stats, function(memo, obj) {
	  return {
	    F1: memo.F1 + obj.F1,
	    Precision: memo.Precision + obj.Precision,
	    Recall: memo.Recall + obj.Recall,
	    Accuracy: memo.Accuracy + obj.Accuracy,
	  };
	}, {F1: 0, Precision: 0, Recall: 0, Accuracy: 0})

	_.each(results, function(value, key, list){ 
		results[key] = value/stats.length
		}, this)
	return results
}

function find_path(mat)
{
	var d = []
	d[mat.length - 1] = 0//mat[mat.length -2][mat.length-1]
	d[mat.length - 2] = mat[mat.length -2][mat.length-1]
	// console.log(mat.length - 3)
	// console.log(_.range(mat.length - 3, -1, -1))
	_.each(_.range(mat.length - 3, -1, -1), function(value1, key, list){ 
	// }, this)
	// _(mat.length - 2).times(function(n){
		var buf = []
		// _.each(mat, function(value, key, list){ 
		// }, this)
		// _(n).times(function(nn){
			// if ()/
		// })
		// console.log("value1"+value1)
		_.each(_.range(value1+1, mat.length, 1), function(value, key, list){ 
			// console.log("value"+value)
			// console.log("mat"+mat[value1][value])
			// if ((mat[value1][value]!=0)&&(mat[value1][value]!=Infinity))
			if ((mat[value1][value]!=Infinity))
				buf.push(mat[value1][value]+d[value])
		}, this)
		// console.log("123")
		// console.log(buf)
		// process.exit(0)
		d[value1] = _.max(buf, function(i){ return i });

	}) 

	// console.log(d)
	
	var v = 0
	var path = [v]
	while (d[v] != 0)
   	{
   		// for each edge (v,u):
   		lo=true
   		_.each(_.range(v+1, mat.length,1), function(u, key, list){ 
   			if (lo)
   			{
   			console.log("d[v]="+d[v])
   			console.log("mat[v][u]="+mat[v][u])
   			console.log("d[u]="+d[u])
        	}
        	if ((d[v] - mat[v][u] == d[u])&&(lo))
            	{
            	path.push(u)
				console.log("u"+u)
				console.log(path)
            	// console.log(v)
            	// process.exit(0)
            	v = u
            	lo=false
             // break
             	}
   		}, this)

    }
	// return list

	console.log(path)
	return d
}

function generate_string(words)
{

	var list = []
	if (words.length < 2) return [words.join(" ")]
	for (var i = 0; i <= words.length; i++) 
		for (var j = i + 1; j <= words.length; j++) 
			list.push(words.slice(i, j).join(" "))

	return list
}

function truth_sentence(sentence)
{

	if (sentence == "'start'") return sentence
	if (sentence == "'end'") return sentence

	var start = 0
	var end = 0

	if (sentence.indexOf("'start'") != 1)
		start = 1
	
	if (sentence.indexOf("'end'") != 1)
		end = 1

	sentence = sentence.replace("['start']", "")
	sentence = sentence.replace("'start'", "")
	sentence = sentence.replace("['end']", "")
	sentence = sentence.replace("'end'", "")
	sentence = sentence.trim()

	var sentencelist = []
	var sentencevocab = fs.readFileSync('truthteller/truth_teller/examples.txt').toString().split("\n");
	console.log(sentence)
	var index = sentencevocab.indexOf(sentence)
	console.log(index)
	console.log(complement_number(index + 1, 5))
	var lines = fs.readFileSync('truthteller/truth_teller/annotatedSentences/sentence_' + complement_number(index + 1, 5) + '.cnt').toString().split("\n");
	lines.pop()
	lines.pop()

	_.each(lines, function(line, key, list){
		sentencelist.push(line.split('\t')) 
		// console.log(line.split('\t').length)
	}, this)

	_.each(sentencelist, function(row, key, list){ 
		if ((row[3] == 'VERB') && (row[13] == "N"))
			sentence = sentence.replace(row[1], row[1]+"&"+row[13]);

		if ((row[3] == 'NOUN') && (row[11] == "N"))
			sentence = sentence.replace(row[1], row[1]+"&"+row[11]);

	}, this)

	if (start == 1)
		sentence = "'start' " + sentence

	if (end == 1)
		sentence = sentence + " 'end'"

	return sentence
}

function complement_number(num, digits)
{
	var numstr = num.toString()
	while (numstr.length < digits) {
    	numstr = '0'+numstr
    }
    return numstr
}

function aggreate_similar(list)
{
	var buf = []
	var str = ""
	var clean = []

	_.each(list, function(value, key, list){ 
		// should be Offer and (either it's first or it's continue)
		if ((value[0]=='Offer')&&((buf.length==0)||(buf[buf.length-1][2][1] == value[2][0])))
			{
				buf.push(value)
				str = str + " " + value[1]
			}
		else
			{
				if (buf.length!=0) 
					clean.push(['Offer',str.trim(),[buf[0][2][0], buf[buf.length-1][2][1]], _.map(buf, function(num){return num[3]})])				
					// clean.push(['Offer',str,[buf[0][2][0], buf[buf.length-1][2][1]]])				

				buf = []
				str = ""

				if (value[0]=='Offer')
				{
				buf.push(value)
				str = str + " " + value[1]		
				}
				else
				{
				clean.push(value)					
				}


			}

	}, this)
	if (buf.length!=0)
		clean.push(['Offer',str.trim(),[buf[0][2][0], buf[buf.length-1][2][1]], _.map(buf, function(num){return num[3]})])
		// clean.push(['Offer',str,[buf[0][2][0], buf[buf.length-1][2][1]]])
	return clean
}

// divide dataset to 
// - where output is just one labels
// - where output is more than one label 
function dividedataset(dataset)
{
	var datasetd = {'one':[], 'two':[]}

	_.each(dataset, function(value, key, list){ 
		if (value.output.length == 1)
			datasetd['one'].push(value)
		else
			datasetd['two'].push(value)

	}, this)

	return datasetd
}


function aggregate_sagae_no_completition(classes, classifier, parts, explanations, original)
{
return aggregate_sagae(classes, classifier, parts, explanations, original, false)
}

function aggregate_sagae_completition(classes, classifier, parts, explanations, original)
{
return aggregate_sagae(classes, classifier, parts, explanations, original, true)
}


// function aggregate_sagae_improved(classes, classifier, parts, explanations, original)
// {
// 	var completition = true
// 	var clas = []

// 	explanations[0] = aggreate_similar(explanations[0])
// 	// explanations[0] = filterreject(explanations[0])
// 	// explanations[2] = filterreject(explanations[2])

// 	console.log("utterance")
// 	console.log(JSON.stringify(parts, null, 4))
// 	console.log("explanation")
// 	console.log(JSON.stringify(explanations, null, 4))
	

// 	_.each(explanations[2], function(value, key, list){
// 		clas.push([[],[],[value[0]]])
// 	})
// 	_.each(explanations[0], function(intent, key, list){ 
// 		// if (intent[0] != null)
// 			clas.push([[intent[0]],[],[]])
		
// 		_.each(explanations[2], function(value, key, list){ 
// 			// if ((intent[2][0]-1<=value[2][0])&&(intent[2][1]+1>=value[2][1]))
// 			if ((intent[2][0]<=value[2][0])&&(intent[2][1]>=value[2][1]))
// 				{
// 				if ((intent[0]!=null)&&(value[0]!=null))
// 				clas.push([[intent[0]],[], [value[0]]])
// 				}
// 		}, this)

// 		_.each(explanations[1], function(attr, key, list){ 
// 			// if ((intent[2][0]-1<=attr[2][0])&&(intent[2][1]+1>=attr[2][1]))
// 			if ((intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][1]))
// 				if ((intent[0]!=null)&&(attr[0]!=null))
// 					clas.push([[intent[0]],[attr[0]], []])

// 			_.each(explanations[2], function(value, key, list){ 
// 				// if ((attr[2][0]-1<=value[2][0])&&(attr[2][1]+1>=value[2][1])&&
// 					// (intent[2][0]-1<=attr[2][0])&&(intent[2][1]+1>=attr[2][1]))
// 				if ((attr[2][0]<=value[2][0])&&(attr[2][1]>=value[2][1])&&
// 					(intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][1]))
// 					if ((intent[0]!=null)&&(attr[0]!=null)&&(value[0]!=null))

// 						clas.push([[intent[0]],[attr[0]], [value[0]]])
// 			}, this)
// 		}, this)
				
// 	}, this)

// // console.log(clas)

	
// 	var js = []
// 	_.each(clas, function(lab, key, list){ 
// 		// if (completition)
// 			var res = resolve_emptiness(lab)
// 			// console.log(res)
// 			js = js.concat(generate_possible_labels(res))
// 			// console.log(js)
// 		// else
// 			// js = js.concat(generate_possible_labels((lab)))

// 	}, this)

// 	console.log("composite label:")
// 	console.log(JSON.stringify(_.uniq(js), null, 4))
// 	console.log("gold composite label:")
// 	console.log(JSON.stringify(original, null, 4))
// 	console.log()
// 	// process.exit(0)
// 	return _.uniq(js)
// }

function filterreject(list)
{
	var	placereject = false 
	var	car = false 
	_.each(list, function(value, key, list){ 
			// should be Offer and (either it's first or it's continue)
			if (value[0]=='Without leased car')
				car = true
			if ((value[0]=='With leased car') && (car))
				list[key][0] = 'Without leased car'
			
			if (value[0]=='Reject')
					placereject = true
			if ((value[0]=='Accept') &&  (placereject))
					list[key][0] = 'Reject'
		})
	return list
}



function getlabelhier()
{
lis = {}
	_.each(semlang, function(value, key, list){ 
		lablist = splitJson(value)
		// console.log(la/blist)
		// process.exit(0)
		if (!(lablist[1] in lis)) lis[lablist[1]] = []
			lis[lablist[1]].push(lablist[2])
		
		lis[lablist[1]] = _.uniq(lis[lablist[1]])

		// _.each(lablist, function(labitem, key, list){ 
			// lis.push(labitem)
		// }, this)
	}, this)
	return lis
}

function filterValues(values)
{
  var out = []
  var lista = ['accept', 'compromise', 'issues', 'bid']
  _.each(values, function(value, key, list){
    if (lista.indexOf(value[0])!=-1)
      out.push(value)
  }, this)
  return out
}

function hasRoot(depparse)
{
  var root = false
  _.each(depparse, function(value, key, list){
    if (value['role'] == 'root')
      root = true 
  }, this)
  return root
}

function filterzerofeatures(intens)
{

  _.each(intens, function(intent, key, list){ 
    if (_.isArray(intent[3]))
    {
    _.each(intent[3], function(subintent, subkey, list){ 
      _.each(subintent, function(features, intentname, list){ 
        intens[key][3][subkey][intentname] = _.filter(features, function(num){ return ((num[1] != 0) && (num != 0)) });
      }, this)
    }, this)
    }
    else
    {
      _.each(intent[3], function(features, intentname, list){ 
         intens[key][3][intentname] = _.filter(features, function(num){ return ((num[1] != 0) && (num != 0)) });
      }, this)
    }

  }, this)
  return intens
}

function aggregate_rilesbased(classes, classifier, parts, explanations, original, classifier, initial)
{
  var rules = require("../research/rule-based/rules.js")
	var ppdb = require("../research/ppdb/utils.js")

  console.log("-------------------------------------") 
 
  nopuntc = initial.replace(/\./g,"")

  var fiber = Fiber.current;
  ppdb.cachepos(nopuntc, function(err, response){
    fiber.run(response)
  })
  var tag = Fiber.yield()
  // console.log("tag" + tag)
  
  ppdb.dep(tag, function(response){
    fiber.run(response)
  })
  var dep = Fiber.yield()

  if (!(hasRoot(dep)))
    return null

  // console.log("dep")
  // console.log(dep)

	var data = rules.findData(initial)

	explanations[0] = filterzerofeatures(aggreate_similar(explanations[0]))
  explanations[1] = data[0]
  explanations[2] = data[1].concat(filterValues(explanations[2]))
  var clas = []

  // console.log(JSON.stringify("normalized "+parts, null, 4))
  // console.log(JSON.stringify("initial "+initial, null, 4))
  // console.log("data")
  // console.log(JSON.stringify(data, null, 4))
  // console.log("gold")
  // console.log(JSON.stringify(original, null, 4))
  // console.log("actual")
  // console.log(JSON.stringify(_.uniq(js), null, 4))
  // console.log(JSON.stringify(explanations, null, 4))

  if (explanations[0].length == 0)
    explanations[0].push(["Offer","offer",[0,100],[0,100]])

	// _.each(explanations[2], function(value, key, list){
    // clas.push([[],[],[value[0]]])
  // })
  // _.each(explanations[0], function(intent, key, list){ 
  //   if (intent[0] != null)
  //     clas.push([[intent[0]],[],[]])

  //   // _.each(explanations[1], function(attr, key, list){ 
  //     // if ((intent[2][0]-1<=value[2][0])&&(intent[2][1]+1>=value[2][1]))
  //     // if ((intent[2][0]<=value[2][0])&&(intent[2][1]>=value[2][1]))
  //     // if (((intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][0])) ||
  //       // ((intent[2][0]<=attr[2][1])&&(intent[2][1]>=attr[2][1]))
  //       // )
  //       // {
  //       // clas.push([[intent[0]],[attr[0]], []])
  //       // }
  //   // }, this)
    
  //   _.each(explanations[2], function(value, key, list){ 
  //     // if ((intent[2][0]-1<=value[2][0])&&(intent[2][1]+1>=value[2][1]))
  //     if ((intent[2][0]<=value[2][0])&&(intent[2][1]>=value[2][1]))
  //       {
  //       if ((intent[0]!=null)&&(value[0]!=null))
  //       clas.push([[intent[0]],[], [value[0]]])
  //       }
  //   }, this)

  //   _.each(explanations[1], function(attr, key, list){ 
  //     // if ((intent[2][0]-1<=attr[2][0])&&(intent[2][1]+1>=attr[2][1]))
  //     if ((intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][1]))
  //       if ((intent[0]!=null)&&(attr[0]!=null))
  //         clas.push([[intent[0]],[attr[0]], []])

  //     _.each(explanations[2], function(value, key, list){ 
  //       // if ((attr[2][0]-1<=value[2][0])&&(attr[2][1]+1>=value[2][1])&&
  //         // (intent[2][0]-1<=attr[2][0])&&(intent[2][1]+1>=attr[2][1]))
  //       if ((attr[2][0]<=value[2][0])&&(attr[2][1]>=value[2][1])&&
  //         (intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][1]))
  //         if ((intent[0]!=null)&&(attr[0]!=null)&&(value[0]!=null))

  //           clas.push([[intent[0]],[attr[0]], [value[0]]])
  //     }, this)
  //   }, this)
  // }, this)

  // console.log(clas)
  // process.exit(0)


  // console.log(explanations[0])
// console.log("comming")
 var clas = buildlabel(data, dep, explanations[0])

 // console.log("CLASS")
 // console.log(JSON.stringify(clas, null, 4))

 var js = []
  _.each(clas, function(lab, key, list){ 
    // if (completition)
      // {
      var res = resolve_emptiness_rule(lab)
      js = js.concat(generate_possible_labels(res))
      // }
      // console.log(js)
    // else
      // js = js.concat(generate_possible_labels((lab)))

  }, this)

  // console.log("before labelFilter")
  js = labelFilter(js)
  // console.log("after labelFilter")

  // console.log(js)

  // console.log(_.uniq(js))
  // console.log()
  // process.exit(0)

  // console.log("composite label:")
  // console.log(JSON.stringify(_.uniq(js), null, 4))
  // console.log("gold composite label:")
  // console.log(JSON.stringify(original, null, 4))

_.sortBy([1, 2, 3, 4, 5, 6], function(num){ return Math.sin(num); });


  if (_.isEqual(_.sortBy(original, function(n){return n}), _.sortBy(_.uniq(js), function(n){return n})) == false)
  {
    console.log("initial")
    console.log(initial)
    console.log("gold")
    console.log(JSON.stringify(original, null, 4))
    console.log("actual")
    console.log(JSON.stringify(_.uniq(js), null, 4))
    console.log("tagging")
    console.log(tag)
    console.log("depparsing")
    console.log(dep)
    console.log("rules")
    console.log(JSON.stringify(data, null, 4))
    console.log("intents")
    console.log(JSON.stringify(explanations[0], null, 4))
  }
  // else
  // {
    // console.log("everything is correct")
  // }
  
  return _.uniq(js)
}
/*
INPUT
OUTPUT
*/
function aggregate_sagae(classes, classifier, parts, explanations, original, completition)
{
	var clas = []


	
	explanations[0] = aggreate_similar(explanations[0])
	// explanations[0] = filterreject(explanations[0])
	// explanations[2] = filterreject(explanations[2])
	// console.log("utterance")
	// console.log(JSON.stringify(parts, null, 4))
	// console.log("explanation")
	// console.log(JSON.stringify(explanations, null, 4))
	
	_.each(explanations[2], function(value, key, list){
		clas.push([[],[],[value[0]]])
	})
	_.each(explanations[0], function(intent, key, list){ 
		if (intent[0] != null)
			clas.push([[intent[0]],[],[]])

		// _.each(explanations[1], function(attr, key, list){ 
			// if ((intent[2][0]-1<=value[2][0])&&(intent[2][1]+1>=value[2][1]))
			// if ((intent[2][0]<=value[2][0])&&(intent[2][1]>=value[2][1]))
			// if (((intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][0])) ||
				// ((intent[2][0]<=attr[2][1])&&(intent[2][1]>=attr[2][1]))
				// )
				// {
				// clas.push([[intent[0]],[attr[0]], []])
				// }
		// }, this)
		
		_.each(explanations[2], function(value, key, list){ 
			// if ((intent[2][0]-1<=value[2][0])&&(intent[2][1]+1>=value[2][1]))
			if ((intent[2][0]<=value[2][0])&&(intent[2][1]>=value[2][1]))
				{
				if ((intent[0]!=null)&&(value[0]!=null))
				clas.push([[intent[0]],[], [value[0]]])
				}
		}, this)

		_.each(explanations[1], function(attr, key, list){ 
			// if ((intent[2][0]-1<=attr[2][0])&&(intent[2][1]+1>=attr[2][1]))
			if ((intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][1]))
				if ((intent[0]!=null)&&(attr[0]!=null))
					clas.push([[intent[0]],[attr[0]], []])

			_.each(explanations[2], function(value, key, list){ 
				// if ((attr[2][0]-1<=value[2][0])&&(attr[2][1]+1>=value[2][1])&&
					// (intent[2][0]-1<=attr[2][0])&&(intent[2][1]+1>=attr[2][1]))
				if ((attr[2][0]<=value[2][0])&&(attr[2][1]>=value[2][1])&&
					(intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][1]))
					if ((intent[0]!=null)&&(attr[0]!=null)&&(value[0]!=null))

						clas.push([[intent[0]],[attr[0]], [value[0]]])
			}, this)
		}, this)
				
	}, this)

	// console.log(clas)
	// process.exit(0)
	
	var js = []
	_.each(clas, function(lab, key, list){ 
		if (completition)
			{
			var res = resolve_emptiness(lab)
			// console.log(res)
			js = js.concat(generate_possible_labels(res))
			}
			// console.log(js)
		else
			js = js.concat(generate_possible_labels((lab)))

	}, this)



	// console.log("composite label:")
	// console.log(JSON.stringify(_.uniq(js), null, 4))
	// console.log("gold composite label:")
	// console.log(JSON.stringify(original, null, 4))
	
	return _.uniq(js)
}


function compareresults(classifier1, result1, classifier2, result2)
{
	_(result1.length).times(function(n){
		if (!(_.isEqual(result1[n], result2[n])))
			{
				console.log(classifier1)
				console.log(JSON.stringify(result1[n], null, 4))
				console.log(classifier2)
				console.log(JSON.stringify(result2[n], null, 4))
				console.log("+++++++++++++++++++++++++++++++++++")
			}
	})
}

function aggregate_lab(explanations, inputngram, inputnorm)
// function exports.aggregate_lab = function(explanations, inputngram, inputnorm)
{

	tags = convertlabeltree()

	senlabel =  {}
	_.each(explanations['positive'], function(value, label, list){
		// _.each(sample.replace(/\,/g,"").split(" "), function(value1, key, list){ 
		_.each(inputngram, function(value1, feature, list){ 
			var element = _.find(value, function(num){ return num[0]==feature; });
			if (element)
				{
				if (!(label in senlabel))
					senlabel[label] =  new DefaultDict(0);

				senlabel[label].set(feature, senlabel[label].get(feature) + element[1])
				}
		}, this)
	}, this)

	pop = []

	//treating bigrams
	_.each(senlabel, function(setofgrams, label, list){ 
			_.each(setofgrams['_'], function(value, gram, list){ 
				if (gram.split(" ").length>1)
					_.each(gram.split(" "), function(unigram, key, list){
						senlabel[label]['_'][unigram] = senlabel[label]['_'][unigram]+value
					}, this)
			}, this)
		}, this)

	return senlabel

}

function aggregate_label_trick(classes, classifier, sample, explanations, original, classifier_compare)
{
	draw = true
	return aggregate_label(classifier, sample, explanations, true, draw, original, classifier_compare)
}


function aggregate_label_no_trick(classes, classifier, sample, explanations, original, classifier_compare)
{
	draw = false
	return aggregate_label(classifier, sample, explanations, false, draw, original, classifier_compare)
}

// module.exports.aggregate_label = function(explanations, inputngram, inputnorm)
// module.exports.aggregate_label = function(classifier, sample, explanations)
function aggregate_label(classifier, sample, explanations, trick, draw, original, classifier_compare)
// exports.aggregate_label = function(classifier, sample, explanations)
{
	var inputngram = classifier.sampleToFeatures(classifier.normalizedSample(sample), classifier.featureExtractors)
	var inputnormal = classifier.normalizedSample(sample)
	
	inputnormal = inputnormal.replace(/\,/g," ,")
	inputnormal = inputnormal.replace(/\./g," .")
	inputnormal = inputnormal.replace(/\?/g," ?")
	inputnormal = inputnormal.replace(/\!/g," !")
	inputnormal = inputnormal.replace(/\%/g," %")
	inputnormal = inputnormal.replace(/\$/g," $")

	console.log(sample)

	clas = classifier_compare.classify(sample, 5 ,true)

	var claslist = []
	// _.each(explanations['positive'], function(value, key, list){ 
		// claslist.push(key)
	// }, this)
	// console.log(Object.keys(explanations['positive']))
	labels = generate_possible_labels(resolve_emptiness(bag_of_labels_to_components(Object.keys(explanations['positive']))))
	
	labscor = []
	_.each(labels, function(lab, key, list){ 
		labscor.push([lab,clas['scores'][lab]])
	}, this)
	// _.each(claslist, function(value, key, list){ 
		// bag_of_labels_to_components
	// }, this)
// console.log(labels)
// process.exit(0)
	// console.log(_.extend(explanations['positive'],explanations['negative']))
	// process.exit(0)

	var senlabel =  {}
	_.each(explanations['positive'], function(value, label, list){
	// _.each(_.extend(explanations['positive'],explanations['negative']), function(value, label, list){
		// _.each(sample.replace(/\,/g,"").split(" "), function(value1, key, list){ 
		_.each(inputngram, function(value1, feature, list){ 
			var element = _.find(value, function(num){ return num[0]==feature; });
			if (element)
				{
				if (!(label in senlabel))
					senlabel[label] =  new DefaultDict(0);

				senlabel[label].set(feature, senlabel[label].get(feature) + element[1])
				}
		}, this)
	}, this)

	var pop = []

	//treating bigrams
	_.each(senlabel, function(setofgrams, label, list){ 
			_.each(setofgrams['_'], function(value, gram, list){ 
				if (gram.split(" ").length>1)
					_.each(gram.split(" "), function(unigram, key, list){
						senlabel[label]['_'][unigram] = senlabel[label]['_'][unigram]+value
					}, this)
			}, this)
		}, this)

	var wordhash = {}

	_.each(senlabel, function(words, label, list){ 
		_.each(words['_'], function(value, word, list){
			if (!(word in wordhash))
				wordhash[word] = []//new DefaultDict(0)
			wordhash[word].push([label, value])
		}, this)
	}, this)

	// if ((draw) &&(intent_attr_label_ambiguity(resolve_emptiness(bag_of_labels_to_components(Object.keys(explanations['positive']))))>1))
	if ((draw))
		{
			senid = "./image/"+Date.now()
			var labellist = Object.keys(senlabel)
			_.each(labellist, function(value, key, list){ 
				labellist[key] = "\""+value+"\""
			}, this)

			// fs.writeFileSync(senid, "word\tword\t"+labellist.join("\t") + "\n", 'utf-8', function(err) {console.log("error "+err); return 0 })
			fs.writeFileSync(senid, "word\tword\t"+labellist.join("\t") + "\n", 'utf-8')

			_.each(inputnormal.split(" "), function(word, wordnum, list){
			var row = []
				_.each(wordhash[word], function(value, key, list){
					row.push(value[1])
				 }, this) 
			fs.appendFileSync(senid, wordnum+"\t"+word+"\t"+row.join("\t")+"\n",'utf8')
			}, this)

			indx = 0.8
			labb = ""
			_.each(labscor, function(value, key, list){ 
				labb = labb + "set label \'"+value[0].replace(/[\",\\]/g,"")+value[1]+"\' at screen 0.1,"+indx +";"
				indx = indx - 0.025
			}, this)

		command = "gnuplot -p -e \"reset; set term png truecolor  size 1000,1000; set grid ytics; set grid xtics; set title \'"+sample.replace(/\'/g,'')+"\';  set key top right; set output \'image/"+sample.replace(/\'/g,'')+".png\'; set key autotitle columnhead; set label \'"+(JSON.stringify(original)).replace(/[\",\\]/g,"")+"\' at screen 0.1, 0.9;"+labb+" plot for [i=3:"+(labellist.length+2)+"] \'"+senid+"\' using 1:i:xticlabels(2) smooth frequency with boxes\""
		if (labellist.length > 0)
			result = execSync.run(command)
		}

	_.each(wordhash, function(value, key, list){ 
		wordhash[key] = (_.sortBy(value, function(num){ return num[1]; })).reverse();
	}, this)

	var pop = []
	var buffer = []

	_.each(wordhash, function(labels, word, list){
		if (word.split(" ").length==1)
			{
			// console.log(word)
			var ar = []
			_.each(labels, function(value, key, list){ 
				if (value[1]>0)
					ar.push((value[0]=="true") ? true:value[0])
			}, this)

			comp = bag_of_labels_to_components(ar.concat(buffer))

			if (trick) comp = resolve_emptiness(comp)
			var label = generate_possible_labels(comp)
			// console.log(label)
			pop = pop.concat(label)

			} 
		buffer = _.clone(ar)
	}, this)

	_.each(pop, function(value, key, list){ 

	}, this)
	return _.uniq(pop)
}

// input: [[],[],['20,000 NIS']]
// output: [['Offer'],['Salary'],['20,000 NIS']]
// module.exports.resolve_emptiness = function(label)
// function resolve_emptiness(label)
// {

// 	if ((label[1].length == 0)&&(label[2].length == 0)&&
// 		(['Append', 'Reject', 'Insist', 'Accept'].indexOf(label[0][0])) != -1
// 		)
// 		label[2][0] = 'previous'

// 	_.each(label[2], function(value, key, list){ 
// 		// console.log(value)
// 		if (typeof(value)!=undefined)
// 			if (value.toString().indexOf("previous")!=-1)
// 				value = "previous"

// 		var amb = semlang_ambiguity([value])
// 		if (amb.length==1)
// 			{
// 				// label = this.join_labels(label,amb[0])
// 				label = join_labels(label,amb[0])
// 				// console.log("label")
// 				// console.log(label)
// 			}
// 	}, this)


// 	// console.log(label)
// 	// process.exit(0)

// 	_.each(label[0], function(value, key, list){ 
// 		var amb = semlang_ambiguity([value])
// 		// console.log(amb)
// 		if (amb.length==1)
// 			{
// 				// label = this.join_labels(label,amb[0])
// 				label = join_labels(label,amb[0])
// 			}
// 	}, this)

// 	_(3).times(function(n){
// 		label[n] = _.uniq(label[n])
// 	})
// 	return label
// }

function isValuesofAttribute(val)
{
Values = {
            // 'Salary': [,'7,000 NIS','10,000 NIS','12,000 NIS','20,000 NIS'],
            'Salary': [,'60,000 USD','90,000 USD','120,000 USD'],
            'Pension Fund': ['0%','10%','15%','20%'],
            'Promotion Possibilities': ['Fast promotion track','Slow promotion track'],
            'Working Hours': ['8 hours','9 hours','10 hours'],
            'Job Description': ['QA','Programmer','Team Manager','Project Manager'],
            'Leased Car': ['Without leased car', 'With leased car', 'No agreement']
      // 'Leased Car': ['Ferrari']
            }
  var out = []
  _.each(Values, function(value, key, list){
    if (value.indexOf(val)!=-1)
      out.push(key) 
  }, this)
return out
}/*
INPUT:[['Reject'],[],[]]*/
function resolve_emptiness_rule(label)
{
// complete attribute only
  _.each(label[2], function(value, key, list){
    if (isValuesofAttribute(value).length == 1)
      label[1].push(isValuesofAttribute(value)[0]) 
  }, this)

  // TODO: to complete the list
  var previous = ['Accept', 'Reject', 'Greet','Quit']
  if ((label[1].length == 0) && (label[2].length == 0) && 
    (previous.indexOf(label[0][0])!=-1))
    label[2].push("true")

  if (label[0].indexOf("Query")!=-1) 
  {
    label[2] = label[2].concat(label[1])
    label[1].push("Offer")
  }

if ((label[0].indexOf("Reject")!=-1) && (label[2].indexOf("Without leased car")!=-1))
  {
    label[2].splice(label[2].indexOf("Without leased car"),1)
    label[2].push("With leased car")
  }

// only Offer and Leased Car but no without or with
if ((label[0].indexOf("Offer")!=-1) && (label[1].indexOf("Leased Car")!=-1) && (label[2].indexOf("Without leased car")==-1) && (label[2].indexOf("With leased car")==-1) && (label[2].indexOf("No agreement")==-1))
{
  label[2].push("With leased car")
}

if (((label[0].indexOf("Reject")!=-1)||(label[0].indexOf("Accept")!=-1)) && (label[1].indexOf("Leased Car")!=-1) && (label[2].indexOf("Without leased car")==-1) && (label[2].indexOf("With leased car")==-1))
  label[2].push("With leased car")

    
  // var truel = ['Greet','Quit']
  // if ((label[1].length == 0) && (label[2].length == 0) && 
  //   (truel.indexOf(label[0][0])!=-1))
  //   label[2].push(true)

  _(3).times(function(n){
    label[n] = _.uniq(label[n])
  })
  return label
}

function generate_labels(labels)
{

  // treat empty Query
  if ((labels[0].indexOf("Query")!=-1)&&(labels[0].indexOf("Offer")!=-1))
    labels[1].push("Offer")

// treat Query with attribute
  if ((labels[0].indexOf("Query")!=-1)&&(labels[2].length>0)&&(labels[1].indexOf("Offer")==-1)) 
    labels[1].push("Offer")

  // default intent is Offer
  if (labels[0].length == 0)
    labels[0].push("Offer")

  if ((labels[0].indexOf("Accept")!=-1)||(labels[0].indexOf("Reject")!=-1)||
    (labels[0].indexOf("Greet")!=-1)||(labels[0].indexOf("Quit")!=-1))
    labels[2].push("true")

  // all components should be here
  // let's go over all values and place them in attributes

  _.each(labels[2], function(value, key, list){
    var attr = []
    _.each(semlang, function(semlabel, key, list){
      var parse =  Hierarchy.splitPartEqually(semlabel)
      if (parse.length > 2)
      {
        if (parse[2][0] == value)
          attr.push(parse[1][0])
      }
    }, this)
    attr = _.uniq(attr)
    if (attr.length==1)
      labels[1].push(attr[0])
   }, this) 

  var active_labels = []

  var reject = 0
  var accept = 0

  _.each(semlang, function(semlabel, key, list){
    var parse =  Hierarchy.splitPartEqually(semlabel)
    // console.log(JSON.stringify(parse, null, 4))
    var found = true
    _.each(parse, function(component, key1, list){
      if (component.length > 0)
      if (labels[key1].indexOf(component[0])==-1)
      {
        found = false
      }
    }, this)
    if (found)
    {
      active_labels.push(semlabel)
      if (parse[0].indexOf("Reject")!=-1)
        reject += 1
      if (parse[0].indexOf("Accept")!=-1)
        accept += 1
    }
  })

  // filter concise labels
  var labels_hash = {}

  _.each(active_labels, function(label, key, list){
    labels_hash[label] = 1
  }, this)

  if (reject>1)
    delete labels_hash["{\"Reject\":\"true\"}"]

  if (accept>1)
    delete labels_hash["{\"Accept\":\"true\"}"]

  _.each(labels_hash, function(value, label, list){
    _.each(labels_hash, function(value, label1, list){
      var parse =  Hierarchy.splitPartEqually(label)
      var parse1 =  Hierarchy.splitPartEqually(label1)

      // parse is covering
      if (label!=label1)
      if ((_.isEqual(parse[0], parse1[0])) && (_.isEqual(parse[1], parse1[1])) && (parse1[2].length == 0))
        labels_hash[label1] = 0

    }, this)

  }, this)

  
  var output = []
  _.each(labels_hash, function(value, key, list){
    if (value==1)
      output.push(key)
  }, this)

  return output
}

function resolve_emptiness(label)
{
	// the most popular based on intent
	_.each(label[2], function(value, key, list){ 
		var amb = semlang_ambiguity([value])
		if (amb.length == 1)
				label = join_labels(label,amb[0])
	}, this)

	// like Greet
	_.each(label[0], function(value, key, list){ 
		var amb = semlang_ambiguity([value])
		if (amb.length==1)
				label = join_labels(label,amb[0])
	}, this)

  // if ((label[0]=='Accept')||(label[0]=='Reject'))
    // label[2].push('true')

	_(3).times(function(n){
		label[n] = _.uniq(label[n])
	})
	return label
}

// input: [['Offer', 'Accept'], ['Salary'], ['previous','20,000 NIS']]
// output: [{'Offer':{'Salary':'20,000 NIS'}}, {'Accept':'previous'}]
// module.exports.generate_possible_labels = function(label)
function generate_possible_labels(label)
{
	// console.log(label)
	// _.each(label[2], function(value, key, list){ 
	// 	if (typeof(value) != undefined)
	// 		// if (typeof(value) != Boolean)
	// 			if (value.toString().indexOf("previous") != -1)
	// 				label[2][key] = 'previous'
	// }, this)

	var out = []
	_.each(label[0], function(intent, key, list){
		_.each(label[2], function(value, key, list){
			_.each(semlang, function(semval, key, list){ 
				var lab = splitPartEqually(multilabelutils.normalizeOutputLabels(semval))
				if (_.isEqual([intent,value],_.flatten(lab)))
					out.push(semval)
			 }, this)
		 }, this) 
		_.each(label[1], function(value, key, list){
			_.each(semlang, function(semval, key, list){ 
				var lab = splitPartEqually(multilabelutils.normalizeOutputLabels(semval))
				if (_.isEqual([intent,value],_.flatten(lab)))
					out.push(semval)
			 }, this)
		 }, this) 
		_.each(label[1], function(attr, key, list){
			_.each(label[2], function(value1, key, list){ 
				_.each(semlang, function(semval, key, list){ 
					var lab = splitPartEqually(multilabelutils.normalizeOutputLabels(semval))
					if (_.isEqual([intent,attr,value1],_.flatten(lab)))
					 out.push(semval)
				}, this)
			 }, this) 
		}, this)
	}, this)
	return out
}

function join_labels(label, label1)
// module.exports.join_labels = function(label, label1)
{
	_(3).times(function(n){
		label[n] = _.uniq(label[n].concat(label1[n]))
	})
	return label
}
// module.exports.semlang_ambiguity = function(label)
function semlang_ambiguity(label)
{

	var out = []
	_.each(semlang, function(value, key, list){
		var lab = splitPartEqually(multilabelutils.normalizeOutputLabels(value))
		if (_.difference(label,_.flatten(lab)).length==0)
			// out.push(_.flatten(lab))
			out.push(lab)
	}, this)
	return out
}

// input : ['Offer', 'Salary', '20,000 NIS']
// output: [['Offer'],['Salary'], ['20,000 NIS']]
// exports.bag_of_labels_to_components = function(label)
function bag_of_labels_to_components(label)
{
	var set = [[],[],[]]
	_.each(semlang, function(value, key, list){
		var out = splitPartEqually(multilabelutils.normalizeOutputLabels(value))
		_.each(out, function(va, key, list){
			set[key] = set[key].concat(va) 
		}, this)
	}, this)

	_.each(set, function(value, key, list){ 
		set[key] = _.uniq(value)
	}, this)

	var out = [[],[],[]]

	_.each(label, function(val, key, list){ 
		// if (val.length != 0)
		// {
			if (set[0].indexOf(val)!=-1) out[0].push(val)
			if (set[1].indexOf(val)!=-1) out[1].push(val)
			if (set[2].indexOf(val)!=-1) out[2].push(val)
		// }
	}, this)

	return out
}

/*@input - array of hashes, as a input given after cross -  validation
@output - hash that aggregates all statistics from the input*/
function aggregate_two_nested(stats)
// module.exports.aggregate_two_nested = function(stats)
{
	b = _.reduce(stats, function(memo, obj) {
	h = _.clone(memo)

	_.each(obj, function(value, label, list){ 
		if (!(label in h ))
			h[label] = {}
		_.each(_.keys(value), function(param, key, list){ 
			if (param in h[label])
				h[label][param] = h[label][param] + obj[label][param]
			else
				h[label][param] = obj[label][param]
  		}, this)
	}, this)

	return h
	}, {}, this)

	_.each(b, function(value, key, list){ 
		_.each(value, function(value1, key1, list){ 
			b[key][key1] = value1/stats.length
		}, this)
	}, this)
	return b
}

/*@input - stats from test
@output - confusion matrix in multi-label case*/
// module.exports.confusion_matrix = function(stats)
function confusion_matrix(stats)
{	
	matrix = {}
	_.each(stats['data'], function(value, key, list){ 
		_.each(value['explanation']['TP'], function(value1, key, list){ 
			if (!(value1 in matrix))
				matrix[value1] = {}
			if (!(value1 in matrix[value1]))
				matrix[value1][value1] = 0
			matrix[value1][value1] = matrix[value1][value1] + 1
		}, this)

		_.each(value['explanation']['FP'], function(value1, key, list){ 
			if (!(value['explanation']['FN']))
				value['explanation']['FN'] = []
			_.each(value['explanation']['TP'].concat(value['explanation']['FN']), function(value2, key, list){ 
				if (!(value2 in matrix))
					matrix[value2] = {}
				if (!(value1 in matrix[value2]))
					matrix[value2][value1] = 0
				matrix[value2][value1] = matrix[value2][value1] + 1
			}, this)
		}, this)

		_.each(value['explanation']['FN'], function(value1, key, list){ 
			if (!(value1 in matrix))
				matrix[value1] = {}
			if (!("nolabel" in matrix[value1]))
				matrix[value1]["nolabel"] = 0
			matrix[value1]["nolabel"] = matrix[value1]["nolabel"] + 1
			
		}, this)			

	}, this)

	return matrix
}

/*@input - hash that represents table
@output - html table*/
module.exports.hash_to_htmltable = function(labelhash)
{
	keys = []
	_.each(labelhash, function(value, key, list){ 
		_.each(value, function(value1, key1, list){ 
			keys.push(key1)
			}, this)
		}, this)

	labelheader = Object.keys(labelhash)
	labelheader.push("nolabel")

	console.log("<html><body><table border=1 style='border-collapse: collapse'>")
	console.log("<th><td>"+((labelheader)).join("</td><td>")+"</td></th>")

_.each(labelhash, function(value, key, list){
	console.log("<tr><td>"+	(buildstringnosum(key, value, labelheader)).join("</td><td>")+"</td></tr>")
	}, this)

		console.log("</table>")
		// console.log()
		// process.exit(0)

}


// @stats - dataset in the format after test_hash, i.e. the hash with parameters 'data', 'stats', 'labels'
// output is the data labels where there is an error
module.exports.filtererror = function(stats)
{
	stats_filtered=[]
	 _.each(stats['data'], function(value, key, list){ 
		if ((value['explanation']['FP'].length != 0) || (value['explanation']['FN'].length != 0))
		{
		stats_filtered.push(value)	
		}
	});
	return stats_filtered
}


module.exports.bars_hash = function(data)
{ 
	labelhash = {}
	_.each(data, function(value, key, list){
		output = _.flatten((splitPartEqually(multilabelutils.normalizeOutputLabels(value.output))))		
		_.each(output, function(lab, key, list){
			if (!(lab in labelhash))
				{
				labelhash[lab] = {}
				labelhash[lab]['train'] = 0 
				}
			else
				labelhash[lab]['train'] =  labelhash[lab]['train'] + 1
			}, this)

		}, this)
	return labelhash
}

module.exports.bars_original = function(data)
{	
	alllabel = []
	_.each(data, function(value, key, list){
		alllabel = alllabel.concat(value.output)
	}, this)

	aggreg = _.countBy(alllabel, function(num) {return num})

	aggreglist = []
	_.each(aggreg, function(value, key, list){ 
		aggreglist.push([key,value])
		}, this)

	aggregarray = _.sortBy(aggreglist, function(num){ return num[0]});


	_.each(aggregarray, function(value, key, list){
		console.log(value[0])
		}, this)

	process.exit(0)

	// _.each(aggregarray, function(value, key, list){ 
	// 		console.log(value[0]+"\t"+value[1])
	// 	}, this)
}

/*@input - dataset
@output - the table in html format with intent attribute cooccurence.*/
module.exports.intent_attr_matrix = function(data)
{

labelhash = {}
labelheader = []

_.each(data, function(value, key, list){ 
	output = splitPartEqually(multilabelutils.normalizeOutputLabels(value.output))

	_.each(output[0], function(intent, key, list){ 
		if (!(intent in labelhash))
			labelhash[intent] = []
		labelheader = labelheader.concat(output[1])
		labelhash[intent] = labelhash[intent].concat(output[1])
	}, this)
}, this)

labelheader = _.uniq(labelheader)

_.each(labelhash, function(value, key, list){ 
	labelhash[key] = _.countBy(value, function(num) { return num })
}, this)

console.log("<html><body><table border=1 style='border-collapse: collapse'>")
console.log("<th><td>"+((labelheader)).join("</td><td>")+"</td></th>")

_.each(labelhash, function(value, key, list){
	console.log("<tr><td>"+	(buildstring(key, value, labelheader)).join("</td><td>")+"</td></tr>")
	}, this)

labelmarginal = []
_.each(labelheader, function(label, key, list){ 
	agg = 0
	_.each(labelhash, function(value, key, list){ 
		if (label in value)
			agg = agg + value[label]
		}, this)
	labelmarginal.push(agg)
	}, this)

console.log("<tr><td></td><td>"+labelmarginal.join("</td><td>")+"</td></tr>")
console.log("</table>")
}

function buildstring(intent, valhash, labelheader)
{
	str = [intent]
	_.each(labelheader, function(value, key, list){ 
		if (value in valhash)
			str.push(valhash[value])
		else
			str.push(0)
		}, this)

	sum = _.reduce(_.rest(str), function(memo, num){ return memo + num; }, 0)
	str.push(sum)
	return str
}


function buildstringnosum(intent, valhash, labelheader)
{
	str = [intent]
	_.each(labelheader, function(value, key, list){ 
		if (value in valhash)
			str.push(valhash[value])
		else
			str.push(0)
		}, this)
	return str
}

/*
@input - data - dataset
@output - set of graphs with distributions of intent and attributes.*/
module.exports.intent_attr_dist = function(data)
{
	alllabelhash = {}
	_.each(data, function(value, key, list){
			jsonlablist = value['output'].map(splitJson)
			_.each(jsonlablist, function(value1, key, list){ 
				if (!(value1[0] in alllabelhash))
					alllabelhash[value1[0]] = []
				alllabelhash[value1[0]].push(value1[1])
				}, this)
	}, this)

	_.each(alllabelhash, function(value, key, list){ 
		alllabelhash[key] = _.sortBy(_.pairs(_.countBy(value, function(num) {return num})),1)
		}, this)

	filehash = {}
	_.each(alllabelhash, function(hashattribute, intent, list){ 
		str = ""
		num = 0
		_.each(hashattribute, function(occurence, attribute, list){ 
			str = str + num + "\t\""+occurence[0]+"\"\t"+ occurence[1]+"\n"
			num = num + 1
			}, this)
		filehash[intent] = str
	}, this)

	_.each(filehash, function(value, intent, list){ 
		fs.writeFileSync(intent, value, 'utf-8', function(err) {console.log("error "+err); return 0 })
	}, this)

	_.each(alllabelhash, function(value, intent, list){ 
		command = "gnuplot -p -e \"reset; set term png truecolor size 1500,800; set grid ytics; set grid xtics; set output \'"+intent+".png\'; set boxwidth 0.5; set style fill solid; plot \'"+intent+"\' using 1:3:xtic(2) with boxes\""
		result = execSync.run(command)
	}, this)
	process.exit(0)
}


/*@data is a dataset in the original format (array of JSON with input output parameters)
output - list of the labels and the occurrences of the labels in the dataset.*/
module.exports.bars = function(data)
{ 	
	lalelarray = []
	lalelarray.push([])
	lalelarray.push([])
	lalelarray.push([])

	_.each(data, function(value, key, list){
		output = splitPartEqually(multilabelutils.normalizeOutputLabels(value.output))

		_.each(output, function(value, key, list){ 
			lalelarray[key]  = lalelarray[key].concat(value)
		}, this)
	}, this)

	labelgroup=[]
	_.each(lalelarray, function(value, key, list){
		labelgroup.push([])
		_.each(_.countBy(value, function(num) {return num}), function(value1, key1, list1){ 
			labelgroup[key].push([key1,value1])
			}, this)
	},this)

	labelsorted = []
	_.each(labelgroup, function(value, key, list){ 
		labelsorted.push(_.sortBy(value, function(num){ return num[1]}))
		}, this)


	_.each(labelsorted, function(value, key, list){ 
		_.each(value, function(value1, key, list){ 
				console.log(value1[0]+"\t"+value1[1])
			}, this)
		}, this)
	return labelsorted
}

// @data is a dataset in the original format (array of JSON with input output parameters)
// output - tree with the hierarchy of the labels.
module.exports.labeltree = function(data)
	{
	Observable = {}
		_.each(data, function(datum, key, list){				
			_.each(multilabelutils.normalizeOutputLabels(datum.output), function(lab, key, list){				
				_.each(splitJson(lab), function(element, key, list){
					if (key==0)
						if (!(element in Observable))
								Observable[element] = {}
					if (key==1)
						if (!(element in Observable[list[key-1]]))
								Observable[list[key-1]][element] = {}
					if (key==2)
						if (!(element in Observable[list[key-2]][list[key-1]]))
								Observable[list[key-2]][list[key-1]][element] = {}

				}, this)
			}, this)
		}, this)
	return Observable
	}

module.exports.extend_dict = function(aggreg, current)
	{
		for (label in current)
		{
			if (!(label in aggreg))
				{
					aggreg[label]={}
					for (attr in current[label])
						{
							aggreg[label][attr]=0
						}
				}

			for (attr in current[label])
				{
					aggreg[label][attr]= aggreg[label][attr] + current[label][attr]
				}

		}
		return aggreg
	}

module.exports.generate_labels = function(output)
{
	var tags = convertlabeltree()
	var lab = []
	var compos = []

	_.each(output[0], function(intent, key, list){
		_.each(output[2], function(value1, key, list){
			lab.push([intent,value1]) 
		 }, this) 
		_.each(output[1], function(attr, key, list){ 
			lab.push([intent, attr])
			_.each(output[2], function(value, key, list){ 
				lab.push([intent, attr, value])
				// lab.push([intent,value])
			}, this)
		}, this)
	}, this)

	_.each(tags, function(value1, key, list){ 
		_.each(lab, function(value2, key, list){ 
			if ((_.difference(value1,value2)==0)&&(_.difference(value2,value1)==0))
				compos.push(joinJson(value2))
		}, this)
	}, this)

	return compos
	// console.log(compos)
	// process.exit(0)
}

/*@output - is the label in the separate format (intent, attribute, value), observable - tree of the labels
output - list of the ambiguities for intents and labels.*/
// module.exports.intent_attr_label_ambiguity = function(output)
function intent_attr_label_ambiguity(output)
	{
	Observable = labeltree
	ambiguity = []
	_.each(output[1], function(attr, key, list){
			listt = []
			_.each(output[0], function(intent, key, list){
				if (Object.keys(Observable[intent]).indexOf(attr) != -1)
					{
					listt.push(intent)
					} 
				}, this)
			// console.log(listt)
			if (listt.length >= 2)
				{
					amb = {}
					amb['attr'] = attr
					amb['list'] = listt
					ambiguity.push(amb)
				}
			}, this)
	return ambiguity
	}

/*the same as previous but for the dataset
*/
// module.exports.intent_attr_dataset_ambiguity = function(data)
function intent_attr_dataset_ambiguity(data)
	{

	Observable = labeltree
	ambiguityset = []
	_.each(data, function(value, key, list){ 
			output = (splitPartEqually(multilabelutils.normalizeOutputLabels(value.output)))
			ambig = this.intent_attr_label_ambiguity(output)
			if (ambig.length != 0)
			ambiguityset.push({'input': value['input'],
							'output': value['output'],
							'conversion': output,
							'ambiguity':ambig})
		}, this)

	return ambiguityset
}

/*testSet - dataset
output - clone of the dataset*/
// module.exports.clonedataset = function(set)

function Compensate(json) {
		// console.log(json)
	js = splitJson(json)
	if ((js.length == 2) && (js[1].toString()[0] != js[1].toString()[0].toUpperCase()))
		{
		js.push(js[1])
		js[1] = ""
		}
	return js
}


// function splitJson(json) {
// 	return splitJsonRecursive(_.isString(json) && /{.*}/.test(json)?
// 		JSON.parse(json):
// 		json);
// }
 
// function splitJsonRecursive(json) {
// 	if (!_.isObject(json))
// 		return [json];
// 	var firstKey = Object.keys(json)[0];
// 	var rest = splitJsonRecursive(json[firstKey]);
// 	rest.unshift(firstKey);
// 	return rest;
// }

// function splitPartEqually(json) {	
// 	label = []	
// 	_(3).times(function(n){
// 		buf = []
// 		_.each(json.map(Compensate), function(value, key, list){
// 			if (value.length>n)
// 			{
// 			if (_.compact(value[n].toString()).length != 0)
// 				buf = buf.concat(value[n])
// 			}
// 		})

// 		buf = _.uniq(buf)

// 		if ((buf.length > 0) && (typeof(buf[0])!="undefined"))
// 			label[n] = buf
// 		if ((typeof(buf[0])=="undefined"))
// 			label[n] = []
// 	})
// 	return label
// }

// function joinJson(parts) {
// 	var json = joinJsonRecursive(parts);
// 	return _.isString(json)? json: JSON.stringify(json);
// }

// function joinJsonRecursive(parts) {
// 	var firstKey = parts[0];
// 	if (parts.length<=1)
// 		return (firstKey=='true'? true: firstKey);
// 	else {
// 		var result = {};
// 		result[firstKey] = joinJsonRecursive(parts.slice(1));
// 		return result;
// 	}
// }

function clone(item) {
    if (!item) { return item; } // null, undefined values check

    var types = [ Number, String, Boolean ], 
        result;

    // normalizing primitives if someone did new String('aaa'), or new Number('444');
    types.forEach(function(type) {
        if (item instanceof type) {
            result = type( item );
        }
    });

    if (typeof result == "undefined") {
        if (Object.prototype.toString.call( item ) === "[object Array]") {
            result = [];
            item.forEach(function(child, index, array) { 
                result[index] = clone( child );
            });
        } else if (typeof item == "object") {
            // testing that this is DOM
            if (item.nodeType && typeof item.cloneNode == "function") {
                var result = item.cloneNode( true );    
            } else if (!item.prototype) { // check that this is a literal
                if (item instanceof Date) {
                    result = new Date(item);
                } else {
                    // it is an object literal
                    result = {};
                    for (var i in item) {
                        result[i] = clone( item[i] );
                    }
                }
            } else {
                // depending what you would like here,
                // just keep the reference, or create new object
                if (false && item.constructor) {
                    // would not advice to do that, reason? Read below
                    result = new item.constructor();
                } else {
                    result = item;
                }
            }
        } else {
            result = item;
        }
    }

    return result;
}

function biunormalizer(sentence) {
  sentence = sentence.toLowerCase().trim();
  return regexpNormalizer(sentence);
}

function copyobj(list)
{
  return JSON.parse(JSON.stringify(list));
}

function wrfile(file, list)
{
  _.each(list, function(value, key, list){ 
    if (key == 0)
    {
      if (isInt(value))
        fs.writeFileSync(file, value)
      else
        fs.writeFileSync(file, JSON.stringify(value, null, 4))
      
      fs.appendFileSync(file, "\n")
    }
    else
    {
      if (isInt(value))
        fs.appendFileSync(file, value)
      else
        fs.appendFileSync(file, JSON.stringify(value, null, 4))
      
      fs.appendFileSync(file, "\n")
    }
  }, this)
}

function loadstopwords(filename)
{
  var output = []
  var data = fs.readFileSync(filename)
  _.each(data.toString().split("\n"), function(line, key, list){ 
    if (line != "")
      output.push(line)
  }, this)  
  return output
}

function isstopword(word)
{
  if (!_(word).isArray()) 
    word = tokenizer.tokenize(word)

  var stopwc = 0
  _.each(word, function(w, key, list){
    if (stopwords.indexOf(w.toLowerCase()) != -1)
      stopwc += 1
  }, this)

  if (stopwc == word.length)
    return true
  else
    return false
}

function isInt(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function equallist(list)
{
  list = _.map(list, function(value){ return JSON.stringify(value) });

  var mark = true

  _.each(list, function(value1, key, list){ 
    _.each(list, function(value, key, list){ 
    if (_.isEqual(value, value1) == false)
      mark = false
    }, this)
  }, this)

  return mark
}

function intersection(begin, end)
  {
    if ((begin[0]<=end[0])&&(begin[1]>=end[0]))
      return true
    if ((begin[0]>=end[0])&&(begin[0]<=end[1]))
      return true
    return false
  }

function isunigram(string)
  {
    if (string.trim().indexOf(" ") == -1)
      return true
    else
      return false
  }

function onlyunigrams(strhash)
{
  // console.log(strhash)
  var output = {}
    _.each(strhash, function(value, key, list){ 
      if (isunigram(key))
      {

        _.each(strhash[key], function(value1, key1, list){
          if (isunigram(value1[0]))
            {
            if (!(key in output)) output[key] = []
            output[key].push(value1)
            }
        }, this)
      }
    }, this)
  return output
}

// In sequence mode, aggregate the same intents in the same list
// ['Offer','Offer'],['Accept']
  function uniqueaggregate(actualClasses)
  {
    var ac = []
    _.each(actualClasses, function(actual, key, list){ 
      var ff = false
      _(ac.length).times(function(n){
        var found = _.filter(ac[n], function(num){ return ((num[0] == actual[0]) && (intersection(num[1], actual[1]) == true)) }, this);
        if (found.length != 0)
          {
            ff = true
            ac[n].push(actual)
          }
      }, this)
      if (!ff)
        {
          ac.push([actual])
        }
      }, this)
      return ac
  }

  // among all same canidadate pick the longest one
  function uniquecandidate(actualClasses)
  {
    var ac = []
    _.each(actualClasses, function(actual, key, list){ 
      actualClasses[key] = _.sortBy(actual, function(num){ return num[1][1]-num[1][0]; }).reverse()
      ac.push(actualClasses[key][0])
    }, this)
    return ac
  }

  // simple intersection
  function intersection(begin, end)
  {
    if ((begin[0]<=end[0])&&(begin[1]>=end[0]))
      return true
    if ((begin[0]>=end[0])&&(begin[0]<=end[1]))
      return true
    return false
  }

  function onecoverstwo(one,two)
  {
    if ((one[0]<=two[0])&&(one[1]>=two[1]))
      return true
    else
      return false
  }

  // remove actual that is completely covered
  function fullycovered(actual)
  {
    var output = []
    actual = uniquecoord(actual)

    _.each(actual, function(ext, key1, list1){ 
        var add = true
      _.each(output, function(inter, key2, list2){
        if (ext[0] == inter[0])
        {
          if (onecoverstwo(ext[1], inter[1]))
            output.splice(key2, 1)
          
          if (onecoverstwo(inter[1], ext[1]))
            add = false
        }
      }, this)
      if (add)
        output.push(ext)
    }, this)

    return output
  }

  function vectorsum(a, b)
  {
    if (a.length != b.length)
    {
      console.error("The length is different "+a.length+" "+b.length)
      process.exit(0)
    }

    var c = []

    _(a.length).times(function(n){
      c.push(a[n]+b[n])
    })
    return c
  }

  // leave only unique coordinates
  function uniquecoord(actual)
  {
    var output = []
    var cont = {}
    _.each(actual, function(value, key, list){
      if (!(value[0]+value[1] in cont))
        {
          cont[value[0]+value[1]]=''
          output.push(value)
        } 
    }, this)
    return output
  }

  function ngraminindex(ngram, index, type)
  {

    var POS = {
    'index.noun': ['NN', 'NNS', 'NNP', 'NNPS'],
    'index.adj': ['JJ', 'JJR', 'JJS'],
    'index.adj': ['JJ', 'JJR', 'JJS'],
    'index.adv': ['RB', 'RBR', 'RBS','WRB'],
    'index.verb': ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ']
    }
  // lemma word
    var string = _.pluck(ngram, type).join(" ")

    var found = false
    var Pos

    _.each(index, function(values, pos, list){
      if ((string in values) && (ngram.length > 1))
      {
        found = true
        Pos = pos.split(".")[1]
      }

      if ((string in values) && (ngram.length == 1) && (POS[pos].indexOf(ngram[0]['pos'])!=-1))
      {
        found = true
        Pos = pos.split(".")[1]
      }

    }, this) 

    if ((found == false) && (type=='word')) 
      return ngraminindex(ngram, index, 'lemma')

    if (found == false)
      return undefined

    return {'string': string, 'pos': Pos}
  }

  function createcandidates(sentence)
  {
    var candidates = []
    // _.each(input['sentences'], function(sentence, key, list){ 
    
      var features = []
  
      _.each(sentence['tokens'], function(value, key, list){ 
        features.push({'lemma':value['lemma'], 'word': value['word'], 'pos': value['pos']})
      }, this)

      // console.log(features)

      var k = 4
      var i = 0 
      while (i<=features.length) {
        for (j = Math.min(k, features.length-i+1); j >= 1; j--) { 
          var s = features.slice(i, i+j)
          var string = ngraminindex(s, indexWN, 'word')
          if (!_.isUndefined(string))
          {
            candidates.push(string)
            i = i + j
            break
          }
          else
            if (j==1)
              i = i + j
        }
      }
    // }, this)

    // candidates = _.filter(candidates, function(num){ return ['verb','noun'].indexOf(num['pos']) != -1; });
    // candidates = _.filter(candidates, function(num){ return ['noun'].indexOf(num['pos']) != -1; });
    return candidates
  }

  // function createcandidates(input)
  // {
  
  // var candidates = []
  // var index = JSON.parse(fs.readFileSync(__dirname + "/../wordnet_index.json", 'UTF-8'))

  // _.each(input['CORENLP']['sentences'], function(sentence, key, list){ 
  //   var features = []
  
  //   _.each(sentence['tokens'], function(value, key, list){ 
  //     features.push({'lemma':value['lemma'], 'word': value['word'], 'pos': value['pos']})
  //   }, this)

  //   var fgrams = natural.NGrams.ngrams(features, 4)
  //   if (fgrams.length == 0)
  //     {
  //     console.log("4GRAMS IS EMPTY")
  //     process.exit(0)
  //     }

  //     _.each(fgrams, function(fgram, key, list){
  //       var string = ngraminindex(fgram, index, 'word') 
  //       console.log(JSON.stringify(fgram, null, 4))
  //       console.log(string)
  //       if (string.length > 0)
  //         candidates.push(string)
  //       else
  //       {
  //         var tgrams = natural.NGrams.ngrams(fgram, 3)
  //         _.each(tgrams, function(tgram, key, list){ 
  //           var string = ngraminindex(tgram, index, 'word') 
  //           console.log(JSON.stringify(tgram, null, 4))
  //           console.log(string)
  //           if (string.length > 0)
  //             candidates.push(string)
  //           else 
  //           {
  //             var bgrams = natural.NGrams.ngrams(tgram, 2)
  //             _.each(bgrams, function(bgram, key, list){ 
  //               var string = ngraminindex(bgram, index, 'word') 
  //               console.log(JSON.stringify(bgram, null, 4))
  //               console.log(string)
  //               if (string.length > 0)
  //                 candidates.push(string)
  //               else
  //               {
  //                 var ugrams = natural.NGrams.ngrams(bgram, 1)
  //                 _.each(ugrams, function(ugram, key, list){ 
  //                   var string = ngraminindex(ugram, index, 'word') 
  //                   console.log(JSON.stringify(ugram, null, 4))
  //                   console.log(string)
  //                   if (string.length > 0)
  //                     candidates.push(string)
  //                 }, this)
  //               }
  //             }, this)
  //           }
  //         }, this)
  //       }
  //     }, this)
  //   }, this)

  
  // return candidates
  // }

function loadds(folder)
{
  var dialfolders = fs.readdirSync(folder)
         
  var dataset = []

  _.each(dialfolders, function(dialfolder, key, list){
    
    var dial = JSON.parse(fs.readFileSync(folder+"/"+dialfolder+"/gold.json"))

    if (!("set" in dial))
    {
      console.log(JSON.stringify(dialfolder, null, 4))
      process.exit(0)
    }
      
    // if (["test","train"].indexOf(dial['set'])==-1)
    // {
      // console.log(JSON.stringify(dialfolder, null, 4))
      // process.exit(0)
    // }

    // if (dial.set == "train")    
      // train.push(dial)

    // if (dial.set == "test")   
      // test.push(dial)

    dataset.push(dial)

    
  }, this)

  // return {'train':train, 'test':test}
  return dataset
}

function getExm(dataset)
{
  var intents = []

  _.each(dataset, function(value, key, list){   
    var inte = _.keys(value.outputhash)
      if (inte.length==1)
      {
        if (!(inte in intents))
          intents[inte] = []

          intents[inte].push(value.input.text)
      }
    }, this)
  
  return intents
}

function getDist(dataset)
{
  var stats = []

  _.each(dataset, function(value, key, list){   
    if (_.keys(value.outputhash).length==1)
      stats = stats.concat(_.keys(value.outputhash))
    }, this)
  
  return _.countBy(stats, function(num) { return num }) 
}

/*function removerephrases(dataset)
{
  var newset = []

  var cont = {
    'Accept': true,
    'Reject': true,
    'Query': true,
  }

  _.each(dataset, function(value, key, list){
  
    if (_.keys(value.outputhash).length == 1)
      {
        var intent = _.keys(value.outputhash)[0]

        if ((_.keys(cont).indexOf(intent)!=-1) && (cont[intent]==false))
        {}
        else


        if (_.keys(cont).indexOf(intent)!=-1)
          cont[intent] = false
      }
  
  }, this)
}
*/

function singlelabeldst(dataset)
{
  var src_dist = {}
  _.each(dataset, function(value, key, list){
    var intents = _.unique(_.keys(value.outputhash))

    if (intents.length == 1)
    {
      if (!(intents[0] in src_dist))
        src_dist[intents[0]] = 0

        src_dist[intents[0]] += 1
    }
  }, this)

  return src_dist
}


function undersampledst(src, dst)
{
  // check the src distrobution
  var src_dist = singlelabeldst(src)
  
  console.log("UNDER: src dist: "+JSON.stringify(src_dist, null, 4))

  var dst_map = {}
  _.each(dst, function(value, key, list){
    var intents = _.unique(_.keys(value.outputhash))

    if (intents.length == 1)
    {
      if (!(intents[0] in dst_map))
        dst_map[intents[0]] = []

      dst_map[intents[0]].push(key)
    }
  }, this)

  console.log("UNDER: dst map: "+JSON.stringify(dst_map, null, 4))

  _.each(src_dist, function(value, intent, list){
    while (dst_map[intent].length > src_dist[intent])
    {
      var index = _.sample(dst_map[intent]);
      dst_map[intent] = _.without( dst_map[intent], index);
      dst.splice(index, 1)
    }
  }, this)

  return dst
}

function turnoutput(output)
{
  var converted = []
  var out = _.pairs(output)
  _.each(out, function(value, key, list){
    if (_.isObject(value[1]))
    {
      if (value[0]=="Query")
      {
        converted.push(["Query", _.values(value[1])[0]])
      }
      else
      {
        _.each(_.keys(value[1]), function(value1, key1, list){
          converted.push([value[0], value1])
        }, this)
      }
    }
    else
    {
        converted.push([value[0], value[1]])
    }
  }, this)
return converted
}

/*function processdataset(dataset, type ) 
{
  if (_.isUndefined(type) || type=="") throw new error("processdataset")

  _.each(dataset, function(dialogue, dialogue_key, list){
    _.each(dialogue, function(utterance, utterance_key, list){
         var tokens = _.flatten(_.pluck(utterance['input']['sentences'], 'tokens'))
          if (type == "train")
          dataset[dialogue_key][utterance_key]['input']['sentences'] = [{'tokens': tokens}]
          dataset[dialogue_key][utterance_key]['output'] = _.unique(_.keys(utterance.outputhash))
    })
  })
  return dataset
}

*/
function processdataset(dataset, type ) 
{
// should be executed after flattenation
// prepares the 

  if (_.isUndefined(type) || type=="") throw new error("processdataset")

//_.each(dataset, function(dialogue, dialogue_key, list){
    _.each(dataset, function(utterance, utterance_key, list){
	
         var tokens = _.flatten(_.pluck(utterance['input']['sentences'], 'tokens'))
          if (type == "train")
          dataset[utterance_key]['input']['sentences'] = [{'tokens': tokens}]
          dataset[utterance_key]['output'] = _.unique(_.keys(utterance.outputhash))
    })
//  })
  return dataset
}

// concatenate sentences
// filter multi - label utterances
// convert output
function processdatasettrain(dataset)
{
  _.each(dataset, function(utterance, utterance_key, list){
    dataset[utterance_key]['output'] = _.unique(_.keys(utterance.outputhash))

    var tokens = _.flatten(_.pluck(utterance['input']['sentences'], 'tokens'))
    var basicdependencies = _.flatten(_.pluck(utterance['input']['sentences'], 'basic-dependencies'))
    var collapseddependencies = _.flatten(_.pluck(utterance['input']['sentences'], 'collapsed-dependencies'))
    var collapsedccprocesseddependencies = _.flatten(_.pluck(utterance['input']['sentences'], 'collapsed-ccprocessed-dependencies'))

    dataset[utterance_key]['input']['sentences'] = [{
      'tokens': tokens,
      'basic-dependencies': basicdependencies,
      'collapsed-dependencies': collapseddependencies,
      'collapsed-ccprocessed-dependencies': collapsedccprocesseddependencies
    }]
  })

	var dataset = _.filter(dataset, function(num){ return num["output"].length <= 1; });
	return dataset
}

function processdatasettest(dataset)
{
  _.each(dataset, function(utterance, utterance_key, list){
    dataset[utterance_key]['output'] = _.unique(_.keys(utterance.outputhash))

	  var tokens = _.flatten(_.pluck(utterance['input']['sentences'], 'tokens'))
    var basicdependencies = _.flatten(_.pluck(utterance['input']['sentences'], 'basic-dependencies'))
    var collapseddependencies = _.flatten(_.pluck(utterance['input']['sentences'], 'collapsed-dependencies'))
    var collapsedccprocesseddependencies = _.flatten(_.pluck(utterance['input']['sentences'], 'collapsed-ccprocessed-dependencies'))


    dataset[utterance_key]['input']['sentences'] = [{
			'tokens': tokens,
			'basic-dependencies': basicdependencies,
		  'collapsed-dependencies': collapseddependencies,
			'collapsed-ccprocessed-dependencies': collapsedccprocesseddependencies
		}]
  })
  return dataset
}



function processdataset1(dataset)
{
 _.each(dataset, function(utterance, utterance_key, list){

//       var tokens = _.flatten(_.pluck(utterance['input']['sentences'], 'tokens'))
  //        if (type == "train")
          dataset[utterance_key]['output'] = _.unique(_.keys(utterance.outputhash))
    })

    return dataset
}



function getsetcontext(dataset, rephrase)
{
  var rectypes = ['AskRepeat', 'AskRephrase' ,'Reprompt' ,'Notify', 'Yield', 'Help', 'YouCanSay', 'TerseYouCanSay']
  var utteranceset = {'train':[], 'test':[], 'unable':[]}
  var context = []
  var addrepr = true
 
  _.each(dataset, function(dialogue, key, list){
    var processed_dialogue = []
    _.each(dialogue['turns'], function(turn, key, list){

      if ((turn.role == "Candidate") && (('data' in turn)))
        if (rectypes.indexOf(turn.data)!=-1)
          if (rephrase == false)
            addrepr = false

      if ((turn.role == "Candidate") && (('output' in turn)))
        context = hashtoar(turn.output)
 
      if (turn.role == "Employer") 
      {
      if  (addrepr)
      {
        var record = {}
        // record['input'] = {}
        // record['input']['text'] = turn.input
        // record['input']['context'] = context
        turn['input']['context'] = context
        turn['outputhash'] = turn.output
        turn['output'] = hashtoar(turn.output)

        var GreetIndex = _.findIndex(turn['output'], function(lab){ return _.keys(JSON.parse(lab))[0]=='Greet'});

        var QuitIndex = _.findIndex(turn['output'], function(lab){ return _.keys(JSON.parse(lab))[0]=='Quit'});
        
        var QueryIndex = _.findIndex(turn['output'], function(lab){ return _.keys(JSON.parse(lab))[0]=='Query'});
	
    /*   	var AcceptIndex = _.findIndex(turn['output'], function(lab){ return lab=='{\"Accept\":true}'});

        // eliminate car issue
         var CarIndexV = _.findIndex(turn['output'], function(lab){ return _.values(JSON.parse(lab))[0]=='Leased Car'});
         var CarIndex = _.findIndex(turn['output'], function(lab){ return _.keys(_.values(JSON.parse(lab))[0])[0]=='Leased Car'});
*/
          
       if ((QuitIndex==-1) && (GreetIndex==-1))

            processed_dialogue.push(turn)

        // context = []
        }
        else
          addrepr = true
      }
    }, this)

    if (!("set" in dialogue))
      dialogue["set"] = "train"
    
    utteranceset[dialogue.set].push(processed_dialogue)
  }, this)
  return utteranceset
}

function getsetnocontext(dataset)
{
  var utteranceset = {'train':[], 'test':[]}
  _.each(dataset, function(dialogue, key, list){
    var utterances = []
    _.each(dialogue['turns'], function(utt, key1, list){
        if (utt.role == "Employer")
        {
          var record = {}
          record['input'] = utt.input
          record['output'] = hashtoar(utt.output)
          utterances.push(record)
        }
    }, this)
    utteranceset[dialogue.set].push(utterances)
  }, this)
  return utteranceset
}

function hashtoar(hash)
{

  //console.log(hash)
  var output = []
  _.each(hash, function(value, key, list){
    if (_.isObject(value))
    {
      _.each(value, function(value1, key1, list){
        var rec = {}
        rec[key] = {}
        rec[key][key1]=value1
        output.push(rec)
      }, this)
    }
    else
    {
      var rec = {}
      rec[key]=value
      output.push(rec)
    }
  }, this)

  output = _.map(output, function(num){ return JSON.stringify(num) });

  return output
}


// {\"Reject\":true}",
// "{\"Reject\":{\"Leased Car\":\"With leased car\"}}"

function coverfilter(labels)
{
  var b = _.map(labels, function(num){ return JSON.parse(num) });

  var lists = []

  _.each(b, function(value, key, list){
    var item = []
    item.push(_.keys(value)[0])
    if (_.isObject(_.values(value)[0]))
    {
      item.push(_.keys(_.values(value)[0])[0])
      item.push(_.values(_.values(value)[0])[0])
    }
    else
    item.push(_.values(value)[0]) 
    lists.push(item)
  }, this)

  // console.log(JSON.stringify(lists, null, 4))

  var clear = []

  _.each(lists, function(value, key, list){
    var covered = false
    _.each(lists, function(value1, key1, list1){

      if (_.isEqual(_.intersection(value, value1), value)==true)
        if (key!=key1)
          covered = true

    }, this)
    if (!covered)
      clear.push(value)
  }, this)

  var output = []
  _.each(clear, function(value, key, list){
    var item = {}

    if (value[1]=="true")
      value[1] = true

    if (value.length == 2)
      item[value[0]] = value[1]

    if (value.length == 3)
    {
      item[value[0]] = {}
      item[value[0]][value[1]] = value[2]
    }

    output.push(JSON.stringify(item))
  }, this)

  return output
}

function filterlabels(labels)
{
  var reject_single = 0
  var accept_single = 0

  var reject_detailed = 0
  var accept_detailed = 0

  var labels_output = []

  _.each(labels, function(value, key, list){
    var label = JSON.parse(value)

    if (_.isEqual(label, {'Reject':true}))
      reject_single = 1      

    if (_.isEqual(label, {'Accept':true}))
      accept_single = 1     

    if ((_.keys(label)[0] == "Reject") && (_.isObject(_.values(label)[0]))) 
      reject_detailed = 1

    if ((_.keys(label)[0] == "Accept") && (_.isObject(_.values(label)[0]))) 
      accept_detailed = 1

    if ((!_.isEqual(label,{'Reject':true})) && (!_.isEqual(label,{'Accept':true})))
      labels_output.push(JSON.stringify(label))
  }, this)

  if ((reject_single == 1) && (reject_detailed == 0))
      labels_output.push(JSON.stringify({'Reject':true}))

  if ((accept_single == 1) && (accept_detailed == 0))
      labels_output.push(JSON.stringify({'Accept':true}))

    return labels_output
}

function distribute(rep) {

  var table = walker(rep)

  // table()
  // Reject  

  return table()

  /*var params = JSON.parse(JSON.stringify(rep))
  
  var totalscore = _.reduce(params, function(memo, num){ return memo + num[0]; }, 0);
  
  var dist = []
  _.each(params, function(value, param, list){
    dist.push([value[0]/totalscore, value[1]])
  }, this) 
  
  dist = _.shuffle(dist)

  var probs = _.sortBy(dist, function(num){ return num[0] })

  var r = _.random(0,99)/100
  var i = 0
  var acc = 0
  
while ((acc += probs[i][0]) <= r)
      i++;

  return probs[i][1];
  */  
}

/*function simulateds(dataset, size, params)
{
  
  console.log("simulateds: params = "+JSON.stringify(params) + " size = " + size)
  dataset = _.flatten(dataset)
  var report = {}

// add score to each intent
  _.each(params, function(value, param, list){
    // var F1 = ( value["F1"] == 0 || _.isNaN(value["F1"]) || value["F1"]==-1 ) ? 1 : value["F1"]
    // var FN = ( value["FN"] == 0 ) ? 1 : value["FN"]
    // params[param]["score"] = (value["TP"]+value["FN"])/F1


    params[param]["score"] = 1/value["F1"]

    if (value["F1"] == 0) params[param]["score"] = 10
    if (value["F1"] >= 0.5) params[param]["score"] = 2
    
    if (_.isNaN(value["F1"]) || _.isUndefined(value["F1"]) || _.isNull(value["F1"])) params[param]["score"] = 1/0.1

    if (value["FN"]!=0) params[param]["score"] *= value["FN"]

  }, this)

var params = {
	'Accept':{'score':0.4},
	'Reject':{'score':0.4},
	'Offer':{'score':0.1},
	'Greet':{'score':0.1},
	'Query':{'score':0.2},
	'Quit':{'score':0.1}
}

  console.log("DEBUGSIM: probabilities " +JSON.stringify(params, null, 4))

  var sim_dataset = []

  while (sim_dataset.length < size) {
    
    var label = distribute(params)

    if (!(label in report))
      report[label] = 0

    report[label] += 1
    // var elem_index = _.findIndex(dataset, function(utterance){ return ((utterance.output.length == 1) && (utterance.output.indexOf(label)!=-1)); });
   
    // var dataset_copy = JSON.parse(JSON.stringify(dataset))
    // dataset_copy = _.map(dataset_copy, function(num){ 
      // if (num.output.length == 0) return false
        // else

	dataset = _.shuffle(dataset)

          // });

    var elem_index = _.findIndex(dataset, function(utterance){ 
        if (utterance.output.length == 0)
          return false
        else
          return _.keys(JSON.parse(utterance.output[0]))[0] == label });
    
    if (elem_index == -1)
      // if there is no such a label delete it from the param
      delete params[label]
    else
    {
      // push to the simulated dataset
      sim_dataset.push(dataset[elem_index])
      // delete it from the buffer set
      dataset.splice(elem_index, 1);
    }
  }
  
  // return generated-simulated and filtered set
  return {"simulated":sim_dataset, "dataset":dataset, "report":report}
}
*/

function returndist(dataset)
{
  var intents = []
  _.each(dataset, function(value, key, list){
      intents = intents.concat(_.map(value.output, function(num){ return _.keys(JSON.parse(num))[0] }))
  }, this)
  
  // console.log(JSON.stringify(intents, null, 4))

  return _.countBy(intents, function(num) { return num })
}


function oversample(turns)
{

  // add only by simple-label utterances
  // relates only to ['Offer', 'Accept', 'Reject']
  // - it doesn't count for context
  // add all the stuff as separated dialogue per intent

  var single_label_utt = {}
  var tocount = ['Offer', 'Accept', 'Reject','Query']
  var stats = {}

  _.each(turns, function(turn, key, list){
    _.each(turn['output'], function(label, key, list){
//      var intent = _.keys(JSON.parse(label))[0]
        var intent = label
        if (!(intent in stats))
          stats[intent] = 0
        stats[intent] += 1
      }, this)

      if (turn['output'].length == 1)
      {
        //var intent = _.keys(JSON.parse(turn['output'][0]))[0]
        var intent = turn['output'][0]
        if (!(intent in single_label_utt))
          single_label_utt[intent] = []

        single_label_utt[intent].push(turn)
      }

    }, this)

  var max = 0
  _.each(tocount, function(lab, key, list){
    if ((stats[lab]) > max)
      max = stats[lab]
  }, this)

  console.log("DEBUGOVER: max="+max)

  console.log("DEBUGOVER: intents to consider: "+JSON.stringify(tocount, null, 4))
  console.log("DEBUGOVER: stats of all intent's occurences: "+JSON.stringify(stats, null, 4))

  console.log("DEBUGOVER: single_label_utt that were collected: ")
  _.each(single_label_utt, function(lis, key, list){
	 console.log("DEBUGOVER: "+key+" "+lis.length)
  }, this)

  _.each(tocount, function(lab, key, list){
    if ((max > stats[lab]) && (lab in single_label_utt))
	{
	console.log("DEBUGOVER: intent: "+lab)
	console.log("DEBUGOVER: size: "+single_label_utt[lab].length)
	turns = turns.concat(setsize(single_label_utt[lab], max - stats[lab] ))
	}
  }, this)

  return turns
}

function expanbal(turns, callbackg)
{

  // treat only by simple-label utterances
  // relates only to ['Offer', 'Accept', 'Reject']
  // - it doesn't count for context

  var single_label_utt = {}
  var tocount = ['Offer', 'Accept', 'Reject','Query']
  var stats = {}

  async.forEachOf(turns, function (turn, key, callbackl) {

    if (turn['output'].length == 1)
      {
        var intent = turn['output'][0]

        if (!(intent in stats))
          stats[intent] = 0
        stats[intent] += 1

        if (!(intent in single_label_utt))
          single_label_utt[intent] = []

      classifiers.feAsync(turn, {}, true, {}, function (err, asfeatures){  
        classifiers.feNeg(turn, asfeatures,  true, {}, function (err, negasfeatures){  
          classifiers.feExpansion(turn, negasfeatures, true, {'scale':3, 'onlyroot': true, 'relation': undefined, 'allow_offer': true, 'best_results':3, 'expand_test':false}, function (err, features){

	    console.log("DEBUG: EXPANBAL: final features:"+JSON.stringify(features, null, 4))
	
	    async.forEachOf(_.unique(features), function (feature, key, callbackll) {
	    	    console.log("DEBUG: EXPANBAL: feature:"+JSON.stringify(feature, null, 4))
	            var turn_copy = copyobj(turn)
        	    delete turn_copy['input']['sentences']
	            turn_copy['input']['features'] = feature
	            single_label_utt[intent].push(turn_copy)
	            callbackll()
	    }, function(err){
             callbackl()
	   })
          })
        })
      })
      }
    else
    callbackl();

  }, function (err) {

    var max = 0
    _.each(tocount, function(lab, key, list){
      if ((stats[lab]) > max)
      max = stats[lab]
    }, this)

    console.log("DEBUGEXPBAL: max="+max)
    console.log("DEBUGEXPBAL: intents to consider: "+JSON.stringify(tocount, null, 4))
    console.log("DEBUGEXPBAL: stats of all intent's occurences: "+JSON.stringify(stats, null, 4))
    console.log("DEBUGEXPBAL: single_label_utt that were collected: ")
    console.log("DEBUGEXPBAL: finally denerated: "+JSON.stringify(single_label_utt, null, 4))  

    _.each(single_label_utt, function(lis, key, list){
      console.log("DEBUGEXPBAL: "+key+" "+lis.length)
    }, this)

    _.each(tocount, function(lab, key, list){
      if ((max > stats[lab]) && (lab in single_label_utt))
      {
        console.log("DEBUGOVER: intent: "+lab)
        console.log("DEBUGOVER: size: "+single_label_utt[lab].length)
        turns = turns.concat(setsize(single_label_utt[lab], max - stats[lab] ))
      }
    }, this)

    callbackg(null, turns)
  })
}


function undersample(turns)
{

  // add only by simple-label utterances
  // relates only to ['Offer', 'Accept', 'Reject']
  // - it doesn't count for context
  // add all the stuff as separated dialogue per intent

  var single_label_utt = {}
  var tocount = ['Offer', 'Accept', 'Reject', 'Query']
  var stats = {}

  _.each(turns, function(turn, key, list){
    _.each(turn['output'], function(label, key, list){

        //var intent = _.keys(JSON.parse(label))[0]
        var intent = label
        if (!(intent in stats))
          stats[intent] = 0

          stats[intent] += 1

      }, this)

      if (turn['output'].length == 1)
      {
        //var intent = _.keys(JSON.parse(turn['output'][0]))[0]
        var intent = turn['output'][0]
        if (!(intent in single_label_utt))
          single_label_utt[intent] = []

        single_label_utt[intent].push(turn)
      }

    }, this)

  var min = _.values(stats)
  min = _.without(min, 0)
  min = _.sortBy(min, function(num){ return num })[0]

  console.log("DEBUGUNDER: min="+min)

  console.log("DEBUGUNDER: intents to consider: "+JSON.stringify(tocount, null, 4))
  console.log("DEBUGUNDER: stats count all occurences: "+JSON.stringify(stats, null, 4))

  console.log("DEBUGUNDER: single_label_utt that were collected")
  _.each(single_label_utt, function(lis, key, list){
  console.log("DEBUGUNDER: "+key+" "+lis.length)
  }, this)

  var res = []

  _.each(single_label_utt, function(value, key, list){
    if (tocount.indexOf(key)==-1)
    res = res.concat(value)
  }, this)

  console.log("DEBUGUNDER: "+JSON.stringify(res, null, 4))

  _.each(tocount, function(lab, key, list){
    if ((min <= stats[lab]) && (lab in single_label_utt)) 
    {
    console.log("DEBUGUNDER: intent: "+lab)
    console.log("DEBUGUNDER: size: "+single_label_utt[lab].length)
    res = res.concat(single_label_utt[lab].splice(0,min))
    }
  }, this)

  return res
}


function setsize(dataset, size)
{
  // random variante

  var final_set = []
  _(size).times(function(n){ 
    final_set.push(_.sample(dataset, 1)[0])
  });

  return final_set
  
  /*var cur_size = dataset.length
  
  if (size > cur_size)
    {
    _(Math.ceil(size/cur_size)).times(function(n){ 
      final_set = final_set.concat(dataset)
    });
    }
  else
    final_set = JSON.parse(JSON.stringify(dataset))

  return final_set.splice(0,size)*/
}

function simulateds(dials, size, golddist, power)
{
  
  var dataset = _.flatten(dials)
  var dist = returndist(dataset)
  // { "Offer": 650, "Reject": 127, "Accept": 91 }

  var ints = ['Query','Greet','Offer','Accept','Reject','Quit']
	
  _.each(ints, function(intent, key, list){
	if (!(intent in dist))
		dist[intent] = 5
  }, this)		

  console.log("DEBUGSIM: gold distribution "+JSON.stringify(dist))  

  var params = []
  var report = {}

  _.each(dist, function(value, key, list){
    params.push([Math.pow(value, power), key])
  }, this)

// params
// [[650,"Offer"],[127,"Reject"],[91,"Accept"],[5,"Query"],[5,"Greet"],[5,"Quit"]]

  console.log("DEBUGSIM: distribution "+JSON.stringify(params))  
  
  var sim_dataset = []

  while (sim_dataset.length < size) {
    
    var label = distribute(params)

    if (!(label in report))
      report[label] = 0

    report[label] += 1
    // var elem_index = _.findIndex(dataset, function(utterance){ return ((utterance.output.length == 1) && (utterance.output.indexOf(label)!=-1)); });
   
    // var dataset_copy = JSON.parse(JSON.stringify(dataset))
    // dataset_copy = _.map(dataset_copy, function(num){ 
      // if (num.output.length == 0) return false
        // else

    dataset = _.shuffle(dataset)

          // });

    var elem_index = _.findIndex(dataset, function(utterance){ 
        if (utterance.output.length == 0)
          return false
        else
          return _.keys(JSON.parse(utterance.output[0]))[0] == label });
    
    if (elem_index == -1)
      // if there is no such a label delete it from the param
      delete params[label]
    else
    {
      // push to the simulated dataset
      sim_dataset.push(dataset[elem_index])
      // delete it from the buffer set
      dataset.splice(elem_index, 1);
    }
  }
  
  // return generated-simulated and filtered set
  return {"simulated":sim_dataset, "dataset":dataset, "report":report}
}

function getdist(dialogue)
{
  var dist = {}
  var total = 0

  _.each(dialogue, function(value, key, list){
    _.each(value['output'], function(label, key, list){
      if (!(label in dist))
        dist[label] = 0
      
      dist[label] += 1
      total += 1      
    }, this)
  }, this)

  _.each(dist, function(value, label, list){
    dist[label] = dist[label]/total
  }, this)

  return dist
}

function distdistance(a,b)
{
  var labels = _.uniq(_.keys(a).concat(_.keys(b)))
  
  var veca = Array(labels.length)
  var vecb = Array(labels.length)

  _.each(veca, function(value, key, list){
      veca[key] = 0
  }, this)

  _.each(vecb, function(value, key, list){
      vecb[key] = 0
  }, this)

  _.each(a, function(dist, label, list){
    veca[labels.indexOf(label)] = dist
  }, this)

  _.each(b, function(dist, label, list){
    vecb[labels.indexOf(label)] = dist
  }, this)

  return {'a': veca, 'b':vecb}
}

function simulaterealds(dataset, size, params)
{
  _.each(params, function(value, param, list){
    var F1 = ( value["F1"] == 0 || _.isNaN(value["F1"]) || value["F1"]==-1 ) ? 1 : value["F1"]
    // params[param]["score"] = (value["TP"]+value["FN"])/F1
    params[param]["score"] = 1/F1
    if (F1 > 0.5) params[param]["score"] = 2
    // if (value["F1"] == -1) params[param]["score"] = 1/0.1
  }, this)

  var totalscore = _.reduce(params, function(memo, num){ return memo + num["score"]; }, 0);
  var ideal_dist = {}
  
  _.each(params, function(value, param, list){
    ideal_dist[param] = params[param]["score"]/totalscore
  }, this) 

  var distvec = []
  
  _.each(dataset, function(dialogue, key, list){
    var dialdist = getdist(dialogue)
    var vecs = distdistance(ideal_dist, dialdist)
    distvec.push(distance.cosine_distance(vecs['a'], vecs['b']))
  }, this)

  var mindist = _.min(distvec);
  var bestdial = distvec.indexOf(mindist)

  var sim_dataset = dataset[bestdial]
  dataset.splice(bestdial,1)

  return {"simulated":sim_dataset, "dataset":dataset}
}


function flattendataset(dataset)
{
  _.each(dataset, function(utterance, key, list){
    var tokens = _.flatten(_.pluck(utterance['input']['sentences'], 'tokens'))
    dataset[key]['input']['sentences'] = [{'tokens': tokens}]
  }, this)
  return dataset
}

function getroot(sentence)
{
 
  var rootword = _.where(sentence['basic-dependencies'], {"dep": "ROOT"})[0]["dependentGloss"]
  var rootxcomp = _.where(sentence['basic-dependencies'], {"dep": "xcomp","governorGloss": rootword})
  var roottoken = _.where(sentence['tokens'], {"word": rootword}, this)[0]
  var negation = _.where(sentence['basic-dependencies'], {"dep": "neg", "governorGloss":rootword })  

  if (rootxcomp.length != 0)
    var xcomptoken = _.where(sentence['tokens'], {"word": rootxcomp[0]["dependentGloss"]}, this)[0]

return {
    'word': (rootxcomp.length == 0 )?roottoken.word:xcomptoken.word, 
    'lemma': (rootxcomp.length == 0 )?roottoken.lemma:xcomptoken.lemma,
    'pos': roottoken.pos,
    'negation': negation.length != 0
        }
}

function replaceroot(sentence, lemma)
{
  var rootwordindex = -1
  var rootword = ""

  _.each(sentence['basic-dependencies'], function(value, key, list){
  if (value.dep == "ROOT")
    {
      rootwordindex = key
      rootword = value["dependentGloss"]
      sentence['basic-dependencies'][key]['dependentGloss'] = lemma
    }
  }, this)

  var tokenindex = -1

_.each(sentence['tokens'], function(value, key, list){
  if (value.word == rootword)
    {
      sentence['tokens'][key]['word'] = lemma
      sentence['tokens'][key]['lemma'] = lemma
    }  
  }, this)
  
  return sentence
}

function oppositeintent(label)
{
  var intent = _.keys(label)[0]
  if (["Accept","Reject"].indexOf(intent) == -1)
    throw new Error("error in oppositeintent")

  if (intent == "Accept") return { "Reject":_.values(label)[0] }
  if (intent == "Reject") return { "Accept":_.values(label)[0] }
}

function generateoppositeversion2(dataset, callback)
{
  
  var orig = JSON.parse(JSON.stringify(dataset))
  
  var settogen = {
    "Accept":[],
    "Reject":[]
  }

  _.each(dataset, function(value, key, list){

    // console.log(JSON.stringify(value, null, 4))

    if ((value["input"]["sentences"].length==1) && (value["output"].length == 1))
    {
      var intent = _.keys(JSON.parse(value["output"][0]))[0]

      var roottoken = getroot(value["input"]["sentences"][0])

      if (!((roottoken.negation || ["Accept","Reject"].indexOf(intent)==-1 || ["vb","vbd",/*"vbg",*/"vbn","vbp"/*,"vbz"*/].indexOf(roottoken.pos.toLowerCase())==-1 )))
      {
        var marker = roottoken.lemma + "_"  + roottoken.pos + "_" + roottoken.negation
        // var marker = roottoken.lemma + "_"  + roottoken.negation
        settogen[intent].push({
          "text": value["input"]["text"],
          "root": roottoken,
          "marker": marker,
          "sentence": value["input"]["sentences"]
        })

        // if (marker == "be_false")
          // console.log(JSON.stringify(value, null, 4))
      }
    }
  }, this)

  var countOpAccept = _.pairs(_.countBy(settogen["Accept"], function(num) { return num.marker }))
  countOpAccept = _.sortBy(countOpAccept, function(num){ return num[1] }).reverse()
  // console.log(JSON.stringify(countOpAccept, null, 4))
  countOpAccept = countOpAccept.slice(0,5)

  var countOpReject = _.pairs(_.countBy(settogen["Reject"], function(num) { return num.marker }))
  countOpReject = _.sortBy(countOpReject, function(num){ return num[1] }).reverse()
  // console.log(JSON.stringify(countOpReject, null, 4))
  countOpReject = countOpReject.slice(0,5)

  console.log("DEBUGGEN:"+JSON.stringify(countOpAccept, null, 4))
  console.log("DEBUGGEN:"+JSON.stringify(countOpReject, null, 4))

  var markers = []

  markers = markers.concat(_.map(countOpAccept, function(num){ return num[0] }))
  markers = markers.concat(_.map(countOpReject, function(num){ return num[0] }))

  async.eachSeries(dataset, function(value, callback_local) {
  // _.each(dataset, function(value, key, list){

    if ((value["input"]["sentences"].length==1) && (value["output"].length == 1))
    {
      var intent = _.keys(JSON.parse(value["output"][0]))[0]

      var roottoken = getroot(value["input"]["sentences"][0])

      var marker = roottoken.lemma + "_"  + roottoken.pos + "_" + roottoken.negation

      if (roottoken.negation || markers. indexOf(marker) == -1 ||  ["Accept","Reject"].indexOf(intent) == -1 || ["vb","vbd","vbg","vbn","vbp","vbz"].indexOf(roottoken.pos.toLowerCase())==-1 )
      {
        callback_local(null)
      }
      else
      {
        console.log("DEBUGGEN: "+JSON.stringify(roottoken)+" intent: "+intent)

        async_adapter.getwordnet(roottoken.lemma, roottoken.pos, function(err, results){   

        console.log("DEBUGGEN: num of parts "+results["antonyms"].length + " "+results["synonyms"].length)
          if (results["antonyms"].length>=3 && results["synonyms"].length>=3)
          {
            //_.each(results["antonyms"].slice(0,5), function(ant, key, list){

		var ant = _.sample(results["antonyms"].slice(0,5))
		
        	console.log("DEBUGGEN: chosen ant "+JSON.stringify(ant))

              if (ant[1]>0)
              {
                  console.log("DEBUGGEN: add to corpus "+ant)
                  value["input"]["sentences"][0] = replaceroot(value["input"]["sentences"][0],ant[0])
                  value["output"] = [JSON.stringify(oppositeintent(JSON.parse(value["output"][0])))]

                  orig.push(JSON.parse(JSON.stringify(value)))
              }
            //}, this)

            callback_local(null)
          }
          else
		{
	
            callback_local(null)
		}
        })
      }
    }  
    else
      callback_local(null)

  }, function (err){
    callback(null, orig)
  })
}

 /* async.eachSeries(dataset, function(value, callback_local) {
  // _.each(dataset, function(value, key, list){

    if ((value["input"]["sentences"].length==1) && (value["output"].length == 1))
    {
      var intent = _.keys(JSON.parse(value["output"][0]))[0]

      var roottoken = getroot(value["input"]["sentences"][0])

      if (roottoken.negation || ["Accept"].indexOf(intent)==-1 || ["vb","vbd","vbg","vbn","vbp","vbz"].indexOf(roottoken.pos.toLowerCase())==-1 )
      {
        callback_local(null)
      }
      else
      {
        console.log("READY TO GENERATE: "+JSON.stringify(roottoken)+" intent: "+intent)

        async_adapter.getwordnet(roottoken.lemma, roottoken.pos, function(err, results){   

          if (results["antonyms"].length>=3 && results["synonyms"].length>=3)
          {
            _.each(results["antonyms"].slice(0,5), function(ant, key, list){

		if (ant[1]>0)
		{
                console.log("in process: "+ant)
                value["input"]["sentences"][0] = replaceroot(value["input"]["sentences"][0],ant[0])
                value["output"] = [JSON.stringify(oppositeintent(JSON.parse(value["output"][0])))]

                orig.push(JSON.parse(JSON.stringify(value)))
              	}
            }, this)

            callback_local(null)
          }
          else
            callback_local(null)
        })
      }
    }  
    else
      callback_local(null)

  }, function (err){
    callback(null, orig)
  })
}
*/
function mean_variance(dataset)
{

  dataset = _.map(dataset, function(num){ if (_.isUndefined(num) || _.isNaN(num) || _.isNull(num)) {return 0 }
                                            else return num });

  var result = { 'mean':0, 'variance':0 }

  result['mean'] = _.reduce(dataset, function(memo, num){ return memo + num; }, 0) / dataset.length
  result['variance'] = _.reduce(dataset, function(memo, num){ return memo + Math.pow(num - result['mean'], 2) }, 0) / dataset.length

  return result
}

function generateopposite(dataset, callback)
{
  var orig = JSON.parse(JSON.stringify(dataset))

  async.eachSeries(dataset, function(value, callback_local) {
  // _.each(dataset, function(value, key, list){

    if ((value["input"]["sentences"].length==1) && (value["output"].length == 1))
    {
      var intent = _.keys(JSON.parse(value["output"][0]))[0]

      var roottoken = getroot(value["input"]["sentences"][0])

      if (roottoken.negation || ["Accept"].indexOf(intent)==-1 || ["vb","vbd","vbg","vbn","vbp","vbz"].indexOf(roottoken.pos.toLowerCase())==-1 )
      {
        callback_local(null)
      }
      else
      {
        console.log("READY TO GENERATE: "+JSON.stringify(roottoken)+" intent: "+intent)

        async_adapter.getwordnet(roottoken.lemma, roottoken.pos, function(err, results){   

          if (results["antonyms"].length>=3 && results["synonyms"].length>=3)
          {
            _.each(results["antonyms"].slice(0,5), function(ant, key, list){

    if (ant[1]>0)
    {
                console.log("in process: "+ant)
                value["input"]["sentences"][0] = replaceroot(value["input"]["sentences"][0],ant[0])
                value["output"] = [JSON.stringify(oppositeintent(JSON.parse(value["output"][0])))]

                orig.push(JSON.parse(JSON.stringify(value)))
                }
            }, this)

            callback_local(null)
          }
          else
            callback_local(null)
        })
      }
    }  
    else
      callback_local(null)

  }, function (err){
    callback(null, orig)
  })
}


function cleanFolder(dir)
{
  var graph_files = fs.readdirSync(dir)

  _.each(graph_files, function(value, key, list){ 
    fs.unlinkSync(dir+"/"+value)
  }, this)
}

module.exports = {
  simulaterealds:simulaterealds,
  simulateds:simulateds,
  filterlabels:filterlabels,
  getsetcontext:getsetcontext,
  loadds: loadds,
  getsetnocontext:getsetnocontext,
  uniqueaggregate:uniqueaggregate,
  uniquecandidate:uniquecandidate,
  copyobj:copyobj,
	// aggregate_sagae_improved: aggregate_sagae_improved,
	aggregate_sagae: aggregate_sagae, 
	convertlabeltree: convertlabeltree,
	expl_struct: expl_struct,
	aggregate_results: aggregate_results,
	aggregate_lab: aggregate_lab,
	aggregate_label: aggregate_label,
	resolve_emptiness: resolve_emptiness,
	generate_possible_labels: generate_possible_labels,
	join_labels: join_labels, 
	semlang_ambiguity: semlang_ambiguity,
	bag_of_labels_to_components: bag_of_labels_to_components,
	aggregate_two_nested: aggregate_two_nested,
	confusion_matrix:confusion_matrix,
	intent_attr_label_ambiguity:intent_attr_label_ambiguity,
	intent_attr_dataset_ambiguity:intent_attr_dataset_ambiguity,
	aggregate_label_trick: aggregate_label_trick,
	aggregate_label_no_trick: aggregate_label_no_trick,
	find_path:find_path,
	aggreate_similar:aggreate_similar,
	aggregate_sagae_no_completition: aggregate_sagae_no_completition,
	aggregate_sagae_completition:aggregate_sagae_completition,
	compareresults:compareresults,
	retrievelabels:retrievelabels, 
	sentenceStem:sentenceStem,
	dividedataset: dividedataset,
	filteraccept:filteraccept,
	filterreject:filterreject,
	comparelabels:comparelabels,
	aggregate_rilesbased:aggregate_rilesbased,
	extractturnssingle: extractturnssingle,
	isDialogue:isDialogue,
	average:average,
	complement_number:complement_number,
	truth_sentence:truth_sentence,
	generate_string:generate_string,
	deal:deal,
	intersection:intersection,
	sequencetest:sequencetest,
	convert_to_test:convert_to_test,
	convert_to_train:convert_to_train,
	extractactual:extractactual,
	treatstring:treatstring,
	retrievelabelsbytypes:retrievelabelsbytypes,
	translateLabel:translateLabel,
  resolve_emptiness_rule:resolve_emptiness_rule,
  filterValues:filterValues,
  buildlabel:buildlabel,
  labelFilter:labelFilter,
  filterzerofeatures:filterzerofeatures,
  clone:clone,
  biunormalizer:biunormalizer,
  uniqueArray:uniqueArray,
  // extractturnsneu:extractturnsneu
isactivedialogue:isactivedialogue,
isseqturn:isseqturn,
ishumanturn:ishumanturn,
isactiveturn:isactiveturn,
wrfile:wrfile,
ispermittedturn:ispermittedturn,
loadstopwords:loadstopwords,
isstopword:isstopword,
isInt:isInt,
isNumber:isNumber,
intersection:intersection,
filterdataset:filterdataset,
extractdataset:extractdataset, 
extractdial:extractdial,
isunigram:isunigram,
onlyunigrams:onlyunigrams,
// writecvs:writecvs,
writehtml:writehtml,
skipgrams:skipgrams,
barint:barint,
cleanupkeyphrase:cleanupkeyphrase,
listdiff:listdiff,
listint:listint,
lisunique:lisunique,
intersection:intersection,
uniquecoord:uniquecoord,
onecoverstwo:onecoverstwo,
fullycovered:fullycovered,
equallist:equallist,
vectorsum:vectorsum,
extractintent:extractintent,
isnotokaccept:isnotokaccept,
extractdial_test:extractdial_test,
createcandidates:createcandidates,
ngraminindex:ngraminindex,
extractdatasetallturns:extractdatasetallturns,
generate_labels:generate_labels,
getdist:getdist,
distdistance:distdistance,
coverfilter:coverfilter,
getDist:getDist,
flattendataset:flattendataset,
generateopposite: generateopposite,
getroot:getroot,
replaceroot:replaceroot,
oppositeintent:oppositeintent,
generateoppositeversion2:generateoppositeversion2,
setsize:setsize,
oversample:oversample,
undersample:undersample,
undersampledst:undersampledst,
singlelabeldst:singlelabeldst,
getExm:getExm,
mean_variance:mean_variance,
turnoutput:turnoutput,
processdataset:processdataset,
processdataset1:processdataset1,
processdatasettrain:processdatasettrain,
processdatasettest:processdatasettest,
cleanFolder:cleanFolder,
expanbal:expanbal
}
