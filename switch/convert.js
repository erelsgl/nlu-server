var _ = require('underscore')._;
var fs = require('fs');
var labels = JSON.parse(fs.readFileSync('./lab.json'));

var data = fs.readFileSync("./discourse", "utf-8").split("\n")
// console.log(JSON.stringify(data, null, 4))
var dataset = []

_.each(data, function(value, key, list){

	var parts = value.split(" ")
	var act = parts[0]
	act = act.replace(/\^.*/g,'')
	var string = value.substring(value.indexOf(":")+2)

	if (["x", "%", "% -", "+", "b", "o@", "+@", ""].indexOf(act)==-1)
	{
		var str = string.replace(/\{.*\}/g,'')	
		var str = str.replace(/\[.*\]/g,'')	
		var str = str.replace(/\<.*\>/g,'')	
		var str = str.replace(/\(\(.*\)\)/g,'')	
		var str = str.replace(/\//g,'')	
		var str = str.replace(/[\-\#\+\[\]\{\}]/g,'')	
		var str = str.replace(/\s+/g, ' ');
		var str = str.trim()
		// console.log(value)
		// console.log(str)

		var elem = {
				'act': act,
				'utt': str,
				'dsc': labels[act]
			}

		if ((str!="") && (act in labels))
			dataset.push(elem)
		
		// if (!(act in labels))
			// console.log(elem)

	}
}, this)

///console.log(JSON.stringify(dataset, null, 4))
///console.log(JSON.stringify(dataset.length, null, 4))


var sam = _.sample(dataset,1500)

var dist = _.countBy(sam, function(num) { return num.dsc })
dist = _.pairs(dist)
dist = _.sortBy(dist, function(num){ return num[1] });
console.log(JSON.stringify(dist, null, 4))


var omit = []
_.each(dist, function(value, key, list){ if (value[1]<10) omit.push(value[0]) }, this)

var sam = _.filter(sam, function(num){ return omit.indexOf(num.dsc) == -1 });



console.log(JSON.stringify(sam.length, null, 4))
console.log(JSON.stringify(sam, null, 4))
