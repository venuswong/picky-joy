const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    }
  }

  try {
    console.log('Function started')
    console.log('Environment variables:', {
      hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY
    })

    // Get the authorization header
    const authHeader = event.headers.authorization
    if (!authHeader) {
      console.log('Missing authorization header')
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing authorization header' })
      }
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '')
    console.log('Token extracted')
    
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('Missing Supabase environment variables')
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Server configuration error' })
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('Supabase client created')

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.log('Auth error:', authError)
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid token' })
      }
    }

    console.log('User authenticated:', user.id)

    const { message, selectedProfileId } = JSON.parse(event.body)

    if (!message) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing message' })
      }
    }

    console.log('Message received:', message)

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.log('Missing OpenAI API key')
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'AI service not configured' })
      }
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    console.log('OpenAI client created')

    // Simple conversation
    const conversation = [
      { 
        role: 'system', 
        content: 'You are Picky Joy, a friendly AI nutrition assistant for picky eaters. Be helpful and encouraging.' 
      },
      { role: 'user', content: message }
    ]

    console.log('Calling OpenAI')

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: conversation,
      max_tokens: 500,
      temperature: 0.7,
    })

    const assistantMessage = completion.choices[0].message.content
    console.log('OpenAI response received')

    // Save messages to database
    try {
      await supabase
        .from('messages')
        .insert([
          {
            user_id: user.id,
            role: 'user',
            content: message
          },
          {
            user_id: user.id,
            role: 'assistant',
            content: assistantMessage
          }
        ])
      console.log('Messages saved to database')
    } catch (dbError) {
      console.log('Database error:', dbError)
      // Continue even if database save fails
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: assistantMessage })
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
