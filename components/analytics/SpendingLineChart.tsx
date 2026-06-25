'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Expense } from '@/types'

interface SpendingLineChartProps {
  expenses: Expense[]
}

export function SpendingLineChart({ expenses }: SpendingLineChartProps) {
  const dailyData = expenses.reduce<Record<string, number>>((acc, e) => {
    const day = e.date.substring(8, 10)
    acc[day] = (acc[day] ?? 0) + e.amount
    return acc
  }, {})

  const data = Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, amount]) => ({ day: parseInt(day), amount: Math.round(amount) }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}`}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₪${v}`}
        />
        <Tooltip formatter={(v) => [`₪${Number(v)}`, 'Spent']} labelFormatter={(l) => `Day ${l}`} />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
