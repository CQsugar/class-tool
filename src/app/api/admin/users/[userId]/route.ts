import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * DELETE /api/admin/users/[userId] - 删除用户
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    // 不能删除管理员
    if (targetUser.role === 'admin') {
      return NextResponse.json({ message: '无法删除管理员账号' }, { status: 403 })
    }

    // 不能删除自己
    if (targetUser.id === session.user.id) {
      return NextResponse.json({ message: '无法删除自己的账号' }, { status: 403 })
    }

    // 删除用户
    await auth.api.removeUser({
      body: {
        userId: targetUser.id,
      },
      headers: await headers(),
    })

    return NextResponse.json({ message: '用户已删除' })
  } catch (error) {
    console.error('删除用户失败:', error)
    return NextResponse.json({ message: '删除用户失败' }, { status: 500 })
  }
}
