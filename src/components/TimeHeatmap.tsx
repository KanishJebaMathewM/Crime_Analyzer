import React from 'react';
import { TimeAnalysis } from '../types/crime';
import { Clock, AlertTriangle, Info } from 'lucide-react';

interface TimeHeatmapProps {
  timeAnalysis: TimeAnalysis[];
  data?: any[];
}

const TimeHeatmap: React.FC<TimeHeatmapProps> = ({ timeAnalysis }) => {
  const maxCrimeCount = Math.max(...timeAnalysis.map(t => t.crimeCount));
  
  const getIntensityColor = (count: number, riskLevel: string) => {
    const intensity = count / maxCrimeCount;
    if (riskLevel === 'High') {
      return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`;
    } else if (riskLevel === 'Medium') {
      return `rgba(245, 158, 11, ${0.3 + intensity * 0.7})`;
    } else {
      return `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`;
    }
  };

  const getTimeLabel = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const highRiskHours = timeAnalysis.filter(t => t.riskLevel === 'High');
  const safeHours = timeAnalysis.filter(t => t.riskLevel === 'Low');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center mb-6">
          <Clock className="w-5 h-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Crime Activity by Hour
          </h3>
        </div>

        {/* 24-Hour Heatmap Grid */}
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 mb-6">
          {timeAnalysis.map((time) => (
            <div
              key={time.hour}
              className="aspect-square rounded-lg flex flex-col items-center justify-center p-2 text-white text-xs font-medium relative group cursor-pointer transition-transform hover:scale-105"
              style={{ backgroundColor: getIntensityColor(time.crimeCount, time.riskLevel) }}
            >
              <div className="text-xs font-bold">
                {String(time.hour).padStart(2, '0')}
              </div>
              <div className="text-xs opacity-90">
                {time.crimeCount}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                {getTimeLabel(time.hour)}: {time.crimeCount} crimes ({time.riskLevel} risk)
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-red-500 mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">High Risk</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-yellow-500 mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">Medium Risk</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">Low Risk</span>
            </div>
          </div>
          <div className="text-gray-500">
            Darker = More Incidents
          </div>
        </div>
      </div>

      {/* Time-based Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h4 className="text-lg font-semibold text-red-800 dark:text-red-200">
              High-Risk Hours
            </h4>
          </div>
          <div className="space-y-2">
            {highRiskHours.slice(0, 5).map((time) => (
              <div key={time.hour} className="flex justify-between items-center">
                <span className="text-red-700 dark:text-red-300">
                  {getTimeLabel(time.hour)}
                </span>
                <span className="font-semibold text-red-800 dark:text-red-200">
                  {time.crimeCount} incidents
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-800/30 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-300">
              ⚠️ Avoid traveling alone during these hours. Use well-lit areas and consider rideshare services.
            </p>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Info className="w-5 h-5 text-green-600 mr-2" />
            <h4 className="text-lg font-semibold text-green-800 dark:text-green-200">
              Safest Hours
            </h4>
          </div>
          <div className="space-y-2">
            {safeHours.slice(0, 5).map((time) => (
              <div key={time.hour} className="flex justify-between items-center">
                <span className="text-green-700 dark:text-green-300">
                  {getTimeLabel(time.hour)}
                </span>
                <span className="font-semibold text-green-800 dark:text-green-200">
                  {time.crimeCount} incidents
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-800/30 rounded-md">
            <p className="text-sm text-green-700 dark:text-green-300">
              ✅ These are the safest times for travel and outdoor activities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeHeatmap;
