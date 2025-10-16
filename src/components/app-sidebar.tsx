'use client'

import * as React from 'react'
import { Trophy, Phone, Settings, GraduationCap, GalleryVerticalEnd } from 'lucide-react'

import { Nav } from '@/components/nav'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { UserButton } from '@daveyplate/better-auth-ui'

// 班级管理系统数据
const navGroups = [
  {
    groupLabel: '主要',
    items: [
      {
        title: '班级管理',
        url: '#',
        icon: GraduationCap,
        items: [
          {
            title: '学生管理',
            url: '/students',
          },
          {
            title: '分组管理',
            url: '/groups',
          },
        ],
      },
      {
        title: '积分系统',
        url: '#',
        icon: Trophy,
        items: [
          {
            title: '积分管理',
            url: '/points',
          },
          {
            title: '积分商城',
            url: '/store',
          },
          {
            title: '统计报表',
            url: '/analytics',
          },
        ],
      },
      {
        title: '课堂工具',
        url: '#',
        icon: Phone,
        items: [
          {
            title: '随机点名',
            url: '/call',
          },
          {
            title: 'PK对战',
            url: '/pk',
          },
        ],
      },
      {
        title: '系统设置',
        url: '#',
        icon: Settings,
        items: [
          {
            title: '个人设置',
            url: '/settings',
          },
        ],
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { openMobile, open } = useSidebar()
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">班级管理系统</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {navGroups.map(group => (
        <SidebarContent key={group.groupLabel}>
          <Nav items={group.items} groupLabel={group.groupLabel} />
        </SidebarContent>
      ))}
      {/* {data?.user && (
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      )} */}
      <div className="flex w-full items-center justify-center pb-2">
        <UserButton
          className="bg-background text-foreground hover:bg-secondary/80 w-full"
          size={open || openMobile ? 'default' : 'icon'}
        />
      </div>
    </Sidebar>
  )
}
