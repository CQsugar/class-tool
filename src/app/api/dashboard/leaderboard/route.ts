import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/dashboard/leaderboard - 获取积分排行榜
export async function GET(request: NextRequest) {
  const headersList = await headers()
  const session = await auth.api.getSession({
    headers: headersList,
  })

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const order = searchParams.get('order') || 'desc' // desc: 正向排序, asc: 负向排序
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    const students = await prisma.student.findMany({
      where: {
        userId: session.user.id,
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        studentNo: true,
        avatar: true,
        points: true,
      },
      orderBy: {
        points: order === 'asc' ? 'asc' : 'desc',
      },
      take: Math.min(limit, 50), // 最多50条
    })

    return NextResponse.json({
      students: students.map((student, index) => ({
        ...student,
        rank: index + 1,
      })),
      order,
    })
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
