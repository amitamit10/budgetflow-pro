'use client'

import { CATEGORY_COLORS, Category } from '@/types'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface BudgetLimitCardProps {
  category: Category
  spent: number
  limit: number
}

export function BudgetLimitCard({ category, spent, limit }: BudgetLimitCardProps) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
  const over = spent > limit

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: CATEGORY_COLORS[category] }}
          />
          {category}
        </span>
        <span className={cn('tabular-nums text-xs', over ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
          ₪{spent.toFixed(0)} / ₪{limit.toFixed(0)}
        </span>
      </div>
      <div className="relative">
        <Progress
          value={pct}
          className={cn(
            'h-1.5',
            over ? '[&>div]:bg-red-500' : pct >= 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-indigo-500'
          )}
        />
      </div>
      {over && (
        <p className="text-xs text-red-600">Over by ₪{(spent - limit).toFixed(0)}</p>
      )}
    </div>
  )
}
