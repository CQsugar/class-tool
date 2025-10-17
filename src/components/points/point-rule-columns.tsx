'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PointRule, PointType } from '@prisma/client'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

export type PointRuleColumn = Pick<
  PointRule,
  | 'id'
  | 'name'
  | 'points'
  | 'type'
  | 'category'
  | 'description'
  | 'isActive'
  | 'createdAt'
  | 'updatedAt'
  | 'userId'
>

interface PointRuleColumnsProps {
  onEdit: (rule: PointRuleColumn) => void
  onDelete: (rule: PointRuleColumn) => void
}

export const getPointRuleColumns = ({
  onEdit,
  onDelete,
}: PointRuleColumnsProps): ColumnDef<PointRuleColumn>[] => [
  {
    accessorKey: 'name',
    header: '规则名称',
    cell: ({ row }) => {
      const isActive = row.original.isActive
      return (
        <div className="flex items-center gap-2">
          <span className={!isActive ? 'text-muted-foreground' : ''}>{row.getValue('name')}</span>
          {!isActive && (
            <Badge variant="outline" className="text-xs">
              已停用
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'points',
    header: '积分值',
    cell: ({ row }) => {
      const points = row.getValue('points') as number
      const type = row.original.type
      return (
        <span
          className={
            type === PointType.ADD
              ? 'font-medium text-green-600'
              : type === PointType.SUBTRACT
                ? 'font-medium text-red-600'
                : 'font-medium text-blue-600'
          }
        >
          {type === PointType.ADD && '+'}
          {type === PointType.SUBTRACT && '-'}
          {type === PointType.RESET ? '重置' : Math.abs(points)}
        </span>
      )
    },
  },
  {
    accessorKey: 'type',
    header: '类型',
    cell: ({ row }) => {
      const type = row.getValue('type') as PointType
      const typeLabels: Record<PointType, string> = {
        ADD: '加分',
        SUBTRACT: '减分',
        RESET: '重置',
      }
      const typeVariants: Record<PointType, 'default' | 'destructive' | 'outline'> = {
        ADD: 'default',
        SUBTRACT: 'destructive',
        RESET: 'outline',
      }
      return <Badge variant={typeVariants[type]}>{typeLabels[type]}</Badge>
    },
  },
  {
    accessorKey: 'category',
    header: '分类',
    cell: ({ row }) => {
      const category = row.getValue('category') as string | null
      return category ? (
        <Badge variant="secondary">{category}</Badge>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      )
    },
  },
  {
    accessorKey: 'description',
    header: '说明',
    cell: ({ row }) => {
      const description = row.getValue('description') as string | null
      return (
        <span className="text-muted-foreground block max-w-[200px] truncate text-sm">
          {description || '-'}
        </span>
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
      const rule = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">打开菜单</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(rule)}>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(rule)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
