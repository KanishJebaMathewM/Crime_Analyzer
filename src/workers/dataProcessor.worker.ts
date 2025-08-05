// Advanced Web Worker for heavy data processing with AI capabilities
// Optimized for large datasets up to 200,000 records

import { CrimeRecord, CityStats, TimeAnalysis } from '../types/crime';

// Import AI capabilities (will be loaded dynamically to avoid bundle size issues)
let aiEngineModule: any = null;

export interface WorkerMessage {
  type: 'ANALYZE_CITY_SAFETY' | 'ANALYZE_TIME_PATTERNS' | 'PROCESS_LARGE_DATASET' | 
        'AI_PREDICTION' | 'ANOMALY_DETECTION' | 'PATTERN_RECOGNITION' | 'ENSEMBLE_PREDICTION';
  data: any;
  requestId: string;
  options?: {
    batchSize?: number;
    enableAI?: boolean;
    accuracy?: 'fast' | 'balanced' | 'accurate';
  };
}

export interface WorkerResponse {
  type: 'PROGRESS' | 'RESULT' | 'ERROR';
  requestId: string;
  data?: any;
  error?: string;
  progress?: number;
  processingTime?: number;
  memoryEstimate?: number;
}

// Performance monitoring
let processingStartTime = 0;
let peakMemoryUsage = 0;

// Listen for messages from main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, data, requestId, options } = event.data;
  
  processingStartTime = performance.now();
  
  try {
    switch (type) {
      case 'ANALYZE_CITY_SAFETY':
        analyzeCitySafety(data, requestId, options);
        break;
      case 'ANALYZE_TIME_PATTERNS':
        analyzeTimePatterns(data, requestId, options);
        break;
      case 'PROCESS_LARGE_DATASET':
        processLargeDataset(data, requestId, options);
        break;
      case 'AI_PREDICTION':
        processAIPrediction(data, requestId, options);
        break;
      case 'ANOMALY_DETECTION':
        processAnomalyDetection(data, requestId, options);
        break;
      case 'PATTERN_RECOGNITION':
        processPatternRecognition(data, requestId, options);
        break;
      case 'ENSEMBLE_PREDICTION':
        processEnsemblePrediction(data, requestId, options);
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
    data: message,
    processingTime: performance.now() - processingStartTime
  };
  self.postMessage(response);
}

function sendResult(requestId: string, result: any) {
  const processingTime = performance.now() - processingStartTime;
  const response: WorkerResponse = {
    type: 'RESULT',
    requestId,
    data: result,
    processingTime,
    memoryEstimate: peakMemoryUsage
  };
  self.postMessage(response);
}

function sendError(requestId: string, error: string) {
  const response: WorkerResponse = {
    type: 'ERROR',
    requestId,
    error,
    processingTime: performance.now() - processingStartTime
  };
  self.postMessage(response);
}

