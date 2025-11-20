export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/dashboard/:path*', '/budget/:path*', '/goals/:path*', '/analytics/:path*', '/transactions/:path*']
}
