'use client'

import { motion } from 'framer-motion'
import { formatAmount, getCurrencyInfo, Savings } from './types'

interface SavingsCardProps {
	saving: Savings
	index: number
	onClick: () => void
}

export function SavingsCard({ saving, index, onClick }: SavingsCardProps) {
	const currencyInfo = getCurrencyInfo(saving.currency)

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay: index * 0.1 }}
			whileHover={{ scale: 1.05, y: -5 }}
			whileTap={{ scale: 0.95 }}
			onClick={onClick}
			className='cursor-pointer'
		>
			<div className='bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 sm:p-6 rounded-xl border-2 border-green-200 dark:border-green-800 hover:shadow-lg transition-all'>
				<div className='flex items-center gap-2 mb-2'>
					<span className='text-2xl sm:text-3xl'>{currencyInfo.flag}</span>
					<div>
						<p className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
							{currencyInfo.name}
						</p>
						<p className='text-[10px] sm:text-xs text-gray-500 dark:text-gray-500'>
							{saving.currency}
						</p>
					</div>
				</div>
				<p className='text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mt-3'>
					{formatAmount(saving.amount, saving.currency)}
				</p>
				{saving.transactions.length > 0 && (
					<div className='mt-3 pt-3 border-t border-green-200 dark:border-green-800'>
						<p className='text-[10px] sm:text-xs text-gray-500 dark:text-gray-400'>
							Последнее изменение:{' '}
							{new Date(saving.transactions[0].createdAt).toLocaleDateString('ru-RU')}
						</p>
					</div>
				)}
			</div>
		</motion.div>
	)
}
