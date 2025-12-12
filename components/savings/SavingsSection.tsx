'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, Variants } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AddSavingsModal } from './AddSavingsModal'
import { ManageSavingsModal } from './ManageSavingsModal'
import { SavingsCard } from './SavingsCard'
import { Savings } from './types'

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

export function SavingsSection() {
	const [savings, setSavings] = useState<Savings[]>([])
	const [showAddSavings, setShowAddSavings] = useState(false)
	const [showManageSavings, setShowManageSavings] = useState<Savings | null>(null)

	useEffect(() => {
		fetchSavings()
	}, [])

	const fetchSavings = async () => {
		try {
			const response = await fetch('/api/savings')
			const data = await response.json()
			setSavings(data.savings || [])
		} catch (error) {
			console.error('Error fetching savings:', error)
		}
	}

	const handleSavingsUpdated = () => {
		fetchSavings()
	}

	return (
		<>
			<motion.div variants={itemVariants}>
				<Card className='dark:bg-gray-800 dark:border-gray-700'>
					<CardHeader className='px-3 sm:px-6 py-3 sm:py-6'>
						<div className='flex justify-between items-center'>
							<div>
								<CardTitle className='dark:text-white text-base sm:text-lg md:text-xl flex items-center gap-2'>
									💰 Накопления
								</CardTitle>
								<CardDescription className='text-xs sm:text-sm dark:text-gray-400'>
									{savings.length > 0 ? `${savings.length} валют` : 'Создайте накопления'}
								</CardDescription>
							</div>
							<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
								<Button
									size='sm'
									onClick={() => setShowAddSavings(true)}
									className='text-xs sm:text-sm h-8 sm:h-9'
								>
									<Plus className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
									Добавить
								</Button>
							</motion.div>
						</div>
					</CardHeader>
					<CardContent className='px-3 sm:px-6 pb-3 sm:pb-6'>
						{savings.length > 0 ? (
							<div className='grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
								{savings.map((saving, index) => (
									<SavingsCard
										key={saving.id}
										saving={saving}
										index={index}
										onClick={() => setShowManageSavings(saving)}
									/>
								))}
							</div>
						) : (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className='text-center py-8'
							>
								<div className='text-6xl mb-4'>💰</div>
								<p className='text-gray-600 dark:text-gray-400 mb-4'>Нет накоплений</p>
								<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
									<Button onClick={() => setShowAddSavings(true)}>
										<Plus className='h-4 w-4 mr-2' />
										Создать накопления
									</Button>
								</motion.div>
							</motion.div>
						)}
					</CardContent>
				</Card>
			</motion.div>

			<AddSavingsModal
				isOpen={showAddSavings}
				onClose={() => setShowAddSavings(false)}
				existingSavings={savings}
				onSavingsAdded={handleSavingsUpdated}
			/>

			<ManageSavingsModal
				savings={showManageSavings}
				onClose={() => setShowManageSavings(null)}
				onSavingsUpdated={handleSavingsUpdated}
			/>
		</>
	)
}
