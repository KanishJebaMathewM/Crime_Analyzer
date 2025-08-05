import React, { useMemo } from 'react';
import { CrimeRecord } from '../types/crime';
import { Users, User, Calendar } from 'lucide-react';

interface VictimDemographicsProps {
  data: CrimeRecord[];
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  cities?: string[];
}

const VictimDemographics: React.FC<VictimDemographicsProps> = ({
  data,
  selectedCity,
  onCityChange,
  cities = []
}) => {
  const demographics = useMemo(() => {
    // Filter data by selected city if provided
    const filteredData = selectedCity ? data.filter(record => record.city === selectedCity) : data;

    const genderMap = new Map<string, number>();
    const ageGroups = new Map<string, number>();
    const weaponByGender = new Map<string, Map<string, number>>();

    filteredData.forEach(record => {
      // Gender distribution
      genderMap.set(record.victimGender, (genderMap.get(record.victimGender) || 0) + 1);
      
      // Age groups
      const ageGroup = record.victimAge < 25 ? '18-24' :
                      record.victimAge < 35 ? '25-34' :
                      record.victimAge < 45 ? '35-44' :
                      record.victimAge < 55 ? '45-54' :
                      record.victimAge < 65 ? '55-64' : '65+';
      ageGroups.set(ageGroup, (ageGroups.get(ageGroup) || 0) + 1);
      
      // Weapon usage by gender
      if (!weaponByGender.has(record.victimGender)) {
        weaponByGender.set(record.victimGender, new Map());
      }
      const genderWeapons = weaponByGender.get(record.victimGender)!;
      genderWeapons.set(record.weaponUsed, (genderWeapons.get(record.weaponUsed) || 0) + 1);
    });

    return {
      gender: Array.from(genderMap.entries()).sort((a, b) => b[1] - a[1]),
      ageGroups: Array.from(ageGroups.entries()).sort((a, b) => {
        const order = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
        return order.indexOf(a[0]) - order.indexOf(b[0]);
      }),
      weaponByGender
    };
  }, [data, selectedCity]);

  // Use filtered data for calculations
  const filteredData = selectedCity ? data.filter(record => record.city === selectedCity) : data;
  const totalVictims = filteredData.length;
  const avgAge = totalVictims > 0 ? Math.round(filteredData.reduce((sum, record) => sum + record.victimAge, 0) / totalVictims) : 0;
  const mostVulnerableAge = demographics.ageGroups.reduce((max, current) => 
    current[1] > max[1] ? current : max, demographics.ageGroups[0]);

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'Male': return 'bg-blue-500';
      case 'Female': return 'bg-pink-500';
      case 'Other': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* City Selector */}
      {cities.length > 0 && onCityChange && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Demographics Analysis {selectedCity ? `- ${selectedCity}` : '- All Cities'}
            </h3>
            <select
              value={selectedCity || ''}
              onChange={(e) => onCityChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          {selectedCity && totalVictims === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No data available for {selectedCity}. Please select a different city or view all cities.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Victims</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {totalVictims.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Average Age</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {avgAge} years
              </p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg">
          <div className="flex items-center">
            <User className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Most Vulnerable</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {mostVulnerableAge[0]} age group
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Gender Distribution
          </h3>
          <div className="space-y-4">
            {demographics.gender.map(([gender, count]) => {
              const percentage = (count / totalVictims * 100).toFixed(1);
              return (
                <div key={gender} className="flex items-center">
                  <div className="w-20 text-sm text-gray-600 dark:text-gray-400">
                    {gender}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getGenderColor(gender)}`}
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {percentage}%
                      </div>
                    </div>
                  </div>
                  <div className="w-20 text-sm font-medium text-gray-900 dark:text-white text-right">
                    {count.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Age Group Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Age Group Distribution
          </h3>
          <div className="space-y-4">
            {demographics.ageGroups.map(([ageGroup, count]) => {
              const percentage = (count / totalVictims * 100).toFixed(1);
              return (
                <div key={ageGroup} className="flex items-center">
                  <div className="w-16 text-sm text-gray-600 dark:text-gray-400">
                    {ageGroup}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {percentage}%
                      </div>
                    </div>
                  </div>
                  <div className="w-20 text-sm font-medium text-gray-900 dark:text-white text-right">
                    {count.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weapon Usage by Gender */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Weapon Usage by Gender
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from(demographics.weaponByGender.entries()).map(([gender, weapons]) => (
            <div key={gender}>
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
                {gender} Victims
              </h4>
              <div className="space-y-2">
                {Array.from(weapons.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([weapon, count]) => (
                    <div key={weapon} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        {weapon}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white ml-2">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VictimDemographics;
