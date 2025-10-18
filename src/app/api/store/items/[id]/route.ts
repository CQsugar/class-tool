import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { storageManager } from '@/lib/upload'
import { updateStoreItemSchema } from '@/lib/validations/store'

/**
 * GET /api/store/items/[id] - 获取单个商品
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const item = await prisma.storeItem.findUnique({
      where: {
        id: id,
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
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 验证商品所有权
    const existingItem = await prisma.storeItem.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateStoreItemSchema.parse(body)

    // 如果更新图片，删除旧图片文件
    if (
      validatedData.image !== undefined &&
      existingItem.image &&
      validatedData.image !== existingItem.image &&
      existingItem.image.startsWith('/uploads/')
    ) {
      try {
        const oldImagePath = existingItem.image.replace('/uploads', '')
        await storageManager.deleteFile(oldImagePath)
      } catch (error) {
        console.error('删除旧商品图片失败:', error)
        // 不阻止更新操作，继续执行
      }
    }

    const item = await prisma.storeItem.update({
      where: { id: id },
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 验证商品所有权
    const existingItem = await prisma.storeItem.findUnique({
      where: {
        id: id,
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

    // 删除商品图片文件
    if (existingItem.image && existingItem.image.startsWith('/uploads/')) {
      try {
        const imagePath = existingItem.image.replace('/uploads', '')
        await storageManager.deleteFile(imagePath)
      } catch (error) {
        console.error('删除商品图片失败:', error)
        // 不阻止删除操作，继续执行
      }
    }

    await prisma.storeItem.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: '商品已删除' })
  } catch (error) {
    console.error('Failed to delete store item:', error)
    return NextResponse.json({ error: '删除商品失败' }, { status: 500 })
  }
}
