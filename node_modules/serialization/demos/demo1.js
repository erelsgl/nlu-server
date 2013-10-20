/**
 * Demonstrates serialization of an object with a function argument
 */

console.log("serialize demo start");

var assert = require('assert');

console.log("\nDefine a function for creating a new book with a custom function:");
function newBook() {
	var Book = require(__dirname+'/classes/Book');
	return new Book(
		function(name) {
			return "**"+name+"**";
		} 
	);
}
console.log("Use that newBook function to create a new variable:");
var myBook = newBook();
console.log("Set a field in that variable:");
myBook.setName("book1");
console.log("Check that the variable works as expected:");
assert(myBook.string() == "Book:**book1**");

var serialize = require('../');

console.log("Serialize that variable and its newBook function:");
var bookString = serialize.toString(myBook, newBook);
console.log("Deserialize the variable:");
var bookCopy = serialize.fromString(bookString, __dirname);
console.log("Check that the variable works as before:");
assert(bookCopy.string() == "Book:**book1**");

console.log("Make sure we can update the deserialized object:");
bookCopy.setName("book2"); 
assert(bookCopy.string() == "Book:**book2**");

console.log("\nserialize demo end");
