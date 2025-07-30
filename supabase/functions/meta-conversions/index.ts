import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN')!;
const PIXEL_ID = '1512318086417813';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface ConversionEvent {
  event_name: string;
  event_time: number;
  user_data: {
    em?: string[];
    external_id?: string[];
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: Record<string, any>;
  action_source: 'website' | 'system';
}

async function sendToMetaConversionsAPI(event: ConversionEvent) {
  const response = await fetch(
    `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        data: [event],
        test_event_code: 'TEST12345' // Remove in production
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Meta API Error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

Deno.serve(async (req) => {
  try {
    const { event_name, user_data, custom_data } = await req.json();

    // Basic validation
    if (!event_name || !user_data) {
      throw new Error('Missing required fields');
    }

    const event: ConversionEvent = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      user_data: {
        ...user_data,
        // Hash PII data if provided
        ...(user_data.em && { em: [user_data.em].map(email => btoa(email)) }),
        client_ip_address: req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip'),
        client_user_agent: req.headers.get('user-agent'),
      },
      custom_data,
      action_source: 'website'
    };

    const result = await sendToMetaConversionsAPI(event);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});