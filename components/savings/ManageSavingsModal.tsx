'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Savings, formatAmount, getCurrencyInfo } from './types'

interface ManageSavingsModalProps {
	savings: Savings | null
	onClose: () => void
	onSavingsUpdated: () => void
}

export function ManageSavingsModal({
	savings,
	onClose,
	onSavingsUpdated,
}: ManageSavingsModalProps) {
	const [amount, setAmount] = useState('')
	const [operationType, setOperationType] = useState<'ADD' | 'SUBTRACT'>('ADD')
	const [loading, setLoading] = useState(false)

	if (!savings) return null

	const handleUpdateSavings = async () => {
		if (!amount || parseFloat(amount) <= 0) return

		try {
			setLoading(true)
			const response = await fetch('/api/savings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					savingsId: savings.id,
					amount: parseFloat(amount),
					type: operationType,
				}),
			})

			if (response.ok) {
				onClose()
				setAmount('')
				setOperationType('ADD')
				onSavingsUpdated()
			} else {
				const data = await response.json()
				alert(data.error || 'Ошибка при обновлении')
			}
		} catch (error) {
			console.error('Error updating savings:', error)
			alert('Ошибка при обновлении')
		} finally {
			setLoading(false)
		}
	}

	const currencyInfo = getCurrencyInfo(savings.currency)
	const currentAmount =
		typeof savings.amount === 'string' ? parseFloat(savings.amount) : savings.amount
	const newAmount = currentAmount + (operationType === 'ADD' ? 1 : -1) * parseFloat(amount || '0')

	return (
		<AnimatePresence>
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
					<Card className='w-full max-w-md dark:bg-gray-800 dark:border-gray-700 max-h-[90vh] overflow-y-auto'>
						<CardHeader className='pb-3'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<span className='text-2xl'>{currencyInfo.flag}</span>
									<CardTitle className='text-base sm:text-lg dark:text-white'>
										{currencyInfo.name}
									</CardTitle>
								</div>
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
							<div className='bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg'>
								<p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>Текущий баланс</p>
								<p className='text-3xl font-bold text-green-600 dark:text-green-400'>
									{formatAmount(currentAmount, savings.currency)}
								</p>
							</div>

							<div className='flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg'>
								<button
									onClick={() => setOperationType('ADD')}
									className={`flex-1 py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-1 ${
										operationType === 'ADD'
											? 'bg-green-500 text-white'
											: 'text-gray-600 dark:text-gray-300'
									}`}
								>
									<Plus className='h-4 w-4' />
									Пополнить
								</button>
								<button
									onClick={() => setOperationType('SUBTRACT')}
									className={`flex-1 py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-1 ${
										operationType === 'SUBTRACT'
											? 'bg-red-500 text-white'
											: 'text-gray-600 dark:text-gray-300'
									}`}
								>
									<Minus className='h-4 w-4' />
									Снять
								</button>
							</div>

							<div>
								<label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200'>
									Сумма ({currencyInfo.symbol})
								</label>
								<input
									type='number'
									value={amount}
									onChange={e => setAmount(e.target.value)}
									className='w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
									placeholder='0.00'
									step='0.01'
									min='0'
									max={operationType === 'SUBTRACT' ? currentAmount : undefined}
									autoFocus
								/>
							</div>

							{amount && parseFloat(amount) > 0 && (
								<motion.div
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg'
								>
									<div className='flex justify-between items-center'>
										<span className='text-sm text-gray-600 dark:text-gray-400'>Новый баланс:</span>
										<span className='text-lg font-bold text-blue-600 dark:text-blue-400'>
											{formatAmount(newAmount, savings.currency)}
										</span>
									</div>
								</motion.div>
							)}

							<div className='flex gap-2'>
								<motion.div
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									className='flex-1'
								>
									<Button
										onClick={handleUpdateSavings}
										disabled={loading || !amount || parseFloat(amount) <= 0}
										className={`w-full ${
											operationType === 'SUBTRACT' ? 'bg-red-500 hover:bg-red-600' : ''
										}`}
									>
										{loading ? 'Обработка...' : operationType === 'ADD' ? 'Пополнить' : 'Снять'}
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
		</AnimatePresence>
	)
}
