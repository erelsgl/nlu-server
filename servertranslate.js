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
		if (!/[.]js/.test(req.url) && !/\/images\//.test(req.url) && !/[.]css/.test(req.url)) {
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
// Step 2: Load the activeClassifiers and prepare the translators
//
var classifierNames = ["Employer", "Candidate"];

var registeredPublicTranslators = {};
var activePublicTranslators = {};
var activeClassifiers = {};
var manualTranslations = {};
var pendingAutomaticTranslations = {};
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
	
	registeredPublicTranslators[classifierName] = {};
	activePublicTranslators[classifierName] = {};
	
	// copy the training samples to the approved translations:
	manualTranslations[classifierName] = {};
	activeClassifiers[classifierName].pastTrainingSamples.forEach(function(sample) {
		manualTranslations[classifierName][sample.input]= {
			text: sample.input,
			translations: sample.output,
			source: "training data"
		};
	});
	
	pendingAutomaticTranslations[classifierName] = {};
});

//
// Step 3: load additional approved translations from the manual translations file:
//

var lines = logger.readJsonLogSync(logger.cleanPathToLog("translations_manual.json"));
lines.forEach(function(sample) {
	if (sample.classifierName)
		//if (sample.translations.length>0)
			manualTranslations[sample.classifierName][sample.text]=sample;
});

