import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { importStudentSchema } from '@/lib/validations/student'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * POST /api/students/batch/import - 批量导入学生
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const { user } = await requireAuth(request)

    // 解析请求体
    const body = await request.json()

    // 验证输入数据
    const students = importStudentSchema.parse(body.students)

    if (students.length === 0) {
      return NextResponse.json({ error: '导入数据不能为空' }, { status: 400 })
    }

    // 检查学号是否已存在
    const studentNos = students.map(s => s.studentNo)
    const existingStudents = await prisma.student.findMany({
      where: {
        userId: user.id,
        studentNo: { in: studentNos },
        isArchived: false,
      },
      select: { studentNo: true },
    })

    if (existingStudents.length > 0) {
      const duplicateNos = existingStudents.map(s => s.studentNo)
      return NextResponse.json(
        {
          error: '部分学号已存在',
          duplicates: duplicateNos,
        },
        { status: 409 }
      )
    }

    // 使用事务批量创建学生
    const createdStudents = await prisma.$transaction(
      students.map(student =>
        prisma.student.create({
          data: {
            ...student,
            userId: user.id,
          },
        })
      )
    )

    return NextResponse.json(
      {
        message: '学生批量导入成功',
        count: createdStudents.length,
        students: createdStudents,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('批量导入学生失败:', error)

    // 处理认证错误
    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 处理验证错误
    if (error instanceof ZodError) {
      return NextResponse.json({ error: '数据格式错误', details: error.issues }, { status: 400 })
    }

    // 处理数据库唯一约束错误
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: '部分学号已存在' }, { status: 409 })
    }

    return NextResponse.json({ error: '批量导入学生失败' }, { status: 500 })
  }
}
