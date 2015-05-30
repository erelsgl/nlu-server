/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

var should = require('should');
var curves = require('../utils/master');
var _ = require('underscore');

var stat = {
        "15": {
            "1": {
                "TC": { "0": 00, "1": 01 },
                "TCBOC": { "0": 10, "1": 11 }
                }
        },
        "30": {
            "1": {
                "TC": { "0": 20, "1": 21 },
                "TCBOC": { "0": 30, "1": 31 }
            }
        }
    }


describe('Learning curves master', function() {

	it('plotlcagrfold', function() {
		var output = curves.plotlcagr(0/*fold*/, 1/*len*/, stat)
		_.isEqual(output, [	["size","TC","TCBOC"],
    						["15",0,10],
    						["30",20,30]]).should.be.true
	})

	it('plotlcagraverage', function() {
		var output = curves.plotlcagr('average'/*fold*/, 1/*len*/, stat)
		_.isEqual(output, [	["size","TC","TCBOC"],
				  			[ '15', 0.5, 10.5 ],
 							[ '30', 20.5, 30.5 ] ]).should.be.true
	})
})
