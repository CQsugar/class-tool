import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateRedemptionStatusSchema } from '@/lib/validations/store'

/**
 * GET /api/store/redemptions/[id] - 获取单个兑换记录
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const redemption = await prisma.redemption.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentNo: true,
            points: true,
          },
        },
        item: {
          select: {
            id: true,
            name: true,
            type: true,
            cost: true,
            image: true,
            description: true,
          },
        },
      },
    })

    if (!redemption) {
      return NextResponse.json({ error: '兑换记录不存在' }, { status: 404 })
    }

    return NextResponse.json({ redemption })
  } catch (error) {
    console.error('Failed to fetch redemption:', error)
    return NextResponse.json({ error: '获取兑换记录失败' }, { status: 500 })
  }
}

/**
 * PATCH /api/store/redemptions/[id] - 更新兑换状态
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateRedemptionStatusSchema.parse(body)
    const { status, notes } = validatedData

    // 使用事务处理状态更新
    const result = await prisma.$transaction(async tx => {
      // 1. 获取当前兑换记录
      const redemption = await tx.redemption.findUnique({
        where: {
          id: params.id,
          userId: session.user.id,
        },
        include: {
          student: true,
          item: true,
        },
      })

      if (!redemption) {
        throw new Error('兑换记录不存在')
      }

      // 2. 如果取消兑换，需要退还积分和库存
      if (status === 'CANCELLED' && redemption.status !== 'CANCELLED') {
        // 退还积分
        await tx.student.update({
          where: { id: redemption.studentId },
          data: {
            points: {
              increment: redemption.cost,
            },
          },
        })

        // 退还库存（如果商品有库存管理）
        if (redemption.item.stock !== null) {
          await tx.storeItem.update({
            where: { id: redemption.itemId },
            data: {
              stock: {
                increment: 1,
              },
            },
          })
        }
      }

      // 3. 更新兑换记录状态
      const updateData: {
        status: typeof status
        notes?: string
        fulfilledAt?: Date
      } = { status }

      if (notes !== undefined) {
        updateData.notes = notes
      }

      if (status === 'FULFILLED') {
        updateData.fulfilledAt = new Date()
      }

      const updatedRedemption = await tx.redemption.update({
        where: { id: params.id },
        data: updateData,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              studentNo: true,
              points: true,
            },
          },
          item: {
            select: {
              id: true,
              name: true,
              type: true,
              cost: true,
              image: true,
            },
          },
        },
      })

      return updatedRedemption
    })

    return NextResponse.json({ redemption: result })
  } catch (error) {
    console.error('Failed to update redemption:', error)
    if (error instanceof Error) {
      if ('issues' in error) {
        return NextResponse.json({ error: '验证失败', details: error }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: '更新兑换状态失败' }, { status: 500 })
  }
}
