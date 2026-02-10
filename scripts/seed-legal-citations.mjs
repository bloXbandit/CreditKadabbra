import { drizzle } from "drizzle-orm/mysql2";
import { legalCitations, disputeLetterTemplates, alternativeBureaus } from "../drizzle/schema.js";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

// Legal Citations Data
const citations = [
  // Federal FCRA Citations
  {
    citationType: "federal",
    statute: "15 USC § 1681i(a)(1)(A)",
    title: "Consumer's Right to Dispute Inaccurate Information",
    description: "Consumers have the right to dispute the completeness or accuracy of any item of information contained in a consumer's file at a consumer reporting agency.",
    fullText: "If the completeness or accuracy of any item of information contained in a consumer's file at a consumer reporting agency is disputed by the consumer and the consumer notifies the agency directly, or indirectly through a reseller, of such dispute, the agency shall, free of charge, conduct a reasonable reinvestigation to determine whether the disputed information is inaccurate and record the current status of the disputed information, or delete the item from the file.",
    applicableState: null,
    errorCategory: "all",
  },
  {
    citationType: "federal",
    statute: "15 USC § 1681i(a)(5)(A)",
    title: "30-Day Investigation Deadline",
    description: "Credit reporting agencies must complete investigations within 30 days of receiving a dispute.",
    fullText: "A consumer reporting agency shall complete all investigations, review, and recording required under paragraph (1) regarding information provided by a consumer within 30 days of the date on which the consumer reporting agency receives notice of the dispute from the consumer.",
    applicableState: null,
    errorCategory: "all",
  },
  {
    citationType: "federal",
    statute: "15 USC § 1681i(a)(5)(B)",
    title: "Deletion of Unverifiable Information",
    description: "If information cannot be verified within the investigation period, it must be promptly deleted.",
    fullText: "If the consumer reporting agency determines that the information is inaccurate, incomplete, or cannot be verified after any reinvestigation under paragraph (1), the consumer reporting agency shall promptly delete that item of information from the consumer's file or modify that item of information, as appropriate, based on the results of the reinvestigation.",
    applicableState: null,
    errorCategory: "unverifiable",
  },
  {
    citationType: "federal",
    statute: "15 USC § 1681c(a)(4)",
    title: "7-Year Reporting Limit for Negative Information",
    description: "Most negative information must be removed after 7 years from the date of first delinquency.",
    fullText: "Accounts placed for collection or charged to profit and loss which antedate the report by more than seven years shall not be reported.",
    applicableState: null,
    errorCategory: "statute_of_limitations",
  },
  {
    citationType: "federal",
    statute: "15 USC § 1681c(a)(1)",
    title: "10-Year Limit for Bankruptcies",
    description: "Bankruptcy information must be removed after 10 years from the date of entry of the order for relief or the date of adjudication.",
    fullText: "Cases under title 11 [United States Code] or under the Bankruptcy Act that, from the date of entry of the order for relief or the date of adjudication, as the case may be, antedate the report by more than 10 years.",
    applicableState: null,
    errorCategory: "statute_of_limitations",
  },
  {
    citationType: "federal",
    statute: "15 USC § 1681s-2(a)(1)(A)",
    title: "Furnisher Duty to Provide Accurate Information",
    description: "Data furnishers must provide accurate information to credit reporting agencies.",
    fullText: "A person shall not furnish any information relating to a consumer to any consumer reporting agency if the person knows or has reasonable cause to believe that the information is inaccurate.",
    applicableState: null,
    errorCategory: "incorrect_balance",
  },
  {
    citationType: "federal",
    statute: "15 USC § 1681s-2(b)(1)",
    title: "Furnisher Duty to Investigate Disputes",
    description: "When notified of a dispute by a CRA, furnishers must investigate and report results.",
    fullText: "After receiving notice pursuant to section 1681i(a)(2) of this title of a dispute with regard to the completeness or accuracy of any information provided by a person to a consumer reporting agency, the person shall conduct an investigation with respect to the disputed information.",
    applicableState: null,
    errorCategory: "all",
  },
  {
    citationType: "federal",
    statute: "15 USC § 1681c-2",
    title: "Block of Information Resulting from Identity Theft",
    description: "Consumers can block fraudulent information resulting from identity theft.",
    fullText: "A consumer reporting agency shall block the reporting of any information in the file of a consumer that the consumer identifies as information that resulted from an alleged identity theft, not later than 4 business days after the date of receipt by such agency.",
    applicableState: null,
    errorCategory: "identity_error",
  },
  {
    citationType: "federal",
    statute: "15 USC § 1681g(a)(1)",
    title: "Right to Obtain All Disclosures",
    description: "Consumers have the right to obtain all information in their consumer file.",
    fullText: "Every consumer reporting agency shall, upon request, and subject to 1681h(a)(1) of this title, clearly and accurately disclose to the consumer all information in the consumer's file at the time of the request.",
    applicableState: null,
    errorCategory: "all",
  },
  {
    citationType: "federal",
    statute: "15 USC § 1681b(c)(1)(B)",
    title: "Permissible Purpose for Hard Inquiries",
    description: "Credit inquiries must have a permissible purpose; unauthorized inquiries violate FCRA.",
    fullText: "A consumer reporting agency may furnish a consumer report only if the agency has reason to believe that the consumer report will be used for a permissible purpose.",
    applicableState: null,
    errorCategory: "unauthorized_inquiry",
  },

  // Maryland-Specific Citations
  {
    citationType: "state",
    statute: "MD Commercial Law § 14-1203(b)",
    title: "Maryland 60-Day Furnisher Information Request",
    description: "Maryland consumers can request contact information for furnishers within 60 days of dispute.",
    fullText: "Within 60 days after receiving a written request from a consumer who has disputed the completeness or accuracy of information in the consumer's file, a consumer reporting agency shall provide the consumer with the name, address, and, if reasonably available, the telephone number of each person who furnished the information.",
    applicableState: "MD",
    errorCategory: "all",
  },
  {
    citationType: "state",
    statute: "MD Commercial Law § 14-1204",
    title: "Maryland Prohibition on Fees for Disputes",
    description: "Maryland law prohibits charging fees for dispute handling or security freezes.",
    fullText: "A consumer reporting agency may not charge a fee for placing, lifting, or removing a security freeze.",
    applicableState: "MD",
    errorCategory: "all",
  },
  {
    citationType: "state",
    statute: "MD Commercial Law § 14-1212.1",
    title: "Maryland Free Security Freeze",
    description: "Maryland consumers are entitled to free security freezes on their credit reports.",
    fullText: "A consumer reporting agency shall place a security freeze on a consumer's credit report at no charge to the consumer.",
    applicableState: "MD",
    errorCategory: "all",
  },

  // Metro 2 Format Violations
  {
    citationType: "regulation",
    statute: "Metro 2 Format § Account Status",
    title: "Incorrect Account Status Code",
    description: "Account status codes (11-97) must accurately reflect the current status. Misclassification violates reporting standards.",
    fullText: "Account Status codes range from 11 (current account, paid as agreed) to 97 (unpaid balance reported as a loss by credit grantor). Using incorrect codes (e.g., marking a current account as 71-78 for late payments) constitutes a Metro 2 violation.",
    applicableState: null,
    errorCategory: "metro2_violation",
  },
  {
    citationType: "regulation",
    statute: "Metro 2 Format § Payment Rating",
    title: "Incorrect Payment Rating Code",
    description: "Payment rating codes (01-07) must match actual payment history. Errors must be corrected.",
    fullText: "Payment Rating codes indicate payment timeliness: 01 (current), 02 (30 days late), 03 (60 days late), 04 (90 days late), 05 (120+ days late), 07 (making regular payments under wage earner or similar plan). Incorrect ratings violate Metro 2 standards.",
    applicableState: null,
    errorCategory: "incorrect_payment_history",
  },
  {
    citationType: "regulation",
    statute: "Metro 2 Format § Compliance Condition Code",
    title: "Missing Compliance Condition Code",
    description: "Accounts under forbearance, disaster relief, or payment plans must include appropriate compliance codes.",
    fullText: "Compliance Condition Codes (e.g., AA for disaster relief, AB for forbearance, AC for payment plan) must be reported when applicable. Failure to include these codes when consumer is in a qualifying program violates Metro 2 requirements.",
    applicableState: null,
    errorCategory: "metro2_violation",
  },
  {
    citationType: "regulation",
    statute: "Metro 2 Format § Account Type",
    title: "Incorrect Account Type Classification",
    description: "Account types (revolving, installment, mortgage, etc.) must be correctly classified for accurate credit scoring.",
    fullText: "Account Type codes include: 00 (auto), 01 (unsecured), 02 (secured), 05 (mortgage), 12 (education), 18 (charge account), 26 (lease), etc. Misclassification affects credit mix calculations and violates Metro 2 standards.",
    applicableState: null,
    errorCategory: "metro2_violation",
  },
];

