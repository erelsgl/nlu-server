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

        // it('plotlcagrfold', function() {
        //         var output = master.plotlcagr(0/*fold*/, stat)
        //         _.isEqual(output, [     ["size","TC","TCBOC"],
        //                                         ["15",0,10],
        //                                         ["30",20,30]]).should.be.true

        //         var str = master.getstringlc(output)
        //         str.should.be.equal("size\tTC\tTCBOC\n15\t0\t10\n30\t20\t30")
        // })

        it('plotlcagr', function() {
                var output = master.plotlcagr(0/*fold*/, stat)
                _.isEqual(output, [     ["size","TC","TCBOC"],
                                        [ '15', 250, 210 ],
                                        [ '30', 20, 30 ] ]).should.be.true

                var output = master.plotlcagr('average'/*fold*/, stat)
                _.isEqual(output, [     ["size","TC","TCBOC"],
                                        [ '15', 225.5, 260.5 ],
                                        [ '30', 20.5, 30.5 ] ]).should.be.true

        })

        it('plotlcagrlen', function() {

                var stat = {
                "1": {
                        "TC": { "0": 1, "1": 2, "2": 3, "3": 4 },
                        "TC1": {"0": 3, "2": 4}
                },
                "2": {
                        "TC": { "1": 5, "2": 6 }   
                }}

                var output = master.plotlcagrlen(2, stat)
                _.isEqual(output, { TC: 4.5, TC1: 4 }).should.be.true

                var output = master.plotlcagrlen('average', stat)
                _.isEqual(output, { TC: 4, TC1: 3.5 }).should.be.true

                })

        it('plotlcagrlenaverge', function() {
                var stat = { "1": 3, "3": 6, "8": 3 }
                master.plotlcagrlenaverge(stat).should.be.equal(4)

        })

        it('hmcalc', function() {
                
                var out = master.hmcalc(0, stat, 'TC', 'TCBOC')
                _.isEqual(out,[["15","0",-90],["15","1",10],["30","1",10]]).should.be.true

                var stat1 = JSON.parse(JSON.stringify(stat))
                stat1['15']["0"]["TC"][3] = 10
                stat1['15']["1"]["TCBOC"][3] = 10

                var out = master.hmcalc(3, stat1, 'TC', 'TCBOC')
                out.length.should.equal(0)

                var stat1 = JSON.parse(JSON.stringify(stat))
                stat1['15']["0"]["TC"][0] = undefined

                var out = master.hmcalc(0, stat1, 'TC', 'TCBOC')
                out.length.should.equal(2)

                var out = master.hmcalc('average', stat, 'TC', 'TCBOC')
                _.isEqual(out,[["15","0",60],["15","1",10],["30","1",10]]).should.be.true
                
                var stat1 = JSON.parse(JSON.stringify(stat))
                stat1['15']["0"]["TC"][0] = undefined
                var out = master.hmcalc('average', stat1, 'TC', 'TCBOC')
                _.isEqual(out,[["15","1",10],["30","1",10]]).should.be.true

        })

})
