/**
 * Tests the NLU component.
 */

var mlutils = require('limdu/utils');
var serialization = require('serialization');
var _ = require('underscore')._;
var fs = require('fs');

console.log("machine learning tester start");

var pathToClassifier = __dirname+"/trainedClassifiers/Employer/MostRecentClassifier.json";
var classifier = serialization.fromString(fs.readFileSync(pathToClassifier), __dirname);

console.log("\nTEST ON MANUAL DATASET: ");
mlutils.testLite(classifier, JSON.parse(fs.readFileSync("datasets/Dataset9Manual.json")), 4);

console.log("\nmachine learning tester end");
