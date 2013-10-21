if (process.argv.length<3) {
	console.error("SYNTAX: node spellcorrect <input>");
	process.exit(1);
}

var fs = require('fs');
var json = require('limdu/formats/json');
var pathToFile = process.argv[2];
var dataset = JSON.parse(fs.readFileSync(pathToFile));

require('../SpellingCorrecter').initialize(function(speller) {
	var newDataset = [];

	dataset.forEach(function(sample) {
		newDataset.push({input: speller.correct(sample.input), output: sample.output});
	});

	console.log(json.toJSON(newDataset));
})

