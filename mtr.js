 var MsTranslator = require('mstranslator');
    
    
    var client = new MsTranslator({
      client_id: "kbNsIlbmg"
//      client_id: "ed63b222-533b-492d-bb71-2921b9918b0a"
      , client_secret: "kbNsIlbmg4mPZUW9bvhUBCRWmihEOHYWpRziHzRCW14="
  //    , client_secret: "BEcLnZpVL+TAKpnsIC7cPdY0vgmTz4K0x1bpYQy4QyU"
    }, true);

    var params = {
      text: 'How\'s it going?'
      , from: 'en'
      , to: 'ru'
    };

    // Don't worry about access token, it will be auto-generated if needed.
    client.translate(params, function(err, data) {
          console.log(data);
   	  console.log(err);
    });
