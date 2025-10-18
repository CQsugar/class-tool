import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PointType } from '@prisma/client'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/points/records/stats
 * 获取积分记录统计信息
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

    // 解析可选的学生ID和日期范围
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: {
      userId: string
      studentId?: string
      createdAt?: {
        gte?: Date
        lte?: Date
      }
      student?: {
        isArchived: boolean
      }
    } = {
      userId,
      // 只统计未归档学生的记录
      student: {
        isArchived: false,
      },
    }

    if (studentId) {
      where.studentId = studentId
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

    // 统计各类型记录数量
    const [totalRecords, addRecords, subtractRecords, resetRecords] = await Promise.all([
      prisma.pointRecord.count({ where }),
      prisma.pointRecord.count({ where: { ...where, type: PointType.ADD } }),
      prisma.pointRecord.count({
        where: { ...where, type: PointType.SUBTRACT },
      }),
      prisma.pointRecord.count({ where: { ...where, type: PointType.RESET } }),
    ])

    // 计算总积分变化
    const records = await prisma.pointRecord.findMany({
      where,
      select: {
        points: true,
        type: true,
      },
    })

    let totalPointsAdded = 0
    let totalPointsSubtracted = 0

    records.forEach(record => {
      if (record.type === PointType.ADD) {
        totalPointsAdded += Math.abs(record.points)
      } else if (record.type === PointType.SUBTRACT) {
        totalPointsSubtracted += Math.abs(record.points)
      }
    })

    // 获取最近的记录
    const recentRecords = await prisma.pointRecord.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentNo: true,
          },
        },
        rule: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    })

    return NextResponse.json({
      stats: {
        totalRecords,
        addRecords,
        subtractRecords,
        resetRecords,
        totalPointsAdded,
        totalPointsSubtracted,
        netPointsChange: totalPointsAdded - totalPointsSubtracted,
      },
      recentRecords,
    })
  } catch (error) {
    console.error('Failed to fetch point record stats:', error)
    return NextResponse.json({ error: '查询失败，请稍后重试' }, { status: 500 })
  }
}
