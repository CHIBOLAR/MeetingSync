/**
 * Enhanced error handling utilities for MeetingSync
 */

/**
 * Logger utility with different log levels
 */
export const logger = {
  info: (message, data = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },
  
  error: (message, error = {}, data = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, {
      error: error.message || error,
      stack: error.stack,
      data
    });
  },
  
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  },
  
  warn: (message, data = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  }
};

/**
 * Error wrapper for resolver functions
 * @param {Function} resolverFunction - The resolver function to wrap
 * @param {string} functionName - Name of the function for logging
 * @returns {Function} - Wrapped function with error handling
 */
export const withErrorHandling = (resolverFunction, functionName = 'resolver') => {
  return async (req) => {
    const startTime = Date.now();
    
    try {
      logger.debug(`${functionName} started`, { payload: req.payload });
      
      // Input validation
      if (!req.payload) {
        throw new Error('Invalid request payload');
      }
      
      const result = await resolverFunction(req);
      
      const duration = Date.now() - startTime;
      logger.info(`${functionName} completed successfully`, { duration });
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`${functionName} failed`, error, {
        duration,
        payload: req.payload
      });
      
      // Determine if error should be exposed to user
      const isDevMode = process.env.NODE_ENV === 'development';
      const userMessage = error.name === 'ValidationError' ? error.message :
                         isDevMode ? error.message : 'An unexpected error occurred';
      
      return {
        success: false,
        message: userMessage,
        error: isDevMode ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      };
    }
  };
};

/**
 * Custom error classes for better error handling
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StorageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StorageError';
  }
}

export class IntegrationError extends Error {
  constructor(message, service) {
    super(message);
    this.name = 'IntegrationError';
    this.service = service;
  }
}

/**
 * Rate limiting utility
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  isAllowed(key, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const userRequests = this.requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= limit) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Retry utility for external API calls
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} - Result of function or throws error
 */
export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      logger.warn(`Attempt ${attempt} failed`, { error: error.message });
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};
