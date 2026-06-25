'use client'

import { useState, useRef } from 'react'
import { Upload, Sparkles, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { Expense } from '@/types'
import { parseExpenseSheet, RawRow } from '@/lib/excel/sheetjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ExcelImportProps {
  onImported: (expenses: Expense[]) => void
}

export function ExcelImport({ onImported }: ExcelImportProps) {
  const [rows, setRows] = useState<RawRow[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiCleaning, setAiCleaning] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setFileName(file.name)
    try {
      const parsed = await parseExpenseSheet(file)
      setRows(parsed)
    } catch {
      toast.error('Could not read the Excel file. Make sure it is a valid .xlsx file.')
    }
  }

  async function handleImport(cleanedRows: RawRow[]) {
    setLoading(true)
    let imported = 0
    const results: Expense[] = []

    for (const row of cleanedRows) {
      if (!row.amount || !row.date) continue
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: row.amount,
          category: row.category,
          description: row.description || null,
          date: row.date,
          tags: row.tags,
          is_recurring: false,
        }),
      })
      if (res.ok) {
        results.push(await res.json())
        imported++
      }
    }

    onImported(results)
    setRows([])
    setFileName('')
    setLoading(false)
    toast.success(`Imported ${imported} expenses`)
  }

  async function handleAiClean() {
    setAiCleaning(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'expense-analyzer',
          expenses: [],
          messages: [
            {
              role: 'user',
              content: `Clean and standardize these expense rows. Fix dates to YYYY-MM-DD format, normalize categories to one of: Food, Transport, Rent, Shopping, Bills, Entertainment, Other. Return ONLY a valid JSON array with objects having keys: date, category, description, amount (number), tags (string array). Raw data:\n${JSON.stringify(rows)}`,
            },
          ],
        }),
      })

      if (!res.body) throw new Error('No response')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
      }

      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON array found')
      const cleaned = JSON.parse(jsonMatch[0]) as RawRow[]
      setRows(cleaned)
      toast.success('AI cleaned the data successfully')
    } catch {
      toast.error('AI cleaning failed. Try importing as-is.')
    } finally {
      setAiCleaning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Import Excel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <div
            className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (file) handleFile(file)
            }}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Drop your .xlsx file here</p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{fileName}</span>
              <span className="text-muted-foreground">· {rows.length} rows detected</span>
            </div>

            {/* Preview */}
            <div className="rounded-lg border border-border overflow-hidden text-xs">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Date</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Category</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Description</th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 4).map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-muted-foreground">{r.date}</td>
                      <td className="px-3 py-2">{r.category}</td>
                      <td className="px-3 py-2">{r.description}</td>
                      <td className="px-3 py-2 text-right tabular-nums">₪{r.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 4 && (
                <p className="text-center text-muted-foreground py-2">+{rows.length - 4} more rows</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAiClean}
                disabled={aiCleaning || loading}
                variant="outline"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {aiCleaning ? 'Cleaning…' : 'AI Clean & Import'}
              </Button>
              <Button
                onClick={() => handleImport(rows)}
                disabled={loading || aiCleaning}
              >
                {loading ? 'Importing…' : `Import ${rows.length} rows`}
              </Button>
              <Button variant="ghost" onClick={() => { setRows([]); setFileName('') }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </CardContent>
    </Card>
  )
}
