'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { calculatePercentage, formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/utils'
import { ArrowRight, Plus, Target, TrendingUp, Wallet } from 'lucide-react'
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
			// Получаем бюджет
			const budgetRes = await fetch(`/api/budget?month=${month}&year=${year}`)
			const budgetData = await budgetRes.json()
			setBudget(budgetData.budget)

			// Получаем цели
			const goalsRes = await fetch('/api/goals?status=ACTIVE')
			const goalsData = await goalsRes.json()
			setGoals(goalsData.goals || [])
		} catch (error) {
			console.error('Error fetching data:', error)
		} finally {
			setLoading(false)
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
											<div key={category.id} className='space-y-2'>
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
								<Card className='hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750'>
									<CardHeader className='text-center'>
										<Plus className='h-12 w-12 text-primary mx-auto mb-2' />
										<CardTitle className='dark:text-white'>Добавить трату</CardTitle>
									</CardHeader>
								</Card>
							</Link>

							<Link href='/goals'>
								<Card className='hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750'>
									<CardHeader className='text-center'>
										<Target className='h-12 w-12 text-primary mx-auto mb-2' />
										<CardTitle className='dark:text-white'>Мои цели</CardTitle>
									</CardHeader>
								</Card>
							</Link>

							<Link href='/analytics'>
								<Card className='hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750'>
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
