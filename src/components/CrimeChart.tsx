import React, { useMemo } from 'react';
import { CrimeRecord } from '../types/crime';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface CrimeChartProps {
  data: CrimeRecord[];
  fullSize?: boolean;
}

const CrimeChart: React.FC<CrimeChartProps> = ({ data, fullSize = false }) => {
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, number>();

    data.forEach(record => {
      try {
        const date = record.dateOfOccurrence;
        if (date && date instanceof Date && !isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
        }
      } catch (error) {
        // Skip records with invalid dates
        console.warn('Invalid date in monthly analysis:', record.dateOfOccurrence);
      }
    });

    // If no valid data, create dummy data for current year
    if (monthMap.size === 0) {
      const currentYear = new Date().getFullYear();
      for (let i = 1; i <= 12; i++) {
        const monthKey = `${currentYear}-${String(i).padStart(2, '0')}`;
        monthMap.set(monthKey, 0);
      }
    }

    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12); // Last 12 months
  }, [data]);

  const crimeTypeData = useMemo(() => {
    const typeMap = new Map<string, number>();
    
    data.forEach(record => {
      typeMap.set(record.crimeDescription, (typeMap.get(record.crimeDescription) || 0) + 1);
    });
    
    return Array.from(typeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [data]);

  const maxValue = Math.max(...monthlyData.map(([, count]) => count));
  const maxCrimeValue = Math.max(...crimeTypeData.map(([, count]) => count));

  const trend = monthlyData.length >= 2 ? 
    monthlyData[monthlyData.length - 1][1] - monthlyData[monthlyData.length - 2][1] : 0;

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${fullSize ? 'col-span-full' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Crime Trends Analysis
        </h3>
        <div className="flex items-center space-x-2">
          {trend > 0 ? (
            <>
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">
                +{trend} from last month
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">
                {trend} from last month
              </span>
            </>
          )}
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
