import { z } from 'zod';
import Papa from 'papaparse';
import { 
  CrimeRecord, 
  CrimeRecordSchema, 
  DataValidationResult, 
  ProcessingProgress,
  ValidationError,
  createProcessingError
} from '../types/crime';
import { safeParseDateString, safeParseTimeString, parseExcelDate } from './dateUtils';

export interface CSVValidationConfig {
  maxFileSize: number; // in bytes
  maxRows: number;
  allowedMimeTypes: string[];
  requiredColumns: string[];
  strictValidation: boolean;
  skipEmptyRows: boolean;
  trimWhitespace: boolean;
}

export interface CSVPreviewData {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  estimatedProcessingTime: number;
}

export const DEFAULT_CSV_CONFIG: CSVValidationConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxRows: 100000,
  allowedMimeTypes: ['text/csv', 'application/csv', 'text/plain'],
  requiredColumns: [
    'Report Number',
    'Date of Occurrence',
    'City',
    'Crime Description',
    'Victim Age',
    'Victim Gender'
  ],
  strictValidation: false,
  skipEmptyRows: true,
  trimWhitespace: true,
};

/**
 * Column mapping for different naming conventions
 */
const COLUMN_MAPPINGS: Record<string, string[]> = {
  'Report Number': ['Report Number', 'ReportNumber', 'report_number', 'ID', 'Case ID'],
  'Date Reported': ['Date Reported', 'DateReported', 'date_reported', 'Report Date'],
  'Date of Occurrence': ['Date of Occurrence', 'DateOfOccurrence', 'date_of_occurrence', 'Incident Date', 'Crime Date'],
  'Time of Occurrence': ['Time of Occurrence', 'TimeOfOccurrence', 'time_of_occurrence', 'Incident Time', 'Crime Time'],
  'City': ['City', 'city', 'Location', 'location', 'Municipality'],
  'Crime Code': ['Crime Code', 'CrimeCode', 'crime_code', 'Code', 'Offense Code'],
  'Crime Description': ['Crime Description', 'CrimeDescription', 'crime_description', 'Offense', 'Crime Type'],
  'Victim Age': ['Victim Age', 'VictimAge', 'victim_age', 'Age'],
  'Victim Gender': ['Victim Gender', 'VictimGender', 'victim_gender', 'Gender', 'Sex'],
  'Weapon Used': ['Weapon Used', 'WeaponUsed', 'weapon_used', 'Weapon', 'Method'],
  'Crime Domain': ['Crime Domain', 'CrimeDomain', 'crime_domain', 'Category', 'Domain'],
  'Police Deployed': ['Police Deployed', 'PoliceDeployed', 'police_deployed', 'Response'],
  'Case Closed': ['Case Closed', 'CaseClosed', 'case_closed', 'Status', 'Solved'],
  'Date Case Closed': ['Date Case Closed', 'DateCaseClosed', 'date_case_closed', 'Closure Date'],
};

export class CSVValidator {
  private config: CSVValidationConfig;
  private onProgress?: (progress: ProcessingProgress) => void;

  constructor(config: Partial<CSVValidationConfig> = {}, onProgress?: (progress: ProcessingProgress) => void) {
    this.config = { ...DEFAULT_CSV_CONFIG, ...config };
    this.onProgress = onProgress;
  }

