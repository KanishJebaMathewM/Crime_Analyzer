import React, { useState, useMemo } from 'react';
import { CrimeRecord } from '../types/crime';
import { 
  AccuratePredictionEngine,
  AccuratePrediction,
  PredictionAccuracy
} from '../utils/accuratePredictions';
import { 
  Target,
  Clock, 
  MapPin, 
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Eye,
  Shield
} from 'lucide-react';

interface AccuratePredictionsPanelProps {
  data: CrimeRecord[];
}

const AccuratePredictionsPanel: React.FC<AccuratePredictionsPanelProps> = ({ data }) => {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedHour, setSelectedHour] = useState(14);
  const [activeView, setActiveView] = useState<'city-predictions' | 'time-analysis' | 'real-time'>('city-predictions');

  // Accurate prediction engine using only real data
  const predictionEngine = useMemo(() => {
    if (data.length === 0) return null;
    return new AccuratePredictionEngine(data);
  }, [data]);

  // Overall prediction accuracy
  const predictionAccuracy = useMemo(() => {
    if (!predictionEngine) return null;
    return predictionEngine.calculateOverallAccuracy();
  }, [predictionEngine]);

  // Available cities from actual data
  const availableCities = useMemo(() => {
    if (!predictionEngine) return [];
    return predictionEngine.getAvailableCities();
  }, [predictionEngine]);

  // City predictions for key time slots
  const cityPredictions = useMemo(() => {
    if (!selectedCity || !predictionEngine) return [];
    
    const keyHours = [6, 9, 12, 15, 18, 21]; // Morning, business hours, evening
    return keyHours.map(hour => ({
      ...predictionEngine.generateAccuratePrediction(selectedCity, hour),
      timeSlot: `${hour}:00`
    }));
  }, [selectedCity, predictionEngine]);

  // Real-time prediction
  const realTimePrediction = useMemo(() => {
    if (!selectedCity || !predictionEngine) return null;
    return predictionEngine.generateAccuratePrediction(selectedCity, selectedHour);
  }, [selectedCity, selectedHour, predictionEngine]);

  // Dataset statistics
  const datasetStats = useMemo(() => {
    if (!predictionEngine) return null;
    return predictionEngine.getDatasetStatistics();
  }, [predictionEngine]);

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
    if (confidence >= 0.7) return 'text-green-600';
    if (confidence >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatProbability = (prob: number) => {
    return `${Math.round(prob * 100)}%`;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Data Available for Predictions
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a crime dataset to generate accurate, data-driven predictions.
          </p>
        </div>
      </div>
    );
  }

  if (!predictionEngine) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Processing dataset for accurate predictions...
          </p>
        </div>
      </div>
    );
  }

  // Set default city if none selected
  if (!selectedCity && availableCities.length > 0) {
    setSelectedCity(availableCities[0]);
  }

  return (
    <div className="space-y-6">
      {/* Header with Dataset Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Target className="w-6 h-6 text-blue-500 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Data-Driven Crime Predictions
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Based entirely on historical patterns from your {data.length.toLocaleString()} records
              </p>
            </div>
          </div>
        </div>

        {/* Accuracy Metrics */}
        {predictionAccuracy && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 rounded-xl shadow-lg hover:shadow-xl transition-all border border-blue-200 dark:border-blue-800">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Prediction Accuracy</p>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    {formatProbability(predictionAccuracy.overallAccuracy)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-5 rounded-xl shadow-lg hover:shadow-xl transition-all border border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Data Quality</p>
                  <p className="text-xl font-bold text-green-900 dark:text-green-100">
                    {formatProbability(predictionAccuracy.dataCompleteness)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-5 rounded-xl shadow-lg hover:shadow-xl transition-all border border-purple-200 dark:border-purple-800">
              <div className="flex items-center">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Sample Size</p>
                  <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                    {predictionAccuracy.sampleSize.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-5 rounded-xl shadow-lg hover:shadow-xl transition-all border border-orange-200 dark:border-orange-800">
              <div className="flex items-center">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Reliability</p>
                  <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
                    {formatProbability(predictionAccuracy.predictionReliability)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dataset Overview */}
        {datasetStats && (
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-5 h-5 text-indigo-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dataset Overview</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{datasetStats.totalCities}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cities</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{datasetStats.totalCrimeTypes}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Crime Types</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {datasetStats.dateRange.earliest.getFullYear()}-{datasetStats.dateRange.latest.getFullYear()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date Range</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatProbability(datasetStats.completeness)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completeness</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: 'city-predictions', label: 'City Analysis', icon: MapPin },
            { id: 'time-analysis', label: 'Time Patterns', icon: Clock },
            { id: 'real-time', label: 'Real-time Risk', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* City Predictions */}
      {activeView === 'city-predictions' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <MapPin className="w-5 h-5 text-blue-500 mr-2" />
              City-Specific Predictions
            </h3>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {availableCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {selectedCity && cityPredictions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cityPredictions.map((prediction, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {prediction.timeSlot}
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(prediction.riskLevel)}`}>
                      {prediction.riskLevel}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Most Likely Crime</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {prediction.crimeType}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Probability</p>
                        <p className="font-semibold">{formatProbability(prediction.probability)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Confidence</p>
                        <p className={`font-semibold ${getConfidenceColor(prediction.confidence)}`}>
                          {formatProbability(prediction.confidence)}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        Based on {prediction.historicalEvidence.sameHourCrimes} incidents at this hour
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Total city records: {prediction.basedOnRecords}
                      </p>
                    </div>

                    {prediction.recommendations.length > 0 && (
                      <div className="text-xs">
                        <p className="text-gray-600 dark:text-gray-400 mb-1">Key Recommendation:</p>
                        <p className="text-gray-700 dark:text-gray-300 italic">
                          {prediction.recommendations[0]}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Time Analysis */}
      {activeView === 'time-analysis' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Clock className="w-5 h-5 text-green-500 mr-2" />
            Hourly Risk Analysis for {selectedCity || 'All Cities'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 24 }, (_, hour) => {
              const prediction = predictionEngine.generateAccuratePrediction(
                selectedCity || availableCities[0], 
                hour
              );
              
              return (
                <div key={hour} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {String(hour).padStart(2, '0')}:00
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(prediction.riskLevel)}`}>
                      {prediction.riskLevel}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Incidents:</span>
                      <span className="font-medium">{prediction.historicalEvidence.sameHourCrimes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Probability:</span>
                      <span className="font-medium">{formatProbability(prediction.probability)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                      <div 
                        className="bg-blue-600 h-1 rounded-full" 
                        style={{ width: `${prediction.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Real-time Risk Assessment */}
      {activeView === 'real-time' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 text-orange-500 mr-2" />
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              >
                {availableCities.map((city) => (
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCity && realTimePrediction && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedCity} at {String(selectedHour).padStart(2, '0')}:00
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(realTimePrediction.riskLevel)}`}>
                      {realTimePrediction.riskLevel} Risk
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatProbability(realTimePrediction.probability)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Crime Probability</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {realTimePrediction.historicalEvidence.sameHourCrimes}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Historical Incidents</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${getConfidenceColor(realTimePrediction.confidence)}`}>
                        {formatProbability(realTimePrediction.confidence)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                      Most Likely Crime Type
                    </h5>
                    <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold">
                      {realTimePrediction.crimeType}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                      Data Quality Indicators
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Records:</span>
                        <span className="font-medium">{realTimePrediction.basedOnRecords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Quality:</span>
                        <span className="font-medium">{formatProbability(realTimePrediction.historicalEvidence.dataQuality)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${realTimePrediction.historicalEvidence.dataQuality * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    Evidence-Based Recommendations
                  </h5>
                  <div className="space-y-2">
                    {realTimePrediction.recommendations.slice(0, 3).map((rec, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {realTimePrediction.basedOnRecords < 10 && (
                  <div className="border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                      <h5 className="font-medium text-yellow-800 dark:text-yellow-300">
                        Limited Data Warning
                      </h5>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Prediction based on limited historical data ({realTimePrediction.basedOnRecords} records). 
                      Consider this when making decisions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccuratePredictionsPanel;
