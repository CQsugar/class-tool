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
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react'

export interface StudentTagColumn {
  id: string
  name: string
  color: string
  createdAt: Date
  _count: {
    relations: number
  }
}

interface StudentTagColumnsProps {
  onEdit: (tag: StudentTagColumn) => void
  onDelete: (tag: StudentTagColumn) => void
  onViewStudents: (tag: StudentTagColumn) => void
}

export const getStudentTagColumns = ({
  onEdit,
  onDelete,
  onViewStudents,
}: StudentTagColumnsProps): ColumnDef<StudentTagColumn>[] => [
  {
    accessorKey: 'name',
    header: '标签名称',
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      const color = row.original.color

      return (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: color }} />
          <span className="font-medium">{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: '_count.relations',
    header: '学生数量',
    cell: ({ row }) => {
      const count = row.original._count.relations
      return (
        <Badge variant="secondary">
          <Users className="mr-1 h-3 w-3" />
          {count}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as Date
      return (
        <span className="text-muted-foreground text-sm">
          {formatDistanceToNow(new Date(date), {
            addSuffix: true,
            locale: zhCN,
          })}
        </span>
      )
    },
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => {
      const tag = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">打开菜单</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewStudents(tag)}>
              <Users className="mr-2 h-4 w-4" />
              查看学生
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(tag)}>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(tag)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
