export const config = {
  runtime: 'edge',
};

// Import the MetaConversionsAPI class from a shared file
import { MetaConversionsAPI } from './_meta-api';

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
    const { 
      userData = {}, 
      value, 
      currency = 'USD', 
      eventSourceUrl,
      orderId,
      ...customData 
    } = body;

    if (!value) {
      return new Response(JSON.stringify({ error: 'value is required for purchase events' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const meta = new MetaConversionsAPI();
    
    const event = await meta.createEvent({
      eventName: 'Purchase',
      eventSourceUrl,
      userAgent: req.headers.get('user-agent'),
      ipAddress: req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 '127.0.0.1',
      userData,
      customData: { 
        value: parseFloat(value), 
        currency,
        content_ids: orderId ? [orderId] : undefined,
        ...customData 
      }
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
    console.error('Track purchase error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to track purchase event',
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