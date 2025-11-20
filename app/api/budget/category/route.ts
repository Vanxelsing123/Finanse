import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateCategorySchema = z.object({
	categoryId: z.string(),
	budgetAmount: z.number().positive().optional(),
	spent: z.number().min(0).optional(),
})

export async function PATCH(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { categoryId, budgetAmount, spent } = updateCategorySchema.parse(body)

		// Проверяем что категория принадлежит пользователю
		const category = await prisma.category.findFirst({
			where: {
				id: categoryId,
				budget: {
					userId: session.user.id,
				},
			},
			include: {
				transactions: true,
			},
		})

		if (!category) {
			return NextResponse.json({ error: 'Category not found' }, { status: 404 })
		}

		// Обновляем бюджет если указан
		if (budgetAmount !== undefined) {
			await prisma.category.update({
				where: { id: categoryId },
				data: { budgetAmount },
			})
		}

		// Обновляем потраченную сумму если указана
		if (spent !== undefined) {
			// Вычисляем текущую сумму: EXPENSE - INCOME
			const currentSpent = category.transactions.reduce((sum, t) => {
				if (t.type === 'EXPENSE') {
					return sum + Number(t.amount)
				} else if (t.type === 'INCOME') {
					return sum - Number(t.amount)
				}
				return sum
			}, 0)

			const difference = spent - currentSpent

			// Создаём корректирующую транзакцию
			if (Math.abs(difference) > 0.01) {
				if (difference > 0) {
					// Нужно увеличить расходы
					await prisma.transaction.create({
						data: {
							userId: session.user.id,
							categoryId: categoryId,
							amount: difference,
							type: 'EXPENSE',
							description: '📝 Корректировка расходов',
							date: new Date(),
						},
					})
				} else {
					// Нужно уменьшить расходы
					await prisma.transaction.create({
						data: {
							userId: session.user.id,
							categoryId: categoryId,
							amount: Math.abs(difference),
							type: 'INCOME',
							description: '📝 Корректировка расходов (уменьшение)',
							date: new Date(),
						},
					})
				}
			}
		}

		// Получаем обновлённую категорию
		const updatedCategory = await prisma.category.findUnique({
			where: { id: categoryId },
		})

		return NextResponse.json({
			category: updatedCategory,
			success: true,
		})
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
		}

		console.error('Update category error:', error)
		return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
	}
}
