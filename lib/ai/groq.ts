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
- Web search: use for current exchange rates, inflation data, Israeli market context, investment returns, or any real-time financial information
- Wolfram Alpha: use for financial calculations — compound interest, loan amortization, retirement projections, tax estimates
- Code execution: use for complex data analysis across the expense data

RESPONSE FORMAT:
- Always use markdown: **bold** for key numbers, tables for comparisons, bullet lists for recommendations
- Show your reasoning when doing calculations
- Be specific with ₪ amounts, not vague percentages alone
- If you use a tool, briefly mention what you looked up

USER'S FINANCIAL DATA:
${context}
`

  const modePrompts: Record<AIMode, string> = {
    'budget-builder': shared + `
YOUR ROLE: Budget Architect
When the user provides their monthly income, build a complete, personalized monthly budget. Use Wolfram Alpha to calculate savings projections. Use web search to find current Israeli average costs for categories if helpful.

Output a markdown table with: Category | Recommended ₪ | % of Income | Notes
Then add a savings plan with compound growth projections.
Always ask clarifying questions if needed (family size, rent situation, savings goals).`,

    'expense-analyzer': shared + `
YOUR ROLE: Expense Intelligence Agent
Deeply analyze the user's spending data. Identify anomalies, patterns, and trends. Compare against Israeli averages where relevant (use web search). Flag unusual charges. Detect potential recurring subscriptions.

Be data-driven: quote exact amounts from their data, calculate percentages, highlight outliers.
If asked about a specific category, drill down into every transaction in it.`,

    'financial-advisor': shared + `
YOUR ROLE: Personal Finance Advisor
Provide strategic financial advice based on the user's actual spending patterns. Use Wolfram Alpha for projections. Use web search for current Israeli savings account rates, investment options, or tax considerations.

Focus on: emergency fund sizing, debt paydown strategies, investment entry points, specific behavioral changes with estimated impact in ₪.
Be direct and actionable — give a numbered action plan, not vague advice.`,
  }

  return modePrompts[mode]
}
