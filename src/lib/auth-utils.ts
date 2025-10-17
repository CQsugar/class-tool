import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * 从请求中获取当前会话
 * 支持 API Route Handler 和 Server Component
 */
export async function getSession(request?: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request ? request.headers : await headers(),
    })
    return session
  } catch (error) {
    console.error('获取会话失败:', error)
    return null
  }
}

/**
 * 获取当前认证用户
 * 如果未认证则抛出错误
 */
export async function requireAuth(request?: NextRequest) {
  const session = await getSession(request)

  if (!session?.user) {
    throw new Error('未授权：需要登录')
  }

  return {
    user: session.user,
    session,
  }
}

/**
 * 检查用户是否已认证
 */
export async function isAuthenticated(request?: NextRequest): Promise<boolean> {
  const session = await getSession(request)
  return !!session?.user
}