// Dispute Letter Templates
const templates = [
  {
    templateName: "Statute of Limitations Violation",
    errorType: "statute_of_limitations",
    bureauType: "both",
    templateContent: `[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Bureau Name]
[Bureau Address]

Re: Dispute of Obsolete Information - [Account Name]

Dear Sir or Madam:

I am writing to dispute the following information in my credit file, which violates the Fair Credit Reporting Act's time limits for reporting negative information.

**Account in Dispute:**
- Creditor: {{accountName}}
- Account Number: {{accountNumber}}
- Date of First Delinquency: {{firstDelinquencyDate}}

**Legal Basis for Removal:**

Pursuant to 15 USC § 1681c(a)(4), accounts placed for collection or charged to profit and loss must be removed after seven (7) years from the date of first delinquency. The above account has exceeded this statutory limit and must be promptly deleted from my credit file.

**Calculation:**
- Date of First Delinquency: {{firstDelinquencyDate}}
- Seven-Year Expiration Date: {{expirationDate}}
- Current Date: {{currentDate}}
- Days Past Expiration: {{daysOverdue}}

This account is reporting in violation of federal law and must be immediately removed.

**Requested Action:**

I request that you:
1. Immediately delete this obsolete information from my credit file
2. Provide written confirmation of deletion
3. Notify all parties who received my credit report in the past 6 months of this deletion

I expect this matter to be resolved within 30 days as required by 15 USC § 1681i(a)(5)(A).

Sincerely,

[Your Signature]
[Your Name]`,
    legalCitations: JSON.stringify(["15 USC § 1681c(a)(4)", "15 USC § 1681i(a)(5)(A)"]),
    description: "Template for disputing accounts that exceed the 7-year reporting limit",
  },
  {
    templateName: "Unverifiable Information",
    errorType: "unverifiable",
    bureauType: "both",
    templateContent: `[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Bureau Name]
[Bureau Address]

Re: Dispute of Unverifiable Information - [Account/Item]

Dear Sir or Madam:

I am writing to dispute the following information in my credit file, which I believe cannot be verified as accurate.

**Item in Dispute:**
- Type: {{itemType}}
- Creditor/Source: {{creditorName}}
- Account Number (if applicable): {{accountNumber}}
- Reason for Dispute: {{disputeReason}}

**Legal Basis for Removal:**

Pursuant to 15 USC § 1681i(a)(5)(B), if information cannot be verified after reinvestigation, it must be promptly deleted from my credit file. I have reason to believe this information cannot be verified because:

{{verificationConcerns}}

**Method of Verification Request:**

Pursuant to 15 USC § 1681i(a)(7), I request that you provide me with a description of the procedure used to determine the accuracy and completeness of the information, including:
1. The business name and address of the furnisher
2. The specific documents or evidence reviewed
3. The method used to verify this information

**Requested Action:**

I request that you:
1. Conduct a reasonable reinvestigation of this disputed information
2. If the information cannot be verified, promptly delete it from my file
3. Provide me with written results of your investigation
4. Provide the method of verification used

I expect this investigation to be completed within 30 days as required by 15 USC § 1681i(a)(5)(A).

Sincerely,

[Your Signature]
[Your Name]`,
    legalCitations: JSON.stringify(["15 USC § 1681i(a)(5)(B)", "15 USC § 1681i(a)(7)", "15 USC § 1681i(a)(5)(A)"]),
    description: "Template for disputing information that cannot be verified",
  },
  {
    templateName: "Incorrect Balance or Payment History",
    errorType: "incorrect_balance",
    bureauType: "both",
    templateContent: `[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Bureau Name]
[Bureau Address]

Re: Dispute of Inaccurate Account Information - [Account Name]

Dear Sir or Madam:

I am writing to dispute inaccurate information being reported by {{creditorName}} on my credit file.

**Account in Dispute:**
- Creditor: {{creditorName}}
- Account Number: {{accountNumber}}
- Inaccurate Information: {{inaccuracyDescription}}

**Correct Information:**
- Reported Balance: $\{\{reportedBalance\}\}
- Actual Balance: $\{\{actualBalance\}\}
- Discrepancy: $\{\{discrepancy\}\}

**Legal Basis for Correction:**

Pursuant to 15 USC § 1681s-2(a)(1)(A), furnishers are prohibited from providing information to credit reporting agencies that they know or have reasonable cause to believe is inaccurate. The information being reported is demonstrably false.

Additionally, 15 USC § 1681i(a)(1)(A) grants me the right to dispute inaccurate information, and 15 USC § 1681i(a)(5)(B) requires that inaccurate information be promptly corrected or deleted.

**Supporting Documentation:**

I have enclosed the following documentation proving the inaccuracy:
{{supportingDocuments}}

**Requested Action:**

I request that you:
1. Immediately investigate this inaccurate information
2. Correct the balance/payment history to reflect accurate information
3. If the furnisher cannot verify the correct information, delete the entire account
4. Provide written confirmation of the correction or deletion

I expect this matter to be resolved within 30 days as required by 15 USC § 1681i(a)(5)(A).

{{#if isMarylandResident}}
Additionally, pursuant to MD Commercial Law § 14-1203(b), I request the name, address, and telephone number of {{creditorName}} so I may pursue this matter directly with the furnisher.
{{/if}}

Sincerely,

[Your Signature]
[Your Name]

Enclosures: {{enclosuresList}}`,
    legalCitations: JSON.stringify(["15 USC § 1681s-2(a)(1)(A)", "15 USC § 1681i(a)(1)(A)", "15 USC § 1681i(a)(5)(B)", "MD Commercial Law § 14-1203(b)"]),
    description: "Template for disputing incorrect balances or payment history",
  },
  {
    templateName: "Metro 2 Format Violation",
    errorType: "metro2_violation",
    bureauType: "major",
    templateContent: `[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Bureau Name]
[Bureau Address]

Re: Dispute of Metro 2 Format Violation - [Account Name]

Dear Sir or Madam:

I am writing to dispute a Metro 2 format violation in the reporting of the following account:

**Account in Dispute:**
- Creditor: {{creditorName}}
- Account Number: {{accountNumber}}
- Metro 2 Violation: {{violationType}}

**Specific Violation:**

{{violationDescription}}

**Correct Metro 2 Coding:**
- Reported Code: {{reportedCode}}
- Correct Code: {{correctCode}}
- Impact: {{impactDescription}}

**Legal Basis for Correction:**

The Metro 2 Format is the industry-standard format for reporting consumer credit information to credit bureaus. Violations of Metro 2 standards constitute inaccurate reporting under 15 USC § 1681s-2(a)(1)(A), which prohibits furnishers from providing information they know or should know is inaccurate.

Additionally, 15 USC § 1681i(a)(5)(B) requires that inaccurate information be promptly corrected or deleted following investigation.

**Requested Action:**

I request that you:
1. Immediately investigate this Metro 2 format violation
2. Require the furnisher to correct the account coding to comply with Metro 2 standards
3. If the furnisher cannot provide accurate Metro 2 compliant reporting, delete the account
4. Provide written confirmation of the correction or deletion

I expect this matter to be resolved within 30 days as required by 15 USC § 1681i(a)(5)(A).

Sincerely,

[Your Signature]
[Your Name]`,
    legalCitations: JSON.stringify(["Metro 2 Format Standards", "15 USC § 1681s-2(a)(1)(A)", "15 USC § 1681i(a)(5)(B)", "15 USC § 1681i(a)(5)(A)"]),
    description: "Template for disputing Metro 2 format violations",
  },
  {
    templateName: "Unauthorized Hard Inquiry",
    errorType: "unauthorized_inquiry",
    bureauType: "both",
    templateContent: `[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Bureau Name]
[Bureau Address]

Re: Dispute of Unauthorized Hard Inquiry

Dear Sir or Madam:

I am writing to dispute the following unauthorized hard inquiry on my credit report:

**Inquiry in Dispute:**
- Creditor/Company: {{creditorName}}
- Date of Inquiry: {{inquiryDate}}
- Reason for Dispute: {{disputeReason}}

**Legal Basis for Removal:**

Pursuant to 15 USC § 1681b(c)(1)(B), credit reporting agencies may only furnish consumer reports for permissible purposes. I did not authorize this inquiry, nor did I apply for credit with {{creditorName}}.

This unauthorized inquiry violates my rights under the Fair Credit Reporting Act and must be removed immediately.

**Requested Action:**

I request that you:
1. Immediately investigate this unauthorized inquiry
2. Contact {{creditorName}} to verify that I authorized this credit pull
3. If authorization cannot be verified, immediately delete this inquiry
4. Provide written confirmation of deletion

Hard inquiries remain on credit reports for 2 years and negatively impact credit scores. Unauthorized inquiries must be removed promptly.

I expect this matter to be resolved within 30 days as required by 15 USC § 1681i(a)(5)(A).

Sincerely,

[Your Signature]
[Your Name]`,
    legalCitations: JSON.stringify(["15 USC § 1681b(c)(1)(B)", "15 USC § 1681i(a)(5)(A)"]),
    description: "Template for disputing unauthorized hard inquiries",
  },
  {
    templateName: "Duplicate Account",
    errorType: "duplicate_account",
    bureauType: "both",
    templateContent: `[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[Bureau Name]
[Bureau Address]

Re: Dispute of Duplicate Account Reporting

Dear Sir or Madam:

I am writing to dispute duplicate reporting of the same account on my credit file.

**Duplicate Accounts:**
- Original Account: {{originalAccountName}} (Account #{{originalAccountNumber}})
- Duplicate Account: {{duplicateAccountName}} (Account #{{duplicateAccountNumber}})

**Evidence of Duplication:**

These accounts represent the same debt being reported multiple times:
{{duplicationEvidence}}

**Legal Basis for Removal:**

Duplicate reporting artificially inflates my debt-to-income ratio and credit utilization, resulting in inaccurate credit scoring. This violates 15 USC § 1681s-2(a)(1)(A), which prohibits furnishing inaccurate information.

Pursuant to 15 USC § 1681i(a)(5)(B), inaccurate information must be promptly deleted following investigation.

**Requested Action:**

I request that you:
1. Immediately investigate this duplicate reporting
2. Delete the duplicate account(s) from my credit file
3. Retain only the original account with accurate information
4. Provide written confirmation of deletion

I expect this matter to be resolved within 30 days as required by 15 USC § 1681i(a)(5)(A).

Sincerely,

[Your Signature]
[Your Name]`,
    legalCitations: JSON.stringify(["15 USC § 1681s-2(a)(1)(A)", "15 USC § 1681i(a)(5)(B)", "15 USC § 1681i(a)(5)(A)"]),
    description: "Template for disputing duplicate account reporting",
  },
];

