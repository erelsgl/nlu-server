
function Book(formatFunction) {
	if (!(formatFunction instanceof Function))
		throw new Error("formatFunction is not a function");
	this.formatFunction = formatFunction;
}
Book.prototype = {
	setName: function(newName) { this.name = newName; },
	getName: function() { return this.name; },
	string: function() { return "Book:"+this.formatFunction(this.name); }
};

module.exports = Book;
