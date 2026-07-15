/**
 * Logger Utility
 * Structured logging for debugging, monitoring, and analytics
 */

import { ENV } from './env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 200;

  /**
   * Log a message
   */
  log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      stack: error?.stack,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.output(entry);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    if (ENV.isDevelopment()) {
      this.log('debug', message, context);
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('warn', message, context, error);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('error', message, context, error);
  }

  /**
   * Output log to console based on environment
   */
  private output(entry: LogEntry): void {
    const prefix = `[${this.formatTime(entry.timestamp)}] [${entry.level.toUpperCase()}]`;
    const consoleMethod = {
      debug: 'log',
      info: 'log',
      warn: 'warn',
      error: 'error',
    }[entry.level] as 'log' | 'warn' | 'error';

    console[consoleMethod](
      `%c${prefix}`,
      `color: ${this.getColorForLevel(entry.level)};`,
      entry.message,
      entry.context || ''
    );

    if (ENV.isDevelopment() && entry.stack) {
      console.error('Stack:', entry.stack);
    }
  }

  /**
   * Get color for log level
   */
  private getColorForLevel(level: LogLevel): string {
    const colors = {
      debug: '#808080',
      info: '#0066cc',
      warn: '#ff9900',
      error: '#cc0000',
    };
    return colors[level];
  }

  /**
   * Format timestamp
   */
  private formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  }

  /**
   * Get all logs
   */
  getLogs(level?: LogLevel): LogEntry[] {
    return level ? this.logs.filter(l => l.level === level) : this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Send logs to remote service
   */
  async sendToRemote(endpoint: string): Promise<boolean> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs: this.logs,
          environment: ENV.environment,
          timestamp: Date.now(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send logs:', error);
      return false;
    }
  }

  /**
   * Create a scoped logger
   */
  scope(prefix: string) {
    return {
      debug: (message: string, context?: Record<string, any>) =>
        this.debug(`[${prefix}] ${message}`, context),
      info: (message: string, context?: Record<string, any>) =>
        this.info(`[${prefix}] ${message}`, context),
      warn: (message: string, context?: Record<string, any>, error?: Error) =>
        this.warn(`[${prefix}] ${message}`, context, error),
      error: (message: string, context?: Record<string, any>, error?: Error) =>
        this.error(`[${prefix}] ${message}`, context, error),
    };
  }
}

export const logger = new Logger();

// Create scoped loggers for different modules
export const firebaseLogger = logger.scope('Firebase');
export const apiLogger = logger.scope('API');
export const walletLogger = logger.scope('Wallet');
export const uiLogger = logger.scope('UI');