// Alternative Bureaus Seed Data
const bureaus = [
  {
    name: "innovis",
    displayName: "Innovis",
    website: "https://www.innovis.com",
    phone: "1-800-540-2505",
    mailAddress: "Innovis Consumer Assistance\\nP.O. Box 1358\\nColumbus, OH 43216-1358",
    reportRequestMethod: "online, phone, mail",
    disputeMethod: "online, phone, mail",
    description: "The '4th bureau' - provides full credit history similar to Big 3, used by some lenders as alternative data source",
  },
  {
    name: "lexisnexis",
    displayName: "LexisNexis Risk Solutions",
    website: "https://consumer.risk.lexisnexis.com",
    phone: "1-888-497-0011",
    mailAddress: "LexisNexis Consumer Center\\nP.O. Box 105108\\nAtlanta, GA 30348-5108",
    reportRequestMethod: "online, phone, mail",
    disputeMethod: "phone, mail",
    description: "Insurance risk scoring, background checks, C.L.U.E. reports (claims history), used by insurance companies and employers",
  },
  {
    name: "sagestream",
    displayName: "SageStream",
    website: "https://www.sagestreamllc.com",
    phone: "1-888-395-0277",
    mailAddress: "SageStream, LLC Consumer Center\\nP.O. Box 105108\\nAtlanta, GA 30348-5108",
    reportRequestMethod: "mail",
    disputeMethod: "phone, mail",
    description: "Alternative credit data including payday loans, rent-to-own, and subprime lending",
  },
  {
    name: "chexsystems",
    displayName: "ChexSystems",
    website: "https://www.chexsystems.com",
    phone: "1-800-428-9623",
    mailAddress: "Chex Systems, Inc.\\nAttn: Consumer Relations\\n7805 Hudson Road, Suite 100\\nWoodbury, MN 55125",
    reportRequestMethod: "online, mail",
    disputeMethod: "online, mail",
    description: "Banking and checking account history - bounced checks, overdrafts, account closures, fraud incidents",
  },
  {
    name: "corelogic",
    displayName: "CoreLogic SafeRent",
    website: "https://saferentsolutions.com",
    phone: "1-877-333-2413",
    mailAddress: "SafeRent Solutions\\nAttn: Consumer Relations\\n3025 Highland Parkway, Suite 200\\nDowners Grove, IL 60515",
    reportRequestMethod: "online, mail",
    disputeMethod: "mail",
    description: "Tenant screening - rental payment history, eviction records, criminal background checks",
  },
  {
    name: "clarity",
    displayName: "Clarity Services",
    website: "https://www.clarityservices.com",
    phone: "1-866-390-3118",
    mailAddress: "Clarity Services, Inc.\\nP.O. Box 5717\\nClearwater, FL 33758",
    reportRequestMethod: "phone, mail",
    disputeMethod: "phone, mail",
    description: "Alternative financial services data - payday loans, title loans, installment loans, check cashing",
  },
];

async function seedData() {
  console.log("Seeding legal citations...");
  for (const citation of citations) {
    await db.insert(legalCitations).values(citation);
  }
  console.log(`✓ Seeded ${citations.length} legal citations`);

  console.log("Seeding dispute letter templates...");
  for (const template of templates) {
    await db.insert(disputeLetterTemplates).values(template);
  }
  console.log(`✓ Seeded ${templates.length} dispute letter templates`);

  console.log("Seeding alternative bureaus...");
  for (const bureau of bureaus) {
    await db.insert(alternativeBureaus).values(bureau);
  }
  console.log(`✓ Seeded ${bureaus.length} alternative bureaus`);

  console.log("\\n✅ All seed data inserted successfully!");
  process.exit(0);
}

seedData().catch((error) => {
  console.error("Error seeding data:", error);
  process.exit(1);
});
