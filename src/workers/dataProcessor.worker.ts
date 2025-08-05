// Web Worker for heavy data processing to keep UI responsive

import { CrimeRecord, CityStats, TimeAnalysis } from '../types/crime';

export interface WorkerMessage {
  type: 'ANALYZE_CITY_SAFETY' | 'ANALYZE_TIME_PATTERNS' | 'PROCESS_LARGE_DATASET';
  data: any;
  requestId: string;
}

export interface WorkerResponse {
  type: 'PROGRESS' | 'RESULT' | 'ERROR';
  requestId: string;
  data?: any;
  error?: string;
  progress?: number;
}

// Listen for messages from main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, data, requestId } = event.data;

  try {
    switch (type) {
      case 'ANALYZE_CITY_SAFETY':
        analyzeCitySafety(data, requestId);
        break;
      case 'ANALYZE_TIME_PATTERNS':
        analyzeTimePatterns(data, requestId);
        break;
      case 'PROCESS_LARGE_DATASET':
        processLargeDataset(data, requestId);
        break;
      default:
        sendError(requestId, `Unknown message type: ${type}`);
    }
  } catch (error) {
    sendError(requestId, `Worker error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

function sendProgress(requestId: string, progress: number, message?: string) {
  const response: WorkerResponse = {
    type: 'PROGRESS',
    requestId,
    progress,
    data: message
  };
  self.postMessage(response);
}

function sendResult(requestId: string, result: any) {
  const response: WorkerResponse = {
    type: 'RESULT',
    requestId,
    data: result
  };
  self.postMessage(response);
}

function sendError(requestId: string, error: string) {
  const response: WorkerResponse = {
    type: 'ERROR',
    requestId,
    error
  };
  self.postMessage(response);
}

async function analyzeCitySafety(data: CrimeRecord[], requestId: string) {
  sendProgress(requestId, 0, 'Starting city safety analysis...');

  const cityMap = new Map<string, CrimeRecord[]>();
  
  // Group by city
  for (let i = 0; i < data.length; i++) {
    const record = data[i];
    if (!cityMap.has(record.city)) {
      cityMap.set(record.city, []);
    }
    cityMap.get(record.city)!.push(record);

    // Send progress updates
    if (i % 1000 === 0) {
      sendProgress(requestId, (i / data.length) * 30, `Grouping records... ${i}/${data.length}`);
      await new Promise(resolve => setTimeout(resolve, 0)); // Yield control
    }
  }

  sendProgress(requestId, 30, 'Calculating city statistics...');

  const cityStats: CityStats[] = [];
  const cities = Array.from(cityMap.entries());
  
  for (let cityIndex = 0; cityIndex < cities.length; cityIndex++) {
    const [city, records] = cities[cityIndex];
    
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
    const crimeVolumeScore = Math.min(2.0, cityPercentage * 100);
    safetyRating -= crimeVolumeScore;
    
    // Case closure bonus/penalty (±0.5 points)
    const closureRate = closedCases / totalCrimes;
    const closureBonus = (closureRate - 0.5) * 1.0;
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
      safetyRating: Math.round(safetyRating * 10) / 10,
      riskLevel: riskLevel as 'Low' | 'Medium' | 'High',
      lastIncident
    });

    // Send progress updates
    const progress = 30 + ((cityIndex + 1) / cities.length) * 70;
    sendProgress(requestId, progress, `Processed ${cityIndex + 1}/${cities.length} cities`);
    
    // Yield control periodically
    if (cityIndex % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  sendProgress(requestId, 100, 'Analysis complete!');
  sendResult(requestId, cityStats.sort((a, b) => b.safetyRating - a.safetyRating));
}

async function analyzeTimePatterns(data: CrimeRecord[], requestId: string) {
  sendProgress(requestId, 0, 'Starting time pattern analysis...');

  const hourMap = new Map<number, number>();
  
  for (let i = 0; i < data.length; i++) {
    const record = data[i];
    
    try {
      let hour = 12; // Default to noon if parsing fails
      const timeStr = record.timeOfOccurrence || '12:00';

      // Handle different time formats
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
      } else {
        const parsedHour = parseInt(timeStr);
        if (!isNaN(parsedHour) && parsedHour >= 0 && parsedHour <= 23) {
          hour = parsedHour;
        }
      }

      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    } catch (error) {
      hourMap.set(12, (hourMap.get(12) || 0) + 1);
    }

    // Send progress updates
    if (i % 1000 === 0) {
      sendProgress(requestId, (i / data.length) * 80, `Processing time data... ${i}/${data.length}`);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  sendProgress(requestId, 80, 'Calculating risk levels...');

  // Calculate percentile-based thresholds
  const crimeCounts = Array.from(hourMap.values()).sort((a, b) => b - a);
  const highThreshold = crimeCounts[Math.floor(crimeCounts.length * 0.1)] || 0;
  const lowThreshold = crimeCounts[Math.floor(crimeCounts.length * 0.9)] || 0;
  
  const timeAnalysis: TimeAnalysis[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const crimeCount = hourMap.get(hour) || 0;
    const riskLevel = crimeCount >= highThreshold ? 'High' : 
                     crimeCount <= lowThreshold ? 'Low' : 'Medium';
    
    timeAnalysis.push({
      hour,
      crimeCount,
      riskLevel: riskLevel as 'Low' | 'Medium' | 'High'
    });
  }

  sendProgress(requestId, 100, 'Time analysis complete!');
  sendResult(requestId, timeAnalysis);
}

async function processLargeDataset(data: { records: CrimeRecord[], chunkSize: number }, requestId: string) {
  const { records, chunkSize } = data;
  sendProgress(requestId, 0, 'Starting large dataset processing...');

  const processedChunks = [];
  const totalChunks = Math.ceil(records.length / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, records.length);
    const chunk = records.slice(start, end);

    // Process chunk (example: calculate statistics)
    const chunkStats = {
      startIndex: start,
      endIndex: end - 1,
      recordCount: chunk.length,
      averageAge: chunk.reduce((sum, r) => sum + r.victimAge, 0) / chunk.length,
      uniqueCities: new Set(chunk.map(r => r.city)).size,
      closureRate: chunk.filter(r => r.caseClosed === 'Yes').length / chunk.length
    };

    processedChunks.push(chunkStats);

    const progress = ((i + 1) / totalChunks) * 100;
    sendProgress(requestId, progress, `Processed chunk ${i + 1}/${totalChunks}`);

    // Yield control between chunks
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  sendResult(requestId, {
    totalChunks: processedChunks.length,
    totalRecords: records.length,
    chunks: processedChunks
  });
}

export {};
