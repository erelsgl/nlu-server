var redis = require("redis")
var client = redis.createClient();

var fs = require('fs')
var _ = require('underscore')._;

//get the filesystem module
// var fs = require('fs'),/
  stream = fs.createReadStream("ppdb-1.0-xl-phrasal", {
    flags: 'r',
    encoding: 'utf-8',
    fd: null,
    bufferSize: 1
  }),
  line ='';
//start reading the file
stream.addListener('data', function (char) {
    // pause stream if a newline char is found
    stream.pause();
    if(char == '\n'){
        (function(){
		  list = line.split("|||")
		  // if (list.length > 3)
			// client.set(list[1].trim(), list[2].trim(), redis.print);
          line = '';
          stream.resume();
        })();
    }
    else{
        //add the new char to the current line
        line += char;
        stream.resume();
    }
})

// var data = fs.readFileSync("ppdb-1.0-xl-phrasal",'utf8').split("\n")
// client.set("string key1", "string val", redis.print);
// client.hset("hash key", "hashtest 1", "some value", redis.print);
// _.each(data, function(value, key, list){ 
	// var list = value.split("|||")
	// console.log(list)
	// if (list.length > 3)
		// client.set(list[1].trim(), list[2].trim(), redis.print);
	// console.log()
	// process.exit(0)
// }, this)

client.quit();
// console.log(data)
