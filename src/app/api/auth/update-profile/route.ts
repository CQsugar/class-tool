import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user) {
      return NextResponse.json({ message: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email } = body

    // 至少需要提供一个字段
    if (!name && !email) {
      return NextResponse.json({ message: '请提供要更新的字段' }, { status: 400 })
    }

    // 构建更新数据
    const updateData: { name?: string; email?: string } = {}

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ message: '姓名不能为空' }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json({ message: '邮箱不能为空' }, { status: 400 })
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json({ message: '邮箱格式不正确' }, { status: 400 })
      }

      // 检查邮箱是否已被其他用户使用
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.trim(),
          NOT: {
            id: session.user.id,
          },
        },
      })

      if (existingUser) {
        return NextResponse.json({ message: '该邮箱已被其他用户使用' }, { status: 400 })
      }

      updateData.email = email.trim()
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
      },
    })

    return NextResponse.json({
      message: '更新成功',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json({ message: '更新失败，请稍后重试' }, { status: 500 })
  }
}
