import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { removeStudentsFromTagSchema } from '@/lib/validations/student-tag'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/students/tags/students/remove - 批量从标签移除学生
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = removeStudentsFromTagSchema.parse(body)
    const { tagId, studentIds } = validatedData

    // 检查标签是否存在并验证所有权
    const tag = await prisma.studentTag.findUnique({
      where: { id: tagId },
    })

    if (!tag) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 })
    }

    if (tag.userId !== session.user.id) {
      return NextResponse.json({ error: '无权操作此标签' }, { status: 403 })
    }

    // 批量删除关联
    const result = await prisma.studentTagRelation.deleteMany({
      where: {
        tagId,
        studentId: { in: studentIds },
      },
    })

    return NextResponse.json({
      message: '移除成功',
      removedCount: result.count,
    })
  } catch (error) {
    console.error('Failed to remove students from tag:', error)
    return NextResponse.json({ error: '从标签移除学生失败' }, { status: 500 })
  }
}
