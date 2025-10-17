import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { batchResetPointsSchema, ResetMode } from '@/lib/validations/point-reset'

// POST /api/points/reset - 批量重置积分
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = batchResetPointsSchema.parse(body)
    const { mode, targetValue, groupId, tagId, studentIds } = validatedData

    // 根据不同模式构建查询条件
    const whereCondition: {
      userId: string
      isArchived: boolean
      id?: { in: string[] }
    } = {
      userId: session.user.id,
      isArchived: false, // 只重置未归档的学生
    }

    let affectedStudentIds: string[] = []

    switch (mode) {
      case ResetMode.ALL:
        // 重置所有学生
        break

      case ResetMode.GROUP:
        if (!groupId) {
          return NextResponse.json({ error: '缺少分组ID' }, { status: 400 })
        }

        // 验证分组所有权
        const group = await prisma.studentGroup.findUnique({
          where: { id: groupId },
          include: {
            members: {
              select: { studentId: true },
            },
          },
        })

        if (!group) {
          return NextResponse.json({ error: '分组不存在' }, { status: 404 })
        }

        if (group.userId !== session.user.id) {
          return NextResponse.json({ error: '无权操作此分组' }, { status: 403 })
        }

        affectedStudentIds = group.members.map(m => m.studentId)
        whereCondition.id = { in: affectedStudentIds }
        break

      case ResetMode.TAG:
        if (!tagId) {
          return NextResponse.json({ error: '缺少标签ID' }, { status: 400 })
        }

        // 验证标签所有权
        const tag = await prisma.studentTag.findUnique({
          where: { id: tagId },
          include: {
            relations: {
              select: { studentId: true },
            },
          },
        })

        if (!tag) {
          return NextResponse.json({ error: '标签不存在' }, { status: 404 })
        }

        if (tag.userId !== session.user.id) {
          return NextResponse.json({ error: '无权操作此标签' }, { status: 403 })
        }

        affectedStudentIds = tag.relations.map(r => r.studentId)
        whereCondition.id = { in: affectedStudentIds }
        break

      case ResetMode.SELECTED:
        if (!studentIds || studentIds.length === 0) {
          return NextResponse.json({ error: '缺少学生ID列表' }, { status: 400 })
        }

        // 验证学生所有权
        const students = await prisma.student.findMany({
          where: {
            id: { in: studentIds },
            userId: session.user.id,
          },
          select: { id: true },
        })

        if (students.length !== studentIds.length) {
          return NextResponse.json({ error: '部分学生不存在或无权访问' }, { status: 400 })
        }

        affectedStudentIds = studentIds
        whereCondition.id = { in: affectedStudentIds }
        break

      default:
        return NextResponse.json({ error: '无效的重置模式' }, { status: 400 })
    }

    // 获取将被重置的学生信息（用于记录）
    const studentsToReset = await prisma.student.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        studentNo: true,
        points: true,
      },
    })

    if (studentsToReset.length === 0) {
      return NextResponse.json({ error: '没有符合条件的学生' }, { status: 400 })
    }

    // 使用事务执行重置操作
    const result = await prisma.$transaction(async tx => {
      // 1. 为每个学生创建积分记录
      const pointRecords = studentsToReset.map(student => ({
        studentId: student.id,
        points: targetValue - student.points,
        reason: `积分重置（${mode === ResetMode.ALL ? '全部' : mode === ResetMode.GROUP ? '分组' : mode === ResetMode.TAG ? '标签' : '选中'}）`,
        type: 'RESET' as const,
        userId: session.user.id,
      }))

      await tx.pointRecord.createMany({
        data: pointRecords,
      })

      // 2. 批量更新学生积分
      const updateResult = await tx.student.updateMany({
        where: whereCondition,
        data: {
          points: targetValue,
        },
      })

      return {
        count: updateResult.count,
        students: studentsToReset,
      }
    })

    return NextResponse.json({
      message: '积分重置成功',
      count: result.count,
      targetValue,
      affectedStudents: result.students.map(s => ({
        id: s.id,
        name: s.name,
        studentNo: s.studentNo,
        oldPoints: s.points,
        newPoints: targetValue,
      })),
    })
  } catch (error) {
    console.error('Failed to reset points:', error)
    return NextResponse.json({ error: '积分重置失败' }, { status: 500 })
  }
}
