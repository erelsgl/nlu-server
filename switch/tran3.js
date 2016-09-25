var _ = require('underscore')._;
var fs = require('fs');
	
var data = JSON.parse(fs.readFileSync("../utils/buffer_tran.json"))

_.each(data, function(value, key, list){
	if (key.indexOf("TranslateApiException")!=-1)
		delete data[key]

	if (value.indexOf("TranslateApiException")!=-1)
		delete data[key]
}, this)

console.log(JSON.stringify(data, null, 4))