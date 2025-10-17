import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const quickPointsSchema = z.object({
  studentId: z.string(),
  points: z.number().int(),
  reason: z.string().min(1).max(200),
})

// POST /api/dashboard/quick-points - 快速加减积分
export async function POST(request: NextRequest) {
  const headersList = await headers()
  const session = await auth.api.getSession({
    headers: headersList,
  })

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = quickPointsSchema.parse(body)

    // 验证学生存在且属于当前用户
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
    })

    if (!student || student.userId !== session.user.id) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (student.isArchived) {
      return NextResponse.json({ error: 'Cannot modify archived student' }, { status: 400 })
    }

    // 使用事务更新积分和创建记录
    const result = await prisma.$transaction(async tx => {
      // 更新学生积分
      const updatedStudent = await tx.student.update({
        where: { id: validatedData.studentId },
        data: {
          points: {
            increment: validatedData.points,
          },
        },
      })

      // 创建积分记录
      const pointRecord = await tx.pointRecord.create({
        data: {
          studentId: validatedData.studentId,
          userId: session.user.id,
          points: validatedData.points,
          reason: validatedData.reason,
          type: validatedData.points >= 0 ? 'ADD' : 'SUBTRACT',
        },
      })

      return { student: updatedStudent, record: pointRecord }
    })

    return NextResponse.json({
      success: true,
      student: result.student,
      record: result.record,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Failed to update points:', error)
    return NextResponse.json({ error: 'Failed to update points' }, { status: 500 })
  }
}
