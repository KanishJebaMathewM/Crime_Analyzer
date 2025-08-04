import React from 'react';
import { TimeAnalysis } from '../types/crime';
import { Clock, AlertTriangle, Info } from 'lucide-react';

interface TimeHeatmapProps {
  timeAnalysis: TimeAnalysis[];
  data?: any[];
}

const TimeHeatmap: React.FC<TimeHeatmapProps> = ({ timeAnalysis, data = [] }) => {
  const [selectedCity, setSelectedCity] = React.useState<string>('All Cities');

  // Get unique cities from data
  const cities = React.useMemo(() => {
    if (!data || data.length === 0) return ['All Cities'];
    const citySet = new Set(data.map(record => record.city));
    return ['All Cities', ...Array.from(citySet).sort()];
  }, [data]);

  // Calculate hourly data for selected city
  const cityHourlyData = React.useMemo(() => {
    if (!data || data.length === 0) return timeAnalysis;

    const filteredData = selectedCity === 'All Cities' ? data : data.filter(record => record.city === selectedCity);
    const hourMap = new Map<number, number>();

    filteredData.forEach(record => {
      try {
        let hour = 12;
        const timeStr = record.timeOfOccurrence || '12:00';

        if (timeStr.includes(':')) {
          let timePart = timeStr;
          if (timeStr.includes(' ')) {
            const parts = timeStr.split(' ');
            timePart = parts[parts.length - 1];
          }

          if (timePart.includes(':')) {
            const hourStr = timePart.split(':')[0];
            const parsedHour = parseInt(hourStr);
            if (!isNaN(parsedHour) && parsedHour >= 0 && parsedHour <= 23) {
              hour = parsedHour;
            }
          }
        }

        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      } catch (error) {
        hourMap.set(12, (hourMap.get(12) || 0) + 1);
      }
    });

    // Calculate percentile-based thresholds for this city
    const crimeCounts = Array.from(hourMap.values()).sort((a, b) => b - a);
    const highThreshold = crimeCounts[Math.floor(crimeCounts.length * 0.2)] || 0; // Top 20%
    const lowThreshold = crimeCounts[Math.floor(crimeCounts.length * 0.8)] || 0; // Bottom 20%

    const cityTimeAnalysis = [];
    for (let hour = 0; hour < 24; hour++) {
      const crimeCount = hourMap.get(hour) || 0;
      const riskLevel = crimeCount >= highThreshold ? 'High' :
                       crimeCount <= lowThreshold ? 'Low' : 'Medium';

      cityTimeAnalysis.push({
        hour,
        crimeCount,
        riskLevel
      });
    }

    return cityTimeAnalysis;
  }, [data, selectedCity, timeAnalysis]);

  const maxCrimeCount = Math.max(...cityHourlyData.map(t => t.crimeCount));

  const getIntensityColor = (count: number, riskLevel: string) => {
    const intensity = count / maxCrimeCount;
    if (riskLevel === 'High') {
      return `rgba(239, 68, 68, ${0.4 + intensity * 0.6})`;
    } else if (riskLevel === 'Medium') {
      return `rgba(245, 158, 11, ${0.3 + intensity * 0.5})`;
    } else {
      return `rgba(34, 197, 94, ${0.2 + intensity * 0.4})`;
    }
  };

  const getTimeLabel = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const highRiskHours = cityHourlyData.filter(t => t.riskLevel === 'High');
  const safeHours = cityHourlyData.filter(t => t.riskLevel === 'Low');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Crime Activity by Hour - {selectedCity}
            </h3>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              {cities.map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 24-Hour Enhanced Heatmap Grid */}
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 mb-6">
          {cityHourlyData.map((time) => (
            <div
              key={time.hour}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 text-white text-xs font-medium relative cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:z-30 ${
                time.riskLevel === 'High' ? 'ring-2 ring-red-400 ring-opacity-60' :
                time.riskLevel === 'Low' ? 'ring-2 ring-green-400 ring-opacity-60' : ''
              }`}
              style={{
                backgroundColor: getIntensityColor(time.crimeCount, time.riskLevel),
                boxShadow: time.riskLevel === 'High' ? '0 0 15px rgba(239, 68, 68, 0.4)' :
                          time.riskLevel === 'Low' ? '0 0 15px rgba(34, 197, 94, 0.3)' : ''
              }}
              onMouseEnter={(e) => {
                const tooltip = e.currentTarget.querySelector('.hour-tooltip') as HTMLElement;
                if (tooltip) tooltip.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const tooltip = e.currentTarget.querySelector('.hour-tooltip') as HTMLElement;
                if (tooltip) tooltip.style.opacity = '0';
              }}
            >
              <div className="text-xs font-bold drop-shadow-sm">
                {String(time.hour).padStart(2, '0')}
              </div>
              <div className="text-xs opacity-90 drop-shadow-sm">
                {time.crimeCount}
              </div>

              {/* Precise Tooltip - only shows when directly hovering on the cell */}
              <div className="hour-tooltip absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 transition-opacity duration-200 z-40 whitespace-nowrap shadow-lg pointer-events-none">
                <div className="font-semibold">{getTimeLabel(time.hour)}</div>
                <div>{time.crimeCount} crimes</div>
                <div className={`text-xs ${
                  time.riskLevel === 'High' ? 'text-red-300' :
                  time.riskLevel === 'Low' ? 'text-green-300' : 'text-yellow-300'
                }`}>
                  {time.riskLevel} Risk
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Legend */}
        <div className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-lg bg-red-500 mr-2 shadow-sm ring-2 ring-red-400 ring-opacity-60"></div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">High Risk</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-lg bg-yellow-500 mr-2 shadow-sm"></div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Medium Risk</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-lg bg-green-500 mr-2 shadow-sm ring-2 ring-green-400 ring-opacity-60"></div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Low Risk (Safe)</span>
            </div>
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-xs">
            📊 Intensity = Crime Frequency • 🔍 Hover for details
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
              ��� These are the safest times for travel and outdoor activities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeHeatmap;
