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

// 16种预设颜色
const PRESET_COLORS = [
  '#ef4444', // 红色
  '#f97316', // 橙色
  '#f59e0b', // 琥珀色
  '#eab308', // 黄色
  '#84cc16', // 青柠色
  '#22c55e', // 绿色
  '#10b981', // 翡翠色
  '#14b8a6', // 蓝绿色
  '#06b6d4', // 青色
  '#0ea5e9', // 天蓝色
  '#3b82f6', // 蓝色
  '#6366f1', // 靛蓝色
  '#8b5cf6', // 紫色
  '#a855f7', // 深紫色
  '#d946ef', // 品红色
  '#ec4899', // 粉红色
]

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
      color: PRESET_COLORS[0],
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
        color: PRESET_COLORS[0],
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
                    <div className="space-y-3">
                      <div className="grid grid-cols-8 gap-2">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`h-8 w-8 rounded-md border-2 transition-all hover:scale-110 ${
                              field.value === color
                                ? 'border-primary ring-primary ring-2 ring-offset-2'
                                : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={field.value}
                          onChange={e => field.onChange(e.target.value)}
                          placeholder="#000000"
                          className="font-mono"
                        />
                        <div
                          className="h-10 w-10 rounded border"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
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
                {loading ? '保存中...' : isEditing ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
