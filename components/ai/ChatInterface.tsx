'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Trash2, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChatMessage, AIMode, Expense } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const MODES: {
  id: AIMode
  label: string
  description: string
  icon: string
  starters: string[]
}[] = [
  {
    id: 'expense-analyzer',
    label: 'Expense Analyzer',
    description: 'Deep analysis of your spending',
    icon: '🔍',
    starters: [
      'Where am I overspending this month?',
      'Show me my top 3 expense categories',
      'Are there any suspicious or unusual charges?',
      'Which expenses could I cut without much impact?',
    ],
  },
  {
    id: 'budget-builder',
    label: 'Budget Builder',
    description: 'Build a full budget from your income',
    icon: '🏗️',
    starters: [
      'My monthly income is ₪12,000 — build me a budget',
      'I earn ₪8,000/month, I want to save 20%',
      'Create a budget for a family of 3 on ₪15,000/month',
      'What budget fits someone earning ₪6,000/month in Tel Aviv?',
    ],
  },
  {
    id: 'financial-advisor',
    label: 'Financial Advisor',
    description: 'Strategic advice & savings plans',
    icon: '💡',
    starters: [
      'How much should I have in an emergency fund?',
      'Give me a 3-month plan to reduce my spending by 15%',
      'What are the best savings options in Israel right now?',
      'How long to save ₪50,000 at my current rate?',
    ],
  },
]

interface ChatInterfaceProps {
  expenses: Expense[]
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
    </button>
  )
}

export function ChatInterface({ expenses }: ChatInterfaceProps) {
  const [mode, setMode] = useState<AIMode>('expense-analyzer')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const currentMode = MODES.find((m) => m.id === mode)!

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return

    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
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

      if (!res.ok) throw new Error(`Error ${res.status}`)
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Mode selector */}
      <div className="w-56 shrink-0 space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground px-1 mb-3">Assistant Mode</p>
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setMessages([]) }}
            className={cn(
              'w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors',
              mode === m.id
                ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-700'
                : 'border-border hover:border-indigo-200 hover:bg-muted/30'
            )}
          >
            <p className={cn('font-medium flex items-center gap-1.5',
              mode === m.id ? 'text-indigo-700 dark:text-indigo-300' : '')}>
              <span>{m.icon}</span> {m.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
          </button>
        ))}

        <div className="pt-4 border-t border-border mt-4">
          <p className="text-xs text-muted-foreground px-1 mb-1">Context</p>
          <p className="text-xs px-1">
            <span className="font-medium">{expenses.length}</span> expenses loaded
          </p>
          <p className="text-xs text-muted-foreground px-1 mt-0.5">
            groq/compound · 120B
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col border border-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
          <span className="text-sm font-medium">{currentMode.icon} {currentMode.label}</span>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground"
              onClick={() => setMessages([])}>
              <Trash2 className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {messages.length === 0 && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground text-center">Try asking:</p>
              <div className="grid grid-cols-2 gap-2">
                {currentMode.starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left text-xs px-3 py-2.5 rounded-lg border border-border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors leading-snug"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex flex-col gap-1 group', msg.role === 'user' ? 'items-end' : 'items-start')}
            >
              <span className="text-xs text-muted-foreground px-1 flex items-center gap-1.5">
                {msg.role === 'user' ? 'You' : 'BudgetFlow AI'}
                {msg.role === 'assistant' && msg.content && <CopyButton text={msg.content} />}
              </span>

              {msg.role === 'user' ? (
                <div className="max-w-[75%] text-sm px-3 py-2 rounded-lg bg-indigo-600 text-white leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[85%] text-sm px-4 py-3 rounded-lg bg-muted text-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none
                  prose-headings:text-foreground prose-headings:font-semibold
                  prose-strong:text-foreground
                  prose-table:text-xs prose-th:py-1.5 prose-td:py-1.5
                  prose-p:my-1.5 prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5">
                  {msg.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-xs">Thinking…</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your finances… (Enter to send, Shift+Enter for newline)"
            disabled={streaming}
            rows={1}
            className="flex-1 resize-none min-h-[38px] max-h-32 text-sm py-2"
          />
          <Button type="submit" size="icon" disabled={streaming || !input.trim()} className="shrink-0">
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
