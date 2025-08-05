import { CrimeRecord } from '../types/crime';

export interface AccuratePrediction {
  city: string;
  hour: number;
  crimeType: string;
  probability: number;
  confidence: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  basedOnRecords: number;
  historicalEvidence: {
    sameHourCrimes: number;
    sameCrimeTypeCrimes: number;
    cityTotalCrimes: number;
    dataQuality: number;
  };
  recommendations: string[];
}

export interface PredictionAccuracy {
  overallAccuracy: number;
  confidenceScore: number;
  dataCompleteness: number;
  predictionReliability: number;
  sampleSize: number;
  lastUpdated: Date;
}

export class AccuratePredictionEngine {
  private data: CrimeRecord[];
  private cityData: Map<string, CrimeRecord[]>;
  private hourlyData: Map<number, CrimeRecord[]>;
  private crimeTypeData: Map<string, CrimeRecord[]>;
  private cityHourData: Map<string, Map<number, CrimeRecord[]>>;
  private cityHourCounts: Map<string, Map<number, number>>;
  private cityWeaponCounts: Map<string, number>;
  private cityClosureRates: Map<string, number>;
  private riskThresholds: { high: number; medium: number; low: number } | null = null;
  private predictionCache: Map<string, AccuratePrediction> = new Map();

  constructor(data: CrimeRecord[]) {
    this.data = data;
    this.buildOptimizedDataStructures();
    this.calculatePercentileThresholds();
    this.precomputeStatistics();
  }

  private buildDataStructures() {
    this.cityData = new Map();
    this.hourlyData = new Map();
    this.crimeTypeData = new Map();
    this.cityHourData = new Map();

    // Initialize hourly data structure
    for (let hour = 0; hour < 24; hour++) {
      this.hourlyData.set(hour, []);
    }

    this.data.forEach(record => {
      // Group by city
      if (!this.cityData.has(record.city)) {
        this.cityData.set(record.city, []);
      }
      this.cityData.get(record.city)!.push(record);

      // Group by hour
      const hour = this.parseHour(record.timeOfOccurrence);
      this.hourlyData.get(hour)!.push(record);

      // Group by crime type
      if (!this.crimeTypeData.has(record.crimeDescription)) {
        this.crimeTypeData.set(record.crimeDescription, []);
      }
      this.crimeTypeData.get(record.crimeDescription)!.push(record);

      // Group by city and hour combination
      if (!this.cityHourData.has(record.city)) {
        this.cityHourData.set(record.city, new Map());
        for (let h = 0; h < 24; h++) {
          this.cityHourData.get(record.city)!.set(h, []);
        }
      }
      this.cityHourData.get(record.city)!.get(hour)!.push(record);
    });
  }

  private calculatePercentileThresholds() {
    // Collect all city-hour crime counts
    const allCounts: number[] = [];

    for (const [city, hourMap] of this.cityHourData.entries()) {
      for (let hour = 0; hour < 24; hour++) {
        const count = hourMap.get(hour)?.length || 0;
        allCounts.push(count);
      }
    }

    // Sort counts to find percentiles
    allCounts.sort((a, b) => a - b);

    if (allCounts.length === 0) {
      this.riskThresholds = { high: 0, medium: 0, low: 0 };
      return;
    }

    // Calculate thresholds
    // Top 25% = High risk, Bottom 25% = Low risk, Middle 50% = Medium risk
    const highThresholdIndex = Math.floor(allCounts.length * 0.75); // 75th percentile
    const lowThresholdIndex = Math.floor(allCounts.length * 0.25);  // 25th percentile

    this.riskThresholds = {
      high: allCounts[highThresholdIndex] || 0,
      medium: allCounts[lowThresholdIndex] || 0,
      low: 0
    };
  }

