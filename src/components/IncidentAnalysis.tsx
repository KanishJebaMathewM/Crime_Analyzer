import React, { useMemo } from 'react';
import { CrimeRecord } from '../types/crime';
import { TrendingUp, TrendingDown, Calendar, AlertTriangle, Clock, Users } from 'lucide-react';

interface IncidentAnalysisProps {
  data: CrimeRecord[];
  selectedCity: string;
}

interface TrendData {
  period: string;
  incidents: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface IncidentStats {
  peakHours: { hour: number; incidents: number; percentage: number }[];
  commonIncidents: { type: string; count: number; percentage: number }[];
}

const IncidentAnalysis: React.FC<IncidentAnalysisProps> = ({ data, selectedCity }) => {
  const incidentStats = useMemo(() => {
    const cityData = data.filter(record => record.city === selectedCity);
    
    if (cityData.length === 0) {
      return null;
    }

    // Calculate total incidents for the city
    const totalIncidents = cityData.length;

    // Calculate hourly distribution
    const hourlyCount = new Array(24).fill(0);
    cityData.forEach(record => {
      const hour = parseInt(record.timeOfOccurrence.split(':')[0]) || 12;
      hourlyCount[hour]++;
    });

    const peakHours = hourlyCount
      .map((count, hour) => ({
        hour,
        incidents: count,
        percentage: totalIncidents > 0 ? (count / totalIncidents) * 100 : 0
      }))
      .sort((a, b) => b.incidents - a.incidents)
      .slice(0, 6);

    // Calculate common incident types
    const incidentTypes = new Map<string, number>();
    cityData.forEach(record => {
      const count = incidentTypes.get(record.crimeDescription) || 0;
      incidentTypes.set(record.crimeDescription, count + 1);
    });

    const commonIncidents = Array.from(incidentTypes.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / totalIncidents) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      peakHours,
      commonIncidents
    };
  }, [data, selectedCity]);

  if (!incidentStats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Incident Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No incident data available for {selectedCity}
          </p>
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-500 transform rotate-0" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'down':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mr-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Incident Analysis
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Crime patterns and statistics for {selectedCity}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Recent Activity Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Last 7 Days</p>
                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                  {incidentStats.recentActivity.last7Days}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {incidentStats.recentActivity.weekOverWeek > 0 ? '+' : ''}{incidentStats.recentActivity.weekOverWeek.toFixed(1)}% vs prev week
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Last 30 Days</p>
                <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                  {incidentStats.recentActivity.last30Days}
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  {incidentStats.recentActivity.monthOverMonth > 0 ? '+' : ''}{incidentStats.recentActivity.monthOverMonth.toFixed(1)}% vs prev month
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-orange-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Peak Hour</p>
                <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
                  {String(incidentStats.peakHours[0]?.hour || 0).padStart(2, '0')}:00
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  {incidentStats.peakHours[0]?.incidents || 0} incidents
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Top Incident</p>
                <p className="text-lg font-bold text-green-900 dark:text-green-100 truncate">
                  {incidentStats.commonIncidents[0]?.type.split(' ')[0] || 'None'}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  {incidentStats.commonIncidents[0]?.percentage.toFixed(1) || 0}% of incidents
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Peak Hours Analysis */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 text-orange-500 mr-2" />
            High-Risk Hours
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {incidentStats.peakHours.map((hour, index) => (
              <div key={hour.hour} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {String(hour.hour).padStart(2, '0')}:00
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {hour.incidents} incidents
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      index === 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      index === 1 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {hour.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Common Incident Types */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            Most Common Incidents
          </h4>
          <div className="space-y-3">
            {incidentStats.commonIncidents.map((incident, index) => (
              <div key={incident.type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white mr-3 ${
                    index === 0 ? 'bg-red-500' :
                    index === 1 ? 'bg-orange-500' :
                    index === 2 ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {incident.type}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {incident.count} incidents
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {incident.percentage.toFixed(1)}%
                  </p>
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-red-500' :
                        index === 1 ? 'bg-orange-500' :
                        index === 2 ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}
                      style={{ width: `${Math.min(incident.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Trends */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
            Recent Trends
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidentStats.weeklyTrends.map((trend, index) => (
              <div key={trend.period} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900 dark:text-white">{trend.period}</h5>
                  <div className="flex items-center">
                    {getTrendIcon(trend.trend)}
                    <span className={`ml-1 text-sm font-medium ${
                      trend.trend === 'up' ? 'text-red-600' :
                      trend.trend === 'down' ? 'text-green-600' :
                      'text-gray-600'
                    }`}>
                      {trend.change !== 0 && (trend.change > 0 ? '+' : '')}{trend.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {trend.incidents}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  incidents recorded
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentAnalysis;
