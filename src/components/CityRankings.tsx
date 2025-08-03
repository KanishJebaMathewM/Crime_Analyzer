import React from 'react';
import { CityStats } from '../types/crime';
import { MapPin, Star, TrendingUp, Shield, AlertTriangle } from 'lucide-react';

interface CityRankingsProps {
  cityStats: CityStats[];
  fullSize?: boolean;
  showSafetyDetails?: boolean;
  onViewAll?: () => void;
}

const CityRankings: React.FC<CityRankingsProps> = ({ 
  cityStats, 
  fullSize = false, 
  showSafetyDetails = false,
  onViewAll
}) => {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? 'text-yellow-400 fill-current' 
            : i < rating + 0.5
            ? 'text-yellow-400 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${fullSize ? 'col-span-full' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <MapPin className="w-5 h-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            City Safety Rankings
          </h3>
        </div>
        <div className="text-sm text-gray-500">
          Based on crime volume, closure rates & severity
        </div>
      </div>

      <div className="space-y-4">
        {cityStats.slice(0, fullSize ? cityStats.length : 6).map((city, index) => (
          <div key={city.city} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {city.city}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex">
                      {renderStars(city.safetyRating)}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {city.safetyRating}/5
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(city.riskLevel)}`}>
                  {city.riskLevel === 'High' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {city.riskLevel === 'Medium' && <TrendingUp className="w-3 h-3 mr-1" />}
                  {city.riskLevel === 'Low' && <Shield className="w-3 h-3 mr-1" />}
                  {city.riskLevel} Risk
                </span>
              </div>
            </div>

            {(fullSize || showSafetyDetails) && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Crimes</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {city.totalCrimes.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Case Closure</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {((city.closedCases / city.totalCrimes) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Most Common</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {city.mostCommonCrime}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Avg Victim Age</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {city.averageAge} years
                  </p>
                </div>
              </div>
            )}

            {showSafetyDetails && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Safety Tips for {city.city}:</strong>
                  {city.riskLevel === 'High' && ' Exercise extreme caution, avoid traveling alone at night, and stay in well-populated areas.'}
                  {city.riskLevel === 'Medium' && ' Maintain awareness of surroundings and follow general safety precautions.'}
                  {city.riskLevel === 'Low' && ' Relatively safe, but maintain standard safety practices.'}
                  {' '}Most incidents involve {city.mostCommonCrime.toLowerCase()}.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {!fullSize && cityStats.length > 6 && onViewAll && (
        <div className="mt-4 text-center">
          <button 
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            View all cities →
          </button>
        </div>
      )}
    </div>
  );
};

export default CityRankings;