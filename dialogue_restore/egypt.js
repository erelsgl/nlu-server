var _ = require('underscore')._;
var fs = require('fs');

// filename = "ncagent.csv"
filename = "egypt1.csv"

//jsonfile = "../datasets/Employer/nlu_ncagent_students_negonlpnc.json"
// jsonfile = "../datasets/Employer/5_woz_ncagent_turkers_negonlp2ncAMT.json"
jsonfile = "egypt.json"
// 
content = fs.readFileSync(filename, 'utf8')
content = content.split('\n')

//dataset = []
//dataset = dataset.concat(JSON.parse(fs.readFileSync(jsonfile)))

candidate = []
employer = []


// "is_correct": false,
//         "timestamp": "2013-09-29T14:56:07.9254704Z"

_.each(content, function(str, key, list){ 
	str = str.split("^");
	// console.log(str)
	// process.exit(0)
	if ((str[7]=='Message') && (str[3].length > 2))
	{
		if (str[5] == 'Candidate')
			candidate.push(str[3].replace(/\"/g,''))
		if (str[5] == 'Employer')
			employer.push(str[3].replace(/\"/g,''))
	}
})

// console.log(JSON.stringify(employer.length, null, 4))
// console.log(JSON.stringify(candidate.length, null, 4))
// process.exit(0)

// console.log(JSON.stringify(employer, null, 4))
// console.log()
// process.exit(0)

_.each(employer, function(text, key, list){ 
	console.log(JSON.stringify({"text":text,
				 "forward":"on",
				 "explain":"4",
				 "classifierName":"Employer-egypt",
				 "timestamp":"2013-12-15T18:16:40.078Z"}))

}, this)

_.each(candidate, function(text, key, list){ 
	console.log(JSON.stringify({"text":text,
				 "forward":"on",
				 "explain":"4",
				 "classifierName":"Candidate-egypt",
				 "timestamp":"2013-12-15T18:16:40.078Z"}))
}, this)
