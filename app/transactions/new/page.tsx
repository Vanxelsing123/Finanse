'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getCurrentMonth } from '@/lib/utils'

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export default function NewTransactionPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { month, year } = getCurrentMonth()
      const response = await fetch(`/api/budget?month=${month}&year=${year}`)
      const data = await response.json()
      if (data.budget?.categories) {
        setCategories(data.budget.categories)
        if (data.budget.categories.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: data.budget.categories[0].id }))
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'Ошибка при добавлении траты')
      }
    } catch (error) {
      setError('Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [10, 20, 50, 100, 200, 500]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Добавить трату</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Сначала создайте бюджет с категориями
                </p>
                <Link href="/budget/setup">
                  <Button>Создать бюджет</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Сумма */}
                <div>
                  <label className="block text-sm font-medium mb-2">Сумма (BYN)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-4 py-3 border rounded-lg text-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none text-center"
                    placeholder="0.00"
                    step="0.01"
                    required
                    autoFocus
                  />
                  
                  {/* Быстрые суммы */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            amount: amount.toString(),
                          }))
                        }
                      >
                        {amount}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Категория */}
                <div>
                  <label className="block text-sm font-medium mb-3">Категория</label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, categoryId: category.id })
                        }
                        className={`p-4 border-2 rounded-lg transition ${
                          formData.categoryId === category.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{category.icon}</div>
                        <div className="text-sm font-medium">{category.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Описание */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Описание (опционально)
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Кофе в кафе..."
                  />
                </div>

                {/* Дата */}
                <div>
                  <label className="block text-sm font-medium mb-2">Дата</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || !formData.categoryId}
                >
                  {loading ? 'Добавление...' : 'Добавить трату'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
