export const config = {
  runtime: 'edge',
};

class MetaConversionsAPI {
  constructor() {
    this.pixelId = process.env.META_PIXEL_ID;
    this.accessToken = process.env.META_ACCESS_TOKEN;
    this.apiVersion = process.env.META_API_VERSION || 'v21.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  async sendEvents(events) {
    try {
      const url = `${this.baseUrl}/${this.pixelId}/events`;
      
      const payload = {
        data: events,
        access_token: this.accessToken
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Meta API Error: ${JSON.stringify(result)}`);
      }

      return result;
    } catch (error) {
      console.error('Meta Conversions API Error:', error);
      throw error;
    }
  }

  hashData(data) {
    if (!data) return null;
    // Use Web Crypto API instead of Node's crypto module for Edge Runtime
    const encoder = new TextEncoder();
    const data_buffer = encoder.encode(data.toLowerCase().trim());
    return crypto.subtle.digest('SHA-256', data_buffer)
      .then(hash => {
        return Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      });
  }

  generateEventId(userId, eventName, timestamp) {
    const baseString = `${userId || 'anonymous'}_${eventName}_${timestamp}`;
    const encoder = new TextEncoder();
    const data_buffer = encoder.encode(baseString);
    return crypto.subtle.digest('MD5', data_buffer)
      .then(hash => {
        return Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      });
  }

  async createEvent({
    eventName,
    eventTime = Math.floor(Date.now() / 1000),
    eventSourceUrl,
    userAgent,
    ipAddress,
    userData = {},
    customData = {},
    eventId,
  }) {
    const hashedUserData = {};
    
    if (userData.email) {
      hashedUserData.em = [await this.hashData(userData.email)];
    }
    if (userData.phone) {
      hashedUserData.ph = [await this.hashData(userData.phone)];
    }
    if (userData.firstName) {
      hashedUserData.fn = [await this.hashData(userData.firstName)];
    }
    if (userData.lastName) {
      hashedUserData.ln = [await this.hashData(userData.lastName)];
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

    const generatedEventId = eventId || await this.generateEventId(userData.externalId, eventName, eventTime);

    return {
      event_name: eventName,
      event_time: eventTime,
      event_id: generatedEventId,
      event_source_url: eventSourceUrl,
      action_source: 'website',
      user_data: hashedUserData,
      custom_data: customData,
    };
  }
}

export default async function handler(req) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const body = await req.json();
    const { eventName, userData = {}, customData = {}, eventSourceUrl } = body;

    if (!eventName) {
      return new Response(JSON.stringify({ error: 'eventName is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (!process.env.META_PIXEL_ID || !process.env.META_ACCESS_TOKEN) {
      console.error('Missing Meta environment variables');
      return new Response(JSON.stringify({ error: 'Meta configuration missing' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const meta = new MetaConversionsAPI();
    
    const event = await meta.createEvent({
      eventName,
      eventSourceUrl,
      userAgent: req.headers.get('user-agent'),
      ipAddress: req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 '127.0.0.1',
      userData,
      customData,
    });

    const result = await meta.sendEvents([event]);

    return new Response(JSON.stringify({
      success: true,
      result,
      eventId: event.event_id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Track event error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to track event',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
} 