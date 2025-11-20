'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateProgress, formatCurrency, getProgressColor } from '@/lib/utils'
import { ArrowLeft, Minus, Plus, Target } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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
	const [showAddMoney, setShowAddMoney] = useState<string | null>(null)
	const [customAmount, setCustomAmount] = useState('')
	const [operationType, setOperationType] = useState<'add' | 'subtract'>('add')
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
					source: 'MANUAL',
				}),
			})

			const data = await response.json()

			if (response.ok && data.notifications && data.notifications.length > 0) {
				const messages: Record<number, string> = {
					20: '🎉 Хорошее начало! Продолжай в том же духе!',
					50: '🔥 Половина пути! Ты молодец!',
					80: '🎯 Почти у цели! Осталось немного!',
					100: '🎊 Поздравляем! Цель достигнута!',
				}

				data.notifications.forEach((milestone: number) => {
					setTimeout(() => alert(messages[milestone]), 100)
				})
			}

			setShowAddMoney(null)
			setCustomAmount('')
			setOperationType('add')
			fetchGoals()
		} catch (error) {
			console.error('Error adding to goal:', error)
			alert('Ошибка при добавлении суммы')
		}
	}

	const subtractFromGoal = async (goalId: string, amount: number) => {
		const goal = goals.find(g => g.id === goalId)
		if (!goal) return

		if (amount > goal.currentAmount) {
			alert('Нельзя вычесть больше, чем накоплено')
			return
		}

		try {
			const response = await fetch('/api/goals/add', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					goalId,
					amount: -amount, // Отрицательная сумма для вычитания
					source: 'MANUAL',
					note: 'Снятие средств',
				}),
			})

			if (response.ok) {
				setShowAddMoney(null)
				setCustomAmount('')
				setOperationType('add')
				fetchGoals()
			} else {
				alert('Ошибка при снятии средств')
			}
		} catch (error) {
			console.error('Error subtracting from goal:', error)
			alert('Ошибка при снятии средств')
		}
	}

	const handleCustomAmount = (goalId: string) => {
		const amount = parseFloat(customAmount)
		if (amount > 0) {
			if (operationType === 'add') {
				addToGoal(goalId, amount)
			} else {
				subtractFromGoal(goalId, amount)
			}
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
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 pb-20'>
			<header className='bg-white dark:bg-gray-800 shadow-sm'>
				<div className='container mx-auto px-4 py-4'>
					<div className='flex justify-between items-center'>
						<Link href='/dashboard'>
							<Button
								variant='ghost'
								size='sm'
								className='dark:text-gray-200 dark:hover:bg-gray-700'
							>
								<ArrowLeft className='h-4 w-4 mr-2' />
								Назад
							</Button>
						</Link>
						<Button onClick={() => setShowNewGoal(true)}>
							<Plus className='h-4 w-4 mr-2' />
							Новая цель
						</Button>
					</div>
				</div>
			</header>

			<main className='container mx-auto px-4 py-8 max-w-4xl'>
				{showNewGoal && (
					<Card className='mb-6 dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader>
							<CardTitle className='dark:text-white'>Новая хотелка</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={createGoal} className='space-y-4'>
								<div>
									<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
										Название
									</label>
									<input
										type='text'
										value={newGoal.name}
										onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
										className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
										placeholder='iPhone 16, Отпуск...'
										required
									/>
								</div>
								<div>
									<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
										Целевая сумма (BYN)
									</label>
									<input
										type='number'
										value={newGoal.targetAmount}
										onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
										className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
										placeholder='3500'
										step='0.01'
										required
									/>
								</div>
								<div>
									<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
										Приоритет
									</label>
									<select
										value={newGoal.priority}
										onChange={e => setNewGoal({ ...newGoal, priority: parseInt(e.target.value) })}
										className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
									>
										<option value={1}>Высокий</option>
										<option value={2}>Средний</option>
										<option value={3}>Низкий</option>
									</select>
								</div>
								<div className='flex gap-2'>
									<Button type='submit' className='flex-1'>
										Создать
									</Button>
									<Button
										type='button'
										variant='outline'
										onClick={() => setShowNewGoal(false)}
										className='dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
									>
										Отмена
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				)}

				{goals.length === 0 ? (
					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardContent className='pt-6 text-center'>
							<div className='text-6xl mb-4'>🎯</div>
							<h2 className='text-2xl font-bold mb-2 text-gray-900 dark:text-white'>Нет целей</h2>
							<p className='text-gray-600 dark:text-gray-300 mb-6'>
								Создайте свою первую финансовую цель
							</p>
							<Button onClick={() => setShowNewGoal(true)}>
								<Plus className='mr-2 h-5 w-5' />
								Создать цель
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className='space-y-4'>
						{goals.map(goal => {
							const progress = calculateProgress(
								Number(goal.currentAmount),
								Number(goal.targetAmount)
							)
							const remaining = Number(goal.targetAmount) - Number(goal.currentAmount)

							return (
								<Card key={goal.id} className='dark:bg-gray-800 dark:border-gray-700'>
									<CardContent className='pt-6'>
										<div className='flex items-start justify-between mb-4'>
											<div>
												<h3 className='text-xl font-bold mb-1 text-gray-900 dark:text-white'>
													{goal.name}
												</h3>
												<p className='text-sm text-gray-600 dark:text-gray-400'>
													{getMilestoneMessage(progress)}
												</p>
											</div>
											<div className='text-right'>
												<div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
													{progress}%
												</div>
											</div>
										</div>

										<div className='mb-4'>
											<div className='flex justify-between text-sm mb-2'>
												<span className='text-gray-600 dark:text-gray-400'>Прогресс</span>
												<span className='text-gray-900 dark:text-white'>
													{formatCurrency(goal.currentAmount)} из{' '}
													{formatCurrency(goal.targetAmount)}
												</span>
											</div>
											<div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4'>
												<div
													className={`h-4 rounded-full transition-all ${getProgressColor(
														progress
													)}`}
													style={{ width: `${Math.min(progress, 100)}%` }}
												/>
											</div>
										</div>

										{remaining > 0 && (
											<div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4'>
												<div className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
													Осталось накопить
												</div>
												<div className='text-2xl font-bold text-gray-900 dark:text-white'>
													{formatCurrency(remaining)}
												</div>
											</div>
										)}

										{goal.status === 'ACTIVE' && (
											<>
												{showAddMoney === goal.id ? (
													<div className='space-y-3'>
														{/* Переключатель типа операции */}
														<div className='flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg'>
															<button
																type='button'
																onClick={() => setOperationType('add')}
																className={`flex-1 py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 ${
																	operationType === 'add'
																		? 'bg-green-500 text-white'
																		: 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
																}`}
															>
																<Plus className='h-4 w-4' />
																Добавить
															</button>
															<button
																type='button'
																onClick={() => setOperationType('subtract')}
																className={`flex-1 py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 ${
																	operationType === 'subtract'
																		? 'bg-red-500 text-white'
																		: 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
																}`}
															>
																<Minus className='h-4 w-4' />
																Снять
															</button>
														</div>

														<div className='flex gap-2'>
															<input
																type='number'
																value={customAmount}
																onChange={e => setCustomAmount(e.target.value)}
																placeholder='Введите сумму'
																className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
																step='0.01'
																min='0.01'
																max={operationType === 'subtract' ? goal.currentAmount : undefined}
																autoFocus
															/>
															<Button
																onClick={() => handleCustomAmount(goal.id)}
																className={
																	operationType === 'subtract' ? 'bg-red-500 hover:bg-red-600' : ''
																}
															>
																{operationType === 'add' ? 'Добавить' : 'Снять'}
															</Button>
														</div>

														{operationType === 'add' && (
															<div className='flex gap-2'>
																{[50, 100, 200, 500].map(amount => (
																	<Button
																		key={amount}
																		variant='outline'
																		size='sm'
																		onClick={() => addToGoal(goal.id, amount)}
																		className='flex-1 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
																	>
																		+{amount}
																	</Button>
																))}
															</div>
														)}

														{operationType === 'subtract' && goal.currentAmount > 0 && (
															<div className='flex gap-2'>
																{[50, 100, 200, 500]
																	.filter(amount => amount <= goal.currentAmount)
																	.map(amount => (
																		<Button
																			key={amount}
																			variant='outline'
																			size='sm'
																			onClick={() => subtractFromGoal(goal.id, amount)}
																			className='flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20'
																		>
																			-{amount}
																		</Button>
																	))}
															</div>
														)}

														<Button
															variant='ghost'
															size='sm'
															onClick={() => {
																setShowAddMoney(null)
																setCustomAmount('')
																setOperationType('add')
															}}
															className='w-full dark:text-gray-200 dark:hover:bg-gray-700'
														>
															Отмена
														</Button>
													</div>
												) : (
													<div className='flex gap-2'>
														<Button
															onClick={() => {
																setShowAddMoney(goal.id)
																setOperationType('add')
															}}
															className='flex-1'
														>
															<Plus className='h-4 w-4 mr-2' />
															Пополнить
														</Button>
														{goal.currentAmount > 0 && (
															<Button
																onClick={() => {
																	setShowAddMoney(goal.id)
																	setOperationType('subtract')
																}}
																variant='outline'
																className='flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20'
															>
																<Minus className='h-4 w-4 mr-2' />
																Снять
															</Button>
														)}
													</div>
												)}
											</>
										)}

										{goal.status === 'COMPLETED' && (
											<div className='bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-center font-semibold'>
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
			<nav className='fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 md:hidden'>
				<div className='flex justify-around py-2'>
					<Link
						href='/dashboard'
						className='flex flex-col items-center p-2 text-gray-600 dark:text-gray-400'
					>
						<Target className='h-6 w-6' />
						<span className='text-xs mt-1'>Главная</span>
					</Link>
					<Link
						href='/transactions'
						className='flex flex-col items-center p-2 text-gray-600 dark:text-gray-400'
					>
						<Plus className='h-6 w-6' />
						<span className='text-xs mt-1'>Траты</span>
					</Link>
					<Link
						href='/goals'
						className='flex flex-col items-center p-2 text-blue-600 dark:text-blue-400'
					>
						<Target className='h-6 w-6' />
						<span className='text-xs mt-1'>Цели</span>
					</Link>
				</div>
			</nav>
		</div>
	)
}
