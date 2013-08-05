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
	, mlutils = require('../machine-learning/utils')
	, timer = require('./timer');
	;


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
// Step 2: Load the activeClassifiers
//

var activeClassifiers = {};
var classifierNames = ["Employer", "Candidate"];
classifierNames.forEach(function(classifierName) {
	var pathToBaseClassifier = __dirname+"/trainedClassifiers/"+classifierName+"/MostRecentClassifier.json";
	var pathToRetrainedClassifier = __dirname+"/trainedClassifiers/"+classifierName+"/RetrainedClassifier.json";
	var pathToClassifier = (fs.existsSync(pathToRetrainedClassifier)?
		pathToRetrainedClassifier:
		pathToBaseClassifier);
	
	activeClassifiers[classifierName] = mlutils.serialize.fromString(
		fs.readFileSync(pathToClassifier), __dirname);
	activeClassifiers[classifierName].pathToRetrainedClassifier = pathToRetrainedClassifier;
	activeClassifiers[classifierName].precisionrecall = mlutils.test(activeClassifiers[classifierName], activeClassifiers[classifierName].pastTrainingSamples).calculateStats();

	activeClassifiers[classifierName].classes = activeClassifiers[classifierName].getAllClasses();
	activeClassifiers[classifierName].classes.sort();
	if (!activeClassifiers[classifierName].classes)
		throw new Error("Classes of classifier '"+classifierName+"' are null!");
	console.log("Loaded classifier '"+classifierName+"'");
});



//
// Step 4: define an HTTP server over the express application:
//

var httpserver = http.createServer(app);
var serverStartTime = null;

httpserver.listen(app.get('port'), function(){
	logger.writeEventLog("events", "START", {port:app.get('port')});
	serverStartTime = new Date();
});

var TIMEOUT_SECONDS=10;




