/**
 * CSV Parser for Credit Report Account Data
 * Supports formats from Credit Karma, Experian, TransUnion, and generic CSV exports
 */

export interface CSVAccountData {
  accountName: string;
  accountNumber?: string;
  accountType?: string;
  balance?: string;
  creditLimit?: string;
  paymentStatus?: string;
  dateOpened?: string;
  monthlyPayment?: string;
  interestRate?: string;
}

/**
 * Parse CSV content and extract account data
 * Handles various CSV formats with flexible column mapping
 */
export function parseAccountsCSV(csvContent: string): CSVAccountData[] {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length < 2) {
    throw new Error('CSV must contain at least a header row and one data row');
  }
  
  // Parse header row
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  
  // Map common column name variations to standard fields
  const columnMap = createColumnMap(headers);
  
  const accounts: CSVAccountData[] = [];
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length === 0 || values.every(v => !v)) continue; // Skip empty rows
    
    const account: CSVAccountData = {
      accountName: getValue(values, columnMap.accountName) || 'Unknown Account',
    };
    
    // Optional fields
    const accountNumber = getValue(values, columnMap.accountNumber);
    if (accountNumber) account.accountNumber = accountNumber;
    
    const accountType = getValue(values, columnMap.accountType);
    if (accountType) account.accountType = normalizeAccountType(accountType);
    
    const balance = getValue(values, columnMap.balance);
    if (balance) account.balance = cleanCurrency(balance);
    
    const creditLimit = getValue(values, columnMap.creditLimit);
    if (creditLimit) account.creditLimit = cleanCurrency(creditLimit);
    
    const paymentStatus = getValue(values, columnMap.paymentStatus);
    if (paymentStatus) account.paymentStatus = paymentStatus;
    
    const dateOpened = getValue(values, columnMap.dateOpened);
    if (dateOpened) account.dateOpened = normalizeDate(dateOpened);
    
    const monthlyPayment = getValue(values, columnMap.monthlyPayment);
    if (monthlyPayment) account.monthlyPayment = cleanCurrency(monthlyPayment);
    
    const interestRate = getValue(values, columnMap.interestRate);
    if (interestRate) account.interestRate = cleanPercentage(interestRate);
    
    accounts.push(account);
  }
  
  return accounts;
}

/**
 * Parse a single CSV line, handling quoted fields and commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Create column index map from headers
 */
function createColumnMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {
    accountName: -1,
    accountNumber: -1,
    accountType: -1,
    balance: -1,
    creditLimit: -1,
    paymentStatus: -1,
    dateOpened: -1,
    monthlyPayment: -1,
    interestRate: -1,
  };
  
  headers.forEach((header, index) => {
    // Account name variations
    if (header.match(/account\s*name|creditor|lender|company/i)) {
      map.accountName = index;
    }
    // Account number variations
    else if (header.match(/account\s*number|account\s*#|acct\s*num/i)) {
      map.accountNumber = index;
    }
    // Account type variations
    else if (header.match(/account\s*type|type|category/i)) {
      map.accountType = index;
    }
    // Balance variations
    else if (header.match(/^balance|current\s*balance|amount\s*owed/i)) {
      map.balance = index;
    }
    // Credit limit variations
    else if (header.match(/credit\s*limit|limit|max\s*credit/i)) {
      map.creditLimit = index;
    }
    // Payment status variations
    else if (header.match(/status|payment\s*status|pay\s*status/i)) {
      map.paymentStatus = index;
    }
    // Date opened variations
    else if (header.match(/date\s*opened|open\s*date|opened/i)) {
      map.dateOpened = index;
    }
    // Monthly payment variations
    else if (header.match(/monthly\s*payment|payment|min\s*payment/i)) {
      map.monthlyPayment = index;
    }
    // Interest rate variations
    else if (header.match(/interest|apr|rate/i)) {
      map.interestRate = index;
    }
  });
  
  return map;
}

/**
 * Get value from array by index, return empty string if invalid
 */
function getValue(values: string[], index: number): string {
  if (index < 0 || index >= values.length) return '';
  return values[index].trim();
}

/**
 * Normalize account type to standard values
 */
function normalizeAccountType(type: string): string {
  const lower = type.toLowerCase();
  
  if (lower.match(/credit\s*card|revolving/i)) return 'credit_card';
  if (lower.match(/mortgage|home\s*loan/i)) return 'mortgage';
  if (lower.match(/auto|car|vehicle/i)) return 'auto_loan';
  if (lower.match(/personal\s*loan/i)) return 'personal_loan';
  if (lower.match(/student\s*loan/i)) return 'student_loan';
  
  return type; // Return original if no match
}

/**
 * Clean currency values (remove $, commas)
 */
function cleanCurrency(value: string): string {
  return value.replace(/[$,]/g, '').trim();
}

/**
 * Clean percentage values (remove %)
 */
function cleanPercentage(value: string): string {
  return value.replace(/%/g, '').trim();
}

/**
 * Normalize date formats to MM/DD/YYYY
 */
function normalizeDate(dateStr: string): string {
  // Try to parse various date formats
  const cleaned = dateStr.trim();
  
  // Already in MM/DD/YYYY format
  if (cleaned.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    return cleaned;
  }
  
  // YYYY-MM-DD format
  if (cleaned.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
    const [year, month, day] = cleaned.split('-');
    return `${month}/${day}/${year}`;
  }
  
  // MM-DD-YYYY format
  if (cleaned.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
    return cleaned.replace(/-/g, '/');
  }
  
  return cleaned; // Return as-is if format not recognized
}
