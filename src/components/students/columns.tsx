'use client'

import { Student } from '@prisma/client'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

interface StudentColumnProps {
  onEdit: (student: Student) => void
  onDelete: (student: Student) => void
  onViewDetail: (student: Student) => void
}

export const createStudentColumns = ({
  onEdit,
  onDelete,
  onViewDetail,
}: StudentColumnProps): ColumnDef<Student>[] => [
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
    accessorKey: 'avatar',
    header: '头像',
    cell: ({ row }) => {
      const student = row.original
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={student.avatar || undefined} alt={student.name} />
          <AvatarFallback>{student.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
      )
    },
    enableSorting: false,
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
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'studentNo',
    header: '学号',
    cell: ({ row }) => <div>{row.getValue('studentNo')}</div>,
  },
  {
    accessorKey: 'gender',
    header: '性别',
    cell: ({ row }) => {
      const gender = row.getValue('gender') as string
      return (
        <Badge variant={gender === 'MALE' ? 'default' : 'secondary'}>
          {gender === 'MALE' ? '男' : '女'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'phone',
    header: '手机号',
    cell: ({ row }) => {
      const phone = row.getValue('phone') as string | null
      return <div>{phone || '-'}</div>
    },
  },
  {
    accessorKey: 'parentPhone',
    header: '家长手机',
    cell: ({ row }) => {
      const parentPhone = row.getValue('parentPhone') as string | null
      return <div>{parentPhone || '-'}</div>
    },
  },
  {
    accessorKey: 'points',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          积分
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const points = row.getValue('points') as number
      return (
        <div className="flex items-center justify-start">
          <Badge variant={points >= 0 ? 'default' : 'destructive'} className="font-mono">
            {points >= 0 ? '+' : ''}
            {points}
          </Badge>
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
      const student = row.original

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
                navigator.clipboard.writeText(student.id)
              }}
            >
              复制学生ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                onViewDetail(student)
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                onEdit(student)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                onDelete(student)
              }}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
