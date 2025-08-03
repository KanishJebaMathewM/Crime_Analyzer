import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { CrimeRecord } from '../types/crime';

export interface ProcessingProgress {
  current: number;
  total: number;
  stage: string;
}

export class ExcelProcessor {
  private onProgress?: (progress: ProcessingProgress) => void;

  constructor(onProgress?: (progress: ProcessingProgress) => void) {
    this.onProgress = onProgress;
  }

  async processFile(file: File): Promise<CrimeRecord[]> {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv')) {
      return this.processCSVFile(file);
    } else {
      return this.processExcelFile(file);
    }
  }

  async processCSVFile(file: File): Promise<CrimeRecord[]> {
    return new Promise((resolve, reject) => {
      this.updateProgress(0, 100, 'Reading CSV file...');

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            if (results.errors.length > 0) {
              console.warn('CSV parsing warnings:', results.errors);
            }

            this.updateProgress(40, 100, 'Processing CSV records...');

            const processedData = await this.processDataInChunks(results.data);

            this.updateProgress(100, 100, 'Complete!');
            resolve(processedData);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  }

  async processExcelFile(file: File): Promise<CrimeRecord[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          this.updateProgress(0, 100, 'Reading file...');

          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          this.updateProgress(20, 100, 'Parsing Excel data...');

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          this.updateProgress(40, 100, 'Processing records...');

          const processedData = await this.processDataInChunks(jsonData);

          this.updateProgress(100, 100, 'Complete!');
          resolve(processedData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private async processDataInChunks(rawData: any[]): Promise<CrimeRecord[]> {
    const chunkSize = 1000;
    const totalChunks = Math.ceil(rawData.length / chunkSize);
    const processedData: CrimeRecord[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, rawData.length);
      const chunk = rawData.slice(start, end);
      
      this.updateProgress(
        40 + (i / totalChunks) * 50,
        100,
        `Processing chunk ${i + 1}/${totalChunks}...`
      );

      const processedChunk = chunk.map(row => this.mapRowToCrimeRecord(row));
      processedData.push(...processedChunk);

      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return processedData.filter(record => record !== null);
  }

  private mapRowToCrimeRecord(row: any): CrimeRecord {
    try {
      // Handle different possible column names
      const reportNumber = row['Report Number'] || row['ReportNumber'] || row['report_number'] || `RPT${Math.random().toString(36).substr(2, 9)}`;
      
      const dateReported = this.parseDate(row['Date Reported'] || row['DateReported'] || row['date_reported']);
      const dateOfOccurrence = this.parseDate(row['Date of Occurrence'] || row['DateOfOccurrence'] || row['date_of_occurrence']);
      
      const timeOfOccurrence = this.parseTime(row['Time of Occurrence'] || row['TimeOfOccurrence'] || row['time_of_occurrence']);
      
      const city = row['City'] || row['city'] || 'Unknown';
      const crimeCode = row['Crime Code'] || row['CrimeCode'] || row['crime_code'] || 'C000';
      const crimeDescription = row['Crime Description'] || row['CrimeDescription'] || row['crime_description'] || 'Unknown';
      
      const victimAge = parseInt(row['Victim Age'] || row['VictimAge'] || row['victim_age']) || 25;
      const victimGender = this.parseGender(row['Victim Gender'] || row['VictimGender'] || row['victim_gender']);
      
      const weaponUsed = row['Weapon Used'] || row['WeaponUsed'] || row['weapon_used'] || 'None';
      const crimeDomain = row['Crime Domain'] || row['CrimeDomain'] || row['crime_domain'] || 'Other';
      
      const policeDeployed = this.parseBoolean(row['Police Deployed'] || row['PoliceDeployed'] || row['police_deployed']);
      const caseClosed = this.parseCaseClosed(row['Case Closed'] || row['CaseClosed'] || row['case_closed']);
      
      const dateCaseClosed = caseClosed === 'Yes' ? 
        this.parseDate(row['Date Case Closed'] || row['DateCaseClosed'] || row['date_case_closed']) : 
        undefined;

      return {
        reportNumber,
        dateReported,
        dateOfOccurrence,
        timeOfOccurrence,
        city,
        crimeCode,
        crimeDescription,
        victimAge,
        victimGender,
        weaponUsed,
        crimeDomain,
        policeDeployed,
        caseClosed,
        dateCaseClosed
      };
    } catch (error) {
      console.warn('Error processing row:', row, error);
      return null as any;
    }
  }

  private parseDate(dateValue: any): Date {
    if (!dateValue) return new Date();
    
    if (dateValue instanceof Date) return dateValue;
    
    // Handle Excel date numbers
    if (typeof dateValue === 'number') {
      return new Date((dateValue - 25569) * 86400 * 1000);
    }
    
    // Handle string dates
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private parseTime(timeValue: any): string {
    if (!timeValue) return '12:00';
    
    if (typeof timeValue === 'string') {
      // Handle various time formats
      const timeMatch = timeValue.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
      }
    }
    
    if (typeof timeValue === 'number') {
      // Handle Excel time numbers (fraction of day)
      const hours = Math.floor(timeValue * 24);
      const minutes = Math.floor((timeValue * 24 * 60) % 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    return '12:00';
  }

  private parseGender(genderValue: any): 'Male' | 'Female' | 'Other' {
    if (!genderValue) return 'Other';
    
    const gender = genderValue.toString().toLowerCase();
    if (gender.includes('male') && !gender.includes('female')) return 'Male';
    if (gender.includes('female')) return 'Female';
    return 'Other';
  }

  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'yes' || value.toLowerCase() === 'true' || value === '1';
    }
    if (typeof value === 'number') return value === 1;
    return false;
  }

  private parseCaseClosed(value: any): 'Yes' | 'No' {
    if (!value) return 'No';
    const str = value.toString().toLowerCase();
    return str === 'yes' || str === 'true' || str === '1' ? 'Yes' : 'No';
  }

  private updateProgress(current: number, total: number, stage: string) {
    if (this.onProgress) {
      this.onProgress({ current, total, stage });
    }
  }
}
