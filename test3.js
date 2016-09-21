var _ = require('underscore')._;
var fs = require('fs');

var data = JSON.parse(fs.readFileSync('../negochat_private/parsed_finalized.json'))

data = _.shuffle(data)
data = _.shuffle(data)
data = _.shuffle(data)
data = _.shuffle(data)
data = _.shuffle(data)
data = _.shuffle(data)

console.log(JSON.stringify(data, null, 4))
