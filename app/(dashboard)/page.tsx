import { auth } from '@/auth'
import { createClient } from '@/lib/supabase/server'
import { Expense, Budget, BudgetCategory, CATEGORY_COLORS, Category } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, TrendingUp, Wallet, PiggyBank } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const supabase = await createClient()
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const [{ data: expenses }, { data: budgets }] = await Promise.all([
    supabase
      .from('expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('date', `${year}-${String(month).padStart(2, '0')}-01`)
      .order('date', { ascending: false }),
    supabase
      .from('budgets')
      .select('*, budget_categories(*)')
      .eq('user_id', session.user.id)
      .eq('month', month)
      .eq('year', year)
      .limit(1),
  ])

  const budget = budgets?.[0] as (Budget & { budget_categories: BudgetCategory[] }) | undefined
  const totalSpent = (expenses ?? []).reduce((sum: number, e: Expense) => sum + e.amount, 0)
  const income = budget?.income ?? 0
  const totalLimit = budget?.total_limit ?? 0
  const remaining = totalLimit - totalSpent
  const savingsRate = income > 0 ? Math.max(0, ((income - totalSpent) / income) * 100) : 0

  const monthName = now.toLocaleString('default', { month: 'long' })

  const stats = [
    {
      label: 'Monthly Income',
      value: `₪${income.toLocaleString()}`,
      icon: Wallet,
      sub: income > 0 ? 'Set' : 'Not set',
    },
    {
      label: 'Total Spent',
      value: `₪${totalSpent.toLocaleString()}`,
      icon: TrendingDown,
      sub: `${monthName} ${year}`,
    },
    {
      label: 'Remaining',
      value: `₪${remaining.toLocaleString()}`,
      icon: TrendingUp,
      sub: totalLimit > 0 ? `of ₪${totalLimit.toLocaleString()} budget` : 'No budget set',
    },
    {
      label: 'Savings Rate',
      value: `${savingsRate.toFixed(0)}%`,
      icon: PiggyBank,
      sub: income > 0 ? 'This month' : 'Set income first',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Overview · {monthName} {year}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {session.user.name?.split(' ')[0] ?? 'there'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, sub }) => (
          <Card key={label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent expenses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Recent Expenses</h2>
          <Link href="/budget" className="text-xs text-indigo-600 hover:underline">View all</Link>
        </div>

        {(!expenses || expenses.length === 0) ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No expenses this month.{' '}
              <Link href="/budget" className="text-indigo-600 hover:underline">Add your first one</Link>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Category</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Description</th>
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(expenses as Expense[]).slice(0, 8).map((e, i) => (
                  <tr key={e.id} className={`border-b border-border last:border-0 ${i % 2 ? 'bg-muted/10' : ''}`}>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className="text-white text-xs border-0"
                        style={{ backgroundColor: CATEGORY_COLORS[e.category as Category] }}
                      >
                        {e.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{e.description ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">₪{e.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
