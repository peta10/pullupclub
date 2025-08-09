import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Parse request body
    const { amount_dollars } = await req.json()

    if (!amount_dollars || amount_dollars <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get user's profile with PayPal email
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('paypal_email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    if (!profile.paypal_email) {
      return new Response(
        JSON.stringify({ error: 'PayPal email not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Check if user has sufficient earnings
    const { data: earnings, error: earningsError } = await supabaseClient
      .from('user_earnings')
      .select('total_earned, total_paid')
      .eq('user_id', user.id)
      .single()

    if (earningsError) {
      console.error('Error fetching earnings:', earningsError)
      return new Response(
        JSON.stringify({ error: 'Could not fetch earnings' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    const availableBalance = (earnings?.total_earned || 0) - (earnings?.total_paid || 0)

    if (availableBalance < amount_dollars) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient balance',
          available: availableBalance,
          requested: amount_dollars
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Create payout request
    const { data: payoutRequest, error: payoutError } = await supabaseClient
      .from('payout_requests')
      .insert({
        user_id: user.id,
        amount: amount_dollars,
        paypal_email: profile.paypal_email,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (payoutError) {
      console.error('Error creating payout request:', payoutError)
      return new Response(
        JSON.stringify({ error: 'Failed to create payout request' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Send notification to admin
    await supabaseClient
      .from('admin_notifications')
      .insert({
        type: 'payout_request',
        title: 'New Payout Request',
        message: `User ${user.email} requested a payout of $${amount_dollars}`,
        data: { 
          payout_request_id: payoutRequest.id,
          user_id: user.id,
          amount: amount_dollars 
        },
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        payout_request: payoutRequest
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in request-payout:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
