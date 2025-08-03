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

    // More realistic case closure rate (around 50%)
    const caseClosed = Math.random() > 0.5 ? 'Yes' : 'No';

    // More realistic gender distribution (60% Male, 35% Female, 5% Other)
    const genderRand = Math.random();
    const victimGender: 'Male' | 'Female' | 'Other' =
      genderRand < 0.6 ? 'Male' :
      genderRand < 0.95 ? 'Female' : 'Other';

    // More realistic weapon usage distribution
    // Most crimes don't involve weapons, some violent crimes do
    const weaponRand = Math.random();
    let weaponUsed: string;
    if (crimeType === 'Assault' || crimeType === 'Robbery') {
      // Violent crimes more likely to have weapons (40% chance)
      weaponUsed = weaponRand < 0.4 ? weapons[1 + Math.floor(Math.random() * 4)] : 'None';
    } else if (crimeType === 'Theft' || crimeType === 'Burglary') {
      // Property crimes less likely to have weapons (15% chance)
      weaponUsed = weaponRand < 0.15 ? weapons[1 + Math.floor(Math.random() * 4)] : 'None';
    } else {
      // Other crimes very unlikely to have weapons (5% chance)
      weaponUsed = weaponRand < 0.05 ? weapons[1 + Math.floor(Math.random() * 4)] : 'None';
    }

    // Age distribution more realistic (peak at 25-35)
    const ageRand = Math.random();
    const victimAge = ageRand < 0.3 ? 18 + Math.floor(Math.random() * 10) :  // 18-27
                     ageRand < 0.6 ? 28 + Math.floor(Math.random() * 10) :  // 28-37
                     ageRand < 0.8 ? 38 + Math.floor(Math.random() * 15) :  // 38-52
                     53 + Math.floor(Math.random() * 15);                  // 53-67

    data.push({
      reportNumber: `RPT${String(i).padStart(6, '0')}`,
      dateReported,
      dateOfOccurrence,
      timeOfOccurrence: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      crimeCode: `C${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
      crimeDescription: crimeType,
      victimAge,
      victimGender,
      weaponUsed,
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
