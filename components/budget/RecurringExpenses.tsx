'use client'

import { useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { Expense } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RecurringExpensesProps {
  allExpenses: Expense[]
}

export function RecurringExpenses({ allExpenses }: RecurringExpensesProps) {
  const recurring = useMemo(() => {
    const groups = new Map<string, { months: Set<string>; latestAmount: number }>()

    for (const e of allExpenses) {
      if (!e.description) continue
      const key = `${e.description.toLowerCase()}::${e.amount}`
      const month = e.date.substring(0, 7)
      if (!groups.has(key)) groups.set(key, { months: new Set(), latestAmount: e.amount })
      groups.get(key)!.months.add(month)
    }

    return Array.from(groups.entries())
      .filter(([, v]) => v.months.size >= 2)
      .map(([key, v]) => ({
        description: key.split('::')[0],
        amount: v.latestAmount,
        months: v.months.size,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [allExpenses])

  if (recurring.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          Recurring Expenses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recurring.map((r) => (
          <div key={r.description} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium capitalize">{r.description}</p>
              <p className="text-xs text-muted-foreground">Detected {r.months} months</p>
            </div>
            <span className="tabular-nums text-sm">₪{r.amount.toFixed(0)}/mo</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
