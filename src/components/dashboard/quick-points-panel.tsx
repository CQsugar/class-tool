'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { PointType } from '@prisma/client'
import { Check, ChevronsUpDown, Clipboard, Minus, Plus, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Student {
  id: string
  name: string
  studentNo: string
  points: number
}

interface PointRule {
  id: string
  name: string
  points: number
  type: PointType
  category: string
}

interface QuickPointsPanelProps {
  students: Student[]
  onSuccess?: () => void
}

export function QuickPointsPanel({ students, onSuccess }: QuickPointsPanelProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [points, setPoints] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [rules, setRules] = useState<PointRule[]>([])
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [ruleTypeFilter, setRuleTypeFilter] = useState<PointType | 'ALL'>('ALL')
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<string>('all')

  // 加载积分规则
  useEffect(() => {
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
  }, [])

  // 选择规则
  const handleSelectRule = (rule: PointRule) => {
    setPoints(Math.abs(rule.points).toString())
    setReason(rule.name)
    setRuleDialogOpen(false)
    toast.success(`已选择规则: ${rule.name}`)
  }

  // 获取所有分类
  const categories = Array.from(new Set(rules.map(r => r.category).filter(Boolean)))

  // 过滤规则
  const filteredRules = rules.filter(rule => {
    if (ruleTypeFilter !== 'ALL' && rule.type !== ruleTypeFilter) return false
    if (ruleCategoryFilter !== 'all' && rule.category !== ruleCategoryFilter) return false
    return true
  })

  const handleQuickAction = async (value: number, defaultReason: string) => {
    if (!selectedStudent) {
      toast.error('请选择学生')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/quick-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent,
          points: value,
          reason: reason || defaultReason,
        }),
      })

      if (!response.ok) throw new Error('Failed to update points')

      const data = await response.json()
      toast.success(
        `${value > 0 ? '加分' : '扣分'}成功! ${data.student.name} 当前积分: ${data.student.points}`
      )

      // 重置表单
      setSelectedStudent('')
      setPoints('')
      setReason('')

      onSuccess?.()
    } catch (error) {
      console.error('Failed to update points:', error)
      toast.error('操作失败,请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomAction = async () => {
    if (!selectedStudent) {
      toast.error('请选择学生')
      return
    }

    const pointsValue = parseInt(points)
    if (isNaN(pointsValue) || pointsValue === 0) {
      toast.error('请输入有效的积分数')
      return
    }

    if (!reason.trim()) {
      toast.error('请输入操作原因')
      return
    }

    await handleQuickAction(pointsValue, reason)
  }

  const selectedStudentData = students.find(s => s.id === selectedStudent)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          快速积分操作
        </CardTitle>
        <CardDescription>快速为学生加分或扣分</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 学生选择 - 使用 Combobox 支持搜索 */}
        <div className="space-y-2">
          <Label>选择学生</Label>
          {students.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-center">
              <p className="text-muted-foreground mb-2 text-sm">暂无学生信息</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = '/students')}
              >
                前往创建学生
              </Button>
            </div>
          ) : (
            <>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {selectedStudent
                      ? students.find(s => s.id === selectedStudent)?.name
                      : '选择学生...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="搜索学生..." />
                    <CommandList>
                      <CommandEmpty>未找到学生</CommandEmpty>
                      <CommandGroup>
                        {students.map(student => (
                          <CommandItem
                            key={student.id}
                            value={`${student.name} ${student.studentNo}`}
                            onSelect={() => {
                              setSelectedStudent(student.id)
                              setOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedStudent === student.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{student.name}</div>
                              <div className="text-muted-foreground text-sm">
                                {student.studentNo} · {student.points}分
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedStudentData && (
                <p className="text-muted-foreground text-sm">
                  当前积分: {selectedStudentData.points}
                </p>
              )}
            </>
          )}
        </div>

        {/* 快捷按钮 */}
        <div className="space-y-2">
          <Label>快捷操作</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(1, '课堂表现良好')}
              disabled={loading || !selectedStudent || students.length === 0}
              className="text-green-600"
            >
              <Plus className="mr-1 h-4 w-4" />
              +1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(5, '作业优秀')}
              disabled={loading || !selectedStudent || students.length === 0}
              className="text-green-600"
            >
              <Plus className="mr-1 h-4 w-4" />
              +5
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(10, '课堂表现突出')}
              disabled={loading || !selectedStudent || students.length === 0}
              className="text-green-600"
            >
              <Plus className="mr-1 h-4 w-4" />
              +10
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(-1, '迟到')}
              disabled={loading || !selectedStudent || students.length === 0}
              className="text-red-600"
            >
              <Minus className="mr-1 h-4 w-4" />
              -1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(-5, '违反纪律')}
              disabled={loading || !selectedStudent || students.length === 0}
              className="text-red-600"
            >
              <Minus className="mr-1 h-4 w-4" />
              -5
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(-10, '严重违纪')}
              disabled={loading || !selectedStudent || students.length === 0}
              className="text-red-600"
            >
              <Minus className="mr-1 h-4 w-4" />
              -10
            </Button>
          </div>
        </div>

        {/* 自定义操作 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>自定义操作</Label>
            {rules.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRuleDialogOpen(true)}
                disabled={loading || students.length === 0}
                className="h-auto p-1 text-xs"
              >
                <Clipboard className="mr-1 h-3 w-3" />
                选择规则
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="积分数(正数加分,负数扣分)"
              value={points}
              onChange={e => setPoints(e.target.value)}
              disabled={loading || students.length === 0}
            />
          </div>
          <Input
            placeholder="操作原因"
            value={reason}
            onChange={e => setReason(e.target.value)}
            disabled={loading || students.length === 0}
            maxLength={200}
          />
          <Button
            className="w-full"
            onClick={handleCustomAction}
            disabled={loading || !selectedStudent || students.length === 0}
          >
            <Zap className="mr-2 h-4 w-4" />
            {loading ? '处理中...' : '执行操作'}
          </Button>
        </div>

        {/* 规则选择对话框 */}
        <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>选择积分规则</DialogTitle>
            </DialogHeader>

            {/* 筛选器 */}
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1 rounded-lg border p-1">
                <Button
                  size="sm"
                  variant={ruleTypeFilter === 'ALL' ? 'default' : 'ghost'}
                  onClick={() => setRuleTypeFilter('ALL')}
                  className="h-8"
                >
                  全部
                </Button>
                <Button
                  size="sm"
                  variant={ruleTypeFilter === PointType.ADD ? 'default' : 'ghost'}
                  onClick={() => setRuleTypeFilter(PointType.ADD)}
                  className="h-8 text-green-600 hover:text-green-700"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  加分
                </Button>
                <Button
                  size="sm"
                  variant={ruleTypeFilter === PointType.SUBTRACT ? 'default' : 'ghost'}
                  onClick={() => setRuleTypeFilter(PointType.SUBTRACT)}
                  className="h-8 text-red-600 hover:text-red-700"
                >
                  <Minus className="mr-1 h-3 w-3" />
                  减分
                </Button>
              </div>

              {categories.length > 0 && (
                <Select value={ruleCategoryFilter} onValueChange={setRuleCategoryFilter}>
                  <SelectTrigger className="h-8 w-[140px]">
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

            {/* 规则列表 - 网格布局 */}
            <div className="max-h-[450px] overflow-y-auto">
              {filteredRules.length === 0 ? (
                <div className="text-muted-foreground py-12 text-center text-sm">
                  {rules.length === 0 ? '暂无可用规则' : '没有符合条件的规则'}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {filteredRules.map(rule => (
                    <Button
                      key={rule.id}
                      variant="outline"
                      className="h-auto flex-col items-start p-3 text-left"
                      onClick={() => handleSelectRule(rule)}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{rule.name}</div>
                          {rule.category && (
                            <div className="text-muted-foreground truncate text-xs">
                              {rule.category}
                            </div>
                          )}
                        </div>
                        <div
                          className={cn(
                            'shrink-0 rounded-md px-2 py-1 text-xs font-semibold',
                            rule.type === PointType.ADD
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : rule.type === PointType.SUBTRACT
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          )}
                        >
                          {rule.type === PointType.ADD
                            ? '+'
                            : rule.type === PointType.SUBTRACT
                              ? '-'
                              : '='}
                          {Math.abs(rule.points)}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
