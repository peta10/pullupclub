import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization header from the client request
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    console.log('[API] Proxying checkout request to Supabase edge function');
    
    // Proxy the request to your existing Supabase edge function
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: req.body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (error) {
      console.error('[API] Edge function error:', error);
      return res.status(500).json({ 
        error: 'Checkout session creation failed', 
        details: error.message 
      });
    }

    if (!data?.url) {
      console.error('[API] No checkout URL returned:', data);
      return res.status(500).json({ 
        error: 'No checkout URL returned from payment processor' 
      });
    }

    console.log('[API] Checkout session created successfully');
    return res.status(200).json(data);

  } catch (err) {
    console.error('[API] Unexpected error in checkout proxy:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}