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

        it('trainlen', function() {
        var train = [
                [{'input':11, 'output':12},{'input':21, 'output':22}],
                [{'input':31, 'output':12}]
                ]
                
                var trainop = master.trainlen(train, 1)
                trainop.length.should.equal(2)

                var trainop = master.trainlen(train, 2)
                trainop.length.should.equal(3)

	
        })

})
