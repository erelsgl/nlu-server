if (project_dataset)
{
	dataset = [
		// "5_woz_dialogue.json",
		// "students.json",
		// "turkers.json"
		"students_separated.json",
		"turkers_separated.json",
		"usa_separated.json"
		]
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	})

	data = _.shuffle(data)

	var output = {}

	_.each(data, function(conv, key, list){ 
		_.each(conv['turns'], function(turn, key1, list1){ 
			if ('output' in turn)
				if (turn['output'].length == 1)
					{
						if (!(turn['output'][0] in output))
							output[turn['output'][0]] = {'single label sentence': [], 'multi-label sentence': []}
						output[turn['output'][0]]['single label sentence'].push({'input':turn['input'], 'output':turn['output']})
					}
				else
					{
						_.each(turn['output'], function(lab, key2, list2){
							if(!(lab in output))
								output[lab] = {'single label sentence': [], 'multi-label sentence': []}
							output[lab]['multi-label sentence'].push({'input':turn['input'], 'output':turn['output']})
						}, this)
					}
		}, this)
	}, this)

	_.each(output, function(value, key, list){
		output[key]['single label sentence'] = _.sample(_.uniq(output[key]['single label sentence']), 10)
		output[key]['multi-label sentence'] = _.sample(_.uniq(output[key]['multi-label sentence']), 10) 
	}, this)

	console.log(JSON.stringify(output, null, 4))
	console.log()
	process.exit(0)
}

