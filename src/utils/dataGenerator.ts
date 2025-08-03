import { CrimeRecord } from '../types/crime';

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];
const crimeTypes = [
  'Theft', 'Burglary', 'Assault', 'Robbery', 'Fraud', 'Vandalism', 
  'Drug Offense', 'Domestic Violence', 'Cybercrime', 'Traffic Violation'
];
const weapons = ['None', 'Knife', 'Gun', 'Blunt Object', 'Other', 'Unknown'];
const domains = ['Property', 'Violent', 'Financial', 'Cyber', 'Traffic', 'Drug'];

export function generateMockData(count: number = 50000): CrimeRecord[] {
  const data: CrimeRecord[] = [];
  
  for (let i = 0; i < count; i++) {
    const dateReported = new Date(2020 + Math.floor(Math.random() * 4), 
                                  Math.floor(Math.random() * 12), 
                                  Math.floor(Math.random() * 28));
    const dateOfOccurrence = new Date(dateReported.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    
    const crimeType = crimeTypes[Math.floor(Math.random() * crimeTypes.length)];
    const caseClosed = Math.random() > 0.3 ? 'Yes' : 'No';
    
    data.push({
      reportNumber: `RPT${String(i).padStart(6, '0')}`,
      dateReported,
      dateOfOccurrence,
      timeOfOccurrence: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      crimeCode: `C${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
      crimeDescription: crimeType,
      victimAge: 18 + Math.floor(Math.random() * 50),
      victimGender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)] as 'Male' | 'Female' | 'Other',
      weaponUsed: weapons[Math.floor(Math.random() * weapons.length)],
      crimeDomain: domains[Math.floor(Math.random() * domains.length)],
      policeDeployed: Math.random() > 0.2,
      caseClosed,
      dateCaseClosed: caseClosed === 'Yes' ? 
        new Date(dateReported.getTime() + Math.random() * 90 * 24 * 60 * 60 * 1000) : 
        undefined
    });
  }
  
  return data;
}

export function processDataInChunks<T, R>(
  data: T[], 
  processor: (chunk: T[]) => R[], 
  chunkSize: number = 1000
): R[] {
  const results: R[] = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    results.push(...processor(chunk));
  }
  
  return results;
}