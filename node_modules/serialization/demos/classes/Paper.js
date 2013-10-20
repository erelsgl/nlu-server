
function Paper(formatFunction) {
	if (!(formatFunction instanceof Function))
		throw new Error("formatFunction is not a function");
	this.formatFunction = formatFunction;
}
Paper.prototype = {
	setName: function(newName) { this.name = newName; },
	getName: function() { return this.name; },
	string: function() { return "Paper:"+this.formatFunction(this.name); }
};

module.exports = Paper;
