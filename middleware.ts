import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公开路由，不需要认证
  const publicRoutes = ['/api/auth', '/']
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // 放行所有 /auth/** 页面
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  // 对于仪表板路由，需要认证
  if (pathname.startsWith('/dashboard')) {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session) {
        // 没有会话，重定向到登录页面
        return NextResponse.redirect(new URL('/auth/sign-in', request.url))
      }

      // 有会话，继续处理请求
      return NextResponse.next()
    } catch (error) {
      console.error('Middleware error:', error)
      // 发生错误，重定向到登录页面
      return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }
  }

  // 对于其他路由，直接通过
  return NextResponse.next()
}

export const config = {
  /*
   * 匹配除以下路径外的所有请求路径:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
