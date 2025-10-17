import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateStoreItemSchema } from '@/lib/validations/store'

/**
 * GET /api/store/items/[id] - 获取单个商品
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const item = await prisma.storeItem.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Failed to fetch store item:', error)
    return NextResponse.json({ error: '获取商品失败' }, { status: 500 })
  }
}

/**
 * PATCH /api/store/items/[id] - 更新商品
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 验证商品所有权
    const existingItem = await prisma.storeItem.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateStoreItemSchema.parse(body)

    const item = await prisma.storeItem.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Failed to update store item:', error)
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json({ error: '验证失败', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: '更新商品失败' }, { status: 500 })
  }
}

/**
 * DELETE /api/store/items/[id] - 删除商品
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 验证商品所有权
    const existingItem = await prisma.storeItem.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    // 检查是否有兑换记录
    if (existingItem._count.redemptions > 0) {
      return NextResponse.json(
        { error: '该商品有兑换记录，无法删除。建议将其设为禁用。' },
        { status: 400 }
      )
    }

    await prisma.storeItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: '商品已删除' })
  } catch (error) {
    console.error('Failed to delete store item:', error)
    return NextResponse.json({ error: '删除商品失败' }, { status: 500 })
  }
}
