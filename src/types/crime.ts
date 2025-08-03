export interface CrimeRecord {
  reportNumber: string;
  dateReported: Date;
  dateOfOccurrence: Date;
  timeOfOccurrence: string;
  city: string;
  crimeCode: string;
  crimeDescription: string;
  victimAge: number;
  victimGender: 'Male' | 'Female' | 'Other';
  weaponUsed: string;
  crimeDomain: string;
  policeDeployed: boolean;
  caseClosed: 'Yes' | 'No';
  dateCaseClosed?: Date;
}

export interface CityStats {
  city: string;
  totalCrimes: number;
  closedCases: number;
  averageAge: number;
  mostCommonCrime: string;
  safetyRating: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  lastIncident: Date;
}

export interface TimeAnalysis {
  hour: number;
  crimeCount: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}