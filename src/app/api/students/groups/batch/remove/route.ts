import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/students/groups/batch/remove - 批量移除学生的分组
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    const body = await request.json()
    const { studentIds, groupIds } = body

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: '学生ID列表不能为空' }, { status: 400 })
    }

    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      return NextResponse.json({ error: '分组ID列表不能为空' }, { status: 400 })
    }

    // 验证所有学生都属于当前用户
    const studentsCount = await prisma.student.count({
      where: {
        id: { in: studentIds },
        userId: user.id,
      },
    })

    if (studentsCount !== studentIds.length) {
      return NextResponse.json({ error: '部分学生不存在或无权访问' }, { status: 403 })
    }

    // 验证所有分组都属于当前用户
    const groupsCount = await prisma.studentGroup.count({
      where: {
        id: { in: groupIds },
        userId: user.id,
      },
    })

    if (groupsCount !== groupIds.length) {
      return NextResponse.json({ error: '部分分组不存在或无权访问' }, { status: 403 })
    }

    // 批量删除关联
    const result = await prisma.groupMember.deleteMany({
      where: {
        studentId: { in: studentIds },
        groupId: { in: groupIds },
      },
    })

    return NextResponse.json({
      success: true,
      removedCount: result.count,
      message: `成功移除 ${result.count} 个分组关联`,
    })
  } catch (error) {
    console.error('Batch remove group members error:', error)
    return NextResponse.json({ error: '批量移除分组失败' }, { status: 500 })
  }
}
