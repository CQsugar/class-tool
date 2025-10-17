import { ItemType } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createStoreItemSchema } from '@/lib/validations/store'

/**
 * GET /api/store/items - 获取商品列表
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')

    // 构建查询条件
    const where: {
      userId: string
      isActive?: boolean
      type?: ItemType
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        description?: { contains: string; mode: 'insensitive' }
      }>
    } = {
      userId: session.user.id,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (type && (type === 'VIRTUAL' || type === 'PHYSICAL' || type === 'PRIVILEGE')) {
      where.type = type as ItemType
    }

    if (isActive === 'true' || isActive === 'false') {
      where.isActive = isActive === 'true'
    }

    // 查询总数
    const total = await prisma.storeItem.count({ where })

    // 查询数据
    const items = await prisma.storeItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    })

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Failed to fetch store items:', error)
    return NextResponse.json({ error: '获取商品列表失败' }, { status: 500 })
  }
}

/**
 * POST /api/store/items - 创建商品
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createStoreItemSchema.parse(body)

    const item = await prisma.storeItem.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Failed to create store item:', error)
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json({ error: '验证失败', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: '创建商品失败' }, { status: 500 })
  }
}
