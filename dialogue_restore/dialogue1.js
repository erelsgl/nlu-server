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


// jsonfile = "datasets/Employer/nlu_ncagent_students_negonlpnc.json"
// jsonfile = "datasets/Employer/nlu_ncagent_turkers_negonlpncAMT.json"
//jsonfile = "../datasets/Employer/5_woz_ncagent_turkers_negonlp2ncAMT.json"
jsonfile = "../datasets/Employer/nlu_ncagent_turkers_negonlpncAMT.json"
csvfile = "ncagent.csv"
// 504

jsondataset = JSON.parse(fs.readFileSync(jsonfile))
csvdataset = fs.readFileSync(csvfile, 'utf8')
csvdataset = csvdataset.split('\n')


csvcontent = []
jsoncontent = []

_.each(csvdataset, function(csv, key, list){ 
	str = csv.split("^");
	if ((str[9] == 'Message')&&(str[7] == 'Employer'))
		{
			ss = str[5].replace(/\"/g,'');
			csvcontent.push(ss)
		}
})

_.each(jsondataset, function(json, key, list){ 
	jsoncontent.push(json['input'])
})

console.log("csv size "+csvcontent.length)
console.log("uniq csv size "+(_.uniq(csvcontent)).length)
console.log("json size "+jsoncontent.length)
console.log("uniq json size "+(_.uniq(jsoncontent)).length)

diff = _.difference(jsoncontent, csvcontent);
// diff = _.difference(csvcontent, jsoncontent);
console.log("in json and not in csv")
console.log(diff.length)
// _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
