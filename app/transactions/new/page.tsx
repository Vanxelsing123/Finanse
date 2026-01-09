'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentMonthYear } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Category {
	id: string
	name: string
	icon: string
	color: string
}

interface Budget {
	id: string
	month: number
	year: number
}

export default function NewTransactionPage() {
	const router = useRouter()
	const [categories, setCategories] = useState<Category[]>([])
	const [budget, setBudget] = useState<Budget | null>(null)
	const [formData, setFormData] = useState({
		categoryId: '',
		amount: '',
		description: '',
		date: new Date().toISOString().split('T')[0],
		type: 'EXPENSE',
	})
	const [loading, setLoading] = useState(false)
	const [loadingCategories, setLoadingCategories] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		fetchCategories()
	}, [])

	const fetchCategories = async () => {
		try {
			// ✅ ИСПРАВЛЕНИЕ 1: Читаем месяц из localStorage
			let month = getCurrentMonthYear().month
			let year = getCurrentMonthYear().year

			if (typeof window !== 'undefined') {
				const savedMonth = localStorage.getItem('lastViewedMonth')
				if (savedMonth) {
					try {
						const parsed = JSON.parse(savedMonth)
						month = parsed.month
						year = parsed.year
					} catch (e) {
						console.error('Error parsing saved month:', e)
					}
				}
			}

			// ✅ ИСПРАВЛЕНИЕ 2: Пытаемся загрузить бюджет из сохранённого месяца
			let response = await fetch(`/api/budget?month=${month}&year=${year}`)
			let data = await response.json()

			// ✅ ИСПРАВЛЕНИЕ 3: Если бюджета нет, пробуем текущий месяц
			if (!data.budget) {
				const current = getCurrentMonthYear()
				response = await fetch(`/api/budget?month=${current.month}&year=${current.year}`)
				data = await response.json()
			}

			if (data.budget?.categories) {
				setBudget(data.budget)
				setCategories(data.budget.categories)
				if (data.budget.categories.length > 0) {
					setFormData(prev => ({ ...prev, categoryId: data.budget.categories[0].id }))
				}
			} else {
				setError('Сначала создайте бюджет')
			}
		} catch (error) {
			console.error('Error fetching categories:', error)
			setError('Ошибка загрузки категорий')
		} finally {
			setLoadingCategories(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')

		if (!formData.amount || parseFloat(formData.amount) <= 0) {
			setError('Введите корректную сумму')
			return
		}

		if (!formData.categoryId) {
			setError('Выберите категорию')
			return
		}

		setLoading(true)

		try {
			const response = await fetch('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					categoryId: formData.categoryId,
					amount: parseFloat(formData.amount),
					description: formData.description || undefined,
					date: formData.date,
					type: formData.type,
				}),
			})

			const data = await response.json()

			if (response.ok) {
				// ✅ ИСПРАВЛЕНИЕ 4: Возвращаемся на правильный месяц
				if (budget) {
					router.push(`/dashboard?month=${budget.month}&year=${budget.year}`)
				} else {
					router.push('/dashboard')
				}
				router.refresh()
			} else {
				setError(data.error || 'Ошибка при добавлении транзакции')
			}
		} catch (error) {
			console.error('Error:', error)
			setError('Произошла ошибка при отправке данных')
		} finally {
			setLoading(false)
		}
	}

	const quickAmounts = [10, 20, 50, 100, 200, 500]

	if (loadingCategories) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800'>
			<header className='bg-white dark:bg-gray-800 shadow-sm'>
				<div className='container mx-auto px-4 py-4'>
					<Link href='/dashboard'>
						<Button variant='ghost' size='sm' className='dark:text-gray-200 dark:hover:bg-gray-700'>
							<ArrowLeft className='h-4 w-4 mr-2' />
							Назад
						</Button>
					</Link>
				</div>
			</header>

			<main className='container mx-auto px-4 py-8 max-w-2xl'>
				<Card className='dark:bg-gray-800 dark:border-gray-700'>
					<CardHeader>
						<CardTitle className='dark:text-white'>Добавить транзакцию</CardTitle>
					</CardHeader>
					<CardContent>
						{error ? (
							<div className='text-center py-8'>
								<div className='text-6xl mb-4'>⚠️</div>
								<p className='text-gray-600 dark:text-gray-300 mb-4 text-lg font-semibold'>
									{error}
								</p>
								<Link href='/budget/setup'>
									<Button>Создать бюджет</Button>
								</Link>
							</div>
						) : categories.length === 0 ? (
							<div className='text-center py-8'>
								<div className='text-6xl mb-4'>💰</div>
								<p className='text-gray-600 dark:text-gray-300 mb-4'>
									Сначала создайте бюджет с категориями
								</p>
								<Link href='/budget/setup'>
									<Button>Создать бюджет</Button>
								</Link>
							</div>
						) : (
							<form onSubmit={handleSubmit} className='space-y-6'>
								<div>
									<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
										Тип транзакции
									</label>
									<div className='flex gap-2'>
										<Button
											type='button'
											variant={formData.type === 'EXPENSE' ? 'default' : 'outline'}
											onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
											className='flex-1 dark:border-gray-600'
										>
											💸 Расход
										</Button>
										<Button
											type='button'
											variant={formData.type === 'INCOME' ? 'default' : 'outline'}
											onClick={() => setFormData({ ...formData, type: 'INCOME' })}
											className='flex-1 dark:border-gray-600'
										>
											💰 Доход
										</Button>
									</div>
								</div>

								<div>
									<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
										Сумма (BYN) <span className='text-red-500'>*</span>
									</label>
									<input
										type='number'
										value={formData.amount}
										onChange={e => setFormData({ ...formData, amount: e.target.value })}
										className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
										placeholder='0.00'
										step='0.01'
										min='0.01'
										autoFocus
									/>

									<div className='grid grid-cols-3 gap-2 mt-4'>
										{quickAmounts.map(amount => (
											<Button
												key={amount}
												type='button'
												variant='outline'
												className='dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
												onClick={() =>
													setFormData(prev => ({
														...prev,
														amount: amount.toString(),
													}))
												}
											>
												{amount} BYN
											</Button>
										))}
									</div>
								</div>

								<div>
									<label className='block text-sm font-medium mb-3 text-gray-700 dark:text-gray-200'>
										Категория <span className='text-red-500'>*</span>
									</label>
									<div className='grid grid-cols-2 gap-3'>
										{categories.map(category => (
											<button
												key={category.id}
												type='button'
												onClick={() => setFormData({ ...formData, categoryId: category.id })}
												className={`p-4 border-2 rounded-lg transition ${
													formData.categoryId === category.id
														? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
														: 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
												}`}
											>
												<div className='text-3xl mb-2'>{category.icon}</div>
												<div className='text-sm font-medium text-gray-900 dark:text-white'>
													{category.name}
												</div>
											</button>
										))}
									</div>
								</div>

								<div>
									<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
										Описание (опционально)
									</label>
									<input
										type='text'
										value={formData.description}
										onChange={e => setFormData({ ...formData, description: e.target.value })}
										className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'
										placeholder='Например: Кофе в кафе...'
										maxLength={200}
									/>
								</div>

								<div>
									<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
										Дата <span className='text-red-500'>*</span>
									</label>
									<input
										type='date'
										value={formData.date}
										onChange={e => setFormData({ ...formData, date: e.target.value })}
										className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
										max={new Date().toISOString().split('T')[0]}
									/>
								</div>

								{error && (
									<div className='bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm'>
										{error}
									</div>
								)}

								<Button
									type='submit'
									className='w-full'
									size='lg'
									disabled={loading || !formData.categoryId || !formData.amount}
								>
									{loading
										? 'Добавление...'
										: formData.type === 'EXPENSE'
										? 'Добавить расход'
										: 'Добавить доход'}
								</Button>
							</form>
						)}
					</CardContent>
				</Card>
			</main>
		</div>
	)
}
