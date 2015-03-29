var _ = require('underscore')._; 
var natural = require('natural');
var execSync = require('execSync');
var bars = require('../../utils/bars');
var fs = require('fs');
var natural = require('natural');

var mod = ['will','might','can']
var neg = ['not', 'no', 'never']
var ppdbbuffer = {}


// test
// 'original'
// 'filtered'

// 'train'
// original
// filtered
// keyphrase

// if keyphrase is mutated by list in string
// mutation should somewhere close to keyphrase

function mutation(string, keyphrase, list)
{
	var string = _.flatten(natural.NGrams.ngrams(string, 1))
	var keyphrase = _.flatten(natural.NGrams.ngrams(keyphrase, 1))
	var pos = []
	var listpos = []

	_.each(string, function(el, key, list1){ 
		var p = keyphrase.indexOf(el)
		if (p != -1) pos.push(p)
	}, this)

	_.each(list, function(el, key, list2){ 
		var l = string.indexOf(el)
		if (l != -1) listpos.push(l)
	}, this)

	if (listpos.length == 0) return false

	pos = _.sortBy(pos,  function(num){ return num; });
	listpos = _.sortBy(listpos,  function(num){ return num; });

	var res = false

	_.each(listpos, function(value1, key1, list1){ 
		var output = true
		_.each(pos, function(value, key, list){ 
			if (Math.abs(value1 - value) > 2)
				output = false
		}, this)
		if (output) res = true
	}, this)
	return res
}

function permit(result, test)
{
	var offer = true
	if (test['input_modified'].indexOf("VALUE") == -1)
		offer = false

	if (result['classes'].indexOf('Offer') != -1 && !offer)
		return false

	return true
}

function intent_dep(test, train)
{
	var intent = train['intent']
	var offer = true
	
	var test_source = test
	var train_source = train

	test = test['filtered']

	if (_.isArray(train['keyphrase']))
		keyphrase = _.last(train['keyphrase'])
	else
		keyphrase = train['keyphrase']

	var test = _.flatten(natural.NGrams.ngrams(test, 1))
	var keyphrase = _.flatten(natural.NGrams.ngrams(keyphrase, 1))

	var test_or = test
	var keyphrase_or = keyphrase

	keyphrase = _.difference(keyphrase, neg.concat(mod))
	test = _.difference(test, neg.concat(mod))

	if (_.isEqual(_.intersection(test,keyphrase), keyphrase) == true)
		{

		var testm = mutation(test_source['filtered'], _.last(train_source['keyphrase']), mod)
		var trainm = _.intersection(keyphrase_or, mod).length > 0

		// it looks like the modality of test doesn't influence

		if (!trainm && testm && intent == 'Offer')
			return {'classes':['Offer'],
					'explanation':{'keyphrases': train_source['keyphrase']},
					'reason': 'keyphrase modal and test is not and Intent Offer'
					}

		if ((!trainm) && (testm) && (intent == 'Accept'))
			return {'classes':['Offer'],
					'explanation':{'keyphrases': train_source['keyphrase']},
					'reason': 'modality of accept'
					}

		if (!trainm && testm && intent == 'Reject')
			return {'classes':['Reject'],
					'explanation':{'keyphrases': train_source['keyphrase']},
					'reason': 'modality of reject'
					}


		var testn = mutation(test_source['filtered'], _.last(train_source['keyphrase']), neg)
		var trainn = _.intersection(keyphrase_or, neg).length > 0

		if (trainn && !testn)
			return {'classes':[],
					'explanation':"",
					}

		if (!trainn && testn)
			return {'classes':['Reject'],
					'explanation':{'keyphrases': train_source['keyphrase']},
					'reason': 'negation of offer'
					}

		if (trainm && !testm)
			return {
					'classes':[],
					'explanation':"",
					// 'classes':[intent],
					// 'explanation':{'keyphrases': train_source['keyphrase']},
					// 'reason': 'modality of keyphrase and test is ok'
					}

		if ((testn && trainn) || (!testm && !trainm))
			return {'classes':[intent],
					'explanation':{'keyphrases': train_source['keyphrase']},
					'reason': 'clean equality'
					}
		if ((testm && trainm) || (!testm && !trainm))
			return {'classes':[intent],
					'explanation':{'keyphrases': train_source['keyphrase']},
					'reason': 'clean equality'
					}

		}
		
		return {
			'classes': [],
			'explanation': ""
		}


}

function isOK(test)
{
  var ok = ['Ok','OK','okay','ok']

  var unig = _.flatten(natural.NGrams.ngrams(test['filtered'], 1))

  if (_.filter(unig, function(num){ return ok.indexOf(num) != -1 }).length > 0)
    if (unig.length < 3)
      return true
  return false
}

function isNO(test)
{
  var no = ['NO','No','no']

  var unig = _.flatten(natural.NGrams.ngrams(test['filtered'], 1))

  if (_.filter(unig, function(num){ return no.indexOf(num) != -1 }).length > 0)
   	if (unig.length < 3)
      return true
  return false
}

function onlyOffer(test)
{
	    // "input_modified": "<VALUE> as previously discussed",
	var norm = test['input_modified']
 
  	var unig = _.flatten(natural.NGrams.ngrams(norm, 1))
  	unig = _.without(unig, "<VALUE>")
  	unig = _.without(unig, "VALUE")
  	unig = _.without(unig, "<ATTRIBUTE>")
  	unig = _.without(unig, "ATTRIBUTE")
  	if (unig.length < 3)
  	{
  		return true
  	}
  	else
  		return false
}

