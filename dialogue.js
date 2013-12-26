var _ = require('underscore')._;
var fs = require('fs');

// filename = "ncagent.csv"
filename = "kbagent.csv"

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
		// candidate employer
		record.push(str[7])
		// text
		record.push(str[5])

		if ((str[7]=='Employer') && (str[9]=='Translation'))
			{
				dialogue[buffer][dialogue[buffer].length-1]= str[5]
			}
		else
		{
			if ((str[7]=='Employer') && (str[9]=='Message'))
				{
				buffer = dialogue.length
				record.push("no translation")
				}
			dialogue.push(record)
		}
		}
	})

console.log(dialogue)
process.exit(0)