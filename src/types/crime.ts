import { z } from 'zod';

// Base validation schemas
export const CrimeGenderSchema = z.enum(['Male', 'Female', 'Other']);
export const CaseStatusSchema = z.enum(['Yes', 'No']);
export const RiskLevelSchema = z.enum(['Low', 'Medium', 'High']);
export const MessageTypeSchema = z.enum(['user', 'assistant']);

// Core crime record schema with comprehensive validation
export const CrimeRecordSchema = z.object({
  reportNumber: z.string().min(1, 'Report number is required'),
  dateReported: z.date(),
  dateOfOccurrence: z.date(),
  timeOfOccurrence: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  city: z.string().min(1, 'City is required'),
  crimeCode: z.string().min(1, 'Crime code is required'),
  crimeDescription: z.string().min(1, 'Crime description is required'),
  victimAge: z.number().int().min(0).max(120, 'Invalid age'),
  victimGender: CrimeGenderSchema,
  weaponUsed: z.string(),
  crimeDomain: z.string(),
  policeDeployed: z.boolean(),
  caseClosed: CaseStatusSchema,
  dateCaseClosed: z.date().optional(),
});

export const CityStatsSchema = z.object({
  city: z.string(),
  totalCrimes: z.number().int().min(0),
  closedCases: z.number().int().min(0),
  averageAge: z.number().min(0),
  mostCommonCrime: z.string(),
  safetyRating: z.number().min(1).max(5),
  riskLevel: RiskLevelSchema,
  lastIncident: z.date(),
});

export const TimeAnalysisSchema = z.object({
  hour: z.number().int().min(0).max(23),
  crimeCount: z.number().int().min(0),
  riskLevel: RiskLevelSchema,
});

export const ChatMessageSchema = z.object({
  id: z.string(),
  type: MessageTypeSchema,
  content: z.string(),
  timestamp: z.date(),
});

export const SafetyCenterSchema = z.object({
  name: z.string(),
  type: z.enum(['Police Station', 'Hospital', 'Fire Station', 'Emergency Services']),
  address: z.string(),
  phone: z.string(),
  availability: z.enum(['24/7', 'Business Hours']),
  services: z.array(z.string()),
});

// TypeScript types derived from schemas
export type CrimeRecord = z.infer<typeof CrimeRecordSchema>;
export type CityStats = z.infer<typeof CityStatsSchema>;
export type TimeAnalysis = z.infer<typeof TimeAnalysisSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type SafetyCenter = z.infer<typeof SafetyCenterSchema>;
export type CrimeGender = z.infer<typeof CrimeGenderSchema>;
export type CaseStatus = z.infer<typeof CaseStatusSchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

// Data processing schemas
export const ProcessingProgressSchema = z.object({
  current: z.number().min(0).max(100),
  total: z.number().min(0),
  stage: z.string(),
  recordsProcessed: z.number().int().min(0).optional(),
  errors: z.array(z.string()).optional(),
});

export const DataValidationResultSchema = z.object({
  validRecords: z.array(CrimeRecordSchema),
  invalidRecords: z.array(z.object({
    rowIndex: z.number(),
    errors: z.array(z.string()),
    data: z.record(z.unknown()),
  })),
  summary: z.object({
    totalRows: z.number().int().min(0),
    validRows: z.number().int().min(0),
    invalidRows: z.number().int().min(0),
    errorRate: z.number().min(0).max(100),
  }),
});

export type ProcessingProgress = z.infer<typeof ProcessingProgressSchema>;
export type DataValidationResult = z.infer<typeof DataValidationResultSchema>;

// Error handling types
export interface ValidationError {
  field: string;
  message: string;
  value: unknown;
}

export interface ProcessingError extends Error {
  code: 'VALIDATION_ERROR' | 'PARSING_ERROR' | 'FILE_ERROR' | 'NETWORK_ERROR';
  details?: unknown;
}

// Utility type guards
export const isCrimeRecord = (data: unknown): data is CrimeRecord => {
  return CrimeRecordSchema.safeParse(data).success;
};

export const isCityStats = (data: unknown): data is CityStats => {
  return CityStatsSchema.safeParse(data).success;
};

export const isTimeAnalysis = (data: unknown): data is TimeAnalysis => {
  return TimeAnalysisSchema.safeParse(data).success;
};

// Data transformation helpers
export const createProcessingError = (
  message: string,
  code: ProcessingError['code'],
  details?: unknown
): ProcessingError => {
  const error = new Error(message) as ProcessingError;
  error.code = code;
  error.details = details;
  return error;
};
