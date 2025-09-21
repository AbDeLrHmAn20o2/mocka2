"use client";

/**
 * Advanced logging utility for token management and error tracking
 * Provides structured logging with different levels and contexts
 */

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

// Current environment log level
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.WARN 
  : LOG_LEVELS.DEBUG;

// Log categories for filtering
const CATEGORIES = {
  TOKEN: 'TOKEN',
  AUTH: 'AUTH',
  API: 'API',
  ERROR: 'ERROR',
  NETWORK: 'NETWORK',
  PERFORMANCE: 'PERFORMANCE',
  USER: 'USER',
};

class Logger {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
    
    // Performance tracking
    this.performanceMarks = new Map();
    
    this.setupErrorTracking();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Core logging method
  log(level, category, message, data = {}, error = null) {
    if (level < CURRENT_LOG_LEVEL) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      level: Object.keys(LOG_LEVELS)[level],
      category,
      message,
      data: this.sanitizeData(data),
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
      } : null,
      url: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
    };

    // Add to in-memory logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with appropriate method
    this.outputToConsole(logEntry);

    // Send critical errors to external service in production
    if (level >= LOG_LEVELS.ERROR && process.env.NODE_ENV === 'production') {
      this.sendToExternalLogging(logEntry);
    }

    return logEntry;
  }

  // Sanitize sensitive data from logs
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'idToken', 'secret', 'key'];

    const sanitizeValue = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeValue);
      } else if (obj && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            result[key] = '[REDACTED]';
          } else {
            result[key] = sanitizeValue(value);
          }
        }
        return result;
      }
      return obj;
    };

    return sanitizeValue(sanitized);
  }

  outputToConsole(logEntry) {
    const { level, category, message, data, error } = logEntry;
    const prefix = `[${level}] [${category}]`;
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();

    switch (level) {
      case 'DEBUG':
        console.debug(`%c${prefix} ${message}`, 'color: gray', { timestamp, ...data }, error);
        break;
      case 'INFO':
        console.info(`%c${prefix} ${message}`, 'color: blue', { timestamp, ...data }, error);
        break;
      case 'WARN':
        console.warn(`%c${prefix} ${message}`, 'color: orange', { timestamp, ...data }, error);
        break;
      case 'ERROR':
        console.error(`%c${prefix} ${message}`, 'color: red', { timestamp, ...data }, error);
        break;
      case 'CRITICAL':
        console.error(`%c🚨 ${prefix} ${message}`, 'color: red; font-weight: bold; background: yellow', { timestamp, ...data }, error);
        break;
    }
  }

  async sendToExternalLogging(logEntry) {
    try {
      // In production, you can send to services like Sentry, LogRocket, or DataDog
      // For now, we'll just store in localStorage as a fallback
      if (typeof window !== 'undefined' && window.localStorage) {
        const existingLogs = JSON.parse(localStorage.getItem('app_error_logs') || '[]');
        existingLogs.push(logEntry);
        
        // Keep only last 50 error logs
        if (existingLogs.length > 50) {
          existingLogs.splice(0, existingLogs.length - 50);
        }
        
        localStorage.setItem('app_error_logs', JSON.stringify(existingLogs));
      }
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  setupErrorTracking() {
    if (typeof window === 'undefined') return;

    // Track unhandled errors
    window.addEventListener('error', (event) => {
      this.error(CATEGORIES.ERROR, 'Unhandled error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }, event.error);
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error(CATEGORIES.ERROR, 'Unhandled promise rejection', {
        reason: event.reason,
      }, event.reason instanceof Error ? event.reason : new Error(event.reason));
    });
  }

  // Convenience methods
  debug(category, message, data, error) {
    return this.log(LOG_LEVELS.DEBUG, category, message, data, error);
  }

  info(category, message, data, error) {
    return this.log(LOG_LEVELS.INFO, category, message, data, error);
  }

  warn(category, message, data, error) {
    return this.log(LOG_LEVELS.WARN, category, message, data, error);
  }

  error(category, message, data, error) {
    return this.log(LOG_LEVELS.ERROR, category, message, data, error);
  }

  critical(category, message, data, error) {
    return this.log(LOG_LEVELS.CRITICAL, category, message, data, error);
  }

  // Performance tracking
  startPerformanceTracking(label) {
    this.performanceMarks.set(label, {
      startTime: performance.now(),
      startTimestamp: Date.now(),
    });
    
    this.debug(CATEGORIES.PERFORMANCE, `Started tracking: ${label}`);
  }

  endPerformanceTracking(label, additionalData = {}) {
    const mark = this.performanceMarks.get(label);
    if (!mark) {
      this.warn(CATEGORIES.PERFORMANCE, `No performance mark found for: ${label}`);
      return null;
    }

    const duration = performance.now() - mark.startTime;
    this.performanceMarks.delete(label);

    const perfData = {
      label,
      duration: `${duration.toFixed(2)}ms`,
      startTime: new Date(mark.startTimestamp).toISOString(),
      endTime: new Date().toISOString(),
      ...additionalData,
    };

    // Log performance data
    if (duration > 1000) {
      this.warn(CATEGORIES.PERFORMANCE, `Slow operation: ${label}`, perfData);
    } else {
      this.debug(CATEGORIES.PERFORMANCE, `Completed: ${label}`, perfData);
    }

    return perfData;
  }

  // Token-specific logging helpers
  tokenRefreshStarted(data = {}) {
    this.startPerformanceTracking('token_refresh');
    this.info(CATEGORIES.TOKEN, 'Token refresh started', data);
  }

  tokenRefreshCompleted(success = true, data = {}) {
    const perfData = this.endPerformanceTracking('token_refresh', data);
    
    if (success) {
      this.info(CATEGORIES.TOKEN, 'Token refresh completed successfully', { ...data, ...perfData });
    } else {
      this.error(CATEGORIES.TOKEN, 'Token refresh failed', { ...data, ...perfData });
    }
  }

  tokenExpired(data = {}) {
    this.warn(CATEGORIES.TOKEN, 'Token expired', data);
  }

  authError(message, data = {}, error = null) {
    this.error(CATEGORIES.AUTH, message, data, error);
  }

  networkError(message, data = {}, error = null) {
    this.error(CATEGORIES.NETWORK, message, data, error);
  }

  apiRequest(method, url, data = {}) {
    this.debug(CATEGORIES.API, `API Request: ${method} ${url}`, data);
  }

  apiResponse(method, url, status, duration, data = {}) {
    const logData = { method, url, status, duration, ...data };
    
    if (status >= 500) {
      this.error(CATEGORIES.API, `API Server Error: ${method} ${url}`, logData);
    } else if (status >= 400) {
      this.warn(CATEGORIES.API, `API Client Error: ${method} ${url}`, logData);
    } else {
      this.debug(CATEGORIES.API, `API Success: ${method} ${url}`, logData);
    }
  }

  userAction(action, data = {}) {
    this.info(CATEGORIES.USER, `User action: ${action}`, data);
  }

  // Get recent logs for debugging
  getRecentLogs(count = 100, category = null, level = null) {
    let filteredLogs = [...this.logs];

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (level) {
      const levelValue = LOG_LEVELS[level.toUpperCase()];
      if (levelValue !== undefined) {
        filteredLogs = filteredLogs.filter(log => LOG_LEVELS[log.level] >= levelValue);
      }
    }

    return filteredLogs.slice(-count);
  }

  // Export logs for debugging
  exportLogs() {
    const exportData = {
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      logs: this.logs,
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.info(CATEGORIES.TOKEN, 'Logs cleared');
  }
}

// Export singleton instance
export const logger = new Logger();
export { CATEGORIES as LOG_CATEGORIES };
export default logger;