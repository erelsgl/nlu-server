/**
 * Demonstrates serialization of an object with a custom toJSON and fromJSON functions
 */

console.log("serialize demo start");

var assert = require('assert');

console.log("\nDefine a paper library");

function newPaperLib() { 
	var Paper = require(__dirname+'/classes/Paper');
	var Library = require(__dirname+'/classes/Library');
	return new Library(Paper, function(name){return "--"+name+"--";});
}
var paperLib = newPaperLib();
paperLib.add("paper1");
paperLib.add("paper2");
assert(paperLib.string() == "Paper:--paper1--,Paper:--paper2--");


console.log("\nSerialize, deserialize and compare the results");

var serialize = require('../');

var paperLibString = serialize.toString(paperLib, newPaperLib);
var paperLibCopy = serialize.fromString(paperLibString, __dirname);
assert(paperLibCopy.string() == "Paper:--paper1--,Paper:--paper2--");

console.log("\nMake sure we can update the deserialized object");
paperLibCopy.add("paper3"); 
assert(paperLibCopy.string() == "Paper:--paper1--,Paper:--paper2--,Paper:--paper3--");

console.log("\nserialize demo end");
