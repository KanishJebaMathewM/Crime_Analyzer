import { 
  parse, 
  parseISO, 
  isValid, 
  format, 
  startOfDay, 
  endOfDay,
  isAfter,
  isBefore,
  differenceInDays,
  differenceInHours,
  differenceInMinutes
} from 'date-fns';

/**
 * Supported date formats for parsing
 */
const DATE_FORMATS = [
  'dd/MM/yyyy',
  'dd-MM-yyyy',
  'MM/dd/yyyy',
  'MM-dd-yyyy',
  'yyyy-MM-dd',
  'yyyy/MM/dd',
  'dd/MM/yyyy HH:mm',
  'dd-MM-yyyy HH:mm',
  'MM/dd/yyyy HH:mm',
  'MM-dd-yyyy HH:mm',
  'yyyy-MM-dd HH:mm',
  'yyyy/MM/dd HH:mm',
  'dd/MM/yyyy HH:mm:ss',
  'dd-MM-yyyy HH:mm:ss',
  'MM/dd/yyyy HH:mm:ss',
  'MM-dd-yyyy HH:mm:ss',
  'yyyy-MM-dd HH:mm:ss',
  'yyyy/MM/dd HH:mm:ss',
];

/**
 * Time format patterns
 */
const TIME_FORMATS = [
  'HH:mm',
  'HH:mm:ss',
  'h:mm a',
  'h:mm:ss a',
  'H:mm',
  'H:mm:ss',
];

export interface DateParseResult {
  success: boolean;
  date?: Date;
  error?: string;
  detectedFormat?: string;
}

export interface TimeParseResult {
  success: boolean;
  time?: string;
  error?: string;
  detectedFormat?: string;
}

/**
 * Safely parse a date from various formats
 */
export const safeParseDateString = (
  dateString: string | null | undefined,
  referenceDate: Date = new Date()
): DateParseResult => {
  if (!dateString || typeof dateString !== 'string') {
    return {
      success: false,
      error: 'Invalid or empty date string',
    };
  }

  const trimmedString = dateString.trim();
  
  if (!trimmedString) {
    return {
      success: false,
      error: 'Empty date string after trimming',
    };
  }

  // Try ISO format first
  try {
    const isoDate = parseISO(trimmedString);
    if (isValid(isoDate)) {
      return {
        success: true,
        date: isoDate,
        detectedFormat: 'ISO',
      };
    }
  } catch {
    // Continue to other formats
  }

  // Try native Date constructor
  try {
    const nativeDate = new Date(trimmedString);
    if (isValid(nativeDate) && !isNaN(nativeDate.getTime())) {
      return {
        success: true,
        date: nativeDate,
        detectedFormat: 'Native',
      };
    }
  } catch {
    // Continue to specific formats
  }

  // Try specific formats
  for (const dateFormat of DATE_FORMATS) {
    try {
      const parsedDate = parse(trimmedString, dateFormat, referenceDate);
      if (isValid(parsedDate)) {
        return {
          success: true,
          date: parsedDate,
          detectedFormat: dateFormat,
        };
      }
    } catch {
      // Continue to next format
    }
  }

  return {
    success: false,
    error: `Unable to parse date: "${trimmedString}". Supported formats: ${DATE_FORMATS.join(', ')}`,
  };
};

/**
 * Parse Excel date numbers
 */
