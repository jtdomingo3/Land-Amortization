import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addMonthsEdate, daysDifference, isBeforeToday } from '../src/utils/dateUtils.js';

describe('Date Utilities Suite', () => {
  describe('addMonthsEdate', () => {
    it('should add 1 month correctly matching Excel EDATE', () => {
      assert.strictEqual(addMonthsEdate('2026-01-15', 1), '2026-02-15');
      assert.strictEqual(addMonthsEdate('2026-10-30', 1), '2026-11-30');
    });

    it('should handle leap years and month-end clipping', () => {
      // 2028 is a leap year; 2027 is non-leap
      const resultNonLeap = addMonthsEdate('2027-01-31', 1);
      assert.strictEqual(resultNonLeap, '2027-02-28');
    });

    it('should handle adding 12 months (1 year)', () => {
      assert.strictEqual(addMonthsEdate('2026-05-20', 12), '2027-05-20');
    });

    it('should return empty string on invalid or empty date', () => {
      assert.strictEqual(addMonthsEdate(''), '');
      assert.strictEqual(addMonthsEdate(null), '');
    });
  });

  describe('daysDifference', () => {
    it('should calculate positive day difference when dateA is after dateB', () => {
      assert.strictEqual(daysDifference('2026-10-15', '2026-10-10'), 5);
      assert.strictEqual(daysDifference('2026-11-01', '2026-10-31'), 1);
    });

    it('should calculate negative day difference when dateA is before dateB', () => {
      assert.strictEqual(daysDifference('2026-10-10', '2026-10-15'), -5);
    });

    it('should return 0 for identical dates or missing inputs', () => {
      assert.strictEqual(daysDifference('2026-10-06', '2026-10-06'), 0);
      assert.strictEqual(daysDifference('', '2026-10-06'), 0);
      assert.strictEqual(daysDifference(null, null), 0);
    });
  });

  describe('isBeforeToday', () => {
    it('should return true for past dates relative to reference date', () => {
      const ref = new Date('2026-10-06');
      assert.strictEqual(isBeforeToday('2026-10-05', ref), true);
      assert.strictEqual(isBeforeToday('2026-09-30', ref), true);
    });

    it('should return false for today or future dates', () => {
      const ref = new Date('2026-10-06');
      assert.strictEqual(isBeforeToday('2026-10-06', ref), false);
      assert.strictEqual(isBeforeToday('2026-10-07', ref), false);
      assert.strictEqual(isBeforeToday('2026-12-31', ref), false);
    });

    it('should return false for missing date', () => {
      assert.strictEqual(isBeforeToday(''), false);
      assert.strictEqual(isBeforeToday(null), false);
    });
  });
});
