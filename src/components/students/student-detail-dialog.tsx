'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Calendar, Mail, Phone, Tag, TrendingDown, TrendingUp, User, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface StudentDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string | null
}

interface StudentDetail {
  id: string
  name: string
  studentNo: string
  gender: string
  avatar?: string
  phone?: string
  parentPhone?: string
  email?: string
  address?: string
  points: number
  createdAt: string
  updatedAt: string
  groupMembers: Array<{
    group: {
      id: string
      name: string
      color: string
    }
  }>
  tagRelations: Array<{
    tag: {
      id: string
      name: string
      color: string
    }
  }>
  pointRecords: Array<{
    id: string
    type: string
    points: number
    reason?: string
    createdAt: string
    rule?: {
      name: string
      category?: string
    }
  }>
}

export function StudentDetailDialog({ open, onOpenChange, studentId }: StudentDetailDialogProps) {
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && studentId) {
      loadStudentDetail()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentId])

  const loadStudentDetail = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/students/${studentId}`)
      if (!response.ok) throw new Error('加载学生详情失败')
      const data = await response.json()
      setStudent(data)
    } catch (error) {
      console.error('加载学生详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!student && !loading) {
    return null
  }

  const getNameInitial = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl min-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>学生详情</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : student ? (
          <div className="space-y-6">
            {/* 基本信息卡片 */}
            <div className="bg-muted/50 flex items-start gap-6 rounded-lg p-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={student.avatar} alt={student.name} />
                <AvatarFallback className="text-2xl">{getNameInitial(student.name)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{student.name}</h3>
                    <p className="text-muted-foreground text-sm">学号: {student.studentNo}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-primary text-3xl font-bold">{student.points}</div>
                    <div className="text-muted-foreground text-sm">总积分</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="text-muted-foreground h-4 w-4" />
                    <span>
                      {student.gender === 'MALE'
                        ? '男'
                        : student.gender === 'FEMALE'
                          ? '女'
                          : '其他'}
                    </span>
                  </div>
                  {student.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="text-muted-foreground h-4 w-4" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                  {student.parentPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="text-muted-foreground h-4 w-4" />
                      <span>{student.parentPhone} (家长)</span>
                    </div>
                  )}
                  {student.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="text-muted-foreground h-4 w-4" />
                      <span>{student.email}</span>
                    </div>
                  )}
                </div>

                {student.address && (
                  <div className="text-muted-foreground text-sm">
                    <span className="font-medium">地址：</span>
                    {student.address}
                  </div>
                )}

                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Calendar className="h-3 w-3" />
                  <span>创建于 {formatDate(student.createdAt)}</span>
                  <span>•</span>
                  <span>更新于 {formatDate(student.updatedAt)}</span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="points" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="points">积分记录</TabsTrigger>
                <TabsTrigger value="groups">分组信息</TabsTrigger>
                <TabsTrigger value="tags">标签信息</TabsTrigger>
              </TabsList>

              {/* 积分记录 */}
              <TabsContent value="points" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>时间</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>分数</TableHead>
                        <TableHead>规则</TableHead>
                        <TableHead>原因</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.pointRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-muted-foreground text-center">
                            暂无积分记录
                          </TableCell>
                        </TableRow>
                      ) : (
                        student.pointRecords.map(record => (
                          <TableRow key={record.id}>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(record.createdAt)}
                            </TableCell>
                            <TableCell>
                              {record.type === 'ADD' ? (
                                <Badge
                                  variant="outline"
                                  className="border-green-300 bg-green-500/10 text-green-700"
                                >
                                  <TrendingUp className="mr-1 h-3 w-3" />
                                  加分
                                </Badge>
                              ) : record.type === 'SUBTRACT' ? (
                                <Badge
                                  variant="outline"
                                  className="border-red-300 bg-red-500/10 text-red-700"
                                >
                                  <TrendingDown className="mr-1 h-3 w-3" />
                                  减分
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-blue-300 bg-blue-500/10 text-blue-700"
                                >
                                  重置
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  record.type === 'ADD'
                                    ? 'font-semibold text-green-600'
                                    : record.type === 'SUBTRACT'
                                      ? 'font-semibold text-red-600'
                                      : 'font-semibold text-blue-600'
                                }
                              >
                                {record.type === 'ADD' && '+'}
                                {record.type === 'SUBTRACT' && '-'}
                                {record.type === 'RESET' ? `→ ` : ''}
                                {Math.abs(record.points)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {record.rule ? (
                                <div>
                                  <div className="font-medium">{record.rule.name}</div>
                                  {record.rule.category && (
                                    <div className="text-muted-foreground text-xs">
                                      {record.rule.category}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {record.reason || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* 分组信息 */}
              <TabsContent value="groups" className="space-y-4">
                <div className="space-y-3">
                  {student.groupMembers.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center">
                      <Users className="mx-auto mb-2 h-12 w-12 opacity-50" />
                      <p>该学生未加入任何分组</p>
                    </div>
                  ) : (
                    student.groupMembers.map(({ group }) => (
                      <div
                        key={group.id}
                        className="flex items-center gap-3 rounded-lg border p-4"
                        style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white"
                          style={{ backgroundColor: group.color }}
                        >
                          {group.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{group.name}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* 标签信息 */}
              <TabsContent value="tags" className="space-y-4">
                <div className="space-y-3">
                  {student.tagRelations.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center">
                      <Tag className="mx-auto mb-2 h-12 w-12 opacity-50" />
                      <p>该学生未添加任何标签</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {student.tagRelations.map(({ tag }) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="px-3 py-1.5 text-sm"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            borderColor: tag.color,
                            color: tag.color,
                          }}
                        >
                          <Tag className="mr-1 h-3 w-3" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
