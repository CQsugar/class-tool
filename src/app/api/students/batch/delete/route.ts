import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { batchStudentSchema } from '@/lib/validations/student'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * POST /api/students/batch/delete - 批量永久删除学生
 * 注意：这是硬删除，会删除所有相关数据
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const { user } = await requireAuth(request)

    // 解析请求体
    const body = await request.json()

    // 验证输入数据
    const { studentIds } = batchStudentSchema.parse(body)

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

    // 批量删除学生（使用事务确保数据一致性）
    // Prisma会自动级联删除相关数据（因为设置了 onDelete: Cascade）
    const result = await prisma.student.deleteMany({
      where: {
        id: { in: studentIds },
        userId: user.id,
      },
    })

    return NextResponse.json({
      message: '学生已批量删除',
      count: result.count,
    })
  } catch (error) {
    console.error('批量删除学生失败:', error)

    // 处理认证错误
    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 处理验证错误
    if (error instanceof ZodError) {
      return NextResponse.json({ error: '输入数据错误', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: '批量删除学生失败' }, { status: 500 })
  }
}
