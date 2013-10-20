serialize
=========

Serialize Javascript object hierarchies that contain multiple types and functions.

This library was built with the following use-case in mind:

You have a complex classifier, such as in the [limud.js](https://github.com/erelsgl/limdu) framework. 
For example, it may be a hierarchical multi-label classifier, based on a binary classifier, with a custom feature extractor.

You want to train the classifier on your computer, and use the trained classifier on another machine.
The another machine may be, for example, a web-server that uses the trained classifier to classify new
samples on demand. 

So, you would like to save the trained classifier to a file, then transfer the file to the remote server,
and then read the classifier from the file on that remote server.

Unfortunately, this task is not natively supported in Node.js. The native Node.js serialization
mechanism is JSON.stringify/JSON.parse, but, these functions handle only data fields - not functions 
or class prototypes.

This library suggests the following solution (pseudo-code).

On the home machine:

	function createNewClassifier() {
		// Write code to create a fresh  (untrained) classifier.
		// This code should be stand-alone - it should include all the 'require' statements
		//   required for creating the classifier.
		// Use "__dirname" to refer to the current folder, 
		//   so that the result will be able to run on another folder. 
	}
	
	var myClassifier = createNewClassifier();

	myClassifier.train(dataset);
	
	var serialize = require('serialize'); // require the current package
	
	var myClassifierString = serialize.toString(myClassifier, createNewClassifier);
	
	// save myClassifierString to a file, and send to the remote server.
	// the createNewClassifier function is also saved.

On the remote server:

	var myClassifierString = // read from file
	
	var serialize = require('serialize'); // require the current package

	var baseFolder = __dirname; // this comes in place of the "__dirname"s in createNewClassifier 

	var myClassifier = serialize.fromString(myClassifierString, baseFolder);
	
	myClassifier.classify(sample);

The demos folder contains two working demos (demo1 and demo2), and one non-working demo (demo3) that is left for future work.