import Groq from 'groq-sdk'
import { AIMode, Expense } from '@/types'

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export const MODEL = 'groq/compound'

function buildExpenseContext(expenses: Expense[]): string {
  if (expenses.length === 0) return 'No expense data available yet.'

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})
  const topCategory = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0]

  const summary = `Total spent: ₪${total.toLocaleString()} across ${expenses.length} transactions.
Top category: ${topCategory?.[0]} (₪${topCategory?.[1]?.toLocaleString()}).
By category: ${Object.entries(byCategory).map(([k, v]) => `${k}: ₪${v.toLocaleString()}`).join(', ')}.`

  const recent = expenses
    .slice(0, 30)
    .map((e) => `${e.date} | ${e.category} | ₪${e.amount} | ${e.description}${e.tags?.length ? ` [${e.tags.join(',')}]` : ''}`)
    .join('\n')

  return `${summary}\n\nRecent transactions:\n${recent}`
}

export function buildSystemPrompt(mode: AIMode, expenses: Expense[]): string {
  const context = buildExpenseContext(expenses)

  const shared = `You are BudgetFlow AI — an expert personal finance agent built into BudgetFlow Pro, a financial management app used in Israel.

TOOLS AVAILABLE TO YOU:
- Web search: use for current exchange rates, inflation, Israeli market context, savings rates
- Wolfram Alpha: use for financial calculations — compound interest, loan amortization, retirement projections
- Code execution (Python/matplotlib): use to generate charts and graphs — ALWAYS use this when analyzing data

VISUAL-FIRST RESPONSE RULES (CRITICAL):
1. ALWAYS generate a chart using Python/matplotlib when presenting any numerical data or analysis
2. Use matplotlib with a clean style: plt.style.use('seaborn-v0_8-whitegrid'), indigo/purple color palette (#6366f1, #8b5cf6, #a78bfa, #c4b5fd)
3. Set figure size to (10, 5) or (8, 5) for good readability
4. Always call plt.tight_layout() and save with plt.savefig(output, format='png', dpi=150, bbox_inches='tight')
5. Embed the chart inline with markdown: ![Chart Title](data:image/png;base64,BASE64_HERE)
6. After the chart, add a brief text summary with key insights in bullet points
7. Use markdown tables ONLY as a supplement to charts, not instead of them

USER'S FINANCIAL DATA:
${context}
`

  const modePrompts: Record<AIMode, string> = {
    'budget-builder': shared + `
YOUR ROLE: Budget Architect
When the user provides their monthly income, build a complete personalized budget AND generate a pie chart of the budget allocation using matplotlib.
Use Wolfram Alpha to calculate savings projections. Use web search for current Israeli living costs if helpful.

Always output:
1. A pie chart of budget allocation (matplotlib)
2. A markdown table: Category | Recommended ₪ | % of Income
3. A savings projection with compound growth`,

    'expense-analyzer': shared + `
YOUR ROLE: Expense Intelligence Agent
ALWAYS start your analysis by generating a chart of the spending data using matplotlib.
For category breakdowns use a horizontal bar chart. For trends over time use a line chart. For comparisons use grouped bars.

Deep-dive: identify anomalies, patterns, recurring charges, overspending categories.
Quote exact ₪ amounts from the real data. Flag any outliers.`,

    'financial-advisor': shared + `
YOUR ROLE: Personal Finance Advisor
Use charts to visualize savings projections, debt paydown timelines, or spending breakdowns.
Use Wolfram Alpha for compound interest and retirement projections. Use web search for Israeli savings rates, ETF options, tax considerations.

Always produce:
1. A chart visualizing the key insight or projection
2. A numbered action plan with specific ₪ amounts and timelines`,
  }

  return modePrompts[mode]
}
