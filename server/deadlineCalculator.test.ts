import { describe, it, expect } from 'vitest';
import {
  calculate30DayDeadline,
  getDaysUntilDeadline,
  isDeadlineApproaching,
  isDeadlineOverdue,
  getDeadlineStatus,
} from './deadlineCalculator';

describe('Deadline Calculator', () => {
  describe('calculate30DayDeadline', () => {
    it('should calculate 30 days from mailing date', () => {
      const mailingDate = new Date('2024-01-01');
      const deadline = calculate30DayDeadline(mailingDate);
      expect(deadline.toISOString().split('T')[0]).toBe('2024-01-31');
    });

    it('should handle month boundaries correctly', () => {
      const mailingDate = new Date('2024-02-15');
      const deadline = calculate30DayDeadline(mailingDate);
      expect(deadline.toISOString().split('T')[0]).toBe('2024-03-15'); // Feb 15 + 30 days = Mar 16 (leap year)
    });
  });

  describe('getDaysUntilDeadline', () => {
    it('should return positive days for future deadline', () => {
      const today = new Date();
      const futureDeadline = new Date(today);
      futureDeadline.setDate(today.getDate() + 10);
      
      const days = getDaysUntilDeadline(futureDeadline);
      expect(days).toBe(10);
    });

    it('should return negative days for past deadline', () => {
      const today = new Date();
      const pastDeadline = new Date(today);
      pastDeadline.setDate(today.getDate() - 5);
      
      const days = getDaysUntilDeadline(pastDeadline);
      expect(days).toBe(-5);
    });

    it('should return 0 for today', () => {
      const today = new Date();
      const days = getDaysUntilDeadline(today);
      expect(days).toBe(0);
    });
  });

  describe('isDeadlineApproaching', () => {
    it('should return true for deadline within 7 days', () => {
      const today = new Date();
      const deadline = new Date(today);
      deadline.setDate(today.getDate() + 5);
      
      expect(isDeadlineApproaching(deadline)).toBe(true);
    });

    it('should return false for deadline more than 7 days away', () => {
      const today = new Date();
      const deadline = new Date(today);
      deadline.setDate(today.getDate() + 10);
      
      expect(isDeadlineApproaching(deadline)).toBe(false);
    });

    it('should return false for past deadline', () => {
      const today = new Date();
      const deadline = new Date(today);
      deadline.setDate(today.getDate() - 1);
      
      expect(isDeadlineApproaching(deadline)).toBe(false);
    });
  });

  describe('isDeadlineOverdue', () => {
    it('should return true for past deadline', () => {
      const today = new Date();
      const deadline = new Date(today);
      deadline.setDate(today.getDate() - 1);
      
      expect(isDeadlineOverdue(deadline)).toBe(true);
    });

    it('should return false for future deadline', () => {
      const today = new Date();
      const deadline = new Date(today);
      deadline.setDate(today.getDate() + 5);
      
      expect(isDeadlineOverdue(deadline)).toBe(false);
    });
  });

  describe('getDeadlineStatus', () => {
    it('should return overdue status for past deadline', () => {
      const today = new Date();
      const deadline = new Date(today);
      deadline.setDate(today.getDate() - 3);
      
      const status = getDeadlineStatus(deadline);
      expect(status.status).toBe('overdue');
      expect(status.daysRemaining).toBe(-3);
      expect(status.message).toContain('Overdue by 3 days');
    });

    it('should return approaching status for deadline within 7 days', () => {
      const today = new Date();
      const deadline = new Date(today);
      deadline.setDate(today.getDate() + 5);
      
      const status = getDeadlineStatus(deadline);
      expect(status.status).toBe('approaching');
      expect(status.daysRemaining).toBe(5);
      expect(status.message).toContain('5 days remaining');
    });

    it('should return normal status for deadline more than 7 days away', () => {
      const today = new Date();
      const deadline = new Date(today);
      deadline.setDate(today.getDate() + 15);
      
      const status = getDeadlineStatus(deadline);
      expect(status.status).toBe('normal');
      expect(status.daysRemaining).toBe(15);
      expect(status.message).toContain('15 days remaining');
    });

    it('should handle singular day correctly', () => {
      const today = new Date();
      const deadline = new Date(today);
      deadline.setDate(today.getDate() + 1);
      
      const status = getDeadlineStatus(deadline);
      expect(status.message).toContain('1 day remaining');
    });
  });
});
