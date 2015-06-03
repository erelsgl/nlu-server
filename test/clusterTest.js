/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

var should = require('should');
var master = require('../utils/master');
var _ = require('underscore');



describe('wikipedia', function() {

	it('filtrain', function() {
                var train = [{'input':{'CORENLP':{'sentences':[1,2,3,4]}}}]

        	// var trainop = master.filtrain(train, 0, 0)
                // trainop[0]['input']['CORENLP']['sentences'].length.should.equal(0)
                var trainop = master.filtrain(train, 1, 0)
                trainop[0]['input']['CORENLP']['sentences'].length.should.equal(1)
                var trainop = master.filtrain(train, 2, 0)
                trainop[0]['input']['CORENLP']['sentences'].length.should.equal(2)
	})

	
})
