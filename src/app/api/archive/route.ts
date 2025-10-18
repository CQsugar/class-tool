import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createArchiveSchema, listArchivesSchema } from '@/lib/validations/archive'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/archive
 * 获取归档列表
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams)
    const validation = listArchivesSchema.safeParse(params)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 })
    }

    const { page, limit, type, search, startDate, endDate } = validation.data

    // 构建查询条件
    const where: {
      userId: string
      type?: typeof type
      OR?: Array<{ reason?: { contains: string }; description?: { contains: string } }>
      createdAt?: { gte?: Date; lte?: Date }
    } = {
      userId: session.user.id,
    }

    if (type) {
      where.type = type
    }

    if (search) {
      where.OR = [{ reason: { contains: search } }, { description: { contains: search } }]
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    // 获取总数
    const total = await prisma.archive.count({ where })

    // 获取归档列表
    const archives = await prisma.archive.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            students: true,
            pointRecords: true,
            redemptions: true,
            pointRules: true,
            storeItems: true,
            studentGroups: true,
            pkSessions: true,
          },
        },
      },
    })

    return NextResponse.json({
      archives,
      total,
      page,
      pageCount: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('获取归档列表失败:', error)
    return NextResponse.json({ error: '获取归档列表失败' }, { status: 500 })
  }
}

/**
 * POST /api/archive
 * 创建归档记录
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createArchiveSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 })
    }

    const { type, reason, description, itemIds } = validation.data

    // 使用事务处理归档操作
    const result = await prisma.$transaction(async tx => {
      // 1. 创建归档记录
      const archive = await tx.archive.create({
        data: {
          type,
          reason,
          description,
          itemCount: itemIds.length,
          userId: session.user.id,
        },
      })

      // 2. 根据类型更新相应的数据
      const now = new Date()

      switch (type) {
        case 'STUDENT':
          await tx.student.updateMany({
            where: {
              id: { in: itemIds },
              userId: session.user.id,
            },
            data: {
              isArchived: true,
              archiveId: archive.id,
              archivedAt: now,
            },
          })
          break

        case 'POINT_RECORD':
          await tx.pointRecord.updateMany({
            where: {
              id: { in: itemIds },
              userId: session.user.id,
            },
            data: {
              archiveId: archive.id,
              archivedAt: now,
            },
          })
          break

        case 'REDEMPTION':
          await tx.redemption.updateMany({
            where: {
              id: { in: itemIds },
              userId: session.user.id,
            },
            data: {
              archiveId: archive.id,
              archivedAt: now,
            },
          })
          break

        case 'POINT_RULE':
          await tx.pointRule.updateMany({
            where: {
              id: { in: itemIds },
              userId: session.user.id,
            },
            data: {
              archiveId: archive.id,
              archivedAt: now,
            },
          })
          break

        case 'STORE_ITEM':
          await tx.storeItem.updateMany({
            where: {
              id: { in: itemIds },
              userId: session.user.id,
            },
            data: {
              archiveId: archive.id,
              archivedAt: now,
            },
          })
          break

        case 'STUDENT_GROUP':
          await tx.studentGroup.updateMany({
            where: {
              id: { in: itemIds },
              userId: session.user.id,
            },
            data: {
              isArchived: true,
              archiveId: archive.id,
              archivedAt: now,
            },
          })
          break

        case 'PK_SESSION':
          await tx.pKSession.updateMany({
            where: {
              id: { in: itemIds },
              userId: session.user.id,
            },
            data: {
              archiveId: archive.id,
              archivedAt: now,
            },
          })
          break

        default:
          throw new Error(`不支持的归档类型: ${type}`)
      }

      return archive
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('创建归档记录失败:', error)
    return NextResponse.json({ error: '创建归档记录失败' }, { status: 500 })
  }
}
