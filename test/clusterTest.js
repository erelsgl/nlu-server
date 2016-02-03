/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

var should = require('should');
var master = require(__dirname+'/../lc/master');
var _ = require('underscore');

var stat = {
        "15": {
                "TC": { "0": 500, 
			"1": 401 },
                "TCBOC": { "0": 410, 
			   "1": 611 }
        },
        "30": {
		"TCBOC": { "1": 31, 
                           "0": 30 },
                "TC": { "0": 21, 
			"1": 20 }
        }
    }

describe('ClusterTest', function() {

/*        it('trainlen', function() {
        var train = [
                [{'input':11, 'output':12},{'input':21, 'output':22}],
                [{'input':31, 'output':12}]
                ]
                
                var trainop = master.trainlen(train, 1)
                trainop.length.should.equal(2)

                var trainop = master.trainlen(train, 2)
                trainop.length.should.equal(3)
        })
*/

        it('plotlcagr', function() {
                var output = master.plotlcagr(0/*fold*/, stat)

	
                _.isEqual(output, [     ["size","TC","TCBOC"],
                                        [ '15', 500, 410 ],
                                        [ '30', 21, 30 ] ]).should.equal(true)

                var output = master.plotlcagr('average'/*fold*/, stat)
		
                _.isEqual(output, [     ["size","TC","TCBOC"],
                                        [ '15', 450.5, 510.5 ],
                                        [ '30', 20.5, 30.5 ] ]).should.equal(true)

        })

        it('plotlcagrlen', function() {

                var stat = {
	               	"dial": { "0": 5,
				  "1": 7,
				  "2": 9,
				  "3": 11
				
					},
		        "TC": { "0": 1, 
				"1": 2, 
				"2": 3, 
				"3": 4 }
                }

                _.isEqual(master.plotlcagrlen(2, stat), { dial: 9, TC: 3 }).should.equal(true)
                _.isEqual(master.plotlcagrlen('average', stat), { dial: 8, TC: 2.5 }).should.equal(true)

                })

        it('plotlcagrlenaverge', function() {
                var stat = { "1": 3, "3": 6, "8": 3 }
                master.plotlcagrlenaverge(stat).should.be.equal(4)

        })

/*        it('hmcalc', function() {
                
                var out = master.hmcalc(0, stat, 'TC', 'TCBOC')
                _.isEqual(out,[[15,0,-90],[15,1,10],[30,1,10]]).should.be.true

                var stat1 = JSON.parse(JSON.stringify(stat))
                stat1['15']["0"]["TC"][3] = 10
                stat1['15']["1"]["TCBOC"][3] = 10

                var out = master.hmcalc(3, stat1, 'TC', 'TCBOC')
                out.length.should.equal(0)

                var stat1 = JSON.parse(JSON.stringify(stat))
                stat1['15']["0"]["TC"][0] = undefined

                var out = master.hmcalc(0, stat1, 'TC', 'TCBOC')
                out.length.should.equal(2)

        })
*/
})
