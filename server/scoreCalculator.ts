/**
 * FICO Score Calculator
 * 
 * Implements credit score calculation based on publicly documented FICO factors:
 * - Payment History: 35%
 * - Credit Utilization: 30%
 * - Credit Age: 15%
 * - Credit Mix: 10%
 * - New Credit/Inquiries: 10%
 * 
 * Note: This is an approximation based on public information. Actual FICO algorithms are proprietary.
 */

export interface AccountData {
  accountType: 'credit_card' | 'auto_loan' | 'personal_loan' | 'student_loan' | 'mortgage' | 'other';
  currentBalance: number;
  creditLimit?: number; // For revolving accounts
  originalAmount?: number; // For installment loans
  status: 'current' | 'late' | 'closed' | 'paid_off';
  openDate: Date;
  closeDate?: Date;
  paymentHistory?: PaymentRecord[];
  monthsReviewed?: number; // Number of months of payment history available
  latePayments30?: number;
  latePayments60?: number;
  latePayments90?: number;
}

export interface PaymentRecord {
  date: Date;
  status: 'on_time' | '30_days_late' | '60_days_late' | '90_days_late' | 'charge_off';
}

export interface InquiryData {
  date: Date;
  creditor: string;
}

export interface PublicRecordData {
  type: 'bankruptcy' | 'tax_lien' | 'judgment' | 'foreclosure';
  date: Date;
  amount?: number;
  status: 'filed' | 'discharged' | 'satisfied';
}

export interface CreditProfile {
  accounts: AccountData[];
  inquiries: InquiryData[];
  publicRecords: PublicRecordData[];
}

export interface ScoreFactors {
  paymentHistory: {
    score: number;
    weight: number;
    details: {
      onTimePaymentRate: number;
      latePayments30: number;
      latePayments60: number;
      latePayments90: number;
      derogatory: number;
    };
  };
  creditUtilization: {
    score: number;
    weight: number;
    details: {
      overallUtilization: number;
      perCardUtilization: number[];
      accountsOverLimit: number;
    };
  };
  creditAge: {
    score: number;
    weight: number;
    details: {
      averageAge: number; // in months
      oldestAccount: number; // in months
      newestAccount: number; // in months
    };
  };
  creditMix: {
    score: number;
    weight: number;
    details: {
      hasRevolving: boolean;
      hasInstallment: boolean;
      hasMortgage: boolean;
      accountTypes: number;
    };
  };
  newCredit: {
    score: number;
    weight: number;
    details: {
      inquiriesLast12Months: number;
      accountsOpenedLast12Months: number;
      recentInquiries: number;
    };
  };
}

export interface ScoreResult {
  score: number;
  factors: ScoreFactors;
  grade: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
}

/**
 * Calculate payment history score (35% of total)
 */
function calculatePaymentHistoryScore(accounts: AccountData[], publicRecords: PublicRecordData[]): ScoreFactors['paymentHistory'] {
  let totalPayments = 0;
  let onTimePayments = 0;
  let late30 = 0;
  let late60 = 0;
  let late90 = 0;
  
  for (const account of accounts) {
    if (account.paymentHistory) {
      totalPayments += account.paymentHistory.length;
      onTimePayments += account.paymentHistory.filter(p => p.status === 'on_time').length;
      late30 += account.paymentHistory.filter(p => p.status === '30_days_late').length;
      late60 += account.paymentHistory.filter(p => p.status === '60_days_late').length;
      late90 += account.paymentHistory.filter(p => p.status === '90_days_late').length;
    } else if (account.monthsReviewed) {
      // Estimate based on late payment counts
      totalPayments += account.monthsReviewed;
      late30 += account.latePayments30 || 0;
      late60 += account.latePayments60 || 0;
      late90 += account.latePayments90 || 0;
      onTimePayments += account.monthsReviewed - (late30 + late60 + late90);
    }
  }
  
  const onTimeRate = totalPayments > 0 ? onTimePayments / totalPayments : 1;
  const derogatory = publicRecords.length;
  
  // Score calculation (0-100 scale, then weighted)
  let score = 100;
  
  // Deduct for late payments (exponential impact)
  score -= late30 * 2;
  score -= late60 * 5;
  score -= late90 * 10;
  
  // Deduct for public records (severe impact)
  score -= derogatory * 25;
  
  // Ensure minimum score
  score = Math.max(0, score);
  
  return {
    score,
    weight: 0.35,
    details: {
      onTimePaymentRate: onTimeRate,
      latePayments30: late30,
      latePayments60: late60,
      latePayments90: late90,
      derogatory,
    },
  };
}

