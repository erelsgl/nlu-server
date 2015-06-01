

var _ = require('underscore')._;
var fs = require('fs');
var execSync = require('execSync')

function wikipedia_pickclass(category)
{

	var stop = ["scientists", "history", "awards", "methodology", "area", " by ", " of ", 
	"literature", "lists", "writers", "organizations", "philosophy", "books", 
	"institutions", "concepts", "terminology", "research"]

	// var category = "40455234"
    var categories = {}

    var data = []
    var folder = __dirname+"/../../wiki/en/categories/"
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
            if ((value["buf"].length>0) && (value["res"]).length < 20)
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

    return childs

 //    console.log(JSON.stringify(childs, null, 4))

 //    var childsc = {}
 //    _.each(childs, function(value, key, list){
 //    	console.log(value) 

 //    	var catnames = _.map(value['res'], function(el){ return categories[el]['title'] })
 //    	// childs[key] = catnames
 //    	childsc[categories[key]['title']] = catnames
    	
 //    }, this)

 //    console.log(JSON.stringify(childsc, null, 4))

 //    console.log(JSON.stringify(Object.keys(childsc).length, null, 4))

	// process.exit(0)

}

module.exports = {
	wikipedia_pickclass: wikipedia_pickclass
} 
