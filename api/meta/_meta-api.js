export class MetaConversionsAPI {
  constructor() {
    this.pixelId = process.env.META_PIXEL_ID;
    this.accessToken = process.env.META_ACCESS_TOKEN;
    this.apiVersion = process.env.META_API_VERSION || 'v21.0';
    this.baseUrl = 'https://graph.facebook.com';
  }

  async sendEvents(events) {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${this.pixelId}/events`;
      
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