var _ = require('underscore')._; 
var natural = require('natural');

function strict_keyphrase(test,train)
{

	var test = _.flatten(natural.NGrams.ngrams(test, 1))
	var train = _.flatten(natural.NGrams.ngrams(train, 1))

	if (_.isEqual(_.intersection(test,train), train) == true)
		return true
	else
		return false
}

module.exports = {
  strict_keyphrase: strict_keyphrase
}