'use client'

import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/ui/color-picker'
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
import { Textarea } from '@/components/ui/textarea'
import { studentGroupSchema, type StudentGroupInput } from '@/lib/validations/student-group'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { StudentGroupColumn } from './student-group-columns'

interface StudentGroupFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: StudentGroupColumn | null
  onSuccess?: () => void
}

// 默认颜色 (indigo)
const DEFAULT_COLOR = '#6366f1'

export function StudentGroupFormDialog({
  open,
  onOpenChange,
  group,
  onSuccess,
}: StudentGroupFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!group

  const form = useForm<StudentGroupInput>({
    resolver: zodResolver(studentGroupSchema),
    defaultValues: {
      name: group?.name || '',
      description: group?.description || '',
      color: group?.color || DEFAULT_COLOR,
    },
  })

  // 当 group 改变时重置表单
  useEffect(() => {
    if (group) {
      form.reset({
        name: group.name,
        description: group.description || '',
        color: group.color || DEFAULT_COLOR,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        color: DEFAULT_COLOR,
      })
    }
  }, [group, form])

  const onSubmit = async (data: StudentGroupInput) => {
    setLoading(true)
    try {
      const url = isEdit ? `/api/students/groups/${group.id}` : '/api/students/groups'
      const method = isEdit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '操作失败')
      }

      toast.success(isEdit ? '分组已更新' : '分组已创建')
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save group:', error)
      toast.error(error instanceof Error ? error.message : '操作失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑分组' : '创建分组'}</DialogTitle>
          <DialogDescription>{isEdit ? '修改分组信息' : '创建一个新的学生分组'}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分组名称</FormLabel>
                  <FormControl>
                    <Input placeholder="输入分组名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="输入分组描述（可选）"
                      className="resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>最多 200 字</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分组颜色</FormLabel>
                  <FormControl>
                    <ColorPicker value={field.value || '#6366f1'} onChange={field.onChange} />
                  </FormControl>
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
              <Button type="submit" disabled={loading}>
                {loading ? '处理中...' : isEdit ? '更新' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
