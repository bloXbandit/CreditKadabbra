/**
 * Expanded Dispute Letter Templates Library
 * 10+ professional templates for common credit repair scenarios
 */

export interface LetterParams {
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
  items?: Array<{
    description: string;
    accountNumber?: string;
    creditorName?: string;
    reason?: string;
  }>;
  additionalInfo?: Record<string, any>;
}

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

function getLetterHeader(params: LetterParams): string {
  const { userInfo, bureau } = params;
  const bureauInfo = BUREAU_INFO[bureau];
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `${userInfo.name}
${userInfo.address}
${userInfo.city}, ${userInfo.state} ${userInfo.zip}

${today}

${bureauInfo.name}
${bureauInfo.address}
${bureauInfo.cityStateZip}

${userInfo.ssn ? `SSN: XXX-XX-${userInfo.ssn.slice(-4)}` : ''}
${userInfo.dateOfBirth ? `Date of Birth: ${userInfo.dateOfBirth}` : ''}
`;
}

/**
 * 1. Late Payment Removal Request
 */
export function generateLatePaymentRemoval(params: LetterParams): string {
  const header = getLetterHeader(params);
  const { items = [] } = params;

  return `${header}

RE: Request for Removal of Late Payment(s)

Dear Sir or Madam:

I am writing to request the removal of late payment notation(s) on my credit report. I have been a responsible customer and this late payment was an isolated incident that does not reflect my overall payment history.

${items.map((item, i) => `
${i + 1}. ${item.description}
   Account Number: ${item.accountNumber || 'N/A'}
   Creditor: ${item.creditorName || 'N/A'}
`).join('\n')}

I have since brought this account current and have maintained a perfect payment record. I kindly request that you consider removing this late payment notation as a gesture of goodwill, given my otherwise excellent payment history with your company.

I value my relationship with ${items[0]?.creditorName || 'your company'} and hope to continue as a customer for many years to come. Removing this late payment would greatly assist me in achieving my financial goals.

Thank you for your consideration of this request. I look forward to your positive response.

Sincerely,
${params.userInfo.name}`;
}

/**
 * 2. Collection Account Validation Request
 */
export function generateCollectionValidation(params: LetterParams): string {
  const header = getLetterHeader(params);
  const { items = [] } = params;

  return `${header}

RE: Request for Validation of Debt

Dear Sir or Madam:

This letter is a formal request for validation of the following collection account(s) appearing on my credit report:

${items.map((item, i) => `
${i + 1}. ${item.description}
   Account Number: ${item.accountNumber || 'N/A'}
   Collection Agency: ${item.creditorName || 'N/A'}
`).join('\n')}

Under the Fair Debt Collection Practices Act (FDCPA) § 809(b) and the Fair Credit Reporting Act (FCRA) § 611, I have the right to request validation of this debt. I am requesting that you provide:

1. Proof that you own or are authorized to collect this debt
2. A copy of the original signed contract or agreement
3. Complete payment history from the original creditor
4. Verification that the debt is within the statute of limitations
5. Proof that you are licensed to collect debts in my state

Until you provide proper validation, I request that you cease all collection activities and remove this item from my credit report. Under the FCRA, you must verify the accuracy of this information before continuing to report it.

Please respond within 30 days with the requested documentation.

Sincerely,
${params.userInfo.name}`;
}

/**
 * 3. Charge-Off Dispute Letter
 */
export function generateChargeOffDispute(params: LetterParams): string {
  const header = getLetterHeader(params);
  const { items = [] } = params;

  return `${header}

RE: Dispute of Charge-Off Account

Dear Sir or Madam:

I am writing to dispute the following charge-off account(s) appearing on my credit report:

${items.map((item, i) => `
${i + 1}. ${item.description}
   Account Number: ${item.accountNumber || 'N/A'}
   Original Creditor: ${item.creditorName || 'N/A'}
   Reason for Dispute: ${item.reason || 'Inaccurate reporting'}
`).join('\n')}

I dispute the accuracy and completeness of this information. Under the Fair Credit Reporting Act (FCRA) § 611, I have the right to dispute inaccurate information and request a thorough investigation.

Specifically, I dispute:
- The accuracy of the balance reported
- The date of first delinquency
- The charge-off status and date
- The reporting of this account after it has been charged off

Please conduct a complete investigation of this account and provide me with:
1. Verification of the original debt amount
2. Documentation showing how the balance was calculated
3. Proof that all reporting is accurate and complete
4. Copies of any signed agreements or contracts

If you cannot verify the complete accuracy of this information, it must be deleted from my credit report immediately under FCRA § 611(a)(5)(A).

I look forward to your response within 30 days.

Sincerely,
${params.userInfo.name}`;
}

