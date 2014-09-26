 if (do_spell_correction_test)
 	{
 	var a = ["iam speak english . france and am a good team manager ",
 		"but i can work as aprogrammer if you pay to me 9000",
 		"nd give me 9000",
 		"i will give you 9000 but with pensino fund 10%",
 		"yes i can start from tomorrwo if you want",
 		"yes i honour to be one of your company ",
 		"yeah surethere are know anavaliable job ",
 		"as asalary",
 		"dou you want alealesed car",
 		"but we will incrase the working hour to 10 hours you agree?",
 		"Thank you very mush",
 		"no thanxx that is good ",
 		"good afteroon mr osama",
 		"what your opinin about the salary",
 		"and i accept you as a project maager so now you are the one who will make the last choice",
 		"no its good with every thing we agreed abought it",
 		"i am a gddo qualfied and u need me ",
 		"ok no proplem iam agree",
 		" what about the job descreption",
 		"yes iam good in the pc anad iam good read and write english",
 		"its the reason that i left my company the low salay ",
 		" i'm here to gitting a jop  can u tell me about the work here in this company "
 	]

 	var dataset = [
 			 //    "0_grammar.json",
 				// "1_woz_kbagent_students.json",
 				// "1_woz_kbagent_students1class.json",
 				// "2_experts.json",
 				// "2_experts1class.json",
 				// "4_various.json",
 				// "4_various1class.json",
 				// "6_expert.json",
 				// "3_woz_kbagent_turkers_negonlp2.json",
 				"5_woz_ncagent_turkers_negonlp2ncAMT.json",
 				// "nlu_kbagent_turkers_negonlpAMT.json",
 				"nlu_ncagent_students_negonlpnc.json",
 				"nlu_ncagent_turkers_negonlpncAMT.json",
 				// "woz_kbagent_students_negonlp.json"
 			]
 	var data = []
 	_.each(dataset, function(value, key, list){ 
 		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
 	})

 	data = _.shuffle(data)

 	var composite = new classifier.SvmPerfClassifier
 	composite.trainBatch(data)

 	_.each(a, function(sen, key, list){ 
 		console.log("Initial sentence : "+ sen.trim())
 		clean = ""
 		_.each(sen.split(" "), function(value, key, list){ 
 			if (!(composite.spellChecker.exists(value)))
 			{	
 				var suggestions = composite.spellChecker.suggest(value); // If feature exists, returns empty. Otherwise, returns ordered list of suggested corrections from the training set.
 				if (suggestions.length!=0) 
 					// {
 					// console.log("'"+value+"'")
 					// console.log(suggestions)
 					clean = clean + " " + suggestions[0]	
 					// }
 				else
 					clean = clean + " " + value
 			}
 			else
 				clean = clean + " " + value
 		}, this)
 		console.log("Corrected sentence: "+clean.trim())
 	}, this)

 	console.log()
 	process.exit(0)

 	}

 if (test_spell)
 {
 	dataset = [	"turkers.json" ]
 	data = []

 	_.each(dataset, function(value, key, list){ 
 		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/Platinum/"+value)))
 	})

 	data1 = []

 	_.each(data, function(value, key, list){ 
 		data1 = data1.concat(value['turns'])
 	}, this)

 	data1 = _.shuffle(data1)

 	dataset = partitions.partition(data1, 1, Math.round(data1.length*0.3))

 	// var composite = new classifier.SvmPerfClassifier
 	// composite.trainBatch(data1)


 			a = [{
                 // "input": "A Programmer does not have a leased car, I'm afraid",
                 // "input": "i would only offer 10",
                 "input": "I offer a 10 NIS pemsion",
                 "is_correct": false,
                 "timestamp": "2014-04-04T16:03:52.763Z",
                 "turn": "61",
                 "output": [
                     "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
                     "{\"Offer\":{\"Leased Car\":\"With leased car\"}}"
                 ]
             }]

 	stats = trainAndTest.trainAndTest_hash(classifier.SvmPerfClassifierSpell, dataset['train'], a, 5)
 	// stats = trainAndTest.trainAndTest_hash(classifier.SvmPerfClassifier, dataset['train'], dataset['test'], 5)

 	// var value = "least"
 	// var ex = composite.spellChecker[1].exists(value)
 	// var suggestions = composite.spellChecker[0].suggest(value); // If feature exists, returns empty. Otherwise, returns ordered list of suggested corrections from the training set.
 	// console.log(ex)
 	// console.log(suggestions)

 	console.log()
 	process.exit(0)

 } 

// comparison, which dataset has more quality students_israel or turkers_usa
if (do_comparison)
	{
	stud = [
			"nlu_ncagent_students_negonlpnc.json",
			]
	turk = [
		    "5_woz_ncagent_turkers_negonlp2ncAMT.json",
		    "nlu_ncagent_turkers_negonlpncAMT.json"
			]

	turkdata = []
	_.each(turk, function(value, key, list){ 
		turkdata = turkdata.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})

	studdata = []
	_.each(stud, function(value, key, list){ 
		studdata = studdata.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})
	// console.log(studdata.length)
	// console.log(turkdata.length)
	// process.exit(0)

	studdata = _.shuffle(studdata)
	turkdata = _.shuffle(turkdata)

	turkstats = [[],[],[]]
	studstats = [[],[],[]]

	partitions.partitions(turkdata, 5, function(trainSet1, testSet1, index) {

		data = _.sample(trainSet1, 300)

		test = trainutils.clonedataset(data)
		test1 = trainutils.clonedataset(data)

		studtest = _.sample(studdata, 100)
		turktest = _.sample(testSet1, 100)

		stats1 =	trainAndTest.trainAndTest_hash(createNewClassifier, test, studtest, 5)
		
		studstats[0].push(stats1[0]['stats'])
		studstats[1].push(stats1[1]['stats'])
		studstats[2].push(stats1[2]['stats'])

		stats =	trainAndTest.trainAndTest_hash(createNewClassifier, test1, turktest, 5)
				
		turkstats[0].push(stats[0]['stats'])
		turkstats[1].push(stats[1]['stats'])
		turkstats[2].push(stats[2]['stats'])

		})

		// trainutils.hash_to_htmltable(trainutils.aggregate_two_nested(matlist))
		// console.log()
		// process.exit(0)

		console.log("turkstats")
		console.log("intents")
		console.log(trainutils.aggregate_results(turkstats[0]))		
		console.log("attr")
		console.log(trainutils.aggregate_results(turkstats[1]))		
		console.log("values")
		console.log(trainutils.aggregate_results(turkstats[2]))		

		console.log("studstats")
		console.log("intents")
		console.log(trainutils.aggregate_results(studstats[0]))		
		console.log("attr")
		console.log(trainutils.aggregate_results(studstats[1]))		
		console.log("values")
		console.log(trainutils.aggregate_results(studstats[2]))		

		process.exit(0)
}


if (prepare_truthteller)
{

dataset = [
		// "5_woz_dialogue.json",
		// "students.json",
		// "turkers.json"
		"students_separated.json",
		"turkers_separated.json",
		"usa_separated.json"
		]
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	})

	// data = _.shuffle(data)

	var sentences = []
	_.each(data, function(value, key, list){ 
		_.each(value['turns'], function(turn, key1, list1){ 
			sentences.push(turn['input'])
			sentences = sentences.concat(trainutils.generate_string(classifier.tokenizer.tokenize(classifier.normalizer(turn['input'].toLowerCase().trim()))))
			_.each(turn['parts'], function(utter, key2, list2){
				sentences.push(utter['input']) 
			}, this)
		}, this)
	}, this)

	_.each(sentences, function(sen, key, list){
		// console.log(sen)
		console.log(classifier.normalizer(sen.toLowerCase().trim()))
	}, this)
}

if (test_keywords)
{
	
	var data = []
	var dataset = ["students.json","turkers.json"]
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	})

	var output = []
	var setoflab = {}


	_.each(data, function(item, key, list){ 
		_.each(item['turns'], function(turn, key, list){ 
			setoflab = {'sentence': turn['input'], 'labels':{}}
			_.each(turn['output'], function(label, key, list){
				_.each(Hierarchy.splitPartEqually(multilabelutils.normalizeOutputLabels(label)), function( elem, key, list){ 
					if (elem.length != 0)
						setoflab['labels'][elem]=[""]
				 }, this) 
			}, this)
			output.push(setoflab)
		}, this)
	}, this)

	console.log(JSON.stringify(output, null, 4))
	console.log()
	process.exit(0)

}


