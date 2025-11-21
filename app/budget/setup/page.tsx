'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/utils'
import { ArrowLeft, Plus, Sparkles, Trash2, X } from 'lucide-react' // ✅ Добавили X
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
	{ name: 'Кафе/Рестораны', icon: '🍔', color: '#ec4899', percentage: 10 },
	{ name: 'Другое', icon: '📦', color: '#6b7280', percentage: 5 },
]

const EMOJI_LIST = [
	'🛒',
	'🚗',
	'🎮',
	'💊',
	'👔',
	'📚',
	'🍔',
	'📦',
	'🏠',
	'💡',
	'📱',
	'💻',
	'✈️',
	'🎬',
	'🎵',
	'⚽',
	'🎨',
	'🔧',
	'💰',
	'🎁',
	'🍕',
	'☕',
	'🏋️',
	'🐕',
	'🌳',
	'💳',
	'📊',
	'🎯',
	'🔑',
	'🏥',
]

const COLOR_LIST = [
	'#10b981',
	'#3b82f6',
	'#8b5cf6',
	'#ef4444',
	'#f59e0b',
	'#06b6d4',
	'#ec4899',
	'#6b7280',
	'#14b8a6',
	'#f97316',
]

export default function BudgetSetupPage() {
	const router = useRouter()
	const { month, year } = getCurrentMonthYear()
	const [totalAmount, setTotalAmount] = useState('')
	const [categories, setCategories] = useState<Category[]>(
		DEFAULT_CATEGORIES.map((cat, index) => ({
			...cat,
			id: `cat-${index}`,
			budgetAmount: 0,
		}))
	)
	const [showAddCategory, setShowAddCategory] = useState(false)
	const [newCategory, setNewCategory] = useState({
		name: '',
		icon: '📦',
		color: '#6b7280',
		percentage: 5,
	})
	const [loading, setLoading] = useState(false)

	// ✅ Исправлено: предотвращаем появление 0
	const handleTotalAmountChange = (value: string) => {
		setTotalAmount(value)

		if (!value || value === '' || parseFloat(value) <= 0) {
			// Если поле пустое, сбрасываем суммы категорий
			setCategories(prev =>
				prev.map(cat => ({
					...cat,
					budgetAmount: 0,
				}))
			)
			return
		}

		const amount = parseFloat(value)

		setCategories(prev =>
			prev.map(cat => ({
				...cat,
				budgetAmount: Math.round(((amount * cat.percentage) / 100) * 100) / 100,
			}))
		)
	}

	const handleCategoryAmountChange = (id: string, value: string) => {
		const amount = parseFloat(value) || 0
		const totalBudget = parseFloat(totalAmount) || 0

		setCategories(prev =>
			prev.map(cat =>
				cat.id === id
					? {
							...cat,
							budgetAmount: amount,
							percentage: totalBudget > 0 ? Math.round((amount / totalBudget) * 100) : 0,
					  }
					: cat
			)
		)
	}

	const handleCategoryPercentageChange = (id: string, value: string) => {
		const percentage = parseFloat(value) || 0
		const totalBudget = parseFloat(totalAmount) || 0

		setCategories(prev =>
			prev.map(cat =>
				cat.id === id
					? {
							...cat,
							percentage,
							budgetAmount: Math.round(((totalBudget * percentage) / 100) * 100) / 100,
					  }
					: cat
			)
		)
	}

	const handleDeleteCategory = (id: string) => {
		setCategories(prev => prev.filter(cat => cat.id !== id))
	}

	const handleAddCategory = () => {
		if (!newCategory.name.trim()) {
			alert('Введите название категории')
			return
		}

		const totalBudget = parseFloat(totalAmount) || 0
		const newCat: Category = {
			id: `cat-${Date.now()}`,
			name: newCategory.name,
			icon: newCategory.icon,
			color: newCategory.color,
			percentage: newCategory.percentage,
			budgetAmount: Math.round(((totalBudget * newCategory.percentage) / 100) * 100) / 100,
		}

		setCategories(prev => [...prev, newCat])
		setShowAddCategory(false)
		setNewCategory({
			name: '',
			icon: '📦',
			color: '#6b7280',
			percentage: 5,
		})
	}

	const handleAutoDistribute = () => {
		const count = categories.length
		const equalPercentage = Math.floor(100 / count)
		const remainder = 100 - equalPercentage * count
		const totalBudget = parseFloat(totalAmount) || 0

		setCategories(prev =>
			prev.map((cat, index) => {
				const percentage = index === 0 ? equalPercentage + remainder : equalPercentage
				return {
					...cat,
					percentage,
					budgetAmount: Math.round(((totalBudget * percentage) / 100) * 100) / 100,
				}
			})
		)
	}

	const handleCreateBudget = async () => {
		if (!totalAmount || parseFloat(totalAmount) <= 0) {
			alert('Введите общую сумму бюджета')
			return
		}

		if (categories.length === 0) {
			alert('Добавьте хотя бы одну категорию')
			return
		}

		const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0)
		if (Math.abs(totalPercentage - 100) > 1) {
			alert(`Сумма процентов должна быть 100% (сейчас ${totalPercentage}%)`)
			return
		}

		setLoading(true)

		try {
			const response = await fetch('/api/budget', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					month,
					year,
					totalAmount: parseFloat(totalAmount),
					categories: categories.map(cat => ({
						name: cat.name,
						icon: cat.icon,
						color: cat.color,
						budgetAmount: cat.budgetAmount,
					})),
				}),
			})

			if (response.ok) {
				router.push('/dashboard')
			} else {
				const data = await response.json()
				alert(data.error || 'Ошибка при создании бюджета')
			}
		} catch (error) {
			console.error('Error creating budget:', error)
			alert('Ошибка при создании бюджета')
		} finally {
			setLoading(false)
		}
	}

	const totalAllocated = categories.reduce((sum, cat) => sum + cat.budgetAmount, 0)
	const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0)

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 pb-20'>
			<header className='bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10'>
				<div className='container mx-auto px-3 sm:px-4 py-3 sm:py-4'>
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
						<h1 className='text-lg sm:text-xl font-bold text-gray-900 dark:text-white'>
							Настройка бюджета
						</h1>
						<div className='w-16 sm:w-20'></div>
					</div>
				</div>
			</header>

			<main className='container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl space-y-4 sm:space-y-6'>
				<Card className='dark:bg-gray-800 dark:border-gray-700'>
					<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
						<CardTitle className='text-lg sm:text-xl dark:text-white'>
							Бюджет на {getMonthName(month)} {year}
						</CardTitle>
						<CardDescription className='text-xs sm:text-sm dark:text-gray-400'>
							Введите общую сумму и настройте распределение по категориям
						</CardDescription>
					</CardHeader>
				</Card>

				<Card className='dark:bg-gray-800 dark:border-gray-700'>
					<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
						<CardTitle className='text-base sm:text-lg dark:text-white'>
							Общая сумма бюджета
						</CardTitle>
					</CardHeader>
					<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
						<div className='space-y-3 sm:space-y-4'>
							<div>
								<label className='block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-700 dark:text-gray-200'>
									Сумма (BYN)
								</label>
								<input
									type='number'
									value={totalAmount}
									onChange={e => handleTotalAmountChange(e.target.value)}
									className='w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
									placeholder='5000'
									step='0.01'
									min='0'
								/>
							</div>

							{totalAmount && parseFloat(totalAmount) > 0 && (
								<div className='bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg'>
									<div className='flex justify-between items-center mb-2'>
										<span className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
											Всего бюджет:
										</span>
										<span className='text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400'>
											{formatCurrency(parseFloat(totalAmount))}
										</span>
									</div>
									<div className='flex justify-between items-center mb-2'>
										<span className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
											Распределено:
										</span>
										<span className='text-base sm:text-lg font-semibold text-gray-900 dark:text-white'>
											{formatCurrency(totalAllocated)}
										</span>
									</div>
									<div className='flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-700'>
										<span className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
											Осталось:
										</span>
										<span
											className={`text-base sm:text-lg font-bold ${
												parseFloat(totalAmount) - totalAllocated >= 0
													? 'text-green-600 dark:text-green-400'
													: 'text-red-600 dark:text-red-400'
											}`}
										>
											{formatCurrency(parseFloat(totalAmount) - totalAllocated)}
										</span>
									</div>
									<div className='mt-2 pt-2 border-t border-blue-200 dark:border-blue-700'>
										<div className='flex justify-between items-center'>
											<span className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
												Сумма процентов:
											</span>
											<span
												className={`text-sm sm:text-base font-semibold ${
													Math.abs(totalPercentage - 100) < 1
														? 'text-green-600 dark:text-green-400'
														: 'text-orange-600 dark:text-orange-400'
												}`}
											>
												{totalPercentage.toFixed(1)}%
											</span>
										</div>
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				<Card className='dark:bg-gray-800 dark:border-gray-700'>
					<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
						<div className='flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 sm:gap-0'>
							<div>
								<CardTitle className='text-base sm:text-lg dark:text-white'>
									Категории расходов
								</CardTitle>
								<CardDescription className='text-xs sm:text-sm dark:text-gray-400'>
									{categories.length} категорий
								</CardDescription>
							</div>
							<div className='flex gap-2 w-full xs:w-auto'>
								<Button
									variant='outline'
									size='sm'
									onClick={handleAutoDistribute}
									className='flex-1 xs:flex-none text-xs sm:text-sm h-8 sm:h-9 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
								>
									<Sparkles className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
									Авто
								</Button>
								<Button
									size='sm'
									onClick={() => setShowAddCategory(true)}
									className='flex-1 xs:flex-none text-xs sm:text-sm h-8 sm:h-9'
								>
									<Plus className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
									Добавить
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
						<div className='space-y-3 sm:space-y-4'>
							{categories.map(category => (
								<div
									key={category.id}
									className='border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3'
								>
									<div className='flex items-center gap-2 sm:gap-3'>
										<div
											className='w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0'
											style={{ backgroundColor: `${category.color}20` }}
										>
											{category.icon}
										</div>
										<div className='flex-1 min-w-0'>
											<input
												type='text'
												value={category.name}
												onChange={e =>
													setCategories(prev =>
														prev.map(cat =>
															cat.id === category.id ? { ...cat, name: e.target.value } : cat
														)
													)
												}
												className='w-full px-2 sm:px-3 py-1 sm:py-1.5 text-sm sm:text-base font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
											/>
										</div>
										<Button
											variant='ghost'
											size='icon'
											onClick={() => handleDeleteCategory(category.id)}
											className='text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0'
										>
											<Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
										</Button>
									</div>

									<div className='grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3'>
										<div>
											<label className='block text-[10px] xs:text-xs sm:text-sm font-medium mb-1 text-gray-700 dark:text-gray-200'>
												Сумма (BYN)
											</label>
											<input
												type='number'
												value={category.budgetAmount || ''}
												onChange={e => handleCategoryAmountChange(category.id, e.target.value)}
												className='w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
												placeholder='0'
												step='0.01'
												min='0'
											/>
										</div>
										<div>
											<label className='block text-[10px] xs:text-xs sm:text-sm font-medium mb-1 text-gray-700 dark:text-gray-200'>
												Процент (%)
											</label>
											<input
												type='number'
												value={category.percentage || ''}
												onChange={e => handleCategoryPercentageChange(category.id, e.target.value)}
												className='w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
												placeholder='0'
												step='1'
												min='0'
												max='100'
											/>
										</div>
									</div>

									<div className='h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
										<div
											className='h-full transition-all'
											style={{
												width: `${Math.min(category.percentage, 100)}%`,
												backgroundColor: category.color,
											}}
										/>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{showAddCategory && (
					<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4'>
						<Card className='w-full max-w-md dark:bg-gray-800 dark:border-gray-700 max-h-[90vh] overflow-y-auto'>
							<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
								<div className='flex items-center justify-between'>
									<CardTitle className='text-base sm:text-lg dark:text-white'>
										Новая категория
									</CardTitle>
									<Button
										variant='ghost'
										size='icon'
										onClick={() => {
											setShowAddCategory(false)
											setNewCategory({
												name: '',
												icon: '📦',
												color: '#6b7280',
												percentage: 5,
											})
										}}
										className='dark:hover:bg-gray-700 h-8 w-8'
									>
										<X className='h-4 w-4' />
									</Button>
								</div>
							</CardHeader>
							<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4'>
								<div>
									<label className='block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-700 dark:text-gray-200'>
										Название
									</label>
									<input
										type='text'
										value={newCategory.name}
										onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
										className='w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
										placeholder='Название категории'
										autoFocus
									/>
								</div>

								<div>
									<label className='block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-700 dark:text-gray-200'>
										Выберите иконку
									</label>
									<div className='grid grid-cols-8 xs:grid-cols-10 gap-1.5 sm:gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700'>
										{EMOJI_LIST.map(emoji => (
											<button
												key={emoji}
												type='button'
												onClick={() => setNewCategory({ ...newCategory, icon: emoji })}
												className={`w-8 h-8 sm:w-10 sm:h-10 text-lg sm:text-xl rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
													newCategory.icon === emoji
														? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500'
														: ''
												}`}
											>
												{emoji}
											</button>
										))}
									</div>
								</div>

								<div>
									<label className='block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-700 dark:text-gray-200'>
										Выберите цвет
									</label>
									<div className='grid grid-cols-5 gap-2 sm:gap-3'>
										{COLOR_LIST.map(color => (
											<button
												key={color}
												type='button'
												onClick={() => setNewCategory({ ...newCategory, color })}
												className={`w-full h-10 sm:h-12 rounded-lg transition-all ${
													newCategory.color === color
														? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
														: 'hover:scale-105'
												}`}
												style={{ backgroundColor: color }}
											/>
										))}
									</div>
								</div>

								<div>
									<label className='block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-700 dark:text-gray-200'>
										Процент бюджета
									</label>
									<input
										type='number'
										value={newCategory.percentage}
										onChange={e =>
											setNewCategory({
												...newCategory,
												percentage: parseFloat(e.target.value) || 0,
											})
										}
										className='w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
										step='1'
										min='0'
										max='100'
									/>
								</div>

								<div className='flex gap-2'>
									<Button
										onClick={handleAddCategory}
										className='flex-1 text-sm sm:text-base h-9 sm:h-10'
									>
										Добавить
									</Button>
									<Button
										variant='outline'
										onClick={() => {
											setShowAddCategory(false)
											setNewCategory({
												name: '',
												icon: '📦',
												color: '#6b7280',
												percentage: 5,
											})
										}}
										className='flex-1 text-sm sm:text-base h-9 sm:h-10 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
									>
										Отмена
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				<div className='flex gap-2 sm:gap-3'>
					<Button
						onClick={handleCreateBudget}
						disabled={
							loading ||
							!totalAmount ||
							parseFloat(totalAmount) <= 0 ||
							Math.abs(totalPercentage - 100) > 1
						}
						className='flex-1 text-sm sm:text-base h-10 sm:h-11'
					>
						{loading ? 'Создание...' : 'Создать бюджет'}
					</Button>
					<Link href='/dashboard' className='flex-1'>
						<Button
							variant='outline'
							className='w-full text-sm sm:text-base h-10 sm:h-11 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
						>
							Отмена
						</Button>
					</Link>
				</div>
			</main>
		</div>
	)
}
