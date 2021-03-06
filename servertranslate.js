/**
 * A socket.io server for Natural Language Understanding (NLU) and Natural Language Generation (NLG).
 * Based on a pre-trained model. 
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
	, limdu = require('limdu')
	, serialization = require('serialization')
	, timer = require('./timer');
	;


//
// Step 1: Configure an application with EXPRESS"
//

var app = express();
app.configure(function(){
	// Settings:
	app.set('port', process.argv[2] || process.env.PORT || 9995);
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
var classifierNames = ["Employer-usa"]
//var classifierNames = ["Candidate-usa"]
//var classifierNames = ["husband-israel", "wife-israel", "Employer","Candidate", "Candidate-israel", "Employer-israel", "Candidate-usa", "Employer-usa", "Employer-egypt-translate", "Employer-egypt-generate", "Employer-egypt", "Candidate-egypt-generate-basic", "Candidate-egypt-generate-honor", "Employer-israel-translate", "Candidate-israel-generate"]
//var classifierNames = ["husband-israel", "wife-israel", "Candidate-egypt-generate-basic"]
//var classifierNames = ["husband-israel", "wife-israel"]
//var classifierNames = ["Employer-egypt", "Candidate-egypt"]

var registeredPublicTranslators = {};
var activePublicTranslators = {};
var activeClassifiers = {};
var manualTranslations = {};
var pendingAutomaticTranslations = {};
classifierNames.forEach(function(classifierName) {
	console.log(classifierName)
	var startTime = new Date();
	var pathToBaseClassifier = __dirname+"/trainedClassifiers/"+classifierName+"/MostRecentClassifier.json";
	var pathToRetrainedClassifier = __dirname+"/trainedClassifiers/"+classifierName+"/RetrainedClassifier.json";
	var pathToClassifier = (fs.existsSync(pathToRetrainedClassifier)?
		pathToRetrainedClassifier:
		pathToBaseClassifier);

	activeClassifiers[classifierName] = serialization.fromString(
		fs.readFileSync(pathToClassifier), __dirname);
	activeClassifiers[classifierName].pathToRetrainedClassifier = pathToRetrainedClassifier;
	//activeClassifiers[classifierName].precisionrecall = limdu.utils.test(activeClassifiers[classifierName], activeClassifiers[classifierName].pastTrainingSamples).calculateStats();
	
	// activeClassifiers[classifierName].classes = activeClassifiers[classifierName].getAllClasses();
	activeClassifiers[classifierName].classes = JSON.parse(fs.readFileSync(__dirname+"/labels.json"))
	
	activeClassifiers[classifierName].classes = _.sortBy(activeClassifiers[classifierName].classes, function(label){

		// label = JSON.parse(label)
		if (_.isObject(label))
		{
			if (_.keys(label)[0]=="Offer")
				return 10
			if ((_.keys(label)[0]=="Query") && (_.values(label)[0]=="Offer"))
				return 9
			if ((_.values(label)[0]==true) || (_.values(label)[0]=="true"))
				return 9
			if (_.keys(label)[0]=="Accept")
				return 8
			if (_.keys(label)[0]=="Reject")
				return 7
			if (_.keys(label)[0]=="StartNewIssue")
                                return 1
			return 6
		}
		else
		return 9
	}).reverse()

	console.log("Number of classes of classifier")
	console.log(activeClassifiers[classifierName].classes.length)

	if (!activeClassifiers[classifierName].classes)
		throw new Error("Classes of classifier '"+classifierName+"' are null!");
	var elapsedTime = new Date()-startTime;
	console.log("Loaded classifier '"+classifierName+"' ("+elapsedTime+" ms)");
	
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

if (process.argv[2]==='test') {
	process.exit(0);
}

//
// Step 3: load additional approved translations from the manual translations file:
//
var lines = logger.readJsonLogSync(logger.cleanPathToLog("translations_manual.json"));
lines.forEach(function(sample) {
	if (sample.classifierName && manualTranslations[sample.classifierName])
		//if (sample.translations.length>0)
			manualTranslations[sample.classifierName][sample.text]=sample;
});

var lines = logger.readJsonLogSync(logger.cleanPathToLog("translations_pending.json"));
lines.forEach(function(sample) {
	if (sample.classifierName && manualTranslations[sample.classifierName])
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

//kill page - to check if the process can restart automatically:
app.get("/kill!!!", function(req,res) {
	logger.writeEventLog("events", "MANUAL","KILL!!!");
	process.nextTick(function() {throw new Error("Manual Kill!!!");});
});

var filter = function(lines, query) {
	if (!_.isEmpty(query)) {
		for (key in query) {
			var value = query[key];
			if (value=='true')
				value=true;
			else if (value=='false')
				value=false;
			else if (!isNaN(parseInt(value)))
				value = parseInt(value);
			query[key]=value;
		}
		return _(lines).where(query);
	}
}

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
		lines = filter(lines, req.query);
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

//view statistics of the previous correct/incorrect translations: 
app.get("/stats", function(req,res) {
	var filename = "translations_manual.json";
	var lines = logger.readJsonLogSync(logger.cleanPathToLog(filename));
	lines = filter(lines, req.query);
	
	var stats = {
		"meaningful-sentence, correct-meaning-translation":0,
		"meaningful-sentence, wrong-meaning-translation":0,
		"meaningful-sentence, wrong-empty-translation":0,
		"meaningful-sentence-total":0,

		"empty-sentence, correct-empty-translation":0,
		"empty-sentence, wrong-meaning-translation":0,
		"empty-sentence-total":0,

		"unhandled-sentence, wrong-meaning-translation":0,
		"unhandled-sentence, wrong-empty-translation":0,
		"unhandled-sentence-total":0,
		
		"correct-translation": 0,
		"wrong-translation": 0,
		
		"sentence-total":0,
	};
	lines.forEach(function(line) {
		if (!line.translations)
			return;

		var manualTranslationDescription = "";
		if (line.translations.length==0)
			manualTranslationDescription = "empty-sentence";
		else if (line.translations.length==1 && line.translations[0]=="Other")
			manualTranslationDescription = "unhandled-sentence";
		else 
			manualTranslationDescription = "meaningful-sentence";
		manualTranslationDescriptionTotal = manualTranslationDescription+"-total";
		if (manualTranslationDescriptionTotal in stats)
			stats[manualTranslationDescriptionTotal]++;
		else {
			res.end("error: '"+manualTranslationDescriptionTotal+"' not found (line="+JSON.stringify(line));
			return;
		}

		var automaticTranslationCorrectness = (line.is_correct? "correct": "wrong");
		var automaticTranslationMeaning     = (line.automatic_translations && line.automatic_translations.length==0? "empty": "meaning");
		var automaticTranslationCorrectnessDescription = automaticTranslationCorrectness+"-translation";
		var automaticTranslationDescription = automaticTranslationCorrectness+"-"+automaticTranslationMeaning+"-"+"translation";
		if (automaticTranslationCorrectnessDescription in stats)
			stats[automaticTranslationCorrectnessDescription]++;
		else {
			res.end("error: '"+automaticTranslationCorrectnessDescription+"' not found (line="+JSON.stringify(line));
			return;
		}
		
		var lineDescription = manualTranslationDescription+", "+automaticTranslationDescription;
		if (lineDescription in stats)
			stats[lineDescription]++;
		else {
			res.end("error: '"+lineDescription+"' not found (line="+JSON.stringify(line));
			return;
		}
		
		stats["sentence-total"]++;
	});

	res.render("stats", {
		query: req.query,
		stats: stats
	});
});


app.get("/test", function(req,res) {
                res.write("OK");
                res.end();
                return;
})

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
		logger.writeEventLog("events", (request.forward? "translate>": "generate>")+id, classification);
//		res.write(JSON.stringify(classification));
//		res.end();
		res.write(JSON.stringify(classification), function(err)
			{
			res.end();
			})
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

function classificationBelongsToTraslator(classification, translator) {
	if (!translator)
		throw new Error("translator is null");
	if (translator.source && classification.source && (classification.source!==translator.source))
		return false;
	if (translator.accountName && classification.accountName && (classification.accountName!==translator.accountName))
		return false;
	return true;
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
		}classificationBelongsToTraslator
		var activeClassifier = activeClassifiers[request.classifierName];

		logger.writeEventLog("events", (request.forward? "TRANSLATE<": "GENERATE<")+requester, request);

		if (request.forward) {   // forward translation = classification
			var classification;
			//var pastManualTranslation = manualTranslations[request.classifierName][request.text];
			var pastManualTranslation = null
			if (!requester_is_private_translator && pastManualTranslation && pastManualTranslation.translations && pastManualTranslation.translations.length>0) {
				classification = pastManualTranslation;
				if (request.explain) {
					classification.explanation = "already approved by a human translator"; 
				}
				logger.writeEventLog("events", "translate-pastManualTranslation>"+id, classification.translations);
			} else {
				classification = activeClassifier.classify(request.text, parseInt(request.explain), /*continuous_output=*/false);
				if (request.explain && !(classification instanceof Array)) {
					classification.translations = classification.classes;
					delete classification.classes;
				} else {
					classification = {
						translations: classification
					};
				};
				if (!classification.translations)
					classification.translations = [];
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
					if (!classificationBelongsToTraslator(classification, relevantPublicTranslators[id]))
						continue;
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
//							if (classification.translations.length == 0)
//								classification.translations.push("{\"Other\":true}")
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
				if (request.randomSeed) {
					var seedRandom = require('seed-random');
					seedRandom(request.randomSeed, true);
				}
