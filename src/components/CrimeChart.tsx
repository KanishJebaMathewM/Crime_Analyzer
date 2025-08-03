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

      <div className={`grid ${fullSize ? 'grid-cols-1' : 'grid-cols-1'} gap-6`}>
        {/* Hourly Crime Activity by City */}
        <div>
          <div className="flex items-center mb-4">
            <Clock className="w-4 h-4 text-blue-500 mr-2" />
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
              Peak Hours by City (Top 6 Cities)
            </h4>
          </div>
          <div className="space-y-4">
            {hourlyDataByCity.map((cityData, index) => (
              <div key={cityData.city} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-red-100 text-red-800' :
                      index === 1 ? 'bg-orange-100 text-orange-800' :
                      index === 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {index + 1}
                    </div>
                    <h5 className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {cityData.city}
                    </h5>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Peak: {formatHour(cityData.peakHour)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {cityData.peakCrimes} crimes
                    </div>
                  </div>
                </div>

                {/* 24-hour timeline */}
                <div className="grid grid-cols-12 gap-1">
                  {cityData.hourlyData.map((count, hour) => (
                    <div key={hour} className="relative group">
                      <div
                        className="bg-blue-200 dark:bg-blue-800 rounded-sm transition-all duration-300 hover:bg-blue-300 dark:hover:bg-blue-700"
                        style={{
                          height: `${Math.max(4, (count / maxHourlyValue) * 40)}px`,
                          minHeight: '4px'
                        }}
                      />
                      <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {formatHour(hour)}: {count}
                      </div>
                      <div className="text-xs text-center text-gray-500 mt-1">
                        {hour % 6 === 0 ? hour : ''}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
                  Total: {cityData.totalCrimes.toLocaleString()} crimes
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
