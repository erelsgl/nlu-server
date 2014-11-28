var _ = require('underscore')._;
var fs = require('fs');

String.prototype.lpad = function(padString, length) {
    var str = this;
    while (str.length < length)
        str = padString + str;
    return str;
}

function verbnegation(sentence, commonfilename)
{
	var sentences = fs.readFileSync(commonfilename).toString().split('\n')

	if (sentences.indexOf(sentence) == -1)
		{
 		throw new Error(sentence + ' not found in truthteller')
		// process.exit(0)
		}
	var index = sentences.indexOf(sentence)+1
	var max = sentences.length.toString().length

	var filename = "sentence_"+ index.toString().lpad("0",max)+".cnt"

	var data = []
	fs.readFileSync(__dirname + "/../../../truth_teller/annotatedSentences/"+filename).toString().split('\n').forEach(function (line) { 
		var list = line.split("\t")
		if (list.length > 2)
			data.push({
				'FORM': list[1],
				'LEMMA': list[2],
				'CPOSTAG': list[3],
				'POSTAG': list[4],
				'FEATS': list[5],
				'HEAD': list[6],
				'DEPREL': list[7],
				'PHEAD': list[8],
				'PDEPREL': list[9],
				'SIGNATURE': list[10],
				'NU': list[11],
				'CT': list[12],
				'PT': list[13],
			})
		})
	
	// filtering, getting only verbs
	var verb = []
	var POS = ['VB', 'VBP', 'VBN', 'VBD']
	_.each(data, function(value, key, list){
		if (POS.indexOf(value['POSTAG']) != -1) 
			verb.push({'form': value['FORM'], 'polarity': value['PT']})
	}, this)

	// _.each(verb, function(value, key, list){ 
		// var negated = negation(sentence, value['FORM'], commonfilename)
		// console.log(value)
		// console.log(negated)
	// }, this)
	return verb
}
/*
sentence: no leased car
seeds : [car]

*/
function negation(sentence, seeds, filename)
{
	var sentences = fs.readFileSync(filename).toString().split('\n')
	if (sentences.indexOf(sentence) == -1)
		{
		console.log("not found")
 		throw new Error(sentence + ' not found in truthteller')
		// process.exit(0)
		}
	var index = sentences.indexOf(sentence)+1
	var max = sentences.length.toString().length

	var filename = "sentence_"+ index.toString().lpad("0",max)+".cnt"

	var data = []
	fs.readFileSync(__dirname + "/../../../truth_teller/annotatedSentences/"+filename).toString().split('\n').forEach(function (line) { 
		var list = line.split("\t")

		if ((sentence.indexOf(list[1]) == -1) && ((typeof list[1] != 'undefined')))
			{
			console.log("incorrect sentence")
 			throw new Error(sentence + filename + ' incorrect index in truthteller '+list[1])
			}

		if (list.length > 2)
			data.push({
				'FORM': list[1],
				'LEMMA': list[2],
				'CPOSTAG': list[3],
				'POSTAG': list[4],
				'FEATS': list[5],
				'HEAD': list[6],
				'DEPREL': list[7],
				'PHEAD': list[8],
				'PDEPREL': list[9],
				'SIGNATURE': list[10],
				'NU': list[11],
				'CT': list[12],
				'PT': list[13],
			})
		});

	var negated = false

	_.each(seeds, function(seed, key, list){ 
		var point = 0
		point = _.find(data, function(num){ return num['LEMMA'] == seed });

		if (typeof point !== 'undefined')
		{
			if (point['NU'] == "N") negated = true
			while ((point['DEPREL'] != "ROOT") && (negated == false))
			{
				if ((point['PT'] == 'N') || (point['NU'] == 'N')) negated = true
				if (point['HEAD'] != "-")
					point = data[point['HEAD']-1]
				else
					break
			}
			if ((point['PT'] == 'N') || (point['NU'] == 'N')) negated = true
		}
	}, this)

	// console.log(seeds)
	// console.log(sentence)
	// console.log(negated)
	return negated
}


module.exports = {
	negation:negation,
	verbnegation:verbnegation
	}