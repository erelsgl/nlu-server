/**
 * a unit-test for PrecisionRecall unit
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var utils = require('./utils');
var _ = require('underscore');
var sync = require('synchronize')

function makeid(len)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < len; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}


describe('Util test', function() {
 // this.timeout(15000);

	// it('correctly calculates precision, recall, etc.', function() {
	// 	utils.stat({'TP':4,'FP':2,'FN':0})['Recall'].should.equal(1)
	// 	utils.stat({'TP':4,'FP':2,'FN':0})['F1'].should.equal(0.8)
	// 	utils.stat({'TP':4,'FP':2,'FN':0})['Precision'].should.equal(0.6666666666666666)
	// });

	
 // 	it('correctly clasify actual and expected clean', function() {
	// 	sync.fiber(function(){
	// 		var result = utils.cleanlisteval(['offer','suggest','offered','suppose','car'],['offer','suggest','suppose','supposed','invite','invited', 'I am offering', 'ofer'])
	// 		_.isEqual(['stats'], { TP: 4, FP: 1, FN: 3 }).should.be.true
			
	// 		var result = utils.cleanlisteval(['offer','suggest','offered','suppose','car'],['offer','suggest','suppose','supposed'])
	// 		_.isEqual(result['stats'], { TP: 4, FP: 1, FN: 0 }).should.be.true

	// 		var result = utils.cleanlisteval(['offer','suggest','offered','suppose'],['offer','suggest','suppose','supposed'])
	// 		_.isEqual(result['stats'], { TP: 4, FP: 0, FN: 0 }).should.be.true

	// 		var result = utils.cleanlisteval(['offer','suggest','suppose'],['offer','suggest','suppose'])
	// 		_.isEqual(result['stats'], { TP: 3, FP: 0, FN: 0 }).should.be.true
	// 	})
	// })

	// it('check readredis', function() {
	// 	sync.fiber(function(){
	// 	var len = _.random(5,20)
	// 	var str = 'mocha_'+makeid(len)
	// 	var pos = sync.await(utils.readpos(str, sync.defer()))
	// 	_.isEqual(pos,null).should.be.true
	// 	})	
	// })

	// it('check writereadis', function() {
	// 	sync.fiber(function(){
	// 	var len = _.random(5,20)
	// 	var str = 'mocha_'+makeid(len)
	// 	var pos = sync.await(utils.readpos(str, sync.defer()))
	// 	_.isEqual(pos,null).should.be.true
	// 	sync.await(utils.writepos(str, "DONE", sync.defer()))
	// 	var pos = sync.await(utils.readpos(str, sync.defer()))
	// 	_.isEqual(pos, "DONE").should.be.true
	// 	console.log(pos)
	// 	})	
	// 	console.log("out")
	// })

	// it('pos tagger is on', function(done1) {
	// 	utils.retrievepos("I only want", function(err, results){
	// 		_.isEqual(results, "I_PRP only_RB want_VBP").should.be.true
	// 		done1();
	// 	})
	// })

	// it('correctly get pos tags', function(done) {
	// 	utils.onlycontent("i hommat", function(err, results){
	// 		_.isEqual(results, [ 'i', 'hommat' ]).should.be.true
	// 		done()		
	// 	})
	// })

	// it('correctly get content', function() {
	// 	_.isEqual(utils.cleanposoutput("we_PRP agree_VBP on_IN\n"), [ 'agree' ]).should.be.true
	// })

	// it('correctly compare 1', function(done) {
	// 	utils.compare(["i offer", "i provide"], function(err, result){
	// 		_.isEqual(result, ['i offer','i provide',['offer'],['provide'],0]).should.be.true
	// 		done()
	// 	})
	// })

	// it('correctly compare 2', function(done) {
	// 	utils.compare(["to provide", "you be a"], function(err, result){
	// 		_.isEqual(result, [ 'to provide', 'you be a', [ 'provide' ], [ 'you', 'be', 'a' ], 0 ]).should.be.true
	// 		done()
	// 	})
	// })	


	it('check depth', function() {
		// sync(utils, 'cleanredis')
		// var data = []
		sync.fiber(function(){
			var dat = sync.await(utils.cleanredis("offer", sync.defer()))

			// var data = utils.cleanthreelayer(['offer'],1)
			console.log("ok")
			console.log(dat)
			// console.log()
			// process.exit(0)
		})
		// console.log(data)
		console.log("out")
	})	


	// it('correctly compare 3', function(done) {
		// utils.compare(["to provide", "i need"], function(err, result){
			// console.log(result)
			// _.isEqual(result, [ 'to provide', 'you be a', [ 'provide' ], [ 'be' ], 0 ]).should.be.true
			// done()
		// })
	// })		

	// it('correctly clasify actual and expected 1', function(done) {
	// 	utils.listeval(['offer','suggest','suppose'],['offer','suggest','suppose'], function(err, result)
	// 	{
	// 		_.isEqual(result['stats'], { TP: 3, FP: 0, FN: 0 }).should.be.true
	// 		done()
	// 	})
	// })

	// it('correctly clasify actual and expected 2', function(done) {
	// 	utils.listeval(['offer','suggest','offered','suppose'],['offer','suggest','suppose','supposed'], function(err, result)
	// 	{
	// 		_.isEqual(result['stats'], { TP: 4, FP: 0, FN: 0 }).should.be.true
	// 		done()
	// 	})
	// })

	// it('correctly clasify actual and expected 3', function(done) {
	// 	utils.listeval(['offer','suggest','offered','suppose','car'],['offer','suggest','suppose','supposed'], function(err, result)
	// 	{
	// 		console.log(result)
	// 		process.exit(0)
	// 		_.isEqual(result['stats'], { TP: 4, FP: 1, FN: 0 }).should.be.true
	// 		done()
	// 	})
	// })

	// it('correctly clasify actual and expected 4', function(done) {
	// 	utils.listeval(['offer','suggest','offered','suppose','car'],['offer','suggest','suppose','supposed','invite','invited', 'I am offering', 'ofer'], function(err, result)
	// 	{
	// 		_.isEqual(result['stats'], { TP: 4, FP: 1, FN: 3 }).should.be.true
	// 		done()
	// 	})
	// })

})

