/**
 * a unit-test for Graph unit
 * 
 * @since 2014-05
 */

var should = require('should');
var natural = require('natural');
var cheapest_paths = require('limdu/node_modules/graph-paths').cheapest_paths;

var _ = require('underscore');

describe('Graph methods', function() {
	
	it('calculate correctly', function() {
	
	var EdgeWeightedDigraph = natural.EdgeWeightedDigraph;
	var digraph = new EdgeWeightedDigraph();
	
	digraph.add(1,3,0.29);
	digraph.add(1,6,0);
	digraph.add(3,6,0);

	var ShortestPathTree = natural.ShortestPathTree;
	var spt = new ShortestPathTree(digraph, 1);
	var path = spt.pathTo(6);

	_.isEqual(path,[1,6]).should.equal(true)

	var costs = [
    [0,Infinity,0.29,Infinity,Infinity,0],
    [Infinity,0,Infinity,Infinity,Infinity,Infinity],
    [Infinity,Infinity,0,Infinity,Infinity,0],
    [Infinity,Infinity,Infinity,0,Infinity,Infinity],
    [Infinity,Infinity,Infinity,Infinity,0,Infinity],
    [Infinity,Infinity,Infinity,Infinity,Infinity,0],
	];

	var cheapest_paths_from_0 = cheapest_paths(costs, 0);
	_.isEqual(cheapest_paths_from_0[cheapest_paths_from_0.length-1],{cost: 0,path: [ 0, 5 ]}).should.equal(true)

	})

	it('calculate correctly', function() {
	
	var EdgeWeightedDigraph = natural.EdgeWeightedDigraph;
	var digraph = new EdgeWeightedDigraph();
	
	// digraph.add(1,3,0.29);
	// digraph.add(1,6,0.1);
	digraph.add(1,3,1)	
	digraph.add(3,4,1)
	digraph.add(4,6,3)

	digraph.add(1,3,0)
	digraph.add(3,5,0)
	digraph.add(5,6,1)

	var ShortestPathTree = natural.ShortestPathTree;
	var spt = new ShortestPathTree(digraph, 1);
	var path = spt.pathTo(6);

	console.log(path)
	// process.exit(0)
	// _.isEqual(path,[1,6]).should.equal(true)

	})


	// digraph.add(1,1,0);
	// digraph.add(1,2,0.35);
	// digraph.add(1,3,0.29);
	// digraph.add(1,4,0);
	// digraph.add(1,5,0.93);
	// digraph.add(1,6,0);

	// digraph.add(2,2,0);
	// digraph.add(2,3,0);
	// digraph.add(2,4,0);
	// digraph.add(2,5,0.32);
	// digraph.add(2,6,0);

	// digraph.add(3,3,0);
	// digraph.add(3,4,0);
	// digraph.add(3,5,0.40);
	// digraph.add(3,6,0);

	// digraph.add(4,4,0);
	// digraph.add(4,5,0);
	// digraph.add(4,6,0.52);

	// digraph.add(5,5,0);
	// digraph.add(5,6,0);

	// digraph.add(6,6,0);

	// digraph.add(1,2,1);
	// digraph.add(2,3,1);
	// digraph.add(1,3,3);

})
