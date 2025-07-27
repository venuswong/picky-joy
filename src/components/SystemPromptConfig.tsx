import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface SystemPromptConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave: (prompt: string) => void
}

const defaultPrompt = `You are Picky Joy, a friendly and knowledgeable AI nutrition assistant specializing in helping parents with picky eaters. You provide personalized recipe suggestions, nutritional advice, and meal planning tips.

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

export function SystemPromptConfig({ isOpen, onClose, onSave }: SystemPromptConfigProps) {
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadCurrentPrompt()
    }
  }, [isOpen])

  const loadCurrentPrompt = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('user_settings')
        .select('system_prompt')
        .eq('user_id', session.user.id)
        .single()

      if (data?.system_prompt) {
        setPrompt(data.system_prompt)
      }
    } catch (error) {
      console.error('Error loading system prompt:', error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      // Save to database
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: session.user.id,
          system_prompt: prompt,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      onSave(prompt)
      onClose()
    } catch (error) {
      console.error('Error saving system prompt:', error)
      alert('Failed to save system prompt. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setPrompt(defaultPrompt)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">AI System Prompt Configuration</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Customize how the AI responds to help with your picky eater's needs.
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter your custom system prompt..."
            />
          </div>

          <div className="text-sm text-gray-600 mb-4">
            <p><strong>Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Be specific about your child's preferences and allergies</li>
              <li>Include age-appropriate suggestions</li>
              <li>Mention any dietary restrictions</li>
              <li>Specify preferred cooking methods or time constraints</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Reset to Default
          </button>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
