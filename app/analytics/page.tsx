'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/utils'
import {
	ArrowLeft,
	Calendar,
	PieChart as PieChartIcon,
	TrendingDown,
	TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

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

interface DayData {
	day: number
	expense: number
	income: number
}

export default function AnalyticsPage() {
	const router = useRouter()
	const [selectedMonth, setSelectedMonth] = useState(() => {
		const { month, year } = getCurrentMonthYear()
		return { month, year }
	})
	const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null)
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [dailyData, setDailyData] = useState<DayData[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchAnalytics()
	}, [selectedMonth])

	const fetchAnalytics = async () => {
		try {
			setLoading(true)

			const response = await fetch(
				`/api/transactions?month=${selectedMonth.month}&year=${selectedMonth.year}`
			)
			const data = await response.json()
			const allTransactions = data.transactions || []

			setTransactions(allTransactions)

			const income = allTransactions
				.filter((t: Transaction) => t.type === 'INCOME')
				.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)

			const expense = allTransactions
				.filter((t: Transaction) => t.type === 'EXPENSE')
				.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)

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

			// Подготовка данных по дням
			const daysInMonth = new Date(selectedMonth.year, selectedMonth.month, 0).getDate()
			const dailyMap = new Map<number, { expense: number; income: number }>()

			for (let day = 1; day <= daysInMonth; day++) {
				dailyMap.set(day, { expense: 0, income: 0 })
			}

			allTransactions.forEach((t: Transaction) => {
				const tDate = new Date(t.date)
				if (
					tDate.getMonth() + 1 === selectedMonth.month &&
					tDate.getFullYear() === selectedMonth.year
				) {
					const day = tDate.getDate()
					const existing = dailyMap.get(day)!
					if (t.type === 'EXPENSE') {
						existing.expense += Number(t.amount)
					} else {
						existing.income += Number(t.amount)
					}
				}
			})

			const dailyArray = Array.from(dailyMap.entries())
				.map(([day, data]) => ({
					day,
					expense: data.expense,
					income: data.income,
				}))
				.filter(d => d.expense > 0 || d.income > 0)

			setDailyData(dailyArray)
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

			<main className='container mx-auto px-4 py-6 max-w-6xl space-y-6'>
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

				{/* График расходов и доходов по дням */}
				{dailyData.length > 0 && (
					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2 dark:text-white'>
								<Calendar className='h-5 w-5' />
								Динамика доходов и расходов
							</CardTitle>
							<CardDescription className='dark:text-gray-400'>По дням месяца</CardDescription>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width='100%' height={300}>
								<AreaChart data={dailyData}>
									<defs>
										<linearGradient id='colorExpense' x1='0' y1='0' x2='0' y2='1'>
											<stop offset='5%' stopColor='#ef4444' stopOpacity={0.8} />
											<stop offset='95%' stopColor='#ef4444' stopOpacity={0} />
										</linearGradient>
										<linearGradient id='colorIncome' x1='0' y1='0' x2='0' y2='1'>
											<stop offset='5%' stopColor='#10b981' stopOpacity={0.8} />
											<stop offset='95%' stopColor='#10b981' stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray='3 3' stroke='#374151' />
									<XAxis
										dataKey='day'
										stroke='#9ca3af'
										label={{ value: 'День', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
									/>
									<YAxis
										stroke='#9ca3af'
										label={{ value: 'BYN', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
									/>
									<Tooltip
										contentStyle={{
											backgroundColor: '#1f2937',
											border: '1px solid #374151',
											borderRadius: '8px',
											color: '#fff',
										}}
										formatter={(value: any) => `${value.toFixed(2)} BYN`}
									/>
									<Legend />
									<Area
										type='monotone'
										dataKey='expense'
										stroke='#ef4444'
										fillOpacity={1}
										fill='url(#colorExpense)'
										name='Расходы'
									/>
									<Area
										type='monotone'
										dataKey='income'
										stroke='#10b981'
										fillOpacity={1}
										fill='url(#colorIncome)'
										name='Доходы'
									/>
								</AreaChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				)}

				{/* Круговая диаграмма категорий */}
				{topCategories.length > 0 && (
					<div className='grid md:grid-cols-2 gap-6'>
						<Card className='dark:bg-gray-800 dark:border-gray-700'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2 dark:text-white'>
									<PieChartIcon className='h-5 w-5' />
									Распределение расходов
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width='100%' height={300}>
									<PieChart>
										<Pie
											data={topCategories}
											cx='50%'
											cy='50%'
											labelLine={false}
											label={({ name, percentage }) => `${name}: ${percentage}%`}
											outerRadius={100}
											fill='#8884d8'
											dataKey='amount'
										>
											{topCategories.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												backgroundColor: '#1f2937',
												border: '1px solid #374151',
												borderRadius: '8px',
												color: '#fff',
											}}
											formatter={(value: any) => `${formatCurrency(value)}`}
										/>
									</PieChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Столбчатая диаграмма топ категорий */}
						<Card className='dark:bg-gray-800 dark:border-gray-700'>
							<CardHeader>
								<CardTitle className='dark:text-white'>Топ категорий</CardTitle>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width='100%' height={300}>
									<BarChart data={topCategories}>
										<CartesianGrid strokeDasharray='3 3' stroke='#374151' />
										<XAxis dataKey='icon' stroke='#9ca3af' style={{ fontSize: '20px' }} />
										<YAxis
											stroke='#9ca3af'
											label={{ value: 'BYN', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
										/>
										<Tooltip
											contentStyle={{
												backgroundColor: '#1f2937',
												border: '1px solid #374151',
												borderRadius: '8px',
												color: '#fff',
											}}
											formatter={(value: any, name: any, props: any) => [
												`${formatCurrency(value)}`,
												props.payload.name,
											]}
										/>
										<Bar dataKey='amount' radius={[8, 8, 0, 0]}>
											{topCategories.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Детальная таблица категорий */}
				<Card className='dark:bg-gray-800 dark:border-gray-700'>
					<CardHeader>
						<CardTitle className='dark:text-white'>Детализация по категориям</CardTitle>
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
												className='h-2 rounded-full transition-all'
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

				{/* Пустое состояние */}
				{transactions.length === 0 && (
					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardContent className='pt-6 text-center py-12'>
							<div className='text-6xl mb-4'>📊</div>
							<h3 className='text-xl font-bold mb-2 text-gray-900 dark:text-white'>
								Нет данных для анализа
							</h3>
							<p className='text-gray-600 dark:text-gray-400 mb-6'>
								Добавьте транзакции, чтобы увидеть аналитику
							</p>
							<Link href='/transactions/new'>
								<Button>
									<TrendingUp className='h-4 w-4 mr-2' />
									Добавить трату
								</Button>
							</Link>
						</CardContent>
					</Card>
				)}
			</main>
		</div>
	)
}
