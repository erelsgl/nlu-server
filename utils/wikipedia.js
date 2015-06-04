

var _ = require('underscore')._;
var fs = require('fs');

function normalizer(sentence) {

	sentence = sentence.replace(/^.+?(?=[A-Z])/g, "");
	sentence = sentence.replace(/\[.*\]/g, "");
	sentence = sentence.replace(/<.*>/g, "");
	sentence = sentence.replace(/See\s.*(?=\.)/g, "");
	sentence = sentence.replace(/(collapsible|infobox|hatnote|sidebar|citation)/g, "");

	sentence = sentence.replace(/\n/g," ")
	sentence = sentence.replace(/\*/g," ")
	sentence = sentence.replace(/\s{2,}/g, ' ')
	
	return sentence
}

function load_wikipedia(folder)
{
	var data = []
	var path = __dirname+"/../../wiki/en/"+folder+"/"
	var jsonpath = path + "json/"
	var parsedpath = path + "parsed/"
	var readydpath = path + "ready/"
    var files = fs.readdirSync(jsonpath)
    
     _.each(files, function(file, key, list){

     	if (key % 1000 == 0)
     		console.log(key)

     	var fdata = JSON.parse(fs.readFileSync(jsonpath+file))
        fdata['CORENLP'] = JSON.parse(fs.readFileSync(parsedpath+file+".json"))
        data.push(fdata)

    }, this)

     return data
}

function load_category(folder)
{
	var categories = {}

    var data = []
    var files = fs.readdirSync(folder)

    files = _.filter(files, function(num){ return num.indexOf("json") != -1 })

    _.each(files, function(file, key, list){
        console.log(file)
        var new_data = JSON.parse(fs.readFileSync(folder+file))
        _.each(new_data, function(record, key, list){
            if (record["id"] in categories)
                    process.exit(0)

            categories[record["id"]] = record

        }, this)
    }, this)

    return categories
}

function check_cross(childsc, categories)
{
	console.log("cross dependencies")

	_.each(childsc, function(value, key, list){ 
    	_.each(childsc, function(value1, key1, list){
    		if (key != key1)
    		{
    			var inter = _.intersection(value, value1)
    			if (inter.length != 0)
    			{
    				console.log(key)
    				console.log(key1)
    				console.log(inter)
    				console.log(categories[inter[0]]["title"])
    			}
    		} 
    	}, this)

    }, this)
}

function wikipedia_pickclass(categories, category)
{

	var stop = ["scientists", "history", "awards", "methodology", "area", " by ", " of ", 
	"literature", "lists", "writers", "organizations", "philosophy", "books", 
	"institutions", "concepts", "terminology", "research"]

	// var category = "40455234"
    
    console.log("fullfiled")

    var childs = {}

    _.each(categories[category]["child"], function(value, key, list){
            if (value[2] in childs)
                    process.exit(0)

            var mat = _.filter(stop, function(num){ return value[0].toLowerCase().indexOf(num) != -1 });

            if (mat.length == 0)
	 			childs[value[2]] = {'buf':[value[2]], 'res':[]}
    }, this)

    var buf = _.flatten(_.pluck(_.toArray(childs),"buf"))

    var ent = true
    console.log(buf)
    console.log(childs)
    

    while ((buf.length > 0)&&(ent)) {

        ent = false
        _.each(childs, function(value, cat, list){

            // if ((value["buf"].length>0) && (_.toArray(value["res"]).length < 20))
            if ((value["buf"].length>0) && (value["res"]).length < 30)
            {
                    ent = true
        
                    var ress = _.map(categories[value["buf"][0]]["child"], function(value){ return [value[0], value[2]] })


                    var ressfil = []
                   	_.each(ress, function(value, key, list){ 
          				var mat = _.filter(stop, function(num){ return value[0].toLowerCase().indexOf(num) != -1 })
          				
          				if (mat.length == 0)
          					ressfil.push(value[1])

                   	}, this)


                    childs[cat]["buf"] = childs[cat]["buf"].concat(ressfil)
                    childs[cat]["res"].push(childs[cat]["buf"][0])
                    childs[cat]["buf"] = childs[cat]["buf"].slice(1)
                    childs[cat]["buf"] = _.unique(childs[cat]["buf"])

                    // childs[cat]["buf"] = _.difference(childs[cat]["buf"], _.toArray(childs[cat]["res"]))
                    // childs[cat]["buf"] = _.difference(childs[cat]["buf"], childs[cat]["res"])
            }

        }, this)

        var buf = _.flatten(_.pluck(_.toArray(childs),"buf"))
        // console.log(buf.length)
    }

   	var childsc = {}

  	_.each(childs, function(value, key, list){ 
  		childsc[categories[key]["title"]] = value['res']
    }, this)    


    _.each(childsc, function(value, key, list){ 
    	_.each(childsc, function(value1, key1, list){
    		if (key != key1)
    		{
    			var inter = _.intersection(value, value1)
    			_.each(inter, function(dep, key2, list){
    				childsc[key] = _.without(value, dep)
    				childsc[key1] = _.without(value1, dep)
    			}, this)
    		} 
    	}, this)
    }, this)

    return childsc

 //    console.log(JSON.stringify(childs, null, 4))

 //    var childsc = {}
 //    _.each(childs, function(value, key, list){
 //    	console.log(value) notempl

 //    	var catnames = _.map(value['res'], function(el){ return categories[el]['title'] })
 //    	// childs[key] = catnames
 //    	childsc[categories[key]['title']] = catnames
    	
 //    }, this)

 //    console.log(JSON.stringify(childsc, null, 4))

 //    console.log(JSON.stringify(Object.keys(childsc).length, null, 4))

	// process.exit(0)

}

