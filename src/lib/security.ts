// Security utilities for input validation, sanitization, and protection
import DOMPurify from 'dompurify';

export interface ValidationError {
  field: string;
  message: string;
}

export const validators = {
  // Validate Ethereum address format (0x followed by 40 hex characters)
  isValidAddress: (address: string): boolean => {
    if (!address || typeof address !== 'string') return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
  },

  // Validate email format
  isValidEmail: (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  // Validate URL format
  isValidURL: (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Validate token symbol (alphanumeric, 1-10 chars)
  isValidSymbol: (symbol: string): boolean => {
    if (!symbol || typeof symbol !== 'string') return false;
    return /^[A-Z0-9]{1,10}$/.test(symbol.trim().toUpperCase());
  },

  // Validate project name (alphanumeric, hyphens, underscores, 1-100 chars)
  isValidProjectName: (name: string): boolean => {
    if (!name || typeof name !== 'string') return false;
    return /^[a-zA-Z0-9\-_\s]{1,100}$/.test(name.trim());
  },

  // Validate positive number
  isPositiveNumber: (value: any): boolean => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  },

  // Validate percentage (0-100)
  isValidPercentage: (value: any): boolean => {
    const num = Number(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  },

  // Validate JSON string
  isValidJSON: (json: string): boolean => {
    if (!json || typeof json !== 'string') return false;
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  },
};

export const sanitizers = {
  // Sanitize text input (remove XSS vectors)
  sanitizeText: (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  },

  // Sanitize HTML content safely
  sanitizeHTML: (html: string): string => {
    if (!html || typeof html !== 'string') return '';
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'li', 'ol'] });
  },

  // Sanitize URL (prevent javascript: and data: URIs)
  sanitizeURL: (url: string): string => {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
      return '';
    }
    return url.trim();
  },

  // Sanitize filename
  sanitizeFilename: (filename: string): string => {
    if (!filename || typeof filename !== 'string') return 'file';
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);
  },

  // Normalize Ethereum address (lowercase with 0x)
  normalizeAddress: (address: string): string => {
    if (!address || typeof address !== 'string') return '';
    const trimmed = address.trim();
    if (!validators.isValidAddress(trimmed)) return '';
    return trimmed.toLowerCase();
  },
};

export const rateLimiter = {
  // Simple in-memory rate limiting store
  store: new Map<string, { count: number; resetTime: number }>(),

  // Check if request should be rate limited
  isLimited: (key: string, maxRequests: number = 30, windowMs: number = 60000): boolean => {
    const now = Date.now();
    const record = rateLimiter.store.get(key);

    if (!record || now > record.resetTime) {
      // New window or expired
      rateLimiter.store.set(key, { count: 1, resetTime: now + windowMs });
      return false;
    }

    if (record.count >= maxRequests) {
      return true; // Rate limited
    }

    record.count++;
    return false;
  },

  // Reset rate limit for a key
  reset: (key: string): void => {
    rateLimiter.store.delete(key);
  },

  // Get remaining requests
  getRemaining: (key: string, maxRequests: number = 30): number => {
    const record = rateLimiter.store.get(key);
    if (!record || Date.now() > record.resetTime) {
      return maxRequests;
    }
    return Math.max(0, maxRequests - record.count);
  },
};

export const validators_batch = {
  // Validate entire form data
  validateFormData: (data: Record<string, any>, schema: Record<string, (val: any) => boolean>): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    Object.entries(schema).forEach(([field, validator]) => {
      if (!validator(data[field])) {
        errors.push({
          field,
          message: `Invalid ${field}`,
        });
      }
    });

    return errors;
  },

  // Validate token data
  validateTokenData: (token: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!validators.isValidSymbol(token.symbol)) {
      errors.push({ field: 'symbol', message: 'Invalid token symbol (1-10 uppercase alphanumeric)' });
    }

    if (!validators.isValidProjectName(token.name)) {
      errors.push({ field: 'name', message: 'Invalid token name' });
    }

    if (token.supply && !validators.isPositiveNumber(token.supply)) {
      errors.push({ field: 'supply', message: 'Supply must be a positive number' });
    }

    if (token.decimals && (!Number.isInteger(Number(token.decimals)) || Number(token.decimals) < 0 || Number(token.decimals) > 18)) {
      errors.push({ field: 'decimals', message: 'Decimals must be between 0 and 18' });
    }

    return errors;
  },

  // Validate NFT collection data
  validateNFTData: (nft: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!validators.isValidProjectName(nft.name)) {
      errors.push({ field: 'name', message: 'Invalid collection name' });
    }

    if (nft.maxSupply && !validators.isPositiveNumber(nft.maxSupply)) {
      errors.push({ field: 'maxSupply', message: 'Max supply must be a positive number' });
    }

    if (nft.royaltyPercentage && !validators.isValidPercentage(nft.royaltyPercentage)) {
      errors.push({ field: 'royaltyPercentage', message: 'Royalty must be between 0 and 100' });
    }

    return errors;
  },

  // Validate agent data
  validateAgentData: (agent: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!validators.isValidProjectName(agent.name)) {
      errors.push({ field: 'name', message: 'Invalid agent name' });
    }

    if (agent.tokenAddress && !validators.isValidAddress(agent.tokenAddress)) {
      errors.push({ field: 'tokenAddress', message: 'Invalid token address' });
    }

    if (agent.commissionPercentage && !validators.isValidPercentage(agent.commissionPercentage)) {
      errors.push({ field: 'commissionPercentage', message: 'Commission must be between 0 and 100' });
    }

    return errors;
  },
};

export const securityHeaders = {
  // Get secure headers for responses
  getSecureHeaders: (): Record<string, string> => ({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  }),

  // CORS configuration
  getCORSConfig: () => ({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
};
