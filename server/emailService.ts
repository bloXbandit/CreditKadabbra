import { notifyOwner } from "./_core/notification";
import * as db from "./db";
import { eq } from "drizzle-orm";

/**
 * Email notification service for CreditKazzam
 * Sends automated reminders and alerts to users
 */

interface EmailTemplate {
  subject: string;
  content: string;
}

interface PaymentReminderData {
  accountName: string;
  optimalDate: string;
  daysUntil: number;
  currentUtilization: number;
  utilizationAfterPayment: number;
}

interface DisputeDeadlineData {
  disputeId: number;
  itemDescription: string;
  bureaus: string[];
  filedDate: string;
  daysRemaining: number;
}

interface BureauResponseData {
  disputeId: number;
  bureau: string;
  itemDescription: string;
  responseReceived: boolean;
}

interface UtilizationAlertData {
  accountName: string;
  currentUtilization: number;
  threshold: number;
  balance: number;
  creditLimit: number;
}

/**
 * Generate payment reminder email template
 */
function generatePaymentReminderEmail(data: PaymentReminderData): EmailTemplate {
  const urgency = data.daysUntil <= 1 ? "URGENT: " : data.daysUntil <= 3 ? "Reminder: " : "";
  
  return {
    subject: `${urgency}Optimal Payment Date for ${data.accountName}`,
    content: `
<h2>🥄 CreditKazzam Payment Reminder</h2>

<p>Hi there! Your optimal payment window for <strong>${data.accountName}</strong> is approaching.</p>

<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
  <h3 style="margin-top: 0;">Optimal Payment Date: ${data.optimalDate}</h3>
  <p style="margin-bottom: 0;"><strong>${data.daysUntil} day${data.daysUntil !== 1 ? 's' : ''} remaining</strong></p>
</div>

<h3>Why This Date Matters</h3>
<p>Paying 4 days before your statement closing date ensures your credit card reports the <strong>lowest possible utilization</strong> to the credit bureaus. This can have an immediate positive impact on your credit scores.</p>

<h3>Impact on Your Credit</h3>
<ul>
  <li><strong>Current Utilization:</strong> ${data.currentUtilization}%</li>
  <li><strong>After Payment:</strong> ${data.utilizationAfterPayment}%</li>
  <li><strong>Improvement:</strong> ${(data.currentUtilization - data.utilizationAfterPayment).toFixed(1)}% reduction</li>
</ul>

<p style="color: #dc2626; font-weight: bold;">
  ${data.currentUtilization > 30 ? '⚠️ Your utilization is above the recommended 30% threshold. Paying this down will help your scores!' : '✅ Great job keeping utilization low!'}
</p>

<p>Keep up the great work on your credit repair journey!</p>

<p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
  - The CreditKazzam Team 🥄
</p>
    `.trim()
  };
}

/**
 * Generate dispute deadline reminder email template
 */
function generateDisputeDeadlineEmail(data: DisputeDeadlineData): EmailTemplate {
  const urgency = data.daysRemaining <= 5 ? "URGENT: " : "";
  
  return {
    subject: `${urgency}Dispute Deadline Approaching - ${data.itemDescription}`,
    content: `
<h2>🥄 CreditKazzam Dispute Deadline Alert</h2>

<p>Hi there! Your dispute deadline is approaching.</p>

<div style="background: ${data.daysRemaining <= 5 ? '#fee2e2' : '#fef3c7'}; border-left: 4px solid ${data.daysRemaining <= 5 ? '#dc2626' : '#f59e0b'}; padding: 16px; margin: 20px 0;">
  <h3 style="margin-top: 0;">Dispute Item: ${data.itemDescription}</h3>
  <p><strong>Bureaus:</strong> ${data.bureaus.join(', ')}</p>
  <p><strong>Filed Date:</strong> ${data.filedDate}</p>
  <p style="margin-bottom: 0;"><strong>${data.daysRemaining} days remaining</strong> for bureau response</p>
</div>

<h3>What This Means</h3>
<p>Under the Fair Credit Reporting Act (FCRA), credit bureaus have <strong>30 days</strong> to investigate and respond to your dispute. If they don't respond within this timeframe, the disputed item should be removed from your credit report.</p>

<h3>Next Steps</h3>
<ul>
  <li>Monitor your mailbox for bureau responses</li>
  <li>Check your online bureau accounts for updates</li>
  <li>If no response after 30 days, follow up with a demand for deletion</li>
  <li>Document all communications for your records</li>
</ul>

<p style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; margin: 20px 0;">
  <strong>💡 Pro Tip:</strong> If the bureau doesn't respond within 30 days, you have grounds to demand immediate deletion under FCRA § 611(a)(1)(A).
</p>

<p>Stay vigilant and keep fighting for accurate credit reporting!</p>

<p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
  - The CreditKazzam Team 🥄
</p>
    `.trim()
  };
}

