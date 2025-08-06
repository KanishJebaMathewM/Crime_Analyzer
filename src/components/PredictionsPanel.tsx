import React, { useState, useMemo, useEffect } from 'react';
import { CrimeRecord } from '../types/crime';
import { 
  AdvancedAIEngine, 
  createPredictionFeatures, 
  createAIEngine,
  EnsemblePrediction,
  AnomalyDetection,
  PatternRecognition 
} from '../utils/aiEngine';
import { 
  performAdvancedAnalytics, 
  AIAnalyticsResult 
} from '../utils/analytics';
import {
  AccuratePredictionEngine,
  AccuratePrediction,
  PredictionAccuracy
} from '../utils/accuratePredictions';
import {
  TrendingUp, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  Target, 
  Clock, 
  Shield,
  Brain,
  Activity,
  Zap,
  Eye,
  BarChart3,
  Layers
} from 'lucide-react';

interface PredictionsPanelProps {
  data: CrimeRecord[];
}

const PredictionsPanel: React.FC<PredictionsPanelProps> = ({ data }) => {
  const [selectedCity, setSelectedCity] = useState('');
  const [predictionDays, setPredictionDays] = useState(30);
  const [activeView, setActiveView] = useState<'ai-insights' | 'ensemble' | 'anomalies' | 'patterns' | 'real-time'>('ai-insights');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalytics, setAiAnalytics] = useState<AIAnalyticsResult | null>(null);
  const [selectedHour, setSelectedHour] = useState(14); // 2 PM default

  const aiEngine = useMemo(() => createAIEngine(), []);
  
  const cities = useMemo(() => {
    const citySet = new Set(data.map(record => record.city));
    return Array.from(citySet).sort();
  }, [data]);

  // Perform advanced AI analysis
  useEffect(() => {
    if (data.length > 0) {
      setIsAnalyzing(true);
      performAdvancedAnalytics(data)
        .then(result => {
          setAiAnalytics(result);
          if (cities.length > 0 && !selectedCity) {
            setSelectedCity(cities[0]);
          }
        })
        .catch(error => {
          console.error('AI Analytics failed:', error);
        })
        .finally(() => {
          setIsAnalyzing(false);
        });
    }
  }, [data, cities]);

  // Generate ensemble predictions for selected city
  const ensemblePredictions = useMemo(() => {
    if (!selectedCity || data.length === 0) return [];
    
    const predictions: EnsemblePrediction[] = [];
    const hours = [8, 12, 16, 20]; // Morning, noon, afternoon, evening
    
    hours.forEach(hour => {
      const features = createPredictionFeatures(selectedCity, hour, new Date(), data);
      const prediction = aiEngine.generateEnsemblePrediction(data, features);
      predictions.push({
        ...prediction,
        timeSlot: `${hour}:00`
      } as any);
    });
    
    return predictions;
  }, [selectedCity, data, aiEngine]);

  // Real-time risk assessment
  const realTimeRisk = useMemo(() => {
    if (!selectedCity || data.length === 0) return null;
    
    const features = createPredictionFeatures(selectedCity, selectedHour, new Date(), data);
    return aiEngine.generateEnsemblePrediction(data, features);
  }, [selectedCity, selectedHour, data, aiEngine]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Critical': return 'text-red-800 bg-red-100 border-red-300';
      case 'High': return 'text-red-700 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatProbability = (prob: number) => {
    return `${Math.round(prob * 100)}%`;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            AI Analytics Waiting for Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a dataset to generate advanced AI-powered predictions and insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Brain className="w-6 h-6 text-purple-500 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Advanced AI Crime Analytics
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Powered by ensemble machine learning models with {formatProbability(aiAnalytics?.performanceMetrics.accuracy || 0.85)} accuracy
              </p>
            </div>
          </div>
          
          {isAnalyzing && (
            <div className="flex items-center text-blue-600">
              <Activity className="w-5 h-5 mr-2 animate-pulse" />
              <span className="text-sm">Analyzing...</span>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        {aiAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center">
                <Brain className="w-5 h-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm text-purple-600">AI Accuracy</p>
                  <p className="text-lg font-bold text-purple-900">
                    {formatProbability(aiAnalytics.performanceMetrics.accuracy)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-blue-600">Processing Speed</p>
                  <p className="text-lg font-bold text-blue-900">
                    {Math.round(aiAnalytics.performanceMetrics.processingTime)}ms
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center">
                <Eye className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-green-600">Data Quality</p>
                  <p className="text-lg font-bold text-green-900">
                    {formatProbability(aiAnalytics.performanceMetrics.dataQuality)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-orange-600 mr-2" />
                <div>
                  <p className="text-sm text-orange-600">Confidence</p>
                  <p className="text-lg font-bold text-orange-900">
                    {formatProbability(aiAnalytics.performanceMetrics.confidence)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ai-insights', label: 'AI Insights', icon: Brain },
            { id: 'ensemble', label: 'Ensemble Models', icon: Layers },
            { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle },
            { id: 'patterns', label: 'Pattern Recognition', icon: Activity },
            { id: 'real-time', label: 'Real-time Risk', icon: Clock }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Insights Overview */}
      {activeView === 'ai-insights' && aiAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* City Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPin className="w-5 h-5 text-blue-500 mr-2" />
              Enhanced City Analysis
            </h3>
            <div className="space-y-4">
              {aiAnalytics.cityAnalysis.slice(0, 3).map((city) => (
                <div key={city.city} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">{city.city}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(city.riskLevel)}`}>
                        {city.riskLevel}
                      </span>
                      <span className="text-sm text-gray-600">
                        AI Score: {city.aiRiskAssessment.overallRisk.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Crime Density</p>
                      <p className="font-semibold">{city.crimeDensity.toFixed(1)}/1K</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Weapon Rate</p>
                      <p className="font-semibold">{city.weaponUsageRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">AI Confidence</p>
                      <p className={`font-semibold ${getConfidenceColor(city.aiRiskAssessment.confidence)}`}>
                        {formatProbability(city.aiRiskAssessment.confidence)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">AI Risk Factors:</p>
                    <div className="flex flex-wrap gap-1">
                      {city.aiRiskAssessment.factors.slice(0, 2).map((factor, idx) => (
                        <span key={idx} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 text-green-500 mr-2" />
              Enhanced Time Analysis
            </h3>
            <div className="space-y-4">
              {aiAnalytics.timeAnalysis.filter(t => t.crimeCount > 0).slice(0, 6).map((timeSlot) => (
                <div key={timeSlot.hour} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {String(timeSlot.hour).padStart(2, '0')}:00
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(timeSlot.riskLevel)}`}>
                      {timeSlot.riskLevel}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Crime Count</p>
                      <p className="font-semibold">{timeSlot.crimeCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">AI Prediction</p>
                      <p className="font-semibold">{timeSlot.aiPrediction.expectedCrimes}</p>
                    </div>
                  </div>
                  
                  <div className="text-xs">
                    <p className="text-gray-600 dark:text-gray-400 mb-1">Weekend Ratio:</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, timeSlot.weekdayVsWeekend.ratio * 50)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ensemble Predictions */}
      {activeView === 'ensemble' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Layers className="w-5 h-5 text-purple-500 mr-2" />
                Ensemble Model Predictions
              </h3>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2 border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-900 text-blue-100"
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {selectedCity && ensemblePredictions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ensemblePredictions.map((prediction, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {(prediction as any).timeSlot} - {selectedCity}
                      </h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(prediction.consensus.riskLevel)}`}>
                        {prediction.consensus.riskLevel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Crime Type</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {prediction.consensus.crimeType}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Probability</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatProbability(prediction.consensus.probability)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Model Predictions</p>
                      <div className="space-y-2">
                        {prediction.modelPredictions.map((modelPred, modelIdx) => (
                          <div key={modelIdx} className="flex items-center justify-between text-xs">
                            <span className="text-gray-700 dark:text-gray-300">{modelPred.model}</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{modelPred.prediction}</span>
                              <span className={`${getConfidenceColor(modelPred.confidence)}`}>
                                {formatProbability(modelPred.confidence)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Overall Accuracy</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${prediction.overallAccuracy * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-right mt-1 font-medium">
                        {formatProbability(prediction.overallAccuracy)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Anomaly Detection */}
      {activeView === 'anomalies' && aiAnalytics && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            AI Anomaly Detection
          </h3>

          {aiAnalytics.anomalies.length > 0 ? (
            <div className="space-y-4">
              {aiAnalytics.anomalies.map((anomaly, idx) => (
                <div key={idx} className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-r-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-red-800 dark:text-red-200 capitalize">
                      {anomaly.anomalyType} Anomaly Detected
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-red-600 dark:text-red-400">
                        Score: {(anomaly.anomalyScore * 100).toFixed(1)}%
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        anomaly.significance > 0.8 ? 'bg-red-100 text-red-800' :
                        anomaly.significance > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {anomaly.significance > 0.8 ? 'Critical' : 
                         anomaly.significance > 0.6 ? 'High' : 'Medium'}
                      </span>
                    </div>
                  </div>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    {anomaly.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-green-600 dark:text-green-400 font-medium">
                No significant anomalies detected
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Crime patterns appear to be within normal parameters
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pattern Recognition */}
      {activeView === 'patterns' && aiAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Activity className="w-5 h-5 text-blue-500 mr-2" />
              Identified Patterns
            </h3>
            <div className="space-y-4">
              {aiAnalytics.patterns.patterns.map((pattern) => (
                <div key={pattern.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{pattern.name}</h4>
                    <span className="text-sm text-blue-600">
                      {formatProbability(pattern.confidence)} confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {pattern.description}
                  </p>
                  <div className="text-xs">
                    <p className="text-gray-500 mb-1">Affected Areas:</p>
                    <div className="flex flex-wrap gap-1">
                      {pattern.affectedAreas.slice(0, 3).map((area, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
              Trend Analysis
            </h3>
            <div className="space-y-4">
              {aiAnalytics.patterns.trends.map((trend, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{trend.metric}</h4>
                    <div className="flex items-center">
                      <TrendingUp className={`w-4 h-4 mr-1 ${
                        trend.direction === 'increasing' ? 'text-red-500' :
                        trend.direction === 'decreasing' ? 'text-green-500 transform rotate-180' :
                        'text-gray-500'
                      }`} />
                      <span className="text-sm capitalize">{trend.direction}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Rate</p>
                      <p className="font-semibold">{trend.rate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Significance</p>
                      <p className="font-semibold">{formatProbability(trend.significance)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Risk Assessment */}
      {activeView === 'real-time' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Clock className="w-5 h-5 text-orange-500 mr-2" />
            Real-time Risk Assessment
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select City
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-900 text-blue-100"
              >
                <option value="">Choose a city</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Hour
              </label>
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-900 text-blue-100"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCity && realTimeRisk && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Risk Assessment for {selectedCity} at {String(selectedHour).padStart(2, '0')}:00
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(realTimeRisk.consensus.riskLevel)}`}>
                      {realTimeRisk.consensus.riskLevel} Risk
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatProbability(realTimeRisk.consensus.probability)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Crime Probability</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {realTimeRisk.consensus.crimeType}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Most Likely Crime</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${getConfidenceColor(realTimeRisk.consensus.confidence)}`}>
                        {formatProbability(realTimeRisk.consensus.confidence)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">AI Confidence</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                      Contributing Factors
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {realTimeRisk.consensus.contributingFactors.map((factor, idx) => (
                        <span key={idx} className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    AI Recommendations
                  </h5>
                  <div className="space-y-2">
                    {realTimeRisk.consensus.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    Model Performance
                  </h5>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Overall Accuracy</span>
                      <span className="font-medium">{formatProbability(realTimeRisk.overallAccuracy)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ width: `${realTimeRisk.overallAccuracy * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictionsPanel;
