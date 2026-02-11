import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Parsed TransUnion credit report data structure
 */
export interface ParsedTransUnionReport {
  personalInfo: {
    name: string;
    fileNumber?: string;
    ssn?: string;
    dateOfBirth?: string;
    addresses: Array<{
      address: string;
      dateReported?: string;
    }>;
    phoneNumbers: string[];
    employers: Array<{
      name: string;
      occupation?: string;
      dateHired?: string;
      dateVerified?: string;
    }>;
  };
  accounts: Array<{
    accountName: string;
    accountNumber?: string;
    accountType?: string;
    loanType?: string;
    responsibility?: string;
    address?: string;
    phone?: string;
    monthlyPayment?: string;
    dateOpened?: string;
    dateClosed?: string;
    balance?: string;
    highBalance?: string;
    creditLimit?: string;
    paymentStatus?: string;
    lastPaymentDate?: string;
    dateUpdated?: string;
    terms?: string;
    estimatedRemovalDate?: string;
    isNegative: boolean;
    remarks?: string[];
    paymentHistory?: Array<{
      month: string;
      year: string;
      status: string;
    }>;
  }>;
  inquiries: Array<{
    creditorName: string;
    inquiryDate: string;
    inquiryType: 'hard' | 'soft';
  }>;
  publicRecords: Array<{
    type: string;
    status: string;
    date?: string;
    amount?: string;
  }>;
}

/**
 * Extract text from PDF using pdftotext
 */
async function extractPdfText(pdfPath: string): Promise<string> {
  const { stdout } = await execAsync(`pdftotext "${pdfPath}" -`);
  return stdout;
}

/**
 * Check if a line is a page header/footer or navigation element
 */
function isPageMetadata(line: string): boolean {
  const metadataPatterns = [
    /^Page \d+ of \d+$/,
    /^View Your Report \| TransUnion Credit Report$/,
    /^\d{1,2}\/\d{1,2}\/\d{2,4}, \d{1,2}:\d{2} (AM|PM)$/,
    /^https?:\/\//,
    /^TransUnion$/i,
    /^Credit Report$/i,
  ];
  
  return metadataPatterns.some(pattern => pattern.test(line.trim()));
}

/**
 * Check if we're in a remark codes reference section
 */
function isRemarkCodeSection(line: string): boolean {
  const remarkPatterns = [
    /^Payment\/Remarks Key$/,
    /^Ratings$/,
    /^OK\s+Current, paying/,
    /^N\/R\s+Not Reported/,
    /^\d{2,3}\s+Account \d+ days late/,
    /^[A-Z]{2,4}:\s+/,  // Matches "ACD: ", "BKL: ", etc.
  ];
  
  return remarkPatterns.some(pattern => pattern.test(line.trim()));
}

/**
 * Parse payment history from lines
 */
function parsePaymentHistory(lines: string[], startIndex: number): Array<{month: string; year: string; status: string}> {
  const history: Array<{month: string; year: string; status: string}> = [];
  const monthPattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/;
  
  for (let i = startIndex; i < lines.length && i < startIndex + 50; i++) {
    const line = lines[i].trim();
    if (!line || isPageMetadata(line)) continue;
    
    // Stop if we hit next account or section
    if (line.includes('Account Information') || line.includes('Inquiries')) break;
    
    const match = line.match(monthPattern);
    if (match) {
      const [, month, year] = match;
      // Look for status on same line or next line
      const statusMatch = line.match(/(OK|30|60|90|120|C\/O|X|N\/R)/);
      if (statusMatch) {
        history.push({
          month,
          year,
          status: statusMatch[1],
        });
      }
    }
  }
  
  return history;
}

/**
 * Check if account has negative payment history
 */
function hasNegativeHistory(paymentHistory: Array<{month: string; year: string; status: string}>): boolean {
  const negativeStatuses = ['30', '60', '90', '120', 'C/O'];
  return paymentHistory.some(entry => negativeStatuses.includes(entry.status));
}

/**
 * Parse TransUnion credit report from PDF
 */
