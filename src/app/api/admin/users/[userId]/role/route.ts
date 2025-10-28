import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * PATCH /api/admin/users/[userId]/role - 修改用户角色
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
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
    const { role } = body

    // 验证角色
    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json({ message: '无效的角色' }, { status: 400 })
    }

    // 检查目标用户
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json({ message: '用户不存在' }, { status: 404 })
    }

    // 不能修改自己的角色
    if (targetUser.id === session.user.id) {
      return NextResponse.json({ message: '无法修改自己的角色' }, { status: 403 })
    }

    // 更新角色
    await auth.api.setRole({
      body: {
        userId: targetUser.id,
        role: role,
      },
      // This endpoint requires session cookies.
      headers: await headers(),
    })

    return NextResponse.json({ message: '角色已更新' })
  } catch (error) {
    console.error('修改角色失败:', error)
    return NextResponse.json({ message: '修改角色失败' }, { status: 500 })
  }
}
