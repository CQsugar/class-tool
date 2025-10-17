import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { archiveStudentSchema } from '@/lib/validations/student'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * POST /api/students/batch/archive - 批量归档/恢复学生
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const { user } = await requireAuth(request)

    // 解析请求体
    const body = await request.json()

    // 验证输入数据
    const { studentIds, isArchived } = archiveStudentSchema.parse(body)

    // 检查所有学生是否属于当前用户
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        userId: user.id,
      },
      select: { id: true },
    })

    if (students.length !== studentIds.length) {
      return NextResponse.json({ error: '部分学生不存在或无权访问' }, { status: 403 })
    }

    // 批量更新归档状态
    const result = await prisma.student.updateMany({
      where: {
        id: { in: studentIds },
        userId: user.id,
      },
      data: {
        isArchived,
      },
    })

    return NextResponse.json({
      message: isArchived ? '学生已批量归档' : '学生已批量恢复',
      count: result.count,
    })
  } catch (error) {
    console.error('批量归档学生失败:', error)

    // 处理认证错误
    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 处理验证错误
    if (error instanceof ZodError) {
      return NextResponse.json({ error: '输入数据错误', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: '批量归档学生失败' }, { status: 500 })
  }
}
