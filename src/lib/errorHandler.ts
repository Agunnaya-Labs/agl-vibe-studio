/**
 * Global Error Handler
 * Manages error logging, user notifications, and analytics
 */

import { ENV } from './env';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  stack?: string;
  timestamp: number;
}

export const ErrorCodes = {
  // Firebase errors
  FIREBASE_AUTH_FAILED: 'FIREBASE_AUTH_FAILED',
  FIREBASE_WRITE_FAILED: 'FIREBASE_WRITE_FAILED',
  FIREBASE_READ_FAILED: 'FIREBASE_READ_FAILED',
  FIREBASE_OFFLINE: 'FIREBASE_OFFLINE',

  // Network errors
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',

  // Wallet errors
  WALLET_CONNECTION_FAILED: 'WALLET_CONNECTION_FAILED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

class ErrorHandler {
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  /**
   * Handle and log errors
   */
  handle(
    error: Error | string,
    code: string = ErrorCodes.UNKNOWN_ERROR,
    severity: ErrorSeverity = 'error',
    context?: Record<string, any>
  ): AppError {
    const appError: AppError = {
      code,
      message: error instanceof Error ? error.message : String(error),
      severity,
      context,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: Date.now(),
    };

    this.logError(appError);
    this.reportError(appError);

    return appError;
  }

  /**
   * Log error to console in development
   */
  private logError(error: AppError): void {
    this.errorLog.push(error);

    // Keep error log manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Console output based on severity
    const consoleMethod = {
      info: 'log',
      warning: 'warn',
      error: 'error',
      critical: 'error',
    }[error.severity] as 'log' | 'warn' | 'error';

    const prefix = `[${error.code}]`;
    console[consoleMethod](prefix, error.message, error.context || '');

    if (ENV.isDevelopment() && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  /**
   * Report errors to monitoring service
   */
  private reportError(error: AppError): void {
    if (!ENV.isProduction() || !ENV.features.errorReportingEnabled) {
      return;
    }

    // Send to error tracking service (Sentry, LogRocket, etc.)
    // Example: window.Sentry?.captureException(error);
    console.log('[Error Reporter]', 'Sending error to monitoring service:', {
      code: error.code,
      message: error.message,
      severity: error.severity,
      context: error.context,
    });
  }

  /**
   * Get recent errors
   */
  getErrorLog(limit: number = 10): AppError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(code: string): string {
    const messages: Record<string, string> = {
      [ErrorCodes.FIREBASE_AUTH_FAILED]: 'Authentication failed. Please try signing in again.',
      [ErrorCodes.FIREBASE_OFFLINE]: 'You appear to be offline. Please check your connection.',
      [ErrorCodes.NETWORK_TIMEOUT]: 'Request took too long. Please try again.',
      [ErrorCodes.WALLET_CONNECTION_FAILED]: 'Failed to connect wallet. Please try again.',
      [ErrorCodes.TRANSACTION_FAILED]: 'Transaction failed. Please check your wallet and try again.',
      [ErrorCodes.INSUFFICIENT_BALANCE]: 'Insufficient balance to complete this transaction.',
      [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ErrorCodes.UNKNOWN_ERROR]: 'Something went wrong. Please try again later.',
    };

    return messages[code] || messages[ErrorCodes.UNKNOWN_ERROR];
  }
}

export const errorHandler = new ErrorHandler();
