/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

var should = require('should');
var async_adapter = require('../utils/async_adapter');
var _ = require('underscore');

describe('async adapters', function() {

	it('wordnet synonyms', function(callback) {
        async_adapter.getwordnet("offer", "VB", "synonym", function(err, results){
            results.length.should.equal(12)
            callback()
        })  
	})

    it('wordnet hypernym', function(callback) {
        async_adapter.getwordnet("offer", "VB", "hypernym", function(err, results){
            results.length.should.equal(19)
            callback()
        })  
    })

})
