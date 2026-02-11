import * as db from "./db";
import { 
  sendPaymentReminder, 
  sendDisputeDeadlineReminder, 
  sendBureauResponseNotification,
  sendUtilizationAlert 
} from "./emailService";
import { calculateOptimalPaymentDate } from "./bureauSimulator";

/**
 * Scheduled notification jobs for CreditKazzam
 * These functions should be called by a cron job or scheduler
 */

/**
 * Check all live accounts and send payment reminders
 * Run daily to check for upcoming optimal payment dates
 */
export async function checkPaymentReminders() {
  console.log("[NotificationJobs] Checking payment reminders...");
  
  try {
    // Get all live accounts
    const allAccounts = await getAllLiveAccounts();
    
    for (const account of allAccounts) {
      // Only process credit cards with statement dates
      if (account.accountType !== "credit_card" || !account.statementDate) {
        continue;
      }
      
      // Get user's notification preferences
      const prefs = await db.getNotificationPreferences(account.userId);
      if (!prefs || !prefs.paymentReminders) {
        continue;
      }
      
      // Calculate optimal payment date
      // Convert statement date (day of month) to actual date
      const today = new Date();
      const statementDay = account.statementDate || 1;
      const statementDate = new Date(today.getFullYear(), today.getMonth(), statementDay);
      if (statementDate < today) {
        statementDate.setMonth(statementDate.getMonth() + 1);
      }
      
      const dueDay = account.paymentDueDate || statementDay + 25;
      const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
      if (dueDate < statementDate) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      
      const paymentInfo = calculateOptimalPaymentDate(
        account.accountName,
        statementDate,
        dueDate,
        parseFloat(account.currentBalance || "0"),
        parseFloat(account.creditLimit || "0")
      );
      
      // Check if we should send reminder
      const optimalDate = paymentInfo.optimalPaymentDate;
      const daysUntil = Math.ceil((optimalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Send reminder if within the user's preferred reminder window
      if (daysUntil > 0 && daysUntil <= prefs.paymentReminderDays) {
        const currentUtilization = account.creditLimit && parseFloat(account.creditLimit) > 0
          ? (parseFloat(account.currentBalance || "0") / parseFloat(account.creditLimit)) * 100
          : 0;
        
        const utilizationAfterPayment = 0; // Assuming full payment
        
        await sendPaymentReminder(account.userId, account.id, {
          accountName: account.accountName,
          optimalDate: paymentInfo.optimalPaymentDate.toLocaleDateString(),
          daysUntil,
          currentUtilization: paymentInfo.utilizationImpact.current,
          utilizationAfterPayment: paymentInfo.utilizationImpact.afterPayment
        });
        
        console.log(`[NotificationJobs] Sent payment reminder for ${account.accountName} to user ${account.userId}`);
      }
    }
    
    console.log("[NotificationJobs] Payment reminder check complete");
  } catch (error) {
    console.error("[NotificationJobs] Error checking payment reminders:", error);
  }
}

/**
 * Check all disputes and send deadline reminders
 * Run daily to check for approaching 30-day deadlines
 */
export async function checkDisputeDeadlines() {
  console.log("[NotificationJobs] Checking dispute deadlines...");
  
  try {
    // Get all active disputes
    const allDisputes = await getAllDisputes();
    
    for (const dispute of allDisputes) {
      // Only process sent or in_progress disputes
      if (dispute.status !== "sent" && dispute.status !== "in_progress") {
        continue;
      }
      
      // Get user's notification preferences
      const prefs = await db.getNotificationPreferences(dispute.userId);
      if (!prefs || !prefs.disputeDeadlines) {
        continue;
      }
      
      // Calculate days remaining (30 days from filing)
      const filedDate = new Date(dispute.dateSent || dispute.createdAt);
      const deadlineDate = new Date(filedDate);
      deadlineDate.setDate(deadlineDate.getDate() + 30);
      
      const today = new Date();
      const daysRemaining = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Send reminder at key milestones: 7 days, 3 days, 1 day, 0 days (deadline)
      if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1 || daysRemaining === 0) {
        // Determine which bureau this dispute is for
        const bureaus = [dispute.bureau.charAt(0).toUpperCase() + dispute.bureau.slice(1)];
        
        await sendDisputeDeadlineReminder(dispute.userId, dispute.id, {
          disputeId: dispute.id,
          itemDescription: dispute.disputeReason.substring(0, 100) || "Disputed item",
          bureaus,
          filedDate: filedDate.toLocaleDateString(),
          daysRemaining: Math.max(0, daysRemaining)
        });
        
        console.log(`[NotificationJobs] Sent dispute deadline reminder for dispute ${dispute.id} to user ${dispute.userId}`);
      }
    }
    
    console.log("[NotificationJobs] Dispute deadline check complete");
  } catch (error) {
    console.error("[NotificationJobs] Error checking dispute deadlines:", error);
  }
}

/**
 * Check for bureau responses on disputes
 * Run daily to check if any disputes have been updated
 */
export async function checkBureauResponses() {
  console.log("[NotificationJobs] Checking bureau responses...");
  
  try {
    // Get all disputes that might have responses
    const allDisputes = await getAllDisputes();
    
    for (const dispute of allDisputes) {
      // Get user's notification preferences
      const prefs = await db.getNotificationPreferences(dispute.userId);
      if (!prefs || !prefs.bureauResponses) {
        continue;
      }
      
      // Check if dispute status changed to resolved or rejected
      if (dispute.status === "resolved" || dispute.status === "rejected") {
        const bureauName = dispute.bureau.charAt(0).toUpperCase() + dispute.bureau.slice(1);
        
        await sendBureauResponseNotification(dispute.userId, dispute.id, {
          disputeId: dispute.id,
          bureau: bureauName,
          itemDescription: dispute.disputeReason.substring(0, 100) || "Disputed item",
          responseReceived: true
        });
        
        console.log(`[NotificationJobs] Sent bureau response notification for ${bureauName} to user ${dispute.userId}`);
      }
    }
    
    console.log("[NotificationJobs] Bureau response check complete");
  } catch (error) {
    console.error("[NotificationJobs] Error checking bureau responses:", error);
  }
}

/**
 * Check for high utilization alerts
 * Run daily to alert users when utilization exceeds their threshold
 */
export async function checkUtilizationAlerts() {
  console.log("[NotificationJobs] Checking utilization alerts...");
  
  try {
    // Get all live accounts
    const allAccounts = await getAllLiveAccounts();
    
    for (const account of allAccounts) {
      // Only process credit cards
      if (account.accountType !== "credit_card") {
        continue;
      }
      
      // Get user's notification preferences
      const prefs = await db.getNotificationPreferences(account.userId);
      if (!prefs || !prefs.utilizationAlerts) {
        continue;
      }
      
      // Calculate utilization
      const balance = parseFloat(account.currentBalance || "0");
      const creditLimit = parseFloat(account.creditLimit || "0");
      
      if (creditLimit === 0) continue;
      
      const utilization = (balance / creditLimit) * 100;
      
      // Send alert if utilization exceeds threshold
      if (utilization > prefs.utilizationThreshold) {
        await sendUtilizationAlert(account.userId, account.id, {
          accountName: account.accountName,
          currentUtilization: utilization,
          threshold: prefs.utilizationThreshold,
          balance,
          creditLimit
        });
        
        console.log(`[NotificationJobs] Sent utilization alert for ${account.accountName} to user ${account.userId}`);
      }
    }
    
    console.log("[NotificationJobs] Utilization alert check complete");
  } catch (error) {
    console.error("[NotificationJobs] Error checking utilization alerts:", error);
  }
}

/**
 * Run all notification checks
 * This is the main function to call from a cron job
 */
export async function runAllNotificationChecks() {
  console.log("[NotificationJobs] Running all notification checks...");
  
  await checkPaymentReminders();
  await checkDisputeDeadlines();
  await checkBureauResponses();
  await checkUtilizationAlerts();
  
  console.log("[NotificationJobs] All notification checks complete");
}

// Helper function to add to db.ts
async function getAllLiveAccounts() {
  const dbInstance = await db.getDb();
  if (!dbInstance) return [];
  
  const { liveAccounts } = await import("../drizzle/schema");
  return await dbInstance.select().from(liveAccounts);
}

async function getAllDisputes() {
  const dbInstance = await db.getDb();
  if (!dbInstance) return [];
  
  const { disputes } = await import("../drizzle/schema");
  return await dbInstance.select().from(disputes);
}
