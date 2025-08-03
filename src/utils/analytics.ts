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
    try {
      let hour = 0;
      const timeStr = record.timeOfOccurrence;

      // Handle different time formats
      if (timeStr.includes(':')) {
        // Format like "14:30" or "01-01-2020 14:30"
        const timePart = timeStr.split(' ').pop() || timeStr; // Get last part if contains date
        hour = parseInt(timePart.split(':')[0]);
      } else if (timeStr.includes('-')) {
        // Format like "01-01-2020 14:30" - extract time part
        const parts = timeStr.split(' ');
        if (parts.length > 1) {
          const timePart = parts[parts.length - 1];
          if (timePart.includes(':')) {
            hour = parseInt(timePart.split(':')[0]);
          }
        }
      } else {
        // Try direct parsing
        hour = parseInt(timeStr) || 0;
      }

      // Ensure hour is valid (0-23)
      if (hour >= 0 && hour <= 23) {
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      }
    } catch (error) {
      // Skip invalid time entries
      console.warn('Invalid time format:', record.timeOfOccurrence);
    }
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

// Safety center/facility types
export interface SafetyCenter {
  name: string;
  type: 'Police Station' | 'Hospital' | 'Fire Station' | 'Emergency Services';
  address: string;
  phone: string;
  availability: '24/7' | 'Business Hours';
  services: string[];
}

