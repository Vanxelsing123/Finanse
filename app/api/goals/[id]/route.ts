import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const goalId = params.id

		const goal = await prisma.goal.findFirst({
			where: {
				id: goalId,
				userId: session.user.id,
			},
		})

		if (!goal) {
			return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
		}

		await prisma.goal.delete({
			where: { id: goalId },
		})

		return NextResponse.json({
			success: true,
			message: 'Goal deleted successfully',
		})
	} catch (error) {
		console.error('Delete goal error:', error)
		return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
	}
}
