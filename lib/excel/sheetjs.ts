'use client'

import * as XLSX from 'xlsx'
import { Expense, Category, CATEGORIES } from '@/types'

export function generateExpenseSheet(expenses: Expense[]): Blob {
  const rows = expenses.map((e) => ({
    Date: e.date,
    Category: e.category,
    Description: e.description ?? '',
    Amount: e.amount,
    Tags: e.tags.join(', '),
    Recurring: e.is_recurring ? 'Yes' : 'No',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses')

  // Auto column widths
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 14 }, // Category
    { wch: 30 }, // Description
    { wch: 10 }, // Amount
    { wch: 20 }, // Tags
    { wch: 10 }, // Recurring
  ]

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export interface RawRow {
  date: string
  category: Category
  description: string
  amount: number
  tags: string[]
}

export async function parseExpenseSheet(file: File): Promise<RawRow[]> {
  const data = await file.arrayBuffer()
  const wb = XLSX.read(data)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const json = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws)

  return json.map((row) => {
    // Try to auto-detect column names (case-insensitive)
    const keys = Object.keys(row).map((k) => k.toLowerCase())
    const get = (names: string[]) => {
      const key = Object.keys(row).find((k) => names.includes(k.toLowerCase()))
      return key ? String(row[key]) : ''
    }

    const rawCategory = get(['category', 'cat', 'type'])
    const normalizedCategory = CATEGORIES.find(
      (c) => c.toLowerCase() === rawCategory.toLowerCase()
    ) ?? 'Other'

    return {
      date: get(['date', 'day', 'time']),
      category: normalizedCategory,
      description: get(['description', 'desc', 'details', 'name', 'note']),
      amount: parseFloat(get(['amount', 'price', 'cost', 'sum', 'total']) || '0'),
      tags: get(['tags', 'tag', 'labels'])
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }
  })
}