export async function parseTransUnionReportV2(pdfPath: string): Promise<ParsedTransUnionReport> {
  const text = await extractPdfText(pdfPath);
  const lines = text.split('\n');
  
  const result: ParsedTransUnionReport = {
    personalInfo: {
      name: '',
      addresses: [],
      phoneNumbers: [],
      employers: [],
    },
    accounts: [],
    inquiries: [],
    publicRecords: [],
  };
  
  let inRemarkSection = false;
  let currentSection: 'personal' | 'accounts' | 'inquiries' | 'publicRecords' | 'none' = 'none';
  let currentAccount: any = null;
  let accountLineBuffer: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and page metadata
    if (!line || isPageMetadata(line)) continue;
    
    // Track remark code sections to skip them
    if (isRemarkCodeSection(line)) {
      inRemarkSection = true;
      continue;
    }
    
    // Exit remark section when we hit actual account header
    if (inRemarkSection && /^[A-Z\s&\/]+\s+\d+\*+$/.test(line)) {
      inRemarkSection = false;
    }
    
    // Skip lines in remark section (but not if we're in accounts section)
    if (inRemarkSection && currentSection !== 'accounts') continue;
    
    // Detect sections
    if (line.includes('Personal Information')) {
      currentSection = 'personal';
      continue;
    }
    if (line.includes(' Accounts') || line === 'Accounts') {
      currentSection = 'accounts';
      continue;
    }
    if (line.includes('Inquiries')) {
      currentSection = 'inquiries';
      // Save any pending account
      if (currentAccount) {
        result.accounts.push(currentAccount);
        currentAccount = null;
      }
      continue;
    }
    if (line.includes('Public Records')) {
      currentSection = 'publicRecords';
      continue;
    }
    
    // Parse personal information
    if (currentSection === 'personal') {
      if (line.startsWith('Name') && lines[i + 1]) {
        result.personalInfo.name = lines[i + 1].trim();
      } else if (line.startsWith('Social Security Number') && lines[i + 1]) {
        result.personalInfo.ssn = lines[i + 1].trim();
      } else if (line.startsWith('Date of Birth') && lines[i + 1]) {
        result.personalInfo.dateOfBirth = lines[i + 1].trim();
      } else if (line.startsWith('Phone Number') && lines[i + 1]) {
        result.personalInfo.phoneNumbers.push(lines[i + 1].trim());
      }
    }
    
    // Parse accounts - look for account name with account number pattern
    if (currentSection === 'accounts') {
      // Pattern: "CREDITOR NAME 1234****" - account number has asterisks at end
      const accountHeaderMatch = line.match(/^([A-Z\s&\/]+?)\s+(\d+\*+)$/);
      
      if (accountHeaderMatch && lines[i + 1]?.trim() === 'Account Information') {
        // Save previous account if exists
        if (currentAccount) {
          result.accounts.push(currentAccount);
        }
        
        // Start new account
        const accountName = accountHeaderMatch[1].trim();
        const accountNumber = accountHeaderMatch[2]?.trim();
        
        currentAccount = {
          accountName,
          accountNumber,
          isNegative: false,
          remarks: [],
          paymentHistory: [],
        };
        
        // Parse account details
        for (let j = i + 2; j < lines.length && j < i + 100; j++) {
          const detailLine = lines[j].trim();
          
          // Stop at next account
          if (detailLine.match(/^[A-Z\s&]+\d{4,}/) && lines[j + 1]?.includes('Account Information')) {
            break;
          }
          
          // Extract key fields
          if (detailLine.startsWith('Account Type') && lines[j + 1]) {
            currentAccount.accountType = lines[j + 1].trim();
          } else if (detailLine.startsWith('Loan Type') && lines[j + 1]) {
            currentAccount.loanType = lines[j + 1].trim();
          } else if (detailLine.startsWith('Balance') && lines[j + 1]) {
            currentAccount.balance = lines[j + 1].replace('$', '').replace(',', '').trim();
          } else if (detailLine.startsWith('Credit Limit') && lines[j + 1]) {
            currentAccount.creditLimit = lines[j + 1].replace('$', '').replace(',', '').trim();
          } else if (detailLine.startsWith('Date Opened') && lines[j + 1]) {
            currentAccount.dateOpened = lines[j + 1].trim();
          } else if (detailLine.startsWith('Date Updated') && lines[j + 1]) {
            currentAccount.dateUpdated = lines[j + 1].trim();
          } else if (detailLine.startsWith('Pay Status') && lines[j + 1]) {
            currentAccount.paymentStatus = lines[j + 1].trim();
          } else if (detailLine.startsWith('Monthly Payment') && lines[j + 1]) {
            currentAccount.monthlyPayment = lines[j + 1].replace('$', '').replace(',', '').trim();
          }
          
          // Check for negative indicators in remarks
          if (detailLine.includes('>') && detailLine.includes('<')) {
            currentAccount.isNegative = true;
            currentAccount.remarks?.push(detailLine);
          }
          
          // Parse payment history if present
          if (detailLine.includes('Payment History') || detailLine.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/)) {
            currentAccount.paymentHistory = parsePaymentHistory(lines, j);
            
            // Check if payment history contains late payments
            if (hasNegativeHistory(currentAccount.paymentHistory)) {
              currentAccount.isNegative = true;
            }
          }
        }
      }
    }
    
    // Parse inquiries
    if (currentSection === 'inquiries') {
      // Look for creditor names followed by dates
      if (line.match(/^\d{2}\/\d{2}\/\d{4}/) && i > 0) {
        const creditorName = lines[i - 1].trim();
        if (creditorName && !isPageMetadata(creditorName)) {
          result.inquiries.push({
            creditorName,
            inquiryDate: line,
            inquiryType: 'hard', // Default to hard inquiry
          });
        }
      }
    }
  }
  
  // Save last account if exists
  if (currentAccount) {
    result.accounts.push(currentAccount);
  }
  
  return result;
}
