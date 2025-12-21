'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { calculatePercentage, formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/utils'
import { motion, Variants } from 'framer-motion'
import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	PieChart as PieChartIcon,
	PiggyBank,
	TrendingDown,
	TrendingUp,
	Wallet,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

interface Savings {
	id: string
	currency: string
	amount: number | string
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
	const { data: session, status } = useSession()
	const router = useRouter()
	const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthYear())
	const [budget, setBudget] = useState<Budget | null>(null)
	const [savings, setSavings] = useState<Savings[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/auth/login')
		}
	}, [status, router])

	useEffect(() => {
		if (status === 'authenticated') {
			fetchData()
		}
	}, [status, selectedMonth])

	const fetchData = async () => {
		try {
			setLoading(true)

			// Загружаем бюджет
			const budgetRes = await fetch(
				`/api/budget?month=${selectedMonth.month}&year=${selectedMonth.year}`
			)
			const budgetData = await budgetRes.json()
			setBudget(budgetData.budget)

			// Загружаем накопления
			const savingsRes = await fetch('/api/savings')
			const savingsData = await savingsRes.json()
			setSavings(savingsData.savings || [])
		} catch (error) {
			console.error('Error fetching data:', error)
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

	if (status === 'loading' || loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
				<motion.div
					initial={{ opacity: 0, scale: 0.5 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5 }}
					className='text-center'
				>
					<motion.div
						animate={{ rotate: 360 }}
						transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
						className='rounded-full h-12 w-12 border-b-2 border-primary mx-auto'
					></motion.div>
					<motion.p
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className='mt-4 text-gray-600 dark:text-gray-300'
					>
						Загрузка...
					</motion.p>
				</motion.div>
			</div>
		)
	}

	if (!budget) {
		return (
			<div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
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
									<Button variant='ghost' size='sm' className='dark:text-gray-200'>
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

				<div className='container mx-auto px-3 sm:px-4 py-6'>
					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader>
							<CardTitle className='dark:text-white'>Нет данных</CardTitle>
							<CardDescription className='dark:text-gray-400'>
								Создайте бюджет для просмотра аналитики
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href='/budget/setup'>
								<Button>Создать бюджет</Button>
							</Link>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	const totalSpent = budget.categories.reduce((sum, cat) => sum + cat.spent, 0)
	const totalBudget = Number(budget.totalAmount)
	const remaining = totalBudget - totalSpent
	const spentPercentage = calculatePercentage(totalSpent, totalBudget)

	// Вычисляем общую сумму накоплений
	const totalSavings = savings.reduce((sum, s) => {
		const amount = typeof s.amount === 'string' ? parseFloat(s.amount) : Number(s.amount)
		return sum + amount
	}, 0)

	// Топ категории по тратам
	const topCategories = [...budget.categories]
		.filter(cat => cat.spent > 0)
		.sort((a, b) => b.spent - a.spent)
		.slice(0, 5)

	// Категории с перерасходом
	const overBudgetCategories = budget.categories.filter(cat => cat.spent > Number(cat.budgetAmount))

	// Данные для круговой диаграммы
	const pieData = topCategories.map(cat => ({
		name: cat.name,
		value: cat.spent,
		color: cat.color,
		icon: cat.icon,
	}))

	// Данные для столбчатой диаграммы
	const barData = topCategories.map(cat => ({
		name: cat.name,
		spent: cat.spent,
		budget: Number(cat.budgetAmount),
		color: cat.color,
		icon: cat.icon,
	}))

	return (
		<div className='min-h-screen bg-gray-50 dark:bg-gray-900 pb-20'>
			{/* Header */}
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
				className='container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl space-y-4 sm:space-y-6'
			>
				{/* Переключатель месяца */}
				<motion.div variants={itemVariants}>
					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardContent className='pt-4 sm:pt-6'>
							<div className='flex items-center justify-between'>
								<motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
									<Button
										variant='outline'
										size='icon'
										onClick={() => changeMonth(-1)}
										className='dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 h-8 w-8 sm:h-10 sm:w-10'
									>
										<ChevronLeft className='h-4 w-4' />
									</Button>
								</motion.div>
								<div className='text-center'>
									<div className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white'>
										{getMonthName(selectedMonth.month)} {selectedMonth.year}
									</div>
									<div className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
										{budget.categories.length} категорий
									</div>
								</div>
								<motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
									<Button
										variant='outline'
										size='icon'
										onClick={() => changeMonth(1)}
										className='dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 h-8 w-8 sm:h-10 sm:w-10'
									>
										<ChevronRight className='h-4 w-4' />
									</Button>
								</motion.div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Общая статистика */}
				<motion.div
					variants={itemVariants}
					className='grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4'
				>
					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader className='pb-2 px-3 sm:px-6 pt-3 sm:pt-6'>
							<CardDescription className='flex items-center gap-1 dark:text-gray-400 text-xs'>
								<Wallet className='h-3 w-3' />
								Бюджет
							</CardDescription>
							<CardTitle className='text-lg sm:text-2xl dark:text-white'>
								{formatCurrency(totalBudget)}
							</CardTitle>
						</CardHeader>
					</Card>

					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader className='pb-2 px-3 sm:px-6 pt-3 sm:pt-6'>
							<CardDescription className='flex items-center gap-1 dark:text-gray-400 text-xs'>
								<TrendingDown className='h-3 w-3 text-red-500' />
								Потрачено
							</CardDescription>
							<CardTitle className='text-lg sm:text-2xl text-red-600 dark:text-red-400'>
								{formatCurrency(totalSpent)}
							</CardTitle>
						</CardHeader>
					</Card>

					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader className='pb-2 px-3 sm:px-6 pt-3 sm:pt-6'>
							<CardDescription className='flex items-center gap-1 dark:text-gray-400 text-xs'>
								<TrendingUp className='h-3 w-3 text-green-500' />
								Осталось
							</CardDescription>
							<CardTitle className='text-lg sm:text-2xl text-green-600 dark:text-green-400'>
								{formatCurrency(remaining)}
							</CardTitle>
						</CardHeader>
					</Card>

					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader className='pb-2 px-3 sm:px-6 pt-3 sm:pt-6'>
							<CardDescription className='flex items-center gap-1 dark:text-gray-400 text-xs'>
								<PiggyBank className='h-3 w-3 text-blue-500' />
								Накопления
							</CardDescription>
							<CardTitle className='text-lg sm:text-2xl text-blue-600 dark:text-blue-400'>
								{formatCurrency(totalSavings)}
							</CardTitle>
						</CardHeader>
					</Card>
				</motion.div>

				{/* Прогресс расходов */}
				<motion.div variants={itemVariants}>
					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
							<CardTitle className='dark:text-white text-base sm:text-lg'>
								Прогресс расходов
							</CardTitle>
							<CardDescription className='dark:text-gray-400 text-xs sm:text-sm'>
								{spentPercentage}% от бюджета использовано
							</CardDescription>
						</CardHeader>
						<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
							<Progress value={spentPercentage} className='h-2 sm:h-3' />
							<div className='flex justify-between mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
								<span>{formatCurrency(totalSpent)} потрачено</span>
								<span>{formatCurrency(remaining)} осталось</span>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Диаграммы */}
				{topCategories.length > 0 && (
					<motion.div variants={itemVariants} className='grid md:grid-cols-2 gap-4 sm:gap-6'>
						{/* Круговая диаграмма */}
						<Card className='dark:bg-gray-800 dark:border-gray-700'>
							<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
								<CardTitle className='flex items-center gap-2 dark:text-white text-base sm:text-lg'>
									<PieChartIcon className='h-4 w-4 sm:h-5 sm:w-5' />
									Распределение расходов
								</CardTitle>
							</CardHeader>
							<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
								<ResponsiveContainer width='100%' height={250}>
									<PieChart>
										<Pie
											data={pieData}
											cx='50%'
											cy='50%'
											labelLine={false}
											label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
											outerRadius={80}
											fill='#8884d8'
											dataKey='value'
										>
											{pieData.map((entry, index) => (
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
											formatter={(value: any) => formatCurrency(value)}
										/>
									</PieChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Столбчатая диаграмма */}
						<Card className='dark:bg-gray-800 dark:border-gray-700'>
							<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
								<CardTitle className='dark:text-white text-base sm:text-lg'>
									Топ категорий
								</CardTitle>
							</CardHeader>
							<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
								<ResponsiveContainer width='100%' height={250}>
									<BarChart data={barData}>
										<CartesianGrid strokeDasharray='3 3' stroke='#374151' />
										<XAxis dataKey='icon' stroke='#9ca3af' style={{ fontSize: '18px' }} />
										<YAxis stroke='#9ca3af' />
										<Tooltip
											contentStyle={{
												backgroundColor: '#1f2937',
												border: '1px solid #374151',
												borderRadius: '8px',
												color: '#fff',
											}}
											formatter={(value: any, name: any) => [
												formatCurrency(value),
												name === 'spent' ? 'Потрачено' : 'Бюджет',
											]}
										/>
										<Legend />
										<Bar dataKey='spent' fill='#ef4444' name='Потрачено' radius={[8, 8, 0, 0]}>
											{barData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Bar>
										<Bar dataKey='budget' fill='#94a3b8' name='Бюджет' radius={[8, 8, 0, 0]} />
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</motion.div>
				)}

				{/* Детализация по категориям */}
				<motion.div variants={itemVariants}>
					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
							<CardTitle className='dark:text-white text-base sm:text-lg'>
								Детализация по категориям
							</CardTitle>
							<CardDescription className='dark:text-gray-400 text-xs sm:text-sm'>
								Все категории с тратами
							</CardDescription>
						</CardHeader>
						<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
							{topCategories.length === 0 ? (
								<div className='text-center py-8 text-gray-600 dark:text-gray-400'>
									<div className='text-4xl sm:text-6xl mb-4'>📊</div>
									<p className='text-sm sm:text-base'>Нет трат за этот месяц</p>
								</div>
							) : (
								<div className='space-y-3 sm:space-y-4'>
									{topCategories.map((category, index) => {
										const percentage = calculatePercentage(
											category.spent,
											Number(category.budgetAmount)
										)
										const isOverBudget = category.spent > Number(category.budgetAmount)

										return (
											<motion.div
												key={category.id}
												initial={{ opacity: 0, x: -20 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{ delay: index * 0.05 }}
												className='space-y-2'
											>
												<div className='flex items-center justify-between'>
													<div className='flex items-center gap-2 sm:gap-3 flex-1 min-w-0'>
														<div className='text-xl sm:text-2xl'>{category.icon}</div>
														<div className='min-w-0 flex-1'>
															<p className='font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate'>
																{category.name}
															</p>
															<p className='text-xs text-gray-600 dark:text-gray-400'>
																{formatCurrency(category.spent)} /{' '}
																{formatCurrency(category.budgetAmount)}
															</p>
														</div>
													</div>
													<div className='text-right'>
														<p
															className={`font-bold text-sm sm:text-base ${
																isOverBudget
																	? 'text-red-600 dark:text-red-400'
																	: 'text-green-600 dark:text-green-400'
															}`}
														>
															{percentage}%
														</p>
													</div>
												</div>
												<div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
													<div
														className='h-2 rounded-full transition-all'
														style={{
															width: `${Math.min(percentage, 100)}%`,
															backgroundColor: category.color,
														}}
													/>
												</div>
											</motion.div>
										)
									})}
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Накопления по валютам */}
				{savings.length > 0 && (
					<motion.div variants={itemVariants}>
						<Card className='dark:bg-gray-800 dark:border-gray-700'>
							<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
								<CardTitle className='dark:text-white text-base sm:text-lg'>
									Накопления по валютам
								</CardTitle>
								<CardDescription className='dark:text-gray-400 text-xs sm:text-sm'>
									Всего: {formatCurrency(totalSavings)}
								</CardDescription>
							</CardHeader>
							<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
								<div className='space-y-3'>
									{savings.map((saving, index) => {
										const amount =
											typeof saving.amount === 'string'
												? parseFloat(saving.amount)
												: Number(saving.amount)
										const percentage = totalSavings > 0 ? (amount / totalSavings) * 100 : 0

										return (
											<motion.div
												key={saving.id}
												initial={{ opacity: 0, x: -20 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{ delay: index * 0.1 }}
												className='space-y-2'
											>
												<div className='flex items-center justify-between'>
													<div className='flex items-center gap-2'>
														<span className='text-base sm:text-lg font-semibold'>
															{saving.currency}
														</span>
													</div>
													<div className='text-right'>
														<p className='font-semibold text-sm sm:text-base text-blue-600 dark:text-blue-400'>
															{formatCurrency(amount)}
														</p>
														<p className='text-xs text-gray-600 dark:text-gray-400'>
															{percentage.toFixed(1)}%
														</p>
													</div>
												</div>
												<Progress value={percentage} className='h-2' />
											</motion.div>
										)
									})}
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)}

				{/* Статистика */}
				<motion.div
					variants={itemVariants}
					className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'
				>
					<Card
						className={`dark:border-gray-700 ${
							overBudgetCategories.length > 0
								? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
								: 'dark:bg-gray-800'
						}`}
					>
						<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
							<CardTitle className='dark:text-white text-base sm:text-lg'>Перерасход</CardTitle>
							<CardDescription className='dark:text-gray-400 text-xs sm:text-sm'>
								Категорий с превышением
							</CardDescription>
						</CardHeader>
						<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
							<p
								className={`text-3xl sm:text-4xl font-bold ${
									overBudgetCategories.length > 0
										? 'text-red-600 dark:text-red-400'
										: 'text-green-600 dark:text-green-400'
								}`}
							>
								{overBudgetCategories.length}
							</p>
							{overBudgetCategories.length > 0 && (
								<div className='mt-3 space-y-1'>
									{overBudgetCategories.map(cat => (
										<p key={cat.id} className='text-xs text-gray-600 dark:text-gray-400'>
											{cat.icon} {cat.name}:{' '}
											<span className='text-red-600 dark:text-red-400 font-semibold'>
												+{formatCurrency(cat.spent - Number(cat.budgetAmount))}
											</span>
										</p>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
							<CardTitle className='dark:text-white text-base sm:text-lg'>Эффективность</CardTitle>
							<CardDescription className='dark:text-gray-400 text-xs sm:text-sm'>
								Процент сбережений
							</CardDescription>
						</CardHeader>
						<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
							<p className='text-3xl sm:text-4xl font-bold text-primary'>
								{totalBudget > 0 ? ((remaining / totalBudget) * 100).toFixed(1) : 0}%
							</p>
							<p className='text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2'>
								{remaining >= 0 ? 'Вы укладываетесь в бюджет! 🎉' : 'Превышен бюджет 😔'}
							</p>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	)
}
