import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/students/groups/batch/add - 批量添加学生到分组
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

    // 生成所有可能的组合
    const memberships = studentIds.flatMap(studentId =>
      groupIds.map(groupId => ({
        studentId,
        groupId,
      }))
    )

    // 批量创建,跳过已存在的关联
    let addedCount = 0
    let skippedCount = 0

    for (const membership of memberships) {
      try {
        await prisma.groupMember.create({
          data: membership,
        })
        addedCount++
      } catch {
        // 如果已存在则跳过
        skippedCount++
      }
    }

    return NextResponse.json({
      success: true,
      addedCount,
      skippedCount,
      message: `成功添加 ${addedCount} 个分组关联${skippedCount > 0 ? `，跳过 ${skippedCount} 个已存在的关联` : ''}`,
    })
  } catch (error) {
    console.error('Batch add group members error:', error)
    return NextResponse.json({ error: '批量添加分组失败' }, { status: 500 })
  }
}
