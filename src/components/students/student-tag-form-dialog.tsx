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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { studentTagSchema, type StudentTagInput } from '@/lib/validations/student-tag'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { StudentTagColumn } from './student-tag-columns'

interface StudentTagFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag?: StudentTagColumn | null
  onSuccess?: () => void
}

// 默认颜色 (indigo)
const DEFAULT_COLOR = '#6366f1'

export function StudentTagFormDialog({
  open,
  onOpenChange,
  tag,
  onSuccess,
}: StudentTagFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!tag

  const form = useForm<StudentTagInput>({
    resolver: zodResolver(studentTagSchema),
    defaultValues: {
      name: '',
      color: DEFAULT_COLOR,
    },
  })

  useEffect(() => {
    if (tag) {
      form.reset({
        name: tag.name,
        color: tag.color,
      })
    } else {
      form.reset({
        name: '',
        color: DEFAULT_COLOR,
      })
    }
  }, [tag, form])

  const onSubmit = async (data: StudentTagInput) => {
    try {
      setLoading(true)

      const url = isEditing ? `/api/students/tags/${tag.id}` : '/api/students/tags'

      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '操作失败')
      }

      toast.success(isEditing ? '标签已更新' : '标签已创建')
      onOpenChange(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save tag:', error)
      toast.error(error instanceof Error ? error.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑标签' : '新建标签'}</DialogTitle>
          <DialogDescription>{isEditing ? '修改标签信息' : '创建新的学生标签'}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标签名称</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：班干部、进步之星" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标签颜色</FormLabel>
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
                {loading ? '保存中...' : isEditing ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
