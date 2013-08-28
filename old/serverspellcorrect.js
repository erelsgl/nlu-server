/**
 * A socket.io server for text categorization. Based on a pre-trained model. 
 * 
 * @author Erel Segal-Halevi erelsgl@gmail.com
 * @since 2013-06
 */
var express = require('express')
	, http = require('http')
	, logger = require('./logger')
	, _ = require('underscore')._
	, spellchecker = require('wordsworth').getInstance();
	;


//
// Step 1: Configure an application with EXPRESS"
//

var app = express();
app.configure(function(){
	// Settings:
	app.set('port', process.env.PORT || 9996);
	app.set('case sensitive routing', false);	// Enable case sensitivity, disabled by default, treating "/Foo" and "/foo" as same

	// Define tasks to do for ANY url:
	app.use(function(req,res,next) {
		if (!/[.]js/.test(req.url) && !/\/images\//.test(req.url) && !/[.]css/.test(req.url)) {
			logger.writeEventLog("events", req.method+" "+req.url, _.extend({remoteAddress: req.ip}, req.headers));
		}
		next(); // go to the next task - routing:
	});

	app.use(app.router);
});

//
// Step 2: Load and train the spellchecker
//

var SpellingCorrecter = require("./SpellingCorrecter");

//
// Step 3: define an HTTP server over the express application:
//

var httpserver = http.createServer(app);

httpserver.listen(app.get('port'), function(){
	logger.writeEventLog("events", "START", {port:app.get('port')});
});


// correction as a web service: 
app.get("/get", function(req,res) {
	if (!req.query||!req.query.text) {
		res.write("SYNTAX: /get?text=[sentence-to-correct]");
		res.end();
		return;
	}
	console.dir(req.query);
	var text = req.query.text;
	var corrected_text = SpellingCorrecter(text);
	logger.writeEventLog("events", "correct", corrected_text);
	res.write(corrected_text);
	res.end();
});

//
// Last things to do before exit:
//
 
process.on('exit', function (){
	logger.writeEventLog("events", "END", {port:app.get('port')});
	console.log('Goodbye!');
});