//				else {
//					if (seedRandom)
//						seedRandom(undefined, true);
//				}
				// classes = JSON.parse(classes)
				if (!(classes instanceof Array))
					classes = [classes];
				var samples = [];
				classes.forEach(function(theClass) {
					// theClass = JSON.stringify(theClass)
					var samplesOfClass = activeClassifier.backClassify(theClass);
					var randomIndex = Math.floor(Math.random()*samplesOfClass.length);
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
	
	// A public translator accepts translations from other users for correction (a "wizard-of-oz"):
	socket.public_translator = false;
	socket.on('register_as_public_translator', function(request) {
		console.log("register_as_public_translator")
		console.error(JSON.stringify(request));
		if (!request || !request.classifierName || !activeClassifiers[request.classifierName]) {
			console.error("classifierName not found! request="+JSON.stringify(request));
			return;
		}
		var activeClassifier = activeClassifiers[request.classifierName];
		console.log("Number of classes "+ activeClassifier.classes.length)

		socket.public_translator = true;
		if (request.source)  // limit the public translator to a specific source:
			socket.source = request.source;
		if (request.accountName)  // limit the public translator to a specific account:
			socket.accountName = request.accountName;
		registeredPublicTranslators[request.classifierName][socket.id] = socket;
		activePublicTranslators[request.classifierName][socket.id] = socket;
		logger.writeEventLog("events", "PUBLICTRANSLATOR<", socket.id);

		socket.emit('classes', activeClassifier.classes);
		socket.emit('precisionrecall', activeClassifier.precisionrecall);
		
		
		// Send all pending automatic translations:
		for (text in pendingAutomaticTranslations[request.classifierName]) {
			classification = pendingAutomaticTranslations[request.classifierName][text];
			if (!classificationBelongsToTraslator(classification, socket))
				continue;
			logger.writeEventLog("events", "translate-toapprove>"+socket.id, classification.translations);
			socket.emit('translation', classification);
		};
	});

	// Private translator corrects his own translations, without the help of a public translator:
	socket.private_translator = false;
	socket.on('register_as_private_translator', function(request) {
		console.log(register_as_private_translator)
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
			logger.writeEventLog("events", (request.forward? "translate>": "generate>")+socket.id, classification);
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
		
		request.automatic_translations = automatic_translations;
		request.is_correct = is_correct;
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
				fs.writeFile(activeClassifier.pathToRetrainedClassifier, serialization.toString(activeClassifier), 'utf-8', function(err) {
					logger.writeEventLog("events", "+++SAVE<"+socket.id, err);
				});
			}
			
			activeClassifier.precisionrecall = limdu.utils.test(activeClassifier, activeClassifier.pastTrainingSamples).calculateStats();
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