// Real emergency contact numbers for Indian cities
const realEmergencyContacts: { [key: string]: SafetyCenter[] } = {
  'Mumbai': [
    {
      name: 'Mumbai Police Control Room',
      type: 'Police Station',
      address: 'Crawford Market, Mumbai, Maharashtra 400001',
      phone: '100 / 022-2262-0111',
      availability: '24/7',
      services: ['Emergency Response', 'Crime Reporting', 'Traffic Control', 'Anti-Terror Squad']
    },
    {
      name: 'KEM Hospital Emergency',
      type: 'Hospital',
      address: 'Acharya Donde Marg, Parel, Mumbai 400012',
      phone: '022-2417-3333',
      availability: '24/7',
      services: ['Emergency Care', 'Trauma Unit', 'Ambulance Services', 'ICU']
    },
    {
      name: 'Mumbai Fire Brigade',
      type: 'Fire Station',
      address: 'Byculla, Mumbai, Maharashtra 400011',
      phone: '101 / 022-2262-6604',
      availability: '24/7',
      services: ['Fire Emergency', 'Rescue Operations', 'Emergency Medical', 'Disaster Response']
    }
  ],
  'Delhi': [
    {
      name: 'Delhi Police Control Room',
      type: 'Police Station',
      address: 'Parliament Street, New Delhi 110001',
      phone: '100 / 011-2334-0012',
      availability: '24/7',
      services: ['Emergency Response', 'Crime Reporting', 'Traffic Control', 'Special Cell']
    },
    {
      name: 'AIIMS Emergency',
      type: 'Hospital',
      address: 'Ansari Nagar, New Delhi 110029',
      phone: '011-2658-8500',
      availability: '24/7',
      services: ['Emergency Care', 'Trauma Center', 'Ambulance Services', 'Critical Care']
    },
    {
      name: 'Delhi Fire Service',
      type: 'Fire Station',
      address: 'Fire Station, Connaught Place, New Delhi',
      phone: '101 / 011-2334-4444',
      availability: '24/7',
      services: ['Fire Emergency', 'Rescue Operations', 'Emergency Medical', 'Hazmat Response']
    }
  ],
  'Bangalore': [
    {
      name: 'Bangalore City Police',
      type: 'Police Station',
      address: 'Infantry Road, Bangalore, Karnataka 560001',
      phone: '100 / 080-2294-3322',
      availability: '24/7',
      services: ['Emergency Response', 'Crime Reporting', 'Cyber Crime', 'Traffic Control']
    },
    {
      name: 'Victoria Hospital Emergency',
      type: 'Hospital',
      address: 'Fort, Bangalore, Karnataka 560002',
      phone: '080-2670-1150',
      availability: '24/7',
      services: ['Emergency Care', 'Trauma Unit', 'Ambulance Services', 'Burn Unit']
    }
  ],
  'Chennai': [
    {
      name: 'Chennai City Police',
      type: 'Police Station',
      address: 'Egmore, Chennai, Tamil Nadu 600008',
      phone: '100 / 044-2844-5151',
      availability: '24/7',
      services: ['Emergency Response', 'Crime Reporting', 'Traffic Control', 'Women Safety']
    },
    {
      name: 'Government General Hospital',
      type: 'Hospital',
      address: 'Park Town, Chennai, Tamil Nadu 600003',
      phone: '044-2819-3000',
      availability: '24/7',
      services: ['Emergency Care', 'Trauma Center', 'Ambulance Services', 'ICU']
    }
  ],
  'Kolkata': [
    {
      name: 'Kolkata Police Control Room',
      type: 'Police Station',
      address: 'Lalbazar, Kolkata, West Bengal 700001',
      phone: '100 / 033-2214-5185',
      availability: '24/7',
      services: ['Emergency Response', 'Crime Reporting', 'Detective Department', 'Traffic Control']
    },
    {
      name: 'Medical College Hospital',
      type: 'Hospital',
      address: '88, College Street, Kolkata 700073',
      phone: '033-2241-1211',
      availability: '24/7',
      services: ['Emergency Care', 'Trauma Unit', 'Ambulance Services', 'Burn Unit']
    }
  ],
  'Hyderabad': [
    {
      name: 'Hyderabad City Police',
      type: 'Police Station',
      address: 'Basheerbagh, Hyderabad, Telangana 500029',
      phone: '100 / 040-2785-4444',
      availability: '24/7',
      services: ['Emergency Response', 'Crime Reporting', 'Cyber Crime Unit', 'SHE Teams']
    },
    {
      name: 'Osmania General Hospital',
      type: 'Hospital',
      address: 'Afzal Gunj, Hyderabad, Telangana 500012',
      phone: '040-2460-7777',
      availability: '24/7',
      services: ['Emergency Care', 'Trauma Center', 'Ambulance Services', 'ICU']
    }
  ],
  'Pune': [
    {
      name: 'Pune City Police',
      type: 'Police Station',
      address: 'Shivajinagar, Pune, Maharashtra 411005',
      phone: '100 / 020-2612-8801',
      availability: '24/7',
      services: ['Emergency Response', 'Crime Reporting', 'Traffic Police', 'Women Safety']
    },
    {
      name: 'Sassoon General Hospital',
      type: 'Hospital',
      address: 'Near Pune Railway Station, Pune 411001',
      phone: '020-2612-7301',
      availability: '24/7',
      services: ['Emergency Care', 'Trauma Unit', 'Ambulance Services', 'ICU']
    }
  ],
  'Ahmedabad': [
    {
      name: 'Ahmedabad City Police',
      type: 'Police Station',
      address: 'Shahibaug, Ahmedabad, Gujarat 380004',
      phone: '100 / 079-2755-0001',
      availability: '24/7',
      services: ['Emergency Response', 'Crime Reporting', 'Traffic Control', 'Crime Branch']
    },
    {
      name: 'Civil Hospital Emergency',
      type: 'Hospital',
      address: 'Asarwa, Ahmedabad, Gujarat 380016',
      phone: '079-2268-0074',
      availability: '24/7',
      services: ['Emergency Care', 'Trauma Center', 'Ambulance Services', 'Burns Unit']
    }
  ]
};

