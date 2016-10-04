var async = require('async');
var should = require('should');
var classifiers = require('../classifiers');
var _ = require('underscore');
var natural = require('natural');

describe('getRule', function() {

  it('getRule', function() {  

    // var data = {'tokens':[{'word':'no','lemma':'no','pos':'A'},{'lemma':'agreement','word':'agreement','pos':'A'},{'lemma':'pension','word':'pension','pos':'A'}]} 
    // var data = "no agreement pension" 
	// var results = classifiers.getRule(data)

    // var data = {'tokens':[{'word':'60,000','lemma':'60,000','pos':'A'},{'lemma':'USD','word':'USD','pos':'A'},
                          // {'lemma':'salary','word':'salary','pos':'A'}]}
    // var results = classifiers.getRule(data)

    // var data = {'tokens':[{'word':'10','lemma':'10','pos':'A'},{'lemma':'%','word':'%','pos':'A'},
                          // {'lemma':'is','word':'is','pos':'A'},{'word':'accepted','lemma':'accepted','pos':'A'}]}
   

   
    var results = classifiers.getRule({"tokens":[]}, "10% is accepted")
    results['cleaned']['tokens'].length.should.equal(2)



    /*var data = {'tokens':[{'word':'with','lemma':'with','pos':'A'},{'lemma':'no','word':'no','pos':'A'},
                          {'lemma':'agreement','word':'agreement','pos':'A'},{'word':'the','lemma':'the','pos':'A'},
                          {'word':'car','lemma':'car','pos':'A'}]}
    */var data = {}
    var results = classifiers.getRule(data, "with no agreement the car")    
    results["cleaned"]["tokens"].length.should.equal(1)
    _.isEqual(results.labels,  [['Leased Car'],['No agreement']]).should.equal(true)


/*
    var data = {'tokens':[{'word':'no','lemma':'no','pos':'A'},{'lemma':'agreement','word':'agreement','pos':'A'},
                          {'lemma':'on','word':'on','pos':'A'},{'word':'the','lemma':'the','pos':'A'},
                          {'word':'car','lemma':'car','pos':'A'},{'word':'then','lemma':'then','pos':'A'}],
                'basic-dependencies':[{'dep':'neg','governorGloss':'agreement'}]}  
    */var data = {}
    var results = classifiers.getRule(data, "no agreement on the car then")
    results["cleaned"]["tokens"].length.should.equal(3)
    _.isEqual(results.labels,  [['Leased Car'],['No agreement']]).should.equal(true)



   /* var data = {'tokens':[{'word':'120,000','lemma':'120,000','pos':'A'},{'lemma':'USD','word':'USD','pos':'A'},{'lemma':'no','word':'no','pos':'A'},
                          {'word':'car','lemma':'car','pos':'A'}],
                'basic-dependencies':[{'dep':'neg','governorGloss':'car'}]}
   */ var data = {}
    var results = classifiers.getRule(data, "120,000 USD no car")
    results["cleaned"]["tokens"].length.should.equal(0)
	_.isEqual(results.labels,  [['Salary','Leased Car'],['120,000 USD','Without leased car']]).should.equal(true)



/*    var data = {'tokens':[{'word':'I','lemma':'I','pos':'A'},{'lemma':'have','word':'have','pos':'A'},{'lemma':'a','word':'a','pos':'A'},
                          {'word':'salary','lemma':'salary','pos':'A'},{'lemma':'of','word':'of','pos':'A'},{'lemma':'60,000','word':'60,000','pos':'A'}]
                }
*/    var data = {}
    var results = classifiers.getRule(data, "I have a salary if 60,000")
  _.isEqual(results.labels,  [['Salary'],['60,000 USD']]).should.equal(true)



    // var data = {'tokens':[{'lemma':'I','pos':'A'},{'lemma':'have','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'salary','pos':'A'},{'lemma':'of','pos':'A'},{'lemma':'60,000','pos':'A'}]}
    var data = {}
    var results = classifiers.getRule(data, "I have a salary of 60,000")
    results["cleaned"]["tokens"].length.should.equal(4)      
    _.isEqual(results.cleaned,{"tokens": [{"word": "i",'lemma':'i'},{"word": "have",'lemma':'have'},{"word": "a",'lemma':'a'},{"word": "of",'lemma':'of'}]}).should.equal(true)

    

	// var data = {'tokens':[{'lemma':'I','pos':'A'},{'lemma':'have','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'salary','pos':'A'},{'lemma':'of','pos':'A'},{'lemma':'60k','pos':'A'}]}
	var data = {}
    var results = classifiers.getRule(data, "I have a salary of 60K")
    results["cleaned"]["tokens"].length.should.equal(4)
    _.isEqual(results.labels,[["Salary"],["60,000 USD"]]).should.equal(true)



    // var data = {'tokens':[{'lemma':'I','pos':'A'},{'lemma':'have','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'salary','pos':'A'},{'lemma':'of','pos':'A'},{'lemma':'60,000','pos':'A'}]}
	var data = {}
	var results = classifiers.getRule(data, "I have a salary of 60,000")
    results["cleaned"]["tokens"].length.should.equal(4)      
    _.isEqual(results.labels,[["Salary"],["60,000 USD"]]).should.equal(true)



    // var data = {'tokens':[{'lemma':'there','pos':'A'},{'lemma':'will','pos':'A'},{'lemma':'be','pos':'A'},{'lemma':'no','pos':'A'},{'lemma':'agreement','pos':'A'},{'lemma':'for','pos':'A'},{'lemma':'car','pos':'A'}]}
	var data = {}
    var results = classifiers.getRule(data, "there will be no agreement for car")
    results["cleaned"]["tokens"].length.should.equal(4)      
    _.isEqual(results.labels,[["Leased Car"],["No agreement"]]).should.equal(true)
    


    // var data = {'tokens':[{'lemma':'with','pos':'A'},{'lemma':'leased','pos':'A'},{'lemma':'car','pos':'A'},{'lemma':'pension','pos':'A'},{'lemma':'fund','pos':'A'},{'lemma':'10','pos':'A'},{'lemma':'%','pos':'A'}]}
	var data = {}
	var results = classifiers.getRule(data, "with leased car pension fund 10%")
    results["cleaned"]["tokens"].length.should.equal(0)      
    _.isEqual(results.labels,[["Pension Fund","Leased Car"],["10%","With leased car"]]).should.equal(true)
	


    // var data = {'tokens':[{'lemma':'let','pos':'A'},{'lemma':'us','pos':'A'},{'lemma':'compromise','pos':'A'},{'lemma':'without','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'leased','pos':'A'},{'lemma':'car','pos':'A'}]}
	var data = {}
	var results = classifiers.getRule(data, "let us compromise without a leased car")
    results["cleaned"]["tokens"].length.should.equal(4)      
    _.isEqual(results.labels,[["Leased Car"],["Without leased car"]]).should.equal(true)



    // var data = {'tokens':[{'lemma':'with','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'pension','pos':'A'},{'lemma':'fund','pos':'A'},{'lemma':'10%','pos':'A'}]}
	var data = {}
	var results = classifiers.getRule(data, "with a pension fund 10%")
    results["cleaned"]["tokens"].length.should.equal(1)      
    _.isEqual(results.labels,[["Pension Fund"],["10%"]]).should.equal(true)



    // var data = {'tokens':[{'lemma':'you','pos':'A'},{'lemma':'offer','pos':'A'},{'lemma':'me','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'leased','pos':'A'},{'lemma':'car','pos':'A'}]}
	var data = {}
	var results = classifiers.getRule(data, "you offer me a leased car")
    results["cleaned"]["tokens"].length.should.equal(4)      
    _.isEqual(results.labels,[["Leased Car"],["With leased car"]]).should.equal(true)



    // var data = {'tokens':[{'lemma':'I','pos':'A'},{'lemma':'need','pos':'A'},{'lemma':'you','pos':'A'},{'lemma':'to','pos':'A'},{'lemma':'work','pos':'A'},{'lemma':'10','pos':'A'},{'lemma':'hours','pos':'A'},{'lemma':'because','pos':'A'},{'lemma':'there','pos':'A'},{'lemma':'job','pos':'A'}]}
	var data = {}
    var results = classifiers.getRule(data, "I need you to work 10 hours because there job")
    results["cleaned"]["tokens"].length.should.equal(7)
    _.isEqual(results.labels,[["Working Hours","Job Description"],["10 hours"]]).should.equal(true)



    // var data = {'tokens':[{'lemma':'I','pos':'A'},{'lemma':'offering','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'job','pos':'A'},{'lemma':':','pos':'A'},{'lemma':'programmer','pos':'A'}, {'lemma':'10','pos':'A'},{'lemma':'hours','pos':'A'},{'lemma':'a','pos':'A'},{'lemma':'day','pos':'A'},{'lemma':',','pos':'A'}, {'lemma':'60000','pos':'A'},{'lemma':'no','pos':'A'},{'lemma':'car','pos':'A'},{'lemma':'fast','pos':'A'},{'lemma':'promotion','pos':'A'},{'lemma':'track','pos':'A'}]}
	var data = {}
    var results = classifiers.getRule(data, "I offering a job : programmer 10 hours a day, 60000 no car fast promotion track")
    results["cleaned"]["tokens"].length.should.equal(5)
    _.isEqual(results.labels,[["Salary","Promotion Possibilities","Working Hours","Job Description","Leased Car"],["60,000 USD","Fast promotion track","10 hours","Programmer","Without leased car"]]).should.equal(true)

  })
})