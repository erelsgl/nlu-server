if (naive1)
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
	dataset = partitions.partition(data, 1, Math.round(data.length*0.3))

	var classifier = new classifier.PartialClassificationEquallyNaive;
	classifier.trainBatch(clonedataset(dataset['train']));

	// repla = {"previous":"and","Leased Car": "car","7,000 NIS": "7000", "12,000 NIS":"12000", "20,000 NIS":"20000","Promotion Possibilities":"fast slow", "Without leased car":"without car","Query": "how","Slow promotion track":"slow track","Fast promotion track":"fast track","10 hours": "10 hours", "9 hours": "9 hours", "8 hours": "8 hours", "Working Hours": "hours", "Job Description": "job", "Greet": "hi", "60,000 USD": "60000", "90,000 USD": "90000", "120,000 USD":"12000"}
	// repla = {"previous":"and","7,000 NIS": "7000", "12,000 NIS":"12000", "20,000 NIS":"20000","60,000 USD": "60000", "90,000 USD": "90000", "120,000 USD":"12000"}
	repla = {"previous":"and","Leased Car": "car","7,000 NIS": "7000", "12,000 NIS":"12000", "20,000 NIS":"20000"}

	bag_of_labels = []

	Observable = {}

	_.each(clonedataset(dataset['train']), function(datum, key, list){
		// datum.input = regexpNormalizer(datum.input)
		_.each(multilabelutils.normalizeOutputLabels(datum.output), function(label, key, list){				
			_.each(Hierarchy.splitJson(label), function(element, key, list){
				if (element in repla)
					{
					element = repla[element]
					list[key] = element
					}
				// if ((element != "Accept") && (element != "Reject")&& (element != "No agreement")&& (element != "how"))
				if ((element != "No agreement"))
				if (key != 0)
					bag_of_labels.push(element)
				// if (key==0)
				// 	if (!(element in Observable))
				// 			Observable[element] = {}
				// if (key==1)
				// 	if (!(element in Observable[list[key-1]]))
				// 			Observable[list[key-1]][element] = {}
				// if (key==2)
				// 	if (!(element in Observable[list[key-2]][list[key-1]]))
				// 			Observable[list[key-2]][list[key-1]][element] = {}

			}, this)
		}, this);
	}, this)

	bag_of_labels = _.uniq(bag_of_labels)

	// defining threshold for labels
	string_to_file = ""
	_.each(bag_of_labels, function(value, key, list){ 
		_.each(bag_of_labels, function(value1, key, list){ 
			string_to_file = string_to_file +value+"&"+value1+"&BLA\n"
			}, this)
	}, this)

	fs.writeFileSync("/tmp/toJava", string_to_file)
	// var result = execSync("cd /home/com/SEMILAR-API-1.0/sim; java -jar /home/com/SEMILAR-API-1.0/sim/similar_greedyComparerWNLin.jar")
	var result = execSync("cd /home/com/SEMILAR-API-1.0/sim; java -jar /home/com/SEMILAR-API-1.0/sim/similar_cmComparer.jar")

	var stats = fs.readFileSync("/tmp/toNode", "utf8");
	stats=stats.split("\n")
	stats.pop()

	threshold = {}
	_.each(stats, function(value, key, list){
		text = value.split("&")

		if (!(text[0] in threshold))
			threshold[text[0]] = 0


		if ((parseFloat(text[2])>threshold[text[0]]) &&
			(text[1] != text[0]))
			threshold[text[0]] = parseFloat(text[2])
	})

	// end defining threhold for labels
		

	labels = {}

	string_to_file = ""
		_.each(dataset['test'], function(value, key, list){ 
			value.input = regexpNormalizer(value.input)

			_.each(bag_of_labels, function(label, key, list){ 
				string_to_file = string_to_file +value.input+"&"+label+"&"+value.output+"\n"
				}, this)
			}, this)


	_.each(clonedataset(dataset['test']), function(value, key, list){ 
			labels[value.input] = {}
			labels[value.input]['actual_separated'] = []
			labels[value.input]['labels_similarity_evaluation'] = []
			classification = classifier.classify(value.input)
			labels[value.input]['actual_separated'] = labels[value.input]['actual_separated'].concat(_.flatten(classification))
			}, this)


	fs.writeFileSync("/tmp/toJava", string_to_file)

	// var result = execSync("cd /home/com/SEMILAR-API-1.0/sim; java -jar /home/com/SEMILAR-API-1.0/sim/similar_greedyComparerWNLin.jar")
	var result = execSync("cd /home/com/SEMILAR-API-1.0/sim; java -jar /home/com/SEMILAR-API-1.0/sim/similar_cmComparer.jar")
	var stats = fs.readFileSync("/tmp/toNode", "utf8");
	stats=stats.split("\n")
	stats.pop()

	_.each(stats, function(value, key, list){
		// bag_of_labels = []
		text = value.split("&")

		for (mask in repla)
			if (repla[mask] == text[1])
				text[1] = mask 

		text[3] = JSON.parse("["+text[3]+"]")

		labels[text[0]]['correct_gold_standard'] = text[3]
		// labels[text[0]]['expected']=[]

		
		labels[text[0]]['labels_similarity_evaluation'].push([text[1],text[2]])
		// if ((parseFloat(text[2]))>0.02)
		if ((parseFloat(text[2]))>threshold[text[1]])
			labels[text[0]]['actual_separated'].push(text[1])

		// labels[text[0]]['expected'] = _.uniq(labels[text[0]]['expected'].concat(bag_of_labels))

	}, this)

	// process.exit(0)
	
	var currentStats = new PrecisionRecall();

	Observable = {}
			for (label in labels)
			{
			_.each(multilabelutils.normalizeOutputLabels(labels[label]['correct_gold_standard']), function(lab, key, list){				
				_.each(Hierarchy.splitJson(lab), function(element, key, list){
					// if (element in repla)
					// 	{
					// 	element = repla[element]
					// 	list[key] = element
					// 	}
					bag_of_labels.push(element)
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
			}, this);
		// }, this)
		}

for (label in labels)
		{
			possib = []
	for (intent in Observable)
			{
				if ((labels[label]['actual_separated'].indexOf(intent)!=-1) && ((intent == "Greet") || (intent == "Quit")))
				{
				possib.push(Hierarchy.joinJson([intent,true]))
				}
			// console.log(intent)
			manyofattr = []
			for (attr in Observable[intent])
				{
				// console.log(attr)
				if (Object.keys(Observable[intent][attr]).length==0)
					// if ((values.indexOf(intent)!=-1) && (values.indexOf(attr)!=-1))
						if ((labels[label]['actual_separated'].indexOf(intent)!=-1) && (labels[label]['actual_separated'].indexOf(attr)!=-1))
						{
						_.each(labels[label]['labels_similarity_evaluation'], function(v, key, list){
						if (v[0] == attr)
							num = v[1]  
						}, this)

						manyofattr.push([Hierarchy.joinJson([intent,attr]), parseFloat(num)])
						}
				manyof = []
				for (value in Observable[intent][attr])
					{

					_.each(labels[label]['labels_similarity_evaluation'], function(v, key, list){
							if (v[0] == value)
								num = v[1]  
							}, this)
					// console.log(intent+attr+value)
					if (((labels[label]['actual_separated'].indexOf(intent)!=-1) && (labels[label]['actual_separated'].indexOf(attr)!=-1) && (labels[label]['actual_separated'].indexOf(value)!=-1)) ||
						((labels[label]['actual_separated'].indexOf(intent)!=-1) && (labels[label]['actual_separated'].indexOf(value)!=-1) && (parseFloat(num)>0.1)) || 
						((labels[label]['actual_separated'].indexOf(attr)!=-1) && (labels[label]['actual_separated'].indexOf(value)!=-1)))

						{


						_.each(labels[label]['labels_similarity_evaluation'], function(v, key, list){
							if (v[0] == value)
								num = v[1]  
							}, this)


						manyof.push([Hierarchy.joinJson([intent,attr,value]), parseFloat(num)])
						
						// possib.push(Hierarchy.joinJson([intent,attr,value]))
						}
					}

					if (manyof.length != 0)
				{
				manyof = _.sortBy(manyof, function(num){ return num[1]; });
			
					{possib.push(manyof.reverse()[0][0])}
				}
				}


				if (manyofattr.length != 0)
				{
				manyofattr = _.sortBy(manyofattr, function(num){ return num[1]; });
			
					{possib.push(manyofattr.reverse()[0][0])}
				}
			}


		console.log(label)
		labels[label]['joined'] = possib
		console.log(JSON.stringify(labels[label], null, 4))


		console.log("-----------------")
			currentStats.addCases(labels[label]['correct_gold_standard'], possib);
	}
		console.log("SUMMARY: "+currentStats.calculateStats().shortStats());

	}
if (naive)
	{

	dataset = [
			   "nlu_ncagent_turkers_negonlpncAMT.json"
			]
	data = []
	_.each(dataset, function(value, key, list){ 
		data = data.concat(JSON.parse(fs.readFileSync("datasets/Employer/"+value)))
	})

	repla = {"Leased Car": "car","7,000 NIS": "7000", "12,000 NIS":"12000", "20,000 NIS":"20000","Promotion Possibilities":"fast slow", "Without leased car":"without no car","Query": "how","Slow promotion track":"slow track","Fast promotion track":"fast track","10 hours": "10", "9 hours": "9", "8 hours": "8", "Working Hours": "hours", "Job Description": "job", "Greet": "hi", "60,000 USD": "60000", "90,000 USD": "90000", "120,000 USD":"12000"}

	bag_of_labels = []

	Observable = {}
	_.each(data, function(datum, key, list){
		datum.input = regexpNormalizer(datum.input)
		_.each(multilabelutils.normalizeOutputLabels(datum.output), function(label, key, list){				
			_.each(Hierarchy.splitJson(label), function(element, key, list){
				if (element in repla)
					{
					element = repla[element]
					list[key] = element
					}
				if ((element != "Accept") && (element != "Reject")&& (element != "No agreement")&& (element != "how"))
				//if ((element != "Reject"))
					bag_of_labels.push(element)
				// if (key==0)
				// 	if (!(element in Observable))
				// 			Observable[element] = {}
				// if (key==1)
				// 	if (!(element in Observable[list[key-1]]))
				// 			Observable[list[key-1]][element] = {}
				// if (key==2)
				// 	if (!(element in Observable[list[key-2]][list[key-1]]))
				// 			Observable[list[key-2]][list[key-1]][element] = {}

			}, this)
		}, this);
	}, this)

	bag_of_labels = _.uniq(bag_of_labels)
	labels = {}

	string_to_file = ""
		_.each(data, function(value, key, list){ 
			_.each(bag_of_labels, function(label, key, list){ 
				string_to_file = string_to_file +value.input+"&"+label+"&"+value.output+"\n"
				}, this)
			}, this)

	fs.writeFileSync("/tmp/toJava", string_to_file)

	var result = execSync("cd /home/com/SEMILAR-API-1.0/sim; java -jar /home/com/SEMILAR-API-1.0/sim/similar.jar")

	var stats = fs.readFileSync("/tmp/toNode", "utf8");
	stats=stats.split("\n")
	stats.pop()
	_.each(stats, function(value, key, list){
		// bag_of_labels = []
		text = value.split("&")

		for (mask in repla)
			if (repla[mask] == text[1])
				text[1] = mask 

			console.log(value)
		text[3] = JSON.parse("["+text[3]+"]")

		_.each(multilabelutils.normalizeOutputLabels(normalizeClasses(text[3])), function(value, key, list){
			_.each(Hierarchy.splitJson(value), function(lab, key, list){ 
				// bag_of_labels.push(lab)
					}, this) 
			}, this)

		if (!(text[0] in labels))
			{
			labels[text[0]] = {}
			labels[text[0]]['labels'] = []
			labels[text[0]]['correct'] = text[3]
			labels[text[0]]['expected']=[]
			labels[text[0]]['actual']=[]

			}

		labels[text[0]]['labels'].push([text[1],text[2]])
		if ((parseFloat(text[2]))>0)
			labels[text[0]]['actual'].push(text[1])

		labels[text[0]]['expected'] = _.uniq(labels[text[0]]['expected'].concat(bag_of_labels))

	}, this)

	var currentStats = new PrecisionRecall();

	for (label in labels)
	{
		currentStats.addCases(labels[label]['expected'], labels[label]['actual']);
	}
	console.log("SUMMARY: "+currentStats.calculateStats().shortStats());


	bag_of_labels = []

		Observable = {}
			for (label in labels)
			{
			_.each(multilabelutils.normalizeOutputLabels(labels[label]['correct']), function(lab, key, list){				
				_.each(Hierarchy.splitJson(lab), function(element, key, list){
					// if (element in repla)
					// 	{
					// 	element = repla[element]
					// 	list[key] = element
					// 	}
					bag_of_labels.push(element)
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
			}, this);
		// }, this)
		}



	var currentStats = new PrecisionRecall();

	for (label in labels)
		{
			possib = []
			for (intent in Observable)
			{
				if ((labels[label]['actual'].indexOf(intent)!=-1) && (intent == "Greet"))
				{
				possib.push(Hierarchy.joinJson([intent,true]))

				}
			// console.log(intent)
			for (attr in Observable[intent])
				{
				// console.log(attr)
				if (Object.keys(Observable[intent][attr]).length==0)
					if ((labels[label]['actual'].indexOf(intent)!=-1) && (labels[label]['actual'].indexOf(attr)!=-1))
						possib.push(Hierarchy.joinJson([intent,attr]))

				manyof = []
				for (value in Observable[intent][attr])
					{

					// console.log(intent+attr+value)
					// if ((labels[label]['actual'].indexOf(intent)!=-1) && (labels[label]['actual'].indexOf(attr)!=-1) && (labels[label]['actual'].indexOf(value)!=-1))
					
					if ((labels[label]['actual'].indexOf(attr)==-1) && (labels[label]['actual'].indexOf(value)!=-1))
					{

						_.each(labels[label]['labels'], function(v, key, list){
							if (v[0] == value)
								if  (parseFloat(v[1])>0.13)  {
									manyof.push([Hierarchy.joinJson([intent,attr,value]), parseFloat(v[1])])
								}
							}, this)

					}

					if ((labels[label]['actual'].indexOf(attr)!=-1) && (labels[label]['actual'].indexOf(value)!=-1))
					// if ((labels[label]['actual'].indexOf(value)!=-1) && (value != "No agreement"))

						{

						_.each(labels[label]['labels'], function(v, key, list){
							if (v[0] == value)
								num = v[1]  
							}, this)


						manyof.push([Hierarchy.joinJson([intent,attr,value]), parseFloat(num)])
						}


					}

				if (manyof.length != 0)
				{
				manyof = _.sortBy(manyof, function(num){ return num[1]; });
			
				// if ((manyof.length > 2) && (manyof.reverse()[0][0].indexOf("No agreement") != -1))
				// {
				// 	possib.push(manyof.reverse()[1][0])
				// }
				// else
					{possib.push(manyof.reverse()[0][0])}
				}
			}}
		console.log(label)
		console.log(labels[label])
		console.log(labels[label]['correct'])
		console.log(possib)
		console.log("-----------------")
			currentStats.addCases(labels[label]['correct'], possib);


		}

	console.log("SUMMARY: "+currentStats.calculateStats().shortStats());


	// console.log(JSON.stringify(labels, null, 4))
	process.exit(0)

	}
