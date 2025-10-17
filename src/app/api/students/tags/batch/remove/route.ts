import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { removeTagsFromStudentsSchema } from '@/lib/validations/student-tag'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/students/tags/batch/remove - 批量移除学生的标签
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = removeTagsFromStudentsSchema.parse(body)
    const { studentIds, tagIds } = validatedData

    // 验证标签是否属于当前用户
    const tags = await prisma.studentTag.findMany({
      where: {
        id: { in: tagIds },
        userId: session.user.id,
      },
      select: { id: true },
    })

    if (tags.length !== tagIds.length) {
      return NextResponse.json({ error: '部分标签不存在或无权访问' }, { status: 400 })
    }

    // 批量删除关联
    const result = await prisma.studentTagRelation.deleteMany({
      where: {
        studentId: { in: studentIds },
        tagId: { in: tagIds },
      },
    })

    return NextResponse.json({
      message: '批量移除标签成功',
      removedCount: result.count,
    })
  } catch (error) {
    console.error('Failed to batch remove tags from students:', error)
    return NextResponse.json({ error: '批量移除标签失败' }, { status: 500 })
  }
}
