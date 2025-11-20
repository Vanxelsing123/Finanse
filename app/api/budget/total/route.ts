import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateTotalBudgetSchema = z.object({
	budgetId: z.string(),
	totalAmount: z.number().positive(),
})

export async function PATCH(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { budgetId, totalAmount } = updateTotalBudgetSchema.parse(body)

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

		// Обновляем общий бюджет
		const updatedBudget = await prisma.budget.update({
			where: { id: budgetId },
			data: { totalAmount },
		})

		return NextResponse.json({
			budget: updatedBudget,
			success: true,
		})
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
		}

		console.error('Update total budget error:', error)
		return NextResponse.json({ error: 'Failed to update total budget' }, { status: 500 })
	}
}
