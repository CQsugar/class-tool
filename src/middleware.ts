import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from './lib/auth'

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

// 清除所有认证相关的 cookie
function clearAuthCookies(response: NextResponse): void {
  const cookiesToClear = [
    'better-auth.session_data',
    'better-auth.session_token',
    'better-auth.csrf_token',
    'better-auth.dontRememberToken',
  ]

  cookiesToClear.forEach(cookieName => {
    response.cookies.delete(cookieName)
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

  try {
    // 检查是否存在会话 cookie
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (session && pathname.startsWith('/auth/sign-in')) {
      // 已有会话的用户尝试访问登录页面，重定向到控制台
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 放行所有 /auth/** 页面
    if (pathname.startsWith('/auth/')) {
      return response
    }

    if (!session) {
      // 记录未授权访问尝试
      logSecurityEvent(request, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
        targetPath: pathname,
      })

      // 没有会话，清除可能过期的 cookie 并重定向到登录页面
      const redirectResponse = NextResponse.redirect(new URL('/auth/sign-in', request.url))
      clearAuthCookies(redirectResponse)

      return redirectResponse
    }

    // 记录成功的认证访问（仅在调试模式）
    if (process.env.NODE_ENV === 'development') {
      logSecurityEvent(request, 'AUTHENTICATED_ACCESS', {
        targetPath: pathname,
      })
    }

    // 有会话，继续处理请求
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    logSecurityEvent(request, 'MIDDLEWARE_ERROR', { error: error })

    // 发生错误，清除认证 cookie 并重定向到登录页面
    const redirectResponse = NextResponse.redirect(new URL('/auth/sign-in', request.url))
    clearAuthCookies(redirectResponse)

    return redirectResponse
  }
}

export const config = {
  /*
   * 匹配除以下路径外的所有请求路径:
   * - /api/auth (认证API)
   * - /api/health (健康检查API，用于Docker容器健康检查)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  runtime: 'nodejs',
  matcher: ['/((?!api/auth|api/health|_next/static|_next/image|favicon.ico).*)'],
}
