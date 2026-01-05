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

// ✅ Функции для работы с периодами бюджета
export function getBudgetPeriodLabel(
	month: number,
	year: number,
	startDay: number,
	endDay: number
): string {
	const currentMonthName = getMonthName(month)

	// Если период переходит на следующий месяц (startDay > endDay)
	if (startDay > endDay) {
		const nextMonth = month === 12 ? 1 : month + 1
		const nextYear = month === 12 ? year + 1 : year
		const nextMonthName = getMonthName(nextMonth)

		return `${currentMonthName}-${nextMonthName} ${year}`
	}

	// Обычный период в рамках одного месяца
	return `${currentMonthName} ${year}`
}

export function getBudgetPeriodDescription(
	startDay: number,
	endDay: number,
	month?: number
): string {
	if (startDay > endDay) {
		if (month) {
			const currentMonthName = getMonthName(month)
			const nextMonth = month === 12 ? 1 : month + 1
			const nextMonthName = getMonthName(nextMonth)
			return `с ${startDay} ${currentMonthName} по ${endDay} ${nextMonthName}`
		}
		return `с ${startDay} числа по ${endDay} число следующего месяца`
	}
	return `с ${startDay} по ${endDay} число`
}

export function getShortMonthName(month: number): string {
	const months = [
		'янв',
		'фев',
		'мар',
		'апр',
		'мая',
		'июн',
		'июл',
		'авг',
		'сен',
		'окт',
		'ноя',
		'дек',
	]
	return months[month - 1] || ''
}

// ✅ Проверка, находится ли текущая дата в бюджетном периоде
export function isDateInBudgetPeriod(
	currentDate: Date,
	budgetMonth: number,
	budgetYear: number,
	startDay: number,
	endDay: number
): boolean {
	const day = currentDate.getDate()
	const month = currentDate.getMonth() + 1 // 1-12
	const year = currentDate.getFullYear()

	// Период в пределах одного месяца (например, 1-31)
	if (startDay <= endDay) {
		return month === budgetMonth && year === budgetYear && day >= startDay && day <= endDay
	}

	// Период переходит на следующий месяц (например, 15 дек - 14 янв)
	const nextMonth = budgetMonth === 12 ? 1 : budgetMonth + 1
	const nextYear = budgetMonth === 12 ? budgetYear + 1 : budgetYear

	// Проверяем начало периода (15 декабря - 31 декабря)
	if (month === budgetMonth && year === budgetYear && day >= startDay) {
		return true
	}

	// Проверяем конец периода (1 января - 14 января)
	if (month === nextMonth && year === nextYear && day <= endDay) {
		return true
	}

	return false
}

// ✅ Найти активный бюджет (тот, в период которого попадает сегодня)
export function findActiveBudget(
	budgets: Array<{
		month: number
		year: number
		startDay: number
		endDay: number
	}>
): { month: number; year: number } | null {
	const today = new Date()

	for (const budget of budgets) {
		if (isDateInBudgetPeriod(today, budget.month, budget.year, budget.startDay, budget.endDay)) {
			return { month: budget.month, year: budget.year }
		}
	}

	return null
}

// ✅ Получить количество дней до конца периода
export function getDaysUntilPeriodEnd(
	budgetMonth: number,
	budgetYear: number,
	startDay: number,
	endDay: number
): number {
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	let endDate: Date

	if (startDay <= endDay) {
		// Период в одном месяце
		endDate = new Date(budgetYear, budgetMonth - 1, endDay)
	} else {
		// Период переходит на следующий месяц
		const nextMonth = budgetMonth === 12 ? 0 : budgetMonth
		const nextYear = budgetMonth === 12 ? budgetYear + 1 : budgetYear
		endDate = new Date(nextYear, nextMonth, endDay)
	}

	endDate.setHours(23, 59, 59, 999)

	const diffTime = endDate.getTime() - today.getTime()
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

	return diffDays
}

// ✅ Получить дату начала следующего периода
export function getNextPeriodStart(
	budgetMonth: number,
	budgetYear: number,
	startDay: number,
	endDay: number
): { month: number; year: number } {
	if (startDay <= endDay) {
		// Период в одном месяце - следующий период начинается в следующем месяце
		const nextMonth = budgetMonth === 12 ? 1 : budgetMonth + 1
		const nextYear = budgetMonth === 12 ? budgetYear + 1 : budgetYear
		return { month: nextMonth, year: nextYear }
	} else {
		// Период переходит на следующий месяц
		// Следующий период начинается через месяц от текущего
		const nextMonth = budgetMonth === 12 ? 1 : budgetMonth + 1
		const nextYear = budgetMonth === 12 ? budgetYear + 1 : budgetYear
		return { month: nextMonth, year: nextYear }
	}
}
