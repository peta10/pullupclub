import crypto from 'crypto';

function hashData(data) {
  if (!data) return null;
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

function generateEventId(userId, eventName, timestamp) {
  const baseString = `${userId || 'anonymous'}_${eventName}_${timestamp}`;
  return crypto.createHash('md5').update(baseString).digest('hex');
}

async function sendToMeta(events) {
  const apiVersion = process.env.META_API_VERSION || 'v21.0';
  const url = `https://graph.facebook.com/${apiVersion}/${process.env.META_PIXEL_ID}/events`;
  
  const payload = {
    data: events,
    access_token: process.env.META_ACCESS_TOKEN
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Meta API Error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

function createEvent({
  eventName,
  eventTime = Math.floor(Date.now() / 1000),
  eventSourceUrl,
  userAgent,
  ipAddress,
  userData = {},
  customData = {},
}) {
  const hashedUserData = {};
  
  if (userData.email) {
    hashedUserData.em = [hashData(userData.email)];
  }
  if (userData.phone) {
    hashedUserData.ph = [hashData(userData.phone)];
  }
  if (userData.firstName) {
    hashedUserData.fn = [hashData(userData.firstName)];
  }
  if (userData.lastName) {
    hashedUserData.ln = [hashData(userData.lastName)];
  }
  if (userData.externalId) {
    hashedUserData.external_id = [userData.externalId];
  }
  if (userData.fbp) {
    hashedUserData.fbp = userData.fbp;
  }
  if (userAgent) {
    hashedUserData.client_user_agent = userAgent;
  }
  if (ipAddress) {
    hashedUserData.client_ip_address = ipAddress;
  }

  return {
    event_name: eventName,
    event_time: eventTime,
    event_id: generateEventId(userData.externalId, eventName, eventTime),
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: hashedUserData,
    custom_data: customData,
  };
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Meta API called from:', req.headers['user-agent']);
    
    const { eventName, userData = {}, customData = {}, eventSourceUrl } = req.body;

    if (!eventName) {
      return res.status(400).json({ error: 'eventName is required' });
    }

    // Check environment variables
    if (!process.env.META_PIXEL_ID || !process.env.META_ACCESS_TOKEN) {
      console.error('Missing Meta environment variables:', {
        hasPixelId: !!process.env.META_PIXEL_ID,
        hasToken: !!process.env.META_ACCESS_TOKEN
      });
      return res.status(500).json({ error: 'Meta configuration missing' });
    }

    const userAgent = req.headers['user-agent'];
    const ipAddress = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || '127.0.0.1';

    const event = createEvent({
      eventName,
      eventSourceUrl: eventSourceUrl || req.headers.referer,
      userAgent,
      ipAddress,
      userData,
      customData,
    });

    console.log('📤 Sending to Meta:', {
      eventName: event.event_name,
      pixelId: process.env.META_PIXEL_ID,
      hasUserData: Object.keys(event.user_data).length > 0
    });

    const result = await sendToMeta([event]);

    console.log('✅ Meta API Success');

    return res.status(200).json({ 
      success: true, 
      result,
      eventId: event.event_id 
    });

  } catch (error) {
    console.error('❌ Meta API Error:', error.message);
    
    return res.status(500).json({ 
      error: 'Failed to track event',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 