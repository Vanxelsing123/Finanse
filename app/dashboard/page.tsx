'use client'

import { SavingsSection } from '@/components/savings/SavingsSection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
	calculatePercentage,
	formatCurrency,
	getBudgetPeriodDescription,
	getBudgetPeriodLabel,
	getCurrentMonthYear,
	getDaysUntilPeriodEnd,
	getMonthName,
	getNextPeriodStart,
	isDateInBudgetPeriod,
} from '@/lib/utils'
import { AnimatePresence, motion, Variants } from 'framer-motion'
import {
	ArrowRight,
	Calendar,
	ChevronLeft,
	ChevronRight,
	Edit2,
	Plus,
	Target,
	Trash2,
	TrendingUp,
	Wallet,
	X,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

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
	startDay: number
	endDay: number
	categories: Category[]
}

interface Goal {
	id: string
	name: string
	targetAmount: number
	currentAmount: number
	percentage: number
}

// Варианты анимаций с типизацией
const containerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.2,
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
			damping: 12,
		},
	},
}

const cardVariants: Variants = {
	hidden: { scale: 0.8, opacity: 0 },
	visible: {
		scale: 1,
		opacity: 1,
		transition: {
			type: 'spring' as const,
			stiffness: 100,
			damping: 15,
		},
	},
	hover: {
		scale: 1.05,
		transition: {
			type: 'spring' as const,
			stiffness: 400,
			damping: 10,
		},
	},
	tap: { scale: 0.95 },
}

const modalVariants: Variants = {
	hidden: { opacity: 0, scale: 0.8 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: {
			type: 'spring' as const,
			stiffness: 300,
			damping: 25,
		},
	},
	exit: {
		opacity: 0,
		scale: 0.8,
		transition: {
			duration: 0.2,
		},
	},
}

const overlayVariants: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
	exit: { opacity: 0 },
}

