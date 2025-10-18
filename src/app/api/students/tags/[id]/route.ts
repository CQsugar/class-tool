import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateStudentTagSchema } from '@/lib/validations/student-tag'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/students/tags/[id] - 获取标签详情
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params

    const tag = await prisma.studentTag.findUnique({
      where: { id },
      include: {
        relations: {
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
              },
            },
          },
        },
        _count: {
          select: {
            relations: true,
          },
        },
      },
    })

    if (!tag) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 })
    }

    // 验证标签所有权
    if (tag.userId !== session.user.id) {
      return NextResponse.json({ error: '无权访问此标签' }, { status: 403 })
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Failed to fetch tag:', error)
    return NextResponse.json({ error: '获取标签失败' }, { status: 500 })
  }
}

// PATCH /api/students/tags/[id] - 更新标签
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateStudentTagSchema.parse(body)

    // 检查标签是否存在
    const existingTag = await prisma.studentTag.findUnique({
      where: { id },
    })

    if (!existingTag) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 })
    }

    // 验证标签所有权
    if (existingTag.userId !== session.user.id) {
      return NextResponse.json({ error: '无权修改此标签' }, { status: 403 })
    }

    // 如果修改了名称，检查新名称是否已存在
    if (validatedData.name && validatedData.name !== existingTag.name) {
      const duplicateTag = await prisma.studentTag.findUnique({
        where: {
          userId_name: {
            userId: session.user.id,
            name: validatedData.name,
          },
        },
      })

      if (duplicateTag) {
        return NextResponse.json({ error: '标签名称已存在' }, { status: 400 })
      }
    }

    // 更新标签
    const updatedTag = await prisma.studentTag.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            relations: true,
          },
        },
      },
    })

    return NextResponse.json(updatedTag)
  } catch (error) {
    console.error('Failed to update tag:', error)
    return NextResponse.json({ error: '更新标签失败' }, { status: 500 })
  }
}

// DELETE /api/students/tags/[id] - 删除标签
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params

    // 检查标签是否存在
    const existingTag = await prisma.studentTag.findUnique({
      where: { id },
    })

    if (!existingTag) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 })
    }

    // 验证标签所有权
    if (existingTag.userId !== session.user.id) {
      return NextResponse.json({ error: '无权删除此标签' }, { status: 403 })
    }

    // 删除标签（关联的 relations 会因为 onDelete: Cascade 自动删除）
    await prisma.studentTag.delete({
      where: { id },
    })

    return NextResponse.json({ message: '标签已删除' })
  } catch (error) {
    console.error('Failed to delete tag:', error)
    return NextResponse.json({ error: '删除标签失败' }, { status: 500 })
  }
}