/**
 * Generate bureau response notification email template
 */
function generateBureauResponseEmail(data: BureauResponseData): EmailTemplate {
  return {
    subject: `Bureau Response Update - ${data.bureau}`,
    content: `
<h2>🥄 CreditKazzam Bureau Update</h2>

<p>Hi there! We have an update on your dispute with <strong>${data.bureau}</strong>.</p>

<div style="background: ${data.responseReceived ? '#d1fae5' : '#fef3c7'}; border-left: 4px solid ${data.responseReceived ? '#10b981' : '#f59e0b'}; padding: 16px; margin: 20px 0;">
  <h3 style="margin-top: 0;">${data.responseReceived ? '✅ Response Received' : '⏳ Awaiting Response'}</h3>
  <p><strong>Dispute Item:</strong> ${data.itemDescription}</p>
  <p style="margin-bottom: 0;"><strong>Bureau:</strong> ${data.bureau}</p>
</div>

${data.responseReceived ? `
<h3>What to Do Next</h3>
<ul>
  <li>Review the bureau's response carefully</li>
  <li>Check if the item was deleted, updated, or verified</li>
  <li>If verified incorrectly, prepare a follow-up dispute with additional evidence</li>
  <li>Consider requesting Method of Verification (MOV) if the item was verified</li>
  <li>Update your CreditKazzam dashboard with the outcome</li>
</ul>

<p style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; margin: 20px 0;">
  <strong>💡 Pro Tip:</strong> If the bureau verified the item, you can request their Method of Verification (MOV) to see what documentation they used. Often, this reveals weaknesses in their investigation.
</p>
` : `
<h3>Still Waiting</h3>
<p>The bureau has not yet responded to your dispute. Remember, they have 30 days from the filing date to investigate and respond.</p>

<p>We'll continue monitoring and will notify you when there's an update.</p>
`}

<p>Keep pushing forward on your credit repair journey!</p>

<p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
  - The CreditKazzam Team 🥄
</p>
    `.trim()
  };
}

/**
 * Generate utilization alert email template
 */
function generateUtilizationAlertEmail(data: UtilizationAlertData): EmailTemplate {
  return {
    subject: `⚠️ High Utilization Alert - ${data.accountName}`,
    content: `
<h2>🥄 CreditKazzam Utilization Alert</h2>

<p>Hi there! We noticed that your credit utilization on <strong>${data.accountName}</strong> has exceeded your alert threshold.</p>

<div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
  <h3 style="margin-top: 0;">⚠️ Utilization Alert</h3>
  <p><strong>Current Balance:</strong> $${data.balance.toLocaleString()}</p>
  <p><strong>Credit Limit:</strong> $${data.creditLimit.toLocaleString()}</p>
  <p><strong>Current Utilization:</strong> ${data.currentUtilization}%</p>
  <p style="margin-bottom: 0;"><strong>Your Threshold:</strong> ${data.threshold}%</p>
</div>

<h3>Why This Matters</h3>
<p>Credit utilization accounts for <strong>30% of your FICO score</strong> - the second-largest factor. High utilization can significantly impact your credit scores, even if you pay on time every month.</p>

<h3>Recommended Actions</h3>
<ul>
  <li><strong>Pay down the balance</strong> before your statement closing date</li>
  <li><strong>Request a credit limit increase</strong> to lower utilization percentage</li>
  <li><strong>Spread charges across multiple cards</strong> to avoid high utilization on any single card</li>
  <li><strong>Make multiple payments per month</strong> to keep the balance low</li>
</ul>

<p style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; margin: 20px 0;">
  <strong>💡 Pro Tip:</strong> Aim to keep utilization below 10% for optimal credit scores. Under 30% is acceptable, but lower is always better!
</p>

<p>Take action now to protect your credit scores!</p>

<p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
  - The CreditKazzam Team 🥄
</p>
    `.trim()
  };
}

