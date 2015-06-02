/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

var should = require('should');
var curves = require('../utils/master');
var wikipedia = require('../utils/wikipedia');
var _ = require('underscore');


describe('wikipedia', function() {

	it('regex', function() {

        var sen = "sasd asdas kjasdh I will survive"
        var output = wikipedia.normalizer(sen)
        output.should.equal("I will survive")

        var sen = "sasd asdas [link] I will survive"
        var output = wikipedia.normalizer(sen)
        output.should.equal("I will survive")
	
        var sen = "sasd asdas  I will citation survive"
        var output = wikipedia.normalizer(sen)
        output.should.equal("I will  survive")
        	
	})

	
})
