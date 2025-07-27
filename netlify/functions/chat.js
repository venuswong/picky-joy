const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

exports.handler = async (event, context) => {
  console.log('Function started')
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    }
  }

  try {
    // List ALL environment variables (be careful with sensitive data)
    const allEnvVars = Object.keys(process.env).filter(key => 
      key.includes('SUPABASE') || key.includes('OPENAI') || key.includes('VITE')
    )
    
    const envStatus = {
      'VITE_SUPABASE_URL': !!process.env.VITE_SUPABASE_URL,
      'VITE_SUPABASE_ANON_KEY': !!process.env.VITE_SUPABASE_ANON_KEY,
      'SUPABASE_SERVICE_ROLE_KEY': !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      'OPENAI_API_KEY': !!process.env.OPENAI_API_KEY,
      'All Supabase/OpenAI vars found': allEnvVars
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Environment check: ' + JSON.stringify(envStatus, null, 2)
      })
    }

  } catch (error) {
    console.error('Function error:', error)
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message
      })
    }
  }
}
