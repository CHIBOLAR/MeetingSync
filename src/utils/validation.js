/**
 * Input validation utilities for MeetingSync
 */

/**
 * Validate Jira issue key format
 * @param {string} issueKey - The issue key to validate
 * @returns {boolean} - True if valid
 * @throws {Error} - If invalid
 */
export const validateIssueKey = (issueKey) => {
  if (!issueKey || typeof issueKey !== 'string') {
    throw new Error('Valid issue key is required');
  }
  
  // JIRA issue key pattern: PROJECT-123
  const issueKeyPattern = /^[A-Z]+-\d+$/;
  if (!issueKeyPattern.test(issueKey.trim())) {
    throw new Error('Invalid issue key format. Expected format: PROJECT-123');
  }
  
  return true;
};

/**
 * Validate meeting data structure
 * @param {Object} meeting - Meeting object to validate
 * @returns {boolean} - True if valid
 * @throws {Error} - If invalid
 */
export const validateMeetingData = (meeting) => {
  if (!meeting || typeof meeting !== 'object') {
    throw new Error('Meeting data must be an object');
  }

  const requiredFields = ['title', 'platform', 'date'];
  for (const field of requiredFields) {
    if (!meeting[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate date format
  if (isNaN(Date.parse(meeting.date))) {
    throw new Error('Invalid date format');
  }

  // Validate duration if provided
  if (meeting.duration && (typeof meeting.duration !== 'number' || meeting.duration < 0)) {
    throw new Error('Duration must be a positive number');
  }

  return true;
};

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate pagination parameters
 * @param {Object} params - Pagination parameters
 * @returns {Object} - Validated and normalized parameters
 */
export const validatePagination = (params = {}) => {
  const { page = 1, limit = 10 } = params;
  
  const normalizedPage = Math.max(1, parseInt(page, 10) || 1);
  const normalizedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  
  return {
    page: normalizedPage,
    limit: normalizedLimit,
    offset: (normalizedPage - 1) * normalizedLimit
  };
};
