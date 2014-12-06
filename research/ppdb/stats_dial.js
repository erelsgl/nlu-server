// 106 dialogues

var _ = require('underscore')._; 
var fs = require('fs');

var data = []

data = JSON.parse(fs.readFileSync("../../../datasets/DatasetDraft/dial_usa_rule.json"))


var gooddial = 0
var newagentgood = 0

_.each(data, function(value, key, list){
	if (value['status'].indexOf("goodconv") != -1)
		{
			gooddial += 1;
 			
 		}
}, this)

console.log(data.length)

console.log("gooddial "+gooddial)
// 61 dialogues that marked as "goodconv"



