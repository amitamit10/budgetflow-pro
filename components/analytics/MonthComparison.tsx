'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Expense, CATEGORIES, Category } from '@/types'

interface MonthComparisonProps {
  currentExpenses: Expense[]
  previousExpenses: Expense[]
}

export function MonthComparison({ currentExpenses, previousExpenses }: MonthComparisonProps) {
  const sumByCategory = (expenses: Expense[]) =>
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount
      return acc
    }, {})

  const current = sumByCategory(currentExpenses)
  const previous = sumByCategory(previousExpenses)

  const data = CATEGORIES.filter(
    (c) => (current[c] ?? 0) > 0 || (previous[c] ?? 0) > 0
  ).map((c: Category) => ({
    category: c.substring(0, 5),
    'This month': Math.round(current[c] ?? 0),
    'Last month': Math.round(previous[c] ?? 0),
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No data to compare
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₪${v}`} />
        <Tooltip formatter={(v) => [`₪${Number(v)}`, '']} />
        <Legend iconSize={8} formatter={(v) => <span className="text-xs">{v}</span>} />
        <Bar dataKey="This month" fill="#6366f1" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Last month" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
