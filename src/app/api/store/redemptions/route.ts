import { Prisma, RedemptionStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createRedemptionSchema } from '@/lib/validations/store'

/**
 * GET /api/store/redemptions - 获取兑换记录列表
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
    const studentId = searchParams.get('studentId')
    const itemId = searchParams.get('itemId')
    const status = searchParams.get('status')

    // 构建查询条件
    const where: Prisma.RedemptionWhereInput = {
      userId: session.user.id,
      student: {
        isArchived: false, // 只显示未归档学生的兑换记录
      },
    }

    if (studentId) {
      where.studentId = studentId
    }

    if (itemId) {
      where.itemId = itemId
    }

    if (status && (status === 'PENDING' || status === 'COMPLETED' || status === 'CANCELLED')) {
      where.status = status as RedemptionStatus
    }

    // 查询总数
    const total = await prisma.redemption.count({ where })

    // 查询数据
    const redemptions = await prisma.redemption.findMany({
      where,
      orderBy: { redeemedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentNo: true,
          },
        },
        item: {
          select: {
            id: true,
            name: true,
            type: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({
      redemptions,
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Failed to fetch redemptions:', error)
    return NextResponse.json({ error: '获取兑换记录失败' }, { status: 500 })
  }
}

/**
 * POST /api/store/redemptions - 创建兑换记录（学生兑换商品）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createRedemptionSchema.parse(body)
    const { studentId, itemId, notes } = validatedData

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async tx => {
      // 1. 验证商品存在且属于当前用户
      const item = await tx.storeItem.findUnique({
        where: {
          id: itemId,
          userId: session.user.id,
        },
      })

      if (!item) {
        throw new Error('商品不存在')
      }

      if (!item.isActive) {
        throw new Error('商品已下架')
      }

      // 2. 验证学生存在且属于当前用户
      const student = await tx.student.findUnique({
        where: {
          id: studentId,
          userId: session.user.id,
        },
      })

      if (!student) {
        throw new Error('学生不存在')
      }

      if (student.isArchived) {
        throw new Error('学生已归档，无法兑换')
      }

      // 3. 检查学生积分是否足够
      if (student.points < item.cost) {
        throw new Error(`积分不足。需要 ${item.cost} 分，当前只有 ${student.points} 分`)
      }

      // 4. 检查库存（如果启用库存管理）
      if (item.stock !== null) {
        if (item.stock < 1) {
          throw new Error(`库存不足。当前库存 ${item.stock}`)
        }

        // 扣减库存
        await tx.storeItem.update({
          where: { id: itemId },
          data: {
            stock: {
              decrement: 1,
            },
          },
        })
      }

      // 5. 扣除学生积分
      await tx.student.update({
        where: { id: studentId },
        data: {
          points: {
            decrement: item.cost,
          },
        },
      })

      // 6. 创建兑换记录
      const redemption = await tx.redemption.create({
        data: {
          studentId,
          itemId,
          userId: session.user.id,
          cost: item.cost,
          status: 'PENDING',
          notes,
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
            },
          },
        },
      })

      return redemption
    })

    return NextResponse.json({ redemption: result }, { status: 201 })
  } catch (error) {
    console.error('Failed to create redemption:', error)
    if (error instanceof Error) {
      if ('issues' in error) {
        return NextResponse.json({ error: '验证失败', details: error }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: '兑换失败' }, { status: 500 })
  }
}
