'use client'

import { useState, useEffect } from 'react'
import { Expense } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SpendingPieChart } from '@/components/analytics/SpendingPieChart'
import { SpendingLineChart } from '@/components/analytics/SpendingLineChart'
import { MonthComparison } from '@/components/analytics/MonthComparison'

export default function AnalyticsPage() {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const [current, setCurrent] = useState<Expense[]>([])
  const [previous, setPrevious] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year

  useEffect(() => {
    Promise.all([
      fetch(`/api/expenses?month=${month}&year=${year}`).then((r) => r.json()),
      fetch(`/api/expenses?month=${prevMonth}&year=${prevYear}`).then((r) => r.json()),
    ]).then(([cur, prev]) => {
      setCurrent(cur ?? [])
      setPrevious(prev ?? [])
      setLoading(false)
    })
  }, [month, year, prevMonth, prevYear])

  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  if (loading) return <div className="text-sm text-muted-foreground py-10 text-center">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">{monthLabel}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingPieChart expenses={current} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium">Daily Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingLineChart expenses={current} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium">Month Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthComparison currentExpenses={current} previousExpenses={previous} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
