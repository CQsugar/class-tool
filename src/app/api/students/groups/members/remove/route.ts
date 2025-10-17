import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { removeMembersSchema } from '@/lib/validations/student-group'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/students/groups/members/remove
 * 批量从分组移除成员
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
    const validationResult = removeMembersSchema.safeParse(body)

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

    // 批量删除成员关系
    const result = await prisma.studentGroupMember.deleteMany({
      where: {
        groupId,
        studentId: { in: studentIds },
      },
    })

    return NextResponse.json({
      success: true,
      removedCount: result.count,
    })
  } catch (error) {
    console.error('Failed to remove group members:', error)
    return NextResponse.json({ error: '移除失败，请稍后重试' }, { status: 500 })
  }
}