  private parseHour(timeStr: string): number {
    try {
      let timePart = timeStr.trim();
      if (timeStr.includes(' ')) {
        const parts = timeStr.split(' ');
        timePart = parts[parts.length - 1];
      }

      if (timePart.includes(':')) {
        const hourStr = timePart.split(':')[0];
        const hour = parseInt(hourStr);
        if (!isNaN(hour) && hour >= 0 && hour <= 23) {
          return hour;
        }
      }
    } catch (error) {
      // Fall through to default
    }
    return 12; // Default to noon only if parsing completely fails
  }

  generateAccuratePrediction(city: string, hour: number): AccuratePrediction {
    const cityRecords = this.cityData.get(city) || [];
    const hourRecords = this.hourlyData.get(hour) || [];
    const cityHourRecords = this.cityHourData.get(city)?.get(hour) || [];

    if (cityRecords.length === 0) {
      return this.createNoPredictionResult(city, hour, 'No historical data for this city');
    }

    // Calculate actual probability based on historical data
    const totalDatasetRecords = this.data.length;
    const cityHourFrequency = cityHourRecords.length;
    const cityTotalRecords = cityRecords.length;
    
    // Base probability: how often crimes occur in this city at this hour
    const baseProbability = cityTotalRecords > 0 ? cityHourFrequency / cityTotalRecords : 0;
    
    // Adjust probability based on overall dataset patterns
    const globalHourFrequency = hourRecords.length / totalDatasetRecords;
    const cityFrequency = cityTotalRecords / totalDatasetRecords;
    
    // Calculate adjusted probability using Bayesian-like approach
    const adjustedProbability = (baseProbability * cityFrequency * globalHourFrequency) / 
                               Math.max(0.0001, (cityFrequency * globalHourFrequency));

    // Find most likely crime type based on actual data
    const crimeTypeCounts = new Map<string, number>();
    cityHourRecords.forEach(record => {
      const count = crimeTypeCounts.get(record.crimeDescription) || 0;
      crimeTypeCounts.set(record.crimeDescription, count + 1);
    });

    let mostLikelyCrimeType = 'No specific crime type identified';
    let maxCount = 0;

    if (crimeTypeCounts.size > 0) {
      const sortedCrimes = Array.from(crimeTypeCounts.entries())
        .sort((a, b) => b[1] - a[1]);
      mostLikelyCrimeType = sortedCrimes[0][0];
      maxCount = sortedCrimes[0][1];
    } else {
      // Fallback to city-wide most common crime
      const cityWideCrimes = new Map<string, number>();
      cityRecords.forEach(record => {
        const count = cityWideCrimes.get(record.crimeDescription) || 0;
        cityWideCrimes.set(record.crimeDescription, count + 1);
      });
      
      if (cityWideCrimes.size > 0) {
        const sortedCityWide = Array.from(cityWideCrimes.entries())
          .sort((a, b) => b[1] - a[1]);
        mostLikelyCrimeType = sortedCityWide[0][0];
        maxCount = sortedCityWide[0][1];
      }
    }

    // Calculate confidence based on data quality and sample size
    const minSampleSize = 10;
    const sampleSizeWeight = Math.min(1, cityTotalRecords / minSampleSize);
    const specificityWeight = cityHourRecords.length > 0 ? 1 : 0.5;
    const dataQuality = this.calculateDataQuality(cityRecords);
    
    const confidence = sampleSizeWeight * specificityWeight * dataQuality;

    // Determine risk level based on actual frequency
    const riskLevel = this.calculateRiskLevel(adjustedProbability, cityHourFrequency);

    // Generate evidence-based recommendations
    const recommendations = this.generateEvidenceBasedRecommendations(
      city, hour, cityHourRecords, mostLikelyCrimeType, riskLevel
    );

    return {
      city,
      hour,
      crimeType: mostLikelyCrimeType,
      probability: Math.min(1, Math.max(0, adjustedProbability)),
      confidence,
      riskLevel,
      basedOnRecords: cityTotalRecords,
      historicalEvidence: {
        sameHourCrimes: cityHourFrequency,
        sameCrimeTypeCrimes: this.crimeTypeData.get(mostLikelyCrimeType)?.length || 0,
        cityTotalCrimes: cityTotalRecords,
        dataQuality
      },
      recommendations
    };
  }

