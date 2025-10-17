import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addStudentsToTagSchema } from '@/lib/validations/student-tag'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/students/tags/students/add - 批量添加学生到标签
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = addStudentsToTagSchema.parse(body)
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

    // 验证所有学生是否存在且属于当前用户
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

    // 查找已存在的关联
    const existingRelations = await prisma.studentTagRelation.findMany({
      where: {
        tagId,
        studentId: { in: studentIds },
      },
      select: { studentId: true },
    })

    const existingStudentIds = new Set(existingRelations.map(r => r.studentId))

    // 过滤出需要新增的学生
    const newStudentIds = studentIds.filter(id => !existingStudentIds.has(id))

    // 批量创建关联
    if (newStudentIds.length > 0) {
      await prisma.studentTagRelation.createMany({
        data: newStudentIds.map(studentId => ({
          tagId,
          studentId,
        })),
      })
    }

    return NextResponse.json({
      message: '添加成功',
      addedCount: newStudentIds.length,
      skippedCount: studentIds.length - newStudentIds.length,
    })
  } catch (error) {
    console.error('Failed to add students to tag:', error)
    return NextResponse.json({ error: '添加学生到标签失败' }, { status: 500 })
  }
}
