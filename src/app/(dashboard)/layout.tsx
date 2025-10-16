import { Metadata } from 'next'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
