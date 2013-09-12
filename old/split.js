/**
 * This code was used to split the dataset into 'easy' and 'hard' parts, for the sake of splitting the multi-label classification to single-label.
 * My experiments showed that, the split to 'easy' and 'hard' was not useful - it was best to split all data (including the 'easy'),
 * and train on both the trained single-label data and the multi-label data.  
 */
if (do_split) {
	console.log("\nSPLIT TO EASY AND HARD: ");
	var classifier = createNewClassifier();
	classifier.trainBatch(
			       JSON.parse(fs.readFileSync("datasets/Employer/Dataset0Grammar.json")).
			concat(JSON.parse(fs.readFileSync("datasets/Employer/Dataset1Woz1class.json"))));
	var datasets = mlutils.splitToEasyAndHard(classifier, JSON.parse(fs.readFileSync("datasets/Employer/Dataset2Woz.json")));
	console.log("Easy - "+datasets.easy.length+": ");
	console.log(mlutils.json.toJSON(datasets.easy));
	console.log("Hard - "+datasets.hard.length+": ");
	console.log(mlutils.json.toJSON(datasets.hard));
}