var lines = logger.readJsonLogSync(logger.cleanPathToLog("translations_pending.json"));
lines.forEach(function(sample) {
	if (sample.classifierName)
		if (!manualTranslations[sample.classifierName][sample.text])
			pendingAutomaticTranslations[sample.classifierName][sample.text]=sample;
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

// index page:
app.get("/", function(req,res) {
	res.render("index");
});

// view a table of the previous correct/incorrect translations: 
app.get("/translations/:manualorautomatic/:dataset?", function(req,res) {
	var manualorautomatic = req.params.manualorautomatic;
	if (manualorautomatic==='all') {  // default table
		var lines = [];
		fs.readFileSync(__dirname+"/logs/translations_all.log", 'utf8').split(/[\n\r]+/).forEach(function(line) {
			var parts = line.split(/\s*\/\s*/);
			if (parts.length<5) return;
			lines.push({
				userid: parts[0], 
				time: new Date(parts[1]).toISOString().replace(/T/,' ').replace(/[.]000Z/,''), 
				text: parts[2], 
				automatic: parts[3], 
				manual: parts[4], 
				is_correct: parts[5],
			});
		});
		res.render("translationsTable", {
			lines: lines
		});
	} else {
		var filename = "translations_"+manualorautomatic+".json";
		var lines = logger.readJsonLogSync(logger.cleanPathToLog(filename));
		if (!_.isEmpty(req.query))
			lines = _(lines).where(req.query);
		if (req.params.dataset) {
			lines = _(lines).select(function(line) {return line.text && 
				line.translations && 
				line.translations.length>0 && 
				line.translations[0]!=="Other" && 
				(!line.remoteAddress || line.remoteAddress!="127.0.0.1") &&
				true});
			lines = _(lines).uniq(/*isSorted=*/false, function(line) {return line.text;});	
		}
		res.render("translationsJson", {
			dataset: req.params.dataset,
			lines: lines
		});
	}
});


// translation as a web service: 
app.get("/get", function(req,res) {
	if (!req.query||!req.query.request) {
		res.write("SYNTAX: /get?request=[JSON]");
		res.end();
		return;
	}
	console.dir(req.query);
	var request = JSON.parse(req.query.request);
	var id = "WEBSERVICE";
	translate(request, id, /*requester_is_private_translator=*/false, function(classification) {
		logger.writeEventLog("events", "translate>"+id, classification);
		res.write(JSON.stringify(classification));
		res.end();
	});
});


//
// Step 5: SOCKET.IO server that listens to the http server:
//

var io = require('socket.io').listen(httpserver);

io.configure(function () { 
	io.set('log level', 1);
	io.set("polling duration", 10); 
});

// Timers for translations of texts. When timer runs out, the client receives the automatic translation:  
var mapTextToTimer = {};
var stopTimer = function(text) {
	if (mapTextToTimer[text])  {
		mapTextToTimer[text].stop();
		delete mapTextToTimer[text];
	}
}

// Callbacks listening to translations of texts:
var mapTextToListeners = {};
var addTextListener = function(text, callback) {
	if (!mapTextToListeners[text])
		mapTextToListeners[text]=[];
	mapTextToListeners[text].push(callback);
}
var textListeners = function(text) {
	if (mapTextToListeners[text])
		return mapTextToListeners[text];
	else return [];
}
var removeTextListeners = function(text) {
	if (mapTextToListeners[text])
		delete mapTextToListeners[text];
}

/**
 * Translate text according to the given request.
 * @param request contains the text, the classifierName, and whether it is forward translation (or backward=generation).
 * @param requester the id of the requester (e.g. socket.id).
 * @param requester_is_private_translator boolean 
 * @param callback call when the translation is ready
 */
function translate(request, requester, requester_is_private_translator, callback, socket) {
		if (!request || !request.classifierName || !activeClassifiers[request.classifierName]) {
			console.error("classifierName not found! request="+JSON.stringify(request));
			return;
		}
		var activeClassifier = activeClassifiers[request.classifierName];

		logger.writeEventLog("events", (request.forward? "TRANSLATE<": "GENERATE<")+requester, request);

		if (request.forward) {   // forward translation = classification
			var classification;
			var pastManualTranslation = manualTranslations[request.classifierName][request.text];
			if (pastManualTranslation && pastManualTranslation.translations && pastManualTranslation.translations.length>0) {
				classification = pastManualTranslation;
				if (request.explain) {
					classification.explanation = "already approved by a human translator"; 
				}
				logger.writeEventLog("events", "translate-pastManualTranslation>"+id, classification.translations);
			} else {
				classification = activeClassifier.classify(request.text, parseInt(request.explain));
				if (request.explain && !(classification instanceof Array)) {
					classification.translations = classification.classes;
					delete classification.classes;
				} else {
					classification = {
						translations: classification
					};
				};
				_(classification).extend(request); // add the text, forward, classifierName, etc.
				logger.writeJsonLog("translations_automatic", classification);
				
				if (!pendingAutomaticTranslations[request.classifierName][request.text]) {
					pendingAutomaticTranslations[request.classifierName][request.text] = classification;
					logger.writeJsonLog("translations_pending", classification);
				}
			}

			if (!requester_is_private_translator && !pastManualTranslation) {
				// send the translation to all registered public translators (active or inactive):
				var relevantPublicTranslators = registeredPublicTranslators[request.classifierName];
				for (var id in relevantPublicTranslators) { 
					logger.writeEventLog("events", "translate-toapprove>"+id, classification.translations);
					relevantPublicTranslators[id].emit('translation', classification);
				}
			}

			if (requester_is_private_translator || pastManualTranslation || !Object.keys(activePublicTranslators[request.classifierName]).length) {
				// there are no active public translators - send the translation directly to the asker:
				logger.writeEventLog("events", "translate-direct>"+requester, classification.translations);
				callback(classification);
			} else {
				// the current client is waiting for translation of the given text by the public translators:
				addTextListener(request.text, callback);

				// wait for the public translators, but don't wait forever: 
				mapTextToTimer[request.text] = new timer.Timer(TIMEOUT_SECONDS, -1, 0, function(timeSeconds) {
						for (var id in registeredPublicTranslators[request.classifierName])
							registeredPublicTranslators[request.classifierName][id].emit('time_left', {text: request.text, timeSeconds: timeSeconds});
						if (timeSeconds<=0) { // timeout - no public translator responded - send the automatic translation to the asker:
							logger.writeEventLog("events", "translate-timeout>"+requester, classification.translations);
							callback(classification);
							mapTextToTimer[request.text].stop();
							activePublicTranslators[request.classifierName] = {};  // in case of timeout, all public translators are considered inactive.
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
				classifierName: request.classifierName,
			};
			logger.writeEventLog("events", "generate-direct>"+requester, classification.translations);
			callback(classification);
		} // end of if (!request.forward)
}


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
		if (request.source)  // limit the public translator to a specific source:
			socket.source = request.source;
		registeredPublicTranslators[request.classifierName][socket.id] = socket;
		activePublicTranslators[request.classifierName][socket.id] = socket;
		logger.writeEventLog("events", "PUBLICTRANSLATOR<", socket.id);

		socket.emit('classes', activeClassifier.classes);
		socket.emit('precisionrecall', activeClassifier.precisionrecall);
		
		
		// Send all pending automatic translations:
		for (text in pendingAutomaticTranslations[request.classifierName]) {
			classification = pendingAutomaticTranslations[request.classifierName][text];
			logger.writeEventLog("events", "translate-toapprove>"+socket.id, classification.translations);
			socket.emit('translation', classification);
		};
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
		classifierNames.forEach(function(classifierName) {
			delete registeredPublicTranslators[classifierName][socket.id];
			delete activePublicTranslators[classifierName][socket.id];
		});
	});

	// A human asks for a translation: 
	socket.on('translate', function(request) {
		translate(request, socket.id, socket.private_translator, function(classification) {
			logger.writeEventLog("events", "translate>"+socket.id, classification);
			socket.emit('translation', classification);
		}, socket);
	});
	
	function onTranslatorAction(socket, request) {
		if (socket.public_translator)    // remember that there is an active public translator
			activePublicTranslators[request.classifierName][socket.id] = socket;
		if (request && mapTextToTimer[request.text])    // stop the timer
			mapTextToTimer[request.text].stop();
	}
	
	// A human translator (public or private) says that a certain automatic translation is incorrect: 
	socket.on('delete_translation', function (request) {
		if (!request || !request.classifierName || !activeClassifiers[request.classifierName]) {
			console.error("classifierName not found! request="+JSON.stringify(request));
			return;
		}
		onTranslatorAction(socket, request);
		logger.writeEventLog("events", "DELETE<"+socket.id, request);
	});

	// A human translator (public or private) says that a certain automatic translation is missing: 
	socket.on('append_translation', function (request) {
		if (!request || !request.classifierName || !activeClassifiers[request.classifierName]) {
			console.error("classifierName not found! request="+JSON.stringify(request));
			return;
		}
		onTranslatorAction(socket, request);
		logger.writeEventLog("events", "APPEND<"+socket.id, request);
	});
	
	// A human translator asks to stop the timer of a certain translation: 
	socket.on('stop_timer', function(request) {
		if (!request || !request.classifierName || !activeClassifiers[request.classifierName]) {
			console.error("classifierName not found! request="+JSON.stringify(request));
			return;
		}
		onTranslatorAction(socket, request);
		logger.writeEventLog("events", "STOPTIMER<"+socket.id, request);
	});

	// A human translator (public or private) says that the current automatic translation (with the previously made corrections) is correct: 
	socket.on('approve', function (request) {
		if (!request || !request.classifierName || !activeClassifiers[request.classifierName]) {
			console.error("classifierName not found! request="+JSON.stringify(request));
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
			var errorText = err.stack.replace(/\n/g,"\n");
			console.error(errorText);
			automatic_translations = [errorText];
		}
		var is_correct = _(automatic_translations).isEqual(request.translations);
		
		logger.writeJsonLog("translations_manual", request);

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
		
		manualTranslations[request.classifierName][request.text] = request;
		delete pendingAutomaticTranslations[request.classifierName][request.text];

		textListeners(request.text).forEach(function(callback) {
			callback(request);
		});
		removeTextListeners(request.text);

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
