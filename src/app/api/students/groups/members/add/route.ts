import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addMembersSchema } from '@/lib/validations/student-group'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/students/groups/members/add
 * 批量添加成员到分组
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
    const validationResult = addMembersSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '数据验证失败', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { groupId, studentIds } = validationResult.data

    // 验证分组是否存在且属于当前用户
    const group = await prisma.studentGroup.findFirst({
      where: {
        id: groupId,
        userId,
      },
    })

    if (!group) {
      return NextResponse.json({ error: '分组不存在' }, { status: 404 })
    }

    // 验证学生是否存在且属于当前用户
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        userId,
      },
      select: { id: true },
    })

    if (students.length !== studentIds.length) {
      return NextResponse.json({ error: '部分学生不存在或无权访问' }, { status: 400 })
    }

    // 获取已存在的成员关系
    const existingMembers = await prisma.studentGroupMember.findMany({
      where: {
        groupId,
        studentId: { in: studentIds },
      },
      select: { studentId: true },
    })

    const existingStudentIds = new Set(existingMembers.map(m => m.studentId))

    // 只添加不存在的成员
    const newStudentIds = studentIds.filter(id => !existingStudentIds.has(id))

    if (newStudentIds.length === 0) {
      return NextResponse.json({ error: '所选学生已在分组中' }, { status: 400 })
    }

    // 批量创建成员关系
    await prisma.studentGroupMember.createMany({
      data: newStudentIds.map(studentId => ({
        groupId,
        studentId,
      })),
    })

    return NextResponse.json({
      success: true,
      addedCount: newStudentIds.length,
      skippedCount: studentIds.length - newStudentIds.length,
    })
  } catch (error) {
    console.error('Failed to add group members:', error)
    return NextResponse.json({ error: '添加失败，请稍后重试' }, { status: 500 })
  }
}
