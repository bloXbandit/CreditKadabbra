// USPS Tracking Service - no env import needed

/**
 * USPS Tracking Service
 * 
 * This service integrates with USPS Web Tools Track & Confirm API
 * to automatically fetch delivery status for certified mail tracking numbers.
 * 
 * Setup Instructions:
 * 1. Register for USPS Web Tools at https://registration.shippingapis.com/
 * 2. Add your USPS_USER_ID to secrets via webdev_request_secrets
 * 3. The service will automatically start fetching real tracking data
 */

export interface TrackingEvent {
  eventType: string;
  eventDate: string;
  eventTime: string;
  eventCity: string;
  eventState: string;
  eventZip: string;
  eventCountry: string;
  firmName: string;
  name: string;
  authorizedAgent: string;
  eventCode: string;
  summary: string;
}

export interface TrackingResult {
  trackingNumber: string;
  status: string;
  statusCategory: string;
  statusSummary: string;
  deliveryDate?: string;
  deliveryTime?: string;
  deliveryLocation?: string;
  signedBy?: string;
  events: TrackingEvent[];
  lastUpdated: string;
}

/**
 * Parse USPS status into standardized categories
 */
function parseStatusCategory(status: string): string {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('delivered')) return 'delivered';
  if (statusLower.includes('out for delivery')) return 'out_for_delivery';
  if (statusLower.includes('in transit')) return 'in_transit';
  if (statusLower.includes('accepted') || statusLower.includes('picked up')) return 'accepted';
  if (statusLower.includes('notice left')) return 'notice_left';
  if (statusLower.includes('available for pickup')) return 'available_for_pickup';
  if (statusLower.includes('return')) return 'returned';
  if (statusLower.includes('alert') || statusLower.includes('exception')) return 'exception';
  
  return 'unknown';
}

/**
 * Track a USPS package using Web Tools API
 * 
 * @param trackingNumber - USPS tracking number (e.g., 9400111899562537866389)
 * @returns Tracking information including delivery status
 */
export async function trackUSPSPackage(trackingNumber: string): Promise<TrackingResult> {
  const uspsUserId = process.env.USPS_USER_ID;
  
  // If no API credentials, return mock data for testing
  if (!uspsUserId) {
    console.warn('USPS_USER_ID not configured. Returning mock tracking data.');
    return getMockTrackingData(trackingNumber);
  }
  
  try {
    // Build XML request for USPS Web Tools API
    const xmlRequest = `
      <TrackFieldRequest USERID="${uspsUserId}">
        <TrackID ID="${trackingNumber}"></TrackID>
      </TrackFieldRequest>
    `.trim();
    
    // Call USPS API
    const response = await fetch(
      `https://secure.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=${encodeURIComponent(xmlRequest)}`
    );
    
    const xmlText = await response.text();
    
    // Parse XML response (simplified - production would use proper XML parser)
    const result = parseUSPSXMLResponse(xmlText, trackingNumber);
    
    return result;
  } catch (error) {
    console.error('USPS tracking API error:', error);
    throw new Error(`Failed to track package ${trackingNumber}: ${error}`);
  }
}

/**
 * Parse USPS XML response into structured data
 */
