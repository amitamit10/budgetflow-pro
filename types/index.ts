export type Category =
  | 'Food'
  | 'Transport'
  | 'Rent'
  | 'Shopping'
  | 'Bills'
  | 'Entertainment'
  | 'Other'

export const CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Rent',
  'Shopping',
  'Bills',
  'Entertainment',
  'Other',
]

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#f97316',
  Transport: '#3b82f6',
  Rent: '#8b5cf6',
  Shopping: '#ec4899',
  Bills: '#14b8a6',
  Entertainment: '#f59e0b',
  Other: '#6b7280',
}

export interface Expense {
  id: string
  user_id: string
  amount: number
  category: Category
  description: string | null
  date: string
  tags: string[]
  is_recurring: boolean
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  month: number
  year: number
  income: number
  total_limit: number
}

export interface BudgetCategory {
  id: string
  budget_id: string
  category: Category
  limit_amount: number
}

export interface Template {
  id: string
  name: string
  type: 'student' | 'family' | 'savings' | 'minimal'
  categories: { category: Category; limit_percent: number }[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type AIMode = 'budget-builder' | 'expense-analyzer' | 'financial-advisor'
