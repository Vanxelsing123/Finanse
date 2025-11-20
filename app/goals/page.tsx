'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, calculateProgress, getProgressColor } from '@/lib/utils'
import { ArrowLeft, Plus, Target } from 'lucide-react'
import Link from 'next/link'

interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  imageUrl?: string
  priority: number
  deadline?: string
  status: string
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    priority: 1,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals')
      const data = await response.json()
      setGoals(data.goals || [])
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGoal.name,
          targetAmount: parseFloat(newGoal.targetAmount),
          priority: newGoal.priority,
        }),
      })

      if (response.ok) {
        setShowNewGoal(false)
        setNewGoal({ name: '', targetAmount: '', priority: 1 })
        fetchGoals()
      }
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  const addToGoal = async (goalId: string, amount: number) => {
    try {
      const response = await fetch('/api/goals/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          amount,
          source: 'manual',
        }),
      })

      const data = await response.json()

      if (response.ok && data.notifications && data.notifications.length > 0) {
        // Показываем уведомления о достижении вех
        data.notifications.forEach((milestone: number) => {
          const messages: Record<number, string> = {
            20: 'Хорошее начало! 🎉',
            50: 'Половина пути! 🔥',
            80: 'Почти у цели! 🎯',
            100: 'Цель достигнута! 🎊',
          }
          alert(messages[milestone])
        })
      }

      fetchGoals()
    } catch (error) {
      console.error('Error adding to goal:', error)
    }
  }

  const getMilestoneMessage = (percentage: number) => {
    if (percentage >= 100) return '🎊 Достигнута!'
    if (percentage >= 80) return '🎯 Почти у цели!'
    if (percentage >= 50) return '🔥 Половина пути!'
    if (percentage >= 20) return '🎉 Хорошее начало!'
    return '💪 Начни копить!'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-20">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
            </Link>
            <Button onClick={() => setShowNewGoal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Новая цель
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {showNewGoal && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Новая хотелка</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createGoal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Название</label>
                  <input
                    type="text"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="iPhone 16, Отпуск..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Целевая сумма (BYN)</label>
                  <input
                    type="number"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="3500"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Приоритет</label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal({ ...newGoal, priority: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={1}>Высокий</option>
                    <option value={2}>Средний</option>
                    <option value={3}>Низкий</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Создать</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewGoal(false)}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {goals.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold mb-2">Нет целей</h2>
              <p className="text-gray-600 mb-6">
                Создайте свою первую финансовую цель
              </p>
              <Button onClick={() => setShowNewGoal(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Создать цель
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = calculateProgress(
                Number(goal.currentAmount),
                Number(goal.targetAmount)
              )
              const remaining = Number(goal.targetAmount) - Number(goal.currentAmount)

              return (
                <Card key={goal.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{goal.name}</h3>
                        <p className="text-sm text-gray-600">
                          {getMilestoneMessage(progress)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {progress}%
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Прогресс</span>
                        <span>
                          {formatCurrency(goal.currentAmount)} из{' '}
                          {formatCurrency(goal.targetAmount)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full transition-all ${getProgressColor(
                            progress
                          )}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {remaining > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="text-sm text-gray-600 mb-1">
                          Осталось накопить
                        </div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(remaining)}
                        </div>
                      </div>
                    )}

                    {goal.status === 'active' && (
                      <div className="flex gap-2">
                        {[50, 100, 200, 500].map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => addToGoal(goal.id, amount)}
                            className="flex-1"
                          >
                            +{amount}
                          </Button>
                        ))}
                      </div>
                    )}

                    {goal.status === 'completed' && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center font-semibold">
                        ✅ Цель достигнута! Поздравляем!
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Нижняя навигация */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
        <div className="flex justify-around py-2">
          <Link href="/dashboard" className="flex flex-col items-center p-2 text-gray-600">
            <Target className="h-6 w-6" />
            <span className="text-xs mt-1">Главная</span>
          </Link>
          <Link href="/transactions" className="flex flex-col items-center p-2 text-gray-600">
            <Plus className="h-6 w-6" />
            <span className="text-xs mt-1">Траты</span>
          </Link>
          <Link href="/goals" className="flex flex-col items-center p-2 text-blue-600">
            <Target className="h-6 w-6" />
            <span className="text-xs mt-1">Цели</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
