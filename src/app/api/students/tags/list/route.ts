import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/students/tags/list - 获取所有标签列表（无分页）
 * 用于下拉选择器等场景
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户认证
    const { user } = await requireAuth(request)

    // 获取所有标签
    const tags = await prisma.studentTag.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: {
            relations: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ data: tags })
  } catch (error) {
    console.error('获取标签列表失败:', error)

    // 处理认证错误
    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: '获取标签列表失败' }, { status: 500 })
  }
}
