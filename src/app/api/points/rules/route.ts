import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { createPointRuleSchema, pointRuleQuerySchema } from '@/lib/validations/point-rule'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * GET /api/points/rules - 获取积分规则列表（支持分页、搜索、筛选）
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
      type: searchParams.get('type'),
      category: searchParams.get('category'),
      isActive: searchParams.get('isActive'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    }

    // 验证查询参数
    const { page, limit, search, type, category, isActive, sortBy, sortOrder } =
      pointRuleQuerySchema.parse(queryData)

    // 构建查询条件
    const where: Prisma.PointRuleWhereInput = {
      userId: user.id,
    }

    // 添加激活状态筛选
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // 添加搜索条件
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 添加类型筛选
    if (type) {
      where.type = type
    }

    // 添加分类筛选
    if (category) {
      where.category = category
    }

    // 计算分页
    const skip = (page - 1) * limit

    // 并行查询总数和数据
    const [total, rules] = await Promise.all([
      prisma.pointRule.count({ where }),
      prisma.pointRule.findMany({
        where,
        include: {
          _count: {
            select: {
              pointRecords: true,
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
      data: rules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('获取积分规则列表失败:', error)

    // 处理认证错误
    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 处理验证错误
    if (error instanceof ZodError) {
      return NextResponse.json({ error: '查询参数错误', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: '获取积分规则列表失败' }, { status: 500 })
  }
}

/**
 * POST /api/points/rules - 创建新积分规则
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const { user } = await requireAuth(request)

    // 解析请求体
    const body = await request.json()

    // 验证输入数据
    const validatedData = createPointRuleSchema.parse(body)

    // 创建积分规则
    const rule = await prisma.pointRule.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            pointRecords: true,
          },
        },
      },
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    console.error('创建积分规则失败:', error)

    // 处理认证错误
    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 处理验证错误
    if (error instanceof ZodError) {
      return NextResponse.json({ error: '输入数据错误', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: '创建积分规则失败' }, { status: 500 })
  }
}
