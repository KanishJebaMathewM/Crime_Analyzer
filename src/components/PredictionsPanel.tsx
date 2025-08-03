import React, { useState, useMemo } from 'react';
import { CrimeRecord } from '../types/crime';
import { CrimePredictionEngine, CrimePrediction, SeasonalTrend } from '../utils/predictions';
import { TrendingUp, Calendar, MapPin, AlertTriangle, Target, Clock, Shield } from 'lucide-react';

interface PredictionsPanelProps {
  data: CrimeRecord[];
}

const PredictionsPanel: React.FC<PredictionsPanelProps> = ({ data }) => {
  const [selectedCity, setSelectedCity] = useState('');
  const [predictionDays, setPredictionDays] = useState(30);
  const [activeView, setActiveView] = useState<'predictions' | 'seasonal' | 'hotspots'>('predictions');

  const predictionEngine = useMemo(() => new CrimePredictionEngine(data), [data]);
  
  const cityPredictions = useMemo(() => {
    return predictionEngine.generateCityPredictions(predictionDays);
  }, [predictionEngine, predictionDays]);

  const seasonalTrends = useMemo(() => {
    return predictionEngine.analyzeSeasonalTrends();
  }, [predictionEngine]);

  const hotspots = useMemo(() => {
    if (!selectedCity) return [];
    const timeframe = predictionDays <= 7 ? 'week' : 'month';
    return predictionEngine.predictHotspots(selectedCity, timeframe);
  }, [predictionEngine, selectedCity, predictionDays]);

  const cities = useMemo(() => {
    const citySet = new Set(data.map(record => record.city));
    return Array.from(citySet).sort();
  }, [data]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Increasing': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'Decreasing': return <TrendingUp className="w-4 h-4 text-green-500 transform rotate-180" />;
      default: return <TrendingUp className="w-4 h-4 text-gray-500" />;
    }
  };

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a dataset to generate crime predictions and analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Target className="w-6 h-6 text-blue-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Crime Predictions & Forecasting
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={predictionDays}
              onChange={(e) => setPredictionDays(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 2 weeks</option>
              <option value={30}>Next month</option>
              <option value={90}>Next 3 months</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveView('predictions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'predictions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            City Predictions
          </button>
          <button
            onClick={() => setActiveView('seasonal')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'seasonal'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Seasonal Trends
          </button>
          <button
            onClick={() => setActiveView('hotspots')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'hotspots'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Hotspot Analysis
          </button>
        </div>
      </div>

      {/* City Predictions */}
      {activeView === 'predictions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cityPredictions.map((prediction) => (
            <div key={prediction.city} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {prediction.city}
                  </h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(prediction.riskLevel)}`}>
                  {prediction.riskLevel} Risk
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Predicted Crimes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {prediction.predictedCrimes}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(prediction.confidence * 100)}%
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Most Likely Crime</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {prediction.mostLikelyCrimeType}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Peak Risk Hours</p>
                <div className="flex space-x-2">
                  {prediction.peakHours.map((hour) => (
                    <span
                      key={hour}
                      className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium"
                    >
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Recommendations</p>
                <div className="space-y-1">
                  {prediction.recommendations.slice(0, 2).map((rec, index) => (
                    <p key={index} className="text-xs text-gray-700 dark:text-gray-300">
                      {rec}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seasonal Trends */}
      {activeView === 'seasonal' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <Calendar className="w-6 h-6 text-blue-500 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Seasonal Crime Trends
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seasonalTrends.map((trend) => (
              <div key={trend.month} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {trend.monthName}
                  </h4>
                  <div className="flex items-center">
                    {getTrendIcon(trend.trend)}
                    <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                      {trend.trend}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Crimes</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {trend.averageCrimes}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Top Crime Types</p>
                  <div className="space-y-1">
                    {trend.crimeTypes.slice(0, 3).map((crime, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-700 dark:text-gray-300 truncate">
                          {crime.type}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white ml-2">
                          {crime.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotspot Analysis */}
      {activeView === 'hotspots' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Crime Hotspot Predictions
              </h3>
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a city</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {selectedCity ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotspots.map((hotspot, index) => (
                <div key={hotspot.area} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {hotspot.area}
                    </h4>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      hotspot.riskScore >= 80 ? 'bg-red-100 text-red-800' :
                      hotspot.riskScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {hotspot.riskScore}% Risk
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Predicted Incidents</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {hotspot.predictedIncidents}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Likely Crime Types</p>
                    <div className="space-y-1">
                      {hotspot.crimeTypes.map((crimeType, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs mr-1 mb-1"
                        >
                          {crimeType}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Select a city to view hotspot predictions
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictionsPanel;
