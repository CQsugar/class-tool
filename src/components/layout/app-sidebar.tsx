'use client'

import { GalleryVerticalEnd } from 'lucide-react'
import * as React from 'react'

import { Nav } from '@/components/layout/nav'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useSession } from '@/lib/auth-client'
import { navGroups } from '@/lib/navigation'
import { filterNavByPermission } from '@/lib/permissions'
import { UserButton } from '@daveyplate/better-auth-ui'
import Link from 'next/link'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const user = session?.user

  // 基于用户权限过滤导航菜单
  const filteredNavGroups = React.useMemo(() => {
    return navGroups
      .map(group => ({
        ...group,
        items: filterNavByPermission(group.items, user),
      }))
      .filter(group => group.items.length > 0) // 移除没有可见菜单项的分组
  }, [user])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">班级管理系统</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map(group => (
          <Nav key={group.groupLabel} items={group.items} groupLabel={group.groupLabel} />
        ))}
      </SidebarContent>

      <div className="flex w-full items-center justify-center pb-2">
        <UserButton
          className="bg-background text-foreground hover:bg-secondary/80 w-full"
          size={'default'}
        />
      </div>
    </Sidebar>
  )
}
