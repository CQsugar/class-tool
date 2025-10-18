/**
 * 归档学生列配置
 * 只读模式,不提供任何操作按钮
 */

'use client'

import { Student } from '@prisma/client'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// 扩展 Student 类型以包含 groups 和 tags
interface StudentWithRelations extends Student {
  groups?: Array<{
    id: string
    name: string
    color: string
  }>
  tags?: Array<{
    id: string
    name: string
    color: string
  }>
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Eye, MoreHorizontal } from 'lucide-react'

interface ArchivedStudentColumnProps {
  onViewDetail: (student: Student) => void
}

export function createArchivedStudentColumns({
  onViewDetail,
}: ArchivedStudentColumnProps): ColumnDef<StudentWithRelations>[] {
  return [
    {
      accessorKey: 'studentNo',
      header: '学号',
      cell: ({ row }) => <div className="font-mono text-sm">{row.getValue('studentNo')}</div>,
    },
    {
      accessorKey: 'name',
      header: '姓名',
      cell: ({ row }) => {
        const student = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={student.avatar || undefined} alt={student.name} />
              <AvatarFallback>{student.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{student.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'gender',
      header: '性别',
      cell: ({ row }) => {
        const gender = row.getValue('gender') as string
        return <Badge variant="outline">{gender === 'MALE' ? '男' : '女'}</Badge>
      },
    },
    {
      accessorKey: 'phone',
      header: '手机号',
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string
        return phone ? (
          <span className="font-mono text-sm">{phone}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: 'parentPhone',
      header: '家长手机',
      cell: ({ row }) => {
        const phone = row.getValue('parentPhone') as string
        return phone ? (
          <span className="font-mono text-sm">{phone}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: 'points',
      header: '积分',
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
      id: 'groups',
      header: '分组',
      cell: ({ row }) => {
        const student = row.original
        const groups = student.groups || []

        if (groups.length === 0) return <div className="text-muted-foreground">-</div>

        const displayGroups = groups.slice(0, 2)
        const remainingCount = groups.length - 2

        return (
          <div className="flex items-center gap-1">
            {displayGroups.map(group => (
              <Badge
                key={group.id}
                variant="outline"
                style={{
                  backgroundColor: `${group.color}20`,
                  borderColor: group.color,
                  color: group.color,
                }}
              >
                {group.name}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="cursor-help">
                      +{remainingCount}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      {groups.slice(2).map(group => (
                        <div key={group.id}>{group.name}</div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )
      },
    },
    {
      id: 'tags',
      header: '标签',
      cell: ({ row }) => {
        const student = row.original
        const tags = student.tags || []

        if (tags.length === 0) return <div className="text-muted-foreground">-</div>

        const displayTags = tags.slice(0, 2)
        const remainingCount = tags.length - 2

        return (
          <div className="flex items-center gap-1">
            {displayTags.map(tag => (
              <Badge
                key={tag.id}
                variant="outline"
                style={{
                  backgroundColor: `${tag.color}20`,
                  borderColor: tag.color,
                  color: tag.color,
                }}
              >
                {tag.name}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="cursor-help">
                      +{remainingCount}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      {tags.slice(2).map(tag => (
                        <div key={tag.id}>{tag.name}</div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
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
            {format(new Date(date), 'yyyy-MM-dd HH:mm')}
          </span>
        )
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
                  onViewDetail(student)
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                查看详情
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
