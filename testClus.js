/**
 * Test categorization with the Clus system..
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var mlutils = require(__dirname+'/../machine-learning/utils');
var FeatureExtractor = require(__dirname+'/../machine-learning/features');
var _ = require('underscore')._;
var fs = require('fs');

console.log("Clus tester start");


var grammarDataset = JSON.parse(fs.readFileSync("datasets/Employer/Dataset0Grammar.json"));
var collectedDatasetMulti = JSON.parse(fs.readFileSync("datasets/Employer/Dataset1Woz.json"));
var collectedDatasetSingle = JSON.parse(fs.readFileSync("datasets/Employer/Dataset1Woz1class.json"));
var collectedDatasetMulti2 = JSON.parse(fs.readFileSync("datasets/Employer/Dataset2Woz.json"));
var collectedDatasetMulti3 = JSON.parse(fs.readFileSync("datasets/Employer/Dataset3Expert.json"));
var collectedDatasetMulti4 = JSON.parse(fs.readFileSync("datasets/Employer/Dataset4WozAmt.json"));

var featureExtractor = FeatureExtractor.WordsFromText(2,false/*,4,0.6*/);

mlutils.arff.toARFFs("datasets/Employer",
	{
		"Dataset0Grammar": grammarDataset,
		"Dataset1Woz": collectedDatasetMulti,
		"Dataset1Woz1class": collectedDatasetSingle,
		"Dataset2Woz": collectedDatasetMulti2,
		"Dataset3Expert": collectedDatasetMulti3,
		"Dataset4WozAmt": collectedDatasetMulti4,
	},
	featureExtractor);

/* run Clus on the arff files */
var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout); sys.puts(stderr); }
exec("java -jar ~/Dropbox/Clus/Clus.jar ./testClus.s", puts);

console.log("Clus tester end");
