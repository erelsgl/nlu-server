/* Utilities for creating beeps. Currently works on Chrome only. */
//https://github.com/ejci/Chrome-Audio-EQ/issues/24

if (window.audioContext || window.webkitAudioContext) {
//if (window.audioContext) {
	var audioContext = new(window.audioContext || window.webkitAudioContext);
	//var audioContext = new(window.audioContext);
}

/**
 * @param type - type of beep (0 to 4).
 * @param millis- duration of beep, in milliseconds.
 */
function beep(type, millis) {
	if (audioContext) {
		var oscillator = audioContext.createOscillator();
		oscillator.type = type;   // 0-4 are valid sound types
		oscillator.connect(audioContext.destination);
//		oscillator.noteOn(0);
		oscillator.start(0);
		setTimeout(function () {
//			oscillator.noteOff(0);
			oscillator.stop(0);
		}, millis /*milliseconds*/);
	}
}
