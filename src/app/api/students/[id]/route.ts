import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { updateStudentSchema } from '@/lib/validations/student'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * GET /api/students/[id] - 获取单个学生详情
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证用户认证
    const { user } = await requireAuth(request)

    const { id } = await params

    // 查询学生
    const student = await prisma.student.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        pointRecords: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        groupMembers: {
          include: {
            group: true,
          },
        },
        tagRelations: {
          include: {
            tag: true,
          },
        },
        redemptions: {
          include: {
            item: true,
          },
          orderBy: {
            redeemedAt: 'desc',
          },
          take: 10,
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: '学生不存在' }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('获取学生详情失败:', error)

    // 处理认证错误
    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: '获取学生详情失败' }, { status: 500 })
  }
}

/**
 * PATCH /api/students/[id] - 更新学生信息
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证用户认证
    const { user } = await requireAuth(request)

    const { id } = await params

    // 解析请求体
    const body = await request.json()

    // 验证输入数据
    const validatedData = updateStudentSchema.parse(body)

    // 检查学生是否存在且属于当前用户
    const existingStudent = await prisma.student.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingStudent) {
      return NextResponse.json({ error: '学生不存在' }, { status: 404 })
    }

    // 如果更新学号，检查新学号是否已存在
    if (validatedData.studentNo && validatedData.studentNo !== existingStudent.studentNo) {
      const duplicateStudent = await prisma.student.findFirst({
        where: {
          userId: user.id,
          studentNo: validatedData.studentNo,
          isArchived: false,
          id: { not: id },
        },
      })

      if (duplicateStudent) {
        return NextResponse.json({ error: '学号已存在' }, { status: 409 })
      }
    }

    // 更新学生信息
    const student = await prisma.student.update({
      where: { id },
      data: validatedData,
      include: {
        groupMembers: {
          include: {
            group: true,
          },
        },
        tagRelations: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error('更新学生失败:', error)

    // 处理认证错误
    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 处理验证错误
    if (error instanceof ZodError) {
      return NextResponse.json({ error: '输入数据错误', details: error.issues }, { status: 400 })
    }

    // 处理数据库唯一约束错误
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: '学号已存在' }, { status: 409 })
    }

    return NextResponse.json({ error: '更新学生失败' }, { status: 500 })
  }
}

/**
 * DELETE /api/students/[id] - 删除学生（软删除）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户认证
    const { user } = await requireAuth(request)

    const { id } = await params

    // 检查学生是否存在且属于当前用户
    const existingStudent = await prisma.student.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingStudent) {
      return NextResponse.json({ error: '学生不存在' }, { status: 404 })
    }

    // 软删除学生（设置 isArchived 为 true）
    await prisma.student.update({
      where: { id },
      data: {
        isArchived: true,
      },
    })

    return NextResponse.json({ message: '学生已归档' }, { status: 200 })
  } catch (error) {
    console.error('删除学生失败:', error)

    // 处理认证错误
    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: '删除学生失败' }, { status: 500 })
  }
}
