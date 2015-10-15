/**
 * a unit-test for learning curves unit
 * 
 * @since 2013-08
 */

// var should = require('should');
// var curves = require(__dirname+'/../utils/learning_curves');
// var _ = require('underscore');

// curves.learning_curves(classifiers, data, parameters, 3, 5)

// describe('Learning curves utilities', function() {
	
// 	it('correctly aggregate average', function() {
	
// 	var stat = []
// 	var stats = []
// 	var average = []

// 	var classifiers = [['classifier1','classifier1'], ['classifier2', 'classifier2'], 
// 						['classifier3', 'classifier3'], ['classifier4', 'classifier4']]
// 	var parameters = [ 'F1', 'Precision', 'Recall' ]

// 	 stats = [{ F1: 1, Precision: 2, Recall: 3 },
//   			   { F1: 4, Precision: 5, Recall: 6 },
//   			   { F1: 7, Precision: 1, Recall: 8 },
//   			   { F1: 9, Precision: 1, Recall: 2 }]

// 	curves.extractGlobal(parameters, classifiers, 10, stats, stat)

// 	average = curves.getAverage(stat, 'F1', 10, classifiers)
// 	_.isEqual(average,[1,4,7,9]).should.equal(true)

// 	average = curves.getAverage(stat, 'Precision', 10, classifiers)
// 	_.isEqual(average,[2,5,1,1]).should.equal(true)

// 	_.isEqual(stat['F1']['10']['classifier1'],[1]).should.equal(true)
// 	_.isEqual(stat['F1']['10']['classifier2'],[4]).should.equal(true)
// 	_.isEqual(stat['Precision']['10']['classifier1'],[2]).should.equal(true)


// 	 stats = [ { F1: 2, Precision: 1, Recall: 1 },
//   			   { F1: 3, Precision: 2, Recall: 5 },
//   		       { F1: 5, Precision: 6, Recall: 7 },
//   			   { F1: 7, Precision: 5, Recall: 8 }]

// 	curves.extractGlobal(parameters, classifiers, 10, stats, stat)

// 	average = curves.getAverage(stat, 'F1', 10, classifiers)
// 	_.isEqual(average,[1.5,3.5,6,8]).should.equal(true)

// 	average = curves.getAverage(stat, 'Precision', 10, classifiers)
// 	_.isEqual(average,[1.5,3.5,3.5,3]).should.equal(true)

// 	_.isEqual(stat['F1']['10']['classifier1'],[1,2]).should.equal(true)
// 	_.isEqual(stat['F1']['10']['classifier2'],[4,3]).should.equal(true)
// 	_.isEqual(stat['Precision']['10']['classifier1'],[2,1]).should.equal(true)

// 	 stats = [{ F1: 5, Precision: 3, Recall: 2 },
//   			  { F1: 3, Precision: 2, Recall: 1 },
//   			  { F1: 1, Precision: 8, Recall: 3 },
//   			  { F1: 5, Precision: 9, Recall: 4 }]

// 	curves.extractGlobal(parameters, classifiers, 10, stats, stat)

// 	average = curves.getAverage(stat, 'F1', 10, classifiers)
// 	_.isEqual(average,[8/3,10/3,13/3,21/3]).should.equal(true)

// 	average = curves.getAverage(stat, 'Precision', 10, classifiers)
// 	_.isEqual(average,[2,3,5,5]).should.equal(true)

// 	_.isEqual(stat['F1']['10']['classifier1'],[1,2,5]).should.equal(true)
// 	_.isEqual(stat['F1']['10']['classifier2'],[4,3,3]).should.equal(true)
// 	_.isEqual(stat['Precision']['10']['classifier1'],[2,1,3]).should.equal(true)

// 	})

// })
