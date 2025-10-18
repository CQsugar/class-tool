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

export function createArchivedStudentColumns(): ColumnDef<Student>[] {
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
      accessorKey: 'updatedAt',
      header: '更新时间',
      cell: ({ row }) => {
        const date = row.getValue('updatedAt') as Date
        return (
          <span className="text-muted-foreground text-sm">
            {format(new Date(date), 'yyyy-MM-dd HH:mm')}
          </span>
        )
      },
    },
    {
      accessorKey: 'notes',
      header: '备注',
      cell: ({ row }) => {
        const notes = row.getValue('notes') as string
        return notes ? (
          <span className="max-w-xs truncate text-sm">{notes}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
  ]
}
