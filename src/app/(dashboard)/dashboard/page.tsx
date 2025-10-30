import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'
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
    <div className="flex flex-1 flex-col gap-4 p-2 pt-0 sm:gap-6 sm:p-4 sm:pt-0">
      {/* 欢迎区域 */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">控制台</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          欢迎回来,{session.user.name}!查看您的班级管理概况
        </p>
      </div>

      {/* Dashboard 客户端组件（包含统计卡片、快速积分、排行榜）*/}
      <DashboardClient students={students} />
    </div>
  )
}
