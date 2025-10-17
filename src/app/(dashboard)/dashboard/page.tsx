import { Metadata } from 'next'
import { OverviewStats } from '@/components/dashboard/overview-stats'
import { QuickPointsPanel } from '@/components/dashboard/quick-points-panel'
import { Leaderboard } from '@/components/dashboard/leaderboard'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: '仪表板 - 班级管理平台',
  description: '班级管理平台仪表板概览',
}

export default async function DashboardPage() {
  const headersList = await headers()
  const session = await auth.api.getSession({
    headers: headersList,
  })

  if (!session) {
    redirect('/auth/sign-in')
  }

  // 获取学生列表供快速积分操作使用
  const students = await prisma.student.findMany({
    where: {
      userId: session.user.id,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
      studentNo: true,
      points: true,
    },
    orderBy: {
      studentNo: 'asc',
    },
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      {/* 欢迎区域 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">控制台</h1>
        <p className="text-muted-foreground">欢迎回来,{session.user.name}!查看您的班级管理概况</p>
      </div>

      {/* 数据概览统计卡片 */}
      <OverviewStats />

      {/* 主要功能区域 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 快速积分操作面板 */}
        <QuickPointsPanel students={students} />

        {/* 积分排行榜 */}
        <Leaderboard />
      </div>
    </div>
  )
}
