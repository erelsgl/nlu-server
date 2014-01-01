# Natural Language Understanding server

A server that supplies web-services for NLU (Natural Language Understanding) and NLG (Natural Language Generation) for a negotiation agent.

Tested on Ubuntu 12.04.

Powered by [Limdu](http://erelsgl.github.io/limdu).

## Installation

	git clone https://github.com/erelsgl/nlu-server.git
	cd nlu-server
	npm install
	npm test


## Configuration

Open the file **classifiers.js**. Select the classifier you want to use (at the bottom), or create a new classifier.


## Training

Open the file **train.js**. Edit the flags (at the top). Edit the datasets or. Run and watch the performance results.

Check the "trainedClassifiers/Employer" and  "trainedClassifiers/Candidate" folders. Each should contain a *new* file - MostRecentClassifier.json - that contains the trained classifier.

These folders MAY also contain another file - RetrainedClassifier.json - from a previous run of the server. If this file exists, it takes precedence over the MostRecentClassifier.json . 
If you want to use your MostRecentClassifier, delete the RetrainedClassifier. 


## Running

	node servertranslate

Wait several seconds until the server loads the classifiers.


## Web access

	http://localhost:9995
