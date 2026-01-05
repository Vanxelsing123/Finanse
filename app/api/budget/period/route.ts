import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { month, year, startDay, endDay } = body

		const budget = await prisma.budget.update({
			where: {
				userId_month_year: {
					userId: session.user.id,
					month,
					year,
				},
			},
			data: {
				startDay,
				endDay,
			},
		})

		return NextResponse.json({ budget })
	} catch (error) {
		console.error('Update period error:', error)
		return NextResponse.json({ error: 'Failed to update period' }, { status: 500 })
	}
}
