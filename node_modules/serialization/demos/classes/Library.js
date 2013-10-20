/**
 * A library that can contain a single type of object (either Book or Paper).
 */

function Library(itemType, itemFormatFunction) {
	if (!(itemFormatFunction instanceof Function))
		throw new Error("itemFormatFunction is not a function");
	this.items = [];
	this.itemType = itemType;
	this.itemFormatFunction = itemFormatFunction;
}
Library.prototype = {
	add: function(name) { 
		var newItem = new this.itemType(this.itemFormatFunction);
		newItem.setName(name);
		this.items.push(newItem); 
	},
	string: function () {
		var titles = [];
		this.items.forEach(function(item) {
			titles.push(item.string());
		});
		return titles.join(",");
	},
};

Library.prototype.toJSON = function() {
	// keep only the names of the books or papers (the type is kept during initialization):
	var json = this.items.map(function(item) {
		return item.name;
	}, this);
	return json;
}

Library.prototype.fromJSON = function(json) {
	// restore the books or papers from their names (the type is kept during initialization):
	json.forEach(function(itemname) {
		this.add(itemname);
	}, this);
}


module.exports = Library;