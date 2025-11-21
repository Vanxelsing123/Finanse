import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const addCategorySchema = z.object({
	budgetId: z.string(),
	name: z.string(),
	icon: z.string(),
	color: z.string(),
	budgetAmount: z.number().min(0),
})

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { budgetId, name, icon, color, budgetAmount } = addCategorySchema.parse(body)

		// Проверяем что бюджет принадлежит пользователю
		const budget = await prisma.budget.findFirst({
			where: {
				id: budgetId,
				userId: session.user.id,
			},
		})

		if (!budget) {
			return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
		}

		// Создаём новую категорию
		const category = await prisma.category.create({
			data: {
				budgetId,
				name,
				icon,
				color,
				budgetAmount,
			},
		})

		return NextResponse.json({ category })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
		}

		console.error('Add category error:', error)
		return NextResponse.json({ error: 'Failed to add category' }, { status: 500 })
	}
}
