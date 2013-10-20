/**
 * A library that can contain different types of objects (Books and Papers)
 */

function LibraryPolymorphic() {
	this.items = [];
}
LibraryPolymorphic.prototype = {
	add: function(newItem) { 
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

module.exports = LibraryPolymorphic;
