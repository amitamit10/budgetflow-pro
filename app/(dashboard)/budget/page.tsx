'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Expense, BudgetCategory, Category, CATEGORIES } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExpenseForm } from '@/components/budget/ExpenseForm'
import { ExpenseList } from '@/components/budget/ExpenseList'
import { BudgetLimitCard } from '@/components/budget/BudgetLimitCard'
import { RecurringExpenses } from '@/components/budget/RecurringExpenses'

export default function BudgetPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categoryLimits, setCategoryLimits] = useState<BudgetCategory[]>([])
  const [allExpenses, setAllExpenses] = useState<Expense[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [expRes, budgetRes, allRes] = await Promise.all([
      fetch(`/api/expenses?month=${month}&year=${year}`),
      fetch(`/api/budgets?month=${month}&year=${year}`),
      fetch('/api/expenses'),
    ])
    const [expData, budgetData, allData] = await Promise.all([
      expRes.json(),
      budgetRes.json(),
      allRes.json(),
    ])
    setExpenses(expData ?? [])
    setCategoryLimits(budgetData?.[0]?.budget_categories ?? [])
    setAllExpenses(allData ?? [])
    setLoading(false)
  }, [month, year])

  useEffect(() => { fetchData() }, [fetchData])

  const spentByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const monthLabel = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budget</h1>
          <div className="flex items-center gap-2 mt-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-36 text-center">{monthLabel}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Expense list */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="text-sm text-muted-foreground py-10 text-center">Loading…</div>
          ) : (
            <ExpenseList
              expenses={expenses}
              onDeleted={(id) => setExpenses((prev) => prev.filter((e) => e.id !== id))}
              onUpdated={(updated) =>
                setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
              }
            />
          )}
        </div>

        {/* Budget limits panel */}
        <div className="w-72 shrink-0 space-y-4">
          {categoryLimits.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Budget Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {CATEGORIES.map((cat: Category) => {
                  const limit = categoryLimits.find((cl) => cl.category === cat)
                  if (!limit) return null
                  return (
                    <BudgetLimitCard
                      key={cat}
                      category={cat}
                      spent={spentByCategory[cat] ?? 0}
                      limit={limit.limit_amount}
                    />
                  )
                })}
              </CardContent>
            </Card>
          )}

          <RecurringExpenses allExpenses={allExpenses} />
        </div>
      </div>

      <ExpenseForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={(e) => setExpenses((prev) => [e, ...prev])}
      />
    </div>
  )
}
