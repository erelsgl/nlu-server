var HOST=process.env.SPELLCORRECTION_SERVER_HOST || "http://localhost";
var PORT=process.env.SPELLCORRECTION_SERVER_HOST || 9996;
var URL=HOST+":"+PORT+"/get";
var request = require('request');

module.exports = function(sentence) {
	var url = URL+"?text="+encodeURIComponent(sentence);
	var self = this;
	request(url, function(error, response, body) {
		var translations;
		if (!error && response.statusCode == 200) {
			console.dir(body);
			var result = JSON.parse(body);
			if (!result.translations) {
				logWithTimestamp("ERROR! "+self.translatorName + " receives no translations! "+JSON.stringify(result));
				translations = [];
			} else {
				logWithTimestamp(self.translatorName + " receives "+result.translations.length+" translations from '"+result.classifierName+"' to "+JSON.stringify(result.text) + ": "+JSON.stringify(result.translations));
				translations = result.translations;
			}
		} else {
			console.log(url);
			logWithTimestamp(self.translatorName + " receives error: "+error+", response="+JSON.stringify(response));
			translations = requestObject.text;

			/*
			if (requestObject.forward) {
				translations = requestObject.text;
			} else {
				console.dir(requestObject.text);
				if (Array.isArray(requestObject.text)) {
					translations = requestObject.text.map(stringifyIfNeeded);
				} else {
					translations = stringifyIfNeeded(requestObject.text);
				}
			}
			*/
			if (!Array.isArray(translations))
				translations = [translations];
			logWithTimestamp(self.translatorName + " falls back to: "+translations.length+" translations from '"+self.classifierName+"' to "+JSON.stringify(requestObject.text) + ": "+JSON.stringify(translations));
		}
		if (callback)
			callback(requestObject.text, translations);
	});
}

}

