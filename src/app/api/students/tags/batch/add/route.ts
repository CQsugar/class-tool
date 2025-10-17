import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addTagsToStudentsSchema } from '@/lib/validations/student-tag'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/students/tags/batch/add - 批量为学生添加标签
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = addTagsToStudentsSchema.parse(body)
    const { studentIds, tagIds } = validatedData

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

    // 验证所有标签是否存在且属于当前用户
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

    // 查找已存在的关联
    const existingRelations = await prisma.studentTagRelation.findMany({
      where: {
        studentId: { in: studentIds },
        tagId: { in: tagIds },
      },
      select: { studentId: true, tagId: true },
    })

    const existingPairs = new Set(existingRelations.map(r => `${r.studentId}-${r.tagId}`))

    // 生成所有可能的配对
    const allPairs = studentIds.flatMap(studentId => tagIds.map(tagId => ({ studentId, tagId })))

    // 过滤出需要新增的配对
    const newPairs = allPairs.filter(pair => !existingPairs.has(`${pair.studentId}-${pair.tagId}`))

    // 批量创建关联
    if (newPairs.length > 0) {
      await prisma.studentTagRelation.createMany({
        data: newPairs,
      })
    }

    return NextResponse.json({
      message: '批量添加标签成功',
      addedCount: newPairs.length,
      skippedCount: allPairs.length - newPairs.length,
    })
  } catch (error) {
    console.error('Failed to batch add tags to students:', error)
    return NextResponse.json({ error: '批量添加标签失败' }, { status: 500 })
  }
}
