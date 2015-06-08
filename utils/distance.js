/**
 * Utilities common to kNN
 */

var _ = require('underscore')._
var bars = require('./bars.js')

function euclidean_distance(a, b) {
  if (!isVectorNumber(a) || !isVectorNumber(b))
    throw new Error("Vectors should be consist of numbers " + JSON.stringify(a) + " " +JSON.stringify(b))

  if (a.length != b.length)
    throw new Error("Vectors should be of the same size " + JSON.stringify(a.length) + " " +JSON.stringify(b.length))

	var sum = 0;
	var n;
  	for (n=0; n < a.length; n++) {
   		sum += Math.pow(a[n]-b[n], 2);
  	}
  	return Math.sqrt(sum);
}

function vec_minus(a, b) {
  if (!isVectorNumber(a) || !isVectorNumber(b))
    throw new Error("Vectors should be consist of numbers " + JSON.stringify(a) + " " +JSON.stringify(b))

  if (a.length != b.length)
    throw new Error("Vectors should be of the same size " + JSON.stringify(a.length) + " " +JSON.stringify(b.length))

  var output = []
    for (n=0; n < a.length; n++) {
      if (bars.isNumber(a[n]) && bars.isNumber(b[n]))
        output.push(b[n] - a[n])
    }
    return output
}

function average(a) {
  if (!isVectorNumber(a))
    throw new Error("Vectors should be consist of numbers " + JSON.stringify(a))

  var output = 0
    for (n=0; n < a.length; n++) {
      output += a[n]
    }
    return output/a.length
}

function dot_distance(a, b) {
  if (!isVectorNumber(a) || !isVectorNumber(b))
    throw new Error("Vectors should be consist of numbers " + JSON.stringify(a) + " " +JSON.stringify(b))

  if (a.length != b.length)
    throw new Error("Vectors should be of the same size " + JSON.stringify(a.length) + " " +JSON.stringify(b.length))

	var sum = 0;
	var n;
  	for (n=0; n < a.length; n++) {
   		sum += a[n]*b[n]
  	}
  	return sum
}

function manhattan_distance(a, b) {
  if (!isVectorNumber(a) || !isVectorNumber(b))
    throw new Error("Vectors should be consist of numbers " + JSON.stringify(a) + " " +JSON.stringify(b))

  if (a.length != b.length)
    throw new Error("Vectors should be of the same size " + JSON.stringify(a.length) + " " +JSON.stringify(b.length))

	var sum = 0;
	var n;
  	for (n=0; n < a.length; n++) {
   		sum += Math.abs(a[n]-b[n])
  	}
  	return sum
}

function chebyshev_distance(a, b) {
  if (!isVectorNumber(a) || !isVectorNumber(b))
    throw new Error("Vectors should be consist of numbers " + JSON.stringify(a) + " " +JSON.stringify(b))

  if (a.length != b.length)
    throw new Error("Vectors should be of the same size " + JSON.stringify(a.length) + " " +JSON.stringify(b.length))
  
  var sum = 0;
	var n;
	var max = 0
  	for (n=0; n < a.length; n++) {
   		var cur = Math.abs(a[n]-b[n])
   		if (cur > max)
   			max = cur
  	}
  	return max
}

// metric measure the same words
function and_distance(a, b) {
  if (!isVectorNumber(a) || !isVectorNumber(b))
    throw new Error("Vectors should be consist of numbers " + JSON.stringify(a) + " " +JSON.stringify(b))

  if (a.length != b.length)
    throw new Error("Vectors should be of the same size " + JSON.stringify(a.length) + " " +JSON.stringify(b.length))

  var sum = 0;
  var n;
    for (n=0; n < a.length; n++) {
      sum += ((a[n] > 0) && (b[n]>0) ? 1 : 0);
    }
    return 1/sum
}

function cosine_distance(a, b) {
  if (!isVectorNumber(a) || !isVectorNumber(b))
    throw new Error("Vectors should be consist of numbers " + JSON.stringify(a) + " " +JSON.stringify(b))

  if (a.length != b.length)
    throw new Error("Vectors should be of the same size " + JSON.stringify(a.length) + " " +JSON.stringify(b.length))

  var norm1 = 0 
  var norm2 = 0 

  for (n=0; n < a.length; n++) {
    norm1 += a[n]*a[n]
    norm2 += b[n]*b[n]
    }
  
    return 1/(dot_distance(a,b)/(Math.sqrt(norm1)*Math.sqrt(norm2)))
}

function pcosine_distance(a, b) {
  return (cosine_distance(a,b)+1)/2
}

function isVectorNumber(a) {
  var n;
  for (n=0; n < a.length; n++) {
   if (isNaN(parseFloat(a[n])) || !isFinite(a[n]))
    return false
  }
  return true
}

function Add(target, substitute, context) {
 
  if (context.length > 0)
    context = _.filter(context, function(num){ return num.length>0 });
  
  var sum = _.reduce(context, function(memo, num){ return memo + cosine_distance(substitute, num) }, 0);
  
  return (cosine_distance(substitute, target) + sum)/(context.length + 1)
}

function BalAdd(target, substitute, context) {
 
  if (context.length > 0)
    context = _.filter(context, function(num){ return num.length>0 });
  
  var sum = _.reduce(context, function(memo, num){ return memo + cosine_distance(substitute, num) }, 0);
   
  return (cosine_distance(substitute, target) * context.length + sum)/(2*context.length )
}

function Mult(target, substitute, context) {
  
  if (context.length > 0)
    context = _.filter(context, function(num){ return num.length>0 });
 
  var prod = _.reduce(context, function(memo, num){ return memo * pcosine_distance(substitute, num) }, 1);

  return Math.pow(prod * pcosine_distance(substitute, target), 1/(context.length+1))
}

function BalMult(target, substitute, context) {
  
  if (context.length > 0)
    context = _.filter(context, function(num){ return num.length>0 });
 
  var prod = _.reduce(context, function(memo, num){ return memo * pcosine_distance(substitute, num) }, 1);

  return Math.pow(prod * Math.pow(pcosine_distance(substitute, target), context.length), 2 * context.length)
}

module.exports = {
  euclidean_distance:euclidean_distance,
  cosine_distance:cosine_distance,
  and_distance:and_distance,
  chebyshev_distance:chebyshev_distance,
  manhattan_distance:manhattan_distance,
  dot_distance:dot_distance,
  euclidean_distance:euclidean_distance,
  Add:Add,
  BalAdd:BalAdd,
  Mult:Mult,
  BalMult:BalMult,
  average:average,
  vec_minus: vec_minus,
  isVectorNumber:isVectorNumber
}