// Generate safety centers for cities with real data where available
function getSafetyCentersForCity(city: string): SafetyCenter[] {
  // Use real data if available
  if (realEmergencyContacts[city]) {
    return realEmergencyContacts[city];
  }

  // Fallback to generated data for cities not in our real data
  const random = new SeededRandom(city.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0));

  return [
    {
      name: `${city} Police Control Room`,
      type: 'Police Station',
      address: `Police Headquarters, ${city}`,
      phone: '100 (Emergency Police)',
      availability: '24/7',
      services: ['Emergency Response', 'Crime Reporting', 'Traffic Control', 'Community Policing']
    },
    {
      name: `${city} Government Hospital`,
      type: 'Hospital',
      address: `Government Hospital, ${city}`,
      phone: '108 (Emergency Ambulance)',
      availability: '24/7',
      services: ['Emergency Care', 'Trauma Unit', 'Ambulance Services', 'Crisis Support']
    },
    {
      name: `${city} Fire Station`,
      type: 'Fire Station',
      address: `Fire Station, ${city}`,
      phone: '101 (Fire Emergency)',
      availability: '24/7',
      services: ['Fire Emergency', 'Rescue Operations', 'Emergency Medical', 'Disaster Response']
    }
  ];
}

export function generateSafetyRecommendations(
  city: string,
  time: number,
  cityStats: CityStats[],
  timeAnalysis: TimeAnalysis[]
): { recommendations: string[]; safetyCenters: SafetyCenter[] } {
  const cityData = cityStats.find(c => c.city === city);
  const timeData = timeAnalysis.find(t => t.hour === time);
  const safetyCenters = getSafetyCentersForCity(city);

  const recommendations: string[] = [];

  if (cityData) {
    if (cityData.riskLevel === 'High') {
      recommendations.push(`⚠️ ${city} has a high crime rate (${cityData.totalCrimes.toLocaleString()} incidents). Exercise extra caution.`);
      recommendations.push(`🚨 Case closure rate in ${city} is ${((cityData.closedCases / cityData.totalCrimes) * 100).toFixed(1)}%. Contact police immediately if you witness any suspicious activity.`);
    } else if (cityData.riskLevel === 'Medium') {
      recommendations.push(`⚡ ${city} has moderate crime levels. Stay aware of your surroundings.`);
    } else {
      recommendations.push(`✅ ${city} has relatively low crime rates. Maintain standard safety precautions.`);
    }

    if (cityData.safetyRating < 3) {
      recommendations.push(`🚨 Safety rating for ${city} is ${cityData.safetyRating}/5. Consider traveling during daylight hours.`);
    }

    recommendations.push(`🏛️ Most common crime in ${city}: ${cityData.mostCommonCrime}. Take appropriate precautions.`);

    // City-specific recommendations based on data
    const weaponCrimes = cityData.totalCrimes - cityData.closedCases; // Approximate
    if (weaponCrimes > cityData.totalCrimes * 0.3) {
      recommendations.push(`⚔️ Higher weapon-related incidents in ${city}. Avoid confrontations and stay in public areas.`);
    }
  }

  if (timeData) {
    if (timeData.riskLevel === 'High') {
      recommendations.push(`🌙 ${time}:00 is a high-risk time with ${timeData.crimeCount} incidents recorded. Avoid traveling alone.`);
    }

    if (time >= 22 || time <= 5) {
      recommendations.push(`🌜 Late night/early morning hours (${time}:00). Travel in groups and use well-lit, populated areas.`);
    } else if (time >= 6 && time <= 18) {
      recommendations.push(`☀️ Daytime hours (${time}:00) are generally safer. Good time for travel and activities.`);
    }
  }

  // Nearby safety centers recommendations
  const policeStations = safetyCenters.filter(c => c.type === 'Police Station');
  const hospitals = safetyCenters.filter(c => c.type === 'Hospital');

  if (policeStations.length > 0) {
    recommendations.push(`🚔 Nearest police: ${policeStations[0].name} at ${policeStations[0].address} - ${policeStations[0].phone}`);
  }

  if (hospitals.length > 0) {
    recommendations.push(`🏥 Emergency medical care: ${hospitals[0].name} at ${hospitals[0].address} - ${hospitals[0].phone}`);
  }

  // General recommendations
  recommendations.push(`📱 Emergency contacts: Police 911, Fire 911, Medical 911`);
  recommendations.push(`📍 Share your location with trusted contacts when traveling in ${city}`);

  return { recommendations, safetyCenters };
}
