import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pointRecordQuerySchema } from '@/lib/validations/point-record'
import { Prisma } from '@prisma/client'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/points/records
 * 查询积分记录列表（支持分页、筛选）
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
      studentId: searchParams.get('studentId'),
      type: searchParams.get('type'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      search: searchParams.get('search'),
    }

    const validationResult = pointRecordQuerySchema.safeParse(queryParams)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '参数验证失败', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, studentId, type, startDate, endDate, search } = validationResult.data

    // 构建查询条件
    const where: Prisma.PointRecordWhereInput = {
      userId,
      // 只查询未归档学生的记录
      student: {
        isArchived: false,
      },
    }

    if (studentId) {
      where.studentId = studentId
    }

    if (type) {
      where.type = type as 'ADD' | 'SUBTRACT' | 'RESET'
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // 查询总数
    const total = await prisma.pointRecord.count({ where })

    // 查询记录
    const records = await prisma.pointRecord.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentNo: true,
            avatar: true,
          },
        },
        rule: {
          select: {
            id: true,
            name: true,
            category: true,
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
      records,
      pagination: {
        page,
        pageSize: limit,
        total,
        pageCount,
      },
    })
  } catch (error) {
    console.error('Failed to fetch point records:', error)
    return NextResponse.json({ error: '查询失败，请稍后重试' }, { status: 500 })
  }
}
