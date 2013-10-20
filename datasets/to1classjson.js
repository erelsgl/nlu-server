/**
 * Application for converting a JSON dataset with multiple classes per sample, to a JSON dataset with a single class per sample, by duplicating the samples
 */
var fs = require('fs');
var json = require('limdu/formats/json');

if (process.argv.length<3) {
	console.error("SYNTAX: node tojson <input>");
	process.exit(1);
}


var pathToFile = process.argv[2];
var dataset = JSON.parse(fs.readFileSync(pathToFile));

var newDataset = [];
dataset.forEach(function(sample) {
	sample.output.forEach(function(output) {
		newDataset.push({input: sample.input, output: output});
	});
});

console.log(json.toJSON(newDataset));

