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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ResetMode, resetPointsSchema, type ResetPointsInput } from '@/lib/validations/point-reset'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

interface Group {
  id: string
  name: string
  color: string | null
  _count: {
    members: number
  }
}

interface Tag {
  id: string
  name: string
  color: string
  _count: {
    relations: number
  }
}

interface ResetPointsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedStudentIds?: string[]
  onSuccess?: () => void
}

export function ResetPointsDialog({
  open,
  onOpenChange,
  selectedStudentIds = [],
  onSuccess,
}: ResetPointsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingData, setPendingData] = useState<ResetPointsInput | null>(null)

  const form = useForm<ResetPointsInput>({
    resolver: zodResolver(resetPointsSchema),
    defaultValues: {
      mode: selectedStudentIds.length > 0 ? ResetMode.SELECTED : ResetMode.ALL,
      targetValue: 0,
      confirmText: '',
    },
  })

  const selectedMode = form.watch('mode')

  useEffect(() => {
    if (open) {
      loadGroups()
      loadTags()
      form.reset({
        mode: selectedStudentIds.length > 0 ? ResetMode.SELECTED : ResetMode.ALL,
        targetValue: 0,
        confirmText: '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedStudentIds.length])

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/students/groups')
      if (!response.ok) throw new Error('加载分组失败')

      const data = await response.json()
      setGroups(data.data || [])
    } catch (error) {
      console.error('Failed to load groups:', error)
    }
  }

  const loadTags = async () => {
    try {
      const response = await fetch('/api/students/tags')
      if (!response.ok) throw new Error('加载标签失败')

      const data = await response.json()
      setTags(data.data || [])
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  const onSubmit = async (data: ResetPointsInput) => {
    // 第一次提交，显示确认对话框
    setPendingData(data)
    setConfirmDialogOpen(true)
  }

  const handleConfirm = async () => {
    if (!pendingData) return

    try {
      setLoading(true)
      setConfirmDialogOpen(false)

      const requestData: {
        mode: ResetMode
        targetValue: number
        confirmText: string
        groupId?: string
        tagId?: string
        studentIds?: string[]
      } = {
        mode: pendingData.mode,
        targetValue: pendingData.targetValue,
        confirmText: pendingData.confirmText,
      }

      if (pendingData.mode === ResetMode.GROUP) {
        requestData.groupId = pendingData.groupId
      } else if (pendingData.mode === ResetMode.TAG) {
        requestData.tagId = pendingData.tagId
      } else if (pendingData.mode === ResetMode.SELECTED) {
        requestData.studentIds = selectedStudentIds
      }

      const response = await fetch('/api/points/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '重置失败')
      }

      const result = await response.json()
      toast.success(`成功重置 ${result.count} 名学生的积分`)
      onOpenChange(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to reset points:', error)
      toast.error(error instanceof Error ? error.message : '重置失败')
    } finally {
      setLoading(false)
      setPendingData(null)
    }
  }

  const getModeDescription = () => {
    switch (selectedMode) {
      case ResetMode.ALL:
        return '将重置所有未归档学生的积分'
      case ResetMode.GROUP:
        const selectedGroup = groups.find(g => g.id === form.watch('groupId'))
        return selectedGroup
          ? `将重置分组"${selectedGroup.name}"中 ${selectedGroup._count.members} 名学生的积分`
          : '请选择一个分组'
      case ResetMode.TAG:
        const selectedTag = tags.find(t => t.id === form.watch('tagId'))
        return selectedTag
          ? `将重置拥有标签"${selectedTag.name}"的 ${selectedTag._count.relations} 名学生的积分`
          : '请选择一个标签'
      case ResetMode.SELECTED:
        return `将重置选中的 ${selectedStudentIds.length} 名学生的积分`
      default:
        return ''
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-5 w-5" />
              积分重置
            </DialogTitle>
            <DialogDescription>
              这是一个危险操作，将永久修改学生积分。请仔细确认后再进行操作。
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>重置范围</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择重置范围" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ResetMode.ALL}>所有学生</SelectItem>
                        <SelectItem value={ResetMode.GROUP}>按分组</SelectItem>
                        <SelectItem value={ResetMode.TAG}>按标签</SelectItem>
                        {selectedStudentIds.length > 0 && (
                          <SelectItem value={ResetMode.SELECTED}>
                            选中的学生 ({selectedStudentIds.length})
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>{getModeDescription()}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedMode === ResetMode.GROUP && (
                <FormField
                  control={form.control}
                  name="groupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>选择分组</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择一个分组" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groups.map(group => (
                            <SelectItem key={group.id} value={group.id}>
                              <div className="flex items-center gap-2">
                                {group.color && (
                                  <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: group.color }}
                                  />
                                )}
                                {group.name} ({group._count.members} 人)
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedMode === ResetMode.TAG && (
                <FormField
                  control={form.control}
                  name="tagId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>选择标签</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择一个标签" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tags.map(tag => (
                            <SelectItem key={tag.id} value={tag.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                />
                                {tag.name} ({tag._count.relations} 人)
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目标积分</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="例如: 0"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>所有符合条件的学生积分将被设置为此值</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>安全确认</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入"确认重置"'
                        {...field}
                        className="border-destructive"
                      />
                    </FormControl>
                    <FormDescription className="text-destructive">
                      请输入 &ldquo;确认重置&rdquo; 以继续操作
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button type="submit" variant="destructive" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  重置积分
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 二次确认对话框 */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-5 w-5" />
              最终确认
            </AlertDialogTitle>
            <AlertDialogDescription>
              您即将执行以下操作：
              <div className="bg-muted mt-4 space-y-2 rounded-lg p-4">
                <p>
                  <strong>重置范围：</strong>
                  {getModeDescription()}
                </p>
                <p>
                  <strong>目标积分：</strong>
                  {pendingData?.targetValue}
                </p>
              </div>
              <p className="text-destructive mt-4">此操作将立即生效且无法撤销，确定继续吗？</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialogOpen(false)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-destructive">
              确认重置
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
