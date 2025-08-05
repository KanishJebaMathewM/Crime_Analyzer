import React, { useState, useEffect, useMemo } from 'react';
import { CrimeRecord, CityStats, TimeAnalysis, ChatMessage } from '../types/crime';
import { generateMockData, processDataInChunks } from '../utils/dataGenerator';
import { analyzeCitySafety, analyzeTimePatterns, generateSafetyRecommendations } from '../utils/analytics';
import { AccuratePredictionEngine, PredictionAccuracy } from '../utils/accuratePredictions';
import { BarChart3, MapPin, Clock, Users, Shield, MessageCircle, TrendingUp, AlertTriangle, Upload, Target, CheckCircle, HelpCircle } from 'lucide-react';
import HelpSystem from './HelpSystem';
import CrimeChart from './CrimeChart';
import CityRankings from './CityRankings';
import TimeHeatmap from './TimeHeatmap';
import VictimDemographics from './VictimDemographics';
import ChatBot from './ChatBot';
import LoadingSpinner from './LoadingSpinner';
import FileUpload from './FileUpload';
import AccuratePredictionsPanel from './AccuratePredictionsPanel';
import IncidentAnalysis from './IncidentAnalysis';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<CrimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTime, setSelectedTime] = useState(12);
  const [showUpload, setShowUpload] = useState(false);
  const [dataSource, setDataSource] = useState<'demo' | 'uploaded'>('demo');
  const [showAllCities, setShowAllCities] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [uploadedDatasetPath, setUploadedDatasetPath] = useState<string | null>(null);
  const [lastUploadedData, setLastUploadedData] = useState<CrimeRecord[] | null>(null);

  const cityStats = useMemo(() => {
    if (data.length === 0) return [];
    return analyzeCitySafety(data);
  }, [data]);

  const timeAnalysis = useMemo(() => {
    if (data.length === 0) return [];
    return analyzeTimePatterns(data);
  }, [data]);

  // Accurate prediction engine
  const predictionEngine = useMemo(() => {
    if (data.length === 0) return null;
    return new AccuratePredictionEngine(data);
  }, [data]);

  // Prediction accuracy metrics
  const predictionAccuracy = useMemo(() => {
    if (!predictionEngine) return null;
    return predictionEngine.calculateOverallAccuracy();
  }, [predictionEngine]);

  const safetyData = useMemo(() => {
    if (!selectedCity || cityStats.length === 0) return { recommendations: [], safetyCenters: [] };
    return generateSafetyRecommendations(selectedCity, selectedTime, cityStats, timeAnalysis);
  }, [selectedCity, selectedTime, cityStats, timeAnalysis]);

  const loadActualData = async () => {
    setLoading(true);
    try {
      console.log('Attempting to fetch crime dataset...');
      console.log('Current location:', window.location.href);
      console.log('Trying to fetch:', window.location.origin + '/crime_dataset_india.csv');

      let response;
      try {
        response = await fetch('/crime_dataset_india.csv');
      } catch (fetchError) {
        console.log('Direct fetch failed, trying with full URL...');
        response = await fetch(window.location.origin + '/crime_dataset_india.csv');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const csvText = await response.text();
      console.log('Dataset fetched successfully, size:', csvText.length);

      if (!csvText || csvText.length < 100) {
        throw new Error('CSV file is empty or too small');
      }

      // Parse CSV using Papa Parse (same as FileUpload component)
      const Papa = await import('papaparse');
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        delimiter: ',',
        quoteChar: '"'
      });

      if (parseResult.errors.length > 0) {
        console.warn('CSV parsing warnings:', parseResult.errors);
        // Only throw if there are fatal errors
        const fatalErrors = parseResult.errors.filter(error => error.type === 'Delimiter');
        if (fatalErrors.length > 0) {
          throw new Error(`CSV parsing failed: ${fatalErrors[0].message}`);
        }
      }

      if (!parseResult.data || parseResult.data.length === 0) {
        throw new Error('No data found in CSV file');
      }

      console.log('CSV parsed successfully, rows:', parseResult.data.length);

      // Process the parsed data into CrimeRecord format
      const processedData: CrimeRecord[] = parseResult.data
        .map((row: any, index: number) => {
          try {
            // Skip empty rows
            if (!row || !row['Report Number']) {
              return null;
            }

            const parseDateSafe = (dateStr: string) => {
              if (!dateStr) return new Date();
              try {
                // Handle various date formats
                if (dateStr.includes('-')) {
                  // Format like "01-01-2020 00:00" or "02-01-2020"
                  const datePart = dateStr.split(' ')[0];
                  const parts = datePart.split('-');

                  if (parts.length === 3) {
                    // Check if it's DD-MM-YYYY or MM-DD-YYYY format
                    const [first, second, year] = parts;
                    const yearNum = parseInt(year);
                    const firstNum = parseInt(first);
                    const secondNum = parseInt(second);

                    // If first number > 12, it's likely DD-MM-YYYY
                    if (firstNum > 12 || (firstNum <= 12 && secondNum <= 12)) {
                      // Assume DD-MM-YYYY format for Indian data
                      return new Date(yearNum, secondNum - 1, firstNum);
                    } else {
                      // MM-DD-YYYY format
                      return new Date(yearNum, firstNum - 1, secondNum);
                    }
                  }
                }
                return new Date(dateStr);
              } catch (error) {
                console.warn('Date parsing failed for:', dateStr, error);
                return new Date();
              }
            };

            const parseGenderSafe = (gender: string): 'Male' | 'Female' | 'Other' => {
              if (!gender) return 'Other';
              const g = gender.toLowerCase();
              if (g === 'male' || g === 'm') return 'Male';
              if (g === 'female' || g === 'f') return 'Female';
              return 'Other';
            };

            return {
              reportNumber: String(row['Report Number'] || index),
              dateReported: parseDateSafe(row['Date Reported']),
              dateOfOccurrence: parseDateSafe(row['Date of Occurrence']),
              timeOfOccurrence: (() => {
                const timeStr = String(row['Time of Occurrence'] || '12:00');
                // Extract time from formats like "01-01-2020 14:30" or just "14:30"
                if (timeStr.includes(' ')) {
                  const timePart = timeStr.split(' ')[1];
                  return timePart || '12:00';
                }
                return timeStr;
              })(),
              city: String(row['City'] || 'Unknown'),
              crimeCode: String(row['Crime Code'] || ''),
              crimeDescription: String(row['Crime Description'] || 'Unknown'),
              victimAge: Math.max(0, Math.min(120, parseInt(row['Victim Age']) || 25)),
              victimGender: parseGenderSafe(row['Victim Gender']),
              weaponUsed: String(row['Weapon Used'] || 'None'),
              crimeDomain: String(row['Crime Domain'] || 'Other'),
              policeDeployed: String(row['Police Deployed']).toLowerCase() === 'yes' || row['Police Deployed'] === '1' || row['Police Deployed'] === 1,
              caseClosed: (String(row['Case Closed']).toLowerCase() === 'yes' ? 'Yes' : 'No') as 'Yes' | 'No',
              dateCaseClosed: row['Date Case Closed'] ? parseDateSafe(row['Date Case Closed']) : undefined
            };
          } catch (error) {
            console.warn(`Error processing row ${index}:`, row, error);
            return null;
          }
        })
        .filter((record): record is CrimeRecord => record !== null);

      console.log('Data processing completed, final record count:', processedData.length);

      if (processedData.length === 0) {
        throw new Error('No valid records could be processed from the dataset');
      }

      setData(processedData);
      setDataSource('uploaded');
      if (processedData.length > 0) {
        // Find the most common city to set as default
        const cityCount = new Map<string, number>();
        processedData.forEach(record => {
          cityCount.set(record.city, (cityCount.get(record.city) || 0) + 1);
        });
        const mostCommonCity = Array.from(cityCount.entries())
          .sort((a, b) => b[1] - a[1])[0][0];
        setSelectedCity(mostCommonCity);
        console.log('Dataset loaded successfully with', processedData.length, 'records');
      }
    } catch (error) {
      console.error('Error loading actual dataset:', error);
      console.log('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: typeof error,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });

      // Try one more fallback approach
      try {
        console.log('Trying alternative import method...');
        const csvUrl = new URL('/crime_dataset_india.csv', window.location.href);
        const fallbackResponse = await fetch(csvUrl.href);
        if (fallbackResponse.ok) {
          console.log('Fallback fetch succeeded');
          const csvText = await fallbackResponse.text();
          // Process this data - but we'll keep it simple for now
          // Just load mock data but log that we found the file
          console.log('CSV file found via fallback, but loading mock data for safety');
        }
      } catch (fallbackError) {
        console.log('Fallback also failed:', fallbackError);
      }

      // Show user-friendly error message
      alert(`Failed to load dataset: ${error instanceof Error ? error.message : 'Unknown error'}. Loading demo data instead.`);

      // Fallback to mock data
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Use the same count as real dataset for consistency
      const mockData = generateMockData(40000);
      setData(mockData);
      setDataSource('demo');
      if (mockData.length > 0) {
        setSelectedCity(mockData[0].city);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActualData();
  }, []);

  const handleDataUpload = (uploadedData: CrimeRecord[]) => {
    setData(uploadedData);
    setLastUploadedData(uploadedData);
    setDataSource('uploaded');
    if (uploadedData.length > 0) {
      setSelectedCity(uploadedData[0].city);
    }
    setShowUpload(false);
  };

  const handleRefreshData = () => {
    if (dataSource === 'uploaded' && lastUploadedData) {
      // Refresh the uploaded data
      setLoading(true);
      setTimeout(() => {
        setData([...lastUploadedData]);
        setLoading(false);
      }, 500);
    } else {
      // Load actual dataset
      loadActualData();
    }
  };


  
  const totalCrimes = data.length;
  const closedCases = data.filter(record => record.caseClosed === 'Yes').length;
  const closureRate = totalCrimes > 0 ? (closedCases / totalCrimes * 100).toFixed(1) : '0';
  const averageAge = totalCrimes > 0 ? Math.round(data.reduce((sum, record) => sum + record.victimAge, 0) / totalCrimes) : 0;
  const weaponCrimes = data.filter(record => {
    const weapon = record.weaponUsed?.toLowerCase().trim() || '';
    // Only count actual weapons, not when weapon is explicitly None or undefined
    return weapon !== 'none' && weapon !== 'unknown' && weapon !== '' &&
           weapon !== 'not specified' && weapon !== 'n/a' && weapon !== 'na' &&
           weapon !== 'not applicable' && weapon !== 'nil';
  }).length;
  const weaponRate = totalCrimes > 0 ? ((weaponCrimes / totalCrimes) * 100).toFixed(1) : '0';

  if (loading) {
    return <LoadingSpinner message="Loading crime analysis data..." />;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trends', label: 'Crime Trends', icon: TrendingUp },
    { id: 'predictions', label: 'Predictions', icon: Target },
    { id: 'cities', label: 'City Analysis', icon: MapPin },
    { id: 'time', label: 'Time Patterns', icon: Clock },
    { id: 'demographics', label: 'Demographics', icon: Users },
    { id: 'safety', label: 'Safety Center', icon: Shield },
    { id: 'chat', label: 'AI Assistant', icon: MessageCircle }
  ];

  return (
    <div className="min-h-screen">
      <div className="card-enhanced border-b backdrop-blur-lg animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between py-8 gap-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                Crime Analysis Dashboard
              </h1>
              <p className="text-gray-300 mt-2 text-sm lg:text-base">
                Advanced analytics for crime prevention and safety insights
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full lg:w-auto">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center w-full sm:w-auto">
                <div>
                  <div className="text-lg sm:text-xl font-bold text-blue-400">{totalCrimes.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Total Cases</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-green-400">{closureRate}%</div>
                  <div className="text-xs text-gray-400">Solved</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-red-400">{weaponRate}%</div>
                  <div className="text-xs text-gray-400">Armed</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full">
                <button
                  onClick={loadActualData}
                  disabled={loading}
                  className="btn-primary flex items-center px-4 py-3 rounded-xl font-semibold text-sm min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in-up"
                  style={{animationDelay: '0.4s'}}
                >
                  <BarChart3 className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">{loading ? '🔄 Loading...' : '📊 Load Real Dataset'}</span>
                  <span className="sm:hidden">{loading ? 'Load...' : 'Data'}</span>
                </button>
                <button
                  onClick={handleRefreshData}
                  disabled={loading}
                  className="btn-primary flex items-center px-4 py-3 rounded-xl font-semibold text-sm min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in-up"
                  style={{animationDelay: '0.5s'}}
                >
                  <TrendingUp className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">{loading ? '🔄 Refreshing...' : '🔄 Refresh Data'}</span>
                  <span className="sm:hidden">{loading ? 'Refresh...' : 'Refresh'}</span>
                </button>
                <button
                  onClick={() => setShowUpload(true)}
                  className="btn-primary flex items-center px-4 py-3 rounded-xl font-semibold text-sm min-h-[48px] animate-fade-in-up"
                  style={{animationDelay: '0.6s'}}
                >
                  <Upload className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">📤 Upload Dataset</span>
                  <span className="sm:hidden">Upload</span>
                </button>
                <button
                  onClick={() => setShowHelp(true)}
                  className="btn-primary flex items-center p-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-white/30 animate-pulse-glow animate-fade-in-up"
                  style={{animationDelay: '0.7s'}}
                  title="Help & Instructions"
                >
                  <HelpCircle className="w-6 h-6" />
                  <span className="hidden lg:inline ml-2 font-semibold">Help</span>
                </button>
              </div>
            </div>
          </div>
          
          {dataSource === 'demo' && (
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-5 mb-6 shadow-lg animate-fade-in-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm mr-3">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/95">
                      📊 Demo Dataset Active
                    </p>
                    <p className="text-xs text-white/80 mt-1">
                      {totalCrimes.toLocaleString()} sample records • Indian crime data simulation
                    </p>
                  </div>
                </div>
                {predictionAccuracy && (
                  <div className="text-right bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                    <p className="text-lg font-bold text-white text-shadow">
                      {Math.round(predictionAccuracy.overallAccuracy * 100)}%
                    </p>
                    <p className="text-xs text-white/80 font-medium">AI Accuracy</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {dataSource === 'uploaded' && (
            <div className="status-success rounded-2xl p-5 mb-6 shadow-2xl animate-fade-in-up border-2 border-green-400/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-green-800">
                      📈 Custom Dataset Loaded
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      {totalCrimes.toLocaleString()} records • Real-time analysis active
                    </p>
                  </div>
                </div>
                {predictionAccuracy && (
                  <div className="text-right bg-green-100 rounded-lg px-4 py-3">
                    <p className="text-2xl font-bold text-green-800">
                      {Math.round(predictionAccuracy.overallAccuracy * 100)}%
                    </p>
                    <p className="text-sm text-green-600 font-semibold">AI Accuracy</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-enhanced">
          <div className="border-b border-white/20 backdrop-blur-sm">
            <nav className="flex items-center space-x-1 md:space-x-2 px-6 overflow-x-auto scrollbar-hide py-2">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-3 md:px-4 rounded-lg font-semibold text-xs md:text-sm flex items-center space-x-2 whitespace-nowrap flex-shrink-0 transition-all duration-300 animate-fade-in-up ${
                    activeTab === tab.id
                      ? 'bg-white/25 text-white border-2 border-white/40 backdrop-blur-md transform scale-105 shadow-lg'
                      : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 hover:text-white hover:scale-102 backdrop-blur-sm'
                  }`}
                  style={{animationDelay: `${0.8 + index * 0.1}s`}}
                >
                  <tab.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Enhanced Key Metrics with Premium Graphics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="gradient-blue-light p-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 animate-fade-in-up animate-float">
                    <div className="flex items-center">
                      <div className="p-3 bg-white/30 rounded-xl backdrop-blur-sm">
                        <BarChart3 className="w-8 h-8 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-white/90">📊 Total Crimes</p>
                        <p className="text-3xl font-bold text-white text-shadow-lg">
                          {totalCrimes.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/80 mt-1 font-medium">
                          Across {cityStats.length} cities
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="gradient-green-light p-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 animate-fade-in-up animate-float" style={{animationDelay: '0.1s'}}>
                    <div className="flex items-center">
                      <div className="p-3 bg-white/30 rounded-xl backdrop-blur-sm">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-white/90">🛡️ Cases Closed</p>
                        <p className="text-3xl font-bold text-white text-shadow-lg">
                          {closureRate}%
                        </p>
                        <p className="text-xs text-white/80 mt-1 font-medium">
                          {closedCases.toLocaleString()} solved cases
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="gradient-orange-light p-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 animate-fade-in-up animate-float" style={{animationDelay: '0.2s'}}>
                    <div className="flex items-center">
                      <div className="p-3 bg-white/30 rounded-xl backdrop-blur-sm">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-white/90">👥 Avg Victim Age</p>
                        <p className="text-3xl font-bold text-white text-shadow-lg">
                          {averageAge}
                        </p>
                        <p className="text-xs text-white/80 mt-1 font-medium">
                          years old
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="gradient-red-light p-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 animate-fade-in-up animate-float" style={{animationDelay: '0.3s'}}>
                    <div className="flex items-center">
                      <div className="p-3 bg-white/30 rounded-xl backdrop-blur-sm">
                        <AlertTriangle className="w-8 h-8 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-white/90">⚔️ Weapon Crimes</p>
                        <p className="text-3xl font-bold text-white text-shadow-lg">
                          {weaponRate}%
                        </p>
                        <p className="text-xs text-white/80 mt-1 font-medium">
                          {weaponCrimes.toLocaleString()} armed incidents
                        </p>
                      </div>
                    </div>
                  </div>

                  {predictionAccuracy && (
                    <div className="gradient-purple-light p-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 animate-fade-in-up animate-float animate-pulse-glow" style={{animationDelay: '0.4s'}}>
                      <div className="flex items-center">
                        <div className="p-3 bg-white/30 rounded-xl backdrop-blur-sm">
                          <Target className="w-8 h-8 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-semibold text-white/90">🤖 AI Accuracy</p>
                          <p className="text-3xl font-bold text-white text-shadow-lg">
                            {Math.round(predictionAccuracy.overallAccuracy * 100)}%
                          </p>
                          <p className="text-xs text-white/80 mt-1 font-medium">
                            Prediction reliability
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CrimeChart data={data} />
                  <CityRankings 
                    cityStats={cityStats} 
                    onViewAll={() => setShowAllCities(true)}
                  />
                </div>
              </div>
            )}

            {activeTab === 'trends' && <CrimeChart data={data} fullSize />}
            {activeTab === 'predictions' && <AccuratePredictionsPanel data={data} />}
            {activeTab === 'cities' && <CityRankings cityStats={cityStats} fullSize showSafetyDetails />}
            {activeTab === 'time' && <TimeHeatmap timeAnalysis={timeAnalysis} data={data} />}
            {activeTab === 'demographics' && (
              <VictimDemographics
                data={data}
                selectedCity={selectedCity}
                onCityChange={setSelectedCity}
                cities={cityStats.map(c => c.city)}
              />
            )}
            
            {activeTab === 'safety' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Safety Recommendations for {selectedCity}
                      </h3>
                      <div className="mt-2">
                        <div className="flex space-x-4 mb-4">
                          <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {cityStats.map(city => (
                              <option key={city.city} value={city.city}>
                                {city.city}
                              </option>
                            ))}
                          </select>
                          <select
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>
                                {String(i).padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          {safetyData.recommendations.map((rec, index) => (
                            <p key={index} className="text-sm text-yellow-700">
                              {rec}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Safety Centers Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center mb-6">
                    <Shield className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Nearby Safety Centers in {selectedCity}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {safetyData.safetyCenters.map((center, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            {center.type === 'Police Station' && <Shield className="w-5 h-5 text-blue-500 mr-2" />}
                            {center.type === 'Hospital' && <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-2"><span className="text-white text-xs">+</span></div>}
                            {center.type === 'Fire Station' && <div className="w-5 h-5 bg-orange-500 rounded-full mr-2"></div>}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {center.name}
                              </h4>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                center.type === 'Police Station' ? 'bg-blue-100 text-blue-800' :
                                center.type === 'Hospital' ? 'bg-red-100 text-red-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {center.type}
                              </span>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            center.availability === '24/7'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {center.availability}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          📍 {center.address}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          📞 {center.phone}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Services:</p>
                          <div className="flex flex-wrap gap-1">
                            {center.services.slice(0, 3).map((service, serviceIndex) => (
                              <span key={serviceIndex} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                {service}
                              </span>
                            ))}
                            {center.services.length > 3 && (
                              <span className="text-xs text-gray-500">+{center.services.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <IncidentAnalysis data={data} selectedCity={selectedCity} />
              </div>
            )}

            {activeTab === 'chat' && <ChatBot data={data} cityStats={cityStats} />}
          </div>
        </div>
        
        {showUpload && (
          <FileUpload
            onDataLoaded={handleDataUpload}
            onClose={() => setShowUpload(false)}
          />
        )}

        <HelpSystem
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
        />
        
        {showAllCities && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  All Cities Analysis
                </h2>
                <button
                  onClick={() => setShowAllCities(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <CityRankings cityStats={cityStats} fullSize showSafetyDetails />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
