/**
 * Dispute Letter Generator
 * 
 * Generates customized dispute letters based on negative items found in credit reports
 */

export interface DisputeLetterParams {
  userInfo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    ssn?: string;
    dateOfBirth?: string;
  };
  bureau: 'equifax' | 'experian' | 'transunion';
  items: Array<{
    type: 'account' | 'inquiry' | 'public_record' | 'personal_info';
    description: string;
    accountNumber?: string;
    creditorName?: string;
    reason: string;
  }>;
  letterType: 'inaccuracy' | 'validation' | 'goodwill' | 'identity_theft' | 'mixed_file' | 'late_payment_removal' | 'collection_validation' | 'charge_off_dispute' | 'inquiry_removal' | 'bankruptcy_reaging' | 'account_closure' | 'credit_limit_increase' | 'duplicate_account' | 'outdated_information';
}

/**
 * Bureau contact information
 */
const BUREAU_INFO = {
  equifax: {
    name: 'Equifax Information Services LLC',
    address: 'P.O. Box 740256',
    cityStateZip: 'Atlanta, GA 30374',
  },
  experian: {
    name: 'Experian',
    address: 'P.O. Box 4500',
    cityStateZip: 'Allen, TX 75013',
  },
  transunion: {
    name: 'TransUnion LLC',
    address: 'Consumer Dispute Center',
    cityStateZip: 'P.O. Box 2000, Chester, PA 19016',
  },
};

/**
 * Generate inaccuracy dispute letter
 */
function generateInaccuracyLetter(params: DisputeLetterParams): string {
  const { userInfo, bureau, items } = params;
  const bureauInfo = BUREAU_INFO[bureau];
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  let letter = `${userInfo.name}
${userInfo.address}
${userInfo.city}, ${userInfo.state} ${userInfo.zip}

${today}

${bureauInfo.name}
${bureauInfo.address}
${bureauInfo.cityStateZip}

RE: Formal Dispute of Inaccurate Information
${userInfo.ssn ? `SSN: XXX-XX-${userInfo.ssn.slice(-4)}` : ''}
${userInfo.dateOfBirth ? `Date of Birth: ${userInfo.dateOfBirth}` : ''}

Dear Sir or Madam:

I am writing to dispute inaccurate information appearing on my credit report. Under the Fair Credit Reporting Act (FCRA), I have the right to request that you investigate and correct any inaccurate or incomplete information.

After carefully reviewing my credit report, I have identified the following items that contain inaccurate information:

`;

  items.forEach((item, index) => {
    letter += `${index + 1}. ${item.description}\n`;
    if (item.accountNumber) {
      letter += `   Account Number: ${item.accountNumber}\n`;
    }
    if (item.creditorName) {
      letter += `   Creditor: ${item.creditorName}\n`;
    }
    letter += `   Reason for Dispute: ${item.reason}\n\n`;
  });

  letter += `These items are inaccurate and do not reflect my actual credit history. I am requesting that you conduct a thorough investigation of these items and remove or correct them as required by law.

Under the FCRA § 611(a)(1)(A), you are required to conduct a reasonable investigation of my dispute within 30 days of receipt of this letter. If you cannot verify the accuracy of these items, they must be deleted from my credit report immediately.

Please provide me with written confirmation of the results of your investigation and a copy of my updated credit report once the investigation is complete.

I have enclosed copies of supporting documentation that verify my claims. Please review these documents carefully during your investigation.

Thank you for your prompt attention to this matter. I look forward to receiving your response within 30 days as required by federal law.

Sincerely,

${userInfo.name}

Enclosures: Supporting Documentation`;

  return letter;
}

/**
 * Generate validation/verification dispute letter
 */
function generateValidationLetter(params: DisputeLetterParams): string {
  const { userInfo, bureau, items } = params;
  const bureauInfo = BUREAU_INFO[bureau];
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  let letter = `${userInfo.name}
${userInfo.address}
${userInfo.city}, ${userInfo.state} ${userInfo.zip}

${today}

${bureauInfo.name}
${bureauInfo.address}
${bureauInfo.cityStateZip}

RE: Request for Verification of Information
${userInfo.ssn ? `SSN: XXX-XX-${userInfo.ssn.slice(-4)}` : ''}
${userInfo.dateOfBirth ? `Date of Birth: ${userInfo.dateOfBirth}` : ''}

Dear Sir or Madam:

I am writing to request verification of the following items appearing on my credit report. Under the Fair Credit Reporting Act (FCRA) § 611, I have the right to request that you verify the accuracy and completeness of all information reported about me.

I am requesting verification of the following items:

`;

  items.forEach((item, index) => {
    letter += `${index + 1}. ${item.description}\n`;
    if (item.accountNumber) {
      letter += `   Account Number: ${item.accountNumber}\n`;
    }
    if (item.creditorName) {
      letter += `   Creditor: ${item.creditorName}\n`;
    }
    letter += `   Reason for Verification Request: ${item.reason}\n\n`;
  });

  letter += `I am requesting that you provide me with the following information for each item listed above:

1. The name and complete mailing address of the original creditor
2. Copies of all documents used to verify this information
3. The method of verification used
4. The date this information was verified
5. Proof that I was properly notified of this information being reported

If you cannot provide complete verification of these items with proper documentation, I request that they be immediately removed from my credit report as required by FCRA § 611(a)(5)(A).

Please respond to this request within 30 days as required by federal law. If I do not receive proper verification, I will assume these items cannot be verified and expect them to be deleted.

Thank you for your cooperation in this matter.

Sincerely,

${userInfo.name}`;

  return letter;
}