/**
 * 4. Goodwill Adjustment Letter
 */
export function generateGoodwillLetter(params: LetterParams): string {
  const header = getLetterHeader(params);
  const { items = [], additionalInfo = {} } = params;

  return `${header}

RE: Goodwill Adjustment Request

Dear ${items[0]?.creditorName || 'Customer Service Manager'}:

I am writing to request a goodwill adjustment to my credit report regarding the following account:

Account Number: ${items[0]?.accountNumber || 'N/A'}
Account Type: ${items[0]?.description || 'N/A'}

I have been a loyal customer of ${items[0]?.creditorName || 'your company'} for ${additionalInfo.yearsAsCustomer || 'several'} years, and I have always valued our relationship. ${additionalInfo.circumstance || 'Due to unforeseen circumstances, I experienced a temporary financial hardship that resulted in late payments on this account.'}

I take full responsibility for this situation and have since taken steps to ensure it never happens again. I have:
- Brought the account current
- Maintained perfect payment history since then
- ${additionalInfo.additionalAction || 'Improved my overall financial management'}

I am writing to respectfully request that you consider removing the negative payment history from my credit report as a gesture of goodwill. This would significantly help me in ${additionalInfo.goal || 'achieving my financial goals and rebuilding my credit'}.

I understand this is an exception to your normal policies, but I hope you will consider my request given my otherwise excellent relationship with your company and my commitment to maintaining that relationship going forward.

Thank you for taking the time to consider my request. I truly appreciate your understanding and assistance.

Sincerely,
${params.userInfo.name}`;
}

/**
 * 5. Identity Theft Affidavit
 */
export function generateIdentityTheftAffidavit(params: LetterParams): string {
  const header = getLetterHeader(params);
  const { items = [] } = params;

  return `${header}

RE: Identity Theft - Fraudulent Account(s)

URGENT: IDENTITY THEFT NOTIFICATION

Dear Sir or Madam:

I am a victim of identity theft. I am writing to report fraudulent account(s) that appear on my credit report that I did not open or authorize:

${items.map((item, i) => `
${i + 1}. ${item.description}
   Account Number: ${item.accountNumber || 'N/A'}
   Creditor: ${item.creditorName || 'N/A'}
`).join('\n')}

I did NOT:
- Open or authorize these accounts
- Receive any benefit from these accounts
- Give anyone permission to use my personal information

Under the Fair Credit Reporting Act (FCRA) § 605B, information resulting from identity theft must be blocked from my credit report. I am requesting that you:

1. Block these fraudulent accounts from my credit report immediately
2. Provide me with written confirmation of the block
3. Notify the furnisher that the information is fraudulent
4. Cease all collection activities related to these accounts

I have filed a police report (Report #: ___________) and have submitted an Identity Theft Report to the Federal Trade Commission. Copies of these reports are enclosed.

Please treat this matter with the urgency it deserves. These fraudulent accounts are causing significant harm to my credit and financial well-being.

I expect a response within 4 business days as required by FCRA § 605B(c).

Sincerely,
${params.userInfo.name}`;
}

/**
 * 6. Mixed File Dispute
 */
export function generateMixedFileDispute(params: LetterParams): string {
  const header = getLetterHeader(params);
  const { items = [] } = params;

  return `${header}

RE: Mixed File - Information Belonging to Another Consumer

Dear Sir or Madam:

I am writing to dispute information on my credit report that does not belong to me. It appears my credit file has been mixed with another consumer's information:

${items.map((item, i) => `
${i + 1}. ${item.description}
   Account Number: ${item.accountNumber || 'N/A'}
   Reason: This account does not belong to me
`).join('\n')}

This is NOT my information. These accounts belong to another individual, possibly with a similar name or social security number. Under the Fair Credit Reporting Act (FCRA) § 611, you are required to maintain reasonable procedures to ensure maximum possible accuracy.

The presence of another person's information on my credit report is a serious violation of my rights under the FCRA. I request that you:

1. Immediately remove all information that does not belong to me
2. Conduct a thorough review of my entire credit file to identify any other mixed information
3. Implement procedures to prevent this from happening again
4. Provide me with a corrected credit report

I have enclosed copies of my identification documents to verify my identity and demonstrate that these accounts do not belong to me.

Please respond within 30 days with confirmation that this information has been removed from my credit report.

Sincerely,
${params.userInfo.name}`;
}

