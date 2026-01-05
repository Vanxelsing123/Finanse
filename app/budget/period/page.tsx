'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function BudgetPeriodPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const month = parseInt(searchParams.get('month') || '1')
	const year = parseInt(searchParams.get('year') || '2024')

	const [startDay, setStartDay] = useState(1)
	const [endDay, setEndDay] = useState(31)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		fetchBudget()
	}, [month, year])

	const fetchBudget = async () => {
		try {
			const response = await fetch(`/api/budget?month=${month}&year=${year}`)
			const data = await response.json()
			if (data.budget) {
				setStartDay(data.budget.startDay || 1)
				setEndDay(data.budget.endDay || 31)
			}
		} catch (error) {
			console.error('Error fetching budget:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			const response = await fetch('/api/budget/period', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					month,
					year,
					startDay,
					endDay,
				}),
			})

			if (response.ok) {
				window.location.href = '/dashboard'
			} else {
				alert('Ошибка при сохранении')
			}
		} catch (error) {
			console.error('Error saving period:', error)
			alert('Ошибка при сохранении')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-50 dark:bg-gray-900 pb-20'>
			<header className='bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10'>
				<div className='container mx-auto px-4 py-4'>
					<div className='flex items-center justify-between'>
						<Link href='/dashboard'>
							<Button variant='ghost' size='sm' className='dark:text-gray-200'>
								<ArrowLeft className='h-4 w-4 mr-2' />
								Назад
							</Button>
						</Link>
						<h1 className='text-xl font-bold text-gray-900 dark:text-white'>Период бюджета</h1>
						<div className='w-20'></div>
					</div>
				</div>
			</header>

			<main className='container mx-auto px-4 py-6 max-w-2xl'>
				<Card className='dark:bg-gray-800 dark:border-gray-700'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2 dark:text-white'>
							<Calendar className='h-5 w-5' />
							Настройка периода бюджета
						</CardTitle>
						<CardDescription className='dark:text-gray-400'>
							{startDay > endDay ? (
								<>
									Период с{' '}
									<strong>
										{startDay} {new Date(year, month - 1).toLocaleString('ru', { month: 'long' })}
									</strong>{' '}
									по{' '}
									<strong>
										{endDay} {new Date(year, month).toLocaleString('ru', { month: 'long' })}
									</strong>
								</>
							) : (
								<>
									Укажите, с какого по какое число считать ваш месячный бюджет для{' '}
									{new Date(year, month - 1).toLocaleString('ru', {
										month: 'long',
										year: 'numeric',
									})}
								</>
							)}
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
									Начало периода
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
								<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
									Конец периода
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

						<div className='p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
							<p className='text-sm text-gray-700 dark:text-gray-300 mb-2'>
								<span className='font-semibold'>Ваш период:</span>
							</p>
							{startDay > endDay ? (
								<div className='space-y-1'>
									<p className='text-sm font-medium text-blue-600 dark:text-blue-400'>
										С {startDay} {new Date(year, month - 1).toLocaleString('ru', { month: 'long' })}{' '}
										по {endDay} {new Date(year, month).toLocaleString('ru', { month: 'long' })}
									</p>
									<p className='text-xs text-gray-600 dark:text-gray-400'>
										💡 Период переходит на следующий месяц
									</p>
									<p className='text-xs text-gray-500 dark:text-gray-500'>
										Это будет отображаться как "
										{new Date(year, month - 1).toLocaleString('ru', { month: 'long' })}-
										{new Date(year, month).toLocaleString('ru', { month: 'long' })}"
									</p>
								</div>
							) : (
								<p className='text-sm font-medium text-blue-600 dark:text-blue-400'>
									С {startDay} по {endDay} число{' '}
									{new Date(year, month - 1).toLocaleString('ru', { month: 'long' })}
								</p>
							)}
						</div>

						<div className='space-y-2'>
							<p className='text-sm font-medium text-gray-700 dark:text-gray-200'>
								Популярные варианты:
							</p>
							<div className='grid grid-cols-2 gap-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => {
										setStartDay(1)
										setEndDay(31)
									}}
									className='dark:border-gray-600 dark:text-gray-200'
								>
									1-31 (стандарт)
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={() => {
										setStartDay(10)
										setEndDay(9)
									}}
									className='dark:border-gray-600 dark:text-gray-200'
								>
									10-9 (ЗП 10-го)
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={() => {
										setStartDay(15)
										setEndDay(14)
									}}
									className='dark:border-gray-600 dark:text-gray-200'
								>
									15-14 (ЗП 15-го)
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={() => {
										setStartDay(25)
										setEndDay(24)
									}}
									className='dark:border-gray-600 dark:text-gray-200'
								>
									25-24 (ЗП 25-го)
								</Button>
							</div>
						</div>

						<Button onClick={handleSave} disabled={saving} className='w-full'>
							<Save className='h-4 w-4 mr-2' />
							{saving ? 'Сохранение...' : 'Сохранить'}
						</Button>
					</CardContent>
				</Card>
			</main>
		</div>
	)
}
