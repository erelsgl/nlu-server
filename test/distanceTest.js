/*
 * a unit-test for kNN classifier.
 * 
 * @author Vasily Konovalov
 * @since 2015-03
 */

var should = require('should');
var distance = require('../utils/distance');
var _ = require("underscore")._;

describe('kNN common test', function() {

	it('average', function(){
		distance.average([2, 5, 5]).should.equal(4)
	})

	it('vec minus', function(){
		_.isEqual(distance.vec_minus([2, 5, 5], [1,2,3]), [-1,-3,-2]).should.be.true
	})

	it('dot distance', function(){
		distance.dot_distance([2,2],[1,1]).should.equal(4)
	})

	it('and distance', function(){
		distance.and_distance([1,0,1],[1,0,0]).should.equal(1)
		distance.and_distance([1,0,1],[1,0,1]).should.equal(0.5)
	})

	it('manhattan distance', function(){
		distance.manhattan_distance([2,2],[1,1]).should.equal(2)
	})

	it('chebyshev distance', function(){
		distance.chebyshev_distance([2,2],[1,1]).should.equal(1)
	})

	it('euclidean distance', function(){
		distance.euclidean_distance([0,0],[1,1]).should.equal(Math.sqrt(2))
		distance.euclidean_distance([0,0,1,0,0,1,0,1,1],[0,0,0,0,1,1,0,1,1]).should.equal(1.4142135623730951)
	})

	it('and_distance', function(){
		distance.and_distance([2,2,0,0,0],[1,1,0,1,0]).should.equal(0.5)	
		distance.and_distance([1,0,1,4.5,0],[0,1,0,1.5,0]).should.equal(1)	
		distance.and_distance([0,0,1,0,0,1,0,1,1],[0,0,0,0,1,1,0,1,1]).should.equal(0.3333333333333333)
	})

	it('cosine_distance', function(){
		distance.cosine_distance([2, 1, 0, 2, 0, 1, 1, 1],[2, 1, 1, 1, 1, 0, 1, 1]).should.equal(1/0.8215838362577491)	
		distance.cosine_distance([0,0,1,0,0,1,0,1,1],[0,0,0,0,1,1,0,1,1]).should.equal(1/0.75)
		distance.cosine_distance([1,1,0],[1,0,1]).should.equal(1/0.4999999999999999)
	})

	it('Add distance', function(){
		var target = [1,1,1]
		var substitute = [2,2,2]
		var context = [[3,3,3],[4,4,4]]
		distance.Add(target, substitute, context).should.equal(0.9999999999999999)
	})
})



