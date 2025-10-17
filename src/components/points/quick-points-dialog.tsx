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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { quickPointsSchema, type QuickPointsInput } from '@/lib/validations/point-record'
import { zodResolver } from '@hookform/resolvers/zod'
import { PointType } from '@prisma/client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

interface QuickPointsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedStudentIds: string[]
  studentNames: string[]
  onSuccess?: () => void
}

export function QuickPointsDialog({
  open,
  onOpenChange,
  selectedStudentIds,
  studentNames,
  onSuccess,
}: QuickPointsDialogProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<QuickPointsInput>({
    resolver: zodResolver(quickPointsSchema),
    defaultValues: {
      studentIds: selectedStudentIds,
      points: 1,
      reason: '',
      type: PointType.ADD,
      ruleId: null,
    },
  })

  // 当选中的学生改变时更新表单
  if (selectedStudentIds.length > 0 && form.getValues('studentIds').length === 0) {
    form.setValue('studentIds', selectedStudentIds)
  }

  const onSubmit = async (data: QuickPointsInput) => {
    setLoading(true)
    try {
      const response = await fetch('/api/points/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '操作失败')
      }

      const result = await response.json()
      toast.success(
        `成功为 ${result.count} 名学生${data.type === PointType.ADD ? '加' : data.type === PointType.SUBTRACT ? '减' : '重置'}分`
      )
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to apply quick points:', error)
      toast.error(error instanceof Error ? error.message : '操作失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const selectedType = form.watch('type')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>快速加减分</DialogTitle>
          <DialogDescription>
            为 <strong>{studentNames.length}</strong> 名学生快速操作积分
            {studentNames.length <= 3 && <>：{studentNames.join('、')}</>}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>操作类型</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择操作类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={PointType.ADD}>加分</SelectItem>
                      <SelectItem value={PointType.SUBTRACT}>减分</SelectItem>
                      <SelectItem value={PointType.RESET}>重置积分</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{selectedType === PointType.RESET ? '重置为' : '积分值'}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={
                        selectedType === PointType.RESET ? '输入重置后的积分' : '输入积分数值'
                      }
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    {selectedType === PointType.RESET
                      ? '学生积分将被重置为此数值'
                      : '范围：-1000 到 1000'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>原因说明</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入操作原因（必填）"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>最多 200 字</FormDescription>
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
                {loading ? '处理中...' : '确认'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
