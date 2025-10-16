import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        pointRecords: {
          orderBy: { createdAt: 'desc' },
          take: 5,
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
      },
      orderBy: { points: 'desc' },
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('获取学生列表失败:', error)
    return NextResponse.json({ error: '获取学生列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, studentNo, gender, phone, parentPhone } = body

    const student = await prisma.student.create({
      data: {
        name,
        studentNo,
        gender,
        phone,
        parentPhone,
        userId: 'temp-user-id', // TODO: 从认证中获取用户ID
      },
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('创建学生失败:', error)
    return NextResponse.json({ error: '创建学生失败' }, { status: 500 })
  }
}
