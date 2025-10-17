'use client'

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

const presetColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
]

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
      color: group?.color || presetColors[0],
    },
  })

  // 当 group 改变时重置表单
  useEffect(() => {
    if (group) {
      form.reset({
        name: group.name,
        description: group.description || '',
        color: group.color || presetColors[0],
      })
    } else {
      form.reset({
        name: '',
        description: '',
        color: presetColors[0],
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
                    <div className="flex flex-wrap gap-2">
                      {presetColors.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={`h-8 w-8 rounded-full border-2 transition-all ${
                            field.value === color
                              ? 'border-primary scale-110'
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
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
