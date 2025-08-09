import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current week's pool (where today falls between start and end dates)
    const today = new Date().toISOString().split('T')[0] // Get today as YYYY-MM-DD
    const { data: currentPool, error: poolError } = await supabaseClient
      .from('weekly_pools')
      .select('*')
      .lte('week_start_date', today)
      .gte('week_end_date', today)
      .limit(1)
      .single()

    if (poolError) {
      console.error('Error fetching pool:', poolError)
      // Return default values if no pool exists
      return new Response(
        JSON.stringify({
          success: true,
          pool: {
            remaining_dollars: '250',
            total_dollars: '250',
            spent_dollars: '0',
            progress_percentage: 0,
            is_depleted: false
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Calculate pool status - use correct field names
    const totalDollars = currentPool?.total_amount_dollars || 250
    const remainingDollars = currentPool?.remaining_amount_dollars || totalDollars
    const spentDollars = totalDollars - remainingDollars
    const progressPercentage = (spentDollars / totalDollars) * 100
    const isDepleted = remainingDollars <= 0

    const poolData = {
      remaining_dollars: remainingDollars.toString(),
      total_dollars: totalDollars.toString(),
      spent_dollars: spentDollars.toString(),
      progress_percentage: Math.round(progressPercentage),
      is_depleted: isDepleted,
      week_start: currentPool?.week_start_date,
      week_end: currentPool?.week_end_date
    }

    console.log('Pool status:', poolData)

    return new Response(
      JSON.stringify({
        success: true,
        pool: poolData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in get-pool-status:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
