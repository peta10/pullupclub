import { MetaConversionsAPI } from '../../../lib/meta-conversions';

export interface TrackEventRequest {
  eventName: string;
  userData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    externalId?: string;
    fbp?: string;
  };
  customData?: Record<string, unknown>;
  eventSourceUrl?: string;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json() as TrackEventRequest;
    const { eventName, userData = {}, customData = {}, eventSourceUrl } = body;

    if (!eventName) {
      return new Response(JSON.stringify({ error: 'eventName is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // In development, just log the event
    if (import.meta.env.DEV) {
      console.log('🔍 Meta Pixel Event (Development):', {
        eventName,
        userData,
        customData,
        eventSourceUrl
      });
      
      return new Response(JSON.stringify({ 
        success: true,
        development: true,
        event: {
          eventName,
          userData,
          customData,
          eventSourceUrl
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // In production, send to Meta
    const meta = new MetaConversionsAPI();
    const event = meta.createEvent({
      eventName,
      eventSourceUrl,
      userData,
      customData
    });

    const result = await meta.sendEvents([event]);

    return new Response(JSON.stringify({ 
      success: true,
      result,
      eventId: event.event_id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Track event error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to track event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 