export const parseExcelDate = (excelDate: number): DateParseResult => {
  try {
    // Excel dates are days since January 1, 1900
    // Adjust for Excel's leap year bug (treats 1900 as a leap year)
    const excelEpoch = new Date(1900, 0, 1);
    const daysSinceEpoch = excelDate - 1; // Excel is 1-indexed
    const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
    
    if (isValid(date)) {
      return {
        success: true,
        date,
        detectedFormat: 'Excel',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Invalid Excel date number: ${excelDate}`,
    };
  }

  return {
    success: false,
    error: `Invalid Excel date: ${excelDate}`,
  };
};

/**
 * Parse time strings into HH:MM format
 */
export const safeParseTimeString = (
  timeString: string | null | undefined
): TimeParseResult => {
  if (!timeString || typeof timeString !== 'string') {
    return {
      success: false,
      error: 'Invalid or empty time string',
    };
  }

  const trimmedString = timeString.trim();

  if (!trimmedString) {
    return {
      success: false,
      error: 'Empty time string after trimming',
    };
  }

  // Handle Excel time fractions (0.5 = 12:00)
  const timeNumber = parseFloat(trimmedString);
  if (!isNaN(timeNumber) && timeNumber >= 0 && timeNumber < 1) {
    const totalMinutes = Math.round(timeNumber * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return {
      success: true,
      time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      detectedFormat: 'Excel fraction',
    };
  }

  // Try to extract time from datetime strings
  const dateTimeMatch = trimmedString.match(/(\d{1,2}[:\.]d{2}(?:[:\.]d{2})?(?:\s*[APap][Mm])?)/);
  if (dateTimeMatch) {
    const timePartOnly = dateTimeMatch[1];
    const result = safeParseTimeString(timePartOnly);
    if (result.success) {
      return result;
    }
  }

  // Try parsing with date-fns
  const referenceDate = new Date(2000, 0, 1); // Use a reference date for time parsing
  
  for (const timeFormat of TIME_FORMATS) {
    try {
      const parsedTime = parse(trimmedString, timeFormat, referenceDate);
      if (isValid(parsedTime)) {
        return {
          success: true,
          time: format(parsedTime, 'HH:mm'),
          detectedFormat: timeFormat,
        };
      }
    } catch {
      // Continue to next format
    }
  }

  // Simple regex patterns for common time formats
  const timePatterns = [
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([APap][Mm]))?$/,
    /^(\d{1,2})\.(\d{2})(?:\.(\d{2}))?(?:\s*([APap][Mm]))?$/,
    /^(\d{1,2})(\d{2})(?:(\d{2}))?(?:\s*([APap][Mm]))?$/,
  ];

  for (const pattern of timePatterns) {
    const match = trimmedString.match(pattern);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const seconds = match[3] ? parseInt(match[3], 10) : 0;
      const ampm = match[4]?.toLowerCase();

      // Validate ranges
      if (minutes >= 60 || seconds >= 60) continue;

      // Handle AM/PM
      if (ampm) {
        if (ampm === 'pm' && hours !== 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
      }

      // Validate hours
      if (hours >= 24) continue;

      return {
        success: true,
        time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        detectedFormat: `Regex pattern: ${pattern.source}`,
      };
    }
  }

  return {
    success: false,
    error: `Unable to parse time: "${trimmedString}". Supported formats: ${TIME_FORMATS.join(', ')}`,
  };
};

/**
 * Validate date range
 */
export const validateDateRange = (
  date: Date,
  minDate?: Date,
  maxDate?: Date
): { valid: boolean; error?: string } => {
  if (!isValid(date)) {
    return { valid: false, error: 'Invalid date' };
  }

  if (minDate && isBefore(date, minDate)) {
    return { 
      valid: false, 
      error: `Date ${format(date, 'yyyy-MM-dd')} is before minimum allowed date ${format(minDate, 'yyyy-MM-dd')}` 
    };
  }

  if (maxDate && isAfter(date, maxDate)) {
    return { 
      valid: false, 
      error: `Date ${format(date, 'yyyy-MM-dd')} is after maximum allowed date ${format(maxDate, 'yyyy-MM-dd')}` 
    };
  }

  return { valid: true };
};

/**
 * Get date statistics
 */
export const getDateStatistics = (dates: Date[]) => {
  const validDates = dates.filter(isValid);
  
  if (validDates.length === 0) {
    return null;
  }

  const sortedDates = validDates.sort((a, b) => a.getTime() - b.getTime());
  const minDate = sortedDates[0];
  const maxDate = sortedDates[sortedDates.length - 1];
  const dateRange = differenceInDays(maxDate, minDate);

  return {
    count: validDates.length,
    minDate,
    maxDate,
    dateRange,
    span: {
      days: dateRange,
      hours: differenceInHours(maxDate, minDate),
      minutes: differenceInMinutes(maxDate, minDate),
    }
  };
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (
  date: Date,
  formatString: string = 'dd/MM/yyyy'
): string => {
  if (!isValid(date)) {
    return 'Invalid Date';
  }
  
  try {
    return format(date, formatString);
  } catch (error) {
    return 'Format Error';
  }
};

/**
 * Format time for display
 */
export const formatTimeForDisplay = (time: string): string => {
  const parsed = safeParseTimeString(time);
  return parsed.success ? parsed.time! : time;
};

/**
 * Create a default date when parsing fails
 */
export const createDefaultDate = (
  referenceDate: Date = new Date(),
  offset: { days?: number; hours?: number; minutes?: number } = {}
): Date => {
  let defaultDate = new Date(referenceDate);
  
  if (offset.days) {
    defaultDate.setDate(defaultDate.getDate() + offset.days);
  }
  
  if (offset.hours) {
    defaultDate.setHours(defaultDate.getHours() + offset.hours);
  }
  
  if (offset.minutes) {
    defaultDate.setMinutes(defaultDate.getMinutes() + offset.minutes);
  }
  
  return defaultDate;
};
