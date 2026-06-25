'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Expense } from '@/types'
import { generateExpenseSheet } from '@/lib/excel/sheetjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ExcelExportProps {
  expenses: Expense[]
}

export function ExcelExport({ expenses }: ExcelExportProps) {
  const [loading, setLoading] = useState(false)

  function handleExport() {
    setLoading(true)
    try {
      const blob = generateExpenseSheet(expenses)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `budgetflow-expenses-${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Export Excel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Download all your expenses as a formatted Excel file.
        </p>
        <Button onClick={handleExport} disabled={loading || expenses.length === 0} className="gap-2">
          <Download className="h-4 w-4" />
          {loading ? 'Generating…' : 'Download .xlsx'}
        </Button>
        {expenses.length > 0 && (
          <p className="text-xs text-muted-foreground">{expenses.length} expenses ready to export</p>
        )}
      </CardContent>
    </Card>
  )
}
