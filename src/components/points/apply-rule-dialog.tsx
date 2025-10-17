'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PointType } from '@prisma/client'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface PointRule {
  id: string
  name: string
  points: number
  type: PointType
  category: string | null
  description: string | null
  isActive: boolean
}

interface ApplyRuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedStudentIds: string[]
  studentNames: string[]
  onSuccess?: () => void
}

export function ApplyRuleDialog({
  open,
  onOpenChange,
  selectedStudentIds,
  studentNames,
  onSuccess,
}: ApplyRuleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingRules, setLoadingRules] = useState(true)
  const [rules, setRules] = useState<PointRule[]>([])
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)

  // 加载积分规则
  useEffect(() => {
    if (open) {
      loadRules()
    }
  }, [open])

  const loadRules = async () => {
    try {
      setLoadingRules(true)
      const response = await fetch('/api/points/rules?isActive=true&pageSize=100')
      if (!response.ok) throw new Error('加载规则失败')

      const data = await response.json()
      setRules(data.rules)
    } catch (error) {
      console.error('Failed to load rules:', error)
      toast.error('加载规则失败')
    } finally {
      setLoadingRules(false)
    }
  }

  const handleApplyRule = async () => {
    if (!selectedRuleId) {
      toast.error('请选择一个规则')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/points/apply-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          ruleId: selectedRuleId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '操作失败')
      }

      const result = await response.json()
      toast.success(`成功为 ${result.count} 名学生应用规则：${result.rule.name}`)
      setSelectedRuleId(null)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to apply rule:', error)
      toast.error(error instanceof Error ? error.message : '操作失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: PointType) => {
    switch (type) {
      case PointType.ADD:
        return 'text-green-600'
      case PointType.SUBTRACT:
        return 'text-red-600'
      case PointType.RESET:
        return 'text-blue-600'
      default:
        return ''
    }
  }

  const getTypeBadge = (type: PointType) => {
    switch (type) {
      case PointType.ADD:
        return <Badge variant="default">加分</Badge>
      case PointType.SUBTRACT:
        return <Badge variant="destructive">减分</Badge>
      case PointType.RESET:
        return <Badge variant="outline">重置</Badge>
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>应用积分规则</DialogTitle>
          <DialogDescription>
            为 <strong>{studentNames.length}</strong> 名学生应用已有的积分规则
            {studentNames.length <= 3 && <>：{studentNames.join('、')}</>}
          </DialogDescription>
        </DialogHeader>

        {loadingRules ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            <span className="text-muted-foreground ml-2">加载规则中...</span>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            暂无可用规则，请先创建积分规则
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-2">
              {rules.map(rule => (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => setSelectedRuleId(rule.id)}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                    selectedRuleId === rule.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-medium">{rule.name}</span>
                        {getTypeBadge(rule.type)}
                        {rule.category && (
                          <Badge variant="secondary" className="text-xs">
                            {rule.category}
                          </Badge>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-muted-foreground text-sm">{rule.description}</p>
                      )}
                    </div>
                    <div className={`ml-4 text-lg font-semibold ${getTypeColor(rule.type)}`}>
                      {rule.type === PointType.ADD && '+'}
                      {rule.type === PointType.SUBTRACT && '-'}
                      {rule.type === PointType.RESET ? '重置' : Math.abs(rule.points)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedRuleId(null)
              onOpenChange(false)
            }}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleApplyRule}
            disabled={loading || !selectedRuleId || rules.length === 0}
          >
            {loading ? '处理中...' : '确认应用'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
