'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { ChatMessage, AIMode, Expense } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const MODES: { id: AIMode; label: string; description: string }[] = [
  { id: 'budget-builder', label: 'Budget Builder', description: 'Generate a full budget from your income' },
  { id: 'expense-analyzer', label: 'Expense Analyzer', description: 'Ask questions about your spending' },
  { id: 'financial-advisor', label: 'Financial Advisor', description: 'Get personalized saving strategies' },
]

interface ChatInterfaceProps {
  expenses: Expense[]
}

export function ChatInterface({ expenses }: ChatInterfaceProps) {
  const [mode, setMode] = useState<AIMode>('expense-analyzer')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || streaming) return

    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' }
    setMessages([...newMessages, assistantMsg])

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, mode, expenses }),
      })

      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: accumulated }
          return updated
        })
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Mode selector */}
      <div className="w-64 shrink-0 space-y-2">
        <p className="text-xs font-medium text-muted-foreground px-1 mb-3">Mode</p>
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setMessages([]) }}
            className={cn(
              'w-full text-left px-3 py-3 rounded-lg border text-sm transition-colors',
              mode === m.id
                ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-700'
                : 'border-border hover:border-indigo-200 hover:bg-muted/30'
            )}
          >
            <p className={cn('font-medium', mode === m.id ? 'text-indigo-700 dark:text-indigo-300' : '')}>
              {m.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col border border-border rounded-lg overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground mt-16">
              <p className="font-medium text-foreground mb-1">
                {MODES.find((m) => m.id === mode)?.label}
              </p>
              <p>{MODES.find((m) => m.id === mode)?.description}</p>
              <p className="mt-2">Type a message to get started.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex flex-col gap-1', msg.role === 'user' ? 'items-end' : 'items-start')}
            >
              <span className="text-xs text-muted-foreground px-1">
                {msg.role === 'user' ? 'You' : 'BudgetFlow AI'}
              </span>
              <div
                className={cn(
                  'max-w-[75%] text-sm px-3 py-2 rounded-lg leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-muted text-foreground'
                )}
              >
                {msg.content || (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t border-border p-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances…"
            disabled={streaming}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
