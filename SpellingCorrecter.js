var spellchecker = require('wordsworth').getInstance();
var fs = require('fs');
var path = require('path');
var base = path.join(__dirname, "knowledgeresources", "spelling");


module.exports = {
	initialized: false,
	
	initialize: function(callback) {
		/*console.log('wordsworth speller initialization start');
		spellchecker.initialize(
				path.join(base,'seed.txt'),
				path.join(base,'training.txt'), function() {
				console.log('wordsworth speller initialization end');
				module.exports.initialized = true;
				callback(module.exports);
			}		
		);*/
		
		spellchecker.initializeSync(
				fs.readFileSync(path.join(base,'seed.txt'),'utf-8').split("\n"),
				fs.readFileSync(path.join(base,'training.txt'),'utf-8').split("\n")
		);
		module.exports.initialized = true;
		callback(module.exports);
	},
	
	correct: function(sentence) {
		if (!module.exports.initialized) {
			console.error("Spellchecker not initialized yet - please wait");
			return sentence;	
		}
		if (sentence.length==0) return sentence; // work around a bug in wordsworth
		sentence = sentence.replace(/\\+/g," ");
		sentence = sentence.replace(/^\s+/g,""); // remove leading spaces
		sentence = sentence.replace(/\s+$/g,""); // remove trailing spaces - work around a bug in wordsworth
		console.log("spellcorrect '"+sentence+"'");
		var analysis = spellchecker.analyze(sentence);
		//console.log(analysis);
		for (var badword in analysis) {
			if (analysis[badword].length>0)
				sentence = sentence.replace(new RegExp(badword,"i"), analysis[badword][0]);
		}
		console.log("             '"+sentence+"'");
		return sentence;
	},
}
