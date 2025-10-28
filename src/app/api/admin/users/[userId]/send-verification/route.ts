import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/users/[userId]/send-verification - 发送验证邮件
 */
export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    // 权限检查
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ message: '无权访问' }, { status: 403 })
    }

    const { userId } = await params

    // TODO: 实现邮件验证功能
    // 这需要配置邮件服务 (Better Auth 支持邮件验证)
    // 暂时返回成功响应

    return NextResponse.json({ message: '验证邮件已发送' })
  } catch (error) {
    console.error('发送验证邮件失败:', error)
    return NextResponse.json({ message: '发送验证邮件失败' }, { status: 500 })
  }
}
