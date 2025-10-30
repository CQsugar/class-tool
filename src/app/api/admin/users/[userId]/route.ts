import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * PATCH /api/admin/users/[userId] - 更新用户信息
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    // 权限检查
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权访问' }, { status: 403 })
    }

    const { userId } = await params
    const body = await request.json()
    const { name, email } = body

    // 验证输入
    if (!name || !name.trim()) {
      return NextResponse.json({ error: '姓名不能为空' }, { status: 400 })
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: '邮箱不能为空' }, { status: 400 })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }

    // 检查目标用户
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 如果邮箱发生变化，检查邮箱是否已被使用
    if (email.toLowerCase() !== targetUser.email.toLowerCase()) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (existingUser) {
        return NextResponse.json({ error: '该邮箱已被使用' }, { status: 400 })
      }
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        // 如果邮箱发生变化，将邮箱验证状态设置为false
        emailVerified:
          email.toLowerCase() !== targetUser.email.toLowerCase() ? false : targetUser.emailVerified,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    })

    return NextResponse.json({
      message: '用户信息已更新',
      user: updatedUser,
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return NextResponse.json({ error: '更新用户信息失败' }, { status: 500 })
  }
}

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
