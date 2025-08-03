import { CrimeRecord, CityStats, TimeAnalysis } from '../types/crime';

// Deterministic random number generator for consistent results
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

export function analyzeCitySafety(data: CrimeRecord[]): CityStats[] {
  const cityMap = new Map<string, CrimeRecord[]>();
  
  // Group by city
  data.forEach(record => {
    if (!cityMap.has(record.city)) {
      cityMap.set(record.city, []);
    }
    cityMap.get(record.city)!.push(record);
  });
  
  const cityStats: CityStats[] = [];
  
  cityMap.forEach((records, city) => {
    const totalCrimes = records.length;
    const closedCases = records.filter(r => r.caseClosed === 'Yes').length;
    const averageAge = records.reduce((sum, r) => sum + r.victimAge, 0) / records.length;
    
    // Find most common crime
    const crimeCount = new Map<string, number>();
    records.forEach(r => {
      crimeCount.set(r.crimeDescription, (crimeCount.get(r.crimeDescription) || 0) + 1);
    });
    const mostCommonCrime = Array.from(crimeCount.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
    
    // Calculate safety rating based on multiple factors
    const totalDatasetCrimes = data.length;
    const cityPercentage = totalCrimes / totalDatasetCrimes;
    
    // Base rating starts at 5.0
    let safetyRating = 5.0;
    
    // Crime volume penalty (0-2 points deduction)
    const crimeVolumeScore = Math.min(2.0, cityPercentage * 100); // Higher percentage = more penalty
    safetyRating -= crimeVolumeScore;
    
    // Case closure bonus/penalty (±0.5 points)
    const closureRate = closedCases / totalCrimes;
    const closureBonus = (closureRate - 0.5) * 1.0; // Above 50% closure gets bonus
    safetyRating += closureBonus;
    
    // Weapon usage penalty (0-1 point deduction)
    const weaponCrimes = records.filter(r => r.weaponUsed !== 'None' && r.weaponUsed !== 'Unknown').length;
    const weaponRate = weaponCrimes / totalCrimes;
    safetyRating -= weaponRate * 1.0;
    
    // Violent crime penalty (0-1.5 points deduction)
    const violentCrimes = records.filter(r => 
      r.crimeDescription.toLowerCase().includes('assault') ||
      r.crimeDescription.toLowerCase().includes('robbery') ||
      r.crimeDescription.toLowerCase().includes('violence') ||
      r.crimeDescription.toLowerCase().includes('murder')
    ).length;
    const violentRate = violentCrimes / totalCrimes;
    safetyRating -= violentRate * 1.5;
    
    // Ensure rating is between 1.0 and 5.0
    safetyRating = Math.max(1.0, Math.min(5.0, safetyRating));
    
    // Determine risk level based on rating
    const riskLevel = safetyRating >= 3.5 ? 'Low' : safetyRating >= 2.5 ? 'Medium' : 'High';
    const lastIncident = new Date(Math.max(...records.map(r => r.dateOfOccurrence.getTime())));
    
    cityStats.push({
      city,
      totalCrimes,
      closedCases,
      averageAge: Math.round(averageAge),
      mostCommonCrime,
      safetyRating: Math.round(safetyRating * 10) / 10, // Round to 1 decimal place
      riskLevel,
      lastIncident
    });
  });
  
  return cityStats.sort((a, b) => b.safetyRating - a.safetyRating);
}

export function analyzeTimePatterns(data: CrimeRecord[]): TimeAnalysis[] {
  const hourMap = new Map<number, number>();
  
  data.forEach(record => {
    const hour = parseInt(record.timeOfOccurrence.split(':')[0]);
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });
  
  // Calculate percentile-based thresholds
  const crimeCounts = Array.from(hourMap.values()).sort((a, b) => b - a);
  const highThreshold = crimeCounts[Math.floor(crimeCounts.length * 0.1)] || 0; // Top 10%
  const lowThreshold = crimeCounts[Math.floor(crimeCounts.length * 0.9)] || 0; // Bottom 10%
  
  const timeAnalysis: TimeAnalysis[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const crimeCount = hourMap.get(hour) || 0;
    const riskLevel = crimeCount >= highThreshold ? 'High' : 
                     crimeCount <= lowThreshold ? 'Low' : 'Medium';
    
    timeAnalysis.push({
      hour,
      crimeCount,
      riskLevel
    });
  }
  
  return timeAnalysis;
}

export function generateSafetyRecommendations(
  city: string, 
  time: number, 
  cityStats: CityStats[], 
  timeAnalysis: TimeAnalysis[]
): string[] {
  const cityData = cityStats.find(c => c.city === city);
  const timeData = timeAnalysis.find(t => t.hour === time);
  
  const recommendations: string[] = [];
  
  if (cityData) {
    if (cityData.riskLevel === 'High') {
      recommendations.push(`⚠️ ${city} has a high crime rate. Exercise extra caution.`);
    }
    
    if (cityData.safetyRating < 3) {
      recommendations.push(`🚨 Safety rating for ${city} is ${cityData.safetyRating}/5. Consider alternative locations.`);
    }
    
    recommendations.push(`🏛️ Most common crime in ${city}: ${cityData.mostCommonCrime}. Stay alert.`);
  }
  
  if (timeData) {
    if (timeData.riskLevel === 'High') {
      recommendations.push(`🌙 ${time}:00 is a high-risk time with ${timeData.crimeCount} incidents recorded.`);
    }
    
    if (time >= 22 || time <= 5) {
      recommendations.push(`🌜 Late night/early morning hours. Travel in groups and use well-lit areas.`);
    }
  }
  
  // General recommendations
  recommendations.push(`📱 Keep emergency contacts handy and share your location with trusted contacts.`);
  recommendations.push(`🚔 Look for areas with higher police presence for better security.`);
  
  return recommendations;
}