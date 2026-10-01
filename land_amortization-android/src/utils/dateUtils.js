import { addMonths, differenceInCalendarDays, parseISO, startOfDay, isValid } from 'date-fns';
import { toISODateString } from './formatters.js';

/**
 * Replicate Excel EDATE(startDate, months)
 * @param {string|Date} startDate 
 * @param {number} monthsToAdd 
 * @returns {string} YYYY-MM-DD
 */
export function addMonthsEdate(startDate, monthsToAdd = 0) {
  if (!startDate) return '';
  const d = typeof startDate === 'string' ? parseISO(startDate.substring(0, 10)) : new Date(startDate);
  if (!isValid(d)) return '';
  const result = addMonths(d, monthsToAdd);
  return toISODateString(result);
}

/**
 * Difference in calendar days: dateA - dateB (positive if dateA is later than dateB)
 * @param {string|Date} dateA 
 * @param {string|Date} dateB 
 * @returns {number}
 */
export function daysDifference(dateA, dateB) {
  if (!dateA || !dateB) return 0;
  const dA = typeof dateA === 'string' ? parseISO(dateA.substring(0, 10)) : new Date(dateA);
  const dB = typeof dateB === 'string' ? parseISO(dateB.substring(0, 10)) : new Date(dateB);
  if (!isValid(dA) || !isValid(dB)) return 0;
  return differenceInCalendarDays(startOfDay(dA), startOfDay(dB));
}

/**
 * Check if a date is strictly before today (based on midnight start of day)
 * @param {string|Date} dateVal 
 * @param {Date} [todayRef]
 * @returns {boolean}
 */
export function isBeforeToday(dateVal, todayRef = new Date()) {
  if (!dateVal) return false;
  const d = typeof dateVal === 'string' ? parseISO(dateVal.substring(0, 10)) : new Date(dateVal);
  if (!isValid(d)) return false;
  return startOfDay(d).getTime() < startOfDay(todayRef).getTime();
}
