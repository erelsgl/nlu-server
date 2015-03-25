var _ = require('underscore')._; 
var natural = require('natural');
var execSync = require('execSync');

function strict_keyphrase(test, train, train_sentence)
{

	var negation = ['not']
	var modality = ['will','might']

	var test = _.flatten(natural.NGrams.ngrams(test, 1))
	var train = _.flatten(natural.NGrams.ngrams(train, 1))

	var test_or = test
	var train_or = train

	_.every(negation, function(el){test = _.without(test, el)}, this)
	_.every(modality, function(el){test = _.without(test, el)}, this)

	_.every(negation, function(el){train = _.without(train, el)}, this)
	_.every(modality, function(el){train = _.without(train, el)}, this)

	if (_.isEqual(_.intersection(test,train), train) == true)
		{

		var a = _.intersection(test_or, modality).length > 0
		var b = _.intersection(train_or, modality).length > 0

		if ((a && !b) || (b && !a))
			return false

		var a = _.intersection(test_or, negation).length > 0
		var b = _.intersection(train_or, negation).length > 0

		if ((a && !b) || (b && !a))
			return false

		return true
		}
		
	else
		return false
}

function predicate(test, train, train_sentence)
{
	var result = execSync.exec("node "+__dirname+"/../../utils/getpos.js '"+ train_sentence+"'")
	result = JSON.parse(result['stdout'].replace(/\'/g, '"'))
	console.log(result)
	process.exit(0)

}

module.exports = {
  strict_keyphrase: strict_keyphrase,
  predicate:predicate
}