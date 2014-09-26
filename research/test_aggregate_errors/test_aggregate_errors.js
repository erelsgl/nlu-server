//input: file in the format as in the example 
//output: html format
if (test_aggregate_errors)
{

	// var filenamejson = "errors_composite1.json"
	// var filenamejson = "errors_component1.json"
	var filenamejson = "new_component_all.json"

	// var filenamehtml = "errors_composite1.html"
	var filenamehtml = "new_component_all.html"
	var data = JSON.parse(fs.readFileSync(filenamejson))
	// composite-wise
	// var error_hash = {
	// 	'1': "negation:with and without car",
	// 	'2': "Offer:Attribute:Negative Value vs Reject:Attribute",
	// 	//'3': "Reject FP negation",
	// 	'4': "Query:compomise FN",
	// 	'5': "Reject:previous vs Reject:specific",
	// 	'6': "Accept FP: grip accept word",
	// 	'7': "with Leased car correlated with 'with'",
	// 	'8': "Reject FP: grip negative meaning word",
	// 	'9': "Reject vs Accept: confusing",
	// 	'10': "unknown words/misspelling/complex",
	// 	'11': "Offer: grip offer word",
	// 	'12': "Insist FN",
	// 	'13': "Query:accept vs Query:specific",
	// 	'14': "Insist FP",
	// 	'15': "no agreement FN",
	// 	'16': "Insist specific: Insist previous",
	// 	'17': "Apeend FP",
	// 	'18': "Append FN",
	// 	'19': "Offer wrong attribute same value"
	// }


// component-wise
var error_hash = {
"1": "Reject FP: reject keyphases",
"2": "lexical difficulty",
"3": "Query FN",
"4": "Offer FN",
"5": "FN: the class was suppressed by negative features",
"6": "Reject FN",
"7": "Offer value",
"8": "Insist FN",
"9": "Accept FN",
"10": "rare class",
"11": "FP was grasp not salient phrase",
"12": "Offer vs Reject",
"13": "Append FN",
"14": 'out of domain sentence with salient phrase',
"15": "Hello FN",
"16": "FN was suppressed by other salient phraase",
"17": "misspelings",
"18": "previous",
"19": "value",
"20": "with without leased car",
"21": "true",
"22": "issues"
}
// component-wise
// var error_hash = {
// "1": "with/without confusion",
// "2": "no/leased positive negative",
// "3": "accept FP",
// "4": "accept/reject/query value vs Offer",
// "5": "misspeling/complex phrase",
// "6": "not popular class",
// "7": "insint offer intersection?",
// "8": "Append FP",
// "9": "word as value",
// "10": "leased car negation",
// "11": "leased car value connection",
// "12": "tagging ambiguity",
// "13": "strange intesection",
// "14": "language correction error",
// "15": "pension 10 and work hours 10",
// "18": "offer reject nothing something",
// "16": "not enough relevance",
// "17": "big relevance",
// "18": "no previous/wrong coverage",
// "19": "Query compomise FN"}

// "1": "Insist FP",
// "2": "Query FP: grip query word (ok, only, compomise)",
// "4": "Query FN",
// "3": "Append FN",
// "5": "Insist vs Offer",
// "6": "Query vs Reject",
// "7": "Accept FP: grip accept related word",
// "8": "Reject FP: grip reject related word",
// "9": "Offer FP: grip  the value string",
// "10": "Accept vs Reject in the same sentence",
// "11": "Offer:nothing vs Reject:something",
// "12": "Append FP",
// "13": "unknown word/misspelled/complicated phrase",
// "15": "Accept Query",
// "16": "Offer Accept",
// "17": "Taggging questionable",
// "18": "Quit FP",
// "19": "Leased car and with connecion",
// "20": "Salary FP",
// "21": "Job description FP correlated 'job'",
// "22": "Append FP",
// "23": "Append FN",
// "24": "Offer FP: grip the value string",
// "25": "Pension fund FN",
// "26": "Salary FN",
// "27": "previous FP",
// "28": "Value confusion with vs without",
// "29": "Value where there is no value just string",
// "30": "confusiong between similar values"


	var label_count = []
	_(Object.keys(error_hash).length+2).times(function(n){label_count.push(0)})

	_(3).times(function(n){
		_.each(data[n], function(value, key, list){ 
			if (!(_.isEqual(value['errorclass'], [''])))
				{
				_.each(value['errorclass'], function(err, key, list){
					label_count[parseInt(err)] = label_count[parseInt(err)] + 1
				}, this)
				}
		}, this)
	})

	var overallsum = _.reduce(_.compact(label_count), function(memo, num){ return memo + num; }, 0);

	fs.writeFileSync(filenamehtml, "<html><body>", 'utf-8')
	// fs.writeFileSync(filenamehtml, "<a href=\"#chapter4\">blabla</a>", 'utf-8')

	// fs.appendFileSync(filenamehtml, "<table style=\"white-space: pre-wrap;\"><tr><td>"+JSON.stringify(data[0][0]['stat'], null, 4)+"</td></tr></table>", 'utf-8')
	fs.appendFileSync(filenamehtml, "<table border=\"1\" style=\"white-space: pre-wrap;\">", 'utf-8')

	_.each(label_count, function(value, key, list){
		if (label_count[key]>0) 
			fs.appendFileSync(filenamehtml, "<tr><td><a href=\"#"+key+"\">"+error_hash[key]+"</a></td><td>"+label_count[key]+"</td><td>"+(label_count[key]/overallsum).toFixed(2)+"</td></tr>", 'utf-8')
	}, this)	
	fs.appendFileSync(filenamehtml, "</table>", 'utf-8')

	_.each(error_hash, function(value, key, list){ 
		if (label_count[parseInt(key)]>0)
		{
		fs.appendFileSync(filenamehtml, "<a name=\""+key+"\"><i>"+value+"</i></a>", 'utf-8')
		fs.appendFileSync(filenamehtml, "<table style=\"white-space: pre-wrap;\">", 'utf-8')
			_(3).times(function(n){
				_.each(data[n], function(item, key1, list){
				// _.each(list, function(value, key, list){ 
				// }, this)
					if (item['errorclass'].indexOf(key)!=-1)
						{
						fs.appendFileSync(filenamehtml, "<tr><td><b>"+item['input']+"</b></td></tr>", 'utf-8')
						fs.appendFileSync(filenamehtml, "<tr><td>"+JSON.stringify(item['stat'], null, 4)+"</td></tr>", 'utf-8')
						fs.appendFileSync(filenamehtml, "<tr><td>"+JSON.stringify(item['details'], null, 4)+"</td></tr>", 'utf-8')
						}
				}, this)
			})
		fs.appendFileSync(filenamehtml, "</table>", 'utf-8')
		}
	}, this)

	// fs.appendFileSync(filenamehtml, "<table style=\"white-space: pre-wrap;\">", 'utf-8')
	// fs.appendFileSync(filenamehtml, "<a name=\"chapter4\"></a>", 'utf-8')
	fs.appendFileSync(filenamehtml, "</body></html>", 'utf-8')
}

