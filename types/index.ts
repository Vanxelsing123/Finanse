export interface User {
  id: string
  name?: string | null
  email: string
  currency: string
  monthStartDay: number
}

export interface Budget {
  id: string
  userId: string
  month: number
  year: number
  totalAmount: number
  categories: Category[]
}

export interface Category {
  id: string
  budgetId: string
  name: string
  icon: string
  color: string
  budgetAmount: number
  spent?: number
}

export interface Transaction {
  id: string
  userId: string
  categoryId?: string | null
  category?: Category | null
  amount: number
  description?: string | null
  date: Date
  type: 'EXPENSE' | 'INCOME'
}

export interface Goal {
  id: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  imageUrl?: string | null
  priority: number
  deadline?: Date | null
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  percentage?: number
  transactions?: GoalTransaction[]
}

export interface GoalTransaction {
  id: string
  goalId: string
  amount: number
  date: Date
  source: 'MANUAL' | 'AUTO' | 'FROM_SAVINGS'
  note?: string | null
}

export interface Insight {
  id: string
  userId: string
  type: 'COMPARISON' | 'WARNING' | 'PATTERN' | 'ACHIEVEMENT' | 'FORECAST' | 'SUGGESTION'
  message: string
  isRead: boolean
  createdAt: Date
}
