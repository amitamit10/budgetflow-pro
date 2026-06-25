'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Expense, CATEGORY_COLORS, Category } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExpenseForm } from './ExpenseForm'

interface ExpenseListProps {
  expenses: Expense[]
  onDeleted: (id: string) => void
  onUpdated: (expense: Expense) => void
}

export function ExpenseList({ expenses, onDeleted, onUpdated }: ExpenseListProps) {
  const [editing, setEditing] = useState<Expense | null>(null)

  async function handleDelete(id: string) {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    if (res.ok) {
      onDeleted(id)
      toast.success('Expense deleted')
    } else {
      toast.error('Failed to delete expense')
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No expenses yet. Add your first one.
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Date</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Category</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Description</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Tags</th>
              <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense, i) => (
              <tr
                key={expense.id}
                className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors group ${
                  i % 2 === 0 ? '' : 'bg-muted/10'
                }`}
              >
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(expense.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className="text-white text-xs border-0"
                    style={{ backgroundColor: CATEGORY_COLORS[expense.category as Category] }}
                  >
                    {expense.category}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-foreground">{expense.description ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {expense.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  ₪{expense.amount.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditing(expense)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ExpenseForm
        open={!!editing}
        onClose={() => setEditing(null)}
        onSaved={(e) => { onUpdated(e); setEditing(null) }}
        editing={editing}
      />
    </>
  )
}
