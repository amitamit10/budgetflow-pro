'use client'

import { useState, useEffect } from 'react'
import { Expense } from '@/types'
import { ChatInterface } from '@/components/ai/ChatInterface'

export default function AIPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load last 3 months of expenses for richer context
    const now = new Date()
    const months = [0, 1, 2].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
      return fetch(`/api/expenses?month=${d.getMonth() + 1}&year=${d.getFullYear()}`)
        .then((r) => r.json())
    })
    Promise.all(months).then((results) => {
      setExpenses(results.flat().filter(Boolean))
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Powered by <span className="font-medium">groq/compound</span> · GPT-OSS-120B + web search + Wolfram Alpha
          {!loading && <> · <span className="font-medium">{expenses.length}</span> transactions as context</>}
        </p>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">Loading your financial data…</div>
      ) : (
        <ChatInterface expenses={expenses} />
      )}
    </div>
  )
}
