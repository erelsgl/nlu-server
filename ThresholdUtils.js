//FIXME: maybe useless because in recent version string constant 'F1' 'Average' are in use

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
function F1_evaluation(stats, type_of_averaging) {
	if (type_of_averaging == 0)
	{
		if ((stats['TP'] == 0) || (stats['TP']+stats['FP'] == 0) || (stats['TP']+stats['FN'] == 0)) return 0

		var precision = stats['TP']/(stats['TP']+stats['FP'])
		var recall = stats['TP']/(stats['TP']+stats['FN'])

		var f1 = (precision*recall)/(precision + recall)
		return f1		
	}
}

 
module.exports = {
	F1_evaluation: F1_evaluation,
}

