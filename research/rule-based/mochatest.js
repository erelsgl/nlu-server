/**
 * a unit-test for PrecisionRecall unit
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var rules = require(__dirname+'/rules.js');
var truth = require(__dirname+'/truth_utils.js');
var _ = require('underscore');

var path = __dirname + "/../../../truth_teller"
var truth_filename = path + "/sentence_to_truthteller.txt"

describe('Util test', function() {


	it('check filter', function() {
		var data = rules.getFound("let us compromise without a leased car")
		var filtered = rules.getFilter(data)
		_.isEqual([[["Leased Car","leased car",[5,6],[28,38]]],[["Without leased car","car",[6,6],[-1,-1]]]], filtered).should.be.true
	})
			

	it('check filter', function() {
		var fil = rules.filterValues(['Salary', 'Pension Fund', 'car'])
		fil[0].should.be.equal('car')
	})

	it('check generation', function() {
		var data = rules.compeletePhrase('12000 nis working as programmer, with leased car, no promotion agreement, 8 working hours','programmer')	
		data.should.equal(21)

		var data = rules.compeletePhrase('pension fund is ok', 'pension fund')
		data.should.equal(0)

		var data = rules.compeletePhrase('i accept pension fund', 'pension fund')
		data.should.equal(9)

		var data = rules.compeletePhrase('pension fund 10% is ok', '10')
		data.should.equal(-1)

		var data = rules.compeletePhrase('working hours 10', '10%')
		data.should.equal(-1)
	})
	
	it('check generation', function() {
		var data = rules.addcomplement(['20,000 NIS'])
		_.isEqual(data, [ '20,000 NIS', 'Salary' ]).should.be.true
	})
	
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

				
			var data = rules.getFound("how about 1200 nis, programmer, with a leased car, 10% pension, and 10 hours")

			var data = rules.getFound("how about 1200 nis, programmer, with a leased car, 10% pension, and 10 hours")
			_.isEqual(data[1], [["10%","10%",[9,9],[51,54]],["10 hours","10",[12,12],[68,70]],["With leased car","car",[13,0],[-1,-1]]]).should.be.true
			// var filtered = rules.getFilter(data)
			// _.isEqual(filtered[1], [["9 hours","9",[0,0],[0,1]],["With leased car","car",[3,1],[-1,-1]]]).should.be.true
			
			var data = rules.getFound("9 hours with leased")
			var filtered = rules.getFilter(data)
			_.isEqual(filtered[1], [["9 hours","9",[0,0],[0,1]],["With leased car","car",[3,1],[-1,-1]]]).should.be.true
			
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
  							[ [ 'Without leased car', 'car', [2,2], [10,13] ] ] ]).should.be.true
			
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
			var sentence = "12000 nis"
			var data = rules.findData(sentence)
			
			var a = rules.generatesentence({ input: sentence,
								 found: data })

			_.isEqual(a['generated'],'<VALUE>').should.be.true

			var sentence = "our counter proposal is 12000 nis"
			var data = rules.findData(sentence)
			
			var a = rules.generatesentence({ input: sentence,
								 found: data })

			var sentence = "fast promotion track"
			var data = rules.findData(sentence)
			
			var a = rules.generatesentence({ input: sentence,
								 found: data })

			_.isEqual(a['generated'],'<VALUE> <ATTRIBUTE>').should.be.true

			var sentence = "without a leased car"
			var data = rules.findData(sentence)
			
			var a = rules.generatesentence({ input: sentence,
								 found: data })

			_.isEqual(a['generated'],'a <ATTRIBUTE>').should.be.true

			// console.log(JSON.stringify(a, null, 4))
			// console.log(JSON.stringify(data, null, 4))
	})

	it('check truth value', function (){
		var sentence = "we are not prepared to offer a leased car with this position at this time."
		var a = truth.verbnegation(sentence, truth_filename)
		console.log(a)
	})

})

