/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

var should = require('should');
var master = require('../utils/master');
var _ = require('underscore');

var stat = {
        "15": {
            "0": {
                "TC": { "0": 500, "1": 401 },
                "TCBOC": { "0": 410, "1": 611 }
                },
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

        it('plotlcagrfold', function() {
                var output = master.plotlcagr(0/*fold*/, stat)
                _.isEqual(output, [     ["size","TC","TCBOC"],
                                                ["15",0,10],
                                                ["30",20,30]]).should.be.true

                var str = master.getstringlc(output)
                str.should.be.equal("size\tTC\tTCBOC\n15\t0\t10\n30\t20\t30")
        })

        it('plotlcagraverage', function() {
                var output = master.plotlcagr('average'/*fold*/, stat)
                _.isEqual(output, [     ["size","TC","TCBOC"],
                                                        [ '15', 0.5, 10.5 ],
                                                        [ '30', 20.5, 30.5 ] ]).should.be.true
        })
})
