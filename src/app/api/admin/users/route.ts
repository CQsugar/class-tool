import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/users - 获取所有用户列表
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    // 权限检查
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ message: '无权访问' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
        banReason: true,
        banExpires: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return NextResponse.json({ message: '获取用户列表失败' }, { status: 500 })
  }
}

/**
 * POST /api/admin/users - 创建新用户
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    // 权限检查
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ message: '无权访问' }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, password, role } = body

    // 验证输入
    if (!email || !name || !password) {
      return NextResponse.json({ message: '缺少必要字段' }, { status: 400 })
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ message: '邮箱已被使用' }, { status: 400 })
    }

    // 使用 Better Auth API 创建用户
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    })

    if (!result.user) {
      throw new Error('创建用户失败')
    }

    // 更新用户角色
    if (role === 'admin') {
      await prisma.user.update({
        where: { id: result.user.id },
        data: { role: 'admin' },
      })
    }

    return NextResponse.json({ message: '用户创建成功', userId: result.user.id })
  } catch (error) {
    console.error('创建用户失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '创建用户失败' },
      { status: 500 }
    )
  }
}
