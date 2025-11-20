import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string): string {
	const num = typeof amount === 'string' ? parseFloat(amount) : amount
	return new Intl.NumberFormat('ru-BY', {
		style: 'currency',
		currency: 'BYN',
		minimumFractionDigits: 2,
	}).format(num)
}

export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date
	return new Intl.DateTimeFormat('ru-BY', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	}).format(d)
}

export function getMonthName(month: number): string {
	const months = [
		'Январь',
		'Февраль',
		'Март',
		'Апрель',
		'Май',
		'Июнь',
		'Июль',
		'Август',
		'Сентябрь',
		'Октябрь',
		'Ноябрь',
		'Декабрь',
	]
	return months[month - 1] || ''
}

export function calculatePercentage(current: number, total: number): number {
	if (total === 0) return 0
	return Math.round((current / total) * 100)
}

export function getProgressColor(percentage: number): string {
	if (percentage < 70) return 'text-green-600'
	if (percentage < 90) return 'text-yellow-600'
	return 'text-red-600'
}

export function getCurrentMonthYear() {
	const now = new Date()
	return {
		month: now.getMonth() + 1,
		year: now.getFullYear(),
	}
}

export function calculateProgress(current: number, target: number): number {
	if (target === 0) return 0
	return Math.min(Math.round((current / target) * 100), 100)
}

export function getCurrentMonth(): { month: number; year: number } {
	const now = new Date()
	return {
		month: now.getMonth() + 1, // 1-12
		year: now.getFullYear(),
	}
}