if (test_natural)
{
// var tokenizer = new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9%,'$]+/});

	// var tokenizer = new natural.WordTokenizer({'pattern':(/(\W+|\%|)/)}); // WordTokenizer, TreebankWordTokenizer, WordPunctTokenizer
	var words = tokenizer.tokenize("I will , offer 12,000 NIS");
	console.log(words)
	process.exit(0)


	// TfIdf = natural.TfIdf,
    // tfidf = new TfIdf();

	// var features = natural.NGrams.ngrams('this node document is about this node.', 2)

	// tfidf.addDocument(features)

	// tfidf.addDocument('this node document is about node.');
	// tfidf.addDocument('this document is about ruby.');
	// tfidf.addDocument('this document is about ruby and node.');

// document #0 is 0.4054651081081644 3/2*1
// document #1 is 3/2*0
// document #2 is 0.4054651081081644


	// tfidf.tfidfs('node')
	// console.log()
	// process.exit(0)

	// tfidf.tfidfs('node', function(i, measure) {
   	 	// console.log('document #' + i + ' is ' + measure);
	// });
	// var a = tfidf.idf("node")
	// sentence = "I have 15% from the deal"
	// var tokenizer = new natural.WordTokenizer(); // WordTokenizer, TreebankWordTokenizer, WordPunctTokenizer
	// var tokenizer = new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9%]+/});
	
	// var words = tokenizer.tokenize(sentence);
//
	// console.log(words)
	// process.exit(0)

	// var features = natural.NGrams.ngrams('hi, i will offer 12000  with a car and a pension', 1)
	// console.log(features)
	// process.exit(0)
	// var a = natural.NGrams.ngrams("aaa bbb ccc ddd", 2)
	// console.log(a)
	// process.exit(0)
	// sentence = "I offer you a salaries of 20000 NIS and 9 hours"
	// dist = natural.JaroWinklerDistance(a,"house")
	// console.log(dist)
	// process.exit(0)
	// a = trainutils.sentenceStem(sentence)
	// console.log(a)
	// var lemmerEng = new Lemmer('english');
	// a = lemmerEng.lemmatize('10%');
	// console.log(a)
	// natural.LancasterStemmer.attach();
	// var words = sentence.tokenizeAndStem()
	// console.log(sentence)
		
	// console.log(words)
	// process.exit(0)

	// lis = trainutils.retrievelabels()
	// console.log(lis)
	// process.exit(0)

	var EdgeWeightedDigraph = natural.EdgeWeightedDigraph;
	var digraph = new EdgeWeightedDigraph();

	// digraph.add(1,1,0);
	// digraph.add(1,2,0.35);
	digraph.add(1,3,1);
	// digraph.add(1,4,0);
	// digraph.add(1,5,0.93);
	digraph.add(3,6,0);

	// digraph.add(2,2,0);
	// digraph.add(2,3,0);
	// digraph.add(2,4,0);
	// digraph.add(2,5,0.32);
	// digraph.add(2,6,0);

	// digraph.add(3,3,0);
	// digraph.add(3,4,0);
	// digraph.add(3,5,0.40);
	// digraph.add(3,6,0);

	// digraph.add(4,4,0);
	// digraph.add(4,5,0);
	// digraph.add(4,6,0.52);

	// digraph.add(5,5,0);
	// digraph.add(5,6,0);

	// digraph.add(6,6,0);

	// digraph.add(1,2,1);
	// digraph.add(2,3,1);
	// digraph.add(1,3,3);

	var ShortestPathTree = natural.ShortestPathTree;
	var spt = new ShortestPathTree(digraph, 1);
	var path = spt.pathTo(6);

	console.log(JSON.stringify(path, null, 4))
	console.log()
	console.log()
	process.exit(0)

	var costs = [
    [0,0.35,0.29,0,0.93,0],
    [Infinity,0,0,0,0.32,0],
    [Infinity,Infinity,0,0,0.40,0],
    [Infinity,Infinity,Infinity,0,0,0.52],
    [Infinity,Infinity,Infinity,Infinity,0,0],
    [Infinity,Infinity,Infinity,Infinity,Infinity,0],
	];

	var cheapest_paths_from_0 = cheapest_paths(costs, 0);

	console.log(JSON.stringify(cheapest_paths_from_0, null, 4))
}


if (test_egypt)
{
	dataset = [
			// "5_woz_ncagent_turkers_negonlp2ncAMT.json",
			// "egp-nlu_ncagent_students_negonlpnc.json",
	  		// "egp-nlu_ncagent_turkers_negonlpncAMT.json",
	  		// "egp-2_experts1class.json",
	  		// "egp-4_various1class.json"
	  		// "nlu_ncagent_students_negonlpnc.json",
			// "nlu_ncagent_turkers_negonlpncAMT.json",

			"usd-nlu_ncagent_students_negonlpnc.json",
			"usd-nlu_ncagent_turkers_negonlpncAMT.json"
	]

	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer-usa/"+value)))
		// data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer-usa/"+value)))
	})

	// datatrain = _.shuffle(data)

	// datatest = JSON.parse(fs.readFileSync("datasets/Employer-egypt/egp-from-HvH.json"))

	dataset = partitions.partition(data, 1, Math.round(data.length*0.3))

	stats = trainAndTest.trainAndTest_hash(classifier.HomerWinnow, dataset['train'], dataset['test'], 5)
// 
	console.log(JSON.stringify(stats[0]['stats'], null, 4))
	
	stats1 = trainAndTest.trainAndTest_hash(classifier.HomerWinnowNoSpell, dataset['train'], dataset['test'], 5)

	console.log(JSON.stringify(stats1[0]['stats'], null, 4))

// stats = trainAndCompare(
		// classifier.HomerWinnow, 
		// classifier.HomerWinnowNoSpell,
		// datatrain, datatest, 5) 
	
	// console.log(JSON.stringify(stats, null, 4))

	process.exit(0)
}	


