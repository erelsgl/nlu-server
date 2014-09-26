var _ = require('underscore')._;
var fs = require('fs');

var filename = "sequence_context.json"


function getFiles(dir,files_){
    files_ = files_ || [];
    if (typeof files_ === 'undefined') files_=[];
    var files = fs.readdirSync(dir);
    for(var i in files){
        if (!files.hasOwnProperty(i)) continue;
        var name = dir+'/'+files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name,files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

var olddatafile = getFiles('../../datasets/Initial')
var olddata = []


_.each(olddatafile, function(file, key, list){ 
	olddata = olddata.concat(JSON.parse(fs.readFileSync(file)))
}, this)

// console.log(olddata)
// process.exit(0)
var wasadd = 0
var notun = 0
var notadd = 0
var isobj = 0
var data = JSON.parse(fs.readFileSync(filename))

_.each(data, function(value, key, list){ 
	_.each(value['turns'], function(value1, key1, list1){

		if ('output' in value1)
			{
			data[key]['turns'][key1]['outputs'] =  value1['output']
			data[key]['turns'][key1]['output'] =  ""
			}
		// else
			// {
			var found = []
			_.each(olddata, function(value2, key2, list2){
				if (value1['input'] == value2['input'])
					{
					found.push(value2['output']) 
					}
			}, this)


			if (found.length > 0)
				{
				var newlab = []
				_.each(found[0], function(value2, key2, list2){
					if (_.isString(value2))
						{
						newlab.push(value2) 
						}
					else
						{
						isobj = isobj + 1
						newlab.push(JSON.stringify(value2))
						}

				}, this)
				data[key]['turns'][key1]['output'] =  newlab
				wasadd = wasadd + 1
				// if (_.unique(found).length != 1) 
					// {
					// console.log(found)
					// process.exit(0)
					// notun = notun + 1
					// }
				}
				else
				{
				notadd = notadd + 1	
				}
			// }
	}, this)
}, this)

console.log(JSON.stringify(data, null, 4))
console.log(wasadd)
// console.log(notun)
console.log(notadd)
// console.log(isobj)
process.exit(0)





