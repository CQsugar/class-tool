import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/users/[userId]/ban - 封禁用户
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
    const { reason, banExpires } = body

    // 验证输入
    if (!reason) {
      return NextResponse.json({ message: '缺少封禁原因' }, { status: 400 })
    }

    // 检查目标用户
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json({ message: '用户不存在' }, { status: 404 })
    }

    // 不能封禁管理员
    if (targetUser.role === 'admin') {
      return NextResponse.json({ message: '无法封禁管理员' }, { status: 403 })
    }

    // 不能封禁自己
    if (targetUser.id === session.user.id) {
      return NextResponse.json({ message: '无法封禁自己' }, { status: 403 })
    }

    // 封禁用户
    await prisma.user.update({
      where: { id: userId },
      data: {
        banned: true,
        banReason: reason,
        banExpires: banExpires ? new Date(banExpires) : null,
      },
    })

    return NextResponse.json({ message: '用户已封禁' })
  } catch (error) {
    console.error('封禁用户失败:', error)
    return NextResponse.json({ message: '封禁用户失败' }, { status: 500 })
  }
}
