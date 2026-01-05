'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { calculatePercentage, formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/utils'
import { motion, Variants } from 'framer-motion'
import {
	ArrowLeft,
	Calendar,
	ChevronLeft,
	ChevronRight,
	TrendingDown,
	TrendingUp,
	Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
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

interface Budget {
	id: string
	month: number
	year: number
	totalAmount: number
	startDay: number
	endDay: number
	categories: Category[]
}

interface Category {
	id: string
	name: string
	icon: string
	color: string
	budgetAmount: number
	spent: number
}

interface Savings {
	id: string
	name: string
	amount: number
	currency: string
}

interface AllTimeStats {
	totalBudget: number
	totalSpent: number
	totalSavings: number
	budgetsCount: number
	categories: {
		name: string
		icon: string
		color: string
		spent: number
		budget: number
	}[]
	savings: Savings[]
}

const containerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
}

const itemVariants: Variants = {
	hidden: { y: 20, opacity: 0 },
	visible: {
		y: 0,
		opacity: 1,
		transition: {
			type: 'spring' as const,
			stiffness: 100,
		},
	},
}

export default function AnalyticsPage() {
	const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear())
	const [budget, setBudget] = useState<Budget | null>(null)
	const [savings, setSavings] = useState<Savings[]>([])
	const [loading, setLoading] = useState(true)
	const [viewMode, setViewMode] = useState<'month' | 'all'>('month')
	const [allTimeStats, setAllTimeStats] = useState<AllTimeStats | null>(null)

	useEffect(() => {
		fetchData()
	}, [selectedMonth, viewMode])

	const fetchData = async () => {
		try {
			setLoading(true)

			if (viewMode === 'month') {
				const budgetRes = await fetch(
					`/api/budget?month=${selectedMonth.month}&year=${selectedMonth.year}`
				)
				const budgetData = await budgetRes.json()
				setBudget(budgetData.budget)

				const savingsRes = await fetch('/api/savings')
				const savingsData = await savingsRes.json()
				setSavings(savingsData.savings || [])
			} else {
				const allRes = await fetch('/api/analytics/all')
				const allData = await allRes.json()
				setAllTimeStats(allData)

				const savingsRes = await fetch('/api/savings')
				const savingsData = await savingsRes.json()
				setSavings(savingsData.savings || [])
			}
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
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
			</div>
		)
	}

	const totalSpent = budget?.categories.reduce((sum, cat) => sum + cat.spent, 0) || 0
	const totalBudget = Number(budget?.totalAmount) || 0
	const remaining = totalBudget - totalSpent
	const spentPercentage = calculatePercentage(totalSpent, totalBudget)

	const totalSavings = savings.reduce((sum, s) => {
		const amount = typeof s.amount === 'string' ? parseFloat(s.amount) : Number(s.amount)
		return sum + amount
	}, 0)

	const pieData =
		budget?.categories
			.filter(cat => cat.spent > 0)
			.map(cat => ({
				name: cat.name,
				value: cat.spent,
				color: cat.color,
			})) || []

	const barData =
		budget?.categories.map(cat => ({
			name: cat.name,
			Потрачено: cat.spent,
			Бюджет: Number(cat.budgetAmount),
		})) || []

	const topCategories =
		budget?.categories
			.filter(cat => cat.spent > 0)
			.sort((a, b) => b.spent - a.spent)
			.slice(0, 5) || []

	const overBudgetCategories =
		budget?.categories.filter(cat => cat.spent > Number(cat.budgetAmount)) || []

	const allTimePieData =
		allTimeStats && Array.isArray(allTimeStats.categories)
			? allTimeStats.categories
					.filter(cat => cat.spent > 0)
					.map(cat => ({
						name: cat.name,
						value: cat.spent,
						color: cat.color,
					}))
			: []

	const allTimeBarData =
		allTimeStats && Array.isArray(allTimeStats.categories)
			? allTimeStats.categories.map(cat => ({
					name: cat.name,
					Потрачено: cat.spent,
					Бюджет: cat.budget,
			  }))
			: []

	return (
		<div className='min-h-screen bg-gray-50 dark:bg-gray-900 pb-20'>
			<motion.header
				initial={{ y: -100 }}
				animate={{ y: 0 }}
				transition={{ type: 'spring' as const, stiffness: 100 }}
				className='bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10'
			>
				<div className='container mx-auto px-3 sm:px-4 py-3 sm:py-4'>
					<div className='flex items-center justify-between'>
						<Link href='/dashboard'>
							<motion.div whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }}>
								<Button
									variant='ghost'
									size='sm'
									className='dark:text-gray-200 dark:hover:bg-gray-700'
								>
									<ArrowLeft className='h-4 w-4 mr-2' />
									Назад
								</Button>
							</motion.div>
						</Link>
						<h1 className='text-lg sm:text-xl font-bold text-gray-900 dark:text-white'>
							Аналитика
						</h1>
						<div className='w-16 sm:w-20'></div>
					</div>
				</div>
			</motion.header>

			<motion.div
				variants={containerVariants}
				initial='hidden'
				animate='visible'
				className='container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-6xl'
			>
				<motion.div variants={itemVariants} className='flex justify-center'>
					<div className='inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-800'>
						<Button
							variant={viewMode === 'month' ? 'default' : 'ghost'}
							size='sm'
							onClick={() => setViewMode('month')}
							className='rounded-md'
						>
							<Calendar className='h-4 w-4 mr-2' />
							По месяцам
						</Button>
						<Button
							variant={viewMode === 'all' ? 'default' : 'ghost'}
							size='sm'
							onClick={() => setViewMode('all')}
							className='rounded-md'
						>
							<TrendingUp className='h-4 w-4 mr-2' />
							За все время
						</Button>
					</div>
				</motion.div>

				{viewMode === 'month' ? (
					<>
						<motion.div variants={itemVariants} className='flex items-center justify-center gap-4'>
							<Button
								variant='outline'
								size='icon'
								onClick={() => changeMonth(-1)}
								className='dark:border-gray-600 dark:text-gray-200'
							>
								<ChevronLeft className='h-4 w-4' />
							</Button>
							<div className='text-center min-w-[200px]'>
								<h2 className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white'>
									{getMonthName(selectedMonth.month)} {selectedMonth.year}
								</h2>
								{budget && budget.startDay && budget.endDay && (
									<p className='text-xs text-gray-600 dark:text-gray-400'>
										{budget.startDay > budget.endDay
											? `${budget.startDay}-${budget.endDay} след. месяца`
											: `${budget.startDay}-${budget.endDay} число`}
									</p>
								)}
							</div>
							<Button
								variant='outline'
								size='icon'
								onClick={() => changeMonth(1)}
								className='dark:border-gray-600 dark:text-gray-200'
							>
								<ChevronRight className='h-4 w-4' />
							</Button>
						</motion.div>

						{budget ? (
							<>
								<motion.div
									variants={itemVariants}
									className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
								>
									<Card className='dark:bg-gray-800 dark:border-gray-700'>
										<CardHeader className='pb-2'>
											<CardDescription className='dark:text-gray-400'>Бюджет</CardDescription>
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
									</Card>

									<Card className='dark:bg-gray-800 dark:border-gray-700'>
										<CardHeader className='pb-2'>
											<CardDescription className='dark:text-gray-400'>Осталось</CardDescription>
											<CardTitle className='text-2xl text-green-600 dark:text-green-400'>
												{formatCurrency(remaining)}
											</CardTitle>
										</CardHeader>
									</Card>

									<Card className='dark:bg-gray-800 dark:border-gray-700'>
										<CardHeader className='pb-2'>
											<CardDescription className='dark:text-gray-400'>Накопления</CardDescription>
											<CardTitle className='text-2xl text-blue-600 dark:text-blue-400'>
												{formatCurrency(totalSavings)}
											</CardTitle>
										</CardHeader>
									</Card>
								</motion.div>

								<motion.div variants={itemVariants}>
									<Card className='dark:bg-gray-800 dark:border-gray-700'>
										<CardHeader>
											<CardTitle className='dark:text-white'>Использование бюджета</CardTitle>
										</CardHeader>
										<CardContent className='space-y-4'>
											<div>
												<div className='flex justify-between mb-2'>
													<span className='text-sm text-gray-600 dark:text-gray-400'>
														{spentPercentage}% использовано
													</span>
													<span className='text-sm font-medium text-gray-900 dark:text-white'>
														{formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
													</span>
												</div>
												<Progress value={spentPercentage} className='h-3' />
											</div>
											<div className='grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700'>
												<div>
													<p className='text-xs text-gray-600 dark:text-gray-400 mb-1'>
														Эффективность
													</p>
													<p className='text-lg font-semibold text-gray-900 dark:text-white'>
														{totalBudget > 0 ? Math.round((totalSavings / totalBudget) * 100) : 0}%
													</p>
												</div>
												<div>
													<p className='text-xs text-gray-600 dark:text-gray-400 mb-1'>Категорий</p>
													<p className='text-lg font-semibold text-gray-900 dark:text-white'>
														{budget.categories.length}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</motion.div>

								<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
									<motion.div variants={itemVariants}>
										<Card className='dark:bg-gray-800 dark:border-gray-700'>
											<CardHeader>
												<CardTitle className='dark:text-white'>Распределение расходов</CardTitle>
												<CardDescription className='dark:text-gray-400'>
													По категориям
												</CardDescription>
											</CardHeader>
											<CardContent>
												{pieData.length > 0 ? (
													<ResponsiveContainer width='100%' height={300}>
														<PieChart>
															<Pie
																data={pieData}
																cx='50%'
																cy='50%'
																labelLine={false}
																label={({ name, percent }) =>
																	`${name}: ${(percent * 100).toFixed(0)}%`
																}
																outerRadius={80}
																fill='#8884d8'
																dataKey='value'
															>
																{pieData.map((entry, index) => (
																	<Cell key={`cell-${index}`} fill={entry.color} />
																))}
															</Pie>
															<Tooltip
																formatter={(value: number) => formatCurrency(value)}
																contentStyle={{
																	backgroundColor: 'rgba(255, 255, 255, 0.95)',
																	border: '1px solid #ccc',
																	borderRadius: '8px',
																}}
															/>
														</PieChart>
													</ResponsiveContainer>
												) : (
													<div className='h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400'>
														Нет данных о расходах
													</div>
												)}
											</CardContent>
										</Card>
									</motion.div>

									<motion.div variants={itemVariants}>
										<Card className='dark:bg-gray-800 dark:border-gray-700'>
											<CardHeader>
												<CardTitle className='dark:text-white'>Бюджет vs Траты</CardTitle>
												<CardDescription className='dark:text-gray-400'>
													Сравнение по категориям
												</CardDescription>
											</CardHeader>
											<CardContent>
												{barData.length > 0 ? (
													<ResponsiveContainer width='100%' height={300}>
														<BarChart data={barData}>
															<CartesianGrid strokeDasharray='3 3' />
															<XAxis dataKey='name' angle={-45} textAnchor='end' height={100} />
															<YAxis />
															<Tooltip
																formatter={(value: number) => formatCurrency(value)}
																contentStyle={{
																	backgroundColor: 'rgba(255, 255, 255, 0.95)',
																	border: '1px solid #ccc',
																	borderRadius: '8px',
																}}
															/>
															<Legend />
															<Bar dataKey='Бюджет' fill='#3b82f6' />
															<Bar dataKey='Потрачено' fill='#ef4444' />
														</BarChart>
													</ResponsiveContainer>
												) : (
													<div className='h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400'>
														Нет данных
													</div>
												)}
											</CardContent>
										</Card>
									</motion.div>
								</div>

								{topCategories.length > 0 && (
									<motion.div variants={itemVariants}>
										<Card className='dark:bg-gray-800 dark:border-gray-700'>
											<CardHeader>
												<CardTitle className='dark:text-white'>
													Топ-5 категорий по расходам
												</CardTitle>
											</CardHeader>
											<CardContent className='space-y-4'>
												{topCategories.map((category, index) => {
													const percentage = calculatePercentage(
														category.spent,
														Number(category.budgetAmount)
													)
													return (
														<div key={category.id} className='space-y-2'>
															<div className='flex items-center justify-between'>
																<div className='flex items-center gap-3'>
																	<span className='text-2xl'>{category.icon}</span>
																	<div>
																		<p className='font-medium text-gray-900 dark:text-white'>
																			{index + 1}. {category.name}
																		</p>
																		<p className='text-xs text-gray-600 dark:text-gray-400'>
																			{formatCurrency(category.spent)} /{' '}
																			{formatCurrency(category.budgetAmount)}
																		</p>
																	</div>
																</div>
																<span className='font-semibold text-gray-900 dark:text-white'>
																	{percentage}%
																</span>
															</div>
															<Progress value={Math.min(percentage, 100)} className='h-2' />
														</div>
													)
												})}
											</CardContent>
										</Card>
									</motion.div>
								)}

								{overBudgetCategories.length > 0 && (
									<motion.div variants={itemVariants}>
										<Card className='border-2 border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20'>
											<CardHeader>
												<CardTitle className='text-red-900 dark:text-red-100'>
													⚠️ Превышение бюджета
												</CardTitle>
												<CardDescription className='text-red-700 dark:text-red-300'>
													{overBudgetCategories.length} категорий превысили лимит
												</CardDescription>
											</CardHeader>
											<CardContent className='space-y-3'>
												{overBudgetCategories.map(category => {
													const overspent = category.spent - Number(category.budgetAmount)
													return (
														<div
															key={category.id}
															className='flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg'
														>
															<div className='flex items-center gap-3'>
																<span className='text-2xl'>{category.icon}</span>
																<div>
																	<p className='font-medium text-gray-900 dark:text-white'>
																		{category.name}
																	</p>
																	<p className='text-xs text-gray-600 dark:text-gray-400'>
																		Превышение: {formatCurrency(overspent)}
																	</p>
																</div>
															</div>
															<TrendingDown className='h-5 w-5 text-red-500' />
														</div>
													)
												})}
											</CardContent>
										</Card>
									</motion.div>
								)}

								{savings.length > 0 && (
									<motion.div variants={itemVariants}>
										<Card className='dark:bg-gray-800 dark:border-gray-700'>
											<CardHeader>
												<CardTitle className='dark:text-white'>Накопления по валютам</CardTitle>
											</CardHeader>
											<CardContent className='space-y-3'>
												{savings.map(saving => (
													<div
														key={saving.id}
														className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'
													>
														<div className='flex items-center gap-3'>
															<Wallet className='h-5 w-5 text-blue-500' />
															<div>
																<p className='font-medium text-gray-900 dark:text-white'>
																	{saving.name}
																</p>
																<p className='text-xs text-gray-600 dark:text-gray-400'>
																	{saving.currency}
																</p>
															</div>
														</div>
														<p className='font-semibold text-gray-900 dark:text-white'>
															{typeof saving.amount === 'string'
																? parseFloat(saving.amount).toFixed(2)
																: Number(saving.amount).toFixed(2)}{' '}
															{saving.currency}
														</p>
													</div>
												))}
											</CardContent>
										</Card>
									</motion.div>
								)}
							</>
						) : (
							<motion.div variants={itemVariants}>
								<Card className='dark:bg-gray-800 dark:border-gray-700'>
									<CardContent className='py-12 text-center'>
										<p className='text-gray-500 dark:text-gray-400 mb-4'>
											Нет данных за {getMonthName(selectedMonth.month)} {selectedMonth.year}
										</p>
										<Link href='/budget/setup'>
											<Button>Создать бюджет</Button>
										</Link>
									</CardContent>
								</Card>
							</motion.div>
						)}
					</>
				) : (
					<>
						{allTimeStats && allTimeStats.budgetsCount > 0 ? (
							<>
								<motion.div variants={itemVariants}>
									<Card className='dark:bg-gray-800 dark:border-gray-700'>
										<CardHeader>
											<CardTitle className='text-2xl dark:text-white'>
												📊 Общая статистика
											</CardTitle>
											<CardDescription className='dark:text-gray-400'>
												За все {allTimeStats.budgetsCount} месяцев
											</CardDescription>
										</CardHeader>
									</Card>
								</motion.div>

								<motion.div
									variants={itemVariants}
									className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
								>
									<Card className='dark:bg-gray-800 dark:border-gray-700'>
										<CardHeader className='pb-2'>
											<CardDescription className='dark:text-gray-400'>
												Всего бюджета
											</CardDescription>
											<CardTitle className='text-2xl dark:text-white'>
												{formatCurrency(allTimeStats.totalBudget)}
											</CardTitle>
										</CardHeader>
									</Card>

									<Card className='dark:bg-gray-800 dark:border-gray-700'>
										<CardHeader className='pb-2'>
											<CardDescription className='dark:text-gray-400'>
												Всего потрачено
											</CardDescription>
											<CardTitle className='text-2xl text-red-600 dark:text-red-400'>
												{formatCurrency(allTimeStats.totalSpent)}
											</CardTitle>
										</CardHeader>
									</Card>

									<Card className='dark:bg-gray-800 dark:border-gray-700'>
										<CardHeader className='pb-2'>
											<CardDescription className='dark:text-gray-400'>Сэкономлено</CardDescription>
											<CardTitle className='text-2xl text-green-600 dark:text-green-400'>
												{formatCurrency(allTimeStats.totalBudget - allTimeStats.totalSpent)}
											</CardTitle>
										</CardHeader>
									</Card>

									<Card className='dark:bg-gray-800 dark:border-gray-700'>
										<CardHeader className='pb-2'>
											<CardDescription className='dark:text-gray-400'>Накопления</CardDescription>
											<CardTitle className='text-2xl text-blue-600 dark:text-blue-400'>
												{formatCurrency(allTimeStats.totalSavings)}
											</CardTitle>
										</CardHeader>
									</Card>
								</motion.div>

								<motion.div variants={itemVariants}>
									<Card className='dark:bg-gray-800 dark:border-gray-700'>
										<CardHeader>
											<CardTitle className='dark:text-white'>Общая эффективность</CardTitle>
										</CardHeader>
										<CardContent className='space-y-4'>
											<div>
												<div className='flex justify-between mb-2'>
													<span className='text-sm text-gray-600 dark:text-gray-400'>
														{calculatePercentage(allTimeStats.totalSpent, allTimeStats.totalBudget)}
														% от общего бюджета
													</span>
													<span className='text-sm font-medium text-gray-900 dark:text-white'>
														{formatCurrency(allTimeStats.totalSpent)} /{' '}
														{formatCurrency(allTimeStats.totalBudget)}
													</span>
												</div>
												<Progress
													value={calculatePercentage(
														allTimeStats.totalSpent,
														allTimeStats.totalBudget
													)}
													className='h-3'
												/>
											</div>
											<div className='grid grid-cols-3 gap-4 pt-4 border-t dark:border-gray-700'>
												<div>
													<p className='text-xs text-gray-600 dark:text-gray-400 mb-1'>Бюджетов</p>
													<p className='text-lg font-semibold text-gray-900 dark:text-white'>
														{allTimeStats.budgetsCount}
													</p>
												</div>
												<div>
													<p className='text-xs text-gray-600 dark:text-gray-400 mb-1'>
														Средний бюджет
													</p>
													<p className='text-lg font-semibold text-gray-900 dark:text-white'>
														{formatCurrency(allTimeStats.totalBudget / allTimeStats.budgetsCount)}
													</p>
												</div>
												<div>
													<p className='text-xs text-gray-600 dark:text-gray-400 mb-1'>
														Норма сбережений
													</p>
													<p className='text-lg font-semibold text-gray-900 dark:text-white'>
														{allTimeStats.totalBudget > 0
															? Math.round(
																	(allTimeStats.totalSavings / allTimeStats.totalBudget) * 100
															  )
															: 0}
														%
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</motion.div>

								<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
									<motion.div variants={itemVariants}>
										<Card className='dark:bg-gray-800 dark:border-gray-700'>
											<CardHeader>
												<CardTitle className='dark:text-white'>Распределение расходов</CardTitle>
												<CardDescription className='dark:text-gray-400'>
													За все время
												</CardDescription>
											</CardHeader>
											<CardContent>
												{allTimePieData.length > 0 ? (
													<ResponsiveContainer width='100%' height={300}>
														<PieChart>
															<Pie
																data={allTimePieData}
																cx='50%'
																cy='50%'
																labelLine={false}
																label={({ name, percent }) =>
																	`${name}: ${(percent * 100).toFixed(0)}%`
																}
																outerRadius={80}
																fill='#8884d8'
																dataKey='value'
															>
																{allTimePieData.map((entry, index) => (
																	<Cell key={`cell-${index}`} fill={entry.color} />
																))}
															</Pie>
															<Tooltip
																formatter={(value: number) => formatCurrency(value)}
																contentStyle={{
																	backgroundColor: 'rgba(255, 255, 255, 0.95)',
																	border: '1px solid #ccc',
																	borderRadius: '8px',
																}}
															/>
														</PieChart>
													</ResponsiveContainer>
												) : (
													<div className='h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400'>
														Нет данных о расходах
													</div>
												)}
											</CardContent>
										</Card>
									</motion.div>

									<motion.div variants={itemVariants}>
										<Card className='dark:bg-gray-800 dark:border-gray-700'>
											<CardHeader>
												<CardTitle className='dark:text-white'>Бюджет vs Траты</CardTitle>
												<CardDescription className='dark:text-gray-400'>
													Суммарно по категориям
												</CardDescription>
											</CardHeader>
											<CardContent>
												{allTimeBarData.length > 0 ? (
													<ResponsiveContainer width='100%' height={300}>
														<BarChart data={allTimeBarData}>
															<CartesianGrid strokeDasharray='3 3' />
															<XAxis dataKey='name' angle={-45} textAnchor='end' height={100} />
															<YAxis />
															<Tooltip
																formatter={(value: number) => formatCurrency(value)}
																contentStyle={{
																	backgroundColor: 'rgba(255, 255, 255, 0.95)',
																	border: '1px solid #ccc',
																	borderRadius: '8px',
																}}
															/>
															<Legend />
															<Bar dataKey='Бюджет' fill='#3b82f6' />
															<Bar dataKey='Потрачено' fill='#ef4444' />
														</BarChart>
													</ResponsiveContainer>
												) : (
													<div className='h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400'>
														Нет данных
													</div>
												)}
											</CardContent>
										</Card>
									</motion.div>
								</div>

								{allTimeStats.categories && allTimeStats.categories.length > 0 && (
									<motion.div variants={itemVariants}>
										<Card className='dark:bg-gray-800 dark:border-gray-700'>
											<CardHeader>
												<CardTitle className='dark:text-white'>
													Топ категорий за все время
												</CardTitle>
											</CardHeader>
											<CardContent className='space-y-4'>
												{allTimeStats.categories.slice(0, 10).map((category, index) => {
													const percentage = calculatePercentage(category.spent, category.budget)
													return (
														<div key={`${category.name}-${index}`} className='space-y-2'>
															<div className='flex items-center justify-between'>
																<div className='flex items-center gap-3'>
																	<span className='text-2xl'>{category.icon}</span>
																	<div>
																		<p className='font-medium text-gray-900 dark:text-white'>
																			{index + 1}. {category.name}
																		</p>
																		<p className='text-xs text-gray-600 dark:text-gray-400'>
																			{formatCurrency(category.spent)} /{' '}
																			{formatCurrency(category.budget)}
																		</p>
																	</div>
																</div>
																<span className='font-semibold text-gray-900 dark:text-white'>
																	{percentage}%
																</span>
															</div>
															<Progress value={Math.min(percentage, 100)} className='h-2' />
														</div>
													)
												})}
											</CardContent>
										</Card>
									</motion.div>
								)}

								{savings.length > 0 && (
									<motion.div variants={itemVariants}>
										<Card className='dark:bg-gray-800 dark:border-gray-700'>
											<CardHeader>
												<CardTitle className='dark:text-white'>Текущие накопления</CardTitle>
											</CardHeader>
											<CardContent className='space-y-3'>
												{savings.map(saving => (
													<div
														key={saving.id}
														className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'
													>
														<div className='flex items-center gap-3'>
															<Wallet className='h-5 w-5 text-blue-500' />
															<div>
																<p className='font-medium text-gray-900 dark:text-white'>
																	{saving.name}
																</p>
																<p className='text-xs text-gray-600 dark:text-gray-400'>
																	{saving.currency}
																</p>
															</div>
														</div>
														<p className='font-semibold text-gray-900 dark:text-white'>
															{typeof saving.amount === 'string'
																? parseFloat(saving.amount).toFixed(2)
																: Number(saving.amount).toFixed(2)}{' '}
															{saving.currency}
														</p>
													</div>
												))}
											</CardContent>
										</Card>
									</motion.div>
								)}
							</>
						) : (
							<motion.div variants={itemVariants}>
								<Card className='dark:bg-gray-800 dark:border-gray-700'>
									<CardContent className='py-12 text-center'>
										<p className='text-gray-500 dark:text-gray-400 mb-4'>Нет данных за все время</p>
										<Link href='/budget/setup'>
											<Button>Создать первый бюджет</Button>
										</Link>
									</CardContent>
								</Card>
							</motion.div>
						)}
					</>
				)}
			</motion.div>
		</div>
	)
}
