'use client'

import { ColumnDef } from '@tanstack/react-table'
import {
  ArrowUpDown,
  Ban,
  CheckCircle,
  Mail,
  MoreHorizontal,
  Pencil,
  Shield,
  Trash2,
  UserCog,
  XCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface User {
  id: string
  email: string
  name: string
  role: string
  banned: boolean
  banReason?: string | null
  banExpires?: number
  emailVerified: boolean
  createdAt: string
}

interface UserColumnProps {
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onUpdateRole: (user: User) => void
  onBan: (user: User) => void
  onUnban: (userId: string) => void
  onSendVerification: (userId: string, email: string) => void
  onResetPassword: (user: User) => void
}

export const createUserColumns = ({
  onEdit,
  onDelete,
  onUpdateRole,
  onBan,
  onUnban,
  onSendVerification,
  onResetPassword,
}: UserColumnProps): ColumnDef<User>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label="全选"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label="选择行"
        onClick={e => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          邮箱
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('email')}</div>,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          姓名
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div>{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'role',
    header: '角色',
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      return (
        <div className="flex items-center gap-1">
          {role === 'admin' && <Shield className="h-4 w-4 text-yellow-500" />}
          <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
            {role === 'admin' ? '管理员' : '普通用户'}
          </Badge>
        </div>
      )
    },
  },
  {
    id: 'status',
    header: '状态',
    cell: ({ row }) => {
      const user = row.original
      return user.banned ? (
        <div className="flex items-center gap-1 text-red-500">
          <Ban className="h-4 w-4" />
          <span>已封禁</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-green-500">
          <CheckCircle className="h-4 w-4" />
          <span>正常</span>
        </div>
      )
    },
  },
  {
    id: 'emailVerified',
    header: '邮箱验证',
    cell: ({ row }) => {
      const user = row.original
      return user.emailVerified ? (
        <div className="flex items-center gap-1 text-green-500">
          <CheckCircle className="h-4 w-4" />
          <span>已验证</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-gray-500">
          <XCircle className="h-4 w-4" />
          <span>未验证</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          创建时间
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return <div>{date.toLocaleDateString('zh-CN')}</div>
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original
      const isAdmin = user.role === 'admin'

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">打开菜单</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                navigator.clipboard.writeText(user.id)
              }}
            >
              复制用户ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                onEdit(user)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              编辑信息
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                onUpdateRole(user)
              }}
            >
              <UserCog className="mr-2 h-4 w-4" />
              修改角色
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                onResetPassword(user)
              }}
            >
              重置密码
            </DropdownMenuItem>
            {!user.emailVerified && (
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation()
                  onSendVerification(user.id, user.email)
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                发送验证邮件
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {user.banned ? (
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation()
                  onUnban(user.id)
                }}
                className="text-green-600"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                解除封禁
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation()
                  onBan(user)
                }}
                className="text-orange-600"
              >
                <Ban className="mr-2 h-4 w-4" />
                封禁用户
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                onDelete(user)
              }}
              disabled={isAdmin}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isAdmin ? '无法删除管理员' : '删除用户'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
