/**
 * utility functions for Threshold.
 */

/** type_of_averaging = [0,1]

type_of_averaging=0 microaveraging
type_of_averaging=1 macroaveraging

currently only microaveraging variant is implemented

please note, if ((tp == 0) || (tp+fp == 0) || (tp+fn == 0)) return 0
it means if there is impossible to evaluate F1 measure it returs the worse F1 measure which is 0

@author Vasily Konovalov

*/
function F1_evaluation(status_list, type_of_averaging) {
	if (type_of_averaging == 0)
	{
		var tp=0
		var fp=0
		var fn=0
		for (elem in status_list)
		{
			tp += status_list[elem]['TP'].length
			fp += status_list[elem]['FP'].length
			fn += status_list[elem]['FN'].length
		}
		if ((tp == 0) || (tp+fp == 0) || (tp+fn == 0)) return 0

		var precision = tp/(tp+fp)
		var recall = tp/(tp+fn)

		var f1 = (precision*recall)/(precision + recall)
		return f1		
	}
}
 
module.exports = {
	F1_evaluation: F1_evaluation,
}

