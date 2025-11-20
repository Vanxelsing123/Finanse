import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const addToGoalSchema = z.object({
	goalId: z.string(),
	amount: z.number(), // ✅ Убрали .positive() чтобы разрешить отрицательные числа
	source: z.enum(['MANUAL', 'AUTO', 'FROM_SAVINGS']).default('MANUAL'),
	note: z.string().optional(),
})

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await req.json()
		const { goalId, amount, source, note } = addToGoalSchema.parse(body)

		// Проверяем что цель принадлежит пользователю
		const goal = await prisma.goal.findFirst({
			where: {
				id: goalId,
				userId: session.user.id,
			},
			include: {
				notifications: true,
			},
		})

		if (!goal) {
			return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
		}

		const oldAmount = Number(goal.currentAmount)
		const newAmount = oldAmount + amount

		// ✅ Проверка: нельзя снять больше, чем есть
		if (newAmount < 0) {
			return NextResponse.json({ error: 'Недостаточно средств для снятия' }, { status: 400 })
		}

		const targetAmount = Number(goal.targetAmount)

		// Вычисляем процент до и после
		const oldPercentage = Math.floor((oldAmount / targetAmount) * 100)
		const newPercentage = Math.floor((newAmount / targetAmount) * 100)

		// Определяем какие уведомления нужно отправить (только при добавлении)
		const milestones = [20, 50, 80, 100]
		const newMilestones =
			amount > 0 ? milestones.filter(m => oldPercentage < m && newPercentage >= m) : []

		// Создаём транзакцию
		await prisma.goalTransaction.create({
			data: {
				goalId,
				amount,
				source,
				note: note || (amount > 0 ? 'Пополнение' : 'Снятие средств'),
			},
		})

		// Обновляем цель
		const isCompleted = newAmount >= targetAmount
		const wasCompleted = goal.status === 'COMPLETED'

		// ✅ Если была завершена, но сняли деньги - снова делаем активной
		const newStatus = isCompleted ? 'COMPLETED' : 'ACTIVE'

		const updatedGoal = await prisma.goal.update({
			where: { id: goalId },
			data: {
				currentAmount: newAmount,
				status: newStatus,
				completedAt:
					isCompleted && !wasCompleted
						? new Date()
						: wasCompleted && !isCompleted
						? null
						: goal.completedAt,
			},
			include: {
				transactions: {
					orderBy: {
						date: 'desc',
					},
					take: 10,
				},
			},
		})

		// Создаём уведомления о достижении вех (только при добавлении)
		if (newMilestones.length > 0) {
			await prisma.goalNotification.createMany({
				data: newMilestones.map(milestone => ({
					goalId,
					milestone,
				})),
				skipDuplicates: true,
			})
		}

		return NextResponse.json({
			goal: updatedGoal,
			notifications: newMilestones,
		})
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
		}

		console.error('Add to goal error:', error)
		return NextResponse.json({ error: 'Internal error' }, { status: 500 })
	}
}
