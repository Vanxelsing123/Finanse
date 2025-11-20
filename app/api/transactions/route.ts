import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const transactionSchema = z.object({
	categoryId: z.string().optional(),
	amount: z.number().positive(),
	description: z.string().optional(),
	date: z.string().optional(),
	type: z.enum(['EXPENSE', 'INCOME']),
})

// GET - получить транзакции
export async function GET(request: Request) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const month = searchParams.get('month')
		const year = searchParams.get('year')
		const type = searchParams.get('type')

		let where: any = {
			userId: session.user.id,
		}

		if (type) {
			where.type = type
		}

		if (month && year) {
			const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
			const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
			where.date = {
				gte: startDate,
				lte: endDate,
			}
		}

		const transactions = await prisma.transaction.findMany({
			where,
			include: {
				category: true,
			},
			orderBy: {
				date: 'desc',
			},
		})

		return NextResponse.json({ transactions })
	} catch (error) {
		console.error('Transactions GET error:', error)
		return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
	}
}

// POST - создать транзакцию
export async function POST(request: Request) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { categoryId, amount, description, date, type } = transactionSchema.parse(body)

		const transaction = await prisma.transaction.create({
			data: {
				userId: session.user.id,
				categoryId: categoryId || null,
				amount,
				description: description || null,
				date: date ? new Date(date) : new Date(),
				type,
			},
			include: {
				category: true,
			},
		})

		return NextResponse.json({ transaction }, { status: 201 })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
		}

		console.error('Transaction POST error:', error)
		return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
	}
}

// DELETE - удалить транзакцию
export async function DELETE(request: Request) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const id = searchParams.get('id')

		if (!id) {
			return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
		}

		// Проверяем что транзакция принадлежит пользователю
		const transaction = await prisma.transaction.findFirst({
			where: {
				id,
				userId: session.user.id,
			},
		})

		if (!transaction) {
			return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
		}

		await prisma.transaction.delete({
			where: { id },
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Transaction DELETE error:', error)
		return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
	}
}
