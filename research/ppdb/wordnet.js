var natural = require('natural');

var wordnet = new natural.WordNet();

var sym = []
wordnet.lookupSynonyms('offer', function(results) {
    results.forEach(function(result) {
    	// sym.push(result.lemma)
      console.log(result)
      console.log(result.ptrs)
        // console.log('------------------------------------');
//        console.log(result.synsetOffset);
  ///      console.log(result.pos);
     //   console.log(result.lemma);
       // console.log(result.synonyms);
//        c//onsole.log(result.gloss);
	// console.log(result)
    });

    console.log(sym)
    console.log()
    process.exit(0)
});