// Memory-efficient city safety analysis optimized for large datasets
async function analyzeCitySafety(data: CrimeRecord[], requestId: string, options: any = {}) {
  sendProgress(requestId, 0, 'Initializing city safety analysis...');
  
  const batchSize = options?.batchSize || 5000; // Larger batches for efficiency
  const cityMap = new Map<string, {
    totalCrimes: number;
    closedCases: number;
    ageSum: number;
    weaponCrimes: number;
    violentCrimes: number;
    crimeTypes: Map<string, number>;
    lastIncident: Date;
  }>();
  
  // Process data in optimized batches
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, Math.min(i + batchSize, data.length));
    
    for (const record of batch) {
      if (!cityMap.has(record.city)) {
        cityMap.set(record.city, {
          totalCrimes: 0,
          closedCases: 0,
          ageSum: 0,
          weaponCrimes: 0,
          violentCrimes: 0,
          crimeTypes: new Map(),
          lastIncident: new Date(0)
        });
      }
      
      const cityData = cityMap.get(record.city)!;
      cityData.totalCrimes++;
      
      if (record.caseClosed === 'Yes') cityData.closedCases++;
      cityData.ageSum += record.victimAge;
      
      if (record.weaponUsed !== 'None' && record.weaponUsed !== 'Unknown') {
        cityData.weaponCrimes++;
      }
      
      if (isViolentCrime(record.crimeDescription)) {
        cityData.violentCrimes++;
      }
      
      // Track crime types
      const currentCount = cityData.crimeTypes.get(record.crimeDescription) || 0;
      cityData.crimeTypes.set(record.crimeDescription, currentCount + 1);
      
      // Update last incident
      if (record.dateOfOccurrence > cityData.lastIncident) {
        cityData.lastIncident = record.dateOfOccurrence;
      }
    }
    
    const progress = (Math.min(i + batchSize, data.length) / data.length) * 80;
    sendProgress(requestId, progress, `Processed ${Math.min(i + batchSize, data.length).toLocaleString()}/${data.length.toLocaleString()} records`);
    
    // Yield control every few batches
    if (i % (batchSize * 3) === 0) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  sendProgress(requestId, 80, 'Calculating advanced safety metrics...');

  // Advanced safety rating calculation
  const cityStats: CityStats[] = [];
  const totalDatasetCrimes = data.length;
  
  for (const [city, cityData] of cityMap.entries()) {
    const averageAge = cityData.ageSum / cityData.totalCrimes;
    const closureRate = cityData.closedCases / cityData.totalCrimes;
    const weaponRate = cityData.weaponCrimes / cityData.totalCrimes;
    const violentRate = cityData.violentCrimes / cityData.totalCrimes;
    const cityPercentage = cityData.totalCrimes / totalDatasetCrimes;
    
    // Advanced safety rating algorithm
    let safetyRating = calculateAdvancedSafetyRating({
      totalCrimes: cityData.totalCrimes,
      closureRate,
      weaponRate,
      violentRate,
      cityPercentage,
      crimeTypeDistribution: cityData.crimeTypes
    });
    
    const mostCommonCrime = Array.from(cityData.crimeTypes.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
    
    const riskLevel = safetyRating >= 3.5 ? 'Low' : safetyRating >= 2.5 ? 'Medium' : 'High';
    
    cityStats.push({
      city,
      totalCrimes: cityData.totalCrimes,
      closedCases: cityData.closedCases,
      averageAge: Math.round(averageAge),
      mostCommonCrime,
      safetyRating: Math.round(safetyRating * 10) / 10,
      riskLevel: riskLevel as 'Low' | 'Medium' | 'High',
      lastIncident: cityData.lastIncident
    });
  }

  sendProgress(requestId, 100, 'Analysis complete!');
  sendResult(requestId, cityStats.sort((a, b) => b.safetyRating - a.safetyRating));
}

