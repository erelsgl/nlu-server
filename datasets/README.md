# Datasets folder

This folder contains datasets that we collected during experiments with agents.

They are organized according to the classifier used:

* Employer folder - for games where the human played the employer;
* Candidate folder - for games where the human played the candidate.

Each folder contains the following files:
* NegotiationGrammar*.txt - a description of a SCFG (Synchronous Context-Free Grammar) used for generating a single natural-language sentence and its corresponding semantic representation.
* 0_grammar.json - a dataset generated from that SCFG.
* 1_woz_kbagent_students.json - an old dataset, collected in 2012, in a WOZ experiment between the KBAgent and Israeli students.
* 1_woz_kbagent_students1class.json - the same dataset, split to single-label sentences.
* 2_experts.json - old dataset from various sources, tagged by experts. 
* 2_experts1class.json - the same dataset, split to single-label sentences.
* 3_woz_kbagent_turkers_negonlp2.json - a dataset collected in a WOZ experiment between the KBAgent and American Amazon Mechanical Turkers. The GUI code was negonlp2.
* 4_various.json - a dataset collected in various experiments, including human-human experiments.
* 4_various1class.json - the same dataset, split to single-label sentences.

The Employer folder contains more datasets collected in the most recent experiment (in the most recent experiment, the humans always played as employers).

You can use the file **analyze_dataset.js** to analyze each of the datasets (this is not documented yet).
