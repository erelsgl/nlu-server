// Utilities for creating and displaying a timer

exports.Timer = function(startTimeSeconds, stepSeconds, endTimeSeconds, callback) {
		if (stepSeconds===0)
			throw new Error("Cannot start a timer with a zero step");
		this.startTimeSeconds = startTimeSeconds;
		this.currentTimeSeconds = startTimeSeconds;
		
		// make sure the step is in the right direction, to prevent endless loop:
		if ((endTimeSeconds>startTimeSeconds) != (stepSeconds>0))
			this.stepSeconds = -stepSeconds;

		var theTimerObject = this;
		this.interval = setInterval(function() {
				theTimerObject.currentTimeSeconds += stepSeconds;
				if ((stepSeconds>0 && theTimerObject.currentTimeSeconds>endTimeSeconds) ||
				   (stepSeconds<0 && theTimerObject.currentTimeSeconds<endTimeSeconds) )
						theTimerObject.stop();
				callback(theTimerObject.currentTimeSeconds);
		}, Math.abs(stepSeconds)*1000);
}

exports.Timer.prototype.remainingTimeSeconds = function() {
	return this.currentTimeSeconds;
}

exports.Timer.prototype.timeFromStartSeconds = function() {
	return this.startTimeSeconds - this.currentTimeSeconds;
}

exports.Timer.prototype.isRunning = function() {
	return (this.interval!==null);
};
exports.Timer.prototype.reset = function() {
	this.currentTimeSeconds = this.startTimeSeconds;
}

exports.Timer.prototype.stop = function() {
	if (this.interval) {
		clearInterval(this.interval);
		this.interval=null;
	}
};




/**
 * @return the current time, as a string, format mm:ss
 */
exports.timeToString = function(time) {
		if (time<0)
			time = 0;
		var mins = Math.floor(time / 60);
		var secs = time - mins*60;
		if (secs < 10)
			secs = "0" + secs;
		return (mins + ":" + secs);
};
