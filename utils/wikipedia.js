

var _ = require('underscore')._;
var fs = require('fs');
var execSync = require('execSync')

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
	var prepared = __dirname+"/../../wiki/en/social/"
	var files = fs.readdirSync(json)
	files = _.filter(files, function(num){ return num.indexOf("json") != -1 })

	// category id -> category title
	// var categnames = {} 
	// subcategory id -> category id
	// var categmap = {}
	// _.each(categ, function(value, key, list){ 
		// categnames[value[0]] = key
		// _.each(value, function(elem, key1, list){
			// categmap[elem] = key 
		// }, this)
	// }, this)
	
	_.each(files, function(file, key, list){ 
		console.log(file)
		var new_data = JSON.parse(fs.readFileSync(json+file))
		new_data = _.filter(new_data, function(num){ return num["_category"]==0 })
		_.each(new_data, function(value, key, list){ 

			var inters = []

			var math = _.filter(_.toArray(categ), function(num){ 
					return _.intersection(value["categories"], num).length != 0 })

			if (math.length != 0)			
			{
				console.log("------")
			console.log(math)

			var inte = _.intersection(value["categories"], math[0])
			console.log(inte)
			}
			if (math.length == 1)
			{
				if (inters.length > 1)
				{
					console.log("more than 1")
					process.exit(0)
				}
				
				var text = value['text']
				text = text.replace(/\n/g," ")
				text = text.replace(/\*/g," ")
				text = text.replace(/\s{2,}/g, ' ')
				value['text'] = text
				value['categories'] =  inters

				if (!(inters[0] in data))
					data[inters[0]] = []

				data[inters[0]].push(value)
			}
		}, this)

	}, this)

	_.each(data, function(value, key, list){ 
		data[key] = _.sample(value, 200)
	}, this)

	var listo = []
	_.each(data, function(value, key, list){
		_.each(value, function(value1, key, list){ 
			fs.writeFileSync(prepared + value1["_id"], value1["text"], 'utf-8')
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
	check_cross:check_cross
} 
