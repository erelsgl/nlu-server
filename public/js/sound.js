/* Utilities for creating beeps. Currently works on Chrome only. */

if (window.audioContext || window.webkitAudioContext) {
	var audioContext = new(window.audioContext || window.webkitAudioContext);
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
		oscillator.noteOn(0);
		setTimeout(function () {
			oscillator.noteOff(0);
		}, millis /*milliseconds*/);
	}
}
