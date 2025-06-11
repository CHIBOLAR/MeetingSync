/**
 * Unit tests for validation utilities
 */

import { 
  validateIssueKey, 
  validateMeetingData, 
  sanitizeInput, 
  validatePagination 
} from '../utils/validation.js';

describe('Validation Utilities', () => {
  describe('validateIssueKey', () => {
    test('should validate correct issue key format', () => {
      expect(() => validateIssueKey('PROJ-123')).not.toThrow();
      expect(() => validateIssueKey('TEST-1')).not.toThrow();
      expect(() => validateIssueKey('MYPROJECT-999')).not.toThrow();
    });

    test('should reject invalid issue key formats', () => {
      expect(() => validateIssueKey('proj-123')).toThrow('Invalid issue key format');
      expect(() => validateIssueKey('PROJ123')).toThrow('Invalid issue key format');
      expect(() => validateIssueKey('PROJ-')).toThrow('Invalid issue key format');
      expect(() => validateIssueKey('123-PROJ')).toThrow('Invalid issue key format');
    });

    test('should reject null, undefined, or non-string inputs', () => {
      expect(() => validateIssueKey(null)).toThrow('Valid issue key is required');
      expect(() => validateIssueKey(undefined)).toThrow('Valid issue key is required');
      expect(() => validateIssueKey(123)).toThrow('Valid issue key is required');
      expect(() => validateIssueKey('')).toThrow('Invalid issue key format');
    });

    test('should handle whitespace in issue keys', () => {
      expect(() => validateIssueKey(' PROJ-123 ')).not.toThrow();
    });
  });

  describe('validateMeetingData', () => {
    const validMeeting = {
      title: 'Test Meeting',
      platform: 'Teams',
      date: '2023-06-11T10:00:00Z',
      duration: 30
    };

    test('should validate correct meeting data', () => {
      expect(() => validateMeetingData(validMeeting)).not.toThrow();
    });

    test('should reject missing required fields', () => {
      expect(() => validateMeetingData({})).toThrow('Missing required field: title');
      
      const missingPlatform = { ...validMeeting };
      delete missingPlatform.platform;
      expect(() => validateMeetingData(missingPlatform)).toThrow('Missing required field: platform');

      const missingDate = { ...validMeeting };
      delete missingDate.date;
      expect(() => validateMeetingData(missingDate)).toThrow('Missing required field: date');
    });

    test('should reject invalid date formats', () => {
      const invalidDate = { ...validMeeting, date: 'not-a-date' };
      expect(() => validateMeetingData(invalidDate)).toThrow('Invalid date format');
    });

    test('should reject invalid duration values', () => {
      const negativeDuration = { ...validMeeting, duration: -5 };
      expect(() => validateMeetingData(negativeDuration)).toThrow('Duration must be a positive number');

      const stringDuration = { ...validMeeting, duration: 'thirty' };
      expect(() => validateMeetingData(stringDuration)).toThrow('Duration must be a positive number');
    });

    test('should reject non-object inputs', () => {
      expect(() => validateMeetingData(null)).toThrow('Meeting data must be an object');
      expect(() => validateMeetingData('string')).toThrow('Meeting data must be an object');
      expect(() => validateMeetingData(123)).toThrow('Meeting data must be an object');
    });
  });

  describe('sanitizeInput', () => {
    test('should sanitize HTML special characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(sanitizeInput('Hello & "World"')).toBe('Hello &amp; &quot;World&quot;');
      expect(sanitizeInput("It's a test")).toBe('It&#x27;s a test');
    });

    test('should handle non-string inputs', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
      expect(sanitizeInput({})).toEqual({});
    });

    test('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('   ');
    });
  });

  describe('validatePagination', () => {
    test('should return default values for empty input', () => {
      const result = validatePagination();
      expect(result).toEqual({
        page: 1,
        limit: 10,
        offset: 0
      });
    });

    test('should normalize valid pagination parameters', () => {
      const result = validatePagination({ page: 3, limit: 25 });
      expect(result).toEqual({
        page: 3,
        limit: 25,
        offset: 50
      });
    });

    test('should handle invalid page numbers', () => {
      expect(validatePagination({ page: 0 }).page).toBe(1);
      expect(validatePagination({ page: -5 }).page).toBe(1);
      expect(validatePagination({ page: 'invalid' }).page).toBe(1);
    });

    test('should enforce maximum limit', () => {
      expect(validatePagination({ limit: 500 }).limit).toBe(100);
      expect(validatePagination({ limit: -10 }).limit).toBe(1);
    });

    test('should calculate correct offset', () => {
      expect(validatePagination({ page: 1, limit: 10 }).offset).toBe(0);
      expect(validatePagination({ page: 2, limit: 10 }).offset).toBe(10);
      expect(validatePagination({ page: 5, limit: 20 }).offset).toBe(80);
    });
  });
});
