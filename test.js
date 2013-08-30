/**
 * Demonstrates a full text-categorization system, with feature extractors and cross-validation.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var mlutils = require('../machine-learning/utils');
var _ = require('underscore')._;
var fs = require('fs');

console.log("machine learning tester start");

var pathToClassifier = __dirname+"/trainedClassifiers/Employer/MostRecentClassifier.json";
var classifier = mlutils.serialize.fromString(fs.readFileSync(pathToClassifier), __dirname);

//console.log("\nTEST ON WOZ DATASET: ");
//mlutils.testLite(classifier, JSON.parse(fs.readFileSync("datasets/Employer/Dataset1Woz.json")), 0);

console.log("\nTEST ON MANUAL DATASET: ");
mlutils.testLite(classifier, JSON.parse(fs.readFileSync("datasets/Dataset9Manual.json")), 4);

console.log("\nmachine learning tester end");