/**
 * Calculate credit utilization score (30% of total)
 */
function calculateCreditUtilizationScore(accounts: AccountData[]): ScoreFactors['creditUtilization'] {
  const revolvingAccounts = accounts.filter(a => 
    a.accountType === 'credit_card' && a.creditLimit && a.creditLimit > 0
  );
  
  if (revolvingAccounts.length === 0) {
    return {
      score: 100,
      weight: 0.30,
      details: {
        overallUtilization: 0,
        perCardUtilization: [],
        accountsOverLimit: 0,
      },
    };
  }
  
  let totalBalance = 0;
  let totalLimit = 0;
  const perCardUtil: number[] = [];
  let accountsOverLimit = 0;
  
  for (const account of revolvingAccounts) {
    const balance = account.currentBalance || 0;
    const limit = account.creditLimit || 0;
    
    totalBalance += balance;
    totalLimit += limit;
    
    const util = limit > 0 ? (balance / limit) * 100 : 0;
    perCardUtil.push(util);
    
    if (util > 100) accountsOverLimit++;
  }
  
  const overallUtil = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
  
  // Score calculation
  let score = 100;
  
  // Optimal utilization is under 10%, acceptable under 30%
  if (overallUtil <= 10) {
    score = 100;
  } else if (overallUtil <= 30) {
    score = 100 - ((overallUtil - 10) * 1.5);
  } else if (overallUtil <= 50) {
    score = 70 - ((overallUtil - 30) * 2);
  } else if (overallUtil <= 75) {
    score = 30 - ((overallUtil - 50) * 0.8);
  } else {
    score = Math.max(0, 10 - ((overallUtil - 75) * 0.4));
  }
  
  // Penalize accounts over limit
  score -= accountsOverLimit * 15;
  score = Math.max(0, score);
  
  return {
    score,
    weight: 0.30,
    details: {
      overallUtilization: overallUtil,
      perCardUtilization: perCardUtil,
      accountsOverLimit,
    },
  };
}

/**
 * Calculate credit age score (15% of total)
 */