  /**
   * Validate file before processing
   */
  validateFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file size
    if (file.size > this.config.maxFileSize) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(this.config.maxFileSize / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Check file type
    if (!this.config.allowedMimeTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
      errors.push(`File type "${file.type}" is not allowed. Supported types: ${this.config.allowedMimeTypes.join(', ')}`);
    }

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      errors.push('File must have a .csv extension');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Preview CSV file to show first few rows and headers
   */
  async previewCSV(file: File, previewRows: number = 5): Promise<CSVPreviewData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target?.result as string;
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          preview: previewRows + 1, // +1 to get total count estimate
          complete: (results) => {
            const headers = results.meta.fields || [];
            const rows = results.data as Record<string, unknown>[];
            
            // Estimate total rows by file size ratio
            const previewSize = new Blob([csvText.slice(0, 1000)]).size;
            const estimatedTotalRows = Math.round((file.size / previewSize) * previewRows);
            const estimatedProcessingTime = Math.max(1, Math.round(estimatedTotalRows / 1000)) * 2; // 2 seconds per 1000 rows

            resolve({
              headers,
              rows: rows.slice(0, previewRows),
              totalRows: estimatedTotalRows,
              estimatedProcessingTime
            });
          },
          error: (error) => {
            reject(createProcessingError(`Preview failed: ${error.message}`, 'PARSING_ERROR'));
          }
        });
      };
      
      reader.onerror = () => {
        reject(createProcessingError('Failed to read file', 'FILE_ERROR'));
      };
      
      reader.readAsText(file.slice(0, 10000)); // Read first 10KB for preview
    });
  }

  /**
   * Process and validate CSV file
   */
  async processCSV(file: File): Promise<DataValidationResult> {
    const fileValidation = this.validateFile(file);
    if (!fileValidation.valid) {
      throw createProcessingError(
        `File validation failed: ${fileValidation.errors.join(', ')}`,
        'VALIDATION_ERROR',
        { errors: fileValidation.errors }
      );
    }

    this.updateProgress(0, 'Initializing file processing...');

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: this.config.skipEmptyRows,
        complete: (results) => {
          try {
            this.updateProgress(25, 'Parsing completed, validating data...');
            this.processParseResults(results).then(resolve).catch(reject);
          } catch (error) {
            reject(createProcessingError(
              `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              'PARSING_ERROR',
              error
            ));
          }
        },
        error: (error) => {
          reject(createProcessingError(`CSV parsing failed: ${error.message}`, 'PARSING_ERROR', error));
        },
        chunk: (results, parser) => {
          // Handle large files in chunks
          if (results.data.length > this.config.maxRows) {
            parser.abort();
            reject(createProcessingError(
              `File contains too many rows (${results.data.length}). Maximum allowed: ${this.config.maxRows}`,
              'VALIDATION_ERROR'
            ));
          }
        }
      });
    });
  }

  /**
   * Process Papa Parse results
   */
  private async processParseResults(results: Papa.ParseResult<Record<string, unknown>>): Promise<DataValidationResult> {
    const { data, errors: parseErrors, meta } = results;

    if (parseErrors.length > 0) {
      console.warn('CSV parsing warnings:', parseErrors);
    }

    this.updateProgress(35, 'Validating column headers...');

    // Validate headers
    const headers = meta.fields || [];
    const headerValidation = this.validateHeaders(headers);
    
    if (!headerValidation.valid && this.config.strictValidation) {
      throw createProcessingError(
        `Header validation failed: ${headerValidation.errors.join(', ')}`,
        'VALIDATION_ERROR',
        { missingColumns: headerValidation.errors }
      );
    }

    this.updateProgress(45, 'Creating column mapping...');

    // Create column mapping
    const columnMapping = this.createColumnMapping(headers);

    this.updateProgress(50, 'Processing data rows...');

    // Process data in chunks for better performance
    const chunkSize = 1000;
    const validRecords: CrimeRecord[] = [];
    const invalidRecords: Array<{
      rowIndex: number;
      errors: string[];
      data: Record<string, unknown>;
    }> = [];

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const chunkResults = await this.processChunk(chunk, columnMapping, i);
      
      validRecords.push(...chunkResults.valid);
      invalidRecords.push(...chunkResults.invalid);

      const progress = 50 + ((i + chunk.length) / data.length) * 45;
      this.updateProgress(progress, `Processing rows ${i + 1}-${Math.min(i + chunk.length, data.length)} of ${data.length}...`);

      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.updateProgress(100, 'Processing complete!');

    const summary = {
      totalRows: data.length,
      validRows: validRecords.length,
      invalidRows: invalidRecords.length,
      errorRate: data.length > 0 ? (invalidRecords.length / data.length) * 100 : 0,
    };

    return {
      validRecords,
      invalidRecords,
      summary
    };
  }

  /**
   * Validate CSV headers
   */
  private validateHeaders(headers: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());

    for (const requiredColumn of this.config.requiredColumns) {
      const possibleNames = COLUMN_MAPPINGS[requiredColumn] || [requiredColumn];
      const found = possibleNames.some(name => 
        normalizedHeaders.includes(name.toLowerCase())
      );

      if (!found) {
        errors.push(`Missing required column: "${requiredColumn}". Expected one of: ${possibleNames.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create mapping from CSV headers to standard field names
   */
  private createColumnMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    for (const [standardName, variations] of Object.entries(COLUMN_MAPPINGS)) {
      for (const variation of variations) {
        const foundHeader = headers.find(h => 
          h.trim().toLowerCase() === variation.toLowerCase()
        );
        if (foundHeader) {
          mapping[standardName] = foundHeader;
          break;
        }
      }
    }

    return mapping;
  }

  /**
   * Process a chunk of data rows
   */
  private async processChunk(
    chunk: Record<string, unknown>[],
    columnMapping: Record<string, string>,
    startIndex: number
  ): Promise<{
    valid: CrimeRecord[];
    invalid: Array<{ rowIndex: number; errors: string[]; data: Record<string, unknown> }>;
  }> {
    const valid: CrimeRecord[] = [];
    const invalid: Array<{ rowIndex: number; errors: string[]; data: Record<string, unknown> }> = [];

    for (let i = 0; i < chunk.length; i++) {
      const row = chunk[i];
      const rowIndex = startIndex + i;

      try {
        const crimeRecord = this.mapRowToCrimeRecord(row, columnMapping);
        const validation = CrimeRecordSchema.safeParse(crimeRecord);

        if (validation.success) {
          valid.push(validation.data);
        } else {
          const errors = validation.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          );
          invalid.push({ rowIndex, errors, data: row });
        }
      } catch (error) {
        invalid.push({
          rowIndex,
          errors: [`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          data: row
        });
      }
    }

    return { valid, invalid };
  }

  /**
   * Map CSV row to CrimeRecord with robust data conversion
   */
  private mapRowToCrimeRecord(
    row: Record<string, unknown>,
    columnMapping: Record<string, string>
  ): CrimeRecord {
    const getValue = (standardName: string): unknown => {
      const columnName = columnMapping[standardName];
      if (!columnName) return undefined;
      
      let value = row[columnName];
      
      // Trim whitespace if it's a string
      if (typeof value === 'string' && this.config.trimWhitespace) {
        value = value.trim();
      }
      
      return value;
    };

    // Required fields with fallbacks
    const reportNumber = this.parseString(getValue('Report Number')) || 
                        `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const city = this.parseString(getValue('City')) || 'Unknown';
    const crimeDescription = this.parseString(getValue('Crime Description')) || 'Unknown';

    // Date parsing with robust error handling
    const dateOfOccurrence = this.parseDate(getValue('Date of Occurrence'));
    const dateReported = this.parseDate(getValue('Date Reported')) || dateOfOccurrence;
    const dateCaseClosed = this.parseOptionalDate(getValue('Date Case Closed'));

    // Time parsing
    const timeOfOccurrence = this.parseTime(getValue('Time of Occurrence'));

    // Numeric fields
    const victimAge = this.parseAge(getValue('Victim Age'));

    // Enum fields
    const victimGender = this.parseGender(getValue('Victim Gender'));
    const caseClosed = this.parseCaseStatus(getValue('Case Closed'));

    // String fields with defaults
    const crimeCode = this.parseString(getValue('Crime Code')) || 'UNKNOWN';
    const weaponUsed = this.parseString(getValue('Weapon Used')) || 'None';
    const crimeDomain = this.parseString(getValue('Crime Domain')) || 'Other';

    // Boolean fields
    const policeDeployed = this.parseBoolean(getValue('Police Deployed'));

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
      dateCaseClosed,
    };
  }

  // Helper parsing methods
  private parseString(value: unknown): string | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    return String(value).trim();
  }

  private parseDate(value: unknown): Date {
    if (value instanceof Date) return value;
    
    if (typeof value === 'number') {
      const excelResult = parseExcelDate(value);
      if (excelResult.success) return excelResult.date!;
    }

    if (typeof value === 'string') {
      const stringResult = safeParseDateString(value);
      if (stringResult.success) return stringResult.date!;
    }

    // Fallback to current date
    return new Date();
  }

  private parseOptionalDate(value: unknown): Date | undefined {
    if (!value || value === '' || value === 'null' || value === 'undefined') {
      return undefined;
    }
    
    return this.parseDate(value);
  }

  private parseTime(value: unknown): string {
    if (typeof value === 'string') {
      const timeResult = safeParseTimeString(value);
      if (timeResult.success) return timeResult.time!;
    }

    if (typeof value === 'number') {
      const timeResult = safeParseTimeString(value.toString());
      if (timeResult.success) return timeResult.time!;
    }

    return '12:00'; // Default time
  }

  private parseAge(value: unknown): number {
    if (typeof value === 'number') {
      return Math.max(0, Math.min(120, Math.round(value)));
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return Math.max(0, Math.min(120, Math.round(parsed)));
      }
    }

    return 25; // Default age
  }

  private parseGender(value: unknown): 'Male' | 'Female' | 'Other' {
    if (typeof value !== 'string') return 'Other';
    
    const normalized = value.toLowerCase().trim();
    if (normalized.includes('male') && !normalized.includes('female')) return 'Male';
    if (normalized.includes('female')) return 'Female';
    if (normalized === 'm') return 'Male';
    if (normalized === 'f') return 'Female';
    
    return 'Other';
  }

  private parseCaseStatus(value: unknown): 'Yes' | 'No' {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      if (['yes', 'true', '1', 'closed', 'solved'].includes(normalized)) return 'Yes';
      if (['no', 'false', '0', 'open', 'unsolved'].includes(normalized)) return 'No';
    }

    if (typeof value === 'number') {
      return value > 0 ? 'Yes' : 'No';
    }

    return 'No';
  }

  private parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      return ['yes', 'true', '1', 'deployed'].includes(normalized);
    }

    if (typeof value === 'number') {
      return value > 0;
    }

    return false;
  }

  private updateProgress(current: number, stage: string) {
    if (this.onProgress) {
      this.onProgress({
        current: Math.min(100, Math.max(0, current)),
        total: 100,
        stage,
      });
    }
  }

  /**
   * Generate validation report for download
   */
  generateValidationReport(result: DataValidationResult): string {
    const lines: string[] = [];
    
    lines.push('Crime Data Validation Report');
    lines.push('================================');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    
    lines.push('Summary:');
    lines.push(`- Total rows processed: ${result.summary.totalRows}`);
    lines.push(`- Valid records: ${result.summary.validRows}`);
    lines.push(`- Invalid records: ${result.summary.invalidRows}`);
    lines.push(`- Error rate: ${result.summary.errorRate.toFixed(2)}%`);
    lines.push('');

    if (result.invalidRecords.length > 0) {
      lines.push('Invalid Records:');
      lines.push('----------------');
      
      for (const invalid of result.invalidRecords.slice(0, 100)) { // Limit to first 100 errors
        lines.push(`Row ${invalid.rowIndex + 1}:`);
        for (const error of invalid.errors) {
          lines.push(`  - ${error}`);
        }
        lines.push(`  Data: ${JSON.stringify(invalid.data)}`);
        lines.push('');
      }

      if (result.invalidRecords.length > 100) {
        lines.push(`... and ${result.invalidRecords.length - 100} more invalid records`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Download validation report as text file
   */
  downloadValidationReport(result: DataValidationResult, filename: string = 'validation-report.txt') {
    const report = this.generateValidationReport(result);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
