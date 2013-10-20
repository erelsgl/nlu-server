/**
 * Static Utilities for serializing and deserializing hierarchies of objects.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-10
 */


/**
 * Serialize a full object to a string.
 * @param object the object to serialize.
 * @param createNewObjectFunction [optional] a function for creating a fresh object (without the data). This function will be saved verbatim in the file, in order to reproduce the exact type of the Object.
 * @return A nicely-formatted string, that can be saved to a text file. 
 */
exports.toString = function(object, createNewObjectFunction) {
	var json = exports.toJSON(object,createNewObjectFunction);
	var string = JSON.stringify(json, null, "\t");
	return string;
}

/**
 * Serialize a full object to a JSON object.
 * @param object the object to serialize.
 * @param createNewObjectFunction [optional] a function for creating a fresh object (without the data). This function will be saved verbatim in the file, in order to reproduce the exact type of the Object.
 * @return A JSON object that contains the given object and the createNewObject function. 
 */
exports.toJSON = function(object, createNewObjectFunction) {
	// convert the function to a string that can be evaluated later, at load time, to create a fresh object
	if (!object)
		throw new Error("object is undefined");
	var createNewObjectString = null;
	if (object.createNewObjectString)
		createNewObjectString = object.createNewObjectString;
	else if (object.createNewObjectFunction) 
		createNewObjectString = object.createNewObjectFunction.toString();
	else if (createNewObjectFunction)
		createNewObjectString = createNewObjectFunction.toString();
	else
		throw new Error("createNewObjectFunction should be present either as a field of the Object or as a separate parameter!");

	var objectJson;
	if (object.toJSON) {  // If there is a custom toJSON function, use it:
		objectJson = object.toJSON();
	} else {              // Otherwise, just copy the object as it is:
		objectJson = object;
	}

	var json = {
		createNewObjectString: createNewObjectString,
		object: objectJson,
	};
	return json;
}

/**
 * Load a trained Object from a string.
 * @param string a string created by serialize.toString.
 * @param dirname (optional) replacement for the __dirname strings in the createNewObjectFunction, to make it work from different folders.
 * @return the original object used to create "string".
 */
exports.fromString = function(string, dirname) {
	var json = JSON.parse(string);
	return exports.fromJSON(json, dirname);
}

	
/**
 * Load a trained Object from a JSON object.
 * @param json a JSON object created by serialize.toJSON.
 * @param dirname (optional) replacement for the __dirname strings in the createNewObjectFunction, to make it work from different folders.
 * @return the original object used to create "string".
 */
exports.fromJSON = function(json, dirname) {
	if (!json)
		throw new Error("json is undefined");
	if (!dirname)
		throw new Error("dirname is undefined");
	if (!json.createNewObjectString) {
		console.dir(json);
		throw new Error("Cannot find createNewObjectString in string");
	}
	
	// add context to the 'require' statements:
	if (dirname) dirname = dirname.replace(/\\/g, "\\\\");   // for Windows
	var createNewObjectString = json.createNewObjectString.replace(/__dirname/g, "'"+dirname+"'");
	createNewObjectString = "("+createNewObjectString+")";
	var createNewObjectFunction = eval(createNewObjectString);
	try {
		var newObject = createNewObjectFunction();
	} catch (error) {
		console.log("createNewObjectString: "+createNewObjectString);
		console.log("dirname: "+dirname);
		throw new Error("Error in creating new Object from function in string: "+error);
	}
	
	if (!newObject) {
		console.dir(json);
		throw new Error("Cannot create new Object from function in string");
	}
	newObject.createNewObjectString = json.createNewObjectString;
	newObject.createNewObjectFunction = createNewObjectFunction;
	
	
	if (newObject.fromJSON) {   // If there is a custom fromJSON function, use it:
		newObject.fromJSON(json.object);
	} else {                    // Otherwise, use the default fromJSON - just copy all fields:
		for (var key in json.object) {
			newObject[key] = json.object[key];
		}
	}
	return newObject;
}


/**
 * Save a trained Object to a string, then reload the string to a new Object, and make sure both Objects return the same results on a test set.
 * @param object This is the trained Object itself. It should have "toJSON" and "fromJSON" functions (but if "toJSON" is not present, then the object itself will be saved).
 * @param createNewObjectFunction [optional] a function for creating a new (untrained) Object. This function will be saved verbatim in the file, in order to reproduce the exact type of the Object.
 * @param dirname  the base folder for the "require" statements in the create-new-Object function.
 * @param testSet an array of {input: ... , output: ...} pairs, for testing the Object before and after reload.
 * @param explain (int) if positive, also compare the explanations.
 * @return A nicely-formatted string. Can be saved directly to a file. 
 */
exports.toStringVerified = function(Object, createNewObjectFunction, dirname, testSet, explain) {
	var should = require("should");
	var resultsBeforeReload = [];
	
	for (var i=0; i<testSet.length; ++i) {
		var actualClasses = Object.classify(testSet[i].input, explain);
		resultsBeforeReload[i] = actualClasses;
	}

	var string = exports.toString(Object, createNewObjectFunction);
	
	var Object2 = exports.fromString(string, dirname);
	
	for (var i=0; i<testSet.length; ++i) {
		var actualClasses = Object2.classify(testSet[i].input, explain);
		if (explain>0) {
			actualClasses.classes.should.eql(resultsBeforeReload[i].classes);
			actualClasses.explanation.should.eql(resultsBeforeReload[i].explanation);
		} else {
			actualClasses.should.eql(resultsBeforeReload[i]);
		}
	}
	
	return string;
}
