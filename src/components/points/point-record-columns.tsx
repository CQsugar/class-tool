'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { PointType } from '@prisma/client'
import { ColumnDef } from '@tanstack/react-table'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export interface PointRecordColumn {
  id: string
  points: number
  reason: string
  type: PointType
  createdAt: Date
  student: {
    id: string
    name: string
    studentNo: string
    avatar: string | null
  }
  rule: {
    id: string
    name: string
    category: string | null
  } | null
}

export const pointRecordColumns: ColumnDef<PointRecordColumn>[] = [
  {
    accessorKey: 'student',
    header: '学生',
    cell: ({ row }) => {
      const student = row.getValue('student') as PointRecordColumn['student']
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={student.avatar || undefined} alt={student.name} />
            <AvatarFallback>{student.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{student.name}</div>
            <div className="text-muted-foreground text-xs">{student.studentNo}</div>
          </div>
        </div>
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
    accessorKey: 'points',
    header: '积分变化',
    cell: ({ row }) => {
      const points = row.getValue('points') as number
      const type = row.original.type
      return (
        <span
          className={`font-semibold ${
            type === PointType.ADD
              ? 'text-green-600'
              : type === PointType.SUBTRACT
                ? 'text-red-600'
                : 'text-blue-600'
          }`}
        >
          {type === PointType.ADD && '+'}
          {type === PointType.SUBTRACT && '-'}
          {type === PointType.RESET ? `→ ${points}` : Math.abs(points)}
        </span>
      )
    },
  },
  {
    accessorKey: 'reason',
    header: '原因',
    cell: ({ row }) => {
      const reason = row.getValue('reason') as string
      const rule = row.original.rule
      return (
        <div>
          <div className="text-sm">{reason}</div>
          {rule && (
            <div className="mt-1 flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                规则: {rule.name}
              </Badge>
              {rule.category && (
                <Badge variant="outline" className="text-xs">
                  {rule.category}
                </Badge>
              )}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: '时间',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return (
        <div>
          <div className="text-sm">{date.toLocaleDateString('zh-CN')}</div>
          <div className="text-muted-foreground text-xs">
            {formatDistanceToNow(date, { addSuffix: true, locale: zhCN })}
          </div>
        </div>
      )
    },
  },
]
