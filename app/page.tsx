import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Target, TrendingUp, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Wallet className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Finance Tracker</span>
          </div>
          <div className="space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Вход</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Регистрация</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Контролируйте свои финансы
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Простой и удобный учёт личных финансов. Планируйте бюджет, следите за расходами 
          и достигайте финансовых целей вместе с семьёй.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/register">
            <Button size="lg" className="text-lg">
              Начать бесплатно
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="outline" className="text-lg">
              Войти
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Возможности</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Wallet className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Учёт расходов</CardTitle>
              <CardDescription>
                Быстро записывайте траты и контролируйте бюджет по категориям
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Цели накопления</CardTitle>
              <CardDescription>
                Создавайте хотелки и следите за прогрессом с уведомлениями
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Аналитика</CardTitle>
              <CardDescription>
                Графики и подсказки помогут оптимизировать ваши расходы
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Для семьи</CardTitle>
              <CardDescription>
                Каждый член семьи может вести свой учёт в отдельном аккаунте
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardHeader className="space-y-4 py-10">
            <CardTitle className="text-3xl text-white">
              Готовы начать?
            </CardTitle>
            <CardDescription className="text-blue-100 text-lg">
              Создайте аккаунт прямо сейчас и начните контролировать свои финансы
            </CardDescription>
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="mt-4">
                Зарегистрироваться бесплатно
              </Button>
            </Link>
          </CardHeader>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t">
        <p>© 2024 Finance Tracker. Сделано с ❤️ для контроля личных финансов</p>
      </footer>
    </div>
  )
}