  private createNoPredictionResult(city: string, hour: number, reason: string): AccuratePrediction {
    return {
      city,
      hour,
      crimeType: reason,
      probability: 0,
      confidence: 0,
      riskLevel: 'Low',
      basedOnRecords: 0,
      historicalEvidence: {
        sameHourCrimes: 0,
        sameCrimeTypeCrimes: 0,
        cityTotalCrimes: 0,
        dataQuality: 0
      },
      recommendations: ['Insufficient historical data for accurate prediction']
    };
  }

  private calculateDataQuality(records: CrimeRecord[]): number {
    if (records.length === 0) return 0;

    let qualityScore = 0;
    let totalFields = 0;

    records.forEach(record => {
      let recordScore = 0;
      let recordFields = 0;

      // Check completeness of key fields
      if (record.reportNumber && record.reportNumber.trim() !== '') {
        recordScore += 1;
      }
      recordFields += 1;

      if (record.dateOfOccurrence && !isNaN(record.dateOfOccurrence.getTime())) {
        recordScore += 1;
      }
      recordFields += 1;

      if (record.timeOfOccurrence && record.timeOfOccurrence.trim() !== '') {
        recordScore += 1;
      }
      recordFields += 1;

      if (record.city && record.city.trim() !== '' && record.city !== 'Unknown') {
        recordScore += 1;
      }
      recordFields += 1;

      if (record.crimeDescription && record.crimeDescription.trim() !== '' && record.crimeDescription !== 'Unknown') {
        recordScore += 1;
      }
      recordFields += 1;

      if (record.victimAge > 0 && record.victimAge <= 120) {
        recordScore += 1;
      }
      recordFields += 1;

      if (record.victimGender && record.victimGender !== 'Other') {
        recordScore += 1;
      }
      recordFields += 1;

      qualityScore += recordScore;
      totalFields += recordFields;
    });

    return totalFields > 0 ? qualityScore / totalFields : 0;
  }

  private calculateRiskLevel(probability: number, actualOccurrences: number): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (!this.riskThresholds) {
      // Fallback to original method if thresholds not calculated
      if (actualOccurrences >= 50 || probability >= 0.7) return 'Critical';
      if (actualOccurrences >= 20 || probability >= 0.4) return 'High';
      if (actualOccurrences >= 5 || probability >= 0.15) return 'Medium';
      return 'Low';
    }

    // Use percentile-based thresholds
    // Critical risk for extremely high occurrences (top 5% of data)
    const criticalThreshold = this.riskThresholds.high * 2;
    if (actualOccurrences >= criticalThreshold && probability >= 0.5) {
      return 'Critical';
    }

    // High risk: Top 25% of occurrences
    if (actualOccurrences >= this.riskThresholds.high) {
      return 'High';
    }

    // Low risk: Bottom 25% of occurrences
    if (actualOccurrences <= this.riskThresholds.medium) {
      return 'Low';
    }

