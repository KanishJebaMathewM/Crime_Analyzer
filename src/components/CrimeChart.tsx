import React, { useMemo } from 'react';
import { CrimeRecord } from '../types/crime';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface CrimeChartProps {
  data: CrimeRecord[];
  fullSize?: boolean;
}

const CrimeChart: React.FC<CrimeChartProps> = ({ data, fullSize = false }) => {
  const hourlyDataByCity = useMemo(() => {
    const cityHourMap = new Map<string, Map<number, number>>();

    data.forEach(record => {
      try {
        let hour = 12; // Default hour
        const timeStr = record.timeOfOccurrence || '12:00';

        // Extract hour from time string
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

        const city = record.city;
        if (!cityHourMap.has(city)) {
          cityHourMap.set(city, new Map<number, number>());
        }

        const hourMap = cityHourMap.get(city)!;
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      } catch (error) {
        // Skip invalid records
      }
    });

    // Convert to array format with top cities by crime count
    const cityData = Array.from(cityHourMap.entries()).map(([city, hourMap]) => {
      const totalCrimes = Array.from(hourMap.values()).reduce((sum, count) => sum + count, 0);
      const peakHour = Array.from(hourMap.entries()).reduce((max, current) =>
        current[1] > max[1] ? current : max, [0, 0]);

      return {
        city,
        totalCrimes,
        peakHour: peakHour[0],
        peakCrimes: peakHour[1],
        hourlyData: Array.from({ length: 24 }, (_, hour) => hourMap.get(hour) || 0)
      };
    }).sort((a, b) => b.totalCrimes - a.totalCrimes).slice(0, 6); // Top 6 cities

    return cityData;
  }, [data]);

  const crimeTypeData = useMemo(() => {
    const typeMap = new Map<string, number>();

    data.forEach(record => {
      const crimeType = record.crimeDescription?.trim() || 'Unknown';
      if (crimeType && crimeType !== '') {
        typeMap.set(crimeType, (typeMap.get(crimeType) || 0) + 1);
      }
    });

    // Ensure we have at least some data to display
    if (typeMap.size === 0) {
      typeMap.set('No data available', 0);
    }

    return Array.from(typeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [data]);

  const maxCrimeValue = Math.max(...crimeTypeData.map(([, count]) => count));
  const maxHourlyValue = hourlyDataByCity.length > 0 ?
    Math.max(...hourlyDataByCity.flatMap(city => city.hourlyData)) : 1;

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${fullSize ? 'col-span-full' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Hourly Crime Activity by City
        </h3>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Peak hours analysis across top cities
          </span>
        </div>
      </div>

      <div className={`grid ${fullSize ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {/* Monthly Trend Chart */}
        <div>
          <div className="flex items-center mb-4">
            <Calendar className="w-4 h-4 text-blue-500 mr-2" />
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
              Monthly Crime Reports
            </h4>
          </div>
          <div className="space-y-3">
            {monthlyData.map(([month, count]) => (
              <div key={month} className="flex items-center">
                <div className="w-20 text-sm text-gray-600 dark:text-gray-400">
                  {formatMonth(month)}
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(count / maxValue) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-sm font-medium text-gray-900 dark:text-white text-right">
                  {count.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crime Type Distribution */}
        <div>
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
            Top Crime Types
          </h4>
          <div className="space-y-3">
            {crimeTypeData.map(([type, count]) => (
              <div key={type} className="flex items-center">
                <div className="w-28 text-sm text-gray-600 dark:text-gray-400 truncate" title={type}>
                  {type}
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(count / maxCrimeValue) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-sm font-medium text-gray-900 dark:text-white text-right">
                  {count.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {fullSize && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
            <h5 className="text-sm font-medium text-blue-600 mb-2">Peak Month</h5>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {formatMonth(monthlyData.reduce((max, current) => 
                current[1] > max[1] ? current : max, monthlyData[0])?.[0] || '')}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {monthlyData.reduce((max, current) => 
                current[1] > max[1] ? current : max, monthlyData[0])?.[1].toLocaleString()} crimes
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
            <h5 className="text-sm font-medium text-green-600 mb-2">Lowest Month</h5>
            <p className="text-lg font-bold text-green-900 dark:text-green-100">
              {formatMonth(monthlyData.reduce((min, current) => 
                current[1] < min[1] ? current : min, monthlyData[0])?.[0] || '')}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              {monthlyData.reduce((min, current) => 
                current[1] < min[1] ? current : min, monthlyData[0])?.[1].toLocaleString()} crimes
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
            <h5 className="text-sm font-medium text-orange-600 mb-2">Most Common Crime</h5>
            <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
              {crimeTypeData[0]?.[0] || 'N/A'}
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              {crimeTypeData[0]?.[1].toLocaleString()} cases
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrimeChart;
