import { Metadata } from 'next'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'

export const metadata: Metadata = {
  title: '仪表板 - 班级管理平台',
  description: '班主任班级管理平台仪表板',
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <DashboardSidebar />

      {/* 主内容区域 */}
      <div className="lg:pl-64">
        {/* 顶部导航栏 */}
        <DashboardHeader />

        {/* 页面内容 */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
