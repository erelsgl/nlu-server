var _ = require('underscore')._;
var fs = require('fs');

// filename = "ncagent.csv"
filename = "overall.csv"

//jsonfile = "../datasets/Employer/nlu_ncagent_students_negonlpnc.json"
// jsonfile = "../datasets/Employer/5_woz_ncagent_turkers_negonlp2ncAMT.json"
jsonfile = "../datasets/Employer/5_woz_ncagent_turkers_negonlp2ncAMT.json"
// 

bad = ['2013-10-04T09:37:20.686Z', '2013-10-02T18:45:22.628Z', '2013-10-04T11:42:15.834Z', '2013-10-04T12:06:37.488Z', '2013-10-05T17:50:39.807Z','2014-02-17T09:26:38.991Z']

content = fs.readFileSync(filename, 'utf8')
content = content.split('\n')

dataset = []
dataset = dataset.concat(JSON.parse(fs.readFileSync(jsonfile)))

dialogue = {}

// "is_correct": false,
//         "timestamp": "2013-09-29T14:56:07.9254704Z"

_.each(content, function(str, key, list){ 
	str = str.split("^");
	if (!(str[0] in dialogue)) 
		{
		dialogue[str[0]]={}
		dialogue[str[0]]['user'] = ""
		dialogue[str[0]]['role'] = ""
		dialogue[str[0]]['turns'] = []
		}

	if ((str[7] == 'Message') && (str[5]=='Employer'))
		{
		dialogue[str[0]]['user'] = str[4]
		dialogue[str[0]]['role'] = str[5]
		dialogue[str[0]]['turns'].push({	'input':String(str[3]).replace(/\"/g,""),
											'is_correct': false,
											'timestamp':new Date(),
											'turn':str[1]})
		
		}
	})

_.each(dataset, function(value, key, list){ 
	_.each(dialogue, function(value1, key2, list){ 
		_.each(value1['turns'], function(value2, key1, list){ 
			if (value2['input'] == value['input'])
				{
				dialogue[key2]['turns'][key1]['output'] = value['output']
				}
			}, this)
		}, this)
	}, this)

dialoguelist = []
_.each(dialogue, function(turnlist, key, list){
	// _.each(turnlist, function(value, key1, list){ 
		var even = _.countBy(turnlist['turns'], function(num){ return ("output" in num); });
		if ((even['true'] > turnlist['turns'].length / 2) &&
			(turnlist['turns'].length > 2) &&
			(bad.indexOf(key)==-1))
			dialoguelist.push({'id': key, 
								'user': dialogue[key]['user'],
								'role': dialogue[key]['role'],
		 						'turns': turnlist['turns']})
	 	// }, this) 
	}, this)

// console.log(dialogue)
console.log(JSON.stringify(dialoguelist, null, 4))

// _.each(dialoguelist, function(value, key, list){ 
// 	outp = 0
// 	all = value['turns'].length
// 	_.each(value['turns'], function(value, key, list){ 
// 		if (!('output' in value))
// 			{
// 			outp++
// 			console.log(value['input'])
// 			}
// 		}, this)
// 	console.log(value['id'])
// 	console.log(all)
// 	console.log(outp)
// 	}, this)

process.exit(0)
