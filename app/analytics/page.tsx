'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/utils'
import { ArrowLeft, Calendar, PieChart, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface MonthlyData {
	month: number
	year: number
	totalIncome: number
	totalExpense: number
	balance: number
	categories: {
		name: string
		icon: string
		color: string
		amount: number
		percentage: number
	}[]
}

interface Transaction {
	id: string
	amount: number
	date: string
	type: 'INCOME' | 'EXPENSE'
	category: {
		name: string
		icon: string
		color: string
	}
}

export default function AnalyticsPage() {
	const router = useRouter()
	const [selectedMonth, setSelectedMonth] = useState(() => {
		const { month, year } = getCurrentMonthYear()
		return { month, year }
	})
	const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null)
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchAnalytics()
	}, [selectedMonth])

	const fetchAnalytics = async () => {
		try {
			setLoading(true)

			// Получаем транзакции за месяц
			const response = await fetch(
				`/api/transactions?month=${selectedMonth.month}&year=${selectedMonth.year}`
			)
			const data = await response.json()
			const allTransactions = data.transactions || []

			setTransactions(allTransactions)

			// Вычисляем аналитику
			const income = allTransactions
				.filter((t: Transaction) => t.type === 'INCOME')
				.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)

			const expense = allTransactions
				.filter((t: Transaction) => t.type === 'EXPENSE')
				.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)

			// Группируем по категориям
			const categoryMap = new Map<
				string,
				{ name: string; icon: string; color: string; amount: number }
			>()

			allTransactions
				.filter((t: Transaction) => t.type === 'EXPENSE' && t.category)
				.forEach((t: Transaction) => {
					const key = t.category.name
					const existing = categoryMap.get(key) || {
						name: t.category.name,
						icon: t.category.icon,
						color: t.category.color,
						amount: 0,
					}
					existing.amount += Number(t.amount)
					categoryMap.set(key, existing)
				})

			const categories = Array.from(categoryMap.values())
				.map(cat => ({
					...cat,
					percentage: expense > 0 ? Math.round((cat.amount / expense) * 100) : 0,
				}))
				.sort((a, b) => b.amount - a.amount)

			setMonthlyData({
				month: selectedMonth.month,
				year: selectedMonth.year,
				totalIncome: income,
				totalExpense: expense,
				balance: income - expense,
				categories,
			})
		} catch (error) {
			console.error('Error fetching analytics:', error)
		} finally {
			setLoading(false)
		}
	}

	const changeMonth = (delta: number) => {
		let newMonth = selectedMonth.month + delta
		let newYear = selectedMonth.year

		if (newMonth > 12) {
			newMonth = 1
			newYear++
		} else if (newMonth < 1) {
			newMonth = 12
			newYear--
		}

		setSelectedMonth({ month: newMonth, year: newYear })
	}

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		)
	}

	const topCategories = monthlyData?.categories.slice(0, 5) || []
	const totalExpense = monthlyData?.totalExpense || 0

	return (
		<div className='min-h-screen bg-gray-50 dark:bg-gray-900 pb-20'>
			<header className='bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10'>
				<div className='container mx-auto px-4 py-4'>
					<div className='flex items-center justify-between'>
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
						<h1 className='text-xl font-bold text-gray-900 dark:text-white'>Аналитика</h1>
						<div className='w-20'></div>
					</div>
				</div>
			</header>

			<main className='container mx-auto px-4 py-6 max-w-4xl space-y-6'>
				{/* Переключатель месяца */}
				<Card className='dark:bg-gray-800 dark:border-gray-700'>
					<CardContent className='pt-6'>
						<div className='flex items-center justify-between'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => changeMonth(-1)}
								className='dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
							>
								←
							</Button>
							<div className='text-center'>
								<div className='text-2xl font-bold text-gray-900 dark:text-white'>
									{getMonthName(selectedMonth.month)} {selectedMonth.year}
								</div>
								<div className='text-sm text-gray-600 dark:text-gray-400'>
									{transactions.length} транзакций
								</div>
							</div>
							<Button
								variant='outline'
								size='sm'
								onClick={() => changeMonth(1)}
								className='dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
							>
								→
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Общая статистика */}
				<div className='grid md:grid-cols-3 gap-4'>
					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader className='pb-2'>
							<CardDescription className='flex items-center gap-2 dark:text-gray-400'>
								<TrendingUp className='h-4 w-4 text-green-600' />
								Доходы
							</CardDescription>
							<CardTitle className='text-2xl text-green-600 dark:text-green-400'>
								+{formatCurrency(monthlyData?.totalIncome || 0)}
							</CardTitle>
						</CardHeader>
					</Card>

					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader className='pb-2'>
							<CardDescription className='flex items-center gap-2 dark:text-gray-400'>
								<TrendingDown className='h-4 w-4 text-red-600' />
								Расходы
							</CardDescription>
							<CardTitle className='text-2xl text-red-600 dark:text-red-400'>
								-{formatCurrency(monthlyData?.totalExpense || 0)}
							</CardTitle>
						</CardHeader>
					</Card>

					<Card
						className={`dark:border-gray-700 ${
							(monthlyData?.balance || 0) >= 0
								? 'bg-green-50 dark:bg-green-900/20'
								: 'bg-red-50 dark:bg-red-900/20'
						}`}
					>
						<CardHeader className='pb-2'>
							<CardDescription className='dark:text-gray-400'>Баланс</CardDescription>
							<CardTitle
								className={`text-2xl ${
									(monthlyData?.balance || 0) >= 0
										? 'text-green-600 dark:text-green-400'
										: 'text-red-600 dark:text-red-400'
								}`}
							>
								{(monthlyData?.balance || 0) >= 0 ? '+' : ''}
								{formatCurrency(monthlyData?.balance || 0)}
							</CardTitle>
						</CardHeader>
					</Card>
				</div>

				{/* Топ категорий */}
				<Card className='dark:bg-gray-800 dark:border-gray-700'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2 dark:text-white'>
							<PieChart className='h-5 w-5' />
							Топ категорий расходов
						</CardTitle>
					</CardHeader>
					<CardContent>
						{topCategories.length === 0 ? (
							<div className='text-center py-8 text-gray-600 dark:text-gray-400'>
								Нет данных за этот месяц
							</div>
						) : (
							<div className='space-y-4'>
								{topCategories.map((category, index) => (
									<div key={index} className='space-y-2'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-3'>
												<div className='text-2xl'>{category.icon}</div>
												<div>
													<div className='font-medium text-gray-900 dark:text-white'>
														{category.name}
													</div>
													<div className='text-sm text-gray-600 dark:text-gray-400'>
														{category.percentage}% от всех расходов
													</div>
												</div>
											</div>
											<div className='text-right'>
												<div className='font-bold text-red-600 dark:text-red-400'>
													{formatCurrency(category.amount)}
												</div>
											</div>
										</div>
										<div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
											<div
												className='h-2 rounded-full'
												style={{
													width: `${category.percentage}%`,
													backgroundColor: category.color,
												}}
											/>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* График по дням */}
				<Card className='dark:bg-gray-800 dark:border-gray-700'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2 dark:text-white'>
							<Calendar className='h-5 w-5' />
							Расходы по дням
						</CardTitle>
					</CardHeader>
					<CardContent>
						{transactions.filter(t => t.type === 'EXPENSE').length === 0 ? (
							<div className='text-center py-8 text-gray-600 dark:text-gray-400'>
								Нет расходов за этот месяц
							</div>
						) : (
							<div className='space-y-2'>
								{Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
									const dayTransactions = transactions.filter(t => {
										const tDate = new Date(t.date)
										return (
											tDate.getDate() === day &&
											tDate.getMonth() + 1 === selectedMonth.month &&
											tDate.getFullYear() === selectedMonth.year &&
											t.type === 'EXPENSE'
										)
									})

									const dayTotal = dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

									if (dayTotal === 0) return null

									const percentage = totalExpense > 0 ? (dayTotal / totalExpense) * 100 : 0

									return (
										<div key={day} className='flex items-center gap-3'>
											<div className='text-sm font-medium text-gray-600 dark:text-gray-400 w-12'>
												{day} числа
											</div>
											<div className='flex-1'>
												<div className='flex items-center gap-2'>
													<div className='flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden'>
														<div
															className='h-6 bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-end px-2'
															style={{ width: `${Math.max(percentage, 5)}%` }}
														>
															{percentage > 15 && (
																<span className='text-xs text-white font-medium'>
																	{formatCurrency(dayTotal)}
																</span>
															)}
														</div>
													</div>
													{percentage <= 15 && (
														<span className='text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap'>
															{formatCurrency(dayTotal)}
														</span>
													)}
												</div>
											</div>
										</div>
									)
								})}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Сравнение с предыдущим месяцем */}
				<Card className='dark:bg-gray-800 dark:border-gray-700'>
					<CardHeader>
						<CardTitle className='dark:text-white'>Тренд</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-center py-4'>
							<div className='text-gray-600 dark:text-gray-400 mb-2'>
								По сравнению с предыдущим месяцем
							</div>
							<div className='text-3xl font-bold text-gray-900 dark:text-white'>Скоро доступно</div>
							<div className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
								Мы работаем над этой функцией
							</div>
						</div>
					</CardContent>
				</Card>
			</main>
		</div>
	)
}
