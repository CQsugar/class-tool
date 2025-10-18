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

interface GroupMember {
  id: string
  student: Student
}

interface GroupDetail {
  id: string
  name: string
  description: string | null
  color: string | null
  members: GroupMember[]
}

interface GroupMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string | null
  onSuccess?: () => void
}

export function GroupMembersDialog({
  open,
  onOpenChange,
  groupId,
  onSuccess,
}: GroupMembersDialogProps) {
  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null)

  const loadGroup = useCallback(async () => {
    if (!groupId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/students/groups/${groupId}`)
      if (!response.ok) throw new Error('加载分组失败')

      const data = await response.json()
      setGroup(data)
    } catch (error) {
      console.error('Failed to load group:', error)
      toast.error('加载分组失败')
    } finally {
      setLoading(false)
    }
  }, [groupId])

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
    if (open && groupId) {
      loadGroup()
      loadAllStudents()
    }
  }, [open, groupId, loadGroup, loadAllStudents])

  const handleAddMembers = async () => {
    if (!groupId || selectedStudents.length === 0) return

    try {
      const response = await fetch('/api/students/groups/members/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
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
      loadGroup()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to add members:', error)
      toast.error(error instanceof Error ? error.message : '添加失败')
    }
  }

  const handleRemoveMember = async () => {
    if (!groupId || !studentToRemove) return

    try {
      const response = await fetch('/api/students/groups/members/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
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
      loadGroup()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to remove member:', error)
      toast.error(error instanceof Error ? error.message : '移除失败')
    }
  }

  // 获取可添加的学生（不在分组中的）
  const availableStudents = allStudents.filter(
    student => !group?.members.some(m => m.student.id === student.id)
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {group?.name} - 成员管理
              {group?.color && (
                <span
                  className="ml-2 inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
              )}
            </DialogTitle>
            <DialogDescription>{group?.description || '查看和管理分组成员'}</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground text-sm">
                  共 {group?.members.length || 0} 名成员
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowAddDialog(true)}
                  disabled={availableStudents.length === 0}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  添加成员
                </Button>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                {group?.members.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    暂无成员，点击&ldquo;添加成员&rdquo;按钮添加学生
                  </div>
                ) : (
                  <div className="space-y-2">
                    {group?.members.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={member.student.avatar || undefined}
                              alt={member.student.name}
                            />
                            <AvatarFallback>{member.student.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.student.name}</div>
                            <div className="text-muted-foreground text-sm">
                              {member.student.studentNo}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{member.student.points} 积分</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setStudentToRemove(member.student)
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

      {/* 添加成员对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>添加成员</DialogTitle>
            <DialogDescription>选择要添加到分组的学生</DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            {availableStudents.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">所有学生都已在分组中</div>
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
            <Button onClick={handleAddMembers} disabled={selectedStudents.length === 0}>
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
              确定要将 &ldquo;{studentToRemove?.name}&rdquo; 从分组中移除吗？
              <br />
              此操作不会删除学生数据，只是将其从当前分组移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveDialogOpen(false)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive">
              移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
