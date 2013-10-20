/**
 * Application for converting a all classes in a dataset from JSON strings to objects.
 */

if (process.argv.length<3) {
	console.error("SYNTAX: node toobjects <input>");
	process.exit(1);
}

var fs = require('fs');
var json = require('limdu/formats/json');
var pathToFile = process.argv[2];
var dataset = JSON.parse(fs.readFileSync(pathToFile));

var newDataset = [];
dataset.forEach(function(sample) {
	var parsedOutput = (sample.output instanceof Array?
		sample.output.map(JSON.parse):
		JSON.parse(sample.output));
	newDataset.push({input: sample.input, output: parsedOutput});
});

console.log(json.toJSON(newDataset));