// Optimized time pattern analysis with enhanced accuracy
async function analyzeTimePatterns(data: CrimeRecord[], requestId: string, options: any = {}) {
  sendProgress(requestId, 0, 'Starting enhanced time pattern analysis...');
  
  const batchSize = options?.batchSize || 10000;
  const hourMap = new Map<number, {
    count: number;
    crimeTypes: Map<string, number>;
    weekdayCount: number;
    weekendCount: number;
  }>();
  
  // Initialize hour data
  for (let i = 0; i < 24; i++) {
    hourMap.set(i, {
      count: 0,
      crimeTypes: new Map(),
      weekdayCount: 0,
      weekendCount: 0
    });
  }
  
  // Process data in batches
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, Math.min(i + batchSize, data.length));
    
    for (const record of batch) {
      const hour = parseTimeToHour(record.timeOfOccurrence);
      const hourData = hourMap.get(hour)!;
      
      hourData.count++;
      
      const dayOfWeek = record.dateOfOccurrence.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
        hourData.weekendCount++;
      } else {
        hourData.weekdayCount++;
      }
      
      const crimeCount = hourData.crimeTypes.get(record.crimeDescription) || 0;
      hourData.crimeTypes.set(record.crimeDescription, crimeCount + 1);
    }
    
    const progress = (Math.min(i + batchSize, data.length) / data.length) * 80;
    sendProgress(requestId, progress, `Processing time data... ${Math.min(i + batchSize, data.length).toLocaleString()}/${data.length.toLocaleString()}`);
    
    if (i % (batchSize * 5) === 0) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  
  sendProgress(requestId, 80, 'Calculating enhanced risk levels...');

  // Enhanced risk calculation with multiple factors
  const crimeCounts = Array.from(hourMap.values()).map(h => h.count).sort((a, b) => b - a);
  const highThreshold = crimeCounts[Math.floor(crimeCounts.length * 0.15)] || 0;
  const lowThreshold = crimeCounts[Math.floor(crimeCounts.length * 0.85)] || 0;
  
  const timeAnalysis: TimeAnalysis[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourData = hourMap.get(hour)!;
    
    // Enhanced risk calculation
    const baseRisk = hourData.count >= highThreshold ? 'High' : 
                    hourData.count <= lowThreshold ? 'Low' : 'Medium';
    
    // Adjust for weekend patterns
    const weekendRatio = hourData.weekendCount / Math.max(hourData.count, 1);
    const adjustedRiskLevel = adjustRiskForWeekendPattern(baseRisk, weekendRatio);
    
    timeAnalysis.push({
      hour,
      crimeCount: hourData.count,
      riskLevel: adjustedRiskLevel as 'Low' | 'Medium' | 'High'
    });
  }

  sendProgress(requestId, 100, 'Enhanced time analysis complete!');
  sendResult(requestId, timeAnalysis);
}

// Large dataset processing with memory optimization
async function processLargeDataset(data: { records: CrimeRecord[], chunkSize?: number }, requestId: string, options: any = {}) {
  const { records } = data;
  const chunkSize = data.chunkSize || options?.batchSize || 8000; // Optimized chunk size
  
  sendProgress(requestId, 0, `Processing ${records.length.toLocaleString()} records in optimized chunks...`);

  const results = {
    totalRecords: records.length,
    processingStats: {
      averageAge: 0,
      totalCities: 0,
      overallClosureRate: 0,
      weaponUsageRate: 0,
      topCrimeTypes: [] as Array<{type: string, count: number}>,
      cityDistribution: [] as Array<{city: string, count: number, percentage: number}>,
      monthlyTrends: new Array(12).fill(0),
      hourlyDistribution: new Array(24).fill(0)
    },
    memoryEfficiency: {
      peakMemoryUsage: 0,
      averageProcessingTime: 0,
      chunksProcessed: 0
    }
  };

  const globalStats = {
    ageSum: 0,
    closedCases: 0,
    weaponCrimes: 0,
    cities: new Set<string>(),
    crimeTypes: new Map<string, number>(),
    cityCount: new Map<string, number>(),
    monthlyData: new Array(12).fill(0),
    hourlyData: new Array(24).fill(0)
  };

  const totalChunks = Math.ceil(records.length / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const chunkStart = performance.now();
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, records.length);
    const chunk = records.slice(start, end);

    // Process chunk efficiently
    for (const record of chunk) {
      globalStats.ageSum += record.victimAge;
      if (record.caseClosed === 'Yes') globalStats.closedCases++;
      if (record.weaponUsed !== 'None' && record.weaponUsed !== 'Unknown') {
        globalStats.weaponCrimes++;
      }
      
      globalStats.cities.add(record.city);
      
      const crimeCount = globalStats.crimeTypes.get(record.crimeDescription) || 0;
      globalStats.crimeTypes.set(record.crimeDescription, crimeCount + 1);
      
      const cityCount = globalStats.cityCount.get(record.city) || 0;
      globalStats.cityCount.set(record.city, cityCount + 1);
      
      const month = record.dateOfOccurrence.getMonth();
      globalStats.monthlyData[month]++;
      
      const hour = parseTimeToHour(record.timeOfOccurrence);
      globalStats.hourlyData[hour]++;
    }

    const chunkTime = performance.now() - chunkStart;
    results.memoryEfficiency.averageProcessingTime += chunkTime;
    results.memoryEfficiency.chunksProcessed++;

    const progress = ((i + 1) / totalChunks) * 100;
    sendProgress(requestId, progress, `Processed chunk ${i + 1}/${totalChunks} (${end.toLocaleString()}/${records.length.toLocaleString()} records)`);

    // Yield control every few chunks for better responsiveness
    if (i % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  // Calculate final statistics
  results.processingStats.averageAge = Math.round(globalStats.ageSum / records.length);
  results.processingStats.totalCities = globalStats.cities.size;
  results.processingStats.overallClosureRate = Math.round((globalStats.closedCases / records.length) * 100) / 100;
  results.processingStats.weaponUsageRate = Math.round((globalStats.weaponCrimes / records.length) * 100) / 100;
  
  results.processingStats.topCrimeTypes = Array.from(globalStats.crimeTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }));
  
  results.processingStats.cityDistribution = Array.from(globalStats.cityCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([city, count]) => ({
      city,
      count,
      percentage: Math.round((count / records.length) * 10000) / 100
    }));
  
  results.processingStats.monthlyTrends = globalStats.monthlyData;
  results.processingStats.hourlyDistribution = globalStats.hourlyData;
  
  results.memoryEfficiency.averageProcessingTime = 
    results.memoryEfficiency.averageProcessingTime / results.memoryEfficiency.chunksProcessed;

  sendResult(requestId, results);
}

