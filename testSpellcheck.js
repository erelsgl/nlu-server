/**
 * Correct spelling mistakes with the wordsworth interface
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */


var SpellCheck = require('spellcheck'),
    base = "knowledgeresources/spelling/",
    spell = new SpellCheck(base + 'en_US.aff', base + 'en_US.dic');

function checkSentence(str, cb, re, results) {
  re || (re = /(\w+)\W+/g);
  results || (results = []);
  if (m = re.exec(str)) {
    spell.check(m[1], function(err, correct, suggestions) {
      if (err)
        return cb(err);
      if (!correct) {
        results.push({
          word: m[1],
          position: m.index,
          suggestions: suggestions
        });
      }
      checkSentence(str, cb, re, results);
    });
  } else
    cb(null, results);
}

// check a sentence
var text = "This iz a verry long sentens with many, many words nd some mistakes :-)";
checkSentence(text, function(err, results) {
  console.dir(err);
  console.dir(results);
});



require("./SpellingCorrecter").initialize(function(SpellingCorrecter) {
	console.log(SpellingCorrecter.correct('I cann giv yuo 12000dollars nad 20000 NIS per mnth. Is that O.k?'));
	console.log(SpellingCorrecter.correct('I wnat to giv yuo 12000dollars nad 20000 NIS per mnth. Is that O.k?'));
	console.log(SpellingCorrecter.correct('"This iz a verry long sentens with many, many words nd some mistakes"'));
	//console.log(SpellingCorrecter.correct("This is a smile :-)"));
});

