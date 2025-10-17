'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Minus, Plus, Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface Student {
  id: string
  name: string
  studentNo: string
  points: number
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
        {/* 学生选择 */}
        <div className="space-y-2">
          <Label>选择学生</Label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="选择学生..." />
            </SelectTrigger>
            <SelectContent>
              {students.map(student => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name} ({student.studentNo}) - {student.points}分
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedStudentData && (
            <p className="text-muted-foreground text-sm">当前积分: {selectedStudentData.points}</p>
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
              disabled={loading || !selectedStudent}
              className="text-green-600"
            >
              <Plus className="mr-1 h-4 w-4" />
              +1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(5, '作业优秀')}
              disabled={loading || !selectedStudent}
              className="text-green-600"
            >
              <Plus className="mr-1 h-4 w-4" />
              +5
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(10, '课堂表现突出')}
              disabled={loading || !selectedStudent}
              className="text-green-600"
            >
              <Plus className="mr-1 h-4 w-4" />
              +10
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(-1, '迟到')}
              disabled={loading || !selectedStudent}
              className="text-red-600"
            >
              <Minus className="mr-1 h-4 w-4" />
              -1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(-5, '违反纪律')}
              disabled={loading || !selectedStudent}
              className="text-red-600"
            >
              <Minus className="mr-1 h-4 w-4" />
              -5
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(-10, '严重违纪')}
              disabled={loading || !selectedStudent}
              className="text-red-600"
            >
              <Minus className="mr-1 h-4 w-4" />
              -10
            </Button>
          </div>
        </div>

        {/* 自定义操作 */}
        <div className="space-y-2">
          <Label>自定义操作</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="积分数(正数加分,负数扣分)"
              value={points}
              onChange={e => setPoints(e.target.value)}
              disabled={loading}
            />
          </div>
          <Input
            placeholder="操作原因"
            value={reason}
            onChange={e => setReason(e.target.value)}
            disabled={loading}
            maxLength={200}
          />
          <Button
            className="w-full"
            onClick={handleCustomAction}
            disabled={loading || !selectedStudent}
          >
            <Zap className="mr-2 h-4 w-4" />
            {loading ? '处理中...' : '执行操作'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