// AI-powered prediction processing
async function processAIPrediction(data: any, requestId: string, options: any = {}) {
  sendProgress(requestId, 0, 'Loading AI engine...');
  
  try {
    // Dynamically load AI engine to avoid blocking
    if (!aiEngineModule) {
      // In a real implementation, you would dynamically import the AI module
      // For now, we'll simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    sendProgress(requestId, 20, 'Generating AI predictions...');
    
    const { records, features } = data;
    
    // Simulate advanced AI prediction
    const prediction = await generateAdvancedPrediction(records, features, options);
    
    sendProgress(requestId, 100, 'AI prediction complete!');
    sendResult(requestId, prediction);
    
  } catch (error) {
    sendError(requestId, `AI prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Anomaly detection processing
async function processAnomalyDetection(data: any, requestId: string, options: any = {}) {
  sendProgress(requestId, 0, 'Analyzing data for anomalies...');
  
  const { current, baseline } = data;
  const anomalies = await detectAdvancedAnomalies(current, baseline, options);
  
  sendProgress(requestId, 100, 'Anomaly detection complete!');
  sendResult(requestId, anomalies);
}

// Pattern recognition processing
async function processPatternRecognition(data: CrimeRecord[], requestId: string, options: any = {}) {
  sendProgress(requestId, 0, 'Recognizing crime patterns...');
  
  const patterns = await recognizeAdvancedPatterns(data, options);
  
  sendProgress(requestId, 100, 'Pattern recognition complete!');
  sendResult(requestId, patterns);
}

// Ensemble prediction processing
async function processEnsemblePrediction(data: any, requestId: string, options: any = {}) {
  sendProgress(requestId, 0, 'Running ensemble prediction models...');
  
  const { records, features } = data;
  const ensembleResult = await generateEnsemblePrediction(records, features, options);
  
  sendProgress(requestId, 100, 'Ensemble prediction complete!');
  sendResult(requestId, ensembleResult);
}

// Helper functions
function isViolentCrime(crimeDescription: string): boolean {
  const violent = ['assault', 'robbery', 'violence', 'murder', 'homicide', 'attack', 'battery'];
  return violent.some(term => crimeDescription.toLowerCase().includes(term));
}

function parseTimeToHour(timeStr: string): number {
  try {
    let timePart = timeStr;
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
    
    const hour = parseInt(timeStr);
    if (!isNaN(hour) && hour >= 0 && hour <= 23) {
      return hour;
    }
  } catch (error) {
    // Fall through to default
  }
  
  return 12; // Default to noon
}

function calculateAdvancedSafetyRating(metrics: {
  totalCrimes: number;
  closureRate: number;
  weaponRate: number;
  violentRate: number;
  cityPercentage: number;
  crimeTypeDistribution: Map<string, number>;
}): number {
  let rating = 5.0;
  
  // Crime volume impact (0-2 points)
  const volumeImpact = Math.min(2.0, metrics.cityPercentage * 50);
  rating -= volumeImpact;
  
  // Closure rate bonus/penalty (±1 point)
  const closureImpact = (metrics.closureRate - 0.5) * 2;
  rating += closureImpact;
  
  // Weapon usage penalty (0-1.5 points)
  rating -= metrics.weaponRate * 1.5;
  
  // Violent crime penalty (0-2 points)
  rating -= metrics.violentRate * 2;
  
  // Crime diversity bonus (better police coverage)
  const crimeTypes = metrics.crimeTypeDistribution.size;
  if (crimeTypes > 5) {
    rating += 0.2; // Diverse crime types might indicate better reporting/policing
  }
  
  return Math.max(1.0, Math.min(5.0, rating));
}

function adjustRiskForWeekendPattern(baseRisk: string, weekendRatio: number): string {
  if (weekendRatio > 0.6 && baseRisk === 'Medium') {
    return 'High'; // Weekend-heavy hours are riskier
  }
  if (weekendRatio < 0.3 && baseRisk === 'High') {
    return 'Medium'; // Weekday-heavy high crime might be less concerning
  }
  return baseRisk;
}

// Simulated AI functions (would be replaced with actual AI implementation)
async function generateAdvancedPrediction(records: CrimeRecord[], features: any, options: any) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return {
    crimeType: 'Theft',
    probability: 0.73,
    confidence: 0.85,
    riskLevel: 'High',
    contributingFactors: [
      'Historical time patterns',
      'Seasonal variations',
      'Geographic clustering',
      'Demographic factors'
    ],
    recommendations: [
      'Increase patrols during predicted high-risk hours',
      'Deploy additional security in identified hotspots',
      'Activate community alert systems'
    ],
    modelAccuracy: 0.87
  };
}

async function detectAdvancedAnomalies(current: CrimeRecord[], baseline: CrimeRecord[], options: any) {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  return [
    {
      type: 'temporal',
      description: 'Unusual spike in crime activity during late evening hours',
      severity: 0.8,
      affectedHours: [22, 23, 0, 1],
      recommendation: 'Investigate cause and increase night patrols'
    }
  ];
}

async function recognizeAdvancedPatterns(data: CrimeRecord[], options: any) {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    patterns: [
      {
        id: 'weekend-spike',
        name: 'Weekend Crime Increase',
        confidence: 0.85,
        description: 'Consistent increase in property crimes during weekends'
      }
    ],
    trends: [
      {
        metric: 'Overall Crime Rate',
        direction: 'increasing',
        significance: 0.7
      }
    ]
  };
}

async function generateEnsemblePrediction(records: CrimeRecord[], features: any, options: any) {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return {
    consensus: {
      crimeType: 'Theft',
      probability: 0.81,
      confidence: 0.89,
      riskLevel: 'High'
    },
    modelPredictions: [
      { model: 'Time Series', prediction: 'Theft', confidence: 0.85 },
      { model: 'Spatial Analysis', prediction: 'Theft', confidence: 0.78 },
      { model: 'Demographic Model', prediction: 'Burglary', confidence: 0.72 }
    ],
    overallAccuracy: 0.88
  };
}

export {};
