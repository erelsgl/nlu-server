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
            "TC":      { "0": 500, 
			             "1": 401 },
            "TCBOC":   { "0": 410, 
			             "1": 611 }
                },
        "30": {
		      "TCBOC": { "1": 31, 
                         "0": 30 },
                "TC": { "0": 21, 
			            "1": 20 }
        }
    }

var statempty = {
        "15": {
            "TC":      { "1": 401 },
            "TCBOC":   { "0": 410, 
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

        it('getstringlc', function() {  

            console.log(JSON.stringify("re", null, 4))
            var str = master.getstringlc([[null, null , 5]])
            console.log(JSON.stringify(str, null, 4))
        })

        it('emptyplot', function() {
        
            var output = master.plotlcagr('average'/*fold*/, statempty)
            _.isEqual(output[1], ["15", 401, 510.5]).should.equal(true)

            var output = master.plotlcagr(0/*fold*/, statempty)
            _.isUndefined(output[1][1]).should.equal(true)

        })

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
	               	"dial": {   "0": 5,
				                "1": 7,
				                "2": 9,
				                "3": 11
							},
		              "TC": { 
                                "0": 1, 
				                "1": 2, 
				                "2": 3, 
				                "3": 4 
                            }
                        }

                _.isEqual(master.plotlcagrlen(2, stat), { dial: 9, TC: 3 }).should.equal(true)
                _.isEqual(master.plotlcagrlen('average', stat), { dial: 8, TC: 2.5 }).should.equal(true)

                })

        it('plotlcagrlenaverge', function() {
            var stat = { "1": 3, "3": 6, "8": 3 }
            master.plotlcagrlenaverge(stat).should.be.equal(4)

            var stat = { "1": 3, "3": null, "8": 3 }
            master.plotlcagrlenaverge(stat).should.be.equal(2)

            var stat = { "1": null, "3": null, "8": null }
            _.isNaN(master.plotlcagrlenaverge(stat)).should.equal(true)
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
