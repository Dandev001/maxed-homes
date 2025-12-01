/**
 * Logger utility for consistent logging across the application
 * In production, logs can be sent to a logging service
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  private formatMessage(level: LogLevel, message: string, data?: unknown, context?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  private log(level: LogLevel, message: string, data?: unknown, context?: string) {
    const entry = this.formatMessage(level, message, data, context);

    // In development, log to console with appropriate level
    if (this.isDevelopment) {
      const logMethod = level === 'error' ? console.error : 
                       level === 'warn' ? console.warn :
                       level === 'debug' ? console.debug : 
                       console.log;
      
      const prefix = context ? `[${context}]` : '';
      if (data) {
        logMethod(`${prefix} ${message}`, data);
      } else {
        logMethod(`${prefix} ${message}`);
      }
    }

    // In production, you can send logs to a service
    // Example: sendToLoggingService(entry);
    if (this.isProduction && level === 'error') {
      // Send errors to error tracking service (e.g., Sentry)
      // Example: captureException(new Error(message), { extra: data, tags: { context } });
    }
  }

  debug(message: string, data?: unknown, context?: string) {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: unknown, context?: string) {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: unknown, context?: string) {
    this.log('warn', message, data, context);
  }

  error(message: string, error?: Error | unknown, context?: string) {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack, name: error.name }
      : error;
    this.log('error', message, errorData, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (message: string, data?: unknown, context?: string) => 
  logger.debug(message, data, context);

export const logInfo = (message: string, data?: unknown, context?: string) => 
  logger.info(message, data, context);

export const logWarn = (message: string, data?: unknown, context?: string) => 
  logger.warn(message, data, context);

export const logError = (message: string, error?: Error | unknown, context?: string) => 
  logger.error(message, error, context);