function calculateCreditAgeScore(accounts: AccountData[]): ScoreFactors['creditAge'] {
  if (accounts.length === 0) {
    return {
      score: 0,
      weight: 0.15,
      details: {
        averageAge: 0,
        oldestAccount: 0,
        newestAccount: 0,
      },
    };
  }
  
  const now = new Date();
  const ages = accounts.map(a => {
    const openDate = new Date(a.openDate);
    const closeDate = a.closeDate ? new Date(a.closeDate) : now;
    const ageInMonths = (closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return Math.max(0, ageInMonths);
  });
  
  const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
  const oldestAccount = Math.max(...ages);
  const newestAccount = Math.min(...ages);
  
  // Score calculation
  let score = 0;
  
  // Average age scoring (longer is better)
  if (averageAge >= 120) score += 50; // 10+ years
  else if (averageAge >= 84) score += 40; // 7+ years
  else if (averageAge >= 60) score += 30; // 5+ years
  else if (averageAge >= 36) score += 20; // 3+ years
  else if (averageAge >= 24) score += 10; // 2+ years
  else score += (averageAge / 24) * 10;
  
  // Oldest account scoring
  if (oldestAccount >= 120) score += 50;
  else if (oldestAccount >= 84) score += 40;
  else if (oldestAccount >= 60) score += 30;
  else if (oldestAccount >= 36) score += 20;
  else score += (oldestAccount / 36) * 20;
  
  score = Math.min(100, score);
  
  return {
    score,
    weight: 0.15,
    details: {
      averageAge,
      oldestAccount,
      newestAccount,
    },
  };
}

/**
 * Calculate credit mix score (10% of total)
 */
function calculateCreditMixScore(accounts: AccountData[]): ScoreFactors['creditMix'] {
  const hasRevolving = accounts.some(a => a.accountType === 'credit_card');
  const hasInstallment = accounts.some(a => 
    a.accountType === 'auto_loan' || 
    a.accountType === 'personal_loan' || 
    a.accountType === 'student_loan'
  );
  const hasMortgage = accounts.some(a => a.accountType === 'mortgage');
  
  const uniqueTypes = new Set(accounts.map(a => a.accountType)).size;
  
  // Score calculation
  let score = 0;
  
  if (hasRevolving) score += 30;
  if (hasInstallment) score += 30;
  if (hasMortgage) score += 20;
  
  // Bonus for variety
  if (uniqueTypes >= 4) score += 20;
  else if (uniqueTypes === 3) score += 15;
  else if (uniqueTypes === 2) score += 10;
  
  score = Math.min(100, score);
  
  return {
    score,
    weight: 0.10,
    details: {
      hasRevolving,
      hasInstallment,
      hasMortgage,
      accountTypes: uniqueTypes,
    },
  };
}

/**
 * Calculate new credit score (10% of total)
 */
function calculateNewCreditScore(accounts: AccountData[], inquiries: InquiryData[]): ScoreFactors['newCredit'] {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
  
  const recentInquiries = inquiries.filter(i => new Date(i.date) >= twelveMonthsAgo).length;
  const recentAccounts = accounts.filter(a => new Date(a.openDate) >= twelveMonthsAgo).length;
  
  // Score calculation
  let score = 100;
  
  // Deduct for inquiries (each inquiry has diminishing impact)
  score -= Math.min(50, recentInquiries * 5);
  
  // Deduct for new accounts
  score -= Math.min(30, recentAccounts * 8);
  
  score = Math.max(0, score);
  
  return {
    score,
    weight: 0.10,
    details: {
      inquiriesLast12Months: recentInquiries,
      accountsOpenedLast12Months: recentAccounts,
      recentInquiries,
    },
  };
}

/**
 * Calculate overall FICO score
 */
export function calculateCreditScore(profile: CreditProfile): ScoreResult {
  const paymentHistory = calculatePaymentHistoryScore(profile.accounts, profile.publicRecords);
  const creditUtilization = calculateCreditUtilizationScore(profile.accounts);
  const creditAge = calculateCreditAgeScore(profile.accounts);
  const creditMix = calculateCreditMixScore(profile.accounts);
  const newCredit = calculateNewCreditScore(profile.accounts, profile.inquiries);
  
  // Calculate weighted score (300-850 range)
  const weightedScore = 
    (paymentHistory.score * paymentHistory.weight) +
    (creditUtilization.score * creditUtilization.weight) +
    (creditAge.score * creditAge.weight) +
    (creditMix.score * creditMix.weight) +
    (newCredit.score * newCredit.weight);
  
  // Map 0-100 weighted score to 300-850 FICO range
  const ficoScore = Math.round(300 + (weightedScore / 100) * 550);
  
  // Determine grade
  let grade: ScoreResult['grade'];
  if (ficoScore >= 800) grade = 'Excellent';
  else if (ficoScore >= 740) grade = 'Very Good';
  else if (ficoScore >= 670) grade = 'Good';
  else if (ficoScore >= 580) grade = 'Fair';
  else grade = 'Poor';
  
  return {
    score: ficoScore,
    factors: {
      paymentHistory,
      creditUtilization,
      creditAge,
      creditMix,
      newCredit,
    },
    grade,
  };
}

/**
 * Calculate score impact of a hypothetical change
 */
export function calculateScoreImpact(
  currentProfile: CreditProfile,
  changes: Partial<CreditProfile>
): { currentScore: number; newScore: number; impact: number } {
  const currentScore = calculateCreditScore(currentProfile).score;
  
  const newProfile: CreditProfile = {
    accounts: changes.accounts || currentProfile.accounts,
    inquiries: changes.inquiries || currentProfile.inquiries,
    publicRecords: changes.publicRecords || currentProfile.publicRecords,
  };
  
  const newScore = calculateCreditScore(newProfile).score;
  
  return {
    currentScore,
    newScore,
    impact: newScore - currentScore,
  };
}
