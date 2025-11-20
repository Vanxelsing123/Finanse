const { Client } = require('pg')
require('dotenv').config()

async function testConnection() {
	console.log('🔍 Проверка подключения к базе данных...\n')

	// Проверка переменных окружения
	console.log('📋 Переменные окружения:')
	console.log('DATABASE_URL существует:', !!process.env.DATABASE_URL)
	console.log('DATABASE_URL_UNPOOLED существует:', !!process.env.DATABASE_URL_UNPOOLED)

	if (process.env.DATABASE_URL) {
		// Скрываем пароль для безопасности
		const urlWithHiddenPassword = process.env.DATABASE_URL.replace(/:([^@]+)@/, ':****@')
		console.log('DATABASE_URL:', urlWithHiddenPassword)
	}

	if (process.env.DATABASE_URL_UNPOOLED) {
		const urlWithHiddenPassword = process.env.DATABASE_URL_UNPOOLED.replace(/:([^@]+)@/, ':****@')
		console.log('DATABASE_URL_UNPOOLED:', urlWithHiddenPassword)
	}

	console.log('\n---\n')

	// Тест 1: Pooled connection
	console.log('🧪 Тест 1: Pooled connection (DATABASE_URL)')
	await testUrl(process.env.DATABASE_URL, 'Pooled')

	console.log('\n---\n')

	// Тест 2: Direct connection
	console.log('🧪 Тест 2: Direct connection (DATABASE_URL_UNPOOLED)')
	await testUrl(process.env.DATABASE_URL_UNPOOLED, 'Direct')

	console.log('\n---\n')

	// Тест 3: Prisma Client
	console.log('🧪 Тест 3: Prisma Client')
	await testPrisma()
}

async function testUrl(connectionString, name) {
	if (!connectionString) {
		console.log(`❌ ${name}: URL не найден в .env файле`)
		return
	}

	const client = new Client({
		connectionString: connectionString,
	})

	try {
		console.log(`⏳ Подключение к ${name}...`)
		await client.connect()
		console.log(`✅ ${name}: Подключение успешно!`)

		const result = await client.query('SELECT NOW()')
		console.log(`✅ ${name}: Запрос выполнен успешно. Время сервера:`, result.rows[0].now)

		await client.end()
	} catch (error) {
		console.log(`❌ ${name}: Ошибка подключения`)
		console.log('Код ошибки:', error.code)
		console.log('Сообщение:', error.message)

		if (error.code === '28P01') {
			console.log('\n💡 Это ошибка аутентификации. Проверьте:')
			console.log('   1. Правильность пароля в строке подключения')
			console.log('   2. Не истёк ли срок действия пароля')
			console.log('   3. Сбросьте пароль в Neon Console')
		}
	}
}

async function testPrisma() {
	try {
		const { PrismaClient } = require('@prisma/client')
		const prisma = new PrismaClient()

		console.log('⏳ Подключение через Prisma...')
		await prisma.$connect()
		console.log('✅ Prisma: Подключение успешно!')

		const result = await prisma.$queryRaw`SELECT NOW()`
		console.log('✅ Prisma: Запрос выполнен успешно')

		await prisma.$disconnect()
	} catch (error) {
		console.log('❌ Prisma: Ошибка подключения')
		console.log('Сообщение:', error.message)
	}
}

testConnection()
	.then(() => {
		console.log('\n✅ Диагностика завершена')
		process.exit(0)
	})
	.catch(error => {
		console.error('\n❌ Критическая ошибка:', error)
		process.exit(1)
	})