if (do_test_sagae)
	{

	trainset = trainutils.filteraccept(JSON.parse(fs.readFileSync("datasets/Employer/trainonelabel.json")))
	testset = trainutils.filteraccept(JSON.parse(fs.readFileSync("datasets/Employer/testalllabels.json")))

	// console.log(trainutils.dividedataset(test)['one'].length)
	// console.log(trainutils.dividedataset(test)['two'].length)
	// 292
	// 157

	// console.log(train.length)
	// console.log(test.length)
	// 293
	// 449

	// partitions.partitions(dataset, numOfFolds, function(train, test, fold) {

	// })

	// var stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, train, trainutils.dividedataset(test)['one'], 5)
	// var stats1 = trainAndTest.trainAndTest_hash(classifier.WinnowSegmenter, train, trainutils.dividedataset(test)['one'], 5)
	// var stats2 = trainAndTest.trainAndTest_hash(classifier.SvmPerfClassifier, train, trainutils.dividedataset(test)['one'], 5)

	trainset = _.sample(trainset, 90)

	// testset = trainutils.dividedataset(testset)['two']

	var attr = ['F1', 'Precision', 'Recall', 'Accuracy']
	var classifiers = [classifier.PartialClassificationEquallySagae, classifier.WinnowSegmenter,classifier.WinnowSegmenterStd, classifier.SvmPerfClassifier]
	var globalstart = [[],[],[],[]]
	
	partitions.partitions(trainset, 3, function(trainfold, testfold, fold) {

		var test = _.sample(testset, trainfold.length)
		

		var stt = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, trainfold, test, 5)
		console.log(JSON.stringify(stt[0]['labels'], null, 4))
		var sttt = trainAndTest.trainAndTest_hash(classifier.WinnowSegmenter, trainfold, test, 5)
		console.log(JSON.stringify(sttt[0]['labels'], null, 4))
		console.log()
		process.exit(0)

		_.each(classifiers, function(classi, key, list){ 
			globalstart[key].push(trainAndTest.trainAndTest_hash(classi, trainfold, test, 5)[0]['stats'])
		}, this)

		// console.log(stats[0]['stats'])
		// console.log(stats1[0]['stats'])
		// console.log(stats2[0]['stats'])

	})

	console.log(JSON.stringify(globalstart, null, 4))
	// process.exit(0)

	var gl = [{},{},{},{}]
	_.each(globalstart, function(value, key, list){ 
		_.each(attr, function(value1, key1, list){ 
			gl[key][value1] = _.reduce(_.pluck(value, value1), function(memo, num){ return memo + num; }, 0)/value.length
		}, this)
	}, this)


	console.log(JSON.stringify(gl, null, 4))
	process.exit(0)

	}


	if (do_coverage_version2)
	{
	// index is the amount of records taken so far
	var li = []
	var cur = {}
	coverage = JSON.parse(fs.readFileSync("keyphases.json"))


	_.each(coverage, function(value, key, list){ 
		_.each(value['labels'], function(key1, label, list){
			if (!(label in cur)) 
				cur[label] = {'phrases':[],'coord':[]}
			// cur[label]['total'] = cur[label]['total'] + 1
		})
	}, this)

	// console.log(JSON.stringify(cur, null, 4))
	// console.log()
	// process.exit(0)

	_.each(coverage, function(value, key, list){ 
		_.each(value['labels'], function(value1, key1, list1){
			_.each(value1, function(value2, key2, list2){
				if (value2 != "")
					cur[key1]['phrases'].push(value2) 
			 }, this) 
			cur[key1]['coord'].push([cur[key1]['phrases'].length, _.unique(cur[key1]['phrases']).length])
		}, this)
	}, this)

	_.each(cur, function(value, key, list){ 
		_.each(value['coord'], function(value1, key1, list1){
			fs.appendFileSync("./coveragev2/"+key, value1[0]+"\t"+value1[1]+"\n", 'utf-8')
		}, this)
		
		var command = "gnuplot -p -e \"reset; set yrange [0:50]; set term png truecolor size 1500,800; set title \'"+key+"\';set grid ytics; set grid xtics; set output \'coveragev2/"+key+".png\'; set boxwidth 0.5; set style fill solid; plot \'coveragev2/"+key+"\' with boxes\""
		result = execSync(command)

	}, this)

	// console.log(JSON.stringify(cur, null, 4))
	// _.each(cur, function(value, key, list){ 
		// var command = "gnuplot -p -e \"reset; set term png truecolor size 1500,800; set grid ytics; set grid xtics; set output \'coveragev2/"+value+".png\'; set boxwidth 0.5; set style fill solid; plot \'coveragev2/"+value+"\' using 1:2:xtic(2) with boxes\""
		// var result = execSync(command)
		// result = execSync.run(command)

	// }, this)

	console.log()
	process.exit(0)

	// console.log(JSON.stringify(cur, null, 4))
	// console.log()
	// process.exit(0)
	// _.each(coverage, function(value, key, list){ 
	// 	// var cur = {}
	// 	_.each(value['labels'], function(key1, label, list){
	// 		// var keyword = key1[0] 
	// 		// if (!(label in cur)) cur[label] = {'total':0,'current':0}
	// 		// var total = 0
	// 			_.each(coverage, function(value1, key2, list){
	// 				if (label in value1['labels'])
	// 					{
	// 					// cur[label]['total'] = cur[label]['total'] + 1
	// 					if (value1['labels'][label][0] == key1[0])
	// 						{	
	// 						cur[label]['current'] = cur[label]['current'] + 1
	// 						delete coverage[key2]['labels'][label]
	// 						}
	// 					}
	// 			}, this)
	// 		// cur[label] = cur[label] / total
	// 	}, this)
	// 	var cor = _.clone(cur)
	// 	_.each(cor, function(value, key, list){ 
	// 		cor[key] = value['current']/value['total']
	// 	}, this)
	// 	li.push(cor)
	// }, this)




	// var lablist = []
	// _.each(li, function(value, key, list){ 
		// _.each(value, function(value, key, list){ 
			// lablist.push(key)
		// }, this)
	// }, this)

	// lablist = _.uniq(lablist)
	// list of labels


	// _.each(lablist, function(label, key, list){
		// fs.writeFileSync("./coverage/"+label, "\t"+label+"\n", 'utf-8')
		// _.each(li, function(value, key, list){
			// var score = 0
			// if (label in value)
				// score = value[label]
			// fs.appendFileSync("./coveragev2/"+label, key+"\t"+score+"\n", 'utf-8')
		 // }, this) 
		// var command = "gnuplot -p -e \"reset; set term png truecolor size 1000,1000; set grid ytics; set grid xtics; set title \'"+label+"\';  set key top right; set output \'coveragev2/"+label+".png\'; set key autotitle columnhead; plot \'coveragev2/"+label+"\' with lines\""
		// console.log(command)
		// result = execSync(command)

	// }, this)

	// _.each(li, function(value, key, list){

		// command = "gnuplot -p -e \"reset; set term png truecolor  size 1000,1000; set grid ytics; set grid xtics; set title \'"+sample.replace(/\'/g,'')+"\';  set key top right; set output \'image/"+sample.replace(/\'/g,'')+".png\'; set key autotitle columnhead; set label \'"+(JSON.stringify(original)).replace(/[\",\\]/g,"")+"\' at screen 0.1, 0.9;"+labb+" plot for [i=3:"+(labellist.length+2)+"] \'"+senid+"\' using 1:i:xticlabels(2) smooth frequency with boxes\""
		// if (labellist.length > 0)
			// result = execSync.run(command)
		// } 
	// }, this)

	// console.log(li)
	// process.exit(0)
	}




if (do_coverage)
	{
	// index is the amount of records taken so far
	var li = []
	var cur = {}
	// coverage = JSON.parse(fs.readFileSync("keyphases.json"))
	coverage = JSON.parse(fs.readFileSync("keyphases.08.2014.json"))

	_.each(coverage, function(value, key, list){ 
		_.each(value['labels'], function(key1, label, list){
			if (!(label in cur)) 
				cur[label] = {'total':0,'current':0}
			cur[label]['total'] = cur[label]['total'] + 1
		})
	}, this)

	_.each(coverage, function(value, key, list){ 
		// var cur = {}
		_.each(value['labels'], function(key1, label, list){
			// var keyword = key1[0] 
			// if (!(label in cur)) cur[label] = {'total':0,'current':0}
			// var total = 0
				_.each(coverage, function(value1, key2, list){
					if (label in value1['labels'])
						{
						// cur[label]['total'] = cur[label]['total'] + 1
						if (value1['labels'][label][0] == key1[0])
							{	
							cur[label]['current'] = cur[label]['current'] + 1
							delete coverage[key2]['labels'][label]
							}
						}
				}, this)
			// cur[label] = cur[label] / total
		}, this)
		var cor = _.clone(cur)
		_.each(cor, function(value, key, list){ 
			cor[key] = value['current']/value['total']
		}, this)
		li.push(cor)
	}, this)


	var lablist = []
	_.each(li, function(value, key, list){ 
		_.each(value, function(value, key, list){ 
			lablist.push(key)
		}, this)
	}, this)

	lablist = _.uniq(lablist)

	_.each(lablist, function(label, key, list){
		// fs.writeFileSync("./coverage/"+label, "\t"+label+"\n", 'utf-8')
		_.each(li, function(value, key, list){
			var score = 0
			if (label in value)
				score = value[label]
			fs.appendFileSync("./coverage/"+label, key+"\t"+score+"\n", 'utf-8')
		 }, this) 
		var command = "gnuplot -p -e \"reset; set term png truecolor  size 1000,1000; set grid ytics; set grid xtics; set title \'"+label+"\';  set key top right; set output \'coverage/"+label+".png\'; set key autotitle columnhead; plot \'coverage/"+label+"\' with lines\""
		console.log(command)
		result = execSync(command)

	}, this)

	// _.each(li, function(value, key, list){

		// command = "gnuplot -p -e \"reset; set term png truecolor  size 1000,1000; set grid ytics; set grid xtics; set title \'"+sample.replace(/\'/g,'')+"\';  set key top right; set output \'image/"+sample.replace(/\'/g,'')+".png\'; set key autotitle columnhead; set label \'"+(JSON.stringify(original)).replace(/[\",\\]/g,"")+"\' at screen 0.1, 0.9;"+labb+" plot for [i=3:"+(labellist.length+2)+"] \'"+senid+"\' using 1:i:xticlabels(2) smooth frequency with boxes\""
		// if (labellist.length > 0)
			// result = execSync.run(command)
		// } 
	// }, this)

	// console.log(li)
	process.exit(0)
	}



if (intent_stat)
	{
		dataset = [
		// "5_woz_dialogue.json",
		// "students.json",
		// "turkers.json"
		"students_separated.json",
		"turkers_separated.json",
		// "usa_separated.json"
		]
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	})

	data = _.shuffle(data)
	data = _.shuffle(data)
	data = _.shuffle(data)

	classifiers  = {
		SVMNoIS: classifier.PartialClassificationEqually_Component,
		}

	parameters = ['F1']
	curves.learning_curves(classifiers, data, parameters, 3, 3, 3)

	}



