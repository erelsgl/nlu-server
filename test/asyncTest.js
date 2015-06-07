/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

var should = require('should');
var async_adapter = require('../utils/async_adapter');
var _ = require('underscore');

describe('async adapters', function() {
    this.timeout(15000);

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

    it('wordnet cache', function(callback) {
        console.time("first")
        async_adapter.getwordnetCache("offer", "VB", "hypernym", function(err, results){
            console.timeEnd("first")
            console.time("second")
            async_adapter.getwordnetCache("run", "VB", "hypernym", function(err, results){
                console.timeEnd("second")
                console.time("cache")
                async_adapter.getwordnetCache("offer", "VB", "hypernym", function(err, results){
                    console.timeEnd("cache")
                    callback()
                })
            })
        })
    })

})
