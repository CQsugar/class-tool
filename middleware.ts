import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

// 安全监控：记录可疑活动
function logSecurityEvent(request: NextRequest, event: string, details?: Record<string, unknown>) {
  const timestamp = new Date().toISOString()
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  console.log(`[SECURITY] ${timestamp} - ${event}`, {
    ip,
    userAgent,
    pathname: request.nextUrl.pathname,
    ...details,
  })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 安全头设置
  const response = NextResponse.next()

  // 添加安全响应头
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // 在生产环境中添加HSTS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  // 公开路由，不需要认证
  const publicRoutes = ['/api/auth', '/']
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response
  }

  // 放行所有 /auth/** 页面
  if (pathname.startsWith('/auth/')) {
    return response
  }

  // 对于仪表板路由，需要认证
  if (pathname.startsWith('/dashboard')) {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session) {
        // 记录未授权访问尝试
        logSecurityEvent(request, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
          targetPath: pathname,
        })

        // 没有会话，重定向到登录页面
        return NextResponse.redirect(new URL('/auth/sign-in', request.url))
      }

      // 记录成功的认证访问（仅在调试模式）
      if (process.env.NODE_ENV === 'development') {
        logSecurityEvent(request, 'AUTHENTICATED_ACCESS', {
          userId: session.user.id,
          targetPath: pathname,
        })
      }

      // 有会话，继续处理请求
      return response
    } catch (error) {
      console.error('Middleware error:', error)
      logSecurityEvent(request, 'MIDDLEWARE_ERROR', { error: error })

      // 发生错误，重定向到登录页面
      return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }
  }

  // 对于其他路由，直接通过
  return response
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
