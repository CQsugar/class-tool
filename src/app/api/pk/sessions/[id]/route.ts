import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updatePKSessionSchema } from '@/lib/validations/pk'
import { PKStatus, PKWinnerType } from '@prisma/client'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/pk/sessions/[id]
 * 获取单个 PK 会话详情
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // 认证检查
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = session.user

    // 查询 PK 会话
    const pkSession = await prisma.pKSession.findUnique({
      where: { id },
      include: {
        participants: {
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
            group: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true,
                members: {
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
              },
            },
          },
        },
      },
    })

    if (!pkSession) {
      return NextResponse.json({ error: 'PK会话不存在' }, { status: 404 })
    }

    // 验证所有权
    if (pkSession.userId !== user.id) {
      return NextResponse.json({ error: '无权访问此PK会话' }, { status: 403 })
    }

    return NextResponse.json({ session: pkSession })
  } catch (error) {
    console.error('Get PK session error:', error)
    return NextResponse.json({ error: '获取PK会话失败' }, { status: 500 })
  }
}

/**
 * PATCH /api/pk/sessions/[id]
 * 更新 PK 会话 (设置胜者、更新状态)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // 认证检查
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = session.user

    // 查询现有会话
    const existingSession = await prisma.pKSession.findUnique({
      where: { id },
      include: {
        participants: true,
      },
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'PK会话不存在' }, { status: 404 })
    }

    // 验证所有权
    if (existingSession.userId !== user.id) {
      return NextResponse.json({ error: '无权修改此PK会话' }, { status: 403 })
    }

    // 解析请求体
    const body = await request.json()
    const result = updatePKSessionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: '参数验证失败', details: result.error.issues },
        { status: 400 }
      )
    }

    const { winnerId, winnerType, status } = result.data

    // 构建更新数据
    const updateData: {
      status?: PKStatus
      finishedAt?: Date
      winnerId?: string
      winnerType?: PKWinnerType
    } = {}

    if (status) {
      updateData.status = status

      // 如果状态变为已完成,设置完成时间
      if (status === 'FINISHED' && !existingSession.finishedAt) {
        updateData.finishedAt = new Date()
      }
    }

    if (winnerId && winnerType) {
      // 验证胜者是否在参与者中
      const isValidWinner = existingSession.participants.some(
        (p: { studentId: string | null; groupId: string | null }) => {
          if (winnerType === 'STUDENT') {
            return p.studentId === winnerId
          }
          if (winnerType === 'GROUP') {
            return p.groupId === winnerId
          }
          return false
        }
      )

      if (!isValidWinner) {
        return NextResponse.json({ error: '胜者必须是参与者之一' }, { status: 400 })
      }

      updateData.winnerId = winnerId
      updateData.winnerType = winnerType

      // 如果设置了胜者且状态未完成,自动标记为已完成
      if (existingSession.status === 'ONGOING') {
        updateData.status = 'FINISHED'
        updateData.finishedAt = new Date()
      }

      // 更新参与者的 isWinner 状态
      await prisma.pKParticipant.updateMany({
        where: { sessionId: id },
        data: { isWinner: false },
      })

      if (winnerType === 'STUDENT') {
        await prisma.pKParticipant.updateMany({
          where: {
            sessionId: id,
            studentId: winnerId,
          },
          data: { isWinner: true },
        })

        // 如果设置了奖励积分,给胜者加分
        if (existingSession.rewardPoints > 0) {
          await prisma.student.update({
            where: { id: winnerId },
            data: {
              points: { increment: existingSession.rewardPoints },
            },
          })

          // 记录积分变动
          await prisma.pointRecord.create({
            data: {
              userId: user.id,
              studentId: winnerId,
              points: existingSession.rewardPoints,
              type: 'ADD',
              reason: `PK胜利奖励${existingSession.topic ? `: ${existingSession.topic}` : ''}`,
            },
          })
        }
      } else if (winnerType === 'GROUP') {
        await prisma.pKParticipant.updateMany({
          where: {
            sessionId: id,
            groupId: winnerId,
          },
          data: { isWinner: true },
        })

        // 如果设置了奖励积分,给胜利分组的所有成员加分
        if (existingSession.rewardPoints > 0) {
          const groupMembers = await prisma.studentGroupMember.findMany({
            where: { groupId: winnerId },
            include: { student: true },
          })

          for (const member of groupMembers) {
            await prisma.student.update({
              where: { id: member.studentId },
              data: {
                points: { increment: existingSession.rewardPoints },
              },
            })

            // 记录积分变动
            await prisma.pointRecord.create({
              data: {
                userId: user.id,
                studentId: member.studentId,
                points: existingSession.rewardPoints,
                type: 'ADD',
                reason: `PK胜利奖励(分组)${existingSession.topic ? `: ${existingSession.topic}` : ''}`,
              },
            })
          }
        }
      }
    }

    // 更新会话
    const updatedSession = await prisma.pKSession.update({
      where: { id },
      data: updateData,
      include: {
        participants: {
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
            group: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      session: updatedSession,
      message: 'PK会话更新成功',
    })
  } catch (error) {
    console.error('Update PK session error:', error)
    return NextResponse.json({ error: '更新PK会话失败' }, { status: 500 })
  }
}

/**
 * DELETE /api/pk/sessions/[id]
 * 删除 PK 会话
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 认证检查
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = session.user

    // 查询现有会话
    const existingSession = await prisma.pKSession.findUnique({
      where: { id },
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'PK会话不存在' }, { status: 404 })
    }

    // 验证所有权
    if (existingSession.userId !== user.id) {
      return NextResponse.json({ error: '无权删除此PK会话' }, { status: 403 })
    }

    // 删除会话 (参与者会通过 Cascade 自动删除)
    await prisma.pKSession.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'PK会话删除成功' })
  } catch (error) {
    console.error('Delete PK session error:', error)
    return NextResponse.json({ error: '删除PK会话失败' }, { status: 500 })
  }
}
