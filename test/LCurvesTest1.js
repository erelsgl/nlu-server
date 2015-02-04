/**
 * a unit-test for PrecisionRecall unit
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var _ = require('underscore');
var curves = require('../utils/learning_curves.js');

describe('Curves test', function() {

	it('thereisdata', function() {	
		curves.thereisdata([1,'?',3]).should.be.true
		curves.thereisdata(['?','?']).should.be.false
		curves.thereisdata('?').should.be.false
		curves.thereisdata(5).should.be.true
	})

	it('getAverage', function() {
		var stat = { "GreetRecall": 
						{
		        		"2": {
		            			"_size": 19,
		            			"PPDB": [ 1, 2, 3, 0.5 ],
		            			"Original": [ 0.6 ]
		        			 }
	    				}
	    			}

		var classifiers = { PPDB: [], Original: [] }

		_.isEqual(curves.getAverage(stat, 'GreetRecall', 2, classifiers),   [ 1.625, 0.6 ]).should.be.true
	})


	it('onlyNumbers', function() {
		_.isEqual(curves.onlyNumbers([1,2,0.5,-8,'5','abs','3']), [ 1, 2, 0.5, -8, '5', '3' ]).should.be.true
	})

	it('isProb', function() {
		curves.isProb([1.2,0.5,-0.6]).should.be.false
		curves.isProb([0.1,0.7,0.9]).should.be.true
		curves.isProb([0.1,0.7,1.9]).should.be.false
	})

	it('filternan', function() {
		_.isEqual(curves.filternan([1,2,'wqd',0,-1]), [ 1, 2, '?', 0, '?' ]).should.be.true
		_.isEqual(curves.filternan(5), 5).should.be.true
		_.isEqual(curves.filternan('a'), '?').should.be.true
		_.isEqual(curves.filternan(-1), '?').should.be.true
		_.isEqual(curves.filternan([1.5,8.9]), [1.5,8.9]).should.be.true
	})
	
})

