// Utilities for reading and writing log files

var fs     = require('fs') 
  , jsonref = require('json-ref')
  , path = require('path')
  ;


exports.MAX_LENGTH_OF_CONSOLE_MESSAGE = 1000;

if (!fs.appendFile) {
  console.log("You have Node "+process.version+", that does not support appendFile. I try to approximate it with 'createWriteStream'.")
  fs.appendFile = function(path, data, callback) {
    var stream = this.createWriteStream(path, {'flags': 'a'});
    stream.on('error', function (err) {
      if (callback) callback(err);
    });    
    stream.on('drain', function () {
      if (callback) callback(null);
    });    
    stream.write(data);
  };
} else {
  console.log("Running on Node "+process.version+".");
}

if (!fs.existsSync("logs")) fs.mkdir("logs");

/**
 * reads a log file that contains a single JSON object.
 * @return the single object.
 */
exports.readSingleJsonObjectSync = function(pathToLog) {
  var json = fs.readFileSync(pathToLog, 'utf8');
  return JSON.parse(json);
}

/**
 * reads a log file, where each line is an object in JSON format.
 * @return an array of all objects in the file.
 */
exports.readJsonLogSync = function(pathToLog) {
  if (fs.existsSync(pathToLog)) {
    var json = "["+fs.readFileSync(pathToLog, 'utf8').replace(/[\n\r]+/g,",")+"]";
    var json = json.replace(/\,\,/g,",");
    var json = json.replace(/\[\,/g,"[");
    var json = json.replace(/\,\]/g,"]");

    json = json.replace(/,,+/g,",").replace(/,\s*\]/,"]");
    return JSON.parse(json);
  } else {
	console.warn("WARNING: File '"+pathToLog+"' does not exist!");
	return [];
  }
}


var cleanPathToLog = function(logFileName) {
    var cleanLogFileName = logFileName.replace(/:/g,'-');
    var cleanpath = path.join(__dirname, "logs", cleanLogFileName);
    //if (!fs.existsSync(cleanpath))
    //fs.mkdirSync(cleanpath);
    return cleanpath;
}

exports.cleanPathToLog = cleanPathToLog;

/**
 * reads a log file, where each line is an object in JSON format.
 * @return an array of all objects in the file.
 */
exports.readJsonLog = function(logFileName, callback) {
  fs.readFile(cleanPathToLog(logFileName), 'utf8', function(err, data) {
    if (err) {
      callback({readFileError: err});
    } else {
      var json = "["+data.replace(/\n/g,",")+"]";
      json = json.replace(/,\]/,"]");
      var object;
      try {
      	object = JSON.parse(json)
      } catch (ex) {
        object = [{error: "Error parsing JSON object: "+json+": "+JSON.stringify(ex)}];
      }
      callback(object);
    }
  });
}

exports.writeJsonLog = function(logFileName, object) {
    object.timestamp = new Date().toISOString();
    fs.appendFile(cleanPathToLog(logFileName+".json"), JSON.stringify(object)+"\n", function (err) {
        if (err) throw (err);
    });
}

exports.writeEventLog = function(logFileName, event, object) {
    var json;
    try {
      json = JSON.stringify(object);
    } catch (ex) { // probably a circular-reference problem
      json = JSON.stringify(jsonref.ref(object));
    }
    var msg = new Date().toISOString() + " " + event + " " + json;
    var msgForConsole=msg;
    if (msgForConsole.length>exports.MAX_LENGTH_OF_CONSOLE_MESSAGE)
    	msgForConsole = msgForConsole.substr(0,exports.MAX_LENGTH_OF_CONSOLE_MESSAGE)+"... ";
    
    console.log(msgForConsole);
    fs.appendFile(cleanPathToLog(logFileName+".log"), msg+"\n", function (err) {
        if (err) throw (err);
    });
}



if (process.argv[1] === __filename) {
  console.log("logreader.js unitest start");
  
  var path = require('path')
    , jade = require('jade') 
    ;
  var pathToLog = cleanPathToLog("PreQuestionnaireDemography.json");
  var log = exports.readJsonLogSync(pathToLog);

  var pathToJade = path.join(__dirname,"views","LogToXml.jade");
  var fn = jade.compile(fs.readFileSync(pathToJade), {pretty:true, filename:pathToJade});
  //console.log(fn({log: log}));
  
  exports.readJsonLog(pathToLog, function(log) {
     console.log(fn({log: log}));
  })
}