app.get("/translations", function(req,res) {
	res.write("<link rel='stylesheet' href='main.css' />\n");
	res.write("<body id='translations'>\n");
	res.write("<table>\n");
	res.write("<tr><th>userid</th><th>time</th><th>text</th><th>automatic</th><th>manual</th><th>correct?</th></tr>\n");
	fs.readFileSync(__dirname+"/logs/translations_all.log", 'utf8').split(/[\n\r]+/).forEach(function(line) {
		var parts = line.split(/\s*\/\s*/);
		if (parts.length<5) return;
		var userid=parts[0], time=parts[1], text=parts[2], automatic=parts[3], manual=parts[4], is_correct=parts[5];
		time = new Date(time).toISOString().replace(/T/,' ').replace(/[.]000Z/,'');
		var trClass = (automatic==manual || (!automatic && !manual) )? "identical": "different";
		res.write("<tr class='"+trClass+"'><td>"+userid+"</td><td>"+time+"</td><td>"+text+"</td><td>"+automatic+"</td><td>"+manual+"</td><td>"+is_correct+"</td></tr>\n");
		
	});
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
	var address = socket.handshake.address;
	logger.writeEventLog("events", "CONNECT "+address.address + ":" + address.port+"<", socket.id);
	
	// Public translator accepts translations from other users for correction (a "wizard-of-oz"):
	socket.public_translator = false;
	socket.on('register_as_public_translator', function(request) {
		if (!request || !request.classifierName || !activeClassifiers[request.classifierName]) {
			console.error("classifierName not found! request="+JSON.stringify(request));
			return;
		}
		var activeClassifier = activeClassifiers[request.classifierName];

		socket.public_translator = true;
		registeredPublicTranslators[socket.id] = socket;
		activePublicTranslators[socket.id] = socket;
		logger.writeEventLog("events", "PUBLICTRANSLATOR<", socket.id);

		//classifierNames.forEach(function(classifierName) {
		//	var activeClassifier=activeClassifiers[classifierName];
		socket.emit('classes', activeClassifier.classes);
		socket.emit('precisionrecall', activeClassifier.precisionrecall);
		//});
	});
	
	// Private translator corrects his own translations, without the help of a public translator:
	socket.private_translator = false;
	socket.on('register_as_private_translator', function(request) {
		if (!request || !request.classifierName || !activeClassifiers[request.classifierName]) {
			console.error("classifierName not found! request="+JSON.stringify(request));
			return;
		}
		var activeClassifier = activeClassifiers[request.classifierName];
	
		socket.private_translator = true;
		logger.writeEventLog("events", "PRIVATETRANSLATOR<", socket.id);
		socket.emit('classes', activeClassifier.classes);
		socket.emit('precisionrecall', activeClassifier.precisionrecall);
	});

	socket.on('disconnect', function () { 
		logger.writeEventLog("events", "DISCONNECT<", socket.id);
		delete registeredPublicTranslators[socket.id];
		delete activePublicTranslators[socket.id];
	});

	// A human asks for a translation: 
	socket.on('translate', function (request) {
		if (!request.classifierName) {
			console.error("classifierName not found!");
			console.dir(request);
			return;
		}
		var activeClassifier = activeClassifiers[request.classifierName];

		logger.writeEventLog("events", (request.forward? "TRANSLATE<": "GENERATE<")+socket.id, request);
		
		if (request.forward) {   // forward translation = classification
	
			var classification = activeClassifier.classify(request.text, parseInt(request.explain));
			if (request.explain) {
				classification.text = request.text;
				classification.translations = classification.classes;
				classification.forward = request.forward;
				classification.classifierName = request.classifierName;
				delete classification.classes;
			} else {
				classification = {
					text: request.text,
					translations: classification,
					forward: request.forward,
					classifierName: request.classifierName,
				}
			}
			fs.appendFile(logger.cleanPathToLog("translations_automatic.log"), classification.text + "  /  " +classification.translations.join(" AND ")+"\n");
	
	
			if (!socket.private_translator) {
				// send the translation to all registered public translators:
				for (var id in registeredPublicTranslators) { 
					logger.writeEventLog("events", "translate-toapprove>"+id, classification.translations);
					registeredPublicTranslators[id].emit('translation', classification);
				}
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
		} // end of if (request.forward)
		
		else {  // backward translation = generation:
			var classes = request.text;
			if (request.multiple) {  // return multiple samples per class
				var samples = activeClassifier.backClassify(classes);
			} else {  // return a single sample per class, selected at random
				if (!(classes instanceof Array))
					classes = [classes];
				var samples = [];
				classes.forEach(function(theClass) {
					var samplesOfClass = activeClassifier.backClassify(theClass);
					var randomIndex = Math.floor(Math.random()*samplesOfClass.length);
					//console.dir(samplesOfClass);
					//console.log("randomIndex="+randomIndex);
					var randomSample = samplesOfClass[randomIndex];
					samples.push(randomSample);
				});
			}
			var classification = {
				text: request.text,
				translations: samples,
				forward: request.forward,
			};
			logger.writeEventLog("events", "generate-direct>"+socket.id, classification.translations);
			socket.emit('translation', classification);
		} // end of if (!request.forward)
	});
	
	function onTranslatorAction(socket, request) {
		if (socket.public_translator)    // remember that there is an active public translator
			activePublicTranslators[socket.id] = socket;
		if (request && mapTextToTimer[request.text])    // stop the timer
			mapTextToTimer[request.text].stop();
	}
	
	// A human translator (public or private) says that a certain automatic translation is incorrect: 
	socket.on('delete_translation', function (request) {
		onTranslatorAction(socket, request);
		logger.writeEventLog("events", "DELETE<"+socket.id, request);
	});

	// A human translator (public or private) says that a certain automatic translation is missing: 
	socket.on('append_translation', function (request) {
		onTranslatorAction(socket, request);
		logger.writeEventLog("events", "APPEND<"+socket.id, request);
	});
	
	// A human translator asks to stop the timer of a certain translation: 
	socket.on('stop_timer', function(request) {
		onTranslatorAction(socket, request);
		logger.writeEventLog("events", "STOPTIMER<"+socket.id, request);
	});

	// A human translator (public or private) says that the current automatic translation (with the previously made corrections) is correct: 
	socket.on('approve', function (request) {
		if (!request.classifierName) {
			console.error("classifierName not found!");
			console.dir(request);
			return;
		}
		var activeClassifier = activeClassifiers[request.classifierName];
		onTranslatorAction(socket, request);

		request.translations.sort();
		var automatic_translations = null;
		try {
			automatic_translations = activeClassifier.classify(request.text);
			automatic_translations.sort();
		} catch (err) {
			console.error("Error in automatic classification!");
			console.dir(request);
			console.error(err.stack.replace(/\n/g,"\n"));
			automatic_translations = [];
		}
		var is_correct = _(automatic_translations).isEqual(request.translations);
		
		fs.appendFile(logger.cleanPathToLog("translations_manual.log"), 
			request.text + "  /  " +
			request.translations.join(" AND ")+"\n");

		fs.appendFile(logger.cleanPathToLog("translations_all.log"), 
			socket.id + "  /  "+
			new Date() + "  /  "+
			request.text + "  /  " +
			automatic_translations.join(" AND ")+"  /  "+
			request.translations.join(" AND ")+"  /  "+
			is_correct+"\n"
			);
		request.explanation="approved by a human translator";
		socket.emit('acknowledgement');
		logger.writeEventLog("events", "APPROVE<"+socket.id, request);
		
		var socketsWaitingForTranslation = io.sockets.clients(request.text).filter(function(s){return s.id!=socket.id});
		socketsWaitingForTranslation.forEach(function(waitingSocket) {
			waitingSocket.emit('translation', request);
			waitingSocket.leave(request.text);
			logger.writeEventLog("events", "approve>"+waitingSocket.id, request);
		}); // remove all clients from waiting to that text
		
		if (request.train) {
			activeClassifier.trainOnline(request.text, request.translations);
			
			if (!is_correct) { 
				// EREL: I hope some day we can remove these lines and have a truly online classifier.
				var newClassifier = activeClassifier.createNewClassifierFunction();
				newClassifier.trainBatch(activeClassifier.pastTrainingSamples);
				newClassifier.createNewClassifierFunction = activeClassifier.createNewClassifierFunction;
				newClassifier.createNewClassifierString = activeClassifier.createNewClassifierString;
				newClassifier.pathToRetrainedClassifier = activeClassifier.pathToRetrainedClassifier;
				newClassifier.classes = activeClassifier.classes;
				activeClassifiers[request.classifierName] = activeClassifier = newClassifier;
				//activeClassifier.retrain();  
				logger.writeEventLog("events", "++TRAIN<"+socket.id, request);
			}
			if (activeClassifier.pastTrainingSamples.length % 2 == 0) {  // write every OTHER sample
				fs.writeFile(activeClassifier.pathToRetrainedClassifier, mlutils.serialize.toString(activeClassifier), 'utf-8', function(err) {
					logger.writeEventLog("events", "+++SAVE<"+socket.id, err);
				});
			}
			
			activeClassifier.precisionrecall = mlutils.test(activeClassifier, activeClassifier.pastTrainingSamples).calculateStats();
			socket.emit('precisionrecall', activeClassifier.precisionrecall);
		}
	});
});


//
// Last things to do before exit:
//
 
process.on('exit', function (){
	logger.writeEventLog("events", "END", {port:app.get('port')});
	console.log('Goodbye!');
});
