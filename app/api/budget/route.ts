import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const categorySchema = z.object({
	name: z.string(),
	icon: z.string(),
	color: z.string(),
	budgetAmount: z.number().positive(),
})

const budgetSchema = z.object({
	month: z.number().min(1).max(12),
	year: z.number(),
	totalAmount: z.number().positive(),
	categories: z.array(categorySchema),
})

// GET - получить бюджет
export async function GET(request: Request) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const month = parseInt(searchParams.get('month') || '')
		const year = parseInt(searchParams.get('year') || '')

		const budget = await prisma.budget.findUnique({
			where: {
				userId_month_year: {
					userId: session.user.id,
					month,
					year,
				},
			},
			include: {
				categories: {
					include: {
						transactions: true, // ✅ Получаем все транзакции
					},
				},
			},
		})

		if (!budget) {
			return NextResponse.json({ budget: null })
		}

		// Подсчитываем потраченное в каждой категории
		const categoriesWithSpent = budget.categories.map(cat => {
			// ✅ INCOME вычитаем, EXPENSE добавляем
			const spent = cat.transactions.reduce((sum, t) => {
				if (t.type === 'EXPENSE') {
					return sum + Number(t.amount)
				} else if (t.type === 'INCOME') {
					return sum - Number(t.amount) // Вычитаем доходы из расходов (корректировки)
				}
				return sum
			}, 0)

			return {
				...cat,
				spent: Math.max(0, spent), // ✅ Не даём уйти в минус
				transactions: undefined, // убираем транзакции из ответа
			}
		})

		return NextResponse.json({
			budget: {
				...budget,
				categories: categoriesWithSpent,
			},
		})
	} catch (error) {
		console.error('Budget GET error:', error)
		return NextResponse.json({ error: 'Failed to fetch budget' }, { status: 500 })
	}
}

// POST - создать или обновить бюджет
export async function POST(request: Request) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { month, year, totalAmount, categories } = budgetSchema.parse(body)

		// Удаляем старый бюджет если есть
		await prisma.budget.deleteMany({
			where: {
				userId: session.user.id,
				month,
				year,
			},
		})

		// Создаём новый бюджет с категориями
		const budget = await prisma.budget.create({
			data: {
				userId: session.user.id,
				month,
				year,
				totalAmount,
				categories: {
					create: categories.map(cat => ({
						name: cat.name,
						icon: cat.icon,
						color: cat.color,
						budgetAmount: cat.budgetAmount,
					})),
				},
			},
			include: {
				categories: true,
			},
		})

		return NextResponse.json({ budget })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
		}

		console.error('Budget POST error:', error)
		return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 })
	}
}
