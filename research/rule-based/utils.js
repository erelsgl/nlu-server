var _ = require('underscore')._;
var truth_utils = require('./truth_utils')
var fs = require('fs');
var trainAndTest= require('../../utils/trainAndTest').trainAndTest_hash;
var Hierarchy = require('../../Hierarchy');
var multilabelutils = require('limdu/classifiers/multilabel/multilabelutils');
var trainutils = require('../../utils/bars')
var natural = require('natural');
var limdu = require("limdu");
var ftrs = limdu.features
var bars = require('../../utils/bars')
var splitJson = Hierarchy.splitJson
var PrecisionRecall = require("limdu/utils/PrecisionRecall");
var cp = require("child_process");


function generatesentence(record)
{
	var string = record['input']
	_.each(record['found'], function(value, key, list){
		if (isAtrribute(value[1])) 
			string.replace(value[2], '<ATTRIBUTE>')
		else
			string.replace(value[2], '<VALUE>')
	}, this)
	record['generated'] = string
	return record
}
