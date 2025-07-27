import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../stores/chatStore'
import { supabase } from '../lib/supabase'

export function Chat() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, addMessage, setLoading } = useChatStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    setLoading(true)

    // Add user message to chat
    addMessage({
      role: 'user',
      content: userMessage
    })

    try {
      // Get the current session to get the JWT token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Mock response for testing - no API calls
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
      
      const mockResponse = {
        message: `Hello! I'm Picky Joy, your AI nutrition assistant. I received your message: "${userMessage}". 

I'm here to help you with recipe suggestions for picky eaters. Here's a simple recipe to get started:

**Recipe Name**: Hidden Veggie Pasta
**Ingredients**: 
- 1 cup pasta
- 1/2 cup pureed carrots
- 1/4 cup cheese
- 1 tbsp butter

**Instructions**:
1. Cook pasta according to package
2. Mix in pureed carrots
3. Add cheese and butter
4. Serve warm

**Tips**: Pureed vegetables are a great way to sneak in nutrition without kids noticing!

Note: This is a demo response. The full AI integration will be available soon!`
      }
      
      addMessage({
        role: 'assistant',
        content: mockResponse.message
      })

    } catch (error) {
      console.error('Error sending message:', error)
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      })
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <!-- Header with settings button -->
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-800">Picky Joy</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="AI Settings"
        >
          ⚙️
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for a recipe for your picky eater..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
