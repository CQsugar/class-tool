import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { createStudentSchema, studentQuerySchema } from '@/lib/validations/student'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * GET /api/students - 获取学生列表（支持分页、搜索、筛选）
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户认证
    const { user } = await requireAuth(request)

    // 解析查询参数
    const searchParams = request.nextUrl.searchParams
    const queryData = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      gender: searchParams.get('gender'),
      isArchived: searchParams.get('isArchived'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    }

    // 验证查询参数
    const { page, limit, search, gender, isArchived, sortBy, sortOrder } =
      studentQuerySchema.parse(queryData)

    // 构建查询条件
    const where: Prisma.StudentWhereInput = {
      userId: user.id,
      isArchived,
    }

    // 添加搜索条件
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { studentNo: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { parentPhone: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 添加性别筛选
    if (gender) {
      where.gender = gender
    }

    // 计算分页
    const skip = (page - 1) * limit

    // 并行查询总数和数据
    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        include: {
          pointRecords: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          groupMembers: {
            include: {
              group: true,
            },
          },
          tagRelations: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
    ])

    // 返回分页数据
    return NextResponse.json({
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('获取学生列表失败:', error)

    // 处理认证错误
    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 处理验证错误
    if (error instanceof ZodError) {
      return NextResponse.json({ error: '查询参数错误', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: '获取学生列表失败' }, { status: 500 })
  }
}

/**
 * POST /api/students - 创建新学生
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const { user } = await requireAuth(request)

    // 解析请求体
    const body = await request.json()

    // 验证输入数据
    const validatedData = createStudentSchema.parse(body)

    // 检查学号是否已存在
    const existingStudent = await prisma.student.findFirst({
      where: {
        userId: user.id,
        studentNo: validatedData.studentNo,
        isArchived: false,
      },
    })

    if (existingStudent) {
      return NextResponse.json({ error: '学号已存在' }, { status: 409 })
    }

    // 创建学生
    const student = await prisma.student.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
      include: {
        groupMembers: {
          include: {
            group: true,
          },
        },
        tagRelations: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('创建学生失败:', error)

    // 处理认证错误
    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 处理验证错误
    if (error instanceof ZodError) {
      return NextResponse.json({ error: '输入数据错误', details: error.issues }, { status: 400 })
    }

    // 处理数据库唯一约束错误
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: '学号已存在' }, { status: 409 })
    }

    return NextResponse.json({ error: '创建学生失败' }, { status: 500 })
  }
}
