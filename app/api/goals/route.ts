import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const goalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  imageUrl: z.string().optional(),
  priority: z.number().min(1).max(3).optional(),
  deadline: z.string().optional(),
})

const goalTransactionSchema = z.object({
  goalId: z.string(),
  amount: z.number().positive(),
  source: z.enum(['MANUAL', 'AUTO', 'FROM_SAVINGS']),
  note: z.string().optional(),
})

// GET - получить цели
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ACTIVE'

    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
        status: status as any,
      },
      include: {
        transactions: {
          orderBy: {
            date: 'desc',
          },
        },
      },
      orderBy: {
        priority: 'asc',
      },
    })

    // Подсчитываем проценты для каждой цели
    const goalsWithProgress = goals.map(goal => {
      const percentage = Math.round(
        (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100
      )
      return {
        ...goal,
        percentage,
      }
    })

    return NextResponse.json({ goals: goalsWithProgress })
  } catch (error) {
    console.error('Goals GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

// POST - создать цель
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, targetAmount, imageUrl, priority, deadline } = goalSchema.parse(body)

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        name,
        targetAmount,
        imageUrl: imageUrl || null,
        priority: priority || 1,
        deadline: deadline ? new Date(deadline) : null,
      },
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Goal POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}

// PATCH - обновить цель (добавить деньги)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { goalId, amount, source, note } = goalTransactionSchema.parse(body)

    // Проверяем что цель принадлежит пользователю
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: session.user.id,
      },
    })

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Создаём транзакцию цели
    await prisma.goalTransaction.create({
      data: {
        goalId,
        amount,
        source,
        note: note || null,
      },
    })

    // Обновляем текущую сумму
    const newAmount = Number(goal.currentAmount) + amount
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        currentAmount: newAmount,
        // Если достигли цели, обновляем статус
        ...(newAmount >= Number(goal.targetAmount) && {
          status: 'COMPLETED',
          completedAt: new Date(),
        }),
      },
      include: {
        transactions: true,
      },
    })

    // Проверяем нужно ли отправить уведомление о milestone
    const percentage = Math.round((newAmount / Number(goal.targetAmount)) * 100)
    const milestones = [20, 50, 80, 100]
    
    for (const milestone of milestones) {
      if (percentage >= milestone) {
        // Проверяем не отправляли ли уже это уведомление
        const existingNotification = await prisma.goalNotification.findUnique({
          where: {
            goalId_milestone: {
              goalId,
              milestone,
            },
          },
        })

        if (!existingNotification) {
          await prisma.goalNotification.create({
            data: {
              goalId,
              milestone,
            },
          })
        }
      }
    }

    return NextResponse.json({ goal: updatedGoal })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Goal PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    )
  }
}

// DELETE - удалить цель
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Goal ID required' },
        { status: 400 }
      )
    }

    // Проверяем что цель принадлежит пользователю
    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      )
    }

    await prisma.goal.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Goal DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}
