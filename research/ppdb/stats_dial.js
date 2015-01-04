// 106 dialogues

var _ = require('underscore')._; 
var fs = require('fs');
var utils = require('./utils') 
var bars = require('../../utils/bars')

var data = []

data = JSON.parse(fs.readFileSync("../../../datasets/DatasetDraft/dial_usa_rule.json"))

var total = data.length
var goodconv = _.filter(data, function(dial){ return bars.isactivedialogue(dial) == true }).length
var badconv = _.filter(data, function(dial){ return bars.isactivedialogue(dial) == false }).length
var turns = bars.extractturns(data).length

console.log("goodconv "+goodconv)
console.log("badconv "+badconv)
console.log("total "+total)

console.log("turns "+turns)
process.exit(0)
