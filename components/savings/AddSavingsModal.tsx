'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useState } from 'react'
import { CURRENCIES, Savings } from './types'

interface AddSavingsModalProps {
	isOpen: boolean
	onClose: () => void
	existingSavings: Savings[]
	onSavingsAdded: () => void
}

export function AddSavingsModal({
	isOpen,
	onClose,
	existingSavings,
	onSavingsAdded,
}: AddSavingsModalProps) {
	const [selectedCurrency, setSelectedCurrency] = useState('BYN')
	const [loading, setLoading] = useState(false)

	const handleAddSavings = async () => {
		try {
			setLoading(true)
			const response = await fetch('/api/savings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currency: selectedCurrency }),
			})

			if (response.ok) {
				onClose()
				onSavingsAdded()
			} else {
				const data = await response.json()
				alert(data.error || 'Ошибка при создании')
			}
		} catch (error) {
			console.error('Error adding savings:', error)
			alert('Ошибка при создании накоплений')
		} finally {
			setLoading(false)
		}
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4'
					onClick={onClose}
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.8, y: 50 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.8, y: 50 }}
						transition={{ type: 'spring', stiffness: 300, damping: 25 }}
						onClick={e => e.stopPropagation()}
					>
						<Card className='w-full max-w-md dark:bg-gray-800 dark:border-gray-700'>
							<CardHeader className='pb-3'>
								<div className='flex items-center justify-between'>
									<CardTitle className='text-base sm:text-lg dark:text-white'>
										Добавить накопления
									</CardTitle>
									<Button
										variant='ghost'
										size='icon'
										onClick={onClose}
										className='dark:hover:bg-gray-700 h-8 w-8'
									>
										<X className='h-4 w-4' />
									</Button>
								</div>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div>
									<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
										Выберите валюту
									</label>
									<div className='grid grid-cols-1 gap-2'>
										{CURRENCIES.map(currency => (
											<motion.button
												key={currency.code}
												whileHover={{ scale: 1.02 }}
												whileTap={{ scale: 0.98 }}
												onClick={() => setSelectedCurrency(currency.code)}
												disabled={existingSavings.some(s => s.currency === currency.code)}
												className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
													selectedCurrency === currency.code
														? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
														: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
												} ${
													existingSavings.some(s => s.currency === currency.code)
														? 'opacity-50 cursor-not-allowed'
														: ''
												}`}
											>
												<span className='text-2xl'>{currency.flag}</span>
												<div className='flex-1 text-left'>
													<p className='font-medium text-gray-900 dark:text-white'>
														{currency.name}
													</p>
													<p className='text-xs text-gray-500 dark:text-gray-400'>
														{currency.code} ({currency.symbol})
													</p>
												</div>
												{existingSavings.some(s => s.currency === currency.code) && (
													<span className='text-xs text-gray-500'>Уже добавлено</span>
												)}
											</motion.button>
										))}
									</div>
								</div>

								<div className='flex gap-2'>
									<motion.div
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										className='flex-1'
									>
										<Button onClick={handleAddSavings} disabled={loading} className='w-full'>
											{loading ? 'Создание...' : 'Создать'}
										</Button>
									</motion.div>
									<motion.div
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										className='flex-1'
									>
										<Button
											variant='outline'
											onClick={onClose}
											className='w-full dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
										>
											Отмена
										</Button>
									</motion.div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
