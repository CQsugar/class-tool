'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Users, Trophy, Store, Phone, Swords, Settings, BarChart3, Home } from 'lucide-react'

const navigation = [
  {
    name: '仪表板',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: '学生管理',
    href: '/students',
    icon: Users,
  },
  {
    name: '积分管理',
    href: '/points',
    icon: Trophy,
  },
  {
    name: '积分商店',
    href: '/store',
    icon: Store,
  },
  {
    name: '随机点名',
    href: '/call',
    icon: Phone,
  },
  {
    name: 'PK竞赛',
    href: '/pk',
    icon: Swords,
  },
  {
    name: '数据统计',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: '设置',
    href: '/settings',
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-gray-200 bg-white lg:block">
      {/* Logo区域 */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">班</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">班级管理</span>
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {navigation.map(item => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'border-r-2 border-blue-700 bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 底部信息 */}
      <div className="absolute right-3 bottom-4 left-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-center text-xs text-gray-500">版本 1.0.0</p>
        </div>
      </div>
    </div>
  )
}