if (do_partial_classification)
	{
	// a= ['{"Insist":"Working Hours"}','{"Offer":{"Job Description":"Programmer"}}','{"Offer":{"Working Hours":"10 hours"}}']
	// a = [{"input":"Okay. pension fund 10%, salary I 20,000 NIS agree.","output":["{\"Accept\":\"previous\"}","{\"Insist\":\"Leased Car\"}","{\"Offer\":{\"Leased Car\":\"Without leased car\"}}","{\"Offer\":{\"Pension Fund\":\"20%\"}}"],"is_correct":false,"timestamp":"2013-10-08T08:35:57.698Z"}]
	// a = [{"input":"Okay. I 20k agree. I accept lease you the car with a 20% pension.","output":["{\"Accept\":\"previous\"}","{\"Insist\":\"Leased Car\"}","{\"Offer\":{\"Leased Car\":\"Without leased car\"}}","{\"Offer\":{\"Pension Fund\":\"20%\"}}"],"is_correct":false,"timestamp":"2013-10-08T08:35:57.698Z"}]
	// a = [{"input":"Buy it with your own money.","output":[{"Reject":"Leased Car"}],"is_correct":false,"timestamp":"2013-10-07T13:30:54.177Z"}]
	// a = [{"input":"its a little bit high dont you think?","output":["{\"Reject\":\"Salary\"}"],"is_correct":true,"timestamp":"2013-09-09T16:55:42.510Z"}]
	// dataset = [
	// 		    // "5_woz_ncagent_turkers_negonlp2ncAMT.json",
	// 		    "nlu_ncagent_students_negonlpnc.json",
	// 		    "nlu_ncagent_turkers_negonlpncAMT.json"
	// 		]
	// data = []
	// _.each(dataset, function(value, key, list){ 
	// 	data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	// })

	// data = _.shuffle(data)

	dataset = [
		// "5_woz_dialogue.json",
		"students.json",
		"turkers.json"
		]
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	})

	data = _.shuffle(data)

	data1 = []

	_.each(data, function(value, key, list){ 
		data1 = data1.concat(value['turns'])
	}, this)

	// data1 = _.sample(data1,20)

	// data1=[{'input':'hi'}]

	// a= [ '{"Offer":{"Working Hours":"8 hours"}}',
     // '{"Offer":{"Salary":"7,000 NIS"}}' ]

     // a = a.reverse()
    // b= _.sortBy(a, function(num){ num });
    // a.sort()
	// console.log(a)
	// process.exit(0)
	// labhash = {}

	// _.each(data, function(value, key, list){ 
		// _.each(value.output, function(lab, key, list){ 
			// if (!(lab in labhash))
			// labhash[lab] = 1
		// }, this)
	// }, this)

	// console.log(Object.keys(labhash))
	// process.exit(0)
	// sa = trainutils.intent_attr_dataset_ambiguity(data)
	// console.log(JSON.stringify(sa, null, 4))
	// console.log(sa.length)
	// process.exit(0)
	
	// console.log(trainutils.bars_original(data))
	// process.exit(0)
	// test = trainutils.clonedataset(data)
	// console.log(trainutils.intent_attr_matrix(data))
	// process.exit(0)

	dataset = partitions.partition(data1, 1, Math.round(data1.length*0.5))

	// dataset['test'] = [{'input':'hi', 'output':['original']}]
// 
	// dataset['test'] = [{"input":"how about 10,000 NIS, QA, no agreement on pension, no agreement on car","output":["{\"Offer\":{\"Salary\":\"10,000 NIS\"}}", "{\"Offer\":{\"Job Description\":\"QA\"}}", "{\"Offer\":{\"Leased Car\":\"No agreement\"}}", "{\"Offer\":{\"Pension Fund\":\"No agreement\"}}"],"is_correct":true,"timestamp":"2013-09-09T16:55:44.244Z"}]

// dataset['test'] = [{"input":"QA job","output":["{\"Offer\":{\"Job Description\":\"QA\"}}"],"is_correct":true,"timestamp":"2013-09-09T16:55:45.400Z"}]
// classifier.PartialClassificationEquallyIS
// classifier.PartialClassificationEqually
	// stats = trainAndTest_hash(createNewClassifier, _.sample(data,500), _.sample(test,100), 5)
	
// PartialClassificationEquallyGreedyISNoTrick: classifier.PartialClassificationEquallyGreedyISNoTrick,
		// PartialClassificationEquallyGreedyISTrick: classifier.PartialClassificationEquallyGreedyISTrick,
		// PartialClassificationEquallyIS: classifier.PartialClassificationEquallyIS,
		// PartialClassificationEqually: classifier.PartialClassificationEqually,
		// SVM_SeparatedAfter: classifier.SvmOutputPartialEqually,
		// SVM: classifier.SvmPerfClassifier
// stats = trainAndCompare(
// 		classifier.PartialClassificationEquallyGreedyISTrick, 
// 		classifier.SvmPerfClassifier,
// 		dataset['train'], dataset['test'], 5) 
	
// console.log()
// process.exit(0)

	// stats = trainAndTest_hash(classifier.WinnowSegmenter, dataset['train'], dataset['test'], 5)
	stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallyGreedyNoISTrick, dataset['train'], dataset['test'], 5, classifier.SvmPerfClassifierNoIS)
	// stats = trainAndTest.trainAndTest_hash(classifier.HomerWinnow, dataset['train'], dataset['test'], 5, classifier.SvmPerfClassifier)
	// stats = trainAndTest_hash(classifier.PartialClassificationEquallyGreedyISTrick, dataset['train'], dataset['test'], 5)
	// stats1 = trainAndTest_hash(classifier.SvmPerfClassifier, dataset['train'], dataset['test'], 5)

	// stats = trainAndTest_hash(createNewClassifier, dataset['train'], dataset['test'], 5)

	console.log(JSON.stringify(stats[0], null, 4))
	// console.log(JSON.stringify(stats1[0]['labels'], null, 4))
	console.log()
	process.exit(0)
	// stats = trainAndTest_hash(createNewClassifier, data, a, 5)
	// console.log(JSON.stringify(stats, null, 4))
// process.exit(0)


	// stats = trainAndTestLite(createNewClassifier, dataset['train'], dataset['test'], 5)

	console.log(JSON.stringify(stats, null, 4))
	console.log()
	process.exit(0)
	// console.log(JSON.stringify(stats[0], null, 4))
	// console.log(JSON.stringify(stats[0]['labels'], null, 4))


	// console.log(JSON.stringify(trainutils.confusion_matrix(stats[0]), null, 4))
	// console.log()
	// process.exit(0)
	// console.log(trainutils.hash_to_htmltable(trainutils.confusion_matrix(stats[2])))
	// console.log()
	// process.exit(0)
	// stat = trainAndTest_hash(classifier.PartialClassificationEquallyIS, dataset['train'], dataset['test'], 5)
	// console.log(trainutils.hash_to_htmltable(trainutils.confusion_matrix(stat[2])))
	// process.exit(0)



	console.log(stats[0]['stats'])
	onsole.log(stats[1]['stats'])

	console.log(stats[2]['stats'])

	process.exit(0)
		// console.log(stats[0]['starts'])
	// 	console.log(stats[1]['starts'])

	// console.log(stats[2]['starts'])

	process.exit(0)
	// intent = trainutils.filtererror(stats[0])
	// attributes = trainutils.filtererror(stats[1])
	// values = trainutils.filtererror(stats[2])


	// console.log("intent")
	// console.log(stats[0]['stats'])

	// console.log("attributes")
	// console.log(stats[1]['stats'])

	// console.log("values")
	// console.log(stats[2]['stats'])

	// console.log("number of intent errors")
	// console.log(intent.length)
	// console.log("number of attribute errors")
	// console.log(attributes.length)
	// console.log("number of value errors")
	// console.log(values.length)


	// g = 0
	// _.each(intent, function(value, key, list){
	// 	_.each(values, function(value1, key, list){ 
	// 		if (value['input'] == value1['input'])
	// 			g = g+1
	// 	 	}, this) 
	// 	}, this)

	// w = 0

	// _.each(intent, function(value, key, list){
	// 	_.each(attributes, function(value1, key, list){ 
	// 		if (value['input'] == value1['input'])
	// 			w = w+1
	// 	 	}, this) 
	// 	}, this)

	// p = 0

	// _.each(values, function(value, key, list){
	// 	_.each(attributes, function(value1, key, list){ 
	// 		if (value['input'] == value1['input'])
	// 			p = p+1
	// 	 	}, this) 
	// 	}, this)


	// 	console.log("number of mistakenly classified sentence with mistake in intent and value")
	// 	console.log(g)
	// 	console.log("number of mistakenly classified sentence with mistake in intent and attribute")
	// 	console.log(w)
	// 	console.log("number of mistakenly classified sentence with mistake in attribute and value")
	// 	console.log(p)



	// process.exit(0)
	

	// _.each(stats, function(value, key, list){ 
	// 	_.each(value['labels'], function(value1, label, list){
	// 				if (value1["F1"] != -1)
	// 				console.log("\""+label+"\"\t"+value1['F1']+"\t"+value1['Train']) 
	// 		}, this)
	// 	}, this)

	console.log()
	process.exit(0)

	console.log(stats[0]['stats'])
	console.log(stats[1]['stats'])
	console.log(stats[2]['stats'])
	process.exit(0)

	console.log(trainutils.hash_to_htmltable(trainutils.confusion_matrix(stats[2])))
	process.exit(0)
	matlist = []
	partitions.partitions(data, 5, function(trainSet1, testSet1, index) {
		testSet = trainutils.clonedataset(testSet1)
		trainSet = trainutils.clonedataset(trainSet1)

		stats =	trainAndTest.trainAndTest_hash(createNewClassifier, trainSet, testSet, 5)
		console.log()
		process.exit(0)
		matrix = trainutils.confusion_matrix(stats[0])
		matlist.push(matrix)
		})

		trainutils.hash_to_htmltable(trainutils.aggregate_two_nested(matlist))
		console.log()
		process.exit(0)
}



