import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/users/[userId]/reset-password - 重置用户密码
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
    const body = await request.json()
    const { newPassword } = body

    // 验证输入
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ message: '密码至少6位' }, { status: 400 })
    }

    // 检查目标用户
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json({ message: '用户不存在' }, { status: 404 })
    }

    // 更新密码
    await auth.api.setUserPassword({
      body: {
        newPassword: newPassword,
        userId: userId,
      },
      headers: await headers(),
    })

    return NextResponse.json({ message: '密码已重置' })
  } catch (error) {
    console.error('重置密码失败:', error)
    return NextResponse.json({ message: '重置密码失败' }, { status: 500 })
  }
}
