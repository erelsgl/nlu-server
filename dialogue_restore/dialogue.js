var _ = require('underscore')._;
var fs = require('fs');

// filename = "ncagent.csv"
filename = "ncagent.csv"

content = fs.readFileSync(filename, 'utf8')
content = content.split('\n')

dialogue = []

_.each(content, function(str, key, list){ 

	// if (key == 20)
	// 	{
	// 	console.log(dialogue)
	// 	process.exit(0)
	// 	}
	str = str.split("^");

	if (str[9] != 'Change')
		{
		record = []
		// dialogue id
		record.push(str[1])
		// replica number
		record.push(str[2])
		// replica timestamp
		record.push(str[3])
		// candidate employer
		record.push(str[7])
		// text
		record.push(str[5])

		if ((str[7]=='Employer') && (str[9]=='Translation'))
			{
				dialogue[buffer][dialogue[buffer].length-1]= str[5]
				dialogue[buffer].push(str[3])
			}
		else
		{
			if ((str[7]=='Employer') && (str[9]=='Message'))
				{
				buffer = dialogue.length
				record.push("no translation")
			
			dialogue.push(record)
				}
		}
		}
	})


dialoghash = {}

_.each(dialogue, function(value, key, list){ 
	if (!(value[0] in dialoghash))
		{
		dialoghash[value[0]] = []
		}

	if (value[5]!="no translation")
		{
		dialoghash[value[0]].push({"input":JSON.parse(value[5])['text'],
									"output": JSON.parse(value[5])['translate'],
									"is_correct": false,
									"timestamp": value[2],
									})

		}
	}, this)

dialoglist = []
_.each(dialoghash, function(value, key, list){ 
	dialogue = {}
	dialogue['id'] = key
	dialogue['turns'] = value
	dialoglist.push(dialogue)
	}, this)


fs.writeFile("/tmp/test", JSON.stringify(dialoglist, null, 2), function(err) {})

// console.log(JSON.stringify(dialoglist, null, 4))
// process.exit(0)

// console.log(dialogue)
// process.exit(0)