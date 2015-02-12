var ppdb = require("./evalmeasure_5ed_embed.js")
var utils = require('./utils');
var async = require('async');
var bars = require('../../utils/bars.js');
var partitions = require('limdu/utils/partitions');
var PrecisionRecall = require("limdu/utils/PrecisionRecall");
var partitions = require('limdu/utils/partitions');
var rules = require("../rule-based/rules.js")
var truth = require("../rule-based/truth_utils.js")
var truth_filename =  __dirname+ "/../../../truth_teller/sentence_to_truthteller.txt"
var fs = require('fs');
var _ = require('underscore')._;


var limdu = require("limdu");
var ftrs = limdu.features;
var regexpNormalizer = ftrs.RegexpNormalizer(
    JSON.parse(fs.readFileSync(__dirname+'/../../knowledgeresources/BiuNormalizations.json')));

var RuleClass = function(opts) {
	// 0 - original
	// 1 - ppdb
	// this.mode = opts.mode
}

RuleClass.prototype = {

	trainBatch: function (dataset) {
		var seeds = utils.loadseeds(dataset, true)
		
		// if (this.mode == 0)
		{
			var seeds_original = utils.enrichseeds_original(seeds)
			var seeds_original_after = utils.afterppdb(seeds_original)
			this.seeds = seeds_original_after

		}
		
		// if (this.mode == 1)
		// {
			// var stats_ppdb = []
			// var seeds_ppdb_after = []
			// utils.enrichseeds(seeds, function(err, seeds_ppdb){
			// 	console.log("seeds")
			// 	seeds_ppdb_after = utils.afterppdb(seeds_ppdb)
			// 	this.seeds = see ds_ppdb_after
			// })
		// }

		console.log("trained")

	},

	classify: function(sample, explain, continuous_output, original, classifier_compare) {

			var sample_original = sample
		    sample = sample.toLowerCase().trim()
		    sample = regexpNormalizer(sample)
		    sample = rules.generatesentence({'input':sample, 'found': rules.findData(sample, false)})['generated']
		    
		    var out = utils.retrieveIntentsync(sample, this.seeds)
      
    	    var labs = _.unique(_.map(out, function(num, key){ return Object.keys(num)[0] }))      
    	 	console.log(labs)    	    
    	 	console.log(out) 
    	 	console.log()
    	 	process.exit(0)
        // var out = stats.addCasesHash(_.unique(utils.onlyIntents(turn['output'])), _.unique(labs))
        // turn['eval'] = out
      // }
			
	}
}

module.exports = RuleClass;