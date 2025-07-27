const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

exports.handler = async (event, context) => {
  console.log('Function started')
  console.log('Event:', JSON.stringify(event, null, 2))
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    }
  }

  try {
    // Check environment variables
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY
    })

    // Parse the request body
    const body = JSON.parse(event.body || '{}')
    console.log('Request body:', body)

    // For now, just return a test response
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Test response from Netlify function. Environment variables: ' + 
                 (process.env.VITE_SUPABASE_URL ? 'Supabase URL OK' : 'Missing Supabase URL') + ', ' +
                 (process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Key OK' : 'Missing Service Key') + ', ' +
                 (process.env.OPENAI_API_KEY ? 'OpenAI Key OK' : 'Missing OpenAI Key')
      })
    }

  } catch (error) {
    console.error('Function error:', error)
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack 
      })
    }
  }
}
