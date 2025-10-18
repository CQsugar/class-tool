import {
  CircleStar,
  GraduationCap,
  LucideLayoutDashboard,
  Phone,
  Store,
  User,
  type LucideIcon,
} from 'lucide-react'

export interface NavSubItem {
  title: string
  url: string
}

export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: NavSubItem[]
}

export interface NavGroup {
  groupLabel: string
  items: NavItem[]
}

// 班级管理系统导航数据
export const navGroups: NavGroup[] = [
  {
    groupLabel: '主要',
    items: [
      {
        title: '控制台',
        url: '/dashboard',
        icon: LucideLayoutDashboard,
      },
      {
        title: '学生管理',
        url: '#',
        icon: GraduationCap,
        isActive: true,
        items: [
          {
            title: '学生列表',
            url: '/students',
          },
          {
            title: '分组管理',
            url: '/students/groups',
          },
          {
            title: '标签管理',
            url: '/students/tags',
          },
        ],
      },
      {
        title: '课堂工具',
        url: '#',
        icon: Phone,
        isActive: true,
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
    ],
  },
  {
    groupLabel: '积分系统',
    items: [
      {
        title: '积分管理',
        url: '#',
        icon: CircleStar,
        isActive: true,
        items: [
          {
            title: '积分规则',
            url: '/points',
          },
          {
            title: '积分记录',
            url: '/points/records',
          },
        ],
      },
      {
        title: '积分商城',
        url: '#',
        icon: Store,
        isActive: true,
        items: [
          {
            title: '商品管理',
            url: '/store',
          },
          {
            title: '兑换记录',
            url: '/store/redemptions',
          },
          {
            title: '商城统计',
            url: '/store/stats',
          },
        ],
      },
    ],
  },
  {
    groupLabel: '系统设置',
    items: [
      {
        title: '个人设置',
        url: '/account/settings',
        icon: User,
      },
    ],
  },
]

/**
 * 根据当前路径获取面包屑导航
 */
export function getBreadcrumbs(pathname: string): { title: string; url?: string }[] {
  const breadcrumbs: { title: string; url?: string }[] = [{ title: '控制台', url: '/dashboard' }]

  // 遍历所有导航组和项目
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.items) {
        for (const subItem of item.items) {
          if (pathname.startsWith(subItem.url)) {
            breadcrumbs.push({ title: item.title })
            breadcrumbs.push({ title: subItem.title, url: subItem.url })
            return breadcrumbs
          }
        }
      }
    }
  }

  return breadcrumbs
}
