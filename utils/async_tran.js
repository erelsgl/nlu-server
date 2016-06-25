var async = require('async');

var microsoftT = require('mstranslator');

var fs = require('fs')
var keys = JSON.parse(fs.readFileSync(__dirname+"/keys.json"))

var yandex = require('yandex-translate')(keys.yandex); 
var microsoft = new microsoftT({
  client_id: "fsdhkjhj", 
    client_secret: keys.microsoft
}, true);

var googleTranslate = require('google-translate')(keys.google);

console.vlog = function(data) {
  fs.appendFileSync("/tmp/logs/tran", data + '\n', 'utf8')
};

function translate(engine, fromln, toln, text, callback)
{
  var translated = ""

  async.series([
    function(callback){
        if(engine.toLowerCase() == "yandex") {
			    yandex.translate(text, { to: toln, from: fromln }, function(err, res) {
				    translated = res.text[0]
          	callback(null, null);
			});
	    } else {
          callback(null, null);
        }
    },
    function(callback){
        if(engine.toLowerCase() == "microsoft") {
        	microsoft.translate({ text:  text, from: fromln, to: toln }, function(err, data) {
				translated = data
          		callback(null, null);
			});
        } else {
          callback(null, null);
        }
    },
  function(callback){
        if(engine.toLowerCase() == "google") {
                googleTranslate.translate(text, fromln, toln, function(err, data) {
                                translated = data.translatedText
                        callback(null, null);
                        });
        } else {
          callback(null, null);
        }
    }
], function () {
    callback(null, translated)
})
}

/*
node utils/async_tran.js 'yandex' 'microsoft' 'de' 'I am starting doing stuff'
node utils/async_tran.js 'microsoft' 'microsoft' 'de' 'I am starting doing stuff'

*/

var engine1 = process.argv[2]
var engine2 = process.argv[3]
var ln = process.argv[4]
var text = process.argv[5]

console.vlog("DEBUGTRAN: engine1: "+engine1+ " engine2:"+ engine2+" ln:"+ln)
console.vlog("DEBUGTRAN: text: "+text)

translate(engine1, 'en', ln, text, function(err, translated){
  console.vlog("DEBUGTRAN: to: "+translated)
  
  translate(engine2, ln, 'en', translated, function(err, result){
    console.vlog("DEBUGTRAN: back: "+result)
    console.log(result)
  })

})
