'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { PointRule, PointType } from '@prisma/client'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  createPointRuleSchema,
  updatePointRuleSchema,
  type CreatePointRuleInput,
  type UpdatePointRuleInput,
} from '@/lib/validations/point-rule'

interface PointRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: PointRule | null
  onSuccess?: () => void
}

export function PointRuleFormDialog({
  open,
  onOpenChange,
  rule,
  onSuccess,
}: PointRuleFormDialogProps) {
  const isEdit = !!rule

  const form = useForm<CreatePointRuleInput | UpdatePointRuleInput>({
    resolver: zodResolver(isEdit ? updatePointRuleSchema : createPointRuleSchema),
    defaultValues: rule
      ? {
          name: rule.name,
          points: rule.points,
          type: rule.type,
          category: rule.category || '',
          description: rule.description || '',
          isActive: rule.isActive,
        }
      : {
          name: '',
          points: 0,
          type: PointType.ADD,
          category: '',
          description: '',
          isActive: true,
        },
  })

  const onSubmit = async (data: CreatePointRuleInput | UpdatePointRuleInput) => {
    try {
      const url = isEdit ? `/api/points/rules/${rule.id}` : '/api/points/rules'
      const method = isEdit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '操作失败')
      }

      toast.success(isEdit ? '积分规则已更新' : '积分规则已添加')
      onOpenChange(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('提交表单失败:', error)
      toast.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑积分规则' : '添加积分规则'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改积分规则。点击保存以更新。' : '创建新的积分规则。带 * 的字段为必填项。'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* 规则名称 */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>规则名称 *</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入规则名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 积分值 */}
              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>积分值 *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="请输入积分值"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>范围：-1000 到 1000</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* 类型 */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>类型 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PointType.ADD}>加分</SelectItem>
                        <SelectItem value={PointType.SUBTRACT}>扣分</SelectItem>
                        <SelectItem value={PointType.RESET}>重置</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 分类 */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>分类</FormLabel>
                    <FormControl>
                      <Input placeholder="如：作业、纪律、课堂表现" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 描述 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入规则描述"
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>最多200个字符</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 是否启用 */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">启用规则</FormLabel>
                    <FormDescription>禁用后该规则将不会在快速操作中显示</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
