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

		const categoryId = params.id

		// Проверяем что категория принадлежит пользователю
		const category = await prisma.category.findFirst({
			where: {
				id: categoryId,
				budget: {
					userId: session.user.id,
				},
			},
		})

		if (!category) {
			return NextResponse.json({ error: 'Category not found' }, { status: 404 })
		}

		// Удаляем категорию
		await prisma.category.delete({
			where: { id: categoryId },
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Delete category error:', error)
		return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
	}
}
