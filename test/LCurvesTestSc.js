/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

var should = require('should');
var curves = require('../utils/learning_curves_sc');
var _ = require('underscore');

// curves.learning_curves(classifiers, data, parameters, 3, 5)

describe('Learning curves utilities', function() {
	
	it('filter', function() {
	
		var dataset = [
			{"input":{"CORENLP":{"sentences":[1,2,3,4,5,6]}}},
			{"input":{"CORENLP":{"sentences":[7,8,9,0]}}},
		]

		var data = curves.filtrain(dataset, 3)
		_.isEqual(data[0]["input"]["CORENLP"]["sentences"], [1,2,3]).should.be.true
		_.isEqual(data[1]["input"]["CORENLP"]["sentences"], [7,8,9]).should.be.true

	})

	it('filter', function() {
		var dataset = [
			{"input":{"CORENLP":{"sentences":[1,2,3,4,5,6]}}, "output": [1]},
			{"input":{"CORENLP":{"sentences":[7,8,9,0]}}, "output":[2]},
			{"input":{"CORENLP":{"sentences":[7]}}, "output":[3]},
			{"input":{"CORENLP":{"sentences":[7]}}, "output":[2]},
			{"input":{"CORENLP":{"sentences":[7,6,7,8,9]}}, "output":[2]},
			{"input":{"CORENLP":{"sentences":[1,2]}}, "output":[2]},
		]
		
		var data = curves.groupbylabel(dataset, 2, 3)
		data[2].length.should.equal(3)
	})


})
