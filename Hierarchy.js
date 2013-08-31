/**
 * A utility function for Homer.
 */
var _ = require("underscore")._;

/**
 * @param json a JSON object, such as: {Offer: {Salary: 20000}}
 * @param depth an integer >= 1.
 * @return a view of the top-level parts of the json object.
 * -- For example, for depth=1: "Offer". For depth=2: "{Offer: Salary}". For depth=3: "{Offer: {Salary: 20000}}", etc.
 */
function shallowJson(json, depth) {
	if (!_.isObject(json))
		return json;
	var firstKey = Object.keys(json)[0];
	if (depth<=1) {
		return firstKey;
	} else {
		var shallow = {};
		shallow[firstKey] = shallowJson(json[firstKey], depth-1);
		return shallow;
	}
}


/**
 * @param json a JSON object, such as: {Offer: {Salary: 20000}}
 * @return an array of the parts of the json.
 * -- For example: ["Offer", "Salary", "20000"]
 */
function splitJson(json) {
	return splitJsonRecursive(_.isString(json) && /{.*}/.test(json)?
		JSON.parse(json):
		json);
}
 
function splitJsonRecursive(json) {
	if (!_.isObject(json))
		return [json];
	var firstKey = Object.keys(json)[0];
	var rest = splitJsonRecursive(json[firstKey]);
	rest.unshift(firstKey);
	return rest;
}

function joinJson(parts) {
	var json = joinJsonRecursive(parts);
	//console.dir("joinJson "+JSON.stringify(parts)+" = "+JSON.stringify(json));
	return _.isString(json)? json: JSON.stringify(json);
}

function joinJsonRecursive(parts) {
	var firstKey = parts[0];
	if (parts.length<=1)
		return (firstKey=='true'? true: firstKey);
	else {
		var result = {};
		result[firstKey] = joinJsonRecursive(parts.slice(1));
		return result;
	}
}

module.exports = {
	shallowJson: shallowJson,
	splitJson: splitJson,
	joinJson: joinJson,
}

