import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/users - 获取用户列表（支持分页）
 */
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    // 权限检查
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ message: '无权访问' }, { status: 403 })
    }

    // 解析分页参数
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10)
    const search = url.searchParams.get('search') || ''

    // 计算分页偏移量
    const offset = (page - 1) * pageSize

    // 构建查询条件
    const whereCondition = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    // 获取用户列表和总数
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
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
        skip: offset,
        take: pageSize,
      }),
      prisma.user.count({
        where: whereCondition,
      }),
    ])

    // 计算分页信息
    const totalPages = Math.ceil(totalCount / pageSize)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      users,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    })
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
    const result = await auth.api.createUser({
      body: {
        email,
        password,
        name,
        role,
        data: {
          // todo 支持发送邮件
          emailVerified: true,
        },
      },
    })

    if (!result.user) {
      throw new Error('创建用户失败')
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
