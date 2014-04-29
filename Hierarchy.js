/**
 * utility functions for Homer and PartialClassification.
 */
var _ = require("underscore")._;
var NGramsFromArray = require("limdu/features").NGramsFromArray;


/**
 * OrderLabelJoin comprises the labels in the separated format to labels within original JSON format.
 * developemnt in progress
 */
function OrderLabelJoin(classes, Observable, sample, explanation)
{
	sample = "[start] "+sample+" [end]"
	labelfeat = []

	for (label in explanation['positive'])
	{
		sorted = _.sortBy(explanation['positive'][label], function(num){ return num[1]; });
		sorted = sorted.reverse()
		labelfeat.push([label,sample.indexOf(sorted[0][0]), sorted[0][0]])
	}
}

/**
 * @param json a JSON object, such as: [ '{"Offer":{"Leased Car":"Without leased car"}}','{"Offer":{"Pension Fund":"10%"}}' ]
 * @return an array of three arrays with devision on intent, attribute and value
 * -- For example:  [ [ 'Offer' ], [ 'Leased Car', 'Pension Fund' ], [ 'Without leased car', '10%' ] ]
 */

function splitPartEqually(json) {	
	// return _.map(_.uniq(_.flatten(json.map(this.splitJson)) ), function(num){ return [num];})
	label = []	

	_(3).times(function(n){
		buf = []
		_.each(json.map(Compensate), function(value, key, list){
			if (value.length > n)
			{
			if (_.compact(value[n].toString()).length != 0)
				buf = buf.concat(value[n])
			}
		})
		
		// buf = _.uniq(_.compact(buf))
		// buf = _.uniq(_.compact(buf))
	 	// if (buf.length != 0) label[n] = buf

		buf = _.uniq(buf)

		if ((buf.length > 0) && (typeof(buf[0])!="undefined"))
			label[n] = buf
		if ((typeof(buf[0])=="undefined"))
			label[n] = []

	})


		
	return label
}

/**
 * @param the result of Partial Classification
 * @return the intent from the given classification
 * input: [ [ 'Offer', 'Offer' ],
 *  		[ 'Working Hours', 'Leased Car' ],
 * 			[ '9 hours', 'With leased car' ] ]
 * output: [ 'Offer', 'Offer' ]
 */
function retrieveIntent(values)
	{	
	return values[0]
	}

function splitPartEquallyIntent(json) 
	{	
	return retrieveIntent(splitPartEqually(json))
	}

/**
 * @param a bag of all possible labels for a given sample after classification and observation is a tree of label hierarchy
 * @return a set of consistent labels from the observation that could be built by greedy constructing for the bag of labels.
 */
function greedyLabelJoin(values, observation)
	{
 	values = _.flatten(values)
	possib = []
		for (intent in observation)
		{
		for (attr in observation[intent])
			{
			if (Object.keys(observation[intent][attr]).length==0)
				if ((values.indexOf(intent)!=-1) && (values.indexOf(attr)!=-1))
					possib.push(joinJson([intent,attr]))
			for (value in observation[intent][attr])
				{
				if ((values.indexOf(intent)!=-1) && (values.indexOf(attr)!=-1) && (values.indexOf(value)!=-1))
					{
					possib.push(joinJson([intent,attr,value]))
					}
				}
			}
		}
	return [possib]
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

function Compensate(json) {
		// console.log(json)
	js = splitJson(json)
	if ((js.length == 2) && (js[1].toString()[0] != js[1].toString()[0].toUpperCase()))
		{
		js.push(js[1])
		js[1] = ""
		}
	return js
}

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

function joinLabels(values, observable) {
	possib = []
	for (intent in observable)
			{
			for (attr in observable[intent])
				{
				if (Object.keys(observable[intent][attr]).length==0)
					if ((values.indexOf(intent)!=-1) && (values.indexOf(attr)!=-1))
						possib.push(this.joinJson([intent,attr]))
				for (value in observable[intent][attr])
					{
					// console.log(intent+attr+value)
					if ((values.indexOf(intent)!=-1) && (values.indexOf(attr)!=-1) && (values.indexOf(value)!=-1))
						{
						possib.push(this.joinJson([intent,attr,value]))
						}
					}
				}
			}
	return possib
}

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
	joinLabels: joinLabels,
	greedyLabelJoin: greedyLabelJoin, 
	retrieveIntent: retrieveIntent,
	splitPartEquallyIntent: splitPartEquallyIntent,
	OrderLabelJoin: OrderLabelJoin,
}

