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
	startDay: z.number().min(1).max(31).optional().default(1),
	endDay: z.number().min(1).max(31).optional().default(31),
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
						transactions: true,
					},
				},
			},
		})

		if (!budget) {
			return NextResponse.json({ budget: null })
		}

		// Подсчитываем потраченное в каждой категории
		const categoriesWithSpent = budget.categories.map(cat => {
			const spent = cat.transactions.reduce((sum, t) => {
				if (t.type === 'EXPENSE') {
					return sum + Number(t.amount)
				} else if (t.type === 'INCOME') {
					return sum - Number(t.amount)
				}
				return sum
			}, 0)

			return {
				...cat,
				spent: Math.max(0, spent),
				transactions: undefined,
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

// POST - создать бюджет
export async function POST(request: Request) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { month, year, totalAmount, startDay, endDay, categories } = budgetSchema.parse(body)

		// Проверяем существующий бюджет
		const existingBudget = await prisma.budget.findUnique({
			where: {
				userId_month_year: {
					userId: session.user.id,
					month,
					year,
				},
			},
		})

		if (existingBudget) {
			return NextResponse.json({ error: 'Budget for this month already exists' }, { status: 400 })
		}

		// Создаём новый бюджет с категориями
		const budget = await prisma.budget.create({
			data: {
				userId: session.user.id,
				month,
				year,
				totalAmount,
				startDay,
				endDay,
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
