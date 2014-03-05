/**
 * utility functions for Homer and PartialClassification.
 */
var _ = require("underscore")._;
var NGramsFromArray = require("limdu/features").NGramsFromArray;

/**
 * @param json a JSON object, such as: [ '{"Offer":{"Leased Car":"Without leased car"}}','{"Offer":{"Pension Fund":"10%"}}' ]
 * @return an array of three arrays with devision on intent, attribute and value
 * -- For example:  [ [ 'Offer' ], [ 'Leased Car', 'Pension Fund' ], [ 'Without leased car', '10%' ] ]
 */

function splitPartEqually(json) {	
	// return _.map(_.uniq(_.flatten(json.map(this.splitJson)) ), function(num){ return [num];})
	label = []	

	_(3).times(function(n){
		label[n] = []
		_.each(json.map(splitJson), function(value, key, list){
			label[n] = label[n].concat(value[n])
		})
		label[n] = _.uniq(_.compact(label[n]))
	})
	return label
}

/**
 * @param json a JSON object, such as: [ '{"Offer":{"Leased Car":"Without leased car"}}','{"Offer":{"Pension Fund":"10%"}}' ]
 * @return an array of three arrays with devision on intent, attribute and attribute:value
 * -- For example:  [ [ 'Offer' ],[ 'Leased Car', 'Pension Fund' ],[ 'Leased Car:Without leased car', 'Pension Fund:10%' ] ]
 */

function splitPartVersion1(json) {
	label = []	

	_(3).times(function(n){
		label[n] = []
		_.each(json.map(splitJson), function(value, key, list){
			if (n < value.length )
			{
				if (n!=2)
				{
					label[n] = label[n].concat(value[n])
				}
			else {
				label[n] = label[n].concat(label[n-1][key]+":"+value[n])
			}
			}
		}, this)
		// label[n] = _.uniq(_.compact(label[n]))
	}, this)

	return _.map(label, function(lab){ return _.uniq(_.compact(lab))})
}

/**
 * @param json a JSON object, such as: [ '{"Offer":{"Leased Car":"Without leased car"}}','{"Offer":{"Pension Fund":"10%"}}' ]
 * @return an array of three arrays with devision on intent, attribute:value
 * -- For example:   [ [ 'Offer' ],[ 'Leased Car:Without leased car', 'Pension Fund:10%' ] ]
 */

function splitPartVersion2(json) {
	label = []	

	_(3).times(function(n){
		if (n!=2) label[n] = []
		_.each(json.map(splitJson), function(value, key, list){
			if (n < value.length )
			{
			if (n!=2)
				{
					label[n] = label[n].concat(value[n])
				}
			else {
				label[1][key] = label[1][key] + ":" + value[n]
				// = label[n].concat(label[n-1][key]+":"+value[n])
			}
			}
		}, this)
		// if (n!=2) label[n] = _.uniq(_.compact(label[n]))
	}, this)

	return _.map(label, function(lab){ return _.uniq(_.compact(lab))})
}

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
	splitPartEqually: splitPartEqually,
	splitPartVersion1: splitPartVersion1,
	splitPartVersion2: splitPartVersion2,
}