function simpledistance(one, two)
{
	var distance = 0
	// 0.4 - for not correct order
	// 0.6 - for missing stopword
	// 1 - for missing content
  var one = _.flatten(natural.NGrams.ngrams(one, 1))
  var two = _.flatten(natural.NGrams.ngrams(two, 1))

  _.each(two, function(value, key, list){ 
  	if (one[key] != value)
  		distance += 0.3
  }, this)

  var diff = _.difference(one,two)
  _.each(diff, function(value, key, list){ 
  	if (bars.isstopword(value))
  		distance += 0.5
  	else
  		distance += 1
  }, this)
  return distance
}


function skipexpansion(keyphrase)
{
	if (_.isArray(keyphrase))
		keyphrase = keyphrase[0]

	var skipgrams = []
	skipgrams = skipgrams.concat(bars.skipgrams(keyphrase, 2, 4)).
						  concat(bars.skipgrams(keyphrase, 3, 4)).
						  concat(natural.NGrams.ngrams(keyphrase, 1))

	skipgrams = _.unique(skipgrams)
	skipgrams = _.map(skipgrams, function(value){ return value.join(" ") });
	skipgrams = _.reject(skipgrams, function(num){ return bars.isstopword(num); });

	if (!_.isArray(skipgrams)) skipgrams = [skipgrams]

	skipgrams = _.sortBy(skipgrams, function(num){ return simpledistance(keyphrase, num) });

	return skipgrams
}


function ppdbexpansion(string)
{
	if (string in ppdbbuffer)
		return ppdbbuffer[string]

	if (!_.isArray(string)) string = [string, string]
	fs.writeFileSync(__dirname + "/../../utils/featureexp_input", JSON.stringify(string, null, 4), 'utf-8')
	
	var scale = '[2]'
	var result = execSync.run("node "+__dirname+"/../../utils/featureexp.js '"+scale+"' "+0);
	var results = JSON.parse(fs.readFileSync(__dirname+"/../../utils/featureexp_output"))
	
	fs.unlinkSync(__dirname+"/../../utils/featureexp_input")
	fs.unlinkSync(__dirname+"/../../utils/featureexp_output")

	ppdbbuffer[string] = Object.keys(results)

	return Object.keys(results)
}

function predicate(test, train)
{
	if (_.isArray(train['keyphrase']))
		train['keyphrase'] = train['keyphrase'][0]

	var intent = train['intent']
	var skipgrams = []
	var C = 3.7
	var paths = [{'path':[].concat(train['keyphrase']), 'score': 0}]

	var result = intent_dep(test, train)
	if (result['classes'].length != 0)
		return result

	paths[0]['result'] = result
	var bestpath = 0

	// full up the paths with skipgrams
	_.each(skipexpansion(train['keyphrase']), function(value, key, list){ 
		paths.push({'path':paths[0]['path'].concat(value), score:paths[bestpath]['score']+simpledistance(train['keyphrase'], value)})
	}, this)

	console.log(paths)

	paths = _.sortBy(paths,  function(num){ return num['score']; })

	// check result for every skip
	_.each(paths, function(value, key, list){ 
			paths[key]['result'] = intent_dep(test, {'keyphrase': _.last(value['path']), 'intent': intent})
	}, this)

	paths = paths.splice(1,paths.length-1)

	var result = _.find(paths, function(path){ return path['result']['classes'].length > 0 });
	if (typeof result != "undefined") {
		return result
	}

	// as result all skipgrams with empty results
	// console.log(JSON.stringify(paths, null, 4))

	while (true) {

		if (paths[0]['score'] > C)
			return {'classes': [],
	  				'explanation': ""}

	  	var champion = {}

	  	_.each(ppdbexpansion(_.last(paths[0]['path'])), function(value, key, list){ 
	  		_.each(skipexpansion(value), function(skip, key1, list1){ 
				var result = intent_dep(test, {'keyphrase': skip, 'intent': intent})
				if (result['classes'].length > 0)
				{
					paths.push({'path':paths[0]['path'].concat(value).concat(skip), 'score': 'complete'})
					if (Object.keys(champion) == 0)
						{
						champion = result
						champion['explanation']['keyphrases'] = paths[0]['path'].concat(value).concat(skip)
						champion['explanation']['score'] = paths[0]['score'] + simpledistance(value, skip) + 1
						}
				}
	  		}, this)
	  		if (Object.keys(champion) == 0)
				paths.push({'path':paths[0]['path'].concat(value), 'score': paths[0]['score']+1})
	  	}, this)

	  	if (Object.keys(champion) != 0)
	  		return champion
	  	
		paths = paths.splice(1,paths.length-1)

		paths = _.sortBy(paths,  function(num){ return num['score']; })

		console.log(paths)
	}
}


module.exports = {
  intent_dep: intent_dep,
  predicate:predicate,
  isOK:isOK,
  isNO:isNO,
  mutation:mutation,
  permit:permit,
  onlyOffer:onlyOffer,
  simpledistance:simpledistance,
  ppdbexpansion:ppdbexpansion,
  skipexpansion:skipexpansion
}