'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Expense, CATEGORY_COLORS, Category } from '@/types'

interface SpendingPieChartProps {
  expenses: Expense[]
}

export function SpendingPieChart({ expenses }: SpendingPieChartProps) {
  const data = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount
      return acc
    }, {})
  )
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={CATEGORY_COLORS[entry.name as Category] ?? '#6b7280'}
            />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`₪${Number(v)}`, '']} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