function wikipedia_prepared(categ)
{

	var data = {}
	var json = __dirname+"/../../wiki/unparsed1/"
	var prepared = __dirname+"/../../wiki/en/social/prepared/"
	var dirjson = __dirname+"/../../wiki/en/social/json/"
	var files = fs.readdirSync(json)
	files = _.filter(files, function(num){ return num.indexOf("json") != -1 })

	// category id -> category title
	var categnames = {} 
	// subcategory id -> category id
	var categmap = {}
	var categkey = {}
	_.each(categ, function(value, key, list){ 
		categnames[value[0]] = key
		_.each(value, function(elem, key1, list){
			categmap[elem] = key 
			categkey[elem] = value[0] 
		}, this)
	}, this)

	console.log(categmap)

	var allcat = _.flatten(_.toArray(categ))
	
	_.each(files, function(file, key, list){ 
		console.log(file)
		var new_data = JSON.parse(fs.readFileSync(json+file))
		new_data = _.filter(new_data, function(num){ return num["_category"]==0 })
		_.each(new_data, function(value, key, list){ 

			if (_.intersection(allcat, value["categories"]).length==1)
			{

				var inters = []

				var math = _.filter(_.toArray(categ), function(num){ 
						return _.intersection(value["categories"], num).length != 0 })

				if (math.length == 1)
				{
				
					var inters = _.intersection(value["categories"], math[0])

					if (inters.length == 1)
					{
						
						if (value['text'].length < 3000)
						{
							
							var cl = categmap[inters[0]]

							value['text'] = normalizer(value['text'])
							value['wikicategories'] =  value['categories']
							value['catid'] =  [categkey[inters[0]]]
							value['catname'] =  [cl]

							if (!(cl in data))
								data[cl] = []

							data[cl].push(value)
						}
					}
				}
			}
		}, this)
	}, this)

	console.log("sorting")

	_.each(data, function(value, key, list){ 
		value = _.sortBy(value, function(num){ return num["wikicategories"].length })
		data[key] = value.slice(0,500)
	}, this)

	console.log("writing")

	var listo = []
	_.each(data, function(value, key, list){
		_.each(value, function(value1, key, list){ 
			fs.writeFileSync(prepared + value1["_id"], value1["text"], 'utf-8')
			fs.writeFileSync(dirjson + value1["_id"], JSON.stringify(value1, null, 4), 'utf-8')
			listo.push(prepared+value1["_id"])
		 }, this) 
	}, this)

	_.each(data, function(value, key, list){ 
		console.log(key)
		console.log(value.length)
		console.log("-------------")
	}, this)

	fs.writeFileSync(prepared + "list", listo.join("\n"), 'utf-8')

	process.exit(0)
}


module.exports = {
	wikipedia_pickclass: wikipedia_pickclass,
	wikipedia_prepared:wikipedia_prepared,
	load_category:load_category,
	check_cross:check_cross,
	normalizer:normalizer,
	load_wikipedia:load_wikipedia
} 
