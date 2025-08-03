import { CrimeRecord, CityStats } from '../types/crime';

export interface CrimePrediction {
  city: string;
  predictedCrimes: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  timeframe: string;
  mostLikelyCrimeType: string;
  peakHours: number[];
  recommendations: string[];
}

export interface SeasonalTrend {
  month: number;
  monthName: string;
  averageCrimes: number;
  trend: 'Increasing' | 'Decreasing' | 'Stable';
  crimeTypes: { type: string; count: number }[];
}

export class CrimePredictionEngine {
  private data: CrimeRecord[];

  constructor(data: CrimeRecord[]) {
    this.data = data;
  }

  generateCityPredictions(daysAhead: number = 30): CrimePrediction[] {
    const cityGroups = this.groupByCity();
    const predictions: CrimePrediction[] = [];

    Object.entries(cityGroups).forEach(([city, records]) => {
      const prediction = this.predictForCity(city, records, daysAhead);
      predictions.push(prediction);
    });

    return predictions.sort((a, b) => b.predictedCrimes - a.predictedCrimes);
  }

  analyzeSeasonalTrends(): SeasonalTrend[] {
    const monthlyData = new Map<number, CrimeRecord[]>();

    // Group data by month
    this.data.forEach(record => {
      const month = record.dateOfOccurrence.getMonth();
      if (!monthlyData.has(month)) {
        monthlyData.set(month, []);
      }
      monthlyData.get(month)!.push(record);
    });

    const trends: SeasonalTrend[] = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    for (let month = 0; month < 12; month++) {
      const monthRecords = monthlyData.get(month) || [];
      const averageCrimes = monthRecords.length;

      // Calculate trend (simplified)
      const prevMonth = month === 0 ? 11 : month - 1;
      const nextMonth = month === 11 ? 0 : month + 1;
      const prevMonthCrimes = (monthlyData.get(prevMonth) || []).length;
      const nextMonthCrimes = (monthlyData.get(nextMonth) || []).length;

      let trend: 'Increasing' | 'Decreasing' | 'Stable' = 'Stable';
      if (averageCrimes > prevMonthCrimes * 1.1) trend = 'Increasing';
      else if (averageCrimes < prevMonthCrimes * 0.9) trend = 'Decreasing';

      // Get top crime types for this month
      const crimeTypeMap = new Map<string, number>();
      monthRecords.forEach(record => {
        crimeTypeMap.set(record.crimeDescription, (crimeTypeMap.get(record.crimeDescription) || 0) + 1);
      });

      const crimeTypes = Array.from(crimeTypeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      trends.push({
        month,
        monthName: monthNames[month],
        averageCrimes,
        trend,
        crimeTypes
      });
    }

    return trends;
  }

  predictHotspots(city: string, timeframe: 'week' | 'month' = 'month'): {
    area: string;
    riskScore: number;
    predictedIncidents: number;
    crimeTypes: string[];
  }[] {
    const cityRecords = this.data.filter(record => record.city === city);
    
    // Simulate area-based analysis (in real implementation, you'd have location data)
    const areas = ['Downtown', 'North District', 'South District', 'East Side', 'West Side', 'Central'];
    
    return areas.map(area => {
      // Simulate risk calculation based on historical patterns
      const baseRisk = Math.random() * 100;
      const seasonalMultiplier = this.getSeasonalMultiplier();
      const timeMultiplier = timeframe === 'week' ? 0.25 : 1;
      
      const riskScore = Math.min(100, baseRisk * seasonalMultiplier);
      const predictedIncidents = Math.round((cityRecords.length / 6) * (riskScore / 100) * timeMultiplier);
      
      // Get common crime types for this city
      const crimeTypeMap = new Map<string, number>();
      cityRecords.forEach(record => {
        crimeTypeMap.set(record.crimeDescription, (crimeTypeMap.get(record.crimeDescription) || 0) + 1);
      });
      
      const topCrimeTypes = Array.from(crimeTypeMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => type);

      return {
        area,
        riskScore: Math.round(riskScore),
        predictedIncidents,
        crimeTypes: topCrimeTypes
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }

  private groupByCity(): Record<string, CrimeRecord[]> {
    const groups: Record<string, CrimeRecord[]> = {};
    
    this.data.forEach(record => {
      if (!groups[record.city]) {
        groups[record.city] = [];
      }
      groups[record.city].push(record);
    });
    
    return groups;
  }

  private predictForCity(city: string, records: CrimeRecord[], daysAhead: number): CrimePrediction {
    // Simple linear regression for prediction
    const dailyAverages = this.calculateDailyAverages(records);
    const trend = this.calculateTrend(dailyAverages);
    
    const currentAverage = dailyAverages[dailyAverages.length - 1] || 0;
    const predictedDaily = Math.max(0, currentAverage + (trend * daysAhead));
    const predictedCrimes = Math.round(predictedDaily * daysAhead);
    
    // Calculate confidence based on data consistency
    const confidence = this.calculateConfidence(dailyAverages);
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(predictedCrimes, records.length);
    
    // Find most likely crime type
    const crimeTypeMap = new Map<string, number>();
    records.forEach(record => {
      crimeTypeMap.set(record.crimeDescription, (crimeTypeMap.get(record.crimeDescription) || 0) + 1);
    });
    const mostLikelyCrimeType = Array.from(crimeTypeMap.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    
    // Calculate peak hours
    const hourMap = new Map<number, number>();
    records.forEach(record => {
      try {
        let hour = 0;
        const timeStr = record.timeOfOccurrence;

        // Handle different time formats
        if (timeStr.includes(':')) {
          const timePart = timeStr.split(' ').pop() || timeStr;
          hour = parseInt(timePart.split(':')[0]);
        } else {
          hour = parseInt(timeStr) || 12;
        }

        // Ensure hour is valid (0-23)
        if (hour >= 0 && hour <= 23) {
          hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        }
      } catch (error) {
        // Skip invalid time entries
      }
    });
    const peakHours = Array.from(hourMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    const recommendations = this.generateRecommendations(riskLevel, mostLikelyCrimeType, peakHours);

    return {
      city,
      predictedCrimes,
      riskLevel,
      confidence,
      timeframe: `Next ${daysAhead} days`,
      mostLikelyCrimeType,
      peakHours,
      recommendations
    };
  }

  private calculateDailyAverages(records: CrimeRecord[]): number[] {
    const dailyMap = new Map<string, number>();
    
    records.forEach(record => {
      const dateKey = record.dateOfOccurrence.toDateString();
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
    });
    
    return Array.from(dailyMap.values());
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (val * index), 0);
    const sumX2 = values.reduce((sum, _, index) => sum + (index * index), 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private calculateConfidence(values: number[]): number {
    if (values.length < 2) return 0.5;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher confidence
    const coefficientOfVariation = standardDeviation / mean;
    return Math.max(0.1, Math.min(0.95, 1 - coefficientOfVariation));
  }

  private determineRiskLevel(predictedCrimes: number, historicalTotal: number): 'Low' | 'Medium' | 'High' | 'Critical' {
    const dailyAverage = historicalTotal / 365; // Approximate daily average
    const ratio = predictedCrimes / (dailyAverage * 30); // 30-day comparison
    
    if (ratio > 2) return 'Critical';
    if (ratio > 1.5) return 'High';
    if (ratio > 1) return 'Medium';
    return 'Low';
  }

  private generateRecommendations(riskLevel: string, crimeType: string, peakHours: number[]): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === 'Critical' || riskLevel === 'High') {
      recommendations.push('🚨 Increase police patrols and surveillance');
      recommendations.push('⚠️ Issue public safety alerts to residents');
    }
    
    if (peakHours.some(hour => hour >= 22 || hour <= 5)) {
      recommendations.push('🌙 Focus security measures during late night/early morning hours');
    }
    
    if (crimeType.toLowerCase().includes('theft')) {
      recommendations.push('🔒 Advise businesses to improve security systems');
      recommendations.push('👥 Encourage community watch programs');
    }
    
    if (crimeType.toLowerCase().includes('assault') || crimeType.toLowerCase().includes('violence')) {
      recommendations.push('🚔 Deploy rapid response units in high-risk areas');
      recommendations.push('💡 Improve street lighting in vulnerable locations');
    }
    
    recommendations.push('📊 Continue monitoring trends for pattern changes');
    
    return recommendations;
  }

  private getSeasonalMultiplier(): number {
    const currentMonth = new Date().getMonth();
    // Summer months typically see higher crime rates
    const summerMonths = [5, 6, 7]; // June, July, August
    return summerMonths.includes(currentMonth) ? 1.2 : 1.0;
  }
}
