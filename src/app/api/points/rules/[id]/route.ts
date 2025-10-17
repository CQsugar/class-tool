import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { updatePointRuleSchema } from '@/lib/validations/point-rule'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * GET /api/points/rules/[id] - 获取单个积分规则详情
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证用户认证
    const { user } = await requireAuth(request)

    const { id } = await params

    // 查询积分规则
    const rule = await prisma.pointRule.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            pointRecords: true,
          },
        },
        pointRecords: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                studentNo: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    })

    if (!rule) {
      return NextResponse.json({ error: '积分规则不存在' }, { status: 404 })
    }

    return NextResponse.json(rule)
  } catch (error) {
    console.error('获取积分规则详情失败:', error)

    // 处理认证错误
    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: '获取积分规则详情失败' }, { status: 500 })
  }
}

/**
 * PATCH /api/points/rules/[id] - 更新积分规则
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证用户认证
    const { user } = await requireAuth(request)

    const { id } = await params

    // 解析请求体
    const body = await request.json()

    // 验证输入数据
    const validatedData = updatePointRuleSchema.parse(body)

    // 检查积分规则是否存在且属于当前用户
    const existingRule = await prisma.pointRule.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingRule) {
      return NextResponse.json({ error: '积分规则不存在' }, { status: 404 })
    }

    // 更新积分规则
    const rule = await prisma.pointRule.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            pointRecords: true,
          },
        },
      },
    })

    return NextResponse.json(rule)
  } catch (error) {
    console.error('更新积分规则失败:', error)

    // 处理认证错误
    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 处理验证错误
    if (error instanceof ZodError) {
      return NextResponse.json({ error: '输入数据错误', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: '更新积分规则失败' }, { status: 500 })
  }
}

/**
 * DELETE /api/points/rules/[id] - 删除积分规则
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户认证
    const { user } = await requireAuth(request)

    const { id } = await params

    // 检查积分规则是否存在且属于当前用户
    const existingRule = await prisma.pointRule.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingRule) {
      return NextResponse.json({ error: '积分规则不存在' }, { status: 404 })
    }

    // 删除积分规则（关联的积分记录的 ruleId 会被设置为 null）
    await prisma.pointRule.delete({
      where: { id },
    })

    return NextResponse.json({ message: '积分规则已删除' }, { status: 200 })
  } catch (error) {
    console.error('删除积分规则失败:', error)

    // 处理认证错误
    if (error instanceof Error && error.message.includes('未授权')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: '删除积分规则失败' }, { status: 500 })
  }
}