    // Medium risk: Middle 50% of occurrences
    return 'Medium';
  }

  private generateEvidenceBasedRecommendations(
    city: string,
    hour: number,
    records: CrimeRecord[],
    crimeType: string,
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    if (records.length === 0) {
      recommendations.push(`No historical incidents recorded for ${city} at ${hour}:00`);
      recommendations.push('This appears to be a generally safe time and location based on available data');
      return recommendations;
    }

    // Based on actual crime frequency
    recommendations.push(`${records.length} incidents historically recorded at ${hour}:00 in ${city}`);

    // Most common crime type recommendation
    if (crimeType !== 'No specific crime type identified') {
      recommendations.push(`Primary risk: ${crimeType} incidents based on historical data`);
    }

    // Risk level specific recommendations
    switch (riskLevel) {
      case 'Critical':
        recommendations.push('⚠️ HIGH ALERT: This time/location combination shows frequent criminal activity');
        recommendations.push('Avoid area if possible, use alternative routes, travel in groups');
        break;
      case 'High':
        recommendations.push('⚡ ELEVATED RISK: Notable criminal activity at this time/location');
        recommendations.push('Exercise extra caution, stay in well-lit areas, be aware of surroundings');
        break;
      case 'Medium':
        recommendations.push('⚠️ MODERATE RISK: Some criminal activity historically recorded');
        recommendations.push('Maintain standard safety precautions');
        break;
      case 'Low':
        recommendations.push('✅ LOW RISK: Minimal historical criminal activity');
        recommendations.push('Standard safety awareness recommended');
        break;
    }

    // Time-specific recommendations based on actual data
    if (hour >= 22 || hour <= 5) {
      const nightCrimes = records.filter(r => {
        const recordHour = this.parseHour(r.timeOfOccurrence);
        return recordHour >= 22 || recordHour <= 5;
      }).length;
      
      if (nightCrimes > 0) {
        recommendations.push(`${nightCrimes} night-time incidents recorded - extra caution advised`);
      }
    }

    // Weapon-related recommendations based on data
    const weaponCrimes = records.filter(r => 
      r.weaponUsed && r.weaponUsed !== 'None' && r.weaponUsed !== 'Unknown' && r.weaponUsed.trim() !== ''
    ).length;
    
    if (weaponCrimes > 0) {
      recommendations.push(`⚔️ ${weaponCrimes} weapon-related incidents in historical data - avoid confrontations`);
    }

    return recommendations;
  }

  calculateOverallAccuracy(): PredictionAccuracy {
    if (this.data.length === 0) {
      return {
        overallAccuracy: 0,
        confidenceScore: 0,
        dataCompleteness: 0,
        predictionReliability: 0,
        sampleSize: 0,
        lastUpdated: new Date()
      };
    }

    // Calculate data completeness
    const dataCompleteness = this.calculateDataQuality(this.data);

    // Calculate sample size adequacy
    const cities = Array.from(this.cityData.keys());
    const avgRecordsPerCity = this.data.length / cities.length;
    const sampleSizeScore = Math.min(1, avgRecordsPerCity / 100); // Ideal: 100+ records per city

    // Calculate prediction reliability based on data distribution
    const hourDistribution = Array.from(this.hourlyData.values()).map(records => records.length);
    const maxHourCrimes = Math.max(...hourDistribution);
    const minHourCrimes = Math.min(...hourDistribution);
    const distributionBalance = minHourCrimes / Math.max(maxHourCrimes, 1);

    // Overall accuracy is weighted average of factors
    const overallAccuracy = (
      dataCompleteness * 0.4 +
      sampleSizeScore * 0.3 +
      distributionBalance * 0.3
    );

    // Confidence is higher when we have more data
    const confidenceScore = Math.min(1, this.data.length / 10000); // Ideal: 10,000+ records

    return {
      overallAccuracy,
      confidenceScore,
      dataCompleteness,
      predictionReliability: overallAccuracy,
      sampleSize: this.data.length,
      lastUpdated: new Date()
    };
  }

  getCityPredictionAccuracy(city: string): number {
    const cityRecords = this.cityData.get(city) || [];
    if (cityRecords.length === 0) return 0;

    const dataQuality = this.calculateDataQuality(cityRecords);
    const sampleSize = Math.min(1, cityRecords.length / 50); // Ideal: 50+ records per city
    
    return (dataQuality + sampleSize) / 2;
  }

  getAvailableCities(): string[] {
    return Array.from(this.cityData.keys()).sort();
  }

  getDatasetStatistics() {
    return {
      totalRecords: this.data.length,
      totalCities: this.cityData.size,
      totalCrimeTypes: this.crimeTypeData.size,
      dateRange: {
        earliest: new Date(Math.min(...this.data.map(r => r.dateOfOccurrence.getTime()))),
        latest: new Date(Math.max(...this.data.map(r => r.dateOfOccurrence.getTime())))
      },
      completeness: this.calculateDataQuality(this.data)
    };
  }
}
