/**
 * Performance Monitoring
 * Tracks Web Vitals and application performance metrics
 */

import { ENV } from './env';
import { logger } from './logger';

export interface WebVitals {
  lcp?: number; // Largest Contentful Paint
  inp?: number; // Interaction to Next Paint
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private vitals: WebVitals = {};

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (!ENV.isProduction()) return;

    // Monitor Web Vitals if available
    if ('web-vital' in window) {
      this.setupWebVitals();
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      this.setupLongTaskObserver();
    }

    logger.info('Performance monitoring initialized');
  }

  /**
   * Setup Web Vitals monitoring
   */
  private setupWebVitals(): void {
    try {
      // Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'largest-contentful-paint') {
              this.vitals.lcp = entry.startTime;
              this.recordMetric('LCP', this.vitals.lcp);
            }
          }
        });
        paintObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      }
    } catch (error) {
      logger.warn('Failed to setup Web Vitals', {}, error as Error);
    }
  }

  /**
   * Setup long task observer
   */
  private setupLongTaskObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            logger.warn('Long task detected', {
              name: entry.name,
              duration: entry.duration,
            });
          }
        }
      });

      // Check if Long Task API is supported
      if ('PerformanceObserver' in window) {
        try {
          observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
          logger.debug('Long Task API not supported');
        }
      }
    } catch (error) {
      logger.debug('Failed to setup long task observer', {}, error as Error);
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number): void {
    const rating = this.rateMetric(name, value);
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);

    logger.debug(`Performance metric: ${name} = ${value.toFixed(2)}ms (${rating})`);
  }

  /**
   * Rate a metric as good, needs-improvement, or poor
   */
  private rateMetric(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      'LCP': [2500, 4000],
      'FCP': [1800, 3000],
      'INP': [200, 500],
      'CLS': [0.1, 0.25],
      'TTFB': [600, 1800],
    };

    const [good, needsImprovement] = thresholds[name] || [1000, 3000];

    if (value <= good) return 'good';
    if (value <= needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Measure function execution time
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await Promise.resolve(fn());
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(`Measured operation failed: ${name} (${duration.toFixed(2)}ms)`, {}, error as Error);
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): Record<string, PerformanceMetric[]> {
    const result: Record<string, PerformanceMetric[]> = {};
    this.metrics.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Get average metric value
   */
  getAverageMetric(name: string): number | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Get Web Vitals summary
   */
  getWebVitalsSummary(): Record<string, string> {
    const summary: Record<string, string> = {};

    Object.entries(this.vitals).forEach(([key, value]) => {
      if (value) {
        const metric = this.rateMetric(key.toUpperCase(), value);
        summary[key] = `${value.toFixed(0)}ms (${metric})`;
      }
    });

    return summary;
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.vitals = {};
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      vitals: this.vitals,
      metrics: this.getMetrics(),
      summary: this.getWebVitalsSummary(),
    }, null, 2);
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize in production
if (ENV.isProduction()) {
  performanceMonitor.init();
}
