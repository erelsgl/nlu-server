/**
 * a unit-test for PrecisionRecall unit
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var rules = require(__dirname+'/rules.js');
var _ = require('underscore');


describe('Util test', function() {
	
	it('check generation', function() {

		var a = rules.generatesentence({ input: 'you offer me a leased car?!',
								found: 
  								 [ [ [ 'Leased Car', 'leased car', [],[15, 25] ] ],
  								 [ [ 'With leased car', '', [],[-1, -1] ] ] ]
    							  })
		_.isEqual(a['generated'], 'you offer me a <ATTRIBUTE>?!').should.be.true

		var a = rules.generatesentence({ 
								input: 'i need you to work 10 hours because there is a lot of job to do',
								found: 
									[ [ [ 'Working Hours', 'hours', [], [22, 27] ],
									[ 'Job Description', 'job', [], [54, 57] ] ],
									   [ [ '10 hours', '10', [], [19, 21] ] ] ]
									})

		_.isEqual(a['generated'], 'i need you to work <VALUE> <ATTRIBUTE> because there is a lot of <ATTRIBUTE> to do').should.be.true
		
		var a = rules.generatesentence({ 
								input: '20% pension',
								found: [ [ [ 'Pension Fund', 'pension', [], [4, 11] ] ], [ [ '20%', '20%', [], [0, 3] ] ] ]
							})
		_.isEqual(a['generated'],'<VALUE> <ATTRIBUTE>').should.be.true
	})	

	it('check the process except for Leased car', function (){

			var sentence = "i'm offering a job: programmer, 10 hours a day, 12000 , no car, fast promotion track"
			var data = rules.getFound(sentence)

			var data = rules.getFound("20% pension")
			_.isEqual(data, [[[ 'Pension Fund', 'pension', [1, 1], [4, 11] ] ],
                            [[ '0%', '0%', [0, 0], [1, 3] ], [ '20%', '20%', [0, 0], [0, 3] ] ] ]).should.be.true

			var data = rules.getFound("I accept 12000 and fast promotion")
			_.isEqual(data, [ [ [ 'Promotion Possibilities', 'promotion', [5, 5], [24, 33] ] ],
							  [ [ '12,000 NIS', '12000', [2, 2], [9, 14] ],
   							  [ 'Fast promotion track', 'fast', [4, 4], [19, 23] ] ] ]).should.be.true
			
			var data = rules.getFound("no liased car")
			_.isEqual(data, [ [ [ 'Leased Car', 'car', [2,2], [10,13] ] ],
  							[ [ 'Without leased car', '', [2,2], [10,13] ] ] ]).should.be.true
	})

	it('check the filtering', function (){

			var data = rules.getFilter( [
    [["Pension Fund","pension fund",[14,15],[76,88]],
     ["Pension Fund","pension",[14,14],[76,83]],
     ["Pension Fund","fund",[15,15],[84,88]]],[]])

			_.isEqual(data, [[["Pension Fund","pension fund",[14,15],[76,88]]],[]]).should.be.true

			var data = rules.getFilter( [[[ 'Pension Fund', 'pension', [], [4, 11] ] ],
                            [[ '0%', '0%', [], [1, 3] ], [ '20%', '20%', [], [0, 3] ] ] ])

			_.isEqual(data, [ [ [ 'Pension Fund', 'pension', [], [4, 11] ] ],
  							[ [ '20%', '20%', [], [0, 3] ] ] ]).should.be.true
	})

	it('check the word sequence generation', function (){
		var data = rules.getWords("I want a leased car and a salary", "leased car")
		_.isEqual(data,[3,4]).should.be.true
		var data = rules.getWords("I want a leased car", "car")
		_.isEqual(data,[4,4]).should.be.true
	})

	it('check the overall procedure', function (){
			var sentence = "i'm offering a job: programmer, 10 hours a day, 12000 , no car, fast promotion track"
			var data = rules.findData(sentence)
			
var a = rules.generatesentence({ input: sentence,
								 found: data })

			console.log(JSON.stringify(data, null, 4))
			console.log(JSON.stringify(a, null, 4))
			process.exit(0)
	})

})

