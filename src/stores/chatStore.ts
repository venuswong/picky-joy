import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => void
  setMessages: (messages: Message[]) => void
  setLoading: (loading: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set: any) => ({
  messages: [],
  isLoading: false,
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => set((state: ChatState) => ({
    messages: [...state.messages, {
      ...message,
      id: Date.now().toString(),
      createdAt: new Date()
    }]
  })),
  setMessages: (messages: Message[]) => set({ messages }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: [] })
}))
