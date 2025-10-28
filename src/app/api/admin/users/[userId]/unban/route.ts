import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/users/[userId]/unban - 解除封禁
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

    // 检查目标用户
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json({ message: '用户不存在' }, { status: 404 })
    }

    // 解除封禁
    await prisma.user.update({
      where: { id: userId },
      data: {
        banned: false,
        banReason: null,
        banExpires: null,
      },
    })

    return NextResponse.json({ message: '已解除封禁' })
  } catch (error) {
    console.error('解除封禁失败:', error)
    return NextResponse.json({ message: '解除封禁失败' }, { status: 500 })
  }
}
