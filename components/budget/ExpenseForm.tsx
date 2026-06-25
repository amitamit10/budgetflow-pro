'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CATEGORIES, Category, Expense } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ExpenseFormProps {
  open: boolean
  onClose: () => void
  onSaved: (expense: Expense) => void
  editing?: Expense | null
}

export function ExpenseForm({ open, onClose, onSaved, editing }: ExpenseFormProps) {
  const today = new Date().toISOString().split('T')[0]

  const [amount, setAmount] = useState(editing?.amount?.toString() ?? '')
  const [category, setCategory] = useState<Category>(editing?.category ?? 'Food')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [date, setDate] = useState(editing?.date ?? today)
  const [tags, setTags] = useState(editing?.tags?.join(', ') ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !date) return
    setLoading(true)

    const payload = {
      amount: parseFloat(amount),
      category,
      description: description || null,
      date,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      is_recurring: false,
    }

    try {
      const res = await fetch(editing ? `/api/expenses/${editing.id}` : '/api/expenses', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSaved(data)
      toast.success(editing ? 'Expense updated' : 'Expense added')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Amount (₪)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tags</label>
            <Input
              placeholder="work, personal, essential (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : editing ? 'Update' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
