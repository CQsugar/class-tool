import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createStudentTagSchema, studentTagQuerySchema } from '@/lib/validations/student-tag'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/students/tags - 获取标签列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    const validatedQuery = studentTagQuerySchema.parse(queryParams)
    const { page, pageSize, search } = validatedQuery

    const skip = (page - 1) * pageSize

    // 构建查询条件
    const where: {
      userId: string
      name?: {
        contains: string
        mode: 'insensitive'
      }
    } = {
      userId: session.user.id,
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // 查询标签列表（包含关联的学生数量）
    const [tags, total] = await Promise.all([
      prisma.studentTag.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: {
            select: {
              relations: true,
            },
          },
        },
      }),
      prisma.studentTag.count({ where }),
    ])

    return NextResponse.json({
      data: tags,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Failed to fetch tags:', error)
    return NextResponse.json({ error: '获取标签列表失败' }, { status: 500 })
  }
}

// POST /api/students/tags - 创建标签
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createStudentTagSchema.parse(body)

    // 检查标签名称是否已存在
    const existingTag = await prisma.studentTag.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name: validatedData.name,
        },
      },
    })

    if (existingTag) {
      return NextResponse.json({ error: '标签名称已存在' }, { status: 400 })
    }

    // 创建标签
    const tag = await prisma.studentTag.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            relations: true,
          },
        },
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Failed to create tag:', error)
    return NextResponse.json({ error: '创建标签失败' }, { status: 500 })
  }
}
