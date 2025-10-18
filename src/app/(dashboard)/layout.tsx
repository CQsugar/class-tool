import { AppSidebar } from '@/components/layout/app-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '仪表板 - 班级管理平台',
  description: '班主任班级管理平台仪表板',
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="container mx-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
