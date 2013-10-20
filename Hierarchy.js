/**
 * utility functions for Homer.
 */
var _ = require("underscore")._;
var NGramsFromArray = require("limdu/features").NGramsFromArray;

/**
 * @param json a JSON object, such as: {Offer: {Salary: 20000}}
 * @return an array of the parts of the json.
 * -- For example: ["Offer", "Salary", "20000"]
 * @see joinJson
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

/**
 * The opposite of splitJson.
 * @param an array of the parts of the json. For example: ["Offer", "Salary", "20000"]
 * @return a JSON object, such as: {Offer: {Salary: 20000}} 
 * @see splitJson
 */

function joinJson(parts) {
	var json = joinJsonRecursive(parts);
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



/**
 * @param json a JSON object, such as: {Offer: {Salary: 20000}}
 * @return a hash of the parts of the json. For example: {"Offer":1, "Salary":1, "20000":1}
 * @see joinJson
 */
function splitJsonFeatures(json, features) {
	return NGramsFromArray(1, 0, splitJson(json), features);
}

module.exports = {
	splitJson: splitJson,
	joinJson: joinJson,
	splitJsonFeatures: splitJsonFeatures,
}

