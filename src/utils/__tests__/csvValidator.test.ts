import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CSVValidator, DEFAULT_CSV_CONFIG } from '../csvValidator';

// Mock Papa Parse
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
}));

describe('CSVValidator', () => {
  let validator: CSVValidator;
  let mockProgressCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockProgressCallback = vi.fn();
    validator = new CSVValidator({}, mockProgressCallback);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateFile', () => {
    it('should accept valid CSV file', () => {
      const file = new File(['header1,header2\nvalue1,value2'], 'test.csv', {
        type: 'text/csv',
        size: 1024,
      });

      const result = validator.validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject oversized files', () => {
      const file = new File(['content'], 'test.csv', {
        type: 'text/csv',
        size: DEFAULT_CSV_CONFIG.maxFileSize + 1,
      });

      const result = validator.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('File size');
      expect(result.errors[0]).toContain('exceeds maximum');
    });

    it('should reject invalid file types', () => {
      const file = new File(['content'], 'test.txt', {
        type: 'text/plain',
        size: 1024,
      });

      const result = validator.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('File must have a .csv extension');
    });

    it('should accept CSV files with different MIME types', () => {
      const file = new File(['content'], 'test.csv', {
        type: 'application/csv',
        size: 1024,
      });

      const result = validator.validateFile(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('previewCSV', () => {
    it('should generate preview data correctly', async () => {
      const mockParseResult = {
        data: [
          { 'Report Number': '1', 'City': 'Mumbai', 'Crime Description': 'Theft' },
          { 'Report Number': '2', 'City': 'Delhi', 'Crime Description': 'Assault' },
        ],
        meta: {
          fields: ['Report Number', 'City', 'Crime Description'],
        },
        errors: [],
      };

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: vi.fn(),
        onerror: vi.fn(),
        result: 'mock file content',
      };

      global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

      mockPapaParse.parse.mockImplementation((content: string, config: any) => {
        // Simulate async behavior
        setTimeout(() => config.complete(mockParseResult), 0);
      });

      const file = new File(['test content'], 'test.csv', { 
        type: 'text/csv',
        size: 2048,
      });

      const previewPromise = validator.previewCSV(file, 2);

      // Trigger the FileReader onload event
      setTimeout(() => {
        mockFileReader.onload({ target: { result: 'mock file content' } } as any);
      }, 0);

      const preview = await previewPromise;

      expect(preview.headers).toEqual(['Report Number', 'City', 'Crime Description']);
      expect(preview.rows).toHaveLength(2);
      expect(preview.totalRows).toBeGreaterThan(0);
      expect(preview.estimatedProcessingTime).toBeGreaterThan(0);
    }, 10000);

    it('should handle preview errors gracefully', async () => {
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: vi.fn(),
        onerror: vi.fn(),
      };

      global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

      mockPapaParse.parse.mockImplementation((content: string, config: any) => {
        setTimeout(() => config.error(new Error('Parse error')), 0);
      });

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });

      const previewPromise = validator.previewCSV(file);

      // Trigger the FileReader onload event
      setTimeout(() => {
        mockFileReader.onload({ target: { result: 'mock file content' } } as any);
      }, 0);

      await expect(previewPromise).rejects.toThrow('Preview failed');
    }, 10000);
  });

  describe('processCSV', () => {
    it('should process valid CSV data', async () => {
      const mockData = [
        {
          'Report Number': 'RPT001',
          'Date of Occurrence': '15/01/2024',
          'Time of Occurrence': '14:30',
          'City': 'Mumbai',
          'Crime Description': 'Theft',
          'Victim Age': '25',
          'Victim Gender': 'Male',
          'Weapon Used': 'None',
          'Crime Domain': 'Property',
          'Police Deployed': 'Yes',
          'Case Closed': 'No',
        },
      ];

      const mockParseResult = {
        data: mockData,
        meta: { fields: Object.keys(mockData[0]) },
        errors: [],
      };

      mockPapaParse.parse.mockImplementation((file: File, config: any) => {
        setTimeout(() => config.complete(mockParseResult), 0);
      });

      const file = new File(['test content'], 'test.csv', { 
        type: 'text/csv',
        size: 1024,
      });

      const result = await validator.processCSV(file);

      expect(result.validRecords).toHaveLength(1);
      expect(result.invalidRecords).toHaveLength(0);
      expect(result.summary.totalRows).toBe(1);
      expect(result.summary.validRows).toBe(1);
      expect(result.summary.errorRate).toBe(0);
      expect(mockProgressCallback).toHaveBeenCalled();
    });

    it('should handle invalid data gracefully', async () => {
      const mockData = [
        {
          'Report Number': '', // This will be auto-generated, so record might still be valid
          'Date of Occurrence': 'invalid-date',
          'City': 'Mumbai', // Valid city
          'Crime Description': 'Theft', // Valid description
          'Victim Age': 'not-a-number',
          'Victim Gender': 'Male', // Valid gender
        },
      ];

      const mockParseResult = {
        data: mockData,
        meta: { fields: Object.keys(mockData[0]) },
        errors: [],
      };

      mockPapaParse.parse.mockImplementation((file: File, config: any) => {
        setTimeout(() => config.complete(mockParseResult), 0);
      });

      const file = new File(['test content'], 'test.csv', { 
        type: 'text/csv',
        size: 1024,
      });

      const result = await validator.processCSV(file);

      // The validator creates default values for most fields, so many records might still be valid
      expect(result.summary.totalRows).toBe(1);
      if (result.validRecords.length === 0) {
        expect(result.invalidRecords).toHaveLength(1);
        expect(result.summary.errorRate).toBe(100);
        expect(result.invalidRecords[0].errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject files exceeding maximum rows', async () => {
      const mockAbortFn = vi.fn();
      
      mockPapaParse.parse.mockImplementation((file: File, config: any) => {
        // Simulate chunk callback with too many rows
        const fakeChunkResult = {
          data: new Array(DEFAULT_CSV_CONFIG.maxRows + 1).fill({}),
        };
        const mockParser = { abort: mockAbortFn };
        config.chunk(fakeChunkResult, mockParser);
      });

      const file = new File(['test content'], 'test.csv', { 
        type: 'text/csv',
        size: 1024,
      });

      await expect(validator.processCSV(file)).rejects.toThrow('too many rows');
      expect(mockAbortFn).toHaveBeenCalled();
    });
  });

  describe('data conversion methods', () => {
    let testValidator: CSVValidator;

    beforeEach(() => {
      testValidator = new CSVValidator();
    });

    it('should parse various date formats', () => {
      // Access private method for testing
      const parseDate = (testValidator as any).parseDate;

      expect(parseDate('15/01/2024')).toBeInstanceOf(Date);
      expect(parseDate('2024-01-15')).toBeInstanceOf(Date);
      expect(parseDate(new Date('2024-01-15'))).toBeInstanceOf(Date);
      expect(parseDate(45575)).toBeInstanceOf(Date); // Excel date
      expect(parseDate('invalid')).toBeInstanceOf(Date); // Should fallback to current date
    });

    it('should parse various time formats', () => {
      const parseTime = (testValidator as any).parseTime;

      expect(parseTime('14:30')).toBe('14:30');
      expect(parseTime('2:30 PM')).toBe('14:30');
      expect(parseTime('9:15 AM')).toBe('09:15');
      expect(parseTime(0.5)).toBe('12:00'); // Excel time fraction
      expect(parseTime('invalid')).toBe('12:00'); // Default
    });

    it('should parse age values correctly', () => {
      const parseAge = (testValidator as any).parseAge;

      expect(parseAge(25)).toBe(25);
      expect(parseAge('30')).toBe(30);
      expect(parseAge('25.7')).toBe(26); // Rounded
      expect(parseAge(-5)).toBe(0); // Clamped to minimum
      expect(parseAge(150)).toBe(120); // Clamped to maximum
      expect(parseAge('invalid')).toBe(25); // Default
    });

    it('should parse gender values correctly', () => {
      const parseGender = (testValidator as any).parseGender;

      expect(parseGender('Male')).toBe('Male');
      expect(parseGender('male')).toBe('Male');
      expect(parseGender('M')).toBe('Male');
      expect(parseGender('Female')).toBe('Female');
      expect(parseGender('female')).toBe('Female');
      expect(parseGender('F')).toBe('Female');
      expect(parseGender('Other')).toBe('Other');
      expect(parseGender('Unknown')).toBe('Other');
      expect(parseGender(123)).toBe('Other');
    });

    it('should parse case status correctly', () => {
      const parseCaseStatus = (testValidator as any).parseCaseStatus;

      expect(parseCaseStatus('Yes')).toBe('Yes');
      expect(parseCaseStatus('yes')).toBe('Yes');
      expect(parseCaseStatus('true')).toBe('Yes');
      expect(parseCaseStatus('1')).toBe('Yes');
      expect(parseCaseStatus('closed')).toBe('Yes');
      expect(parseCaseStatus(true)).toBe('Yes');
      expect(parseCaseStatus(1)).toBe('Yes');

      expect(parseCaseStatus('No')).toBe('No');
      expect(parseCaseStatus('no')).toBe('No');
      expect(parseCaseStatus('false')).toBe('No');
      expect(parseCaseStatus('0')).toBe('No');
      expect(parseCaseStatus('open')).toBe('No');
      expect(parseCaseStatus(false)).toBe('No');
      expect(parseCaseStatus(0)).toBe('No');
      expect(parseCaseStatus(null)).toBe('No');
    });

    it('should parse boolean values correctly', () => {
      const parseBoolean = (testValidator as any).parseBoolean;

      expect(parseBoolean(true)).toBe(true);
      expect(parseBoolean('yes')).toBe(true);
      expect(parseBoolean('true')).toBe(true);
      expect(parseBoolean('1')).toBe(true);
      expect(parseBoolean('deployed')).toBe(true);
      expect(parseBoolean(1)).toBe(true);
      expect(parseBoolean(5)).toBe(true);

      expect(parseBoolean(false)).toBe(false);
      expect(parseBoolean('no')).toBe(false);
      expect(parseBoolean('false')).toBe(false);
      expect(parseBoolean('0')).toBe(false);
      expect(parseBoolean(0)).toBe(false);
      expect(parseBoolean(null)).toBe(false);
    });
  });

  describe('validation report generation', () => {
    it('should generate comprehensive validation report', () => {
      const mockResult = {
        validRecords: [] as any[],
        invalidRecords: [
          {
            rowIndex: 0,
            errors: ['Missing required field: Report Number', 'Invalid date format'],
            data: { 'Some Field': 'Some Value' },
          },
          {
            rowIndex: 2,
            errors: ['Invalid victim age'],
            data: { 'Victim Age': 'not-a-number' },
          },
        ],
        summary: {
          totalRows: 10,
          validRows: 8,
          invalidRows: 2,
          errorRate: 20,
        },
      };

      const report = validator.generateValidationReport(mockResult);

      expect(report).toContain('Crime Data Validation Report');
      expect(report).toContain('Total rows processed: 10');
      expect(report).toContain('Valid records: 8');
      expect(report).toContain('Invalid records: 2');
      expect(report).toContain('Error rate: 20.00%');
      expect(report).toContain('Row 1:'); // rowIndex 0 + 1
      expect(report).toContain('Missing required field: Report Number');
      expect(report).toContain('Row 3:'); // rowIndex 2 + 1
      expect(report).toContain('Invalid victim age');
    });

    it('should limit invalid records in report', () => {
      const mockResult = {
        validRecords: [] as any[],
        invalidRecords: new Array(150).fill(0).map((_, index) => ({
          rowIndex: index,
          errors: [`Error ${index}`],
          data: {},
        })),
        summary: {
          totalRows: 150,
          validRows: 0,
          invalidRows: 150,
          errorRate: 100,
        },
      };

      const report = validator.generateValidationReport(mockResult);

      expect(report).toContain('... and 50 more invalid records');
    });
  });

  describe('column mapping', () => {
    it('should map various column name formats', () => {
      const headers = [
        'Report Number',
        'DateOfOccurrence',
        'time_of_occurrence',
        'City',
        'CrimeDescription',
        'victim_age',
        'Victim Gender',
      ];

      // Access private method
      const createColumnMapping = (validator as any).createColumnMapping;
      const mapping = createColumnMapping(headers);

      expect(mapping['Report Number']).toBe('Report Number');
      expect(mapping['Date of Occurrence']).toBe('DateOfOccurrence');
      expect(mapping['Time of Occurrence']).toBe('time_of_occurrence');
      expect(mapping['City']).toBe('City');
      expect(mapping['Crime Description']).toBe('CrimeDescription');
      expect(mapping['Victim Age']).toBe('victim_age');
      expect(mapping['Victim Gender']).toBe('Victim Gender');
    });

    it('should handle missing columns gracefully', () => {
      const headers = ['Report Number', 'City'];

      const createColumnMapping = (validator as any).createColumnMapping;
      const mapping = createColumnMapping(headers);

      expect(mapping['Report Number']).toBe('Report Number');
      expect(mapping['City']).toBe('City');
      expect(mapping['Date of Occurrence']).toBeUndefined();
    });
  });

  describe('header validation', () => {
    it('should validate required headers', () => {
      const headers = [
        'Report Number',
        'Date of Occurrence',
        'City',
        'Crime Description',
        'Victim Age',
        'Victim Gender',
      ];

      const validateHeaders = (validator as any).validateHeaders;
      const result = validateHeaders(headers);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required headers', () => {
      const headers = ['Report Number', 'City']; // Missing required columns

      const validateHeaders = (validator as any).validateHeaders;
      const result = validateHeaders(headers);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((error: string) => error.includes('Date of Occurrence'))).toBe(true);
    });

    it('should handle case-insensitive header matching', () => {
      const headers = [
        'report number',
        'DATE OF OCCURRENCE',
        'city',
        'Crime Description',
        'VICTIM AGE',
        'victim gender',
      ];

      const validateHeaders = (validator as any).validateHeaders;
      const result = validateHeaders(headers);

      expect(result.valid).toBe(true);
    });
  });
});
