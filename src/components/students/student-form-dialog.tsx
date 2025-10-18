'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Gender, Student } from '@prisma/client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { AvatarUpload } from '@/components/ui/avatar-upload'
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
import { Textarea } from '@/components/ui/textarea'

// 统一的表单 schema
const formSchema = z.object({
  name: z.string().min(1, '请输入学生姓名'),
  studentNo: z.string().min(1, '请输入学号'),
  gender: z.nativeEnum(Gender),
  phone: z.string().optional(),
  parentPhone: z.string().optional(),
  avatar: z.union([z.string(), z.instanceof(File)]).optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface StudentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student | null
  onSuccess?: () => void
}

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: StudentFormDialogProps) {
  const isEdit = !!student

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      studentNo: '',
      gender: Gender.MALE,
      phone: '',
      parentPhone: '',
      avatar: '',
      notes: '',
    },
  })

  // 当对话框打开或学生数据变化时，重置表单
  useEffect(() => {
    if (open && student) {
      // 编辑模式：填充学生数据
      form.reset({
        name: student.name,
        studentNo: student.studentNo,
        gender: student.gender,
        phone: student.phone || '',
        parentPhone: student.parentPhone || '',
        avatar: student.avatar || '',
        notes: student.notes || '',
      })
    } else if (open && !student) {
      // 新增模式：重置为空值
      form.reset({
        name: '',
        studentNo: '',
        gender: Gender.MALE,
        phone: '',
        parentPhone: '',
        avatar: '',
        notes: '',
      })
    }
  }, [open, student, form])

  async function onSubmit(values: FormValues) {
    try {
      // 处理头像上传：如果 avatar 是 File 对象，先上传获取 URL
      let avatarUrl = values.avatar
      if (values.avatar && typeof values.avatar !== 'string') {
        const formData = new FormData()
        formData.append('file', values.avatar)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('头像上传失败')
        }

        const uploadResult = await uploadResponse.json()
        avatarUrl = uploadResult.url
      }

      // 准备提交数据，使用上传后的 URL
      const submitData = {
        ...values,
        avatar: avatarUrl,
      }

      const url = student ? `/api/students/${student.id}` : '/api/students'
      const method = student ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        let errorMessage = '操作失败'
        try {
          const error = await response.json()
          errorMessage = error.error || error.message || errorMessage
        } catch {
          // 如果响应不是 JSON 格式，使用状态文本
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      await response.json()
      toast.success(student ? '学生信息已更新' : '学生已添加')

      // 刷新列表
      if (onSuccess) {
        onSuccess()
      }

      // 关闭对话框
      onOpenChange(false)

      // 重置表单
      form.reset()
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑学生信息' : '添加新学生'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '修改学生的基本信息。点击保存以更新。'
              : '填写学生的基本信息。带 * 的字段为必填项。'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* 姓名 */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>姓名 *</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入姓名" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 学号 */}
              <FormField
                control={form.control}
                name="studentNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>学号 *</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入学号" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 性别 */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>性别 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择性别" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Gender.MALE}>男</SelectItem>
                      <SelectItem value={Gender.FEMALE}>女</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {/* 手机号 */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>手机号</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入手机号" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 家长手机号 */}
              <FormField
                control={form.control}
                name="parentPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>家长手机号</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入家长手机号" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 头像上传 */}
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <AvatarUpload
                      value={field.value}
                      onChange={field.onChange}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 备注 */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入备注信息"
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>最多500个字符</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  form.reset()
                }}
              >
                取消
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? '提交中...' : isEdit ? '保存' : '添加'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
