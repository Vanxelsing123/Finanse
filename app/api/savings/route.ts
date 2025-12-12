import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSavingsSchema = z.object({
	currency: z.string(),
	amount: z.number().optional(),
})

const updateSavingsSchema = z.object({
	savingsId: z.string(),
	amount: z.number(),
	type: z.enum(['ADD', 'SUBTRACT']),
	description: z.string().optional(),
})

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const savings = await prisma.savings.findMany({
			where: { userId: session.user.id },
			include: {
				transactions: {
					orderBy: { createdAt: 'desc' },
					take: 10,
				},
			},
			orderBy: { createdAt: 'asc' },
		})

		return NextResponse.json({ savings })
	} catch (error) {
		console.error('Get savings error:', error)
		return NextResponse.json({ error: 'Failed to fetch savings' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { currency, amount } = createSavingsSchema.parse(body)

		const savings = await prisma.savings.upsert({
			where: {
				userId_currency: {
					userId: session.user.id,
					currency,
				},
			},
			update: {},
			create: {
				userId: session.user.id,
				currency,
				amount: amount || 0,
			},
		})

		return NextResponse.json({ savings })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
		}

		console.error('Create savings error:', error)
		return NextResponse.json({ error: 'Failed to create savings' }, { status: 500 })
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { savingsId, amount, type, description } = updateSavingsSchema.parse(body)

		const savings = await prisma.savings.findFirst({
			where: {
				id: savingsId,
				userId: session.user.id,
			},
		})

		if (!savings) {
			return NextResponse.json({ error: 'Savings not found' }, { status: 404 })
		}

		// Преобразуем Decimal в число
		const currentAmount =
			typeof savings.amount === 'string'
				? parseFloat(savings.amount)
				: typeof savings.amount === 'number'
				? savings.amount
				: Number(savings.amount)

		const transactionAmount = type === 'ADD' ? amount : -amount
		const newAmount = currentAmount + transactionAmount

		if (newAmount < 0) {
			return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
		}

		const [updatedSavings] = await prisma.$transaction([
			prisma.savings.update({
				where: { id: savingsId },
				data: { amount: newAmount },
			}),
			prisma.savingsTransaction.create({
				data: {
					savingsId,
					amount: transactionAmount,
					type,
					description: description || (type === 'ADD' ? 'Пополнение' : 'Снятие'),
				},
			}),
		])

		return NextResponse.json({ savings: updatedSavings })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
		}

		console.error('Update savings error:', error)
		return NextResponse.json({ error: 'Failed to update savings' }, { status: 500 })
	}
}