/**
 * Generate goodwill letter (for creditors, not bureaus)
 */
function generateGoodwillLetter(params: DisputeLetterParams): string {
  const { userInfo, items } = params;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Goodwill letters go to creditors, not bureaus
  const creditorName = items[0]?.creditorName || '[Creditor Name]';

  let letter = `${userInfo.name}
${userInfo.address}
${userInfo.city}, ${userInfo.state} ${userInfo.zip}

${today}

${creditorName}
Customer Service Department
[Creditor Address]

RE: Goodwill Adjustment Request
${items[0]?.accountNumber ? `Account Number: ${items[0].accountNumber}` : ''}

Dear ${creditorName} Customer Service:

I am writing to request a goodwill adjustment to my credit report regarding my account with your company.

I have been a customer of ${creditorName} and have greatly valued our relationship. I am writing to request your consideration in removing the following negative item(s) from my credit report:

`;

  items.forEach((item, index) => {
    letter += `${index + 1}. ${item.description}\n`;
    if (item.accountNumber) {
      letter += `   Account Number: ${item.accountNumber}\n`;
    }
    letter += `   Circumstances: ${item.reason}\n\n`;
  });

  letter += `I want to explain the circumstances that led to this situation. ${items[0]?.reason || 'I experienced unexpected financial difficulties that temporarily affected my ability to make timely payments.'}

Since that time, I have taken significant steps to improve my financial situation and have maintained a positive payment history. I have learned from this experience and am committed to maintaining responsible credit management going forward.

I am respectfully requesting that you consider making a goodwill adjustment by removing this negative information from my credit report. This adjustment would greatly help me as I continue to rebuild my credit and would allow me to better manage my financial obligations.

I understand that you are not obligated to make this adjustment, but I hope you will consider my request given my improved payment history and commitment to responsible credit use.

Thank you for taking the time to consider my request. I greatly appreciate your understanding and look forward to continuing our positive relationship.

Sincerely,

${userInfo.name}`;

  return letter;
}

/**
 * Generate identity theft dispute letter
 */
function generateIdentityTheftLetter(params: DisputeLetterParams): string {
  const { userInfo, bureau, items } = params;
  const bureauInfo = BUREAU_INFO[bureau];
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  let letter = `${userInfo.name}
${userInfo.address}
${userInfo.city}, ${userInfo.state} ${userInfo.zip}

${today}

${bureauInfo.name}
${bureauInfo.address}
${bureauInfo.cityStateZip}

RE: Identity Theft Report and Dispute
${userInfo.ssn ? `SSN: XXX-XX-${userInfo.ssn.slice(-4)}` : ''}
${userInfo.dateOfBirth ? `Date of Birth: ${userInfo.dateOfBirth}` : ''}

Dear Sir or Madam:

I am writing to report identity theft and to dispute fraudulent information appearing on my credit report. I am a victim of identity theft, and the following accounts/items were opened or reported without my knowledge or authorization:

`;

  items.forEach((item, index) => {
    letter += `${index + 1}. ${item.description}\n`;
    if (item.accountNumber) {
      letter += `   Account Number: ${item.accountNumber}\n`;
    }
    if (item.creditorName) {
      letter += `   Creditor: ${item.creditorName}\n`;
    }
    letter += `   Reason: ${item.reason}\n\n`;
  });

  letter += `I did not open these accounts, authorize these inquiries, or incur these debts. These items are the result of identity theft and fraud.

Under the Fair Credit Reporting Act (FCRA) § 605B, you are required to block information that appears on my credit report as a result of identity theft within 4 business days of receiving my request.

I have enclosed the following documents to support my identity theft claim:

1. A copy of my Identity Theft Report filed with the Federal Trade Commission (FTC)
2. A copy of the police report documenting the identity theft
3. Proof of my identity (driver's license, utility bill, etc.)
4. A completed Identity Theft Affidavit

Please immediately block these fraudulent items from my credit report and provide me with written confirmation once the block has been placed. Additionally, please provide me with a copy of my updated credit report showing that these items have been removed.

I am also requesting that you notify the furnishers of this information that it is the result of identity theft and should not be reported.

Thank you for your immediate attention to this serious matter. I expect these fraudulent items to be blocked within 4 business days as required by federal law.

Sincerely,

${userInfo.name}

Enclosures:
- Identity Theft Report (FTC)
- Police Report
- Proof of Identity
- Identity Theft Affidavit`;

  return letter;
}

