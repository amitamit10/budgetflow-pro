'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Settings2 } from 'lucide-react'
import { CATEGORIES, Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const TEMPLATES = {
  student:  { Food: 30, Transport: 15, Rent: 25, Shopping: 10, Bills: 10, Entertainment: 5, Other: 5 },
  family:   { Food: 25, Transport: 10, Rent: 35, Shopping: 10, Bills: 12, Entertainment: 5, Other: 3 },
  savings:  { Food: 20, Transport: 8,  Rent: 30, Shopping: 5,  Bills: 10, Entertainment: 2, Other: 5 },
  minimal:  { Food: 25, Transport: 5,  Rent: 40, Shopping: 5,  Bills: 15, Entertainment: 3, Other: 7 },
}

interface BudgetSetupDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  month: number
  year: number
  initialIncome?: number
  initialLimits?: Record<string, number>
}

export function BudgetSetupDialog({
  open, onClose, onSaved, month, year, initialIncome = 0, initialLimits = {}
}: BudgetSetupDialogProps) {
  const [income, setIncome] = useState(initialIncome.toString())
  const [limits, setLimits] = useState<Record<string, string>>(
    Object.fromEntries(CATEGORIES.map((c) => [c, (initialLimits[c] ?? 0).toString()]))
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setIncome(initialIncome.toString())
    setLimits(Object.fromEntries(CATEGORIES.map((c) => [c, (initialLimits[c] ?? 0).toString()])))
  }, [initialIncome, initialLimits])

  function applyTemplate(type: keyof typeof TEMPLATES) {
    const inc = parseFloat(income) || 0
    if (inc <= 0) { toast.error('Enter your income first'); return }
    const pcts = TEMPLATES[type]
    setLimits(Object.fromEntries(
      CATEGORIES.map((c) => [c, Math.round(inc * (pcts[c as keyof typeof pcts] / 100)).toString()])
    ))
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} template applied`)
  }

  async function handleSave() {
    const incomeNum = parseFloat(income)
    if (!incomeNum || incomeNum <= 0) { toast.error('Enter a valid income'); return }

    const categories = CATEGORIES
      .map((c) => ({ category: c, limit_amount: parseFloat(limits[c]) || 0 }))
      .filter((c) => c.limit_amount > 0)

    const total = categories.reduce((s, c) => s + c.limit_amount, 0)

    setLoading(true)
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: { month, year, income: incomeNum, total_limit: total },
          categories,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Budget saved')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save budget')
    } finally {
      setLoading(false)
    }
  }

  const totalAllocated = CATEGORIES.reduce((s, c) => s + (parseFloat(limits[c]) || 0), 0)
  const incomeNum = parseFloat(income) || 0
  const unallocated = incomeNum - totalAllocated

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Up Budget</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Income */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Monthly Income (₪)</label>
            <Input
              type="number"
              min="0"
              placeholder="5000"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />
          </div>

          {/* Templates */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Quick templates</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TEMPLATES) as (keyof typeof TEMPLATES)[]).map((t) => (
                <Button key={t} variant="outline" size="sm" onClick={() => applyTemplate(t)}
                  className="capitalize text-xs h-7">
                  {t}
                </Button>
              ))}
            </div>
          </div>

          {/* Category limits */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Category Limits (₪)</label>
            {CATEGORIES.map((c: Category) => (
              <div key={c} className="flex items-center gap-3">
                <span className="text-sm w-28 shrink-0">{c}</span>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={limits[c]}
                  onChange={(e) => setLimits((prev) => ({ ...prev, [c]: e.target.value }))}
                  className="h-8 text-sm"
                />
                {incomeNum > 0 && parseFloat(limits[c]) > 0 && (
                  <span className="text-xs text-muted-foreground w-10 shrink-0">
                    {Math.round((parseFloat(limits[c]) / incomeNum) * 100)}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          {incomeNum > 0 && (
            <div className={`text-sm rounded-lg p-3 ${unallocated >= 0 ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
              Allocated: ₪{totalAllocated.toLocaleString()} / ₪{incomeNum.toLocaleString()}
              {' · '}
              {unallocated >= 0
                ? `₪${unallocated.toLocaleString()} unallocated (savings)`
                : `₪${Math.abs(unallocated).toLocaleString()} over income`}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving…' : 'Save Budget'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
