'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bell, Search, Menu } from 'lucide-react'
import { DashboardUserButton } from '@/components/auth/dashboard-user-button'

interface DashboardHeaderProps {
  onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左侧：菜单按钮（移动端）和搜索 */}
        <div className="flex items-center space-x-4">
          {/* 移动端菜单按钮 */}
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>

          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input placeholder="搜索学生、积分记录..." className="w-64 pl-10" />
          </div>
        </div>

        {/* 右侧：通知和用户菜单 */}
        <div className="flex items-center space-x-3">
          {/* 通知按钮 */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
            >
              3
            </Badge>
          </Button>

          {/* 用户菜单 */}
          <DashboardUserButton />
        </div>
      </div>
    </header>
  )
}