if (test_segmentation)
	{


	// dataset = [
	// "5_woz_dialogue.json",
	// "students.json",
	// "turkers.json"
				//    "0_grammar.json",
				// "1_woz_kbagent_students.json",
				// "1_woz_kbagent_students1class.json",
				// "2_experts.json",
				// "2_experts1class.json",
				// "4_various.json",
				// "4_various1class.json",
				// "6_expert.json",
				// "3_woz_kbagent_turkers_negonlp2.json",
				// "5_woz_ncagent_turkers_negonlp2ncAMT.json",
				// "nlu_kbagent_turkers_negonlpAMT.json",
				// "nlu_ncagent_students_negonlpnc.json",
				// "nlu_ncagent_turkers_negonlpncAMT.json",
				// "woz_kbagent_students_negonlp.json"
					// "turkers.json"
// 	]
	
// 	data = []
// 	_.each(dataset, function(value, key, list){ 
// 		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/Platinum/"+value)))
// 		// data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
// 	})
// // 
// 	data = _.shuffle(data)

	// data1 = []

	// _.each(data, function(value, key, list){ 
	// 	data1 = data1.concat(value['turns'])
	// }, this)

	// data = _.shuffle(data1)
	// // console.log(data1.length)

	// data = trainutils.filteraccept(data)

	// dataset = partitions.partition(data, 1, Math.round(data.length*0.3))


	// var trainset = trainutils.filteraccept(JSON.parse(fs.readFileSync("datasets/Employer/trainonelabel.json")))
	// var testset = trainutils.filteraccept(JSON.parse(fs.readFileSync("datasets/Employer/testalllabels.json")))


	var trainset = JSON.parse(fs.readFileSync("datasets/Employer/trainonelabel.json"))
	var testset = JSON.parse(fs.readFileSync("datasets/Employer/testalllabels.json"))

	// testset = _.shuffle(testset)
// testset = _.sample(testset, 100)
// trainset = _.sample(trainset, 100)
// stats = trainAndTest.trainAndCompare(
// 		classifier.PartialClassificationEquallySagae, 
// 		classifier.PartialClassificationEquallySagaeNegation,
// 		trainset, testset, 5) 

// console.log(JSON.stringify(stats, null, 4))
// console.log()
// process.exit(0)

	// dataset['train'] = _.sample(dataset['train'], 20)
	
	// a = [{"input":" I offer salary 20,000 NIS","output":["{\"Accept\":\"previous\"}","{\"Insist\":\"Leased Car\"}","{\"Offer\":{\"Leased Car\":\"Without leased car\"}}","{\"Offer\":{\"Pension Fund\":\"20%\"}}"],"is_correct":false,"timestamp":"2013-10-08T08:35:57.698Z"}]
	// a = [{"input":"Okay pension fund 10% salary I 7,000 NIS agree.","output":["{\"Accept\":\"previous\"}","{\"Insist\":\"Leased Car\"}","{\"Offer\":{\"Leased Car\":\"Without leased car\"}}","{\"Offer\":{\"Pension Fund\":\"20%\"}}"],"is_correct":false,"timestamp":"2013-10-08T08:35:57.698Z"}]

            // "is a fast promotion track, you will start with 10%",


a = [{
                // "input": "A Programmer does not have a leased car, I'm afraid",
                // "input": "i would only offer 10",
                // "input": "without leased car, 0% pension, fast promotion track, 9 hours",
                "input": "Pension funds cannot be given",
                "is_correct": false,
                "timestamp": "2014-04-04T16:03:52.763Z",
                "turn": "61",
                "output": [
                    "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
                    "{\"Offer\":{\"Leased Car\":\"With leased car\"}}"
                ]
            }]

	// stats = trainAndTest_hash(classifier.WinnowSegmenter, dataset['train'], a, 5)
	// stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, dataset['train'], a, 5)
	// stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, dataset['train'], dataset['test'], 5)
// var stats1 = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagaeImp, trainset, testset, 5)
// var stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, trainset, testset, 5)
	// var stats1 = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, trainset, testset, 5)
	// var stats = trainAndTest.trainAndTest_hash(classifier.WinnowSegmenter, trainset, testset, 5)
	
	var stats = trainAndTest.trainAndTest_hash(classifier.SagaeIntent, trainset, a, 5)

	console.log(stats)
	process.exit(0)
	// SagaeIntent

	// var stats = trainAndTest.trainAndTest_hash(classifier.SvmPerfClassifier, trainset, testset, 5)
	// console.log()
	// stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, dataset['train'], dataset['test'], 5)
	// console.log(JSON.stringify(stats[0]['labels'], null, 4))
	// console.log(JSON.stringify(stats[0]['stats'], null, 4))
	// console.log(JSON.stringify(stats[0], null, 4))
	console.log(JSON.stringify(stats[0]['stats'], null, 4))
	console.log(JSON.stringify(stats1[0]['stats'], null, 4))
	// console.log(JSON.stringify(stats[0]['labels'], null, 4))

// 
	// var lab = trainutils.comparelabels(stats1[0]['labels'], stats[0]['labels'])
	// console.log(lab)

	process.exit(0)
	// stats1 = trainAndTest_hash(classifier.WinnowSegmenter, dataset['train'], dataset['test'], 5)
	// console.log(JSON.stringify(stats1[0]['labels'], null, 4))
	// console.log(JSON.stringify(stats1[0]['stats'], null, 4))

	// console.log()
	// process.exit(0)

stats = trainAndTest.trainAndCompare(
		classifier.PartialClassificationEquallySagae, 
		classifier.WinnowSegmenter,
		dataset['train'], dataset['test'], 5) 

	console.log(stats)

	// stats1 = trainAndTest_hash(classifier.SvmPerfClassifier, dataset['train'], dataset['test'], 5)
	// console.log(JSON.stringify(stats1[0]['stats'], null, 4))

	console.log()
	process.exit(0)
	// stats = trainAndTest_hash(classifier.SvmPerfClassifier, dataset['train'], dataset['test'], 5)
	// stats = trainAndTest_hash(classifier.WinnowSegmenter, data1, a, 5)

	// console.log(stats)
	// console.log(JSON.stringify(stats, null, 4))

	// process.exit(0)
		// BayesSegmenter
	}	


if (count_2_intents_2_attributes)
	{
	dataset = [
			"5_woz_ncagent_turkers_negonlp2ncAMT.json",
			"nlu_ncagent_students_negonlpnc.json",
			"nlu_ncagent_turkers_negonlpncAMT.json"
			]

	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})

	data = _.shuffle(data)

	Observable = {}
		_.each(data, function(datum, key, list){				
			_.each(multilabelutils.normalizeOutputLabels(datum.output), function(lab, key, list){				
				_.each(Hierarchy.splitJson(lab), function(element, key, list){
						console.log(lab)
					if (key==0)
						if (!(element in Observable))
								Observable[element] = {}
					if (key==1)
						if (!(element in Observable[list[key-1]]))
								Observable[list[key-1]][element] = {}
					if (key==2)
						if (!(element in Observable[list[key-2]][list[key-1]]))
								Observable[list[key-2]][list[key-1]][element] = {}

				}, this)
			}, this)
		}, this)

	count = 0
	_.each(data, function(value, key, list){ 
				output = (Hierarchy.splitPartEqually(multilabelutils.normalizeOutputLabels(value.output)))	
				if ((output[0].length >=2) && (output[1].length>=2))
					{
						count = count + 1
							// console.log(output)
					}
	}, this)
		
	
	ambiguity = []
	_.each(data, function(value, key, list){ 
			output = (Hierarchy.splitPartEqually(multilabelutils.normalizeOutputLabels(value.output)))	
			_.each(output[1], function(attr, key, list){
				listt = []
				_.each(output[0], function(intent, key, list){
					if (Object.keys(Observable[intent]).indexOf(attr) != -1)
						{
						listt.push(intent)
						} 
					}, this)

				if (listt.length >= 2)
					{
						amb = {}
						amb['attr'] = attr
						amb['list'] = listt
						ambiguity.push(amb)
					}
				}, this)
		}, this)
	console.log(ambiguity)
	console.log(ambiguity.length)
	}

if (convert_tran)
{
	var data = []
	var data1 = []
	data = data.concat(JSON.parse(fs.readFileSync("datasets/1237.json")))
	_.each(data, function(value, key, list){ 
		if ((value['translations'][0] != 'Other') && (value['classifierName'] == "Candidate-egypt"))
		data1.push({'input':value['text'], 'output':value['translations'],
					'timestamp': value['timestamp']})
	}, this)
	console.log(JSON.stringify(data1, null, 4))
	console.log()
	process.exit(0)
}

if (test_conv)
{
	dataset = [
		// "5_woz_dialogue.json",
		// "students.json",
		"turkers.json"
		]
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	})

	data = _.shuffle(data)

	a = 0
	_.each(data, function(value, key, list){ 
		a = a + value['turns'].length
	}, this)

	console.log(a)
	console.log()
	process.exit(0)

}