/**
 * Send email notification to user
 * Note: This uses the owner notification system as a fallback.
 * In production, you would integrate with a proper email service (SendGrid, AWS SES, etc.)
 */
async function sendEmail(
  userId: number,
  notificationType: "payment_reminder" | "dispute_deadline" | "bureau_response" | "score_update" | "utilization_alert",
  template: EmailTemplate,
  relatedEntityType?: string,
  relatedEntityId?: number
): Promise<boolean> {
  try {
    // Get user email
    const user = await db.getUserById(userId);

    if (!user?.email) {
      console.error(`No email found for user ${userId}`);
      return false;
    }

    // Log the notification
    await db.createNotificationLog({
      userId,
      notificationType,
      subject: template.subject,
      content: template.content,
      relatedEntityType: relatedEntityType || null,
      relatedEntityId: relatedEntityId || null,
      status: "pending"
    });

    // Send email using owner notification system as fallback
    // In production, replace this with actual email service
    const sent = await notifyOwner({
      title: `[CreditKazzam] ${template.subject}`,
      content: `To: ${user.email}\n\n${template.content}`
    });

    // Update notification log status (simplified - in production use proper update)
    // For now, just log the result
    console.log(`Email ${sent ? 'sent' : 'failed'} to ${user.email}: ${template.subject}`);

    return sent;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Send payment reminder notification
 */
export async function sendPaymentReminder(
  userId: number,
  accountId: number,
  data: PaymentReminderData
): Promise<boolean> {
  // Check if user has payment reminders enabled
  const prefs = await db.getNotificationPreferences(userId);

  if (prefs && !prefs.paymentReminders) {
    console.log(`Payment reminders disabled for user ${userId}`);
    return false;
  }

  const template = generatePaymentReminderEmail(data);
  return sendEmail(userId, "payment_reminder", template, "account", accountId);
}

/**
 * Send dispute deadline reminder notification
 */
export async function sendDisputeDeadlineReminder(
  userId: number,
  disputeId: number,
  data: DisputeDeadlineData
): Promise<boolean> {
  // Check if user has dispute deadline reminders enabled
  const prefs = await db.getNotificationPreferences(userId);

  if (prefs && !prefs.disputeDeadlines) {
    console.log(`Dispute deadline reminders disabled for user ${userId}`);
    return false;
  }

  const template = generateDisputeDeadlineEmail(data);
  return sendEmail(userId, "dispute_deadline", template, "dispute", disputeId);
}

/**
 * Send bureau response notification
 */
export async function sendBureauResponseNotification(
  userId: number,
  disputeId: number,
  data: BureauResponseData
): Promise<boolean> {
  // Check if user has bureau response notifications enabled
  const prefs = await db.getNotificationPreferences(userId);

  if (prefs && !prefs.bureauResponses) {
    console.log(`Bureau response notifications disabled for user ${userId}`);
    return false;
  }

  const template = generateBureauResponseEmail(data);
  return sendEmail(userId, "bureau_response", template, "dispute", disputeId);
}

/**
 * Send utilization alert notification
 */
export async function sendUtilizationAlert(
  userId: number,
  accountId: number,
  data: UtilizationAlertData
): Promise<boolean> {
  // Check if user has utilization alerts enabled
  const prefs = await db.getNotificationPreferences(userId);

  if (prefs && !prefs.utilizationAlerts) {
    console.log(`Utilization alerts disabled for user ${userId}`);
    return false;
  }

  const template = generateUtilizationAlertEmail(data);
  return sendEmail(userId, "utilization_alert", template, "account", accountId);
}

/**
 * Get or create notification preferences for a user
 */
export async function getOrCreateNotificationPreferences(userId: number) {
  let prefs = await db.getNotificationPreferences(userId);

  if (!prefs) {
    // Create default preferences
    prefs = await db.createNotificationPreferences({
      userId,
      paymentReminders: true,
      paymentReminderDays: 3,
      disputeDeadlines: true,
      bureauResponses: true,
      scoreUpdates: true,
      utilizationAlerts: true,
      utilizationThreshold: 30
    });
  }

  return prefs;
}
