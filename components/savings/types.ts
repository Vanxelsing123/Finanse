export interface SavingsTransaction {
	id: string
	amount: number
	type: string
	description: string | null
	createdAt: string
}

export interface Savings {
	id: string
	currency: string
	amount: number | string // ← Может быть string (Decimal)
	transactions: SavingsTransaction[]
}

export interface Currency {
	code: string
	symbol: string
	name: string
	flag: string
}

export const CURRENCIES: Currency[] = [
	{ code: 'BYN', symbol: 'Br', name: 'Белорусский рубль', flag: '🇧🇾' },
	{ code: 'USD', symbol: '$', name: 'Доллар США', flag: '🇺🇸' },
	{ code: 'EUR', symbol: '€', name: 'Евро', flag: '🇪🇺' },
	{ code: 'RUB', symbol: '₽', name: 'Российский рубль', flag: '🇷🇺' },
	{ code: 'PLN', symbol: 'zł', name: 'Польский злотый', flag: '🇵🇱' },
]

export const getCurrencyInfo = (code: string): Currency => {
	return CURRENCIES.find(c => c.code === code) || CURRENCIES[0]
}

// Исправленная функция форматирования
export const formatAmount = (amount: number | string, currency: string): string => {
	const info = getCurrencyInfo(currency)
	const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
	return `${numAmount.toFixed(2)} ${info.symbol}`
}
