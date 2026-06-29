import { describe, it, expect } from 'vitest';
import { validators, sanitizers, rateLimiter } from '@/lib/security';

describe('Security Validators', () => {
  describe('isValidAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(validators.isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(validators.isValidAddress('0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(validators.isValidAddress('0x123')).toBe(false);
      expect(validators.isValidAddress('not-an-address')).toBe(false);
      expect(validators.isValidAddress('')).toBe(false);
      expect(validators.isValidAddress(null as any)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(validators.isValidEmail('test@example.com')).toBe(true);
      expect(validators.isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validators.isValidEmail('invalid-email')).toBe(false);
      expect(validators.isValidEmail('test@')).toBe(false);
      expect(validators.isValidEmail('')).toBe(false);
    });
  });

  describe('isValidSymbol', () => {
    it('should validate correct symbols', () => {
      expect(validators.isValidSymbol('ETH')).toBe(true);
      expect(validators.isValidSymbol('AGFI')).toBe(true);
      expect(validators.isValidSymbol('TOKEN123')).toBe(true);
    });

    it('should reject invalid symbols', () => {
      expect(validators.isValidSymbol('TOKEN123456')).toBe(false); // too long (11 chars)
      expect(validators.isValidSymbol('A TOKEN')).toBe(false); // has space
      expect(validators.isValidSymbol('token@')).toBe(false); // special char
      expect(validators.isValidSymbol('')).toBe(false); // empty
    });
  });

  describe('isPositiveNumber', () => {
    it('should validate positive numbers', () => {
      expect(validators.isPositiveNumber(100)).toBe(true);
      expect(validators.isPositiveNumber('50')).toBe(true);
      expect(validators.isPositiveNumber(0.001)).toBe(true);
    });

    it('should reject non-positive numbers', () => {
      expect(validators.isPositiveNumber(0)).toBe(false);
      expect(validators.isPositiveNumber(-10)).toBe(false);
      expect(validators.isPositiveNumber('abc')).toBe(false);
    });
  });

  describe('isValidPercentage', () => {
    it('should validate valid percentages', () => {
      expect(validators.isValidPercentage(0)).toBe(true);
      expect(validators.isValidPercentage(50)).toBe(true);
      expect(validators.isValidPercentage(100)).toBe(true);
    });

    it('should reject invalid percentages', () => {
      expect(validators.isValidPercentage(-10)).toBe(false);
      expect(validators.isValidPercentage(101)).toBe(false);
      expect(validators.isValidPercentage('abc')).toBe(false);
    });
  });
});

describe('Security Sanitizers', () => {
  describe('sanitizeText', () => {
    it('should remove XSS attempts', () => {
      const malicious = '<script>alert("xss")</script>Hello';
      const result = sanitizers.sanitizeText(malicious);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should handle normal text', () => {
      const text = 'Normal text content';
      expect(sanitizers.sanitizeText(text)).toBe(text);
    });

    it('should handle empty input', () => {
      expect(sanitizers.sanitizeText('')).toBe('');
      expect(sanitizers.sanitizeText(null as any)).toBe('');
    });
  });

  describe('sanitizeURL', () => {
    it('should allow valid URLs', () => {
      const url = 'https://example.com/path';
      expect(sanitizers.sanitizeURL(url)).toBe(url);
    });

    it('should block javascript: URIs', () => {
      expect(sanitizers.sanitizeURL('javascript:alert("xss")')).toBe('');
      expect(sanitizers.sanitizeURL('JAVASCRIPT:alert("xss")')).toBe('');
    });

    it('should block data: URIs', () => {
      expect(sanitizers.sanitizeURL('data:text/html,<script>alert("xss")</script>')).toBe('');
    });
  });

  describe('normalizeAddress', () => {
    it('should normalize valid addresses', () => {
      const address = '0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD';
      const normalized = sanitizers.normalizeAddress(address);
      expect(normalized).toBe(address.toLowerCase());
    });

    it('should return empty for invalid addresses', () => {
      expect(sanitizers.normalizeAddress('invalid')).toBe('');
      expect(sanitizers.normalizeAddress('')).toBe('');
    });
  });
});

describe('Rate Limiter', () => {
  it('should allow requests under limit', () => {
    rateLimiter.reset('test-key');
    expect(rateLimiter.isLimited('test-key', 5, 1000)).toBe(false);
    expect(rateLimiter.isLimited('test-key', 5, 1000)).toBe(false);
    expect(rateLimiter.isLimited('test-key', 5, 1000)).toBe(false);
  });

  it('should block requests over limit', () => {
    rateLimiter.reset('test-key-2');
    for (let i = 0; i < 5; i++) {
      rateLimiter.isLimited('test-key-2', 5, 1000);
    }
    expect(rateLimiter.isLimited('test-key-2', 5, 1000)).toBe(true);
  });

  it('should calculate remaining requests', () => {
    rateLimiter.reset('test-key-3');
    for (let i = 0; i < 3; i++) {
      rateLimiter.isLimited('test-key-3', 10, 1000);
    }
    expect(rateLimiter.getRemaining('test-key-3', 10)).toBe(7);
  });
});
