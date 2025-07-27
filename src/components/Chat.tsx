import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../stores/chatStore'
import { supabase } from '../lib/supabase'
import { SystemPromptConfig } from './SystemPromptConfig'

export function Chat() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, addMessage, setLoading } = useChatStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSystemPromptSave = (newPrompt: string) => {
    console.log('System prompt updated:', newPrompt)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    setLoading(true)

    addMessage({
      role: 'user',
      content: userMessage
    })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: userMessage
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      addMessage({
        role: 'assistant',
        content: data.message
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
    <div className="flex flex-col h-screen bg-white">
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
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-16">
            <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <div className="text-6xl">👶</div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-700">Welcome to Picky Joy - CHIPP.ai Style!</h3>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed text-lg">
              Your AI nutrition assistant for picky eaters. Let's make mealtime fun and delicious! 🎉
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
              <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-sm rounded-full font-medium">
                🍕 Kid-friendly recipes
              </span>
              <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-sm rounded-full font-medium">
                🥗 Nutritional tips
              </span>
              <span className="px-3 py-1 bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 text-sm rounded-full font-medium">
                🎯 Picky eater solutions
              </span>
            </div>
          </div>
        )}        {messages.map((message) => (
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

      <SystemPromptConfig
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSystemPromptSave}
      />
    </div>
  )
}
// CHIPP.ai style redesign
