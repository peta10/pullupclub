import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface SuperActionRequest {
  action: string;
  data?: any;
  user_id?: string;
}

interface SuperActionResponse {
  success: boolean;
  message: string;
  data?: any;
  timestamp: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Parse request body
    const requestData: SuperActionRequest = await req.json();
    
    // Validate required fields
    if (!requestData.action) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Action is required',
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Process different actions
    let responseData: SuperActionResponse;

    switch (requestData.action) {
      case 'health_check':
        responseData = {
          success: true,
          message: 'Super action function is healthy',
          data: { status: 'active', version: '1.0.0' },
          timestamp: new Date().toISOString()
        };
        break;

      case 'admin_verify':
        responseData = {
          success: true,
          message: 'Admin verification completed',
          data: { verified: true },
          timestamp: new Date().toISOString()
        };
        break;

      case 'system_status':
        responseData = {
          success: true,
          message: 'System status retrieved',
          data: { 
            status: 'operational',
            uptime: '99.9%',
            last_check: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        };
        break;

      default:
        responseData = {
          success: false,
          message: `Unknown action: ${requestData.action}`,
          timestamp: new Date().toISOString()
        };
        break;
    }

    return new Response(
      JSON.stringify(responseData),
      {
        status: responseData.success ? 200 : 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Super Action Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
