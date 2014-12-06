// 106 dialogues

var _ = require('underscore')._; 
var fs = require('fs');

var data = []

data = JSON.parse(fs.readFileSync("../../../datasets/DatasetDraft/dial_usa_rule.json"))


var gooddial = 0
var newagentgood = 0
var kbagentgood = 0
var numberofturns = []

_.each(data, function(value, key, list){
	if (value['status'].indexOf("goodconv") != -1)
		{

			gooddial += 1
			var evens = _.filter(value['users'], function(str){ return str.match(/NewAgent/) != undefined });
			if (evens != 0)	newagentgood += 1	
 			
			var evens = _.filter(value['users'], function(str){ return str.match(/KBAgent/g) != undefined });
			if (evens != 0)	kbagentgood += 1		

			var dial = []
			dial.push(_.filter(value['turns'], function(turn){ return turn['status'] == 'active' }).length)
			dial.push(_.filter(value['turns'], function(turn){ return turn['status'] == 'inactive' }).length)
 			numberofturns.push(dial)
 		}
}, this)

console.log(data.length)

console.log("gooddial "+gooddial)
// 61 dialogues that marked as "goodconv"
console.log("newagentgood" + newagentgood)
// 31 dialogues
console.log("kbagentgood" + kbagentgood)
// 30 dialogues
console.log(numberofturns)
// huge variance
console.log()
// average number of turns



