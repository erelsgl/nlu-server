[Data]
File = datasets/Employer/Dataset1Woz1class.arff
TestSet = datasets/Employer/Dataset1Woz.arff

[Attributes]
Descriptive = 1-1266
Target = 1267-1324
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

