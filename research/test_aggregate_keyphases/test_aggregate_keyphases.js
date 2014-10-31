var _ = require('underscore')._; 
var fs = require('fs');

// if (test_aggregate_keyphases)
// {
	var data = JSON.parse(fs.readFileSync("keyphases.08.2014.json"))
	var stats = {}

	_.each(data, function(item, key, list){ 
		_.each(item['labels'], function(values, label, list){
			if (!(label in stats)) 
					stats[label] = {}
 			// _.each(values, function(value, key, list){
 				if (!(_.isEqual(values,[''])))
 				// if (values.length > 0)
 					{
	 					_.each(values, function(value, key1, list){ 
							if (!(value in stats[label]))
								 stats[label][value] = []
							stats[label][value].push(item['sentence'])
	 						
	 					}, this)
 					}
	 					// stats[label] = stats[label].concat(values)

			 // }, this) 
		}, this)
	}, this)

	// console.log(stats)
	// process.exit(0)

	// _.each(stats, function(values, label, list){
		// stats[label] = _.countBy(values, function(num) { return num });
	// }, this)


	// var filename = "keyphases.csv"

	// fs.writeFileSync(filename, Object.keys(stats).join(";")+"\n", 'utf-8')

	// _(10).times(function(n){
	// 	var row = []
	// 	_.each(stats, function(values, label, list){
	// 		if (Object.keys(values).length>n-1) 
	// 			row.push(Object.keys(values)[n])
	// 		else
	// 			row.push('')
	// 	}, this)
	// 	fs.appendFileSync(filename, row.join(";")+"\n", 'utf-8')
	// })
	
	var filenamehtml = "keyphases.09.2014.html"
	fs.writeFileSync(filenamehtml, "<html>", 'utf-8')
	fs.appendFileSync(filenamehtml, "<head>", 'utf-8')
	fs.appendFileSync(filenamehtml, "<style>ul li ul { display: none; }</style>", 'utf-8')
	
	fs.appendFileSync(filenamehtml, "<script src='http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js'></script>\n",'utf-8')
	fs.appendFileSync(filenamehtml, "</head>", 'utf-8')
	fs.appendFileSync(filenamehtml, "<body>", 'utf-8')
	fs.appendFileSync(filenamehtml, "<script>$(document).ready(function() { $('.list > li a').click(function() {$(this).parent().find('ul').toggle();});});</script>\n", 'utf-8')

	fs.appendFileSync(filenamehtml, "set size "+data.length+" utterances<br>", 'utf-8')
	fs.appendFileSync(filenamehtml, "date of the report "+new Date().toJSON().slice(0,10)+"<br>", 'utf-8')

	fs.appendFileSync(filenamehtml, "<table border=\"1\" style=\"white-space: pre-wrap;\">", 'utf-8')

	// var stats1 = _.sortBy(stats, function(num){ return _.flatten(_.values(num)).length; });

	var sorted = []
	_.each(stats, function(value, key, list){ 
		sorted.push([key,_.flatten(_.values(value)).length])
	}, this)

	var sortedindex = _.sortBy(sorted, function(num){ return num[1]; }).reverse()

	_.each(sortedindex, function(key, labelar, list){

		var label = key[0]
		var keylist = stats[label]

		// console.log(key)
		// process.exit(0)

		// console.log(keylist)
		// process.exit(0)

		var tolist = _.pairs(keylist)
		var sum = _.reduce(tolist, function(memo, num){ return memo + num[1].length; }, 0);
		fs.appendFileSync(filenamehtml, "<tr><td><b>"+label+"</b></td><td>"+sum+"</td></tr>", 'utf-8')
		// fs.appendFileSync(filenamehtml, "<ul class='list'><li><a>"+label+"</a><ul><li>adda</li><li>ssss</li></ul></li></ul>", 'utf-8')

		tolist = _.sortBy(tolist, function(num){ return num[1].length; });
		_.each(tolist.reverse(), function(value, key, list){ 
			// fullist = ""
			// _.each(list, function(value, key, list){ 

			// }, this)
			fs.appendFileSync(filenamehtml, "<tr><td><ul class='list'><li><a>"+value[0]+"</a><ul><il>"+value[1].join("</il><br><il>")+"</il></ul></il></ul></td><td>"+value[1].length+"</td></tr>", 'utf-8')
		}, this)
	}, this)

	fs.appendFileSync(filenamehtml, "</table>", 'utf-8')
	fs.appendFileSync(filenamehtml, "</body></html>", 'utf-8')

	console.log(stats)
	process.exit(0)
// }
 

