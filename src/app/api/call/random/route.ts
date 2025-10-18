import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/call/random - 随机点名
 *
 * 功能：
 * - 从未归档的学生中随机选择一个学生
 * - 支持24小时避重机制（可配置）
 * - 支持手动排除特定学生
 * - 记录点名历史
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    const body = await request.json()

    // 避重时间窗口（小时），默认24小时
    const avoidHours = body.avoidHours ?? 24

    // 手动排除的学生ID列表
    const excludeIds: string[] = body.excludeIds ?? []

    // 计算避重时间点
    const avoidTime = new Date()
    avoidTime.setHours(avoidTime.getHours() - avoidHours)

    // 获取避重时间内被点过名的学生ID
    const recentCalledStudentIds = await prisma.callHistory.findMany({
      where: {
        userId: user.id,
        calledAt: {
          gte: avoidTime,
        },
        studentId: {
          not: null,
        },
      },
      select: {
        studentId: true,
      },
    })

    const recentCalledIds = recentCalledStudentIds
      .map(record => record.studentId)
      .filter((id): id is string => id !== null)

    // 合并需要排除的学生ID
    const allExcludeIds = [...new Set([...recentCalledIds, ...excludeIds])]

    // 获取可被点名的学生列表
    const availableStudents = await prisma.student.findMany({
      where: {
        userId: user.id,
        isArchived: false,
        id: {
          notIn: allExcludeIds,
        },
      },
      select: {
        id: true,
        name: true,
        studentNo: true,
        avatar: true,
        points: true,
      },
    })

    // 检查是否有可用学生
    if (availableStudents.length === 0) {
      // 如果启用了避重且没有可用学生，尝试不启用避重重新查询
      if (avoidHours > 0) {
        const allStudents = await prisma.student.findMany({
          where: {
            userId: user.id,
            isArchived: false,
            id: {
              notIn: excludeIds,
            },
          },
          select: {
            id: true,
            name: true,
            studentNo: true,
            avatar: true,
            points: true,
          },
        })

        if (allStudents.length === 0) {
          return NextResponse.json({ error: '没有可用的学生' }, { status: 404 })
        }

        // 随机选择一个学生
        const randomIndex = Math.floor(Math.random() * allStudents.length)
        const selectedStudent = allStudents[randomIndex]

        // 记录点名历史
        await prisma.callHistory.create({
          data: {
            mode: 'RANDOM',
            studentId: selectedStudent.id,
            userId: user.id,
          },
        })

        return NextResponse.json({
          student: selectedStudent,
          avoidResetUsed: true,
          message: `所有学生在${avoidHours}小时内都被点过名，已重置避重机制`,
        })
      }

      return NextResponse.json({ error: '没有可用的学生' }, { status: 404 })
    }

    // 随机选择一个学生
    const randomIndex = Math.floor(Math.random() * availableStudents.length)
    const selectedStudent = availableStudents[randomIndex]

    // 记录点名历史
    await prisma.callHistory.create({
      data: {
        mode: 'RANDOM',
        studentId: selectedStudent.id,
        userId: user.id,
      },
    })

    return NextResponse.json({
      student: selectedStudent,
      avoidResetUsed: false,
      totalAvailable: availableStudents.length,
      totalExcluded: allExcludeIds.length,
    })
  } catch (error) {
    console.error('Random call error:', error)

    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    return NextResponse.json({ error: '随机点名失败' }, { status: 500 })
  }
}
