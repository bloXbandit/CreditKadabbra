/**
 * Credit Report Parser
 * 
 * Parses credit report text to extract account data for score calculation
 * Supports manual text input or OCR-extracted text from PDF reports
 */

import type { AccountData, InquiryData, PublicRecordData } from './scoreCalculator';

export interface ParsedCreditReport {
  accounts: AccountData[];
  inquiries: InquiryData[];
  publicRecords: PublicRecordData[];
  personalInfo?: {
    name?: string;
    address?: string;
    ssn?: string;
    dob?: string;
  };
}

/**
 * Parse account type from description
 */
function parseAccountType(description: string): AccountData['accountType'] {
  const desc = description.toLowerCase();
  
  if (desc.includes('credit card') || desc.includes('revolving')) return 'credit_card';
  if (desc.includes('auto') || desc.includes('vehicle') || desc.includes('car loan')) return 'auto_loan';
  if (desc.includes('mortgage') || desc.includes('home loan') || desc.includes('real estate')) return 'mortgage';
  if (desc.includes('student') || desc.includes('education')) return 'student_loan';
  if (desc.includes('personal loan') || desc.includes('installment')) return 'personal_loan';
  
  return 'other';
}

/**
 * Parse account status from description
 */
function parseAccountStatus(description: string): AccountData['status'] {
  const desc = description.toLowerCase();
  
  if (desc.includes('paid') || desc.includes('closed') || desc.includes('paid off')) return 'paid_off';
  if (desc.includes('late') || desc.includes('delinquent') || desc.includes('past due')) return 'late';
  if (desc.includes('closed')) return 'closed';
  
  return 'current';
}

/**
 * Extract dollar amount from text
 */
function extractAmount(text: string): number | undefined {
  const match = text.match(/\$?([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return undefined;
}

/**
 * Extract date from text (supports various formats)
 */
function extractDate(text: string): Date | undefined {
  // Try MM/DD/YYYY
  let match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
  }
  
  // Try MM-DD-YYYY
  match = text.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
  }
  
  // Try Month YYYY
  match = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i);
  if (match) {
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const month = months[match[1].toLowerCase().substring(0, 3)];
    return new Date(parseInt(match[2]), month, 1);
  }
  
  return undefined;
}

/**
 * Parse structured account data from JSON
 * (For manual entry or API-imported data)
 */
export function parseStructuredAccount(data: any): AccountData {
  return {
    accountType: data.accountType || 'other',
    currentBalance: data.currentBalance || 0,
    creditLimit: data.creditLimit,
    originalAmount: data.originalAmount,
    status: data.status || 'current',
    openDate: data.openDate ? new Date(data.openDate) : new Date(),
    closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
    paymentHistory: data.paymentHistory,
    monthsReviewed: data.monthsReviewed,
    latePayments30: data.latePayments30 || 0,
    latePayments60: data.latePayments60 || 0,
    latePayments90: data.latePayments90 || 0,
  };
}

/**
 * Parse credit report text (OCR or manual input)
 * 
 * This is a simplified parser. In production, you'd want more robust parsing
 * or integration with credit report APIs.
 */
export function parseCreditReportText(reportText: string): ParsedCreditReport {
  const accounts: AccountData[] = [];
  const inquiries: InquiryData[] = [];
  const publicRecords: PublicRecordData[] = [];
  
  // Split into lines
  const lines = reportText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentSection = '';
  let currentAccount: Partial<AccountData> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Detect sections
    if (lowerLine.includes('credit card') || lowerLine.includes('revolving')) {
      currentSection = 'accounts';
      if (currentAccount) {
        accounts.push(currentAccount as AccountData);
      }
      currentAccount = {
        accountType: 'credit_card',
        status: 'current',
        openDate: new Date(),
        currentBalance: 0,
      };
      continue;
    }
    
    if (lowerLine.includes('installment') || lowerLine.includes('loan')) {
      currentSection = 'accounts';
      if (currentAccount) {
        accounts.push(currentAccount as AccountData);
      }
      currentAccount = {
        accountType: parseAccountType(line),
        status: 'current',
        openDate: new Date(),
        currentBalance: 0,
      };
      continue;
    }
    
    if (lowerLine.includes('inquir')) {
      currentSection = 'inquiries';
      if (currentAccount) {
        accounts.push(currentAccount as AccountData);
        currentAccount = null;
      }
      continue;
    }
    
    if (lowerLine.includes('public record') || lowerLine.includes('bankruptcy') || lowerLine.includes('judgment')) {
      currentSection = 'public_records';
      if (currentAccount) {
        accounts.push(currentAccount as AccountData);
        currentAccount = null;
      }
      continue;
    }
    
    // Parse account details
    if (currentSection === 'accounts' && currentAccount) {
      if (lowerLine.includes('balance')) {
        const amount = extractAmount(line);
        if (amount !== undefined) {
          currentAccount.currentBalance = amount;
        }
      }
      
      if (lowerLine.includes('limit') || lowerLine.includes('high credit')) {
        const amount = extractAmount(line);
        if (amount !== undefined) {
          currentAccount.creditLimit = amount;
        }
      }
      
      if (lowerLine.includes('opened') || lowerLine.includes('open date')) {
        const date = extractDate(line);
        if (date) {
          currentAccount.openDate = date;
        }
      }
      
      if (lowerLine.includes('status')) {
        currentAccount.status = parseAccountStatus(line);
      }
      
      if (lowerLine.includes('30 days late') || lowerLine.includes('times 30')) {
        const match = line.match(/(\d+)/);
        if (match) {
          currentAccount.latePayments30 = parseInt(match[1]);
        }
      }
      
      if (lowerLine.includes('60 days late') || lowerLine.includes('times 60')) {
        const match = line.match(/(\d+)/);
        if (match) {
          currentAccount.latePayments60 = parseInt(match[1]);
        }
      }
      
      if (lowerLine.includes('90 days late') || lowerLine.includes('times 90')) {
        const match = line.match(/(\d+)/);
        if (match) {
          currentAccount.latePayments90 = parseInt(match[1]);
        }
      }
    }
    
    // Parse inquiries
    if (currentSection === 'inquiries') {
      const date = extractDate(line);
      if (date) {
        inquiries.push({
          date,
          creditor: line.split(/\d/)[0].trim(),
        });
      }
    }
    
    // Parse public records
    if (currentSection === 'public_records') {
      if (lowerLine.includes('bankruptcy')) {
        const date = extractDate(line);
        if (date) {
          publicRecords.push({
            type: 'bankruptcy',
            date,
            status: 'filed',
          });
        }
      }
    }
  }
  
  // Add last account
  if (currentAccount) {
    accounts.push(currentAccount as AccountData);
  }
  
  return {
    accounts,
    inquiries,
    publicRecords,
  };
}

/**
 * Convert live accounts from database to AccountData format
 */
export function convertLiveAccountToAccountData(liveAccount: any): AccountData {
  return {
    accountType: liveAccount.accountType,
    currentBalance: liveAccount.currentBalance || 0,
    creditLimit: liveAccount.creditLimit,
    originalAmount: liveAccount.originalAmount,
    status: liveAccount.status,
    openDate: new Date(liveAccount.createdAt), // Use creation date as proxy for open date
    closeDate: liveAccount.status === 'closed' || liveAccount.status === 'paid_off' ? new Date() : undefined,
    monthsReviewed: 24, // Default to 24 months
    latePayments30: 0, // User can update these manually
    latePayments60: 0,
    latePayments90: 0,
  };
}
