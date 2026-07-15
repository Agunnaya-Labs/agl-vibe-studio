/**
 * Environment Configuration Manager
 * Handles all environment variables and validates them at runtime
 */

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  environment: Environment;
  isDev: boolean;
  isProd: boolean;
  firebase: {
    apiKey: string;
    projectId: string;
    authDomain: string;
    databaseURL: string;
  };
  api: {
    timeout: number;
    retries: number;
    cacheTime: number;
  };
  features: {
    mockData: boolean;
    debugMode: boolean;
    analyticsEnabled: boolean;
    errorReportingEnabled: boolean;
  };
  security: {
    corsOrigins: string[];
    rateLimitPerMinute: number;
    enableCSRF: boolean;
  };
}

class EnvManager {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.buildConfig();
    this.validateConfig();
  }

  private buildConfig(): EnvironmentConfig {
    const env = (import.meta.env.VITE_ENV || 'development') as Environment;
    const isDev = env === 'development';
    const isProd = env === 'production';

    return {
      environment: env,
      isDev,
      isProd,
      firebase: {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
      },
      api: {
        timeout: isProd ? 30000 : 60000,
        retries: isProd ? 3 : 1,
        cacheTime: isProd ? 3600000 : 300000, // 1hr vs 5min
      },
      features: {
        mockData: isDev,
        debugMode: isDev,
        analyticsEnabled: isProd,
        errorReportingEnabled: isProd,
      },
      security: {
        corsOrigins: isProd
          ? (import.meta.env.VITE_CORS_ORIGINS || 'https://agunnaya.io').split(',')
          : ['http://localhost:3000', 'http://localhost:5173'],
        rateLimitPerMinute: isProd ? 60 : 1000,
        enableCSRF: isProd,
      },
    };
  }

  private validateConfig(): void {
    const required = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_AUTH_DOMAIN',
    ];

    if (this.config.isProd) {
      required.forEach(key => {
        if (!import.meta.env[key]) {
          console.warn(`⚠️  Missing environment variable: ${key}. Some features may not work correctly in production.`);
        }
      });
    }
  }

  getConfig(): EnvironmentConfig {
    return this.config;
  }

  isDevelopment(): boolean {
    return this.config.isDev;
  }

  isProduction(): boolean {
    return this.config.isProd;
  }

  get environment(): Environment {
    return this.config.environment;
  }
}

export const envManager = new EnvManager();
export const ENV = envManager.getConfig();
