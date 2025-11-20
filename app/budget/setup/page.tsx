'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentMonthYear, getMonthName } from '@/lib/utils'

const DEFAULT_CATEGORIES = [
  { name: 'Еда и продукты', icon: '🍔', color: '#f59e0b', percentage: 30 },
  { name: 'Транспорт', icon: '🚗', color: '#3b82f6', percentage: 10 },
  { name: 'Жильё', icon: '🏠', color: '#10b981', percentage: 25 },
  { name: 'Развлечения', icon: '🎉', color: '#8b5cf6', percentage: 10 },
  { name: 'Одежда', icon: '👕', color: '#ec4899', percentage: 5 },
  { name: 'Накопления', icon: '💰', color: '#14b8a6', percentage: 15 },
  { name: 'Здоровье', icon: '💊', color: '#ef4444', percentage: 5 },
]

export default function BudgetSetupPage() {
  const router = useRouter()
  const { month, year } = getCurrentMonthYear()
  
  const [totalAmount, setTotalAmount] = useState('')
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTotalAmountChange = (value: string) => {
    setTotalAmount(value)
    const amount = parseFloat(value) || 0
    
    // Автоматически распределяем по категориям
    setCategories(cats =>
      cats.map(cat => ({
        ...cat,
        budgetAmount: Math.round((amount * cat.percentage) / 100),
      }))
    )
  }

  const handleCategoryAmountChange = (index: number, value: string) => {
    const amount = parseFloat(value) || 0
    setCategories(cats =>
      cats.map((cat, i) => (i === index ? { ...cat, budgetAmount: amount } : cat))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const total = parseFloat(totalAmount)
    if (!total || total <= 0) {
      setError('Введите корректную сумму бюджета')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          year,
          totalAmount: total,
          categories: categories.map(cat => ({
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            budgetAmount: cat.budgetAmount || 0,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания бюджета')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const categoriesTotal = categories.reduce((sum, cat) => sum + (cat.budgetAmount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Настройка бюджета на {getMonthName(month)} {year}
            </CardTitle>
            <CardDescription>
              Укажите общую сумму и распределите её по категориям
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Общий бюджет на месяц (BYN)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  placeholder="2000"
                  value={totalAmount}
                  onChange={(e) => handleTotalAmountChange(e.target.value)}
                  required
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Распределение по категориям</h3>
                {categories.map((category, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`cat-${index}`}>{category.name}</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          id={`cat-${index}`}
                          type="number"
                          value={category.budgetAmount || ''}
                          onChange={(e) => handleCategoryAmountChange(index, e.target.value)}
                          placeholder="0"
                          step="0.01"
                          min="0"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {category.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Итого распределено:</span>
                  <span className="text-lg font-bold">{categoriesTotal.toFixed(2)} BYN</span>
                </div>
                {totalAmount && Math.abs(categoriesTotal - parseFloat(totalAmount)) > 0.01 && (
                  <p className="text-sm text-orange-600 mt-2">
                    Разница: {(parseFloat(totalAmount) - categoriesTotal).toFixed(2)} BYN
                  </p>
                )}
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Сохранение...' : 'Сохранить бюджет'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
