// entirelly
// "datasets/Employer/nlu_ncagent_turkers_negonlpncAMT.json"
// 338

// "datasets/Employer/nlu_ncagent_students_negonlpnc.json"
// 521

// "ncagent.csv"
// 504

var _ = require('underscore')._;
var fs = require('fs');
var natural = require('natural');
var hash = require('limdu/utils/hash');
var trainAndTest_hash= require('limdu/utils/trainAndTest').trainAndTest_hash;
var partitions = require('limdu/utils/partitions');


  jsonfile = "../datasets/Employer/nlu_ncagent_students_negonlpnc.json"
//jsonfile = "../datasets/Employer/nlu_ncagent_turkers_negonlpncAMT.json"
 // jsonfile = "../datasets/Employer/5_woz_ncagent_turkers_negonlp2ncAMT.json"
//jsonfile = "../datasets/Employer/nlu_ncagent_turkers_negonlpncAMT.json"
//csvfile = "ncagent.csv"
csvfile = "overall.csv"
// 504

jsondataset = JSON.parse(fs.readFileSync(jsonfile))
csvdataset = fs.readFileSync(csvfile, 'utf8')
csvdataset = csvdataset.concat(fs.readFileSync("ncagent_formated.csv", 'utf8'))

csvdataset = csvdataset.split('\n')


csvcontent = []
jsoncontent = []

_.each(csvdataset, function(csv, key, list){ 
	str = csv.split("^");
	// console.log(str)
	// process.exit(0)
	if ((str[7] == 'Message')&&(str[5] == 'Employer'))
		{
			ss = str[3].replace(/\"/g,'');
			// console.log(ss)
			// process.exit(0)
			csvcontent.push(ss)
		}
})

_.each(jsondataset, function(json, key, list){ 
	jsoncontent.push(json['input'])
})

	console.log(csvfile)
		console.log(jsonfile)
console.log("csv size "+csvcontent.length)
console.log("uniq csv size "+(_.uniq(csvcontent)).length)
console.log("json size "+jsoncontent.length)
console.log("uniq json size "+(_.uniq(jsoncontent)).length)

diff = _.difference(_.uniq(jsoncontent), _.uniq(csvcontent));
// diff = _.difference(csvcontent, jsoncontent);
console.log("in json and not in csv")
console.log(diff.length)
// _.difference([1, 2, 3, 4, 5], [5, 2, 10]);

// overall.csv
// ../datasets/Employer/nlu_ncagent_turkers_negonlpncAMT.json
// csv size 4057
// uniq csv size 2107
// json size 336
// uniq json size 336
// in json and not in csv
// 17

// overall.csv
// ../datasets/Employer/nlu_ncagent_students_negonlpnc.json
// csv size 4057
// uniq csv size 2107
// json size 516
// uniq json size 516
// in json and not in csv
// 236


// overall.csv
// ../datasets/Employer/5_woz_ncagent_turkers_negonlp2ncAMT.json
// csv size 4057
// uniq csv size 2107
// json size 38
// uniq json size 38
// in json and not in csv
// 0