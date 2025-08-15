import { initializeOpenAI } from '../services/openaiService';
import { CrimeRecord, CityStats } from '../types/crime';

// Simple test function to verify OpenAI service
export async function testOpenAIService(): Promise<boolean> {
  try {
    // Mock data for testing
    const mockData: CrimeRecord[] = [
      {
        reportNumber: 'TEST001',
        dateReported: new Date(),
        dateOfOccurrence: new Date(),
        timeOfOccurrence: '12:00',
        city: 'Test City',
        crimeCode: 'T001',
        crimeDescription: 'Test Crime',
        victimAge: 30,
        victimGender: 'Male',
        weaponUsed: 'None',
        crimeDomain: 'Test',
        policeDeployed: false,
        caseClosed: 'No'
      }
    ];

    const mockCityStats: CityStats[] = [
      {
        city: 'Test City',
        totalCrimes: 1,
        closedCases: 0,
        averageAge: 30,
        mostCommonCrime: 'Test Crime',
        safetyRating: 3,
        riskLevel: 'Medium',
        lastIncident: new Date()
      }
    ];

    // Initialize service with API key
    const apiKey = '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';
    const service = initializeOpenAI(apiKey);

    // Test simple query
    const response = await service.generateResponse('What is the total number of crimes?', mockData, mockCityStats);
    
    console.log('OpenAI Test Response:', response);
    return response.length > 0;
  } catch (error) {
    console.error('OpenAI Test Failed:', error);
    return false;
  }
}
