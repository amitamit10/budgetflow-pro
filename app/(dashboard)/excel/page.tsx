'use client'

import { useState, useEffect } from 'react'
import { Expense } from '@/types'
import { ExcelExport } from '@/components/excel/ExcelExport'
import { ExcelImport } from '@/components/excel/ExcelImport'

export default function ExcelPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    fetch('/api/expenses').then((r) => r.json()).then((d) => setExpenses(d ?? []))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Excel Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Import from or export to Excel spreadsheets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExcelImport onImported={(newExpenses) => setExpenses((prev) => [...newExpenses, ...prev])} />
        <ExcelExport expenses={expenses} />
      </div>
    </div>
  )
}
