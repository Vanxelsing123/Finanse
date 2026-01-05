'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/utils'
import { AnimatePresence, motion, Variants } from 'framer-motion'
import { ArrowLeft, ArrowRight, Plus, Sparkles, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface Category {
	id: string
	name: string
	icon: string
	color: string
	budgetAmount: number
	percentage: number
}

const DEFAULT_CATEGORIES = [
	{ name: 'Продукты', icon: '🛒', color: '#10b981', percentage: 30 },
	{ name: 'Транспорт', icon: '🚗', color: '#3b82f6', percentage: 15 },
	{ name: 'Развлечения', icon: '🎮', color: '#8b5cf6', percentage: 10 },
	{ name: 'Здоровье', icon: '💊', color: '#ef4444', percentage: 10 },
	{ name: 'Одежда', icon: '👔', color: '#f59e0b', percentage: 10 },
	{ name: 'Образование', icon: '📚', color: '#06b6d4', percentage: 10 },
	{ name: 'Рестораны', icon: '🍔', color: '#ec4899', percentage: 10 },
	{ name: 'Прочее', icon: '📦', color: '#6b7280', percentage: 5 },
]

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

const overlayVariants: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
	exit: { opacity: 0 },
}

const modalVariants: Variants = {
	hidden: { opacity: 0, scale: 0.8, y: 50 },
	visible: {
		opacity: 1,
		scale: 1,
		y: 0,
		transition: {
			type: 'spring' as const,
			stiffness: 300,
			damping: 25,
		},
	},
	exit: {
		opacity: 0,
		scale: 0.8,
		y: 50,
	},
}