/**
 * 7. Inquiry Removal Request
 */
export function generateInquiryRemoval(params: LetterParams): string {
  const header = getLetterHeader(params);
  const { items = [] } = params;

  return `${header}

RE: Unauthorized Hard Inquiry Removal Request

Dear Sir or Madam:

I am writing to dispute unauthorized hard inquiries appearing on my credit report:

${items.map((item, i) => `
${i + 1}. ${item.creditorName || 'Unknown Company'}
   Date: ${item.description}
   Reason: I did not authorize this inquiry
`).join('\n')}

I did not authorize these credit inquiries, nor did I apply for credit with these companies. Under the Fair Credit Reporting Act (FCRA) § 604, a credit bureau may furnish a consumer report only under specific permissible purposes, and unauthorized inquiries violate this provision.

Hard inquiries can only be placed on my credit report with my written permission. Since I did not provide such permission, these inquiries must be removed immediately.

Please investigate these unauthorized inquiries and remove them from my credit report. Provide me with written confirmation once they have been deleted.

I expect a response within 30 days as required by federal law.

Sincerely,
${params.userInfo.name}`;
}

/**
 * 8. Bankruptcy Re-Aging Dispute
 */
export function generateBankruptcyReAgingDispute(params: LetterParams): string {
  const header = getLetterHeader(params);
  const { items = [], additionalInfo = {} } = params;

  return `${header}

RE: Dispute of Re-Aged Bankruptcy Account

Dear Sir or Madam:

I am writing to dispute accounts that are being improperly re-aged following my bankruptcy discharge:

${items.map((item, i) => `
${i + 1}. ${item.description}
   Account Number: ${item.accountNumber || 'N/A'}
   Issue: Account date is being updated after bankruptcy discharge
`).join('\n')}

My bankruptcy was filed on ${additionalInfo.bankruptcyFiledDate || '[DATE]'} and discharged on ${additionalInfo.bankruptcyDischargedDate || '[DATE]'}. Under the Fair Credit Reporting Act (FCRA) § 605, the date of first delinquency must not be changed, and accounts included in bankruptcy should not be re-aged.

These accounts are being reported with dates that make them appear more recent than they actually are, which:
1. Extends the time they remain on my credit report beyond the legal limit
2. Makes my credit appear worse than it should
3. Violates my rights under the FCRA

I request that you:
1. Correct the dates to reflect the actual date of first delinquency
2. Ensure these accounts will be removed from my credit report at the proper time
3. Provide me with written confirmation of these corrections

Please investigate this matter immediately and respond within 30 days.

Sincerely,
${params.userInfo.name}`;
}

/**
 * 9. Account Closure Dispute
 */
export function generateAccountClosureDispute(params: LetterParams): string {
  const header = getLetterHeader(params);
  const { items = [] } = params;

  return `${header}

RE: Dispute of Account Closure Status

Dear Sir or Madam:

I am writing to dispute the closure status of the following account(s) on my credit report:

${items.map((item, i) => `
${i + 1}. ${item.description}
   Account Number: ${item.accountNumber || 'N/A'}
   Creditor: ${item.creditorName || 'N/A'}
   Issue: ${item.reason || 'Account reported as closed by creditor'}
`).join('\n')}

The account(s) listed above are being incorrectly reported as "closed by creditor" when in fact I closed the account(s) myself. This inaccurate reporting is damaging my credit score and misrepresenting my credit management abilities.

Under the Fair Credit Reporting Act (FCRA) § 623(a)(1), furnishers must provide accurate information to credit reporting agencies. The current reporting is inaccurate and must be corrected.

I request that you:
1. Update the account status to reflect "closed by consumer"
2. Provide me with written confirmation of this correction
3. Update all three credit bureaus with the corrected information

I have enclosed documentation showing that I initiated the account closure. Please review this evidence and make the necessary corrections.

I expect a response within 30 days.

Sincerely,
${params.userInfo.name}`;
}

/**
 * 10. Credit Limit Increase Request
 */
