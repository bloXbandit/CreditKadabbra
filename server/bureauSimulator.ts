/**
 * Bureau Score Simulator
 * 
 * When a credit report is uploaded from only one bureau, this module simulates
 * the scores for the other two bureaus based on known variance patterns.
 * 
 * Real-world observation: Bureau scores typically vary by 10-50 points due to:
 * - Different reporting timelines (accounts report at different times)
 * - Different account mixes (not all creditors report to all bureaus)
 * - Slight variations in scoring models
 */

export interface BureauScore {
  bureau: 'equifax' | 'experian' | 'transunion';
  score: number;
  isSimulated: boolean;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

/**
 * Simulate missing bureau scores based on one known score
 * 
 * @param knownBureau - The bureau we have actual data from
 * @param knownScore - The actual score from that bureau
 * @param accountCount - Number of accounts (affects variance)
 * @returns Array of all three bureau scores (1 actual, 2 simulated)
 */
export function simulateMissingBureauScores(
  knownBureau: 'equifax' | 'experian' | 'transunion',
  knownScore: number,
  accountCount: number = 0
): BureauScore[] {
  const bureaus: Array<'equifax' | 'experian' | 'transunion'> = ['equifax', 'experian', 'transunion'];
  
  // Base variance: typically 10-30 points between bureaus
  // More accounts = more potential variance (different reporting)
  const baseVariance = Math.min(30, 10 + (accountCount * 0.5));
  
  // Experian tends to be slightly higher on average
  // TransUnion tends to be in the middle
  // Equifax tends to be slightly lower
  const bureauBias: Record<string, number> = {
    experian: 5,
    transunion: 0,
    equifax: -5,
  };
  
  const results: BureauScore[] = [];
  
  for (const bureau of bureaus) {
    if (bureau === knownBureau) {
      // This is the actual score
      results.push({
        bureau,
        score: knownScore,
        isSimulated: false,
        confidence: 'high',
        notes: 'Actual score from credit report',
      });
    } else {
      // Simulate this bureau's score
      const bias = bureauBias[bureau] - bureauBias[knownBureau];
      
      // Random variance within range
      const variance = (Math.random() - 0.5) * baseVariance * 2;
      
      // Calculate simulated score
      let simulatedScore = Math.round(knownScore + bias + variance);
      
      // Ensure score stays within FICO range
      simulatedScore = Math.max(300, Math.min(850, simulatedScore));
      
      // Confidence based on score range and account count
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      if (accountCount < 3) confidence = 'low';
      else if (accountCount > 10) confidence = 'high';
      
      results.push({
        bureau,
        score: simulatedScore,
        isSimulated: true,
        confidence,
        notes: `Estimated based on ${knownBureau} score with ${Math.abs(Math.round(variance))}pt variance`,
      });
    }
  }
  
  return results;
}

/**
 * Optimal Payment Date Calculator
 * 
 * Calculates the best date to pay credit card bills to minimize reported utilization.
 * 
 * Key insight: Most creditors report to bureaus 1-3 days after statement closing date.
 * Paying BEFORE the statement closes = lower balance reported = better utilization.
 */

export interface PaymentRecommendation {
  accountName: string;
  statementDate: Date;
  dueDate: Date;
  optimalPaymentDate: Date;
  optimalPaymentWindow: {
    start: Date;
    end: Date;
  };
  reasoning: string;
  utilizationImpact: {
    current: number;
    afterPayment: number;
    improvement: number;
  };
}

/**
 * Calculate optimal payment date for a revolving account
 * 
 * @param statementDate - When the statement closes (balance is calculated)
 * @param dueDate - When payment is due
 * @param currentBalance - Current balance on the account
 * @param creditLimit - Credit limit
 * @param plannedPayment - Amount planning to pay
 * @returns Payment recommendation with optimal date and reasoning
 */
export function calculateOptimalPaymentDate(
  accountName: string,
  statementDate: Date,
  dueDate: Date,
  currentBalance: number,
  creditLimit: number,
  plannedPayment: number = 0
): PaymentRecommendation {
  // If no planned payment specified, assume paying to 0
  if (plannedPayment === 0) {
    plannedPayment = currentBalance;
  }
  
  const currentUtilization = creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;
  const afterPaymentBalance = Math.max(0, currentBalance - plannedPayment);
  const afterPaymentUtilization = creditLimit > 0 ? (afterPaymentBalance / creditLimit) * 100 : 0;
  
  // Optimal payment window: 3-5 days BEFORE statement date
  // This ensures payment posts before statement closes
  const optimalPaymentDate = new Date(statementDate);
  optimalPaymentDate.setDate(optimalPaymentDate.getDate() - 4);
  
  const windowStart = new Date(statementDate);
  windowStart.setDate(windowStart.getDate() - 5);
  
  const windowEnd = new Date(statementDate);
  windowEnd.setDate(windowEnd.getDate() - 2);
  
  let reasoning = '';
  
  if (currentUtilization > 30) {
    reasoning = `Your current utilization is ${currentUtilization.toFixed(1)}% (high). Pay ${plannedPayment > 0 ? `$${plannedPayment}` : 'the full balance'} by ${optimalPaymentDate.toLocaleDateString()} (4 days before statement closes) to report ${afterPaymentUtilization.toFixed(1)}% utilization instead. This timing ensures your payment posts BEFORE the balance is reported to credit bureaus.`;
  } else if (currentUtilization > 10) {
    reasoning = `Your current utilization is ${currentUtilization.toFixed(1)}% (moderate). Pay by ${optimalPaymentDate.toLocaleDateString()} to lower reported utilization to ${afterPaymentUtilization.toFixed(1)}% and maximize your score impact.`;
  } else {
    reasoning = `Your utilization is already excellent at ${currentUtilization.toFixed(1)}%. Continue paying before the statement date (${statementDate.toLocaleDateString()}) to maintain low reported balances.`;
  }
  
  return {
    accountName,
    statementDate,
    dueDate,
    optimalPaymentDate,
    optimalPaymentWindow: {
      start: windowStart,
      end: windowEnd,
    },
    reasoning,
    utilizationImpact: {
      current: currentUtilization,
      afterPayment: afterPaymentUtilization,
      improvement: currentUtilization - afterPaymentUtilization,
    },
  };
}

/**
 * Calculate optimal payment dates for all revolving accounts
 */
export function calculateAllPaymentDates(
  accounts: Array<{
    name: string;
    statementDate: Date;
    dueDate: Date;
    currentBalance: number;
    creditLimit: number;
    plannedPayment?: number;
  }>
): PaymentRecommendation[] {
  return accounts
    .filter(a => a.creditLimit > 0) // Only revolving accounts
    .map(a => calculateOptimalPaymentDate(
      a.name,
      a.statementDate,
      a.dueDate,
      a.currentBalance,
      a.creditLimit,
      a.plannedPayment
    ))
    .sort((a, b) => a.optimalPaymentDate.getTime() - b.optimalPaymentDate.getTime());
}

/**
 * Auto-detect statement date from due date
 * Most cards: statement closes 21-25 days before due date
 */
export function estimateStatementDate(dueDate: Date): Date {
  const statementDate = new Date(dueDate);
  statementDate.setDate(statementDate.getDate() - 23); // Average is 23 days
  return statementDate;
}
