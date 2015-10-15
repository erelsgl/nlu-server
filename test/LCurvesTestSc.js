/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

// var should = require('should');
// var curves = require('../utils/learning_curves_sc');
// var _ = require('underscore');

// // curves.learning_curves(classifiers, data, parameters, 3, 5)

// describe('Learning curves utilities', function() {

// 	it('global', function() {
// 	// extractGlobal(classifiers, mytrain.length, n,  report1, stat)
// 	var stat = {}
// 	var classifiers = {'class1':'class1', 'class2':'class2'}
// 	var report = []

// 	report.push({'F1':1, 'Accuracy':2, 'macroF1':3})
// 	report.push({'F1':4, 'Accuracy':5, 'macroF1':6})

// 	curves.extractGlobal(classifiers, 1, 1,  report, stat)

// 	console.log(JSON.stringify(stat, null, 4))

// 	var report = []	

// 	report.push({'F1':11, 'Accuracy':22, 'macroF1':33})
// 	report.push({'F1':44, 'Accuracy':55, 'macroF1':66})

// 	curves.extractGlobal(classifiers, 1, 2,  report, stat)

// 	console.log(JSON.stringify(stat, null, 4))

// 	})
	
	
// 	it('trainlen', function() {
// 		var train = [[1,0],[3,2],[5,4],[7,6]]
// 		var train1 = curves.trainlen(train, 2)
// 		_.isEqual(train1, [1,0,3,2]).should.be.true
// 		var train1 = curves.trainlen(train, 3)
// 		_.isEqual(train1, [1,0,3,2,5,4]).should.be.true
// 	})

// 	it('filter', function() {
	
// 		var dataset = [
// 			{"input":{"CORENLP":{"sentences":[1,2,3,4,5,6]}}},
// 			{"input":{"CORENLP":{"sentences":[7,8,9,0]}}},
// 		]

// 		var data = curves.filtrain(dataset, 3,  0)
// 		_.isEqual(data[0]["input"]["CORENLP"]["sentences"], [1,2,3]).should.be.true
// 		_.isEqual(data[1]["input"]["CORENLP"]["sentences"], [7,8,9]).should.be.true

		
// 		var data = curves.filtrain(dataset,1, 0 )
// 		_.isEqual(data[0]["input"]["CORENLP"]["sentences"], [1]).should.be.true
// 		_.isEqual(data[1]["input"]["CORENLP"]["sentences"], [7]).should.be.true

// 		var data = curves.filtrain(dataset,1, 1)
// 		_.isEqual(data[0]["input"]["CORENLP"]["sentences"], [2]).should.be.true
// 		_.isEqual(data[1]["input"]["CORENLP"]["sentences"], [8]).should.be.true


// 		var data = curves.filtrain(dataset,2,2)
// 		_.isEqual(data[0]["input"]["CORENLP"]["sentences"], [3,4]).should.be.true
// 		_.isEqual(data[1]["input"]["CORENLP"]["sentences"], [9,0]).should.be.true

// 	})

// 	it('groupbylabel', function() {
// 		var dataset = [
// 			{"input":{"CORENLP":{"sentences":[1,2,3,4,5,6]}}, "output": [1]},
// 			{"input":{"CORENLP":{"sentences":[7,8,9,0]}}, "output":[2]},
// 			{"input":{"CORENLP":{"sentences":[7]}}, "output":[3]},
// 			{"input":{"CORENLP":{"sentences":[7]}}, "output":[2]},
// 			{"input":{"CORENLP":{"sentences":[1,2,3,4,5,6,7,8,9,10,11,12]}}, "output":[2]},
// 			{"input":{"CORENLP":{"sentences":[7,6,7,8,9]}}, "output":[2]},
// 			{"input":{"CORENLP":{"sentences":[1,2]}}, "output":[2]},
// 		]

// 		// function groupbylabel(dataset, minsize, sizetrain)
// 		var data = curves.groupbylabel(dataset, 2, 4)

// 		// console.log(JSON.stringify(data, null, 4))
// 		Object.keys(data).length.should.equal(1)
// 		data["2"].length.should.equal(4)
// 	})


// })
