import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPKSessionSchema } from '@/lib/validations/pk'
import { PKMode, PKStatus } from '@prisma/client'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * POST /api/pk/sessions
 * 创建 PK 会话
 */
export async function POST(request: NextRequest) {
  try {
    // 认证检查
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = session.user

    // 解析请求体
    const body = await request.json()
    const result = createPKSessionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: '参数验证失败', details: result.error.issues },
        { status: 400 }
      )
    }

    const { mode, topic, rewardPoints, duration, studentIds, groupIds } = result.data

    // 根据不同模式验证参数
    if (mode === 'INDIVIDUAL') {
      if (!studentIds || studentIds.length !== 2) {
        return NextResponse.json({ error: '个人PK模式需要选择2名学生' }, { status: 400 })
      }

      // 验证学生是否存在且属于当前用户
      const students = await prisma.student.findMany({
        where: {
          id: { in: studentIds },
          userId: user.id,
          isArchived: false,
        },
      })

      if (students.length !== 2) {
        return NextResponse.json({ error: '学生不存在或已归档' }, { status: 404 })
      }

      // 创建 PK 会话
      const pkSession = await prisma.pKSession.create({
        data: {
          userId: user.id,
          mode,
          topic,
          rewardPoints: rewardPoints || 0,
          duration,
          participants: {
            create: studentIds.map(studentId => ({
              type: 'STUDENT',
              studentId,
            })),
          },
        },
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
            },
          },
        },
      })

      return NextResponse.json({
        session: pkSession,
        message: 'PK会话创建成功',
      })
    }

    if (mode === 'GROUP') {
      if (!groupIds || groupIds.length !== 2) {
        return NextResponse.json({ error: '分组PK模式需要选择2个分组' }, { status: 400 })
      }

      // 验证分组是否存在且属于当前用户
      const groups = await prisma.studentGroup.findMany({
        where: {
          id: { in: groupIds },
          userId: user.id,
          isArchived: false,
        },
        include: {
          members: true,
        },
      })

      if (groups.length !== 2) {
        return NextResponse.json({ error: '分组不存在或已归档' }, { status: 404 })
      }

      // 验证每个分组至少有1名成员
      for (const group of groups) {
        if (group.members.length === 0) {
          return NextResponse.json({ error: `分组 "${group.name}" 没有成员` }, { status: 400 })
        }
      }

      // 创建 PK 会话
      const pkSession = await prisma.pKSession.create({
        data: {
          userId: user.id,
          mode,
          topic,
          rewardPoints: rewardPoints || 0,
          duration,
          participants: {
            create: groupIds.map(groupId => ({
              type: 'GROUP',
              groupId,
            })),
          },
        },
        include: {
          participants: {
            include: {
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

      return NextResponse.json({
        session: pkSession,
        message: 'PK会话创建成功',
      })
    }

    if (mode === 'RANDOM') {
      // 随机选择2名学生
      const students = await prisma.student.findMany({
        where: {
          userId: user.id,
          isArchived: false,
        },
        select: {
          id: true,
          name: true,
          studentNo: true,
          avatar: true,
          points: true,
        },
      })

      if (students.length < 2) {
        return NextResponse.json({ error: '至少需要2名学生才能进行随机PK' }, { status: 400 })
      }

      // Fisher-Yates 洗牌算法随机选择2名学生
      const shuffled = [...students].sort(() => Math.random() - 0.5)
      const selectedStudents = shuffled.slice(0, 2)

      // 创建 PK 会话
      const pkSession = await prisma.pKSession.create({
        data: {
          userId: user.id,
          mode,
          topic,
          rewardPoints: rewardPoints || 0,
          duration,
          participants: {
            create: selectedStudents.map(student => ({
              type: 'STUDENT',
              studentId: student.id,
            })),
          },
        },
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
            },
          },
        },
      })

      return NextResponse.json({
        session: pkSession,
        message: '随机PK会话创建成功',
      })
    }

    return NextResponse.json({ error: '不支持的PK模式' }, { status: 400 })
  } catch (error) {
    console.error('Create PK session error:', error)
    return NextResponse.json({ error: '创建PK会话失败' }, { status: 500 })
  }
}

/**
 * GET /api/pk/sessions
 * 查询 PK 会话列表
 */
export async function GET(request: NextRequest) {
  try {
    // 认证检查
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = session.user

    // 解析查询参数
    const { searchParams } = new URL(request.url)
    const params = {
      mode: searchParams.get('mode'),
      status: searchParams.get('status'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    }

    const result = z
      .object({
        mode: z.enum(['INDIVIDUAL', 'GROUP', 'RANDOM']).optional(),
        status: z.enum(['ONGOING', 'FINISHED', 'CANCELLED']).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      })
      .safeParse(params)

    if (!result.success) {
      return NextResponse.json(
        { error: '参数验证失败', details: result.error.issues },
        { status: 400 }
      )
    }

    const { mode, status, page, limit } = result.data

    // 构建查询条件
    const where: {
      userId: string
      mode?: PKMode
      status?: PKStatus
    } = {
      userId: user.id,
    }

    if (mode) {
      where.mode = mode
    }

    if (status) {
      where.status = status
    }

    // 查询总数
    const total = await prisma.pKSession.count({ where })

    // 查询会话列表
    const sessions = await prisma.pKSession.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get PK sessions error:', error)
    return NextResponse.json({ error: '查询PK会话失败' }, { status: 500 })
  }
}
