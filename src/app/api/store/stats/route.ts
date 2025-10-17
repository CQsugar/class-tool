import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/store/stats - 获取商城统计数据
export async function GET(request: NextRequest) {
  const headersList = await headers()
  const session = await auth.api.getSession({
    headers: headersList,
  })

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '30' // 统计周期(天数)
  const days = parseInt(period)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  try {
    // 1. 基础统计数据
    const [
      totalItems,
      activeItems,
      totalRedemptions,
      pendingRedemptions,
      fulfilledRedemptions,
      cancelledRedemptions,
      totalPointsSpent,
      periodRedemptions,
      periodPointsSpent,
    ] = await Promise.all([
      // 商品总数
      prisma.storeItem.count({
        where: { userId: session.user.id },
      }),
      // 在售商品数
      prisma.storeItem.count({
        where: { userId: session.user.id, isActive: true },
      }),
      // 总兑换次数
      prisma.redemption.count({
        where: { userId: session.user.id },
      }),
      // 待处理兑换
      prisma.redemption.count({
        where: { userId: session.user.id, status: 'PENDING' },
      }),
      // 已发放兑换
      prisma.redemption.count({
        where: { userId: session.user.id, status: 'FULFILLED' },
      }),
      // 已取消兑换
      prisma.redemption.count({
        where: { userId: session.user.id, status: 'CANCELLED' },
      }),
      // 总积分消费
      prisma.redemption.aggregate({
        where: {
          userId: session.user.id,
          status: { in: ['PENDING', 'FULFILLED'] },
        },
        _sum: { cost: true },
      }),
      // 周期内兑换次数
      prisma.redemption.count({
        where: {
          userId: session.user.id,
          redeemedAt: { gte: startDate },
        },
      }),
      // 周期内积分消费
      prisma.redemption.aggregate({
        where: {
          userId: session.user.id,
          status: { in: ['PENDING', 'FULFILLED'] },
          redeemedAt: { gte: startDate },
        },
        _sum: { cost: true },
      }),
    ])

    // 2. 热门商品排行 (按兑换次数)
    const popularItems = await prisma.storeItem.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        type: true,
        cost: true,
        image: true,
        _count: {
          select: {
            redemptions: {
              where: {
                status: { in: ['PENDING', 'FULFILLED'] },
              },
            },
          },
        },
      },
      orderBy: {
        redemptions: {
          _count: 'desc',
        },
      },
      take: 10,
    })

    // 3. 分类分布统计
    const categoryStats = await prisma.redemption.groupBy({
      by: ['itemId'],
      where: {
        userId: session.user.id,
        status: { in: ['PENDING', 'FULFILLED'] },
      },
      _count: true,
      _sum: { cost: true },
    })

    const itemIds = categoryStats.map(stat => stat.itemId)
    const items = await prisma.storeItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, type: true },
    })

    const itemTypeMap = new Map(items.map(item => [item.id, item.type]))
    const categoryDistribution = categoryStats.reduce(
      (acc, stat) => {
        const type = itemTypeMap.get(stat.itemId) || 'VIRTUAL'
        if (!acc[type]) {
          acc[type] = { count: 0, totalCost: 0 }
        }
        acc[type].count += stat._count
        acc[type].totalCost += stat._sum.cost || 0
        return acc
      },
      {} as Record<string, { count: number; totalCost: number }>
    )

    // 4. 每日兑换趋势 (最近N天)
    const dailyTrend = await prisma.$queryRaw<
      Array<{ date: string; count: number; totalCost: number }>
    >`
      SELECT 
        DATE(redeemed_at) as date,
        COUNT(*)::int as count,
        SUM(cost)::int as "totalCost"
      FROM redemptions
      WHERE user_id = ${session.user.id}
        AND redeemed_at >= ${startDate}
        AND status IN ('PENDING', 'FULFILLED')
      GROUP BY DATE(redeemed_at)
      ORDER BY DATE(redeemed_at) ASC
    `

    // 5. 学生兑换排行
    const topRedeemers = await prisma.student.findMany({
      where: {
        userId: session.user.id,
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        studentNo: true,
        avatar: true,
        points: true,
        _count: {
          select: {
            redemptions: {
              where: {
                status: { in: ['PENDING', 'FULFILLED'] },
                redeemedAt: { gte: startDate },
              },
            },
          },
        },
      },
      orderBy: {
        redemptions: {
          _count: 'desc',
        },
      },
      take: 10,
    })

    // 计算每个学生的兑换总消费
    const studentRedemptionCosts = await Promise.all(
      topRedeemers.map(async student => {
        const result = await prisma.redemption.aggregate({
          where: {
            studentId: student.id,
            status: { in: ['PENDING', 'FULFILLED'] },
            redeemedAt: { gte: startDate },
          },
          _sum: { cost: true },
        })
        return {
          ...student,
          redemptionCount: student._count.redemptions,
          totalSpent: result._sum.cost || 0,
        }
      })
    )

    // 6. 库存预警 (库存低于5或为0的商品)
    const lowStockItems = await prisma.storeItem.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        stock: { not: null, lte: 5 },
      },
      select: {
        id: true,
        name: true,
        type: true,
        stock: true,
        cost: true,
      },
      orderBy: { stock: 'asc' },
      take: 10,
    })

    return NextResponse.json({
      overview: {
        totalItems,
        activeItems,
        totalRedemptions,
        pendingRedemptions,
        fulfilledRedemptions,
        cancelledRedemptions,
        totalPointsSpent: totalPointsSpent._sum.cost || 0,
        periodRedemptions,
        periodPointsSpent: periodPointsSpent._sum.cost || 0,
        period: days,
      },
      popularItems: popularItems.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        cost: item.cost,
        image: item.image,
        redemptionCount: item._count.redemptions,
      })),
      categoryDistribution,
      dailyTrend: dailyTrend.map(day => ({
        date: day.date,
        count: day.count,
        totalCost: day.totalCost,
      })),
      topRedeemers: studentRedemptionCosts.map(student => ({
        id: student.id,
        name: student.name,
        studentNo: student.studentNo,
        avatar: student.avatar,
        currentPoints: student.points,
        redemptionCount: student.redemptionCount,
        totalSpent: student.totalSpent,
      })),
      lowStockItems,
    })
  } catch (error) {
    console.error('Failed to fetch store stats:', error)
    return NextResponse.json({ error: 'Failed to fetch store stats' }, { status: 500 })
  }
}
