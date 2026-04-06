'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from 'ai/react'

export default function ChatPage() {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (localStorage.getItem('mos_auth') !== 'true') {
      router.push('/')
    }
  }, [router])

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "I'm the MOS Agent. I help B2B SaaS companies diagnose what's actually limiting their growth and determine the highest-leverage actions to take next.\n\nTo give you useful guidance, I need to understand your current situation before making any recommendations. Let's start there.\n\nWhat's your company name, and can you give me a quick snapshot of where you are — stage, headcount, ARR, and what your marketing function looks like today?",
      },
    ],
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSignOut() {
    localStorage.removeItem('mos_auth')
    router.push('/')
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div>
          <span className="text-sm font-medium text-white">MOS</span>
          <span className="text-sm text-gray-500 ml-2">Marketing Operating System</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-white text-gray-950'
                  : 'bg-gray-900 text-gray-100'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-900 rounded-2xl px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask MOS anything about your marketing..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as unknown as React.FormEvent)
              }
            }}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none transition-colors"
            style={{ minHeight: '44px', maxHeight: '160px' }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-white text-gray-950 rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            Send
          </button>
        </form>
        <p className="text-xs text-gray-600 mt-2 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
