/**
 * Deadline Calculator
 * 
 * Calculates response deadlines for credit bureau disputes based on FCRA requirements
 */

/**
 * Calculate 30-day response deadline from mailing date
 * Per FCRA § 611(a)(1)(A), bureaus must complete investigation within 30 days
 */
export function calculate30DayDeadline(mailingDate: Date): Date {
  const deadline = new Date(mailingDate);
  deadline.setDate(deadline.getDate() + 30);
  return deadline;
}

/**
 * Calculate days remaining until deadline
 */
export function getDaysUntilDeadline(deadline: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if deadline is approaching (within 7 days)
 */
export function isDeadlineApproaching(deadline: Date): boolean {
  const daysRemaining = getDaysUntilDeadline(deadline);
  return daysRemaining >= 0 && daysRemaining <= 7;
}

/**
 * Check if deadline is overdue
 */
export function isDeadlineOverdue(deadline: Date): boolean {
  const daysRemaining = getDaysUntilDeadline(deadline);
  return daysRemaining < 0;
}

/**
 * Get deadline status for UI display
 */
export function getDeadlineStatus(deadline: Date): {
  status: 'overdue' | 'approaching' | 'normal';
  daysRemaining: number;
  message: string;
} {
  const daysRemaining = getDaysUntilDeadline(deadline);
  
  if (daysRemaining < 0) {
    return {
      status: 'overdue',
      daysRemaining,
      message: `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''}`,
    };
  }
  
  if (daysRemaining <= 7) {
    return {
      status: 'approaching',
      daysRemaining,
      message: `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`,
    };
  }
  
  return {
    status: 'normal',
    daysRemaining,
    message: `${daysRemaining} days remaining`,
  };
}
