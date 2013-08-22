var spellchecker = require('wordsworth').getInstance();
var base = "knowledgeresources/spelling/";

module.exports = {
	initialized: false,
	
	initialize: function(callback) {
		console.log('wordsworth speller initialization start');
		spellchecker.initialize(
			base+'seed.txt',
			base+'training.txt', function() {
				console.log('wordsworth speller initialization end');
				module.exports.initialized = true;
				callback(module.exports);
			}		
		);
	},
	
	correct: function(sentence) {
		if (!module.exports.initialized) {
			console.error("Spellchecker not initialized yet - please wait");
			return sentence;	
		}
		console.log("spellnormalize '"+sentence+"'");
		var analysis = spellchecker.analyze(sentence);
		//console.log(analysis);
		for (var badword in analysis) {
			if (analysis[badword].length>0)
				sentence = sentence.replace(new RegExp(badword,"i"), analysis[badword][0]);
		}
		return sentence;
	},
}
