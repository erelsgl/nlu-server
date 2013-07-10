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
	, timer = require('./timer');
	;

//var pathToClassifier = "trainedClassifiers/NegotiationWinnowSingleclass.json";
var pathToClassifier = "trainedClassifiers/NegotiationWinnowBigram.json";


//
// Step 1: Configure an application with EXPRESS
//

var app = express();
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
	
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.static(path.join(__dirname, 'logs')));

	// Application local variables are provided to all templates rendered within the application:
	app.locals.pretty = true;
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

//
// Step 2: Load the classifier
//

var classifier = serialize.fromString(
	fs.readFileSync(pathToClassifier), __dirname+"/../machine-learning/demos");
var classes = classifier.getAllClasses();
classes.sort();



//
// Step 4: define an HTTP server over the express application:
//

var httpserver = http.createServer(app);
var serverStartTime = null;

httpserver.listen(app.get('port'), function(){
	logger.writeEventLog("events", "START", {port:app.get('port')});
	serverStartTime = new Date();
});

var TIMEOUT_SECONDS=5;




/**
 * Read the file in the given path, which should be of the following format:
 * sentence1 / translation1
 * sentence2 / translation2
 * ...
 * and return it as an object: {sentence1: translation1, sentence2: translation2, ...}
 */
function readTranslations(filePath) {
	var translations = {};
	fs.readFileSync(filePath, 'utf8').split(/[\n\r]+/).forEach(function(line) {
		var parts = line.split(/\s*\/\s*/);
		if (parts.length<2) return;
		translations[parts[0]] = parts[1];
	});
	return translations;
}

app.get("/translations", function(req,res) {
	var automatic = readTranslations(__dirname+"/logs/translations_automatic.log");
	var manual    = readTranslations(__dirname+"/logs/translations_manual.log");
	res.write("<link rel='stylesheet' href='main.css' />");
	res.write("<body id='translations'>");
	res.write("<table>");
	res.write("<tr><th>sentence</th><th>automatic</th><th>manual</th></tr>");
	for (var sentence in automatic) {
		var trClass = (automatic[sentence]==manual[sentence] || (!automatic[sentence] &&!manual[sentence]) )? "identical": "different";
		res.write("<tr class='"+trClass+"'><td>"+sentence+"</td><td>"+automatic[sentence]+"</td><td>"+manual[sentence]+"</td></tr>");
	} 
	res.write("</table>");
	res.end();
});

//
// Step 5: define a SOCKET.IO server that listens to the http server:
//

var io = require('socket.io').listen(httpserver);

io.configure(function () { 
	io.set('log level', 1);
	io.set("polling duration", 10); 
});

var mapTextToTimer = {};
var stopTimer = function(timerText) {
	if (mapTextToTimer[timerText])  {
		mapTextToTimer[timerText].stop();
		delete mapTextToTimer[timerText];
	}
}



var registeredPublicTranslators = {};
var activePublicTranslators = {};

io.sockets.on('connection', function (socket) {
	logger.writeEventLog("events", "CONNECT<", socket.id);
	
	// Public translator accepts translations from other users for correction (a "wizard-of-oz"):
	socket.on('register_as_public_translator', function() {
		socket.public_translator = true;
		registeredPublicTranslators[socket.id] = socket;
		activePublicTranslators[socket.id] = socket;
		logger.writeEventLog("events", "PUBLICTRANSLATOR<", socket.id);
		socket.emit('classes', classes);
	});
	
	// Private translator corrects his own translations, without the help of a public translator:
	socket.private_translator = false;
	socket.on('register_as_private_translator', function() {
		socket.private_translator = true;
		logger.writeEventLog("events", "PRIVATETRANSLATOR<", socket.id);
		socket.emit('classes', classes);
	});

	socket.on('disconnect', function () { 
		logger.writeEventLog("events", "DISCONNECT<", socket.id);
		delete registeredPublicTranslators[socket.id];
		delete activePublicTranslators[socket.id];
	});

	// A human asks for a translation: 
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
		fs.appendFile(logger.cleanPathToLog("translations_automatic.log"), classification.text + "  /  " +classification.translations.join(" AND ")+"\n");

		// send the translation to all registered public translators:
		for (var id in registeredPublicTranslators) { 
			logger.writeEventLog("events", "translate-toapprove>"+id, classification.translations);
			registeredPublicTranslators[id].emit('translation', classification);
		}


		if (socket.private_translator || !Object.keys(activePublicTranslators).length) {
			// there are no active public translators - send the translation directly to the asker:
			logger.writeEventLog("events", "translate-direct>"+socket.id, classification.translations);
			socket.emit('translation', classification);
		} else {
			// the current client is waiting for translation of the given text by the public translators:
			socket.join(request.text);
			
			mapTextToTimer[request.text] = new timer.Timer(TIMEOUT_SECONDS, -1, 0, function(timeSeconds) {
					for (var id in registeredPublicTranslators)
						registeredPublicTranslators[id].emit('time_left', {text: request.text, timeSeconds: timeSeconds});
					if (timeSeconds<=0) { // timeout - no public translator responded - send the automatic translation to the asker:
						logger.writeEventLog("events", "translate-timeout>"+socket.id, classification.translations);
						socket.emit('translation', classification);
						mapTextToTimer[request.text].stop();
						activePublicTranslators = {};  // in case of timeout, all public translators are considered inactive.
					}
			});
		}		

	});
	
	// A human translator (public or private) says that a certain automatic translation is incorrect: 
	socket.on('delete_translation', function (request) {
		if (socket.public_translator) activePublicTranslators[socket.id] = socket;
		if (mapTextToTimer[request.text])  mapTextToTimer[request.text].stop();
		logger.writeEventLog("events", "DELETE<"+socket.id, request);
	});

	// A human translator (public or private) says that a certain automatic translation is missing: 
	socket.on('append_translation', function (request) {
		if (socket.public_translator) activePublicTranslators[socket.id] = socket;
		if (mapTextToTimer[request.text])  mapTextToTimer[request.text].stop();
		logger.writeEventLog("events", "APPEND<"+socket.id, request);
	});

	// A human translator (public or private) says that the current automatic translation (with the previously made corrections) is correct: 
	socket.on('approve', function (request) {
		if (socket.public_translator) activePublicTranslators[socket.id] = socket;
		if (mapTextToTimer[request.text])  mapTextToTimer[request.text].stop();
		fs.appendFile(logger.cleanPathToLog("translations_manual.log"), request.text + "  /  " +request.translations.join(" AND ")+"\n");
		logger.writeEventLog("events", "APPROVE<"+socket.id, request);

		//while(!_(request.translations).isEqual(classifier.classify(request.text))) {
		//	classifier.trainOnline(request.text, request.translations);
		//}
		request.explanation="approved by a human translator";
		socket.emit('acknowledgement');
		
		var socketsWaitingForTranslation = io.sockets.clients(request.text).filter(function(s){return s.id!=socket.id});
		socketsWaitingForTranslation.forEach(function(waitingSocket) {
			logger.writeEventLog("events", "approve>"+waitingSocket.id, request);
			waitingSocket.emit('translation', request);
			waitingSocket.leave(request.text);
		}); // remove all clients from waiting to that text
	});
});


//
// Last things to do before exit:
//
 
process.on('exit', function (){
	logger.writeEventLog("events", "END", {port:app.get('port')});
	console.log('Goodbye!');
});
