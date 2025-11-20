'use client'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

// Компонент с useSearchParams обёрнут в Suspense
function LoginForm() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const registered = searchParams.get('registered')

	const [formData, setFormData] = useState({
		email: '',
		password: '',
	})
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			const result = await signIn('credentials', {
				email: formData.email,
				password: formData.password,
				redirect: false,
			})

			if (result?.error) {
				throw new Error(result.error)
			}

			router.push('/dashboard')
			router.refresh()
		} catch (err: any) {
			setError(err.message || 'Ошибка входа')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4'>
			<Card className='w-full max-w-md'>
				<CardHeader className='space-y-1'>
					<CardTitle className='text-2xl font-bold text-center'>Вход в систему</CardTitle>
					<CardDescription className='text-center'>Введите данные для входа</CardDescription>
				</CardHeader>
				<CardContent>
					{registered && (
						<div className='mb-4 text-green-600 text-sm text-center bg-green-50 dark:bg-green-900/20 p-2 rounded'>
							Регистрация успешна! Теперь войдите в систему
						</div>
					)}
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='email'>Email</Label>
							<Input
								id='email'
								type='email'
								placeholder='example@mail.com'
								value={formData.email}
								onChange={e => setFormData({ ...formData, email: e.target.value })}
								required
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='password'>Пароль</Label>
							<Input
								id='password'
								type='password'
								placeholder='Ваш пароль'
								value={formData.password}
								onChange={e => setFormData({ ...formData, password: e.target.value })}
								required
							/>
						</div>
						{error && (
							<div className='text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded'>
								{error}
							</div>
						)}
						<Button type='submit' className='w-full' disabled={loading}>
							{loading ? 'Вход...' : 'Войти'}
						</Button>
					</form>
				</CardContent>
				<CardFooter className='flex justify-center'>
					<p className='text-sm text-muted-foreground'>
						Нет аккаунта?{' '}
						<Link href='/auth/register' className='text-primary hover:underline font-medium'>
							Зарегистрироваться
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	)
}

// Главный компонент с Suspense
export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800'>
					<div className='text-lg'>Загрузка...</div>
				</div>
			}
		>
			<LoginForm />
		</Suspense>
	)
}
