'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

export interface StudentGroupColumn {
  id: string
  name: string
  description: string | null
  color: string | null
  isArchived: boolean
  createdAt: Date
  _count: {
    members: number
  }
}

interface StudentGroupColumnsProps {
  onEdit: (group: StudentGroupColumn) => void
  onDelete: (group: StudentGroupColumn) => void
}

export const getStudentGroupColumns = ({
  onEdit,
  onDelete,
}: StudentGroupColumnsProps): ColumnDef<StudentGroupColumn>[] => [
  {
    accessorKey: 'name',
    header: '分组名称',
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      const color = row.original.color
      const isArchived = row.original.isArchived

      return (
        <div className="flex items-center gap-2">
          {color && (
            <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: color }} />
          )}
          <span className={isArchived ? 'text-muted-foreground' : 'font-medium'}>{name}</span>
          {isArchived && (
            <Badge variant="outline" className="text-xs">
              已归档
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'description',
    header: '描述',
    cell: ({ row }) => {
      const description = row.getValue('description') as string | null
      return (
        <span className="text-muted-foreground block max-w-[300px] truncate text-sm">
          {description || '-'}
        </span>
      )
    },
  },
  {
    accessorKey: '_count',
    header: '成员数量',
    cell: ({ row }) => {
      const count = row.original._count.members
      return (
        <div className="flex items-center gap-1">
          <span className="font-medium">{count}</span>
          <span className="text-muted-foreground text-sm">人</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return <span className="text-sm">{date.toLocaleDateString('zh-CN')}</span>
    },
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => {
      const group = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">打开菜单</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(group)}>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(group)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
