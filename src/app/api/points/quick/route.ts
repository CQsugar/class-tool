import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { quickPointsSchema } from '@/lib/validations/point-record'
import { PointType } from '@prisma/client'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/points/quick
 * 快速给多个学生加减分
 */
export async function POST(request: NextRequest) {
  try {
    // 身份验证
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const userId = session.user.id

    // 解析和验证请求体
    const body = await request.json()
    const validationResult = quickPointsSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '数据验证失败', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { studentIds, ruleId, points, reason, type } = validationResult.data

    // 验证学生是否属于当前用户
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        userId,
      },
      select: {
        id: true,
        name: true,
        points: true,
      },
    })

    if (students.length !== studentIds.length) {
      return NextResponse.json({ error: '部分学生不存在或无权访问' }, { status: 400 })
    }

    // 如果提供了规则ID，验证规则是否存在且属于当前用户
    if (ruleId) {
      const rule = await prisma.pointRule.findFirst({
        where: {
          id: ruleId,
          userId,
        },
      })

      if (!rule) {
        return NextResponse.json({ error: '积分规则不存在或无权访问' }, { status: 400 })
      }
    }

    // 计算实际积分变化（根据类型）
    let actualPoints = points
    if (type === PointType.SUBTRACT) {
      actualPoints = -Math.abs(points)
    } else if (type === PointType.ADD) {
      actualPoints = Math.abs(points)
    }

    // 使用事务批量创建积分记录和更新学生积分
    const result = await prisma.$transaction(async tx => {
      // 为每个学生创建积分记录
      const records = await Promise.all(
        students.map(student =>
          tx.pointRecord.create({
            data: {
              points: type === PointType.RESET ? points : actualPoints,
              reason,
              type,
              studentId: student.id,
              userId,
              ruleId: ruleId || null,
            },
          })
        )
      )

      // 更新学生积分
      await Promise.all(
        students.map(student => {
          const newPoints = type === PointType.RESET ? points : student.points + actualPoints

          return tx.student.update({
            where: { id: student.id },
            data: { points: newPoints },
          })
        })
      )

      return records
    })

    return NextResponse.json(
      {
        success: true,
        count: result.length,
        records: result,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to apply quick points:', error)
    return NextResponse.json({ error: '操作失败，请稍后重试' }, { status: 500 })
  }
}