if (compare_performance)
{
	var data = []
	var errors = [[],[],[]]
	
	// var dataset = ["nlu_ncagent_students_negonlpnc.json"]//"nlu_ncagent_turkers_negonlpncAMT.json"]
	// var dataset = ["5_woz_ncagent_turkers_negonlp2ncAMT.json"]
	
	// number of conversations 36
	// number of sentences 520
	// number of sinle label parts 704

	dataset = [
		// "5_woz_dialogue.json",
		// "students.json",
		// "turkers.json"
		"students_separated.json",
		"turkers_separated.json",
		"usa_separated.json"
		]

	data = []

	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	})

	data = _.shuffle(data)

	// _.each(dataset, function(value, key, list){ 
		// data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	// })
	

	var F1 = [[],[],[]]
	var F1_single = [[],[],[]]

	partitions.partitions(data, 5, function(trainSet, testSet, index) {
		// var stats = trainAndTest.trainAndTest_hash(classifier.WinnowSegmenter, trainSet, testSet, 5)
		// if (trainutils.isDialogue(trainSet))
		// var stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, trainutils.extractturns(trainSet), trainutils.extractturns(testSet), 5)
		var stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEqually_Component, trainutils.extractturns(trainSet), trainutils.extractturns(testSet), 5)
		var stats_single = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEqually_Component, trainutils.extractturnssingle(trainSet), trainutils.extractturns(testSet), 5)
		

		// var stats_single = trainAndTest.trainAndTest_hash(classifier.SvmPerfClassifier, trainutils.extractturnssingle(trainSet), trainutils.extractturns(testSet), 5)
		// var stats_mix = trainAndTest.trainAndTest_hash(classifier.SvmPerfClassifier, trainutils.extractturns(trainSet), trainutils.extractturns(testSet), 5)
		
		// console.log(JSON.stringify(stats, null, 4))
		// console.log()
		// process.exit(0)
		_(3).times(function(n){
			F1[n].push(stats[n]['stats']['F1'])
			F1_single[n].push(stats_single[n]['stats']['F1'])
		})

		// else
			// var stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEquallySagae, trainSet, testSet, 5)
		// over intent attribute value

	})

	console.log("intent") 
	console.log("clean") 
	console.log(trainutils.average(F1[0]))
	console.log("single") 
	console.log(trainutils.average(F1_single[0]))

	console.log("attr") 
	console.log("clean") 
	console.log(trainutils.average(F1[1]))
	console.log("single") 
	console.log(trainutils.average(F1_single[1]))

	console.log("value") 
	console.log("clean") 
	console.log(trainutils.average(F1[2]))
	console.log("single") 
	console.log(trainutils.average(F1_single[2]))

console.log()
process.exit(0)

}

if (do_unseen_word_curve)
	{
	dataset = [			"5_woz_ncagent_turkers_negonlp2ncAMT.json",
			// "nlu_ncagent_students_negonlpnc.json",
			"nlu_ncagent_turkers_negonlpncAMT.json"


			]

	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})
	
	unseen_words_curves(data)

	}

if (do_small_test_multi_threshold)
	{

	var classifier = createNewClassifier(); 

	var train = JSON.parse(fs.readFileSync("datasets/Dataset9Manual4.json"))
	var test = JSON.parse(fs.readFileSync("datasets/Dataset9Manual4.json"))

    classifier.trainBatch(train);

    console.log(classifier.classifier.stats)
    	
    Threshold = classifier.classifier.multiclassClassifier.threshold

	partitions.partitions_consistent(train, classifier.classifier.validateThreshold, (function(trainSet, testSet, index) {
		classifier.trainBatch(trainSet);
		stats = ToTest(classifier, testSet, 0)
		console.log(stats)
		process.exit(0)
	
	}))
	}
	
if (try_sequence)
{
// var newset = []
	// dataset = [
		// "sequence.json"
		// ]
	var data = []
	// _.each(dataset, function(value, key, list){ 
		// data = data.concat(JSON.parse(fs.readFileSync(value)))
	// })
	// data = data.concat(JSON.parse(fs.readFileSync("sequence.json")))
	data = data.concat(JSON.parse(fs.readFileSync("sequence.json")))
	data = _.shuffle(data)
	data = _.shuffle(data)



    // console.log(JSON.stringify(trainutils.convert_to_train(data), null, 4))
	// console.log()
	// process.exit(0)
	// var testset = _.sample(data, 20)
	var numOfFolds = 3
	var accum = 20
	var stats = {}
	// var dataset = partitions.partition(data, 1, Math.round(data.length*0.3))
	partitions.partitions(data, numOfFolds, function(train, tests, fold) {
		console.log("fold")
		var index = accum
		while (index < train.length)
			{
			var mytrain = train.slice(0, index)
			if (!(index in stats)) stats[index] = {}
			// console.log(JSON.stringify(trainutils.convert_to_train(mytrain), null, 4))
	    	var local_stats = trainAndTest.trainAndTest_hash(classifier.WinnowSegmenterSagae, trainutils.convert_to_train(mytrain), trainutils.convert_to_test(tests), 5)
			// if (fold == 2)
				// {
				// console.log(JSON.stringify(local_stats[0]['labels'], null, 4))
				// console.log()
				// process.exit(0)
				// }
				// console.log(JSON.stringify(local_stats[0]['data'], null, 4))
				// console.log()/
				// process.elatelyxit(0)
				_.each(local_stats[0]['labels'], function(label, key, list){ 
					if (!(key in stats[index])) stats[index][key] = []
					if (label['F1'] > 0)
						// stats[index][key].push(0)
					// else
						stats[index][key].push(label['F1'])
				}, this)
			// console.log(JSON.stringify(stats, null, 4))
			// console.log()
			// process.exit(0)
			index = index + accum
			}
		// console.log(JSON.stringify(stats, null, 4))
		// console.log()
		// process.exit(0)
	})

	// _.each(stats, function(value, key, list){ 
		// _.each(value, function(value1, key1, list1){
			// stats[key][key1] = _.reduce(value1, function(memo, num){ return memo + num; }, 0)/value1.length
		// }, this)
	// }, this)

// console.log(JSON.stringify(stats, null, 4))
// console.log()
// process.exit(0)

	var constats = {}
	_.each(stats, function(value, key, list){ 
		constats[key] = {}
		_.each(value, function(value1, key1, list1){
			constats[key][key1.split(" ").join("_")] =  _.reduce(value1, function(memo, num){ return memo + num; }, 0)/value1.length
		}, this)
	}, this)

	stats = constats

	// console.log(JSON.stringify(stats, null, 4))
	// console.log()
	// process.exit(0)

	// var filter = ["7,000_NIS", "8,000_NIS", "QA", "Programmer", "10%", "Slow_promotion_track", "Fast_promotion_track", "20%"]
	// var filter = ["Offer", "Reject", "Accept", "7,000_NIS", "8,000_NIS", "12,000_NIS", "QA", "Programmer", "10%", "Slow_promotion_track", "Fast_promotion_track", "20%"]
	// var filter = ["Offer", "Reject", "Accept", "7,000_NIS"]

	// var filtered = {}

	// _.each(stats, function(value, key, list){ 
		// filtered[key] = {}
		// _.each(filter, function(value1, key1, list1){ 
			// filtered[key][value1] = stats[key][value1]
		// }, this)
	// }, this)

	// stats = filtered

	fs.writeFileSync("seq", "size\t"+Object.keys(stats[Object.keys(stats)[0]]).join("\t") + "\n", 'utf-8')

	_.each(stats, function(value, key, list){ 
		fs.appendFileSync("seq", key+"\t"+_.values(value).join("\t") + "\n", 'utf-8')
	}, this)


	var com = "gnuplot -p -e \"reset; set title \' \'; set term png truecolor size 1024,1024; set grid ytics; set grid xtics; set key bottom right; set output \'seq.png\'; set key autotitle columnhead; plot for [i=2:"+ Object.keys(stats[Object.keys(stats)[0]]).length +"] \'seq\' using 1:i with linespoints linecolor i \""
	
	// console.log(com)
	result = execSync(com)
	
	// console.log(JSON.stringify(stats, null, 4))
	console.log()
	process.exit(0)

	// console.log(JSON.stringify(, null, 4))
	// var newdataset = []
	// _.each(dataset['train'], function(value, key, list){ 
	// 	_.each(value['output']['single_labels'], function(value1, key1, list){ 
	// 		if (value1['position'][0].length != 0)
	// 		_.each(value1['position'], function(value3, key3, list){ 
	// 			newdataset.push({'input': value['input'].substring(value3[0],value3[1]+1),
	// 							'output': key1})
	// 		}, this)
	// 	}, this)
	// }, this)

	// var test = []

	// _.each(dataset['test'], function(record, key, list){ 
	// 	_.each(record['output']['single_labels'], function(value1, key1, list1){
	// 		if (value1['position'][0].length > 0)
	// 			_.each(value1['position'], function(value2, key2, list2){
	// 				if (value2[0]!=0) value2[0] = value2[0] + 1
	// 				var str = record['input'].substr(0,value2[0])
	// 				var spaces = str.split(" ")
	// 				var innerspace = record['input'].substring(value2[0],value2[1] + 1).trim().split(" ")
	// 				// console.log("str_before "+str)
	// 				// console.log("inner text "+ innerspace)
	// 				// console.log("coord:"+value2)
	// 				// console.log("inner original:" +record['input'].substring(value2[0],value2[1] + 1))
	// 				// console.log("spaces_start "+spaces.length)
	// 				// console.log("inner_space"+ innerspavbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbce.length)
	// 				dataset['test'][key]['output']['single_labels'][key1]['position'][key2] = [spaces.length, spaces.length + innerspace.length]
	// 		 	}, this) 
	// 	}, this)
	// 	console.log(JSON.stringify(record, null, 4))
	// }, this)

	// console.log(JSON.stringify(dataset['test'], null, 4))
	// console.log()
	// process.exit(0)

	var stats = trainAndTest.trainAndTest_hash(classifier.WinnowSegmenterSagae, newdataset, dataset['test'], 5)

	// console.log(JSON.stringify(stats[0]['data'], null, 4))
	// console.log(JSON.stringify(stats[0]['stats'], null, 4))

	_.each(stats[0]['data'], function(value, key, list){ 
		if ((value['explanation']['FP'].length>0) || (value['explanation']['FN'].length>0))
			console.log(JSON.stringify(value, null, 4))
	}, this)

	// console.log(JSON.stringify(stats[0]['labels'], null, 4))


	// partitions.partitions(dataset, numOfFolds, function(train, test, fold) {


	console.log()
	process.exit(0)
}

