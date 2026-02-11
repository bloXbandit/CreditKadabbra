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
    monthlyPayment?: number;
    dateOpened?: string;
    dateClosed?: string;
    balance?: number;
    highBalance?: number;
    creditLimit?: number;
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
      balance?: string;
      pastDue?: string;
      amountPaid?: string;
      scheduledPayment?: string;
      remarks?: string;
      rating?: string;
    }>;
  }>;
  inquiries: Array<{
    creditorName: string;
    inquiryDate: string;
    inquiryType: 'hard' | 'soft';
  }>;
  publicRecords: Array<{
    recordType: string;
    filingDate?: string;
    status?: string;
    amount?: number;
    description?: string;
  }>;
  negativeItemsCount: number;
  parseDate: Date;
}

/**
 * Extract text from PDF using pdftotext utility
 */
async function extractPdfText(pdfPath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`pdftotext "${pdfPath}" -`);
    return stdout;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Parse TransUnion credit report from PDF
 */
export async function parseTransUnionReport(pdfPath: string): Promise<ParsedTransUnionReport> {
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
    negativeItemsCount: 0,
    parseDate: new Date(),
  };

  let currentSection = '';
  let currentAccount: any = null;
  let paymentHistoryMode = false;
  let paymentHistoryMonths: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;

    // Detect sections
    if (line.includes('Personal Credit Report for:')) {
      currentSection = 'personal';
      // Next line should be the name
      if (i + 1 < lines.length) {
        result.personalInfo.name = lines[i + 1].trim();
      }
      continue;
    }

    if (line === 'Addresses') {
      currentSection = 'addresses';
      continue;
    }

    if (line === 'Phone Numbers') {
      currentSection = 'phones';
      continue;
    }

    if (line === 'Employers') {
      currentSection = 'employers';
      continue;
    }

    if (line === 'Accounts' || line.includes('Accounts with Adverse Information')) {
      currentSection = 'accounts';
      currentAccount = null;
      paymentHistoryMode = false;
      continue;
    }

    // Parse personal info
    if (currentSection === 'personal') {
      if (line.startsWith('File Number:')) {
        result.personalInfo.fileNumber = line.replace('File Number:', '').trim();
      } else if (line.startsWith('Social Security Number')) {
        if (i + 1 < lines.length) {
          result.personalInfo.ssn = lines[i + 1].trim();
        }
      } else if (line.startsWith('Date of Birth')) {
        if (i + 1 < lines.length) {
          result.personalInfo.dateOfBirth = lines[i + 1].trim();
        }
      }
    }

    // Parse addresses
    if (currentSection === 'addresses') {
      if (line.startsWith('Current Address') || line.startsWith('Other Address')) {
        const addressLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        const dateReportedLine = i + 2 < lines.length && lines[i + 2].trim() === 'Date Reported' ? lines[i + 3].trim() : undefined;
        
        if (addressLine) {
          result.personalInfo.addresses.push({
            address: addressLine,
            dateReported: dateReportedLine,
          });
        }
      }
    }

    // Parse phone numbers
    if (currentSection === 'phones') {
      if (line.startsWith('Phone Number') && i + 1 < lines.length) {
        const phone = lines[i + 1].trim();
        if (phone && phone.match(/\(\d{3}\)/)) {
          result.personalInfo.phoneNumbers.push(phone);
        }
      }
    }

    // Parse employers
    if (currentSection === 'employers') {
      if (line && !line.startsWith('Date') && !line.startsWith('Occupation') && line.length > 2) {
        const employer: any = { name: line };
        
        // Check next few lines for occupation and dates
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine.startsWith('Occupation')) {
            employer.occupation = lines[j + 1]?.trim();
          } else if (nextLine.startsWith('Date Hired')) {
            employer.dateHired = lines[j + 1]?.trim();
          } else if (nextLine.startsWith('Date Verified')) {
            employer.dateVerified = lines[j + 1]?.trim();
          }
        }
        
        result.personalInfo.employers.push(employer);
      }
    }

    // Parse accounts
    if (currentSection === 'accounts') {
      // Detect new account (creditor name with account number)
      if (line.match(/^[A-Z\s&]+\s+\d{4,}/)) {
        // Save previous account
        if (currentAccount) {
          result.accounts.push(currentAccount);
          if (currentAccount.isNegative) {
            result.negativeItemsCount++;
          }
        }
        
        // Start new account
        const parts = line.split(/\s+(?=\d{4})/);
        currentAccount = {
          accountName: parts[0].trim(),
          accountNumber: parts[1]?.trim(),
          isNegative: false,
          remarks: [],
          paymentHistory: [],
        };
        paymentHistoryMode = false;
        continue;
      }

      if (currentAccount) {
        // Parse account fields
        if (line === 'Account Information') {
          // Skip header
          continue;
        } else if (line.startsWith('Address')) {
          currentAccount.address = lines[i + 1]?.trim();
        } else if (line.startsWith('Phone')) {
          currentAccount.phone = lines[i + 1]?.trim();
        } else if (line.startsWith('Monthly Payment')) {
          const payment = lines[i + 1]?.trim();
          if (payment && payment.startsWith('$')) {
            currentAccount.monthlyPayment = parseFloat(payment.replace(/[$,]/g, ''));
          }
        } else if (line.startsWith('Date Opened')) {
          currentAccount.dateOpened = lines[i + 1]?.trim();
        } else if (line.startsWith('Date Closed')) {
          currentAccount.dateClosed = lines[i + 1]?.trim();
        } else if (line.startsWith('Responsibility')) {
          currentAccount.responsibility = lines[i + 1]?.trim();
        } else if (line.startsWith('Account Type')) {
          currentAccount.accountType = lines[i + 1]?.trim();
        } else if (line.startsWith('Loan Type')) {
          currentAccount.loanType = lines[i + 1]?.trim();
        } else if (line.startsWith('Balance') && !line.includes('High Balance')) {
          const balance = lines[i + 1]?.trim();
          if (balance && balance.startsWith('$')) {
            currentAccount.balance = parseFloat(balance.replace(/[$,]/g, ''));
          }
        } else if (line.startsWith('High Balance')) {
          const highBalance = line.split('High balance of')[1]?.trim();
          if (highBalance && highBalance.startsWith('$')) {
            currentAccount.highBalance = parseFloat(highBalance.split(' ')[0].replace(/[$,]/g, ''));
          }
        } else if (line.startsWith('Date Updated')) {
          currentAccount.dateUpdated = lines[i + 1]?.trim();
        } else if (line.startsWith('Last Payment Made')) {
          currentAccount.lastPaymentDate = lines[i + 1]?.trim();
        } else if (line.startsWith('Pay Status')) {
          const status = lines[i + 1]?.trim();
          currentAccount.paymentStatus = status;
          // Check if negative (has brackets)
          if (status && status.includes('>') && status.includes('<')) {
            currentAccount.isNegative = true;
          }
        } else if (line.startsWith('Terms')) {
          currentAccount.terms = lines[i + 1]?.trim();
        } else if (line.includes('Estimated month and year this item will be removed')) {
          currentAccount.estimatedRemovalDate = lines[i + 1]?.trim();
        } else if (line === 'Payment History') {
          paymentHistoryMode = true;
          // Next line should have month headers
          if (i + 1 < lines.length) {
            const monthLine = lines[i + 1].trim();
            paymentHistoryMonths = monthLine.split(/\s{2,}/).filter(m => m.length > 0);
          }
        } else if (paymentHistoryMode && line.startsWith('Rating')) {
          // Parse rating row
          const ratingLine = lines[i + 1]?.trim();
          if (ratingLine) {
            const ratings = ratingLine.split(/\s{2,}/).filter(r => r.length > 0);
            ratings.forEach((rating, idx) => {
              if (paymentHistoryMonths[idx]) {
                const [month, year] = paymentHistoryMonths[idx].split(' ');
                currentAccount.paymentHistory.push({
                  month,
                  year,
                  rating,
                });
                // Check for negative ratings
                if (rating && rating !== 'OK' && rating !== 'N/R' && rating !== 'X' && rating !== '---') {
                  currentAccount.isNegative = true;
                }
              }
            });
          }
        }

        // Collect remarks (codes like PRL<, >, etc.)
        if (line.match(/^[A-Z]{2,4}[<>]?$/)) {
          currentAccount.remarks?.push(line);
        }
      }
    }
  }

  // Save last account
  if (currentAccount) {
    result.accounts.push(currentAccount);
    if (currentAccount.isNegative) {
      result.negativeItemsCount++;
    }
  }

  return result;
}

/**
 * Map TransUnion account type to our enum
 */
function mapAccountType(accountType?: string): 'revolving' | 'installment' | 'mortgage' | 'other' {
  if (!accountType) return 'other';
  
  const type = accountType.toLowerCase();
  if (type.includes('revolving') || type.includes('credit card')) return 'revolving';
  if (type.includes('installment')) return 'installment';
  if (type.includes('mortgage') || type.includes('real estate')) return 'mortgage';
  
  return 'other';
}
