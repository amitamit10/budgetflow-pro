'use client'

import { useState, useEffect } from 'react'
import { Expense } from '@/types'
import { ChatInterface } from '@/components/ai/ChatInterface'

export default function AIPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    const now = new Date()
    fetch(`/api/expenses?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      .then((r) => r.json())
      .then((data) => setExpenses(data ?? []))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Powered by Groq · {expenses.length} expenses loaded as context
        </p>
      </div>
      <ChatInterface expenses={expenses} />
    </div>
  )
}