function parseUSPSXMLResponse(xml: string, trackingNumber: string): TrackingResult {
  // Check for errors
  if (xml.includes('<Error>')) {
    const errorMatch = xml.match(/<Description>(.*?)<\/Description>/);
    const errorMsg = errorMatch ? errorMatch[1] : 'Unknown error';
    throw new Error(`USPS API error: ${errorMsg}`);
  }
  
  // Extract tracking info (simplified parsing - production should use xml2js or similar)
  const statusMatch = xml.match(/<Status>(.*?)<\/Status>/);
  const statusSummaryMatch = xml.match(/<StatusSummary>(.*?)<\/StatusSummary>/);
  
  const status = statusMatch ? statusMatch[1] : 'Unknown';
  const statusSummary = statusSummaryMatch ? statusSummaryMatch[1] : '';
  const statusCategory = parseStatusCategory(status);
  
  // Extract delivery info if delivered
  let deliveryDate: string | undefined;
  let deliveryTime: string | undefined;
  let signedBy: string | undefined;
  
  if (statusCategory === 'delivered') {
    const eventDateMatch = xml.match(/<EventDate>(.*?)<\/EventDate>/);
    const eventTimeMatch = xml.match(/<EventTime>(.*?)<\/EventTime>/);
    const signedByMatch = xml.match(/<Name>(.*?)<\/Name>/);
    
    deliveryDate = eventDateMatch ? eventDateMatch[1] : undefined;
    deliveryTime = eventTimeMatch ? eventTimeMatch[1] : undefined;
    signedBy = signedByMatch ? signedByMatch[1] : undefined;
  }
  
  // Extract events (simplified)
  const events: TrackingEvent[] = [];
  const eventRegex = /<TrackDetail>(.*?)<\/TrackDetail>/g;
  let eventMatch;
  
  while ((eventMatch = eventRegex.exec(xml)) !== null) {
    const eventXml = eventMatch[1];
    const eventTypeMatch = eventXml.match(/<Event>(.*?)<\/Event>/);
    const eventDateMatch = eventXml.match(/<EventDate>(.*?)<\/EventDate>/);
    const eventTimeMatch = eventXml.match(/<EventTime>(.*?)<\/EventTime>/);
    const eventCityMatch = eventXml.match(/<EventCity>(.*?)<\/EventCity>/);
    const eventStateMatch = eventXml.match(/<EventState>(.*?)<\/EventState>/);
    
    events.push({
      eventType: eventTypeMatch ? eventTypeMatch[1] : '',
      eventDate: eventDateMatch ? eventDateMatch[1] : '',
      eventTime: eventTimeMatch ? eventTimeMatch[1] : '',
      eventCity: eventCityMatch ? eventCityMatch[1] : '',
      eventState: eventStateMatch ? eventStateMatch[1] : '',
      eventZip: '',
      eventCountry: 'US',
      firmName: '',
      name: '',
      authorizedAgent: '',
      eventCode: '',
      summary: eventTypeMatch ? eventTypeMatch[1] : '',
    });
  }
  
  return {
    trackingNumber,
    status,
    statusCategory,
    statusSummary,
    deliveryDate,
    deliveryTime,
    signedBy,
    events,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get mock tracking data for testing when API credentials not configured
 */
function getMockTrackingData(trackingNumber: string): TrackingResult {
  // Simulate different statuses based on tracking number pattern
  const lastDigit = parseInt(trackingNumber.slice(-1));
  
  if (lastDigit % 3 === 0) {
    // Delivered
    return {
      trackingNumber,
      status: 'Delivered',
      statusCategory: 'delivered',
      statusSummary: 'Your item was delivered at the front door or porch.',
      deliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryTime: '2:15 PM',
      signedBy: 'Recipient',
      events: [
        {
          eventType: 'Delivered',
          eventDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          eventTime: '2:15 PM',
          eventCity: 'ATLANTA',
          eventState: 'GA',
          eventZip: '30348',
          eventCountry: 'US',
          firmName: '',
          name: 'Recipient',
          authorizedAgent: '',
          eventCode: '',
          summary: 'Delivered, Front Door/Porch',
        },
      ],
      lastUpdated: new Date().toISOString(),
    };
  } else if (lastDigit % 3 === 1) {
    // In transit
    return {
      trackingNumber,
      status: 'In Transit',
      statusCategory: 'in_transit',
      statusSummary: 'Your item is in transit to the destination.',
      events: [
        {
          eventType: 'In Transit',
          eventDate: new Date().toISOString().split('T')[0],
          eventTime: '10:30 AM',
          eventCity: 'CHICAGO',
          eventState: 'IL',
          eventZip: '60601',
          eventCountry: 'US',
          firmName: '',
          name: '',
          authorizedAgent: '',
          eventCode: '',
          summary: 'In Transit to Next Facility',
        },
      ],
      lastUpdated: new Date().toISOString(),
    };
  } else {
    // Accepted
    return {
      trackingNumber,
      status: 'Accepted',
      statusCategory: 'accepted',
      statusSummary: 'USPS is now in possession of your item.',
      events: [
        {
          eventType: 'Accepted',
          eventDate: new Date().toISOString().split('T')[0],
          eventTime: '9:00 AM',
          eventCity: 'NEW YORK',
          eventState: 'NY',
          eventZip: '10001',
          eventCountry: 'US',
          firmName: '',
          name: '',
          authorizedAgent: '',
          eventCode: '',
          summary: 'Accepted at USPS Origin Facility',
        },
      ],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Batch track multiple packages
 */
export async function trackMultiplePackages(trackingNumbers: string[]): Promise<TrackingResult[]> {
  const results = await Promise.allSettled(
    trackingNumbers.map(tn => trackUSPSPackage(tn))
  );
  
  return results
    .filter((r): r is PromiseFulfilledResult<TrackingResult> => r.status === 'fulfilled')
    .map(r => r.value);
}
