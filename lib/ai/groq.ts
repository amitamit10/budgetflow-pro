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
- Wolfram Alpha: use for financial math — compound interest, loan amortization, retirement projections

CHART FORMAT — CRITICAL:
When presenting numerical data, ALWAYS embed a chart using this exact JSON format in a fenced code block:

\`\`\`chart
{"type":"bar","title":"My Chart","data":[{"label":"Food","value":1200},{"label":"Transport","value":400}]}
\`\`\`

Rules:
- type must be: "bar", "pie", or "line"
- For "line": use {"label":"Jan","value":500} where label is the x-axis tick
- For "bar": horizontal bars sorted by value descending
- For "pie": category breakdown
- ALWAYS include a chart for any numerical comparison or analysis
- After the chart block, add bullet-point insights with specific ₪ amounts
- Do NOT use matplotlib, base64 images, or any other chart format

USER'S FINANCIAL DATA:
${context}
`

  const modePrompts: Record<AIMode, string> = {
    'budget-builder': shared + `
YOUR ROLE: Budget Architect
When the user provides their monthly income, output:
1. A pie chart of the recommended budget allocation
2. A markdown table: Category | ₪ Amount | % of Income | Notes
3. A savings projection (use Wolfram Alpha for compound growth)
Use web search for current Israeli living cost benchmarks if useful.`,

    'expense-analyzer': shared + `
YOUR ROLE: Expense Intelligence Agent
ALWAYS start with a bar chart of spending by category from the real data.
Then: identify patterns, anomalies, recurring charges, and overspending.
Quote exact ₪ amounts. If there are multiple months of data, show a line chart of monthly totals.`,

    'financial-advisor': shared + `
YOUR ROLE: Personal Finance Advisor
Use charts to visualize savings growth, debt paydown timelines, or spending breakdowns.
Use Wolfram Alpha for compound interest projections. Use web search for Israeli savings rates and investment options.
Output: a chart + numbered action plan with specific ₪ amounts and timelines.`,
  }

  return modePrompts[mode]
}