export function generateCreditLimitIncreaseRequest(params: LetterParams): string {
  const { userInfo, items = [], additionalInfo = {} } = params;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `${userInfo.name}
${userInfo.address}
${userInfo.city}, ${userInfo.state} ${userInfo.zip}

${today}

${items[0]?.creditorName || '[CREDITOR NAME]'}
Credit Card Services
[CREDITOR ADDRESS]

RE: Credit Limit Increase Request

Dear Credit Card Services:

I am writing to request a credit limit increase on my account:

Account Number: ${items[0]?.accountNumber || 'N/A'}
Current Credit Limit: $${additionalInfo.currentLimit || '[CURRENT LIMIT]'}
Requested Credit Limit: $${additionalInfo.requestedLimit || '[REQUESTED LIMIT]'}

I have been a cardholder since ${additionalInfo.memberSince || '[DATE]'} and have consistently demonstrated responsible credit management:

- Perfect payment history with no late payments
- Regular account usage with timely payments
- Current utilization rate of ${additionalInfo.utilizationRate || 'low'}%
- ${additionalInfo.additionalPositive || 'Increased income and improved credit score'}

A credit limit increase would:
1. Lower my overall credit utilization ratio
2. Provide additional financial flexibility
3. Allow me to continue using your card for larger purchases

My current annual income is $${additionalInfo.annualIncome || '[INCOME]'}, and my credit score has improved to ${additionalInfo.creditScore || '[SCORE]'}. I believe these factors support my request for a credit limit increase.

Thank you for considering my request. I look forward to continuing our positive relationship.

Sincerely,
${userInfo.name}`;
}

/**
 * 11. Duplicate Account Removal
 */
export function generateDuplicateAccountRemoval(params: LetterParams): string {
  const header = getLetterHeader(params);
  const { items = [] } = params;

  return `${header}

RE: Removal of Duplicate Account Information

Dear Sir or Madam:

I am writing to dispute duplicate account information appearing on my credit report:

${items.map((item, i) => `
${i + 1}. ${item.description}
   Account Number: ${item.accountNumber || 'N/A'}
   Issue: This account is being reported multiple times
`).join('\n')}

The same account is being reported more than once on my credit report, which artificially inflates the number of negative items and unfairly damages my credit score. This violates the Fair Credit Reporting Act (FCRA) requirement for accurate reporting.

Under FCRA § 611, I have the right to dispute inaccurate information. Duplicate reporting is inaccurate and must be corrected.

Please investigate this matter and remove the duplicate entries from my credit report. Only one instance of each account should appear on my credit file.

I request written confirmation once the duplicate entries have been removed.

Sincerely,
${params.userInfo.name}`;
}

/**
 * 12. Outdated Information Removal
 */
export function generateOutdatedInformationRemoval(params: LetterParams): string {
  const header = getLetterHeader(params);
  const { items = [] } = params;

  return `${header}

RE: Removal of Outdated Information

Dear Sir or Madam:

I am writing to request the removal of outdated information from my credit report that has exceeded the legal reporting period:

${items.map((item, i) => `
${i + 1}. ${item.description}
   Account Number: ${item.accountNumber || 'N/A'}
   Date of First Delinquency: ${item.reason || 'More than 7 years ago'}
`).join('\n')}

Under the Fair Credit Reporting Act (FCRA) § 605(a)(4), most negative information must be removed from credit reports after 7 years from the date of first delinquency. The items listed above have exceeded this time limit and must be deleted immediately.

Continuing to report this outdated information violates federal law and unfairly damages my credit standing.

Please remove these items from my credit report immediately and provide me with written confirmation of their deletion.

I expect compliance with this request within 30 days.

Sincerely,
${params.userInfo.name}`;
}

/**
 * Export all template generators
 */
export const DISPUTE_TEMPLATES = {
  late_payment_removal: generateLatePaymentRemoval,
  collection_validation: generateCollectionValidation,
  charge_off_dispute: generateChargeOffDispute,
  goodwill_letter: generateGoodwillLetter,
  identity_theft: generateIdentityTheftAffidavit,
  mixed_file: generateMixedFileDispute,
  inquiry_removal: generateInquiryRemoval,
  bankruptcy_reaging: generateBankruptcyReAgingDispute,
  account_closure: generateAccountClosureDispute,
  credit_limit_increase: generateCreditLimitIncreaseRequest,
  duplicate_account: generateDuplicateAccountRemoval,
  outdated_information: generateOutdatedInformationRemoval,
};

export type TemplateType = keyof typeof DISPUTE_TEMPLATES;
