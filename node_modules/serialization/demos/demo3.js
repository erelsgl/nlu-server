/**
 * Demonstrates serialization of an array of objects of different kinds.
 * CURRENTLY DOESN'T WORK
 */
console.log("serialize demo start");
var assert = require('assert');

console.log("\nDefine a polymorphic library:");

function newLib() { 
	var LibraryPolymorphic = require(__dirname+'/classes/LibraryPolymorphic');
	return new LibraryPolymorphic();
}

var lib = newLib();

var Book = require(__dirname+'/classes/Book');
var Paper = require(__dirname+'/classes/Paper');
var book1 = new Book(function(name){return name;});
book1.setName("book1");
var paper1 = new Paper(function(name){return name;});
paper1.setName("paper1");
lib.add(book1);
lib.add(paper1);
console.log(lib.string());
assert(lib.string() == "Book:book1,Paper:paper1");


console.log("\nSerialize, deserialize and compare the results");

var serialize = require('../');
var libString = serialize.toString(lib, newLib);
var libCopy = serialize.fromString(libString, __dirname);
assert(libCopy.string() == "Book:book1,Paper:paper1");  // TypeError: Object #<Object> has no method 'string'

//console.log("\nMake sure we can update the deserialized object");
//var paper2 = new Paper(function(name){return name;});
//paper2.setName("paper2");
//libCopy.add(paper2);
//console.log(libCopy.string());
//assert(libCopy.string() == "Book:book1,Paper:paper1,Paper:paper2");

console.log("\nserialize demo end");
