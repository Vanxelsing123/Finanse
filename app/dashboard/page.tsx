'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { calculatePercentage, formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/utils'
import { ArrowRight, Edit2, Plus, Target, TrendingUp, Wallet, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Category {
	id: string
	name: string
	icon: string
	color: string
	budgetAmount: number
	spent: number
}

interface Budget {
	id: string
	month: number
	year: number
	totalAmount: number
	categories: Category[]
}

interface Goal {
	id: string
	name: string
	targetAmount: number
	currentAmount: number
	percentage: number
}

export default function DashboardPage() {
	const { data: session, status } = useSession()
	const router = useRouter()
	const [budget, setBudget] = useState<Budget | null>(null)
	const [goals, setGoals] = useState<Goal[]>([])
	const [loading, setLoading] = useState(true)
	const [editingCategory, setEditingCategory] = useState<Category | null>(null)
	const [newBudgetAmount, setNewBudgetAmount] = useState('')
	const [newSpentAmount, setNewSpentAmount] = useState('')

	const { month, year } = getCurrentMonthYear()

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/auth/login')
		}
	}, [status, router])

	useEffect(() => {
		if (status === 'authenticated') {
			fetchData()
		}
	}, [status])

	const fetchData = async () => {
		try {
			const budgetRes = await fetch(`/api/budget?month=${month}&year=${year}`)
			const budgetData = await budgetRes.json()
			setBudget(budgetData.budget)

			const goalsRes = await fetch('/api/goals?status=ACTIVE')
			const goalsData = await goalsRes.json()
			setGoals(goalsData.goals || [])
		} catch (error) {
			console.error('Error fetching data:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleEditCategory = (category: Category) => {
		setEditingCategory(category)
		setNewBudgetAmount(category.budgetAmount.toString())
		setNewSpentAmount(category.spent.toString())
	}

	const handleUpdateCategory = async () => {
		if (!editingCategory) return

		try {
			const response = await fetch('/api/budget/category', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					categoryId: editingCategory.id,
					budgetAmount: newBudgetAmount ? parseFloat(newBudgetAmount) : undefined,
					spent: newSpentAmount ? parseFloat(newSpentAmount) : undefined,
				}),
			})

			if (response.ok) {
				setEditingCategory(null)
				setNewBudgetAmount('')
				setNewSpentAmount('')
				fetchData()
			} else {
				const data = await response.json()
				alert(data.error || 'Ошибка при обновлении')
			}
		} catch (error) {
			console.error('Error updating category:', error)
			alert('Ошибка при обновлении категории')
		}
	}

	if (status === 'loading' || loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
					<p className='mt-4 text-gray-600 dark:text-gray-300'>Загрузка...</p>
				</div>
			</div>
		)
	}

	const totalSpent = budget?.categories.reduce((sum, cat) => sum + cat.spent, 0) || 0
	const totalBudget = Number(budget?.totalAmount) || 0
	const remaining = totalBudget - totalSpent
	const spentPercentage = calculatePercentage(totalSpent, totalBudget)

	return (
		<div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
			{/* Модальное окно редактирования */}
			{editingCategory && (
				<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
					<Card className='w-full max-w-md dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<CardTitle className='dark:text-white'>Редактировать категорию</CardTitle>
								<Button
									variant='ghost'
									size='icon'
									onClick={() => {
										setEditingCategory(null)
										setNewBudgetAmount('')
										setNewSpentAmount('')
									}}
									className='dark:hover:bg-gray-700'
								>
									<X className='h-4 w-4' />
								</Button>
							</div>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'>
								<div
									className='w-12 h-12 rounded-full flex items-center justify-center text-2xl'
									style={{ backgroundColor: `${editingCategory.color}20` }}
								>
									{editingCategory.icon}
								</div>
								<div>
									<div className='font-medium text-gray-900 dark:text-white'>
										{editingCategory.name}
									</div>
									<div className='text-sm text-gray-600 dark:text-gray-400'>
										Текущий остаток:{' '}
										{formatCurrency(editingCategory.budgetAmount - editingCategory.spent)}
									</div>
								</div>
							</div>

							<div>
								<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
									Бюджет категории (BYN)
								</label>
								<input
									type='number'
									value={newBudgetAmount}
									onChange={e => setNewBudgetAmount(e.target.value)}
									className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
									placeholder='1000'
									step='0.01'
									min='0'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
									Потрачено (BYN)
								</label>
								<input
									type='number'
									value={newSpentAmount}
									onChange={e => setNewSpentAmount(e.target.value)}
									className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
									placeholder='500'
									step='0.01'
									min='0'
								/>
								<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
									Внимание: это изменит только отображаемую сумму, не повлияет на транзакции
								</p>
							</div>

							<div className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg'>
								<div className='text-sm text-gray-700 dark:text-gray-300'>
									<div className='flex justify-between mb-1'>
										<span>Новый бюджет:</span>
										<span className='font-semibold'>
											{formatCurrency(parseFloat(newBudgetAmount) || 0)}
										</span>
									</div>
									<div className='flex justify-between mb-1'>
										<span>Потрачено:</span>
										<span className='font-semibold'>
											{formatCurrency(parseFloat(newSpentAmount) || 0)}
										</span>
									</div>
									<div className='flex justify-between border-t dark:border-gray-600 pt-1 mt-1'>
										<span>Останется:</span>
										<span
											className={`font-semibold ${
												(parseFloat(newBudgetAmount) || 0) - (parseFloat(newSpentAmount) || 0) >= 0
													? 'text-green-600 dark:text-green-400'
													: 'text-red-600 dark:text-red-400'
											}`}
										>
											{formatCurrency(
												(parseFloat(newBudgetAmount) || 0) - (parseFloat(newSpentAmount) || 0)
											)}
										</span>
									</div>
								</div>
							</div>

							<div className='flex gap-2'>
								<Button
									onClick={handleUpdateCategory}
									className='flex-1'
									disabled={!newBudgetAmount && !newSpentAmount}
								>
									Сохранить
								</Button>
								<Button
									variant='outline'
									onClick={() => {
										setEditingCategory(null)
										setNewBudgetAmount('')
										setNewSpentAmount('')
									}}
									className='flex-1 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
								>
									Отмена
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Header */}
			<header className='bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10'>
				<div className='container mx-auto px-4 py-4'>
					<div className='flex justify-between items-center'>
						<div className='flex items-center space-x-2'>
							<Wallet className='h-6 w-6 text-primary' />
							<span className='text-xl font-bold text-gray-900 dark:text-white'>
								Finance Tracker
							</span>
						</div>
						<div className='flex items-center space-x-4'>
							<span className='text-sm text-gray-600 dark:text-gray-300'>
								{session?.user?.name || session?.user?.email}
							</span>
							<Button
								variant='ghost'
								size='sm'
								className='dark:text-gray-200 dark:hover:bg-gray-700'
								onClick={() => {
									window.location.href = '/api/auth/signout'
								}}
							>
								Выход
							</Button>
						</div>
					</div>
				</div>
			</header>

			<div className='container mx-auto px-4 py-6 space-y-6'>
				{/* Заголовок месяца */}
				<div className='flex justify-between items-center'>
					<div>
						<h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
							{getMonthName(month)} {year}
						</h1>
						<p className='text-gray-600 dark:text-gray-300'>Ваши финансы</p>
					</div>
					{!budget && (
						<Link href='/budget/setup'>
							<Button>
								<Plus className='h-4 w-4 mr-2' />
								Настроить бюджет
							</Button>
						</Link>
					)}
				</div>

				{budget ? (
					<>
						{/* Общая статистика */}
						<div className='grid md:grid-cols-3 gap-4'>
							<Card className='dark:bg-gray-800 dark:border-gray-700'>
								<CardHeader className='pb-2'>
									<CardDescription className='dark:text-gray-400'>Всего бюджет</CardDescription>
									<CardTitle className='text-2xl dark:text-white'>
										{formatCurrency(totalBudget)}
									</CardTitle>
								</CardHeader>
							</Card>

							<Card className='dark:bg-gray-800 dark:border-gray-700'>
								<CardHeader className='pb-2'>
									<CardDescription className='dark:text-gray-400'>Потрачено</CardDescription>
									<CardTitle className='text-2xl text-red-600 dark:text-red-400'>
										{formatCurrency(totalSpent)}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<Progress value={spentPercentage} className='h-2' />
									<p className='text-sm text-gray-600 dark:text-gray-400 mt-2'>
										{spentPercentage}% от бюджета
									</p>
								</CardContent>
							</Card>

							<Card className='dark:bg-gray-800 dark:border-gray-700'>
								<CardHeader className='pb-2'>
									<CardDescription className='dark:text-gray-400'>Осталось</CardDescription>
									<CardTitle className='text-2xl text-green-600 dark:text-green-400'>
										{formatCurrency(remaining)}
									</CardTitle>
								</CardHeader>
							</Card>
						</div>

						{/* Категории */}
						<Card className='dark:bg-gray-800 dark:border-gray-700'>
							<CardHeader>
								<div className='flex justify-between items-center'>
									<CardTitle className='dark:text-white'>Категории расходов</CardTitle>
									<Link href='/transactions/new'>
										<Button size='sm'>
											<Plus className='h-4 w-4 mr-2' />
											Добавить трату
										</Button>
									</Link>
								</div>
								<CardDescription className='dark:text-gray-400'>
									Нажмите на категорию, чтобы изменить бюджет или расходы
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									{budget.categories.map(category => {
										const percentage = calculatePercentage(
											category.spent,
											Number(category.budgetAmount)
										)
										const isOverBudget = category.spent > Number(category.budgetAmount)

										return (
											<div
												key={category.id}
												className='space-y-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors'
												onClick={() => handleEditCategory(category)}
											>
												<div className='flex justify-between items-center'>
													<div className='flex items-center space-x-3'>
														<div
															className='w-10 h-10 rounded-full flex items-center justify-center text-xl'
															style={{ backgroundColor: `${category.color}20` }}
														>
															{category.icon}
														</div>
														<div>
															<p className='font-medium text-gray-900 dark:text-white'>
																{category.name}
															</p>
															<p className='text-sm text-gray-600 dark:text-gray-400'>
																{formatCurrency(category.spent)} /{' '}
																{formatCurrency(category.budgetAmount)}
															</p>
														</div>
													</div>
													<div className='flex items-center gap-3'>
														<div className='text-right'>
															<p
																className={`font-semibold ${
																	isOverBudget
																		? 'text-red-600 dark:text-red-400'
																		: 'text-green-600 dark:text-green-400'
																}`}
															>
																{formatCurrency(Number(category.budgetAmount) - category.spent)}
															</p>
															<p className='text-sm text-gray-600 dark:text-gray-400'>
																{percentage}%
															</p>
														</div>
														<Edit2 className='h-4 w-4 text-gray-400' />
													</div>
												</div>
												<Progress
													value={Math.min(percentage, 100)}
													className={`h-2 ${isOverBudget ? 'bg-red-100 dark:bg-red-900' : ''}`}
												/>
											</div>
										)
									})}
								</div>
							</CardContent>
						</Card>

						{/* Цели */}
						{goals.length > 0 && (
							<Card className='dark:bg-gray-800 dark:border-gray-700'>
								<CardHeader>
									<div className='flex justify-between items-center'>
										<CardTitle className='dark:text-white'>Мои цели</CardTitle>
										<Link href='/goals'>
											<Button
												variant='ghost'
												size='sm'
												className='dark:text-gray-200 dark:hover:bg-gray-700'
											>
												Все цели
												<ArrowRight className='h-4 w-4 ml-2' />
											</Button>
										</Link>
									</div>
								</CardHeader>
								<CardContent>
									<div className='space-y-4'>
										{goals.slice(0, 3).map(goal => (
											<div key={goal.id} className='space-y-2'>
												<div className='flex justify-between items-center'>
													<div>
														<p className='font-medium text-gray-900 dark:text-white'>{goal.name}</p>
														<p className='text-sm text-gray-600 dark:text-gray-400'>
															{formatCurrency(goal.currentAmount)} /{' '}
															{formatCurrency(goal.targetAmount)}
														</p>
													</div>
													<p className='font-semibold text-primary'>{goal.percentage}%</p>
												</div>
												<Progress value={goal.percentage} className='h-2' />
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Быстрые действия */}
						<div className='grid md:grid-cols-3 gap-4'>
							<Link href='/transactions/new'>
								<Card className='hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700'>
									<CardHeader className='text-center'>
										<Plus className='h-12 w-12 text-primary mx-auto mb-2' />
										<CardTitle className='dark:text-white'>Добавить трату</CardTitle>
									</CardHeader>
								</Card>
							</Link>

							<Link href='/goals'>
								<Card className='hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700'>
									<CardHeader className='text-center'>
										<Target className='h-12 w-12 text-primary mx-auto mb-2' />
										<CardTitle className='dark:text-white'>Мои цели</CardTitle>
									</CardHeader>
								</Card>
							</Link>

							<Link href='/analytics'>
								<Card className='hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700'>
									<CardHeader className='text-center'>
										<TrendingUp className='h-12 w-12 text-primary mx-auto mb-2' />
										<CardTitle className='dark:text-white'>Аналитика</CardTitle>
									</CardHeader>
								</Card>
							</Link>
						</div>
					</>
				) : (
					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader>
							<CardTitle className='dark:text-white'>Начните с настройки бюджета</CardTitle>
							<CardDescription className='dark:text-gray-300'>
								Создайте месячный бюджет и начните контролировать свои расходы
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href='/budget/setup'>
								<Button size='lg'>
									<Plus className='h-4 w-4 mr-2' />
									Настроить бюджет
								</Button>
							</Link>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	)
}
