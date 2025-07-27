const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

const defaultSystemPrompt = `You are Picky Joy, a friendly and knowledgeable AI nutrition assistant specializing in helping parents with picky eaters. You provide personalized recipe suggestions, nutritional advice, and meal planning tips.

Key Guidelines:
- Always be encouraging and positive
- Suggest recipes that are kid-friendly and nutritious
- Consider common picky eater preferences (simple flavors, familiar textures)
- Provide practical cooking tips
- Include nutritional benefits when relevant
- Be creative but realistic about what kids will actually eat
- Keep responses concise but helpful
- Ask follow-up questions to better understand the child's preferences

When suggesting recipes, format them like this:
**Recipe Name**: [Name]
**Ingredients**: [List]
**Instructions**: [Steps]
**Tips**: [Helpful hints for picky eaters]

Remember: You're helping stressed parents, so be supportive and practical!`

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
    // Get the authorization header
    const authHeader = event.headers.authorization
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing authorization header' })
      }
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '')
    
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid token' })
      }
    }

    const { message, selectedProfileId } = JSON.parse(event.body)

    if (!message) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing message' })
      }
    }

    // Get user's custom system prompt
    let systemPrompt = defaultSystemPrompt
    try {
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('system_prompt')
        .eq('user_id', user.id)
        .single()

      if (userSettings?.system_prompt) {
        systemPrompt = userSettings.system_prompt
      }
    } catch (error) {
      console.log('Using default system prompt')
    }

    // Get selected child profile for personalization
    let childProfile = null
    if (selectedProfileId) {
      try {
        const { data: profile } = await supabase
          .from('child_profiles')
          .select('*')
          .eq('id', selectedProfileId)
          .eq('user_id', user.id)
          .single()

        if (profile) {
          childProfile = profile
          // Enhance system prompt with child profile information
          const profileInfo = `
Child Profile: ${profile.name}${profile.age ? ` (${profile.age} years old)` : ''}
${profile.preferences.length > 0 ? `Likes: ${profile.preferences.join(', ')}` : ''}
${profile.allergies.length > 0 ? `Allergies: ${profile.allergies.join(', ')}` : ''}

Please consider this child's preferences and restrictions when suggesting recipes.`
          
          systemPrompt = systemPrompt + '\n\n' + profileInfo
        }
      } catch (error) {
        console.log('No child profile found or error loading profile')
      }
    }

    // Get recent chat history for context
    let chatHistory = []
    try {
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (recentMessages) {
        chatHistory = recentMessages.reverse().map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      }
    } catch (error) {
      console.log('No chat history found')
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Build conversation array
    const conversation = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: message }
    ]

    // Save user message to database
    await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        role: 'user',
        content: message
      })

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: conversation,
      max_tokens: 1000,
      temperature: 0.7,
    })

    const assistantMessage = completion.choices[0].message.content

    // Save assistant message to database
    await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        role: 'assistant',
        content: assistantMessage
      })

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: assistantMessage })
    }

  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    }
  }
}