function DashboardContent() {
	const { data: session, status } = useSession()
	const router = useRouter()
	const searchParams = useSearchParams()

	// ✅ Инициализация с учётом localStorage и query параметров
	const [selectedMonth, setSelectedMonth] = useState(() => {
		const monthParam = searchParams.get('month')
		const yearParam = searchParams.get('year')

		if (monthParam && yearParam) {
			return {
				month: parseInt(monthParam),
				year: parseInt(yearParam),
			}
		}

		if (typeof window !== 'undefined') {
			const savedMonth = localStorage.getItem('lastViewedMonth')
			if (savedMonth) {
				try {
					return JSON.parse(savedMonth)
				} catch (e) {}
			}
		}

		return getCurrentMonthYear()
	})

	const [budget, setBudget] = useState<Budget | null>(null)
	const [goals, setGoals] = useState<Goal[]>([])
	const [loading, setLoading] = useState(true)
	const [editingCategory, setEditingCategory] = useState<Category | null>(null)
	const [newBudgetAmount, setNewBudgetAmount] = useState('')
	const [newSpentAmount, setNewSpentAmount] = useState('')
	const [showAddCategory, setShowAddCategory] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<Category | null>(null)
	const [showPeriodEndWarning, setShowPeriodEndWarning] = useState(false)
	const [daysUntilEnd, setDaysUntilEnd] = useState(0)
	const [newCategory, setNewCategory] = useState({
		name: '',
		icon: '📦',
		color: '#6b7280',
		budgetAmount: 0,
	})

	// ✅ Сохраняем выбранный месяц в localStorage при изменении
	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('lastViewedMonth', JSON.stringify(selectedMonth))
		}
	}, [selectedMonth])

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
			const budgetRes = await fetch(
				`/api/budget?month=${selectedMonth.month}&year=${selectedMonth.year}`
			)
			const budgetData = await budgetRes.json()
			setBudget(budgetData.budget)

			// ✅ Проверяем, активен ли этот бюджет сейчас
			if (budgetData.budget) {
				const isActive = isDateInBudgetPeriod(
					new Date(),
					budgetData.budget.month,
					budgetData.budget.year,
					budgetData.budget.startDay,
					budgetData.budget.endDay
				)

				if (isActive) {
					const days = getDaysUntilPeriodEnd(
						budgetData.budget.month,
						budgetData.budget.year,
						budgetData.budget.startDay,
						budgetData.budget.endDay
					)
					setDaysUntilEnd(days)

					// Показываем предупреждение за 3 дня до конца
					if (days <= 3 && days >= 0) {
						setShowPeriodEndWarning(true)
					} else {
						setShowPeriodEndWarning(false)
					}
				} else {
					setShowPeriodEndWarning(false)
				}
			}

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

	const handleAddCategory = async () => {
		if (
			!budget?.id ||
			!newCategory.name ||
			!newCategory.icon ||
			!newCategory.color ||
			newCategory.budgetAmount <= 0
		) {
			alert('Заполните все поля')
			return
		}

		try {
			const response = await fetch('/api/budget/category/add', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					budgetId: budget.id,
					name: newCategory.name,
					icon: newCategory.icon,
					color: newCategory.color,
					budgetAmount: newCategory.budgetAmount,
				}),
			})

			if (response.ok) {
				setShowAddCategory(false)
				setNewCategory({ name: '', icon: '📦', color: '#6b7280', budgetAmount: 0 })
				fetchData()
			} else {
				const data = await response.json()
				alert(data.error || 'Ошибка при добавлении категории')
			}
		} catch (error) {
			console.error('Error adding category:', error)
			alert('Ошибка при добавлении категории')
		}
	}

	const handleDeleteCategory = async () => {
		if (!showDeleteConfirm?.id) return

		try {
			const response = await fetch(`/api/budget/category/${showDeleteConfirm.id}`, {
				method: 'DELETE',
			})

			if (response.ok) {
				setShowDeleteConfirm(null)
				fetchData()
			} else {
				const data = await response.json()
				alert(data.error || 'Ошибка при удалении категории')
			}
		} catch (error) {
			console.error('Error deleting category:', error)
			alert('Ошибка при удалении категории')
		}
	}

	const handleCreateNextPeriod = () => {
		if (!budget) return

		const nextPeriod = getNextPeriodStart(budget.month, budget.year, budget.startDay, budget.endDay)

		router.push(`/budget/setup?month=${nextPeriod.month}&year=${nextPeriod.year}`)
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

	const totalSpent = budget?.categories.reduce((sum, cat) => sum + cat.spent, 0) || 0
	const totalBudget = Number(budget?.totalAmount) || 0
	const remaining = totalBudget - totalSpent
	const spentPercentage = calculatePercentage(totalSpent, totalBudget)

	return (
		<div className='min-h-screen bg-gray-50 dark:bg-gray-900 pb-20'>
			{/* Все модальные окна - без изменений */}
			{/* ... (код модальных окон остается таким же) ... */}

			{/* Header */}
			<motion.header
				initial={{ y: -100 }}
				animate={{ y: 0 }}
				transition={{ type: 'spring', stiffness: 100, damping: 20 }}
				className='bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10'
			>
				<div className='container mx-auto px-3 sm:px-4 py-3 sm:py-4'>
					<div className='flex justify-between items-center'>
						<motion.div
							whileHover={{ scale: 1.05 }}
							className='flex items-center space-x-1.5 sm:space-x-2'
						>
							<Wallet className='h-5 w-5 sm:h-6 sm:w-6 text-primary' />
							<span className='text-base sm:text-xl font-bold text-gray-900 dark:text-white'>
								Finance
							</span>
						</motion.div>
						<div className='flex items-center space-x-2 sm:space-x-4'>
							<span className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden xs:inline truncate max-w-[120px] sm:max-w-none'>
								{session?.user?.name || session?.user?.email}
							</span>
							<Button
								variant='ghost'
								size='sm'
								className='dark:text-gray-200 dark:hover:bg-gray-700 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3'
								onClick={() => {
									window.location.href = '/api/auth/signout'
								}}
							>
								Выход
							</Button>
						</div>
					</div>
				</div>
			</motion.header>

			<motion.div
				variants={containerVariants}
				initial='hidden'
				animate='visible'
				className='container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6'
			>
				{/* ✅ Предупреждение о конце периода */}
				<AnimatePresence>
					{showPeriodEndWarning && budget && (
						<motion.div
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							variants={itemVariants}
						>
							<Card className='border-2 border-orange-500 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20'>
								<CardHeader className='pb-3 px-3 sm:px-6 py-3 sm:py-6'>
									<div className='flex items-start gap-3'>
										<div className='text-2xl sm:text-3xl'>⏰</div>
										<div className='flex-1'>
											<CardTitle className='text-base sm:text-lg text-orange-900 dark:text-orange-100'>
												{daysUntilEnd === 0
													? 'Бюджетный период заканчивается сегодня!'
													: `Бюджетный период заканчивается через ${daysUntilEnd} ${
															daysUntilEnd === 1 ? 'день' : daysUntilEnd < 5 ? 'дня' : 'дней'
													  }`}
											</CardTitle>
											<CardDescription className='text-xs sm:text-sm text-orange-700 dark:text-orange-300 mt-1'>
												{getBudgetPeriodDescription(budget.startDay, budget.endDay, budget.month)}
											</CardDescription>
										</div>
										<Button
											variant='ghost'
											size='icon'
											onClick={() => setShowPeriodEndWarning(false)}
											className='h-8 w-8 flex-shrink-0 hover:bg-orange-200 dark:hover:bg-orange-800'
										>
											<X className='h-4 w-4' />
										</Button>
									</div>
								</CardHeader>
								<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
									<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
										<Button
											onClick={handleCreateNextPeriod}
											className='w-full bg-orange-600 hover:bg-orange-700 text-white'
										>
											<Plus className='h-4 w-4 mr-2' />
											Создать бюджет на следующий период
										</Button>
									</motion.div>
								</CardContent>
							</Card>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Заголовок месяца */}
				<motion.div
					variants={itemVariants}
					className='flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3'
				>
					<div className='flex items-center gap-2 sm:gap-4 w-full xs:w-auto'>
						<motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
							<Button
								variant='outline'
								size='icon'
								onClick={() => changeMonth(-1)}
								className='dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0'
							>
								<ChevronLeft className='h-3 w-3 sm:h-4 sm:w-4' />
							</Button>
						</motion.div>

						<div className='flex-1 min-w-0'>
							<motion.h1
								key={`${selectedMonth.month}-${selectedMonth.year}-${budget?.startDay}-${budget?.endDay}`}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ type: 'spring' as const, stiffness: 100 }}
								className='text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate'
							>
								{budget && budget.startDay && budget.endDay
									? getBudgetPeriodLabel(
											selectedMonth.month,
											selectedMonth.year,
											budget.startDay,
											budget.endDay
									  )
									: `${getMonthName(selectedMonth.month)} ${selectedMonth.year}`}
							</motion.h1>
							<div className='flex items-center gap-2'>
								<p className='text-xs sm:text-sm text-gray-600 dark:text-gray-300'>
									{budget && budget.startDay && budget.endDay ? (
										<>{getBudgetPeriodDescription(budget.startDay, budget.endDay, budget.month)}</>
									) : (
										'Ваши финансы'
									)}
								</p>
								{budget && (
									<Link
										href={`/budget/period?month=${selectedMonth.month}&year=${selectedMonth.year}`}
									>
										<Button
											variant='ghost'
											size='sm'
											className='h-5 text-xs px-2 py-0 dark:text-gray-400 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
										>
											<Calendar className='h-3 w-3 mr-1' />
											Изменить
										</Button>
									</Link>
								)}
							</div>
						</div>

						<motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
							<Button
								variant='outline'
								size='icon'
								onClick={() => changeMonth(1)}
								className='dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0'
							>
								<ChevronRight className='h-3 w-3 sm:h-4 sm:w-4' />
							</Button>
						</motion.div>
					</div>

					{!budget && (
						<Link href='/budget/setup' className='w-full xs:w-auto'>
							<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
								<Button className='w-full xs:w-auto text-xs sm:text-sm h-8 sm:h-10'>
									<Plus className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
									Настроить бюджет
								</Button>
							</motion.div>
						</Link>
					)}
				</motion.div>

				{budget ? (
					<>
						{/* Общая статистика */}
						<motion.div
							variants={itemVariants}
							className='grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4'
						>
							<motion.div
								variants={cardVariants}
								whileHover='hover'
								whileTap='tap'
								onClick={() =>
									router.push(
										`/budget/edit?month=${selectedMonth.month}&year=${selectedMonth.year}`
									)
								}
							>
								<Card className='dark:bg-gray-800 dark:border-gray-700 cursor-pointer'>
									<CardHeader className='pb-1.5 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6'>
										<CardDescription className='flex items-center justify-between dark:text-gray-400 text-xs sm:text-sm'>
											<span>Бюджет</span>
											<Edit2 className='h-2.5 w-2.5 sm:h-3 sm:w-3' />
										</CardDescription>
										<CardTitle className='text-lg sm:text-xl md:text-2xl dark:text-white'>
											{formatCurrency(totalBudget)}
										</CardTitle>
									</CardHeader>
								</Card>
							</motion.div>

							<motion.div variants={cardVariants}>
								<Card className='dark:bg-gray-800 dark:border-gray-700'>
									<CardHeader className='pb-1.5 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6'>
										<CardDescription className='dark:text-gray-400 text-xs sm:text-sm'>
											Потрачено
										</CardDescription>
										<CardTitle className='text-lg sm:text-xl md:text-2xl text-red-600 dark:text-red-400'>
											{formatCurrency(totalSpent)}
										</CardTitle>
									</CardHeader>
									<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
										<Progress value={spentPercentage} className='h-1.5 sm:h-2' />
										<p className='text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1.5 sm:mt-2'>
											{spentPercentage}% от бюджета
										</p>
									</CardContent>
								</Card>
							</motion.div>

							<motion.div variants={cardVariants}>
								<Card className='dark:bg-gray-800 dark:border-gray-700'>
									<CardHeader className='pb-1.5 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6'>
										<CardDescription className='dark:text-gray-400 text-xs sm:text-sm'>
											Осталось
										</CardDescription>
										<CardTitle className='text-lg sm:text-xl md:text-2xl text-green-600 dark:text-green-400'>
											{formatCurrency(remaining)}
										</CardTitle>
									</CardHeader>
								</Card>
							</motion.div>
						</motion.div>

						{/* Накопления */}
						<SavingsSection />

						{/* Категории */}

						<motion.div variants={itemVariants}>
							<Card className='dark:bg-gray-800 dark:border-gray-700'>
								<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
									<div className='flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2'>
										<CardTitle className='dark:text-white text-base sm:text-lg md:text-xl'>
											Категории расходов
										</CardTitle>
										<div className='flex gap-2 w-full xs:w-auto'>
											<motion.div
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												className='flex-1 xs:flex-initial'
											>
												<Button
													size='sm'
													variant='outline'
													onClick={() => setShowAddCategory(true)}
													className='text-xs sm:text-sm h-8 sm:h-9 w-full xs:w-auto dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
												>
													<Plus className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
													Категория
												</Button>
											</motion.div>
											<Link href='/transactions/new' className='flex-1 xs:flex-initial'>
												<motion.div
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													className='flex-1 xs:flex-initial'
												>
													<Button
														size='sm'
														onClick={() => router.push('/transactions/new')}
														className='text-xs sm:text-sm h-8 sm:h-9 w-full xs:w-auto'
													>
														<Plus className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
														Трата
													</Button>
												</motion.div>
											</Link>
										</div>
									</div>
									<CardDescription className='dark:text-gray-400 text-xs sm:text-sm'>
										Клик на название - редактирование. Кнопка корзины - удаление
									</CardDescription>
								</CardHeader>
								<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
									<div className='space-y-3 sm:space-y-4'>
										{budget.categories.map((category, index) => {
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
													whileHover={{ scale: 1.02 }}
													className='space-y-1.5 sm:space-y-2 p-2 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
												>
													<div className='flex justify-between items-center gap-2'>
														<div
															className='flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 cursor-pointer'
															onClick={() => handleEditCategory(category)}
														>
															<motion.div
																whileHover={{ rotate: 360 }}
																transition={{ duration: 0.5 }}
																className='w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-xl flex-shrink-0'
																style={{ backgroundColor: `${category.color}20` }}
															>
																{category.icon}
															</motion.div>
															<div className='min-w-0 flex-1'>
																<p className='font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate'>
																	{category.name}
																</p>
																<p className='text-[10px] sm:text-xs text-gray-600 dark:text-gray-400'>
																	{formatCurrency(category.spent)} /{' '}
																	{formatCurrency(category.budgetAmount)}
																</p>
															</div>
														</div>

														{/* Правая часть с суммой и кнопками */}
														<div className='flex items-center gap-2 sm:gap-3 flex-shrink-0'>
															<div className='text-right'>
																<p
																	className={`font-semibold text-xs sm:text-sm ${
																		isOverBudget
																			? 'text-red-600 dark:text-red-400'
																			: 'text-green-600 dark:text-green-400'
																	}`}
																>
																	{formatCurrency(Number(category.budgetAmount) - category.spent)}
																</p>
																<p className='text-[10px] sm:text-xs text-gray-600 dark:text-gray-400'>
																	{percentage}%
																</p>
															</div>

															{/* Кнопка редактировать */}
															<motion.button
																whileHover={{ scale: 1.1 }}
																whileTap={{ scale: 0.9 }}
																onClick={e => {
																	e.stopPropagation()
																	handleEditCategory(category)
																}}
																className='p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors'
																title='Редактировать'
															>
																<Edit2 className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400' />
															</motion.button>

															{/* Кнопка удалить */}
															<motion.button
																whileHover={{ scale: 1.1 }}
																whileTap={{ scale: 0.9 }}
																onClick={e => {
																	e.stopPropagation()
																	setShowDeleteConfirm(category)
																}}
																className='p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors'
																title='Удалить'
															>
																<Trash2 className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 dark:text-red-400' />
															</motion.button>
														</div>
													</div>

													<Progress
														value={Math.min(percentage, 100)}
														className={`h-1.5 sm:h-2 ${
															isOverBudget ? 'bg-red-100 dark:bg-red-900' : ''
														}`}
													/>
												</motion.div>
											)
										})}
									</div>
								</CardContent>
							</Card>
						</motion.div>

						{/* Цели */}
						{goals.length > 0 && (
							<motion.div variants={itemVariants}>
								<Card className='dark:bg-gray-800 dark:border-gray-700'>
									<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
										<div className='flex justify-between items-center'>
											<CardTitle className='dark:text-white text-base sm:text-lg md:text-xl'>
												Мои цели
											</CardTitle>
											<Link href='/goals'>
												<motion.div whileHover={{ x: 5 }}>
													<Button
														variant='ghost'
														size='sm'
														className='dark:text-gray-200 dark:hover:bg-gray-700 text-xs sm:text-sm h-8 sm:h-9'
													>
														Все цели
														<ArrowRight className='h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2' />
													</Button>
												</motion.div>
											</Link>
										</div>
									</CardHeader>
									<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
										<div className='space-y-3 sm:space-y-4'>
											{goals.slice(0, 3).map((goal, index) => (
												<motion.div
													key={goal.id}
													initial={{ opacity: 0, x: -20 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ delay: index * 0.1 }}
													className='space-y-1.5 sm:space-y-2'
												>
													<div className='flex justify-between items-center'>
														<div className='min-w-0 flex-1 mr-3'>
															<p className='font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate'>
																{goal.name}
															</p>
															<p className='text-[10px] sm:text-xs text-gray-600 dark:text-gray-400'>
																{formatCurrency(goal.currentAmount)} /{' '}
																{formatCurrency(goal.targetAmount)}
															</p>
														</div>
														<p className='font-semibold text-sm sm:text-base text-primary flex-shrink-0'>
															{goal.percentage}%
														</p>
													</div>
													<Progress value={goal.percentage} className='h-1.5 sm:h-2' />
												</motion.div>
											))}
										</div>
									</CardContent>
								</Card>
							</motion.div>
						)}

						{/* Быстрые действия */}
						<motion.div
							variants={itemVariants}
							className='grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4'
						>
							<Link href='/transactions/new'>
								<motion.div variants={cardVariants} whileHover='hover' whileTap='tap'>
									<Card className='hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700'>
										<CardHeader className='text-center px-3 sm:px-6 py-4 sm:py-6'>
											<motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.3 }}>
												<Plus className='h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary mx-auto mb-1 sm:mb-2' />
											</motion.div>
											<CardTitle className='text-sm sm:text-base md:text-lg dark:text-white'>
												Добавить трату
											</CardTitle>
										</CardHeader>
									</Card>
								</motion.div>
							</Link>

							<Link href='/goals'>
								<motion.div variants={cardVariants} whileHover='hover' whileTap='tap'>
									<Card className='hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700'>
										<CardHeader className='text-center px-3 sm:px-6 py-4 sm:py-6'>
											<motion.div
												whileHover={{ scale: 1.2 }}
												transition={{ type: 'spring', stiffness: 400 }}
											>
												<Target className='h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary mx-auto mb-1 sm:mb-2' />
											</motion.div>
											<CardTitle className='text-sm sm:text-base md:text-lg dark:text-white'>
												Мои цели
											</CardTitle>
										</CardHeader>
									</Card>
								</motion.div>
							</Link>

							<Link href='/analytics'>
								<motion.div variants={cardVariants} whileHover='hover' whileTap='tap'>
									<Card className='hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700'>
										<CardHeader className='text-center px-3 sm:px-6 py-4 sm:py-6'>
											<motion.div
												whileHover={{ y: -5 }}
												transition={{ type: 'spring', stiffness: 400 }}
											>
												<TrendingUp className='h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary mx-auto mb-1 sm:mb-2' />
											</motion.div>
											<CardTitle className='text-sm sm:text-base md:text-lg dark:text-white'>
												Аналитика
											</CardTitle>
										</CardHeader>
									</Card>
								</motion.div>
							</Link>
						</motion.div>
					</>
				) : (
					<motion.div variants={itemVariants}>
						<Card className='dark:bg-gray-800 dark:border-gray-700'>
							<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
								<CardTitle className='dark:text-white text-base sm:text-lg md:text-xl'>
									Начните с настройки бюджета
								</CardTitle>
								<CardDescription className='dark:text-gray-300 text-xs sm:text-sm'>
									Создайте месячный бюджет и начните контролировать свои расходы
								</CardDescription>
							</CardHeader>
							<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
								<Link href='/budget/setup'>
									<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
										<Button size='lg' className='text-sm sm:text-base'>
											<Plus className='h-4 w-4 mr-2' />
											Настроить бюджет
										</Button>
									</motion.div>
								</Link>
							</CardContent>
						</Card>
					</motion.div>
				)}
			</motion.div>
			<AnimatePresence>
				{editingCategory && (
					<motion.div
						variants={overlayVariants}
						initial='hidden'
						animate='visible'
						exit='exit'
						className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4'
						onClick={() => {
							setEditingCategory(null)
							setNewBudgetAmount('')
							setNewSpentAmount('')
						}}
					>
						<motion.div
							variants={modalVariants}
							initial='hidden'
							animate='visible'
							exit='exit'
							onClick={e => e.stopPropagation()}
							className='w-full max-w-md'
						>
							<Card className='dark:bg-gray-800 dark:border-gray-700'>
								<CardHeader className='pb-3'>
									<div className='flex items-center justify-between'>
										<CardTitle className='text-base sm:text-lg dark:text-white'>
											Редактировать категорию
										</CardTitle>
										<Button
											variant='ghost'
											size='icon'
											onClick={() => {
												setEditingCategory(null)
												setNewBudgetAmount('')
												setNewSpentAmount('')
											}}
											className='dark:hover:bg-gray-700 h-8 w-8'
										>
											<X className='h-4 w-4' />
										</Button>
									</div>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div>
										<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
											Название категории
										</label>
										<div className='flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
											<div
												className='w-10 h-10 rounded-full flex items-center justify-center text-2xl'
												style={{ backgroundColor: `${editingCategory.color}20` }}
											>
												{editingCategory.icon}
											</div>
											<p className='font-medium text-gray-900 dark:text-white'>
												{editingCategory.name}
											</p>
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
											className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
											placeholder={editingCategory.budgetAmount.toString()}
											step='0.01'
											min='0'
										/>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
											Текущий бюджет: {formatCurrency(editingCategory.budgetAmount)}
										</p>
									</div>

									<div>
										<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
											Потрачено (BYN)
										</label>
										<input
											type='number'
											value={newSpentAmount}
											onChange={e => setNewSpentAmount(e.target.value)}
											className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
											placeholder={editingCategory.spent.toString()}
											step='0.01'
											min='0'
										/>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
											Текущая сумма: {formatCurrency(editingCategory.spent)}
										</p>
									</div>

									<div className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg'>
										<p className='text-xs text-blue-800 dark:text-blue-200'>
											💡 Оставьте поле пустым, чтобы не менять значение
										</p>
									</div>

									<div className='flex gap-2 pt-2'>
										<Button onClick={handleUpdateCategory} className='flex-1'>
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
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* ✅ ДОБАВЬТЕ МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ КАТЕГОРИИ */}
			<AnimatePresence>
				{showAddCategory && (
					<motion.div
						variants={overlayVariants}
						initial='hidden'
						animate='visible'
						exit='exit'
						className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4'
						onClick={() => {
							setShowAddCategory(false)
							setNewCategory({ name: '', icon: '📦', color: '#6b7280', budgetAmount: 0 })
						}}
					>
						<motion.div
							variants={modalVariants}
							initial='hidden'
							animate='visible'
							exit='exit'
							onClick={e => e.stopPropagation()}
							className='w-full max-w-md'
						>
							<Card className='dark:bg-gray-800 dark:border-gray-700'>
								<CardHeader className='pb-3'>
									<div className='flex items-center justify-between'>
										<CardTitle className='text-base sm:text-lg dark:text-white'>
											Добавить категорию
										</CardTitle>
										<Button
											variant='ghost'
											size='icon'
											onClick={() => {
												setShowAddCategory(false)
												setNewCategory({ name: '', icon: '📦', color: '#6b7280', budgetAmount: 0 })
											}}
											className='dark:hover:bg-gray-700 h-8 w-8'
										>
											<X className='h-4 w-4' />
										</Button>
									</div>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div>
										<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
											Название категории
										</label>
										<input
											type='text'
											value={newCategory.name}
											onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
											className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
											placeholder='Например: Кафе'
											autoFocus
										/>
									</div>

									<div>
										<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
											Выберите иконку
										</label>
										<div className='grid grid-cols-6 gap-2'>
											{['🛒', '🚗', '🏠', '💊', '👔', '🎮', '📚', '🍔', '✈️', '🎬', '💰', '📦'].map(
												emoji => (
													<button
														key={emoji}
														type='button'
														onClick={() => setNewCategory({ ...newCategory, icon: emoji })}
														className={`p-3 text-2xl rounded-lg border-2 transition-all ${
															newCategory.icon === emoji
																? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
																: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
														}`}
													>
														{emoji}
													</button>
												)
											)}
										</div>
									</div>

									<div>
										<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
											Выберите цвет
										</label>
										<div className='grid grid-cols-6 gap-2'>
											{[
												'#ef4444',
												'#f97316',
												'#f59e0b',
												'#84cc16',
												'#22c55e',
												'#10b981',
												'#14b8a6',
												'#06b6d4',
												'#3b82f6',
												'#6366f1',
												'#8b5cf6',
												'#ec4899',
											].map(color => (
												<button
													key={color}
													type='button'
													onClick={() => setNewCategory({ ...newCategory, color })}
													className={`w-10 h-10 rounded-lg border-2 transition-all ${
														newCategory.color === color
															? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-900 dark:ring-white'
															: 'border-gray-200 dark:border-gray-700'
													}`}
													style={{ backgroundColor: color }}
												/>
											))}
										</div>
									</div>

									<div>
										<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
											Бюджет категории (BYN)
										</label>
										<input
											type='number'
											value={newCategory.budgetAmount || ''}
											onChange={e =>
												setNewCategory({
													...newCategory,
													budgetAmount: parseFloat(e.target.value) || 0,
												})
											}
											className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
											placeholder='500.00'
											step='0.01'
											min='0'
										/>
									</div>

									<div className='flex gap-2 pt-2'>
										<Button
											onClick={handleAddCategory}
											disabled={
												!newCategory.name ||
												!newCategory.icon ||
												!newCategory.color ||
												newCategory.budgetAmount <= 0
											}
											className='flex-1'
										>
											Добавить
										</Button>
										<Button
											variant='outline'
											onClick={() => {
												setShowAddCategory(false)
												setNewCategory({ name: '', icon: '📦', color: '#6b7280', budgetAmount: 0 })
											}}
											className='flex-1 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
										>
											Отмена
										</Button>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* ✅ ДОБАВЬТЕ МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ */}
			<AnimatePresence>
				{showDeleteConfirm && (
					<motion.div
						variants={overlayVariants}
						initial='hidden'
						animate='visible'
						exit='exit'
						className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4'
						onClick={() => setShowDeleteConfirm(null)}
					>
						<motion.div
							variants={modalVariants}
							initial='hidden'
							animate='visible'
							exit='exit'
							onClick={e => e.stopPropagation()}
							className='w-full max-w-md'
						>
							<Card className='dark:bg-gray-800 dark:border-gray-700'>
								<CardHeader>
									<CardTitle className='text-lg dark:text-white'>Удалить категорию?</CardTitle>
									<CardDescription className='dark:text-gray-400'>
										Вы действительно хотите удалить категорию "{showDeleteConfirm.name}"? Все
										транзакции этой категории будут также удалены.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='flex gap-2'>
										<Button variant='destructive' onClick={handleDeleteCategory} className='flex-1'>
											Удалить
										</Button>
										<Button
											variant='outline'
											onClick={() => setShowDeleteConfirm(null)}
											className='flex-1 dark:border-gray-600 dark:text-gray-200'
										>
											Отмена
										</Button>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

export default function DashboardPage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
				</div>
			}
		>
			<DashboardContent />
		</Suspense>
	)
}