if (prepare_sequence)
{
	var newset = []
	dataset = [
		// "5_woz_dialogue.json",
		// "students.json",
		// "turkers.json"
		"students_separated.json",
		"turkers_separated.json",
		"usa_separated.json"
		]
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	})

	var dataold =  JSON.parse(fs.readFileSync("sequence.json"))
	var oldsen = []
	_.each(dataold, function(value, key, list){
		oldsen.push(value['input'])
	}, this)

	var list = _.sample(trainutils.extractturns(data), 100)

	_.each(list, function(value, key, list){
	 	if (oldsen.indexOf(value['input']) == -1 )
	 	{
			var lab = _.uniq(
				_.flatten(
				Hierarchy.splitPartEqually(multilabelutils.normalizeOutputLabels(value['output']))))
				var outputhash = {'single_labels':{}, 'composite_labels':[[]]}
			_.each(lab, function(value1, key1, list1){
				outputhash['single_labels'][value1] = {'id':key1+1, 'position':[[]]}
			}, this)
		newset.push({'input':value['input'],
						'output':outputhash})
		}
	}, this)


	console.log(JSON.stringify(newset, null, 4))
	process.exit(0)

}








if (test_error_analysis)
{
	var data = []
	var errors = [[],[],[]]
	
	// var dataset = ["nlu_ncagent_students_negonlpnc.json"]//"nlu_ncagent_turkers_negonlpncAMT.json"]
	// var dataset = ["5_woz_ncagent_turkers_negonlp2ncAMT.json"]
	
	// number of conversations 36
	// number of sentences 520
	// number of sinle label parts 704

	dataset = [
		// "5_woz_dialogue.json",
		// "students.json",
		// "turkers.json"
		"students_separated.json",
		"turkers_separated.json",
		"usa_separated.json"
		]

	data = []

	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	})

	// console.log("numbber of conversations"+data.length)
	// var sen = 0
	// var single = 0
	// _.each(data, function(value, key, list){ 
	// 	sen = sen + value['turns'].length
	// 	_.each(value['turns'], function(value1, key1, list1){ 
	// 		single = single + value1['parts'].length
	// 	}, this)
	// }, this)
	// console.log("number of sentence"+sen)
	// console.log("number of parts"+single)
	
	data = _.shuffle(data)

	// _.each(dataset, function(value, key, list){ 
		// data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	// })
	
	var F1 = []
	partitions.partitions(data, 5, function(trainSet, testSet, index) {
		// var stats = trainAndTest.trainAndTest_hash(classifier.WinnowSegmenter, trainSet, testSet, 5)
		if (trainutils.isDialogue(trainSet))
			// var stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEqually_Component, trainutils.extractturnssingle(trainSet), trainutils.extractturns(testSet), 5)
			var stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEqually_Component, trainutils.extractturns(trainSet), trainutils.extractturns(testSet), 5)
		else
			var stats = trainAndTest.trainAndTest_hash(classifier.PartialClassificationEqually_Component, trainSet, testSet, 5)
		// over intent attribute value

		// console.log(JSON.stringify(stats, null, 4))
		// process.exit(0)
		// F1.push(stats[0]['stats']['F1'])

		_.each(stats, function(stat, key1, list){ 
			// var stat = stats[2]
			var samp = _.sample(stat['data'], 50)
			_.each(samp, function(value, key, list){
				if ((value['explanation']['FP'].length != 0) || (value['explanation']['FN'].length != 0))
					{
					// console.log(key1)

					var ladd = []
					
					if (value['explanation']['TP'].length > 0)
						ladd = ladd.concat(value['explanation']['TP'])

					if (value['explanation']['FP'].length > 0)
						ladd = ladd.concat(value['explanation']['FP'])

					if (value['explanation']['FN'].length > 0)
						ladd = ladd.concat(value['explanation']['FN'])
					
					// var det = value['details']['positive']
					var det = {}
					_.each(ladd, function(labs, key7, list7){
						if (labs in value['details']['negative'])
							{
							var obj = {}
							obj[labs] = value['details']['negative'][labs]
							det = _.extend(det, obj);
							}
						if (labs in value['details']['positive'])
							{
							var obj = {}
							obj[labs] = value['details']['positive'][labs]
							det = _.extend(det, obj);
							}
					}, this)
					errors[key1].push({'input':value['input'],'errorclass':[''],'stat':value['explanation'],'original':value['original'], 'details': det})	
					// errors[key1].push({'input':value['input'],'errorclass':[''],'stat':value['explanation'],'original':value['original'], 'details': value['details']})	
					// errors[2].push({'input':value['input'],'errorclass':[''],'stat':value['explanation'],'original':value['original'], 'details': value['details']})	
					// errors[2].push({'input':value['input'],'errorclass':[''],'stat':value['explanation'],'original':value['original']})	
					}
			})
		});
	});
	

	// console.log(trainutils.average(F1))
	console.log(JSON.stringify(errors, null, 4))
	process.exit(0)
}

if (do_compare_approach)
	{
	dataset = [
		    // "5_woz_ncagent_turkers_negonlp2ncAMT.json",
		    // "nlu_ncagent_students_negonlpnc.json",
		    "nlu_ncagent_turkers_negonlpncAMT.json"
			]
	data = []

	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})

	data = _.shuffle(data)
	// data = _.sample(data, 200)
	dataset = partitions.partition(data, 1, Math.round(data.length*0.5))




	stats = trainAndTest.trainAndCompare(
		classifier.PartialClassificationEquallySagae, 
		classifier.WinnowSegmenter,
		dataset['train'], dataset['test'], 5) 
	console.log()
	process.exit(0)
	// PartialClassificationEquallySagae: classifier.PartialClassificationEquallySagae,
		// StandardSagae: classifier.WinnowSegmenter, 

	var composite = new classifier.PartialClassificationEquallySagae
	composite.trainBatch(dataset['train'])

	var component = new classifier.WinnowSegmenter
	component.trainBatch(dataset['train'])

	_.each(dataset['test'], function(value, key, list){
		actual_composite = composite.classify(value.input, 50, true)
		actual_component = component.classify(value.input, 50, true)
		// console.log(actual_component)
		// console.log(value)
		// console.log(actual_component)
		// process.exit(0)
		// var amb = trainutils.intent_attr_label_ambiguity(actual_component.classes)


		// if (amb.length>0)
			{
			// var gen = trainutils.generate_labels(actual_component.classes)
			console.log(value)
			// console.log(gen)
			console.log(actual_component.classes)
			console.log(actual_composite.classes)
			// process.exit(0)
			// _.each(gen, function(lab, key, list){
				// console.log(lab)
				// console.log(actual_composite['scores'][lab])	 
			// }, this)
			console.log("------------------------------------------")

			}

		// console.log("------------------------------------------")

		// console.log("___________________-")
		// console.log(actual_component.classes)
		// console.log(trainutils.generate_labels(actual_component.classes))
		// console.log()
		// process.exit(0)
		// trainutils.generate_labels
		// if (amb.length > 0)
		// 	{

		// 	console.log("_________________________________")
		// 	console.log(amb)
		// 	console.log(value)
		// 	console.log(actual_composite)
		// 	console.log(actual_component)
		// 	process.exit(0)
		// 	}
	}, this)
		// trainutils.intent_attr_label_ambiguity = function(output)

	console.log()
	process.exit(0)
	}




