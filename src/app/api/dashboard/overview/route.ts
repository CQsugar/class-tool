import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/dashboard/overview - 获取控制台概览数据
export async function GET() {
  const headersList = await headers()
  const session = await auth.api.getSession({
    headers: headersList,
  })

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay())
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(thisWeekStart.getDate() - 7)

    // 并行查询所有数据
    const [
      totalStudents,
      archivedStudents,
      lastWeekStudents,
      totalPoints,
      thisWeekPointsChange,
      todayPointRecords,
      thisWeekPointRecords,
      totalRedemptions,
      thisWeekRedemptions,
      todayCallCount,
      recentPointRecords,
      recentRedemptions,
    ] = await Promise.all([
      // 学生统计
      prisma.student.count({
        where: { userId: session.user.id, isArchived: false },
      }),
      prisma.student.count({
        where: { userId: session.user.id, isArchived: true },
      }),
      prisma.student.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: lastWeekStart, lt: thisWeekStart },
        },
      }),

      // 积分统计
      prisma.student.aggregate({
        where: { userId: session.user.id, isArchived: false },
        _sum: { points: true },
      }),
      prisma.pointRecord.aggregate({
        where: {
          userId: session.user.id,
          createdAt: { gte: thisWeekStart },
        },
        _sum: { points: true },
      }),

      // 积分记录统计
      prisma.pointRecord.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: today },
        },
      }),
      prisma.pointRecord.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: thisWeekStart },
        },
      }),

      // 兑换统计
      prisma.redemption.count({
        where: { userId: session.user.id },
      }),
      prisma.redemption.count({
        where: {
          userId: session.user.id,
          redeemedAt: { gte: thisWeekStart },
        },
      }),

      // 点名统计
      prisma.callHistory.count({
        where: {
          userId: session.user.id,
          calledAt: { gte: today },
        },
      }),

      // 最近记录
      prisma.pointRecord.findMany({
        where: { userId: session.user.id },
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
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // 最近兑换
      prisma.redemption.findMany({
        where: { userId: session.user.id },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              studentNo: true,
              avatar: true,
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
        orderBy: { redeemedAt: 'desc' },
        take: 5,
      }),
    ])

    return NextResponse.json({
      students: {
        total: totalStudents,
        archived: archivedStudents,
        active: totalStudents - archivedStudents,
        weekChange: totalStudents - lastWeekStudents,
      },
      points: {
        total: totalPoints._sum.points || 0,
        weekChange: thisWeekPointsChange._sum.points || 0,
        todayRecords: todayPointRecords,
        weekRecords: thisWeekPointRecords,
      },
      redemptions: {
        total: totalRedemptions,
        thisWeek: thisWeekRedemptions,
      },
      calls: {
        today: todayCallCount,
      },
      recentActivities: {
        pointRecords: recentPointRecords.map(record => ({
          id: record.id,
          points: record.points,
          reason: record.reason,
          createdAt: record.createdAt,
          student: record.student,
        })),
        redemptions: recentRedemptions.map(redemption => ({
          id: redemption.id,
          cost: redemption.cost,
          status: redemption.status,
          redeemedAt: redemption.redeemedAt,
          student: redemption.student,
          item: redemption.item,
        })),
      },
    })
  } catch (error) {
    console.error('Failed to fetch dashboard overview:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard overview' }, { status: 500 })
  }
}
