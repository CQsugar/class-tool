import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateStudentGroupSchema } from '@/lib/validations/student-group'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/students/groups/[id]
 * 获取分组详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // 身份验证
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const userId = session.user.id

    // 查询分组
    const group = await prisma.studentGroup.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        members: {
          where: {
            student: {
              isArchived: false, // 只包含未归档的学生
            },
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                studentNo: true,
                avatar: true,
                points: true,
                gender: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: '分组不存在' }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Failed to fetch student group:', error)
    return NextResponse.json({ error: '查询失败，请稍后重试' }, { status: 500 })
  }
}

/**
 * PATCH /api/students/groups/[id]
 * 更新分组信息
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // 身份验证
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const userId = session.user.id

    // 验证分组是否存在且属于当前用户
    const existing = await prisma.studentGroup.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: '分组不存在' }, { status: 404 })
    }

    // 解析和验证请求体
    const body = await request.json()
    const validationResult = updateStudentGroupSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '数据验证失败', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // 如果修改了名称，检查是否重复
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.studentGroup.findFirst({
        where: {
          userId,
          name: data.name,
          id: { not: id },
          isArchived: false,
        },
      })

      if (duplicate) {
        return NextResponse.json({ error: '分组名称已存在' }, { status: 400 })
      }
    }

    // 更新分组
    const group = await prisma.studentGroup.update({
      where: { id },
      data,
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                studentNo: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Failed to update student group:', error)
    return NextResponse.json({ error: '更新失败，请稍后重试' }, { status: 500 })
  }
}

/**
 * DELETE /api/students/groups/[id]
 * 删除分组
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // 身份验证
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const userId = session.user.id

    // 验证分组是否存在且属于当前用户
    const existing = await prisma.studentGroup.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: '分组不存在' }, { status: 404 })
    }

    // 检查是否有关联的学生
    if (existing._count.members > 0) {
      return NextResponse.json(
        {
          error: '该分组下还有学生，无法删除',
          memberCount: existing._count.members,
        },
        { status: 400 }
      )
    }

    // 删除分组
    await prisma.studentGroup.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete student group:', error)
    return NextResponse.json({ error: '删除失败，请稍后重试' }, { status: 500 })
  }
}
