var cluster = require('cluster');
var async = require('async')
var _ = require('underscore')._;
var fs = require('fs');
var partitions = require('limdu/utils/partitions');
var classifiers = require(__dirname+"/../classifiers.js")
var trainAndTest_async = require(__dirname+'/trainAndTest').trainAndTest_async;
// var bars = require(__dirname+'/bars');

setTimeout(function() {
process.send({ msg: 'test' })  
process.exit()    
    }, _.random(10)*1000);


