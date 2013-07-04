/**
 * A socket.io server for text categorization. Based on a pre-trained model. 
 * 
 * @author Erel Segal-Halevi erelsgl@gmail.com
 * @since 2013-06
 */
var express = require('express')
	, http = require('http')
	, path = require('path')
	, url = require('url')
	, fs = require('fs')
	, util = require('util')
	, logger = require('./logger')
	, _ = require('underscore')._
	, serialize =require('../machine-learning/serialize') 
	;

//var pathToClassifier = "trainedClassifiers/NegotiationWinnowSingleclass.json";
var pathToClassifier = "trainedClassifiers/NegotiationWinnowSingleAndMulticlass.json";


//
// Step 1: Configure an application with EXPRESS
//

var app = express();
var staticMiddleware = express.static(path.join(__dirname, 'public'));
app.configure(function(){
	// Settings:
	app.set('port', process.env.PORT || 9995);
	app.set('views', path.join(__dirname, 'views'));		// The view directory path
	app.set('view engine', 'jade');						// The default engine extension to use when omitted
	app.set('case sensitive routing', false);	// Enable case sensitivity, disabled by default, treating "/Foo" and "/foo" as same

	// Define tasks to do for ANY url:
	app.use(function(req,res,next) {
		if (!/[.]js/.test(req.url)  && !/\/images\//.test(req.url) && !/[.]css/.test(req.url)) {
			logger.writeEventLog("events", req.method+" "+req.url, _.extend({remoteAddress: req.ip}, req.headers));
		}
		next(); // go to the next task - routing:
	});

	app.use(app.router);
	app.use(staticMiddleware);

	// Application local variables are provided to all templates rendered within the application:
	app.locals.pretty = true;
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

//
// Step 2: Load the classifier
//

var classifier = serialize.loadSync(pathToClassifier, __dirname+"/../machine-learning/demos");




//
// Step 4: define an HTTP server over the express application:
//

var httpserver = http.createServer(app);
var serverStartTime = null;

httpserver.listen(app.get('port'), function(){
	logger.writeEventLog("events", "START", {port:app.get('port')});
	serverStartTime = new Date();
});



//
// Step 5: define a SOCKET.IO server that listens to the http server:
//

var io = require('socket.io').listen(httpserver);

io.configure(function () { 
	io.set('log level', 1);
	io.set("polling duration", 10); 
});

io.sockets.on('connection', function (socket) {
	logger.writeEventLog("events", "CONNECT<", socket.id);
	
	socket.on('disconnect', function () { 
		logger.writeEventLog("events", "DISCONNECT<", socket.id);
	});

	socket.on('translate', function (request) {
		logger.writeEventLog("events", "TRANSLATE<"+socket.id, request);
		
		var classification = classifier.classify(request.text, parseInt(request.explain));
		if (request.explain) {
			classification.text = request.text;
			classification.translations = classification.classes;
			delete classification.classes;
		} else {
			classification = {
				text: request.text,
				translations: classification,
			}
		}
		logger.writeEventLog("events", "translate>"+socket.id, classification.translations);
		socket.emit('translation', classification);
		fs.appendFile(logger.cleanPathToLog("translations.log"), "AUTOMATIC "+classification.text + "  /  " +classification.translations.join(" AND ")+"\n");
	});
	
	socket.on('delete', function (request) {
		logger.writeEventLog("events", "DELETE<"+socket.id, request);
	});
	
});


//
// Last things to do before exit:
//
 
process.on('exit', function (){
	logger.writeEventLog("events", "END", {port:app.get('port')});
	console.log('Goodbye!');
});
