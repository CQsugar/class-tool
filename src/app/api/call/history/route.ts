import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/call/history - 获取点名历史
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    const { searchParams } = new URL(request.url)

    const limit = parseInt(searchParams.get('limit') ?? '50')
    const page = parseInt(searchParams.get('page') ?? '1')
    const skip = (page - 1) * limit

    // 获取点名历史
    const [histories, total] = await Promise.all([
      prisma.callHistory.findMany({
        where: {
          userId: user.id,
        },
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
        orderBy: {
          calledAt: 'desc',
        },
        take: limit,
        skip,
      }),
      prisma.callHistory.count({
        where: {
          userId: user.id,
        },
      }),
    ])

    return NextResponse.json({
      histories,
      pagination: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get call history error:', error)

    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    return NextResponse.json({ error: '获取点名历史失败' }, { status: 500 })
  }
}
