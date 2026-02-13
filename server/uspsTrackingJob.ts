import { getDb } from "./db";
import { disputes } from "../drizzle/schema";
import { trackMultiplePackages } from "./uspsTracking";
import { eq, and, isNotNull, isNull } from "drizzle-orm";

/**
 * Scheduled job to check USPS tracking status for all active disputes
 * 
 * This job runs periodically to:
 * 1. Find all disputes with tracking numbers that haven't been delivered
 * 2. Check USPS tracking status for each
 * 3. Update dispute status when delivered
 * 4. Record delivery date and signature
 * 
 * Schedule: Run every 6 hours
 */
export async function checkUSPSTrackingStatus() {
  console.log('[USPS Tracking Job] Starting tracking status check...');
  
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Find all disputes with tracking numbers that aren't delivered yet
    const activeDisputes = await db
      .select()
      .from(disputes)
      .where(
        and(
          isNotNull(disputes.certifiedMailTracking),
          eq(disputes.status, 'sent')
        )
      )
      .execute();
    
    if (activeDisputes.length === 0) {
      console.log('[USPS Tracking Job] No active disputes with tracking numbers found.');
      return;
    }
    
    console.log(`[USPS Tracking Job] Checking ${activeDisputes.length} tracking numbers...`);
    
    // Extract tracking numbers
    const trackingNumbers = activeDisputes
      .map(d => d.certifiedMailTracking)
      .filter((tn): tn is string => tn !== null);
    
    if (trackingNumbers.length === 0) {
      console.log('[USPS Tracking Job] No valid tracking numbers found.');
      return;
    }
    
    // Batch track all packages
    const trackingResults = await trackMultiplePackages(trackingNumbers);
    
    // Update disputes based on tracking results
    let deliveredCount = 0;
    
    for (const result of trackingResults) {
      const dispute = activeDisputes.find(d => d.certifiedMailTracking === result.trackingNumber);
      if (!dispute) continue;
      
      // If package is delivered, update dispute
      if (result.statusCategory === 'delivered' && db) {
        await db
          .update(disputes)
          .set({
            dateSent: result.deliveryDate ? new Date(result.deliveryDate) : new Date(),
            status: 'in_progress',
            updatedAt: new Date(),
          })
          .where(eq(disputes.id, dispute.id))
          .execute();
        
        deliveredCount++;
        console.log(`[USPS Tracking Job] Dispute #${dispute.id} marked as delivered (${result.trackingNumber})`);
      } else {
        console.log(`[USPS Tracking Job] Dispute #${dispute.id} status: ${result.statusCategory} (${result.trackingNumber})`);
      }
    }
    
    console.log(`[USPS Tracking Job] Completed. ${deliveredCount} disputes updated to delivered status.`);
  } catch (error) {
    console.error('[USPS Tracking Job] Error checking tracking status:', error);
    throw error;
  }
}

/**
 * Check tracking status for a single dispute
 */
export async function checkDisputeTracking(disputeId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const [dispute] = await db
    .select()
    .from(disputes)
    .where(eq(disputes.id, disputeId))
    .execute();
  
  if (!dispute || !dispute.certifiedMailTracking) {
    throw new Error(`Dispute ${disputeId} not found or has no tracking number`);
  }
  
  const { trackUSPSPackage } = await import('./uspsTracking');
  const result = await trackUSPSPackage(dispute.certifiedMailTracking);
  
  // Update dispute if delivered
  if (result.statusCategory === 'delivered') {
    await db
      .update(disputes)
      .set({
        dateSent: result.deliveryDate ? new Date(result.deliveryDate) : new Date(),
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .where(eq(disputes.id, disputeId))
      .execute();
  }
  
  return result;
}
