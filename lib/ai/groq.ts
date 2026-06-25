import Groq from 'groq-sdk'
import { AIMode, Expense } from '@/types'

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export const MODEL = 'llama-3.1-70b-versatile'

export function buildSystemPrompt(mode: AIMode, expenses: Expense[]): string {
  const expenseSummary = JSON.stringify(
    expenses.map((e) => ({
      date: e.date,
      category: e.category,
      description: e.description,
      amount: e.amount,
      tags: e.tags,
    })),
    null,
    2
  )

  const base = `You are BudgetFlow AI, a personal finance assistant. You help users understand and improve their financial habits. Always use Israeli Shekel (₪) as the currency. Be concise, practical, and encouraging. The user's current expense data:\n\n${expenseSummary}\n\n`

  const prompts: Record<AIMode, string> = {
    'budget-builder': base + `Your role is Budget Builder. When the user provides their monthly income, create a detailed budget breakdown by category (Food, Transport, Rent, Shopping, Bills, Entertainment, Other) with specific ₪ limits and a savings plan. Format the output clearly with categories, amounts, and brief reasoning.`,
    'expense-analyzer': base + `Your role is Expense Analyzer. Answer the user's questions about their spending data. Identify patterns, highlight overspending categories, compare months, and give specific actionable insights based on the actual data provided.`,
    'financial-advisor': base + `Your role is Financial Advisor. Provide personalized saving strategies, spending optimization tips, and behavioral improvements based on the user's actual expense patterns. Be specific and motivating.`,
  }

  return prompts[mode]
}