if (do_unseen_word_fp)
	 {
	dataset = [
			"5_woz_ncagent_turkers_negonlp2ncAMT.json",
			"nlu_ncagent_students_negonlpnc.json",
			"nlu_ncagent_turkers_negonlpncAMT.json"
			// "test.json"
			]
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})

	console.log(unseen_correlation(data, createNewClassifier, tokenize))
	}


if (do_checking_tag) {

	// datasetNames = [
	// 		"5_woz_ncagent_turkers_negonlp2ncAMT.json",
	// 		"nlu_ncagent_students_negonlpnc.json",
	// 		"nlu_ncagent_turkers_negonlpncAMT.json",
	// 		// "3_woz_kbagent_turkers_negonlp2.json",
	// 		// "woz_kbagent_students_negonlp.json",
	// 		// "nlu_kbagent_turkers_negonlpAMT.json"
	// 		]

	dataset = []
	tagdict = {}
	all = 0

	_.each(datasetNames, function(value, key, list){ 
		data = JSON.parse(fs.readFileSync("datasets/Employer/"+value))
			_.each(data, function(record, key, list){ 
				classes = record['output'].map(stringifyClass);
					_.each(classes, function(clas, key, list){ 
						all += 1
						if (!tagdict[clas])
							{	
							tagdict[clas]={}
							tagdict[clas]['input'] = []
							tagdict[clas]['file'] = []
							}
						tagdict[clas]['input'].push(record['input'])
						tagdict[clas]['file'].push(value)
						})
			})
	})


	commonfile = {}
	_.each(tagdict, function(tag, key, list){ 
		commonfile[key] = {}
		commonfile[key]['count'] = tag['input'].length
		commonfile[key]['ratio'] = tag['input'].length/all
		commonfile[key]['files'] = _.uniq(tag['file'])
		commonfile[key]['input'] = tag['input']
	})

	console.log(commonfile)
}   

if (do_small_temporary_test) {
	// var dataset = JSON.parse(fs.readFileSync("datasets/Employer/2_experts.json"))
	dataset = grammarDataset.concat(collectedDatasetMulti).concat(collectedDatasetSingle).concat(collectedDatasetMulti2).concat(collectedDatasetSingle2).concat(collectedDatasetMulti4).concat(collectedDatasetMulti8)
	dataset = _.shuffle(dataset)
   
    stats = trainAndTest.trainAndTest_hash(createNewClassifier, dataset, dataset, verbosity+3)

    _.each(stats['data'], function(value, key, list){ 
		if ((value['explanations']['FP'].length != 0) || (value['explanations']['FN'].length != 0))
		{
		console.log(value)	
		}
	});
}   

if (do_separate_dialogue)
	{
	
	dataset = [
		// "5_woz_dialogue.json",
		// "students.json",
		// "turkers.json"
		"dial_usa.json"
		]
	
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	})

	_.each(data, function(value, key, list){ 
		_.each(value['turns'], function(out, key1, list1){

			data[key]['turns'][key1]['parts'] = []
			_.each(out['output'], function(lab, key2, list2){
				data[key]['turns'][key1]['parts'].push({'input':out['input'], 'output':lab})
			 }, this) 
		}, this)
	}, this)

	console.log(JSON.stringify(data, null, 4))
	process.exit(0)
	}
if (add_context)
	{
	data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))

	}
	
if (do_learning_curves_dialogue)
	{
	dataset = [
		// "5_woz_dialogue.json",
		// "students.json",
		// "turkers.json"
		"students_separated.json",
		"turkers_separated.json",
		"usa_separated.json"
		]
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/"+value)))
	})

	data = _.shuffle(data)
	data = _.shuffle(data)

	classifiers  = {
		// SVM_SeparatedAfter: classifier.SvmOutputPartialEqually,
		// SVM_SeparatedClassification: classifier.PartialClassificationEqually,
		// SVM_SeparatedClassification_IS: classifier.PartialClassificationEquallyIS
	
		// SVM_SeparatedAfter: classifier.SvmOutputPartialAttVal,
		// SVM_SeparatedClassification: classifier.PartialClassificationAttVal,
		// SVM_SeparatedClassification_IS: classifier.PartialClassificationAttValIS

		// PartialClassificationEquallyGreedyISNoTrick: classifier.PartialClassificationEquallyGreedyISNoTrick,
		
		// PartialClassificationEquallyGreedyNoISBiagram: classifier.PartialClassificationEquallyGreedyTrick,
		// PartialClassificationEquallySagae: classifier.PartialClassificationEquallySagae,
		// StandardSagae: classifier.WinnowSegmenter,
		// SVMNoIS: classifier.SvmPerfClassifierNoIS,
		// Component: classifier.PartialClassificationEqually_Component,
		// Composite: classifier.SvmOutputPartialEqually_Composite
		// CompositeIS: classifier.SvmOutputPartialEquallyIS,
		// CompositeNoIS: classifier.SvmOutputPartialEquallyNoIS,
		// ComponentIS: classifier.PartialClassificationEquallyIS,
		// ComponentNoIS: classifier.PartialClassificationEquallyNoIS,
		// SVM_SeparatedAfter: classifier.SvmOutputPartialEqually,
		// Homer: classifier.HomerWinnow,
		// SVM: classifier.SvmPerfClassifier,
		
		Current_baseline: classifier.SvmPerfClassifierIS,
		Segmentation_baseline: classifier.WinnowSegmenter, 
		Component_segmentation: classifier.PartialClassificationEquallySagae,
		
		// Component_Sagae_NoCompletion: classifier.PartialClassificationEquallySagaeNoCompletion,
		// Composite_Sagae_Splitter: classifier.PartialClassificationEquallySagaeIS
		};

	// parameters = ['F1','TP','FP','FN','Accuracy','Precision','Recall']
	parameters = ['F1', 'Precision','Recall', 'Accuracy']
	curves.learning_curves(classifiers, data, parameters, 2, 7, 5)
	// curves.learning_curves(classifiers, trainset, parameters, 20, 100,  4, testset)

	}








if (sample_kbagent)
	{
	datasetNames = [
			"3_woz_kbagent_turkers_negonlp2.json",
			]
	dataset = []
	_.each(datasetNames, function(value, key, list){ 
		dataset = dataset.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
		// dataset = dataset.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/Platinum/"+value)))
	});
	var data = _.sample(dataset, 200)
	fs.writeFileSync("datasets/Employer/testkbagent.json", JSON.stringify(data, null, 4), 'utf8');
	process.exit(0)
	
	}

if (do_separate_datasets)
	{
		datasetNames = [
			"nlu_ncagent_students_negonlpnc.json",
			"nlu_ncagent_turkers_negonlpncAMT.json",
			]
	dataset = []

	_.each(datasetNames, function(value, key, list){ 
		dataset = dataset.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
		// dataset = dataset.concat(JSON.parse(fs.readFileSync("datasets/Employer/Dialogue/Platinum/"+value)))
	});

	dataset = _.shuffle(dataset)
	dataset = _.shuffle(dataset)

	var data = partitions.partition(dataset, 1, Math.round(dataset.length*0.3))

	fs.writeFileSync("datasets/Employer/trainonelabel.json", JSON.stringify(trainutils.dividedataset(data['train'])['one'], null, 4), 'utf8');
	fs.writeFileSync("datasets/Employer/testalllabels.json", JSON.stringify(data['test'], null, 4), 'utf8');



	// console.log(JSON.stringify(str, null, 4))
	// console.log(dataset.length)
	// console.log()
	process.exit(0)




	}







if (do_small_temporary_test_dataset) {

	dataset = []

	_.each(datasetNames, function(value, key, list){ 
		console.log(value)
		dataset.push(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	});

	_.each(dataset, function(value, key, list){ 
		value = _.shuffle(value)
		console.log(datasetNames[key])

		output = []
		input = []
		testset = []

		_(100).times(function(n){
			rnd = Math.floor(Math.random() * value.length);
			output.push(JSON.stringify(value[rnd]['output']))
			input.push(JSON.stringify(value[rnd]['input']))
			testset.push(value[rnd])
      	});

      	console.log(output)
      	console.log(input)

      	console.log(trainAndTest.trainAndTest(createNewClassifier, collectedDatasetSingle2, testset, verbosity+3));

	}, this);

	
    // var datasettest = JSON.parse(fs.readFileSync("datasets/Dataset9Manual.json"))
    // console.log("Train on woz single class, test on manual dataset: "+
    //     trainAndTest(createNewClassifier, datasettest, datasettest, verbosity+3).shortStats())+"\n";

	// console.log("Train on woz single class, test on manual dataset: "+
	// 	trainAndTestLite(createNewClassifier, collectedDatasetSingle, JSON.parse(fs.readFileSync("datasets/Dataset9Manual.json")), verbosity+3).shortStats())+"\n";
}