/**
 * Generate mixed file dispute letter
 */
function generateMixedFileLetter(params: DisputeLetterParams): string {
  const { userInfo, bureau, items } = params;
  const bureauInfo = BUREAU_INFO[bureau];
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  let letter = `${userInfo.name}
${userInfo.address}
${userInfo.city}, ${userInfo.state} ${userInfo.zip}

${today}

${bureauInfo.name}
${bureauInfo.address}
${bureauInfo.cityStateZip}

RE: Mixed File Dispute
${userInfo.ssn ? `SSN: XXX-XX-${userInfo.ssn.slice(-4)}` : ''}
${userInfo.dateOfBirth ? `Date of Birth: ${userInfo.dateOfBirth}` : ''}

Dear Sir or Madam:

I am writing to dispute information on my credit report that does not belong to me. It appears that my credit file has been mixed with another consumer's information, resulting in inaccurate reporting.

The following items on my credit report do not belong to me and appear to belong to another individual:

`;

  items.forEach((item, index) => {
    letter += `${index + 1}. ${item.description}\n`;
    if (item.accountNumber) {
      letter += `   Account Number: ${item.accountNumber}\n`;
    }
    if (item.creditorName) {
      letter += `   Creditor: ${item.creditorName}\n`;
    }
    letter += `   Reason: ${item.reason}\n\n`;
  });

  letter += `This is a clear case of a mixed credit file. These accounts, inquiries, or public records belong to another consumer and should not appear on my credit report. This error is causing significant harm to my credit profile and my ability to obtain credit.

Under the Fair Credit Reporting Act (FCRA) § 611, you are required to conduct a reasonable investigation and correct any inaccurate information. Since these items clearly do not belong to me, they must be immediately removed from my credit file.

I have enclosed documentation proving my identity and demonstrating that these items do not belong to me. Please review this information carefully and remove all items that do not belong to me from my credit report.

Please provide me with:
1. Written confirmation that these items have been removed
2. A copy of my corrected credit report
3. Notification to any parties who received my credit report in the past 6 months that this information was inaccurate

I expect this matter to be resolved within 30 days as required by federal law. If you need any additional information to process this dispute, please contact me immediately.

Thank you for your prompt attention to correcting this serious error.

Sincerely,

${userInfo.name}

Enclosures: Proof of Identity and Supporting Documentation`;

  return letter;
}

/**
 * Main function to generate dispute letter
 */
export function generateDisputeLetter(params: DisputeLetterParams): string {
  // Import new templates
  const { DISPUTE_TEMPLATES } = require('./disputeLetterTemplates');
  
  // Handle new template types
  if (params.letterType in DISPUTE_TEMPLATES) {
    const templateFn = DISPUTE_TEMPLATES[params.letterType as keyof typeof DISPUTE_TEMPLATES];
    return templateFn({
      userInfo: params.userInfo,
      bureau: params.bureau,
      items: params.items,
    });
  }
  
  // Handle legacy types
  switch (params.letterType) {
    case 'inaccuracy':
      return generateInaccuracyLetter(params);
    case 'validation':
      return generateValidationLetter(params);
    case 'goodwill':
      return generateGoodwillLetter(params);
    case 'identity_theft':
      return generateIdentityTheftLetter(params);
    case 'mixed_file':
      return generateMixedFileLetter(params);
    default:
      throw new Error(`Unknown letter type: ${params.letterType}`);
  }
}

/**
 * Generate dispute letter from parsed report negative items
 */
export function generateDisputeLetterFromReport(
  userInfo: DisputeLetterParams['userInfo'],
  bureau: DisputeLetterParams['bureau'],
  negativeItems: Array<{
    accountName: string;
    accountNumber?: string;
    paymentStatus?: string;
    isNegative: boolean;
  }>,
  letterType: DisputeLetterParams['letterType'] = 'inaccuracy'
): string {
  const items = negativeItems
    .filter(item => item.isNegative)
    .map(item => ({
      type: 'account' as const,
      description: `${item.accountName}${item.accountNumber ? ` (Account ending in ${item.accountNumber.slice(-4)})` : ''}`,
      accountNumber: item.accountNumber,
      creditorName: item.accountName,
      reason: `The payment status reported as "${item.paymentStatus}" is inaccurate and does not reflect my actual payment history.`,
    }));

  return generateDisputeLetter({
    userInfo,
    bureau,
    items,
    letterType,
  });
}
