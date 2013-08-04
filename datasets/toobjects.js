/**
 * Application for converting a all classes in a dataset from JSON strings to objects.
 */

var fs = require('fs');
var pathToFile = process.argv[2];
var dataset = JSON.parse(fs.readFileSync(pathToFile));

var write = function(json) {
	console.log("[");
	for (var i=0; i<json.length; ++i) {
		console.log(
			(i>0? ", ": "  ")+
			JSON.stringify(json[i]));
	}	
	console.log("]");
}

var newDataset = [];
dataset.forEach(function(sample) {
	var parsedOutput = (sample.output instanceof Array?
		sample.output.map(JSON.parse):
		JSON.parse(sample.output));
	newDataset.push({input: sample.input, output: parsedOutput});
});

write(newDataset);

