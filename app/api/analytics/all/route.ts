import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function GET() {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Получаем все бюджеты пользователя
		const budgets = await prisma.budget.findMany({
			where: {
				userId: session.user.id,
			},
			include: {
				categories: {
					include: {
						transactions: true,
					},
				},
			},
			orderBy: [{ year: 'desc' }, { month: 'desc' }],
		})

		// Получаем все накопления
		const savings = await prisma.savings.findMany({
			where: {
				userId: session.user.id,
			},
		})

		// ✅ Подсчитываем общую статистику
		let totalBudget = 0
		let totalSpent = 0
		const categoryStats: Record
			string,
			{ name: string; icon: string; color: string; spent: number; budget: number }
		> = {}

		budgets.forEach(budget => {
			totalBudget += Number(budget.totalAmount)

			budget.categories.forEach(category => {
				const spent = category.transactions.reduce((sum, t) => {
					if (t.type === 'EXPENSE') {
						return sum + Number(t.amount)
					} else if (t.type === 'INCOME') {
						return sum - Number(t.amount)
					}
					return sum
				}, 0)

				totalSpent += Math.max(0, spent)

				const key = category.name
				if (!categoryStats[key]) {
					categoryStats[key] = {
						name: category.name,
						icon: category.icon,
						color: category.color,
						spent: 0,
						budget: 0,
					}
				}
				categoryStats[key].spent += Math.max(0, spent)
				categoryStats[key].budget += Number(category.budgetAmount)
			})
		})

		const totalSavings = savings.reduce((sum, s) => {
			const amount =
				typeof s.amount === 'string' ? parseFloat(s.amount) : Number(s.amount)
			return sum + amount
		}, 0)

		// Конвертируем объект категорий в массив
		const categories = Object.values(categoryStats).sort((a, b) => b.spent - a.spent)

		return NextResponse.json({
			totalBudget,
			totalSpent,
			totalSavings,
			budgetsCount: budgets.length,
			categories,
			savings,
		})
	} catch (error) {
		console.error('Analytics all error:', error)
		return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
	}
}