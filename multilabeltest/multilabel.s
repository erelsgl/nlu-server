[Data]
File = multilabel.train.arff
TestSet = multilabel.test.arff

[Attributes]
Descriptive = 1-8
Target = 9-15
Weights = 1
ClusteringWeights = 1.0

[Model]
MinimalWeight=1

[Tree]
% Heuristic = VarianceReduction
% Heuristic = GainRatio
Heuristic = Default
PruningMethod=None

[Ensemble]
EnsembleMethod = RForest
Iterations=100

% VotingType = Majority
VotingType = ProbabilityDistribution

PrintAllModels = Yes
% FeatureRanking = Yes

[Output]
WritePredictions = {Test}

