'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Trash2, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Student {
  id: string
  name: string
  studentNo: string
  avatar: string | null
  points: number
}

interface TagRelation {
  id: string
  student: Student
}

interface TagDetail {
  id: string
  name: string
  color: string
  relations: TagRelation[]
}

interface TagStudentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tagId: string | null
  onSuccess?: () => void
}

export function TagStudentsDialog({
  open,
  onOpenChange,
  tagId,
  onSuccess,
}: TagStudentsDialogProps) {
  const [loading, setLoading] = useState(true)
  const [tag, setTag] = useState<TagDetail | null>(null)
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null)

  const loadTag = useCallback(async () => {
    if (!tagId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/students/tags/${tagId}`)
      if (!response.ok) throw new Error('加载标签失败')

      const data = await response.json()
      setTag(data)
    } catch (error) {
      console.error('Failed to load tag:', error)
      toast.error('加载标签失败')
    } finally {
      setLoading(false)
    }
  }, [tagId])

  const loadAllStudents = useCallback(async () => {
    try {
      const response = await fetch('/api/students')
      if (!response.ok) throw new Error('加载学生列表失败')

      const data = await response.json()
      setAllStudents(data.data || [])
    } catch (error) {
      console.error('Failed to load students:', error)
    }
  }, [])

  useEffect(() => {
    if (open && tagId) {
      loadTag()
      loadAllStudents()
    }
  }, [open, tagId, loadTag, loadAllStudents])

  const handleAddStudents = async () => {
    if (!tagId || selectedStudents.length === 0) return

    try {
      const response = await fetch('/api/students/tags/students/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId,
          studentIds: selectedStudents,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '添加失败')
      }

      const result = await response.json()
      toast.success(`成功添加 ${result.addedCount} 名学生`)
      setShowAddDialog(false)
      setSelectedStudents([])
      loadTag()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to add students:', error)
      toast.error(error instanceof Error ? error.message : '添加失败')
    }
  }

  const handleRemoveStudent = async () => {
    if (!tagId || !studentToRemove) return

    try {
      const response = await fetch('/api/students/tags/students/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId,
          studentIds: [studentToRemove.id],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '移除失败')
      }

      toast.success('已移除学生')
      setRemoveDialogOpen(false)
      setStudentToRemove(null)
      loadTag()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to remove student:', error)
      toast.error(error instanceof Error ? error.message : '移除失败')
    }
  }

  // 获取可添加的学生（没有此标签的）
  const availableStudents = allStudents.filter(
    student => !tag?.relations.some(r => r.student.id === student.id)
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {tag?.name} - 学生管理
              {tag?.color && (
                <span
                  className="ml-2 inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
              )}
            </DialogTitle>
            <DialogDescription>查看和管理拥有此标签的学生</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground text-sm">
                  共 {tag?.relations.length || 0} 名学生
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowAddDialog(true)}
                  disabled={availableStudents.length === 0}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  添加学生
                </Button>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                {tag?.relations.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    暂无学生，点击&ldquo;添加学生&rdquo;按钮添加
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tag?.relations.map(relation => (
                      <div
                        key={relation.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={relation.student.avatar || undefined}
                              alt={relation.student.name}
                            />
                            <AvatarFallback>{relation.student.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{relation.student.name}</div>
                            <div className="text-muted-foreground text-sm">
                              {relation.student.studentNo}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{relation.student.points} 积分</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setStudentToRemove(relation.student)
                              setRemoveDialogOpen(true)
                            }}
                          >
                            <Trash2 className="text-destructive h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加学生对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>添加学生</DialogTitle>
            <DialogDescription>选择要添加此标签的学生</DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            {availableStudents.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">所有学生都已拥有此标签</div>
            ) : (
              <div className="space-y-2">
                {availableStudents.map(student => (
                  <div
                    key={student.id}
                    className="flex items-center space-x-3 rounded-lg border p-3"
                  >
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setSelectedStudents([...selectedStudents, student.id])
                        } else {
                          setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                        }
                      }}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={student.avatar || undefined} alt={student.name} />
                      <AvatarFallback>{student.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-muted-foreground text-sm">{student.studentNo}</div>
                    </div>
                    <Badge variant="outline">{student.points} 积分</Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddStudents} disabled={selectedStudents.length === 0}>
              添加 ({selectedStudents.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 移除确认对话框 */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认移除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要将 &ldquo;{studentToRemove?.name}&rdquo; 的此标签移除吗？
              <br />
              此操作不会删除学生数据，只是移除该学生的此标签。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveDialogOpen(false)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveStudent} className="bg-destructive">
              移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
