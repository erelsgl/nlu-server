/*

It's new script for Osnat dialogues

*/

var _ = require('underscore')._;
var fs = require('fs');

// filename = "new_israel_agent.csv"
filename = "new_usa_agent.csv"
isrgoodconvfile  = "isrids"
usagoodconvfile  = "usaids"

content = fs.readFileSync(filename, 'utf8')
content = content.split('\n')

var isrgoodconv = _.compact(fs.readFileSync(isrgoodconvfile, 'utf8').split('\n'))
var usagoodconv = _.compact(fs.readFileSync(usagoodconvfile, 'utf8').split('\n'))

var dialogue = {}
var buffer = []

function packageobj(element)
{
	return element

	if (!(_.isObject(element)))
		return element
	var output = {}
	_.each(element, function(tuple, key, list){
		_.each(tuple, function(attrvalue, intent, list1){
			if (!(intent in output))
				output[intent] = {}
			if (_.isObject(attrvalue))
				_.extend(output[intent], attrvalue)
			else
				output[intent] = attrvalue
		 }, this) 
	}, this)

	return output
}

_.each(content, function(str, key, list){ 
	str = str.split("^");
	// console.log(str)
	// process.exit(0)
	if (!(str[0] in dialogue)) 
		{
		dialogue[str[0]]={}
		dialogue[str[0]]['id'] = str[0]
		dialogue[str[0]]['role'] = ""
		dialogue[str[0]]['country'] = ''
		dialogue[str[0]]['status'] = []
		dialogue[str[0]]['users'] = []

		var convstat = 'badconv'
		var country = ''
		if (isrgoodconv.indexOf(str[0]) != -1)
			{
			convstat = 'goodconv'
			country = 'israel'
			}

		if (usagoodconv.indexOf(str[0]) != -1)
			{
			convstat = 'goodconv'
			country = 'usa'
			}


		if (country != '')
			dialogue[str[0]]['country'] = country

		dialogue[str[0]]['status'].push(convstat)
		dialogue[str[0]]['status'] = _.sortBy(_.unique(dialogue[str[0]]['status']), function(num){ return num });
		dialogue[str[0]]['turns'] = []
		}

	// dialogue[str[0]]['role'] = str[5]
	if ((dialogue[str[0]]['country'] == ""))
		dialogue[str[0]]['country'] = str[9]
	else
		if (dialogue[str[0]]['country'] != str[9])
			throw new Error(key+" contry problem "+ str[0]+" old value "+dialogue[str[0]]['country']+" new value "+str[9]);



	
	// goes after message of the user
	if ((str[7] == 'Translation'))
		{
		// agent cannot receive translation
		if (str[4].indexOf("Agent") == -1)
			{

			dialogue[str[0]]['users'].push(str[4])
			dialogue[str[0]]['users'] = _.unique(dialogue[str[0]]['users'])
			dialogue[str[0]]['users'] = _.sortBy(dialogue[str[0]]['users'], function(num){ return num });


			// don't consider empty string
			if (String(str[3])!="\"\"")
				{

					var js = JSON.parse(str[3])

					// js['text'] = js['text'].replace(/\\/g,"").replace(/\"/g,"").replace(/^\s+|\s+$/g,'')
					
					var found = false

					_.each(dialogue[str[0]]['turns'], function(value, key, list){ 
						// console.log("comparing")
						// console.log(value['input'].replace(/\\t/g,"	"))
						// console.log(js['text'])
						if (value['input'] == js['text'])
							{
							found = true
							dialogue[str[0]]['turns'][key]['output'] = packageobj(js['translate'])
							}
					}, this)

					if (found == false)
							throw new Error("translate came without initial text in line "+ key + " " + str);
				}
			}
			else
			{
				throw new Error("for some reason translate came from agent "+ key);
			}
		}
	
	if (str[7] == 'Message')
	{		
		// in case of user add on the Translate level
		dialogue[str[0]]['users'].push(str[4])
		dialogue[str[0]]['users'] = _.unique(dialogue[str[0]]['users'])
		dialogue[str[0]]['users'] = _.sortBy(dialogue[str[0]]['users'], function(num){ return num });


		if (str[4].indexOf("Agent") != -1)
		{

			var output =  buffer[buffer.length - 1]

			if (String(str[3]).indexOf("Since time is running out") != -1)
				output = "repeating"
			if (String(str[3]).indexOf("happy that you accept") != -1)
				output = "happy"
			if (String(str[3]).indexOf("can sign the agreement now") != -1)
				output = "signnow"

			var js = JSON.parse("{\"input\":"+str[3]+"}")

			dialogue[str[0]]['turns'].push({
									// 'input':String(str[3]).replace(/\t/g," ").replace(/\\/g,"").replace(/\"/g,"").replace(/^\s+|\s+$/g, ''),
									// 'input':String(str[3]).replace(/\\t/g,"	").replace(/\\\\/g,"").replace(/\"/g,"").replace(/^\s+|\s+$/g, ''),
									// 'input':String(str[3]).replace(/\\t/g,"	").replace(/\\\\/g,"").replace(/\"/g,"").replace(/^\s+|\s+$/g, ''),
									'input':js['input'],
									'timestamp':new Date(),
									'role': str[5],
									'user': str[4],
									'turn':str[1],
									'index': str[6],
									'status': 'active',
									'output' : packageobj(output)
								})
				
				// console.log("buffer to pop")
				buffer.pop()
				dialogue[str[0]]['role'] = str[5]

		}
		else
		{
			// message of user
			var js = JSON.parse("{\"input\":"+str[3]+"}")

			dialogue[str[0]]['turns'].push({
											// 'input': String(str[3]).replace(/\t/g," ").replace(/\\/g,"").replace(/\"/g,"").replace(/^\s+|\s+$/g, ''),
											// 'input': String(str[3]).replace(/\t/g,"	").replace(/\\\\/g,"").replace(/\"/g,"").replace(/^\s+|\s+$/g, ''),
											'input': js['input'],
											'timestamp':new Date(),
											'role': str[5],
											'user': str[4],
											'turn':str[1],
											'index': str[6],
											'status': 'active',
											'output' : ""
										})
		}
	}
	
	if ((str[7] == 'AgentMessage'))
		{
			var obj = JSON.parse(str[3])
			if (!(_.isArray(obj)))
				obj = [obj]

			buffer.push(obj)
		}
}, this)

// console.log(Object.keys(dialogue).length)

var count = 0
_.each(dialogue, function(dial, key, list){
var onlyagent = true
	_.each(dial['turns'], function(turn, key1, list1){
		if (turn['user'].indexOf('Agent'))
			onlyagent = false 
	 }, this) 
if (onlyagent)
	{
	delete dialogue[key]
	count = count+1
	}
}, this)


var dialogues = []
_.each(dialogue, function(value, key, list){ 
	dialogues.push(value)
}, this)

console.log(JSON.stringify(dialogues, null, 4))
process.exit(0)
