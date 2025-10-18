import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createStudentGroupSchema, studentGroupQuerySchema } from '@/lib/validations/student-group'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/students/groups
 * 获取分组列表
 */
export async function GET(request: NextRequest) {
  try {
    // 身份验证
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const userId = session.user.id

    // 解析查询参数
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      isArchived: searchParams.get('isArchived'),
    }

    const validationResult = studentGroupQuerySchema.safeParse(queryParams)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '参数验证失败', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, search, isArchived } = validationResult.data

    // 构建查询条件
    const where: {
      userId: string
      isArchived?: boolean
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        description?: { contains: string; mode: 'insensitive' }
      }>
    } = {
      userId,
    }

    if (isArchived !== undefined) {
      where.isArchived = isArchived
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 查询总数
    const total = await prisma.studentGroup.count({ where })

    // 查询分组
    const groups = await prisma.studentGroup.findMany({
      where,
      include: {
        members: {
          where: {
            student: {
              isArchived: false, // 只包含未归档的学生
            },
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                studentNo: true,
                avatar: true,
                points: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    const pageCount = Math.ceil(total / limit)

    return NextResponse.json({
      groups,
      pagination: {
        page,
        pageSize: limit,
        total,
        pageCount,
      },
    })
  } catch (error) {
    console.error('Failed to fetch student groups:', error)
    return NextResponse.json({ error: '查询失败，请稍后重试' }, { status: 500 })
  }
}

/**
 * POST /api/students/groups
 * 创建新分组
 */
export async function POST(request: NextRequest) {
  try {
    // 身份验证
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const userId = session.user.id

    // 解析和验证请求体
    const body = await request.json()
    const validationResult = createStudentGroupSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '数据验证失败', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { name, description, color, memberIds } = validationResult.data

    // 检查分组名称是否已存在
    const existing = await prisma.studentGroup.findFirst({
      where: {
        userId,
        name,
        isArchived: false,
      },
    })

    if (existing) {
      return NextResponse.json({ error: '分组名称已存在' }, { status: 400 })
    }

    // 如果提供了成员ID，验证学生是否存在
    if (memberIds && memberIds.length > 0) {
      const students = await prisma.student.findMany({
        where: {
          id: { in: memberIds },
          userId,
        },
        select: { id: true },
      })

      if (students.length !== memberIds.length) {
        return NextResponse.json({ error: '部分学生不存在或无权访问' }, { status: 400 })
      }
    }

    // 创建分组和成员关系
    const group = await prisma.studentGroup.create({
      data: {
        name,
        description,
        color,
        userId,
        members: {
          create: memberIds?.map(studentId => ({ studentId })) || [],
        },
      },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                studentNo: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Failed to create student group:', error)
    return NextResponse.json({ error: '创建失败，请稍后重试' }, { status: 500 })
  }
}
