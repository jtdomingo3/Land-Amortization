import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDate,
  formatCurrency,
  formatNumber,
  formatMonthCovered,
  toISODateString
} from '../src/utils/formatters.js';

describe('Formatters Utility Suite (Android)', () => {
  describe('formatDate (Strict MM/DD/YYYY)', () => {
    it('should format ISO YYYY-MM-DD date strings strictly as MM/DD/YYYY', () => {
      assert.strictEqual(formatDate('2026-10-06'), '10/06/2026');
      assert.strictEqual(formatDate('2026-01-15'), '01/15/2026');
      assert.strictEqual(formatDate('2026-12-31'), '12/31/2026');
      assert.strictEqual(formatDate('2025-07-04'), '07/04/2025');
    });

    it('should format Date objects strictly as MM/DD/YYYY', () => {
      const d = new Date(2026, 9, 6);
      assert.strictEqual(formatDate(d), '10/06/2026');
    });

    it('should handle falsy values gracefully', () => {
      assert.strictEqual(formatDate(''), '-');
      assert.strictEqual(formatDate(null), '-');
      assert.strictEqual(formatDate(undefined), '-');
    });

    it('should handle single-digit months and days with zero-padding', () => {
      assert.strictEqual(formatDate('2026-3-5'), '03/05/2026');
    });
  });

  describe('formatCurrency (Philippine Peso)', () => {
    it('should format positive amounts with Peso symbol and 2 decimals', () => {
      assert.strictEqual(formatCurrency(1500000), '₱1,500,000.00');
      assert.strictEqual(formatCurrency('25000.5'), '₱25,000.50');
    });

    it('should format zero correctly', () => {
      assert.strictEqual(formatCurrency(0), '₱0.00');
    });

    it('should allow hiding the currency symbol', () => {
      assert.strictEqual(formatCurrency(50000, false), '50,000.00');
    });

    it('should handle invalid or null values as 0.00', () => {
      assert.strictEqual(formatCurrency(null), '₱0.00');
      assert.strictEqual(formatCurrency(undefined), '₱0.00');
      assert.strictEqual(formatCurrency('invalid'), '₱0.00');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with comma separators and specified decimals', () => {
      assert.strictEqual(formatNumber(1000000, 0), '1,000,000');
      assert.strictEqual(formatNumber(1234.567, 2), '1,234.57');
    });
  });

  describe('formatMonthCovered', () => {
    it('should format date strings to readable Month Year', () => {
      assert.strictEqual(formatMonthCovered('2026-10-15'), 'October 2026');
      assert.strictEqual(formatMonthCovered('2026-01-01'), 'January 2026');
    });

    it('should return dash on invalid/empty date', () => {
      assert.strictEqual(formatMonthCovered(''), '-');
      assert.strictEqual(formatMonthCovered(null), '-');
    });
  });

  describe('toISODateString', () => {
    it('should convert Date objects to YYYY-MM-DD string', () => {
      const d = new Date(2026, 9, 6);
      assert.strictEqual(toISODateString(d), '2026-10-06');
    });

    it('should return existing YYYY-MM-DD strings directly', () => {
      assert.strictEqual(toISODateString('2026-10-06'), '2026-10-06');
    });
  });
});
