var lineReader = require('line-reader');
//var redis = require("redis")
//var client = redis.createClient();
//var count = 0

lineReader.eachLine('ppdb-1.0-xl-phrasal', function(line, last) {
  // console.log(line);
  var list = line.split("|||")
//  if (list.length > 3)
//"*3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n"
	//process.stdout.write("*3\r\n$3\r\nSET\r\n$"+list[1].trim().length+"\r\n"+list[1].trim()+"\r\n$"+list[2].trim().length+"\r\n"+list[2].trim()+"\r\n")
	process.stdout.write("\*3\\r\\n\$3\\r\\nSET\\r\\n\$"+list[1].trim().length+"\\r\\n"+list[1].trim()+"\\r\\n\$"+list[2].trim().length+"\\r\\n"+list[2].trim()+"\\r\\n")
//	client.set(list[1].trim(), list[2].trim(), redis.print);
 // count = count + 1
 // if (count % 100000 == 0)
  //	console.log(count)
  // do whatever you want with line...
//  if(last){
//	console.log("done")
    // or check if it's the last one
 // }
});

//client.quit();
