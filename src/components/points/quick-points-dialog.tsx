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
import { cn } from '@/lib/utils'
import { quickPointsSchema, type QuickPointsInput } from '@/lib/validations/point-record'
import { zodResolver } from '@hookform/resolvers/zod'
import { PointType } from '@prisma/client'
import { ClipboardList, Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

interface PointRule {
  id: string
  name: string
  points: number
  type: PointType
  category: string
}

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
  const [rules, setRules] = useState<PointRule[]>([])
  const [showRules, setShowRules] = useState(false)
  const [ruleTypeFilter, setRuleTypeFilter] = useState<PointType | 'ALL'>('ALL')
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<string>('all')

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

  // 加载积分规则
  useEffect(() => {
    if (open) {
      const loadRules = async () => {
        try {
          const response = await fetch('/api/points/rules?limit=100&isActive=true')
          if (!response.ok) return

          const data = await response.json()
          setRules(data.data || [])
        } catch (error) {
          console.error('Failed to load rules:', error)
        }
      }
      loadRules()
    }
  }, [open])

  // 获取所有分类
  const categories = Array.from(new Set(rules.map(r => r.category).filter(Boolean)))

  // 过滤规则
  const filteredRules = rules.filter(rule => {
    if (ruleTypeFilter !== 'ALL' && rule.type !== ruleTypeFilter) return false
    if (ruleCategoryFilter !== 'all' && rule.category !== ruleCategoryFilter) return false
    return true
  })

  // 选择规则
  const handleSelectRule = (rule: PointRule) => {
    form.setValue('points', Math.abs(rule.points))
    form.setValue('reason', rule.name)
    form.setValue('type', rule.type)
    form.setValue('ruleId', rule.id)
    setShowRules(false)
    toast.success(`已选择规则: ${rule.name}`)
  }

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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>快速加减分</DialogTitle>
          <DialogDescription>
            为 <strong>{studentNames.length}</strong> 名学生快速操作积分
            {studentNames.length <= 3 && <>：{studentNames.join('、')}</>}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 从规则选择按钮 */}
            <div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowRules(!showRules)}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                {showRules ? '隐藏规则列表' : '从规则选择'}
              </Button>
            </div>

            {/* 规则选择面板 */}
            {showRules && (
              <div className="space-y-3 rounded-lg border p-3">
                {/* 筛选器 */}
                <div className="flex flex-wrap gap-2">
                  <div className="flex gap-1 rounded-lg border p-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={ruleTypeFilter === 'ALL' ? 'default' : 'ghost'}
                      onClick={() => setRuleTypeFilter('ALL')}
                      className="h-7 text-xs"
                    >
                      全部
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={ruleTypeFilter === PointType.ADD ? 'default' : 'ghost'}
                      onClick={() => setRuleTypeFilter(PointType.ADD)}
                      className="h-7 text-xs text-green-600 hover:text-green-700"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      加分
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={ruleTypeFilter === PointType.SUBTRACT ? 'default' : 'ghost'}
                      onClick={() => setRuleTypeFilter(PointType.SUBTRACT)}
                      className="h-7 text-xs text-red-600 hover:text-red-700"
                    >
                      <Minus className="mr-1 h-3 w-3" />
                      减分
                    </Button>
                  </div>

                  {categories.length > 0 && (
                    <Select value={ruleCategoryFilter} onValueChange={setRuleCategoryFilter}>
                      <SelectTrigger className="h-7 w-[120px] text-xs">
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部分类</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* 规则列表 */}
                <div className="max-h-[250px] overflow-y-auto">
                  {filteredRules.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center text-sm">
                      {rules.length === 0 ? '暂无可用规则' : '没有符合条件的规则'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {filteredRules.map(rule => (
                        <Button
                          key={rule.id}
                          type="button"
                          variant="outline"
                          className="h-auto flex-col items-start p-2 text-left"
                          onClick={() => handleSelectRule(rule)}
                        >
                          <div className="flex w-full items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-medium">{rule.name}</div>
                              {rule.category && (
                                <div className="text-muted-foreground truncate text-xs">
                                  {rule.category}
                                </div>
                              )}
                            </div>
                            <div
                              className={cn(
                                'shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold',
                                rule.type === PointType.ADD
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              )}
                            >
                              {rule.type === PointType.ADD ? '+' : '-'}
                              {Math.abs(rule.points)}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>操作类型</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