export default function BudgetSetupPage() {
	const router = useRouter()
	const searchParams = useSearchParams()

	// ✅ Получаем месяц из query параметров или используем текущий
	const queryMonth = searchParams.get('month')
	const queryYear = searchParams.get('year')

	const { month, year } =
		queryMonth && queryYear
			? { month: parseInt(queryMonth), year: parseInt(queryYear) }
			: getCurrentMonthYear()

	const [step, setStep] = useState(1)
	const [totalBudget, setTotalBudget] = useState('')
	const [startDay, setStartDay] = useState(1)
	const [endDay, setEndDay] = useState(31)
	const [categories, setCategories] = useState<Category[]>([])
	const [showAddCategory, setShowAddCategory] = useState(false)
	const [newCategory, setNewCategory] = useState({
		name: '',
		icon: '📦',
		color: '#6b7280',
		amount: 0,
	})
	const [saving, setSaving] = useState(false)

	const handleUseDefaults = () => {
		const budget = parseFloat(totalBudget)
		const defaultCats = DEFAULT_CATEGORIES.map((cat, index) => ({
			id: `temp-${index}`,
			...cat,
			budgetAmount: Math.round(((budget * cat.percentage) / 100) * 100) / 100,
		}))
		setCategories(defaultCats)
		setStep(2)
	}

	const handleCustomSetup = () => {
		setCategories([])
		setStep(2)
	}

	const handleAddCategory = () => {
		if (!newCategory.name || !newCategory.icon || !newCategory.color || newCategory.amount <= 0) {
			alert('Заполните все поля')
			return
		}

		const budget = parseFloat(totalBudget)
		const percentage = (newCategory.amount / budget) * 100

		const newCat: Category = {
			id: `temp-${Date.now()}`,
			name: newCategory.name,
			icon: newCategory.icon,
			color: newCategory.color,
			budgetAmount: newCategory.amount,
			percentage: Math.round(percentage * 10) / 10,
		}

		setCategories([...categories, newCat])
		setShowAddCategory(false)
		setNewCategory({ name: '', icon: '📦', color: '#6b7280', amount: 0 })
	}

	const handleRemoveCategory = (id: string) => {
		setCategories(categories.filter(cat => cat.id !== id))
	}

	const handlePercentageChange = (id: string, percentage: number) => {
		const budget = parseFloat(totalBudget)
		setCategories(
			categories.map(cat =>
				cat.id === id
					? {
							...cat,
							percentage,
							budgetAmount: Math.round(((budget * percentage) / 100) * 100) / 100,
					  }
					: cat
			)
		)
	}

	const handleAutoDistribute = () => {
		const count = categories.length
		if (count === 0) return

		const equalPercentage = Math.floor(100 / count)
		const remainder = 100 - equalPercentage * count
		const budget = parseFloat(totalBudget)

		setCategories(
			categories.map((cat, index) => {
				const percentage = index === 0 ? equalPercentage + remainder : equalPercentage
				return {
					...cat,
					percentage,
					budgetAmount: Math.round(((budget * percentage) / 100) * 100) / 100,
				}
			})
		)
	}

	const handleSaveBudget = async () => {
		if (categories.length === 0) {
			alert('Добавьте хотя бы одну категорию')
			return
		}

		const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0)
		if (Math.abs(totalPercentage - 100) > 1) {
			alert(`Сумма процентов должна быть 100% (сейчас ${totalPercentage.toFixed(1)}%)`)
			return
		}

		setSaving(true)

		try {
			const response = await fetch('/api/budget', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					month,
					year,
					totalAmount: parseFloat(totalBudget),
					startDay,
					endDay,
					categories: categories.map(cat => ({
						name: cat.name,
						icon: cat.icon,
						color: cat.color,
						budgetAmount: cat.budgetAmount,
					})),
				}),
			})

			if (response.ok) {
				router.push(`/dashboard?month=${month}&year=${year}`)
			} else {
				const data = await response.json()
				alert(data.error || 'Ошибка при создании бюджета')
			}
		} catch (error) {
			console.error('Error saving budget:', error)
			alert('Ошибка при сохранении бюджета')
		} finally {
			setSaving(false)
		}
	}

	const totalAllocated = categories.reduce((sum, cat) => sum + cat.budgetAmount, 0)
	const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0)

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 pb-20'>
			<motion.header
				initial={{ y: -100 }}
				animate={{ y: 0 }}
				transition={{ type: 'spring' as const, stiffness: 100 }}
				className='bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10'
			>
				<div className='container mx-auto px-3 sm:px-4 py-3 sm:py-4'>
					<div className='flex items-center justify-between'>
						<Link href={`/dashboard?month=${month}&year=${year}`}>
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
							Настройка бюджета
						</h1>
						<div className='w-16 sm:w-20'></div>
					</div>
				</div>
			</motion.header>

			<motion.main
				variants={containerVariants}
				initial='hidden'
				animate='visible'
				className='container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl space-y-4 sm:space-y-6'
			>
				{/* Progress Steps */}
				<motion.div
					variants={itemVariants}
					className='flex items-center justify-center gap-2 sm:gap-4'
				>
					{[1, 2, 3].map(s => (
						<motion.div
							key={s}
							className='flex items-center'
							initial={{ opacity: 0, scale: 0.5 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: s * 0.1 }}
						>
							<motion.div
								animate={{
									scale: step === s ? 1.2 : 1,
									backgroundColor: step >= s ? '#3b82f6' : '#d1d5db',
								}}
								className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-white text-sm sm:text-base`}
							>
								{s}
							</motion.div>
							{s < 3 && (
								<motion.div
									animate={{
										width: step > s ? '100%' : '0%',
										backgroundColor: '#3b82f6',
									}}
									transition={{ duration: 0.3 }}
									className='h-1 mx-2 sm:mx-4 bg-gray-300 dark:bg-gray-600'
									style={{ width: '40px' }}
								/>
							)}
						</motion.div>
					))}
				</motion.div>

				<AnimatePresence mode='wait'>
					{/* Шаг 1: Общий бюджет */}
					{step === 1 && (
						<motion.div
							key='step1'
							initial={{ opacity: 0, x: 100 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -100 }}
							transition={{ type: 'spring' as const, stiffness: 100 }}
						>
							<Card className='dark:bg-gray-800 dark:border-gray-700'>
								<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
									<CardTitle className='text-lg sm:text-xl dark:text-white'>
										Шаг 1: Общий бюджет
									</CardTitle>
									<CardDescription className='text-xs sm:text-sm dark:text-gray-400'>
										Бюджет на {getMonthName(month)} {year}
									</CardDescription>
								</CardHeader>
								<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6 space-y-4 sm:space-y-6'>
									{/* Ввод бюджета */}
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.2 }}
									>
										<label className='block text-sm sm:text-base font-medium mb-2 sm:mb-3 text-gray-700 dark:text-gray-200'>
											Сколько вы планируете потратить в этом месяце? (BYN)
										</label>
										<input
											type='number'
											value={totalBudget}
											onChange={e => setTotalBudget(e.target.value)}
											className='w-full px-4 sm:px-6 py-3 sm:py-4 text-xl sm:text-2xl font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all'
											placeholder='5000'
											step='0.01'
											min='0'
											autoFocus
										/>
									</motion.div>

									{/* Выбор периода бюджета */}
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.3 }}
										className='bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-6 rounded-xl space-y-4'
									>
										<div>
											<label className='block text-sm sm:text-base font-medium mb-3 text-gray-700 dark:text-gray-200'>
												📅 Период бюджета
											</label>
											<p className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
												Выберите, с какого по какое число считать ваш месячный бюджет
											</p>
										</div>

										<div className='grid grid-cols-2 gap-4'>
											<div>
												<label className='block text-xs font-medium mb-2 text-gray-700 dark:text-gray-200'>
													Начало периода (число)
												</label>
												<select
													value={startDay}
													onChange={e => setStartDay(parseInt(e.target.value))}
													className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
												>
													{Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
														<option key={day} value={day}>
															{day} число
														</option>
													))}
												</select>
											</div>

											<div>
												<label className='block text-xs font-medium mb-2 text-gray-700 dark:text-gray-200'>
													Конец периода (число)
												</label>
												<select
													value={endDay}
													onChange={e => setEndDay(parseInt(e.target.value))}
													className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
												>
													{Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
														<option key={day} value={day}>
															{day} число
														</option>
													))}
												</select>
											</div>
										</div>

										<div className='p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800'>
											<p className='text-xs sm:text-sm text-gray-700 dark:text-gray-300'>
												<span className='font-semibold'>Ваш период:</span> с {startDay} по {endDay}{' '}
												число каждого месяца
											</p>
											{startDay > endDay && (
												<p className='text-xs text-orange-600 dark:text-orange-400 mt-1'>
													💡 Период переходит на следующий месяц
												</p>
											)}
										</div>

										<div className='space-y-2'>
											<p className='text-xs font-medium text-gray-700 dark:text-gray-200'>
												Примеры:
											</p>
											<div className='grid grid-cols-2 gap-2'>
												<Button
													type='button'
													variant='outline'
													size='sm'
													onClick={() => {
														setStartDay(1)
														setEndDay(31)
													}}
													className='text-xs dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
												>
													1-31 (стандарт)
												</Button>
												<Button
													type='button'
													variant='outline'
													size='sm'
													onClick={() => {
														setStartDay(10)
														setEndDay(9)
													}}
													className='text-xs dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
												>
													10-9 (ЗП 10-го)
												</Button>
												<Button
													type='button'
													variant='outline'
													size='sm'
													onClick={() => {
														setStartDay(15)
														setEndDay(14)
													}}
													className='text-xs dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
												>
													15-14 (ЗП 15-го)
												</Button>
												<Button
													type='button'
													variant='outline'
													size='sm'
													onClick={() => {
														setStartDay(25)
														setEndDay(24)
													}}
													className='text-xs dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
												>
													25-24 (ЗП 25-го)
												</Button>
											</div>
										</div>
									</motion.div>

									{totalBudget && parseFloat(totalBudget) > 0 && (
										<motion.div
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											className='bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-6 rounded-xl'
										>
											<p className='text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2'>
												Ваш месячный бюджет:
											</p>
											<p className='text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400'>
												{formatCurrency(parseFloat(totalBudget))}
											</p>
										</motion.div>
									)}

									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.4 }}
										className='space-y-3 sm:space-y-4'
									>
										<p className='text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200'>
											Выберите способ настройки категорий:
										</p>

										<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
											<Button
												onClick={handleUseDefaults}
												disabled={!totalBudget || parseFloat(totalBudget) <= 0}
												className='w-full h-auto py-4 sm:py-6 flex flex-col items-start gap-2 text-left'
											>
												<div className='flex items-center gap-2 sm:gap-3'>
													<Sparkles className='h-5 w-5 sm:h-6 sm:w-6' />
													<span className='text-base sm:text-lg font-semibold'>
														Использовать готовый шаблон
													</span>
												</div>
												<span className='text-xs sm:text-sm opacity-90'>
													8 популярных категорий с рекомендуемым распределением
												</span>
											</Button>
										</motion.div>

										<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
											<Button
												onClick={handleCustomSetup}
												disabled={!totalBudget || parseFloat(totalBudget) <= 0}
												variant='outline'
												className='w-full h-auto py-4 sm:py-6 flex flex-col items-start gap-2 text-left dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
											>
												<div className='flex items-center gap-2 sm:gap-3'>
													<Plus className='h-5 w-5 sm:h-6 sm:w-6' />
													<span className='text-base sm:text-lg font-semibold'>
														Настроить вручную
													</span>
												</div>
												<span className='text-xs sm:text-sm opacity-70'>
													Создайте свои категории и распределите бюджет
												</span>
											</Button>
										</motion.div>
									</motion.div>
								</CardContent>
							</Card>
						</motion.div>
					)}

					{/* Шаг 2: Категории */}
					{step === 2 && (
						<motion.div
							key='step2'
							initial={{ opacity: 0, x: 100 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -100 }}
							transition={{ type: 'spring' as const, stiffness: 100 }}
							className='space-y-4 sm:space-y-6'
						>
							<Card className='dark:bg-gray-800 dark:border-gray-700'>
								<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
									<CardTitle className='text-lg sm:text-xl dark:text-white'>
										Шаг 2: Категории расходов
									</CardTitle>
									<CardDescription className='text-xs sm:text-sm dark:text-gray-400'>
										{categories.length > 0
											? `${categories.length} категорий добавлено`
											: 'Добавьте категории расходов'}
									</CardDescription>
								</CardHeader>
								<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6 space-y-4'>
									{categories.length > 0 && (
										<>
											<div className='flex gap-2'>
												<motion.div
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													className='flex-1'
												>
													<Button
														variant='outline'
														onClick={handleAutoDistribute}
														className='w-full text-xs sm:text-sm dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
													>
														<Sparkles className='h-4 w-4 mr-2' />
														Распределить равномерно
													</Button>
												</motion.div>
												<motion.div
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													className='flex-1'
												>
													<Button
														onClick={() => setShowAddCategory(true)}
														className='w-full text-xs sm:text-sm'
													>
														<Plus className='h-4 w-4 mr-2' />
														Добавить категорию
													</Button>
												</motion.div>
											</div>

											<motion.div
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												className='bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg'
											>
												<div className='flex justify-between items-center mb-2'>
													<span className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
														Всего бюджет:
													</span>
													<span className='text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400'>
														{formatCurrency(parseFloat(totalBudget))}
													</span>
												</div>
												<div className='flex justify-between items-center mb-2'>
													<span className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
														Распределено:
													</span>
													<span className='text-sm sm:text-base font-semibold text-gray-900 dark:text-white'>
														{formatCurrency(totalAllocated)}
													</span>
												</div>
												<div className='flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-700'>
													<span className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
														Осталось:
													</span>
													<span
														className={`text-sm sm:text-base font-bold ${
															parseFloat(totalBudget) - totalAllocated >= 0
																? 'text-green-600 dark:text-green-400'
																: 'text-red-600 dark:text-red-400'
														}`}
													>
														{formatCurrency(parseFloat(totalBudget) - totalAllocated)}
													</span>
												</div>
												<div className='pt-2 border-t border-blue-200 dark:border-blue-700 mt-2'>
													<div className='flex justify-between items-center'>
														<span className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
															Сумма процентов:
														</span>
														<span
															className={`text-xs sm:text-sm font-semibold ${
																Math.abs(totalPercentage - 100) < 1
																	? 'text-green-600 dark:text-green-400'
																	: 'text-orange-600 dark:text-orange-400'
															}`}
														>
															{totalPercentage.toFixed(1)}%
														</span>
													</div>
												</div>
											</motion.div>
										</>
									)}

									<div className='space-y-3'>
										<AnimatePresence>
											{categories.map((category, index) => (
												<motion.div
													key={category.id}
													initial={{ opacity: 0, x: -50 }}
													animate={{ opacity: 1, x: 0 }}
													exit={{ opacity: 0, x: 50 }}
													transition={{ delay: index * 0.05 }}
													whileHover={{ scale: 1.02 }}
													className='border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 space-y-3'
												>
													<div className='flex items-center gap-3'>
														<motion.div
															whileHover={{ rotate: 360 }}
															transition={{ duration: 0.5 }}
															className='w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0'
															style={{ backgroundColor: `${category.color}20` }}
														>
															{category.icon}
														</motion.div>
														<div className='flex-1 min-w-0'>
															<input
																type='text'
																value={category.name}
																onChange={e =>
																	setCategories(
																		categories.map(cat =>
																			cat.id === category.id
																				? { ...cat, name: e.target.value }
																				: cat
																		)
																	)
																}
																className='w-full px-3 py-1.5 text-base font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
															/>
														</div>
														<motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
															<Button
																variant='ghost'
																size='icon'
																onClick={() => handleRemoveCategory(category.id)}
																className='text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
															>
																<Trash2 className='h-4 w-4' />
															</Button>
														</motion.div>
													</div>

													<div className='grid grid-cols-2 gap-3'>
														<div>
															<label className='block text-xs font-medium mb-1 text-gray-700 dark:text-gray-200'>
																Сумма (BYN)
															</label>
															<input
																type='number'
																value={category.budgetAmount}
																readOnly
																className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white'
															/>
														</div>
														<div>
															<label className='block text-xs font-medium mb-1 text-gray-700 dark:text-gray-200'>
																Процент (%)
															</label>
															<input
																type='number'
																value={category.percentage}
																onChange={e =>
																	handlePercentageChange(
																		category.id,
																		parseFloat(e.target.value) || 0
																	)
																}
																className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
																step='1'
																min='0'
																max='100'
															/>
														</div>
													</div>

													<motion.div
														initial={{ width: 0 }}
														animate={{ width: `${Math.min(category.percentage, 100)}%` }}
														className='h-2 rounded-full'
														style={{ backgroundColor: category.color }}
													/>
												</motion.div>
											))}
										</AnimatePresence>
									</div>

									{categories.length === 0 && (
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											className='text-center py-8'
										>
											<p className='text-gray-500 dark:text-gray-400 mb-4'>Пока нет категорий</p>
											<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
												<Button onClick={() => setShowAddCategory(true)}>
													<Plus className='h-4 w-4 mr-2' />
													Добавить первую категорию
												</Button>
											</motion.div>
										</motion.div>
									)}
								</CardContent>
							</Card>

							<div className='flex gap-3'>
								<motion.div
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									className='flex-1'
								>
									<Button
										variant='outline'
										onClick={() => setStep(1)}
										className='w-full dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
									>
										<ArrowLeft className='h-4 w-4 mr-2' />
										Назад
									</Button>
								</motion.div>
								<motion.div
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									className='flex-1'
								>
									<Button
										onClick={() => setStep(3)}
										disabled={categories.length === 0}
										className='w-full'
									>
										Далее
										<ArrowRight className='h-4 w-4 ml-2' />
									</Button>
								</motion.div>
							</div>
						</motion.div>
					)}

					{/* Шаг 3: Проверка */}
					{step === 3 && (
						<motion.div
							key='step3'
							initial={{ opacity: 0, x: 100 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -100 }}
							transition={{ type: 'spring' as const, stiffness: 100 }}
						>
							<Card className='dark:bg-gray-800 dark:border-gray-700'>
								<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
									<CardTitle className='text-lg sm:text-xl dark:text-white'>
										Шаг 3: Проверка и сохранение
									</CardTitle>
									<CardDescription className='text-xs sm:text-sm dark:text-gray-400'>
										Проверьте ваш бюджет перед сохранением
									</CardDescription>
								</CardHeader>
								<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6 space-y-6'>
									<motion.div
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl'
									>
										<p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
											Общий бюджет на{' '}
											{startDay > endDay
												? `${getMonthName(month)}-${getMonthName(
														month === 12 ? 1 : month + 1
												  )} ${year}`
												: `${getMonthName(month)} ${year}`}
										</p>
										<p className='text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400'>
											{formatCurrency(parseFloat(totalBudget))}
										</p>
										<p className='text-xs text-gray-600 dark:text-gray-400 mt-2'>
											Период:{' '}
											{startDay > endDay ? (
												<>
													с {startDay} {getMonthName(month)} по {endDay}{' '}
													{getMonthName(month === 12 ? 1 : month + 1)}
												</>
											) : (
												<>
													с {startDay} по {endDay} число
												</>
											)}
										</p>
									</motion.div>

									<div className='space-y-3'>
										<h3 className='font-semibold text-gray-900 dark:text-white'>
											Категории ({categories.length}):
										</h3>
										{categories.map((category, index) => (
											<motion.div
												key={category.id}
												initial={{ opacity: 0, x: -20 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{ delay: index * 0.05 }}
												className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'
											>
												<div className='flex items-center gap-3'>
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
														<p className='text-xs text-gray-500 dark:text-gray-400'>
															{category.percentage.toFixed(1)}%
														</p>
													</div>
												</div>
												<p className='font-semibold text-gray-900 dark:text-white'>
													{formatCurrency(category.budgetAmount)}
												</p>
											</motion.div>
										))}
									</div>

									{Math.abs(totalPercentage - 100) > 1 && (
										<motion.div
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											className='bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg'
										>
											<p className='text-sm text-orange-800 dark:text-orange-200'>
												⚠️ Сумма процентов должна быть 100% (сейчас {totalPercentage.toFixed(1)}%)
											</p>
										</motion.div>
									)}

									<div className='flex gap-3'>
										<motion.div
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											className='flex-1'
										>
											<Button
												variant='outline'
												onClick={() => setStep(2)}
												className='w-full dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
											>
												<ArrowLeft className='h-4 w-4 mr-2' />
												Назад
											</Button>
										</motion.div>
										<motion.div
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											className='flex-1'
										>
											<Button
												onClick={handleSaveBudget}
												disabled={saving || Math.abs(totalPercentage - 100) > 1}
												className='w-full'
											>
												{saving ? 'Сохранение...' : 'Создать бюджет'}
											</Button>
										</motion.div>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.main>

			{/* Модальное окно добавления категории */}
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
							setNewCategory({ name: '', icon: '📦', color: '#6b7280', amount: 0 })
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
												setNewCategory({ name: '', icon: '📦', color: '#6b7280', amount: 0 })
											}}
											className='dark:hover:bg-gray-700 h-8 w-8'
										>
											<X className='h-4 w-4' />
										</Button>
									</div>
								</CardHeader>
								<CardContent className='space-y-4'>
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.1 }}
									>
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
									</motion.div>

									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.2 }}
									>
										<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
											Выберите иконку
										</label>
										<div className='grid grid-cols-6 gap-2'>
											{['🛒', '🚗', '🏠', '💊', '👔', '🎮', '📚', '🍔', '✈️', '🎬', '💰', '📦'].map(
												emoji => (
													<motion.button
														key={emoji}
														whileHover={{ scale: 1.1 }}
														whileTap={{ scale: 0.9 }}
														type='button'
														onClick={() => setNewCategory({ ...newCategory, icon: emoji })}
														className={`p-3 text-2xl rounded-lg border-2 transition-all ${
															newCategory.icon === emoji
																? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
																: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
														}`}
													>
														{emoji}
													</motion.button>
												)
											)}
										</div>
									</motion.div>

									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.3 }}
									>
										<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
											Выберите цвет
										</label>
										<div className='grid grid-cols-6 gap-2'>
											{[
												'#ef4444',
												'#f97316',
												'#f59e0b',
												'#eab308',
												'#84cc16',
												'#22c55e',
												'#10b981',
												'#14b8a6',
												'#06b6d4',
												'#0ea5e9',
												'#3b82f6',
												'#6366f1',
												'#8b5cf6',
												'#a855f7',
												'#d946ef',
												'#ec4899',
												'#f43f5e',
												'#6b7280',
											].map(color => (
												<motion.button
													key={color}
													whileHover={{ scale: 1.1 }}
													whileTap={{ scale: 0.9 }}
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
									</motion.div>

									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.4 }}
									>
										<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
											Бюджет категории (BYN)
										</label>
										<input
											type='number'
											value={newCategory.amount || ''}
											onChange={e =>
												setNewCategory({
													...newCategory,
													amount: parseFloat(e.target.value) || 0,
												})
											}
											className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
											placeholder='500.00'
											step='0.01'
											min='0'
										/>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
											Укажите сумму, которую планируете тратить в этой категории
										</p>
									</motion.div>

									{newCategory.amount > 0 && totalBudget && parseFloat(totalBudget) > 0 && (
										<motion.div
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg'
										>
											<div className='flex justify-between items-center text-sm'>
												<span className='text-gray-600 dark:text-gray-400'>
													Процент от бюджета:
												</span>
												<span className='font-semibold text-blue-600 dark:text-blue-400'>
													{((newCategory.amount / parseFloat(totalBudget)) * 100).toFixed(1)}%
												</span>
											</div>
										</motion.div>
									)}

									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.5 }}
										className='flex gap-2 pt-2'
									>
										<Button
											onClick={handleAddCategory}
											disabled={
												!newCategory.name ||
												!newCategory.icon ||
												!newCategory.color ||
												newCategory.amount <= 0
											}
											className='flex-1'
										>
											Добавить
										</Button>
										<Button
											variant='outline'
											onClick={() => {
												setShowAddCategory(false)
												setNewCategory({ name: '', icon: '📦', color: '#6b7280', amount: 0 })
											}}
											className='flex-1 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
										>
											Отмена
										</Button>
									</motion.div>
								</CardContent>
							</Card>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
