'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

interface Budget {
	id: string
	month: number
	year: number
	totalAmount: number
}

function BudgetEditContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const monthParam = searchParams.get('month')
	const yearParam = searchParams.get('year')

	const { month: currentMonth, year: currentYear } = getCurrentMonthYear()
	const month = monthParam ? parseInt(monthParam) : currentMonth
	const year = yearParam ? parseInt(yearParam) : currentYear

	const [budget, setBudget] = useState<Budget | null>(null)
	const [totalAmount, setTotalAmount] = useState('')
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		fetchBudget()
	}, [month, year])

	const fetchBudget = async () => {
		try {
			setLoading(true)
			const response = await fetch(`/api/budget?month=${month}&year=${year}`)
			const data = await response.json()

			if (data.budget) {
				setBudget(data.budget)
				setTotalAmount(data.budget.totalAmount.toString())
			}
		} catch (error) {
			console.error('Error fetching budget:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleSaveBudget = async () => {
		if (!totalAmount || parseFloat(totalAmount) <= 0) {
			alert('Введите корректную сумму бюджета')
			return
		}

		setSaving(true)

		try {
			const response = await fetch('/api/budget/total', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					budgetId: budget?.id,
					totalAmount: parseFloat(totalAmount),
				}),
			})

			if (response.ok) {
				router.push('/dashboard')
			} else {
				const data = await response.json()
				alert(data.error || 'Ошибка при обновлении бюджета')
			}
		} catch (error) {
			console.error('Error saving budget:', error)
			alert('Ошибка при сохранении бюджета')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		)
	}

	if (!budget) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
				<Card className='dark:bg-gray-800 dark:border-gray-700'>
					<CardContent className='pt-6 text-center'>
						<p className='text-gray-600 dark:text-gray-400 mb-4'>Бюджет не найден</p>
						<Link href='/dashboard'>
							<Button>Вернуться на главную</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 pb-20'>
			<motion.header
				initial={{ y: -100 }}
				animate={{ y: 0 }}
				transition={{ type: 'spring', stiffness: 100 }}
				className='bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10'
			>
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
							Редактирование бюджета
						</h1>
						<div className='w-16 sm:w-20'></div>
					</div>
				</div>
			</motion.header>

			<main className='container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl space-y-4 sm:space-y-6'>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
				>
					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
							<CardTitle className='text-lg sm:text-xl dark:text-white'>
								Бюджет на {getMonthName(month)} {year}
							</CardTitle>
							<CardDescription className='text-xs sm:text-sm dark:text-gray-400'>
								Измените общую сумму месячного бюджета
							</CardDescription>
						</CardHeader>
						<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6 space-y-4'>
							<div>
								<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
									Общая сумма бюджета (BYN)
								</label>
								<input
									type='number'
									value={totalAmount}
									onChange={e => setTotalAmount(e.target.value)}
									className='w-full px-4 py-3 text-xl font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
									step='0.01'
									min='0'
									autoFocus
								/>
							</div>

							{totalAmount && parseFloat(totalAmount) > 0 && (
								<motion.div
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg'
								>
									<div className='text-center'>
										<p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
											Новый месячный бюджет
										</p>
										<p className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
											{formatCurrency(parseFloat(totalAmount))}
										</p>
									</div>
								</motion.div>
							)}

							<div className='flex gap-3 pt-4'>
								<motion.div
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									className='flex-1'
								>
									<Button
										onClick={handleSaveBudget}
										disabled={saving || !totalAmount || parseFloat(totalAmount) <= 0}
										className='w-full h-11'
									>
										{saving ? 'Сохранение...' : 'Сохранить изменения'}
									</Button>
								</motion.div>
								<Link href='/dashboard' className='flex-1'>
									<Button
										variant='outline'
										className='w-full h-11 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
									>
										Отмена
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					<Card className='dark:bg-gray-800 dark:border-gray-700'>
						<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
							<CardTitle className='text-lg sm:text-xl dark:text-white'>
								Управление категориями
							</CardTitle>
							<CardDescription className='text-xs sm:text-sm dark:text-gray-400'>
								Используйте дашборд для редактирования категорий
							</CardDescription>
						</CardHeader>
						<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
							<p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
								Нажмите на категорию в дашборде для быстрого редактирования бюджета и расходов
								категории
							</p>
							<Link href='/dashboard'>
								<Button
									variant='outline'
									className='w-full dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
								>
									Вернуться к дашборду
								</Button>
							</Link>
						</CardContent>
					</Card>
				</motion.div>
			</main>
		</div>
	)
}

export default function BudgetEditPage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
				</div>
			}
		>
			<BudgetEditContent />
		</Suspense>
	)
}
