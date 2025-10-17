'use client'

import { useState } from 'react'
import { ItemType } from '@prisma/client'
import { toast } from 'sonner'
import { Package, Gift, Crown, AlertCircle } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface StoreItem {
  id: string
  name: string
  description: string | null
  cost: number
  image: string | null
  type: ItemType
  stock: number | null
}

interface Student {
  id: string
  name: string
  studentNo: string
  points: number
}

interface RedeemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: StoreItem | null
  student: Student | null
  onSuccess?: () => void
}

const TYPE_ICONS = {
  VIRTUAL: Package,
  PHYSICAL: Gift,
  PRIVILEGE: Crown,
}

const TYPE_LABELS = {
  VIRTUAL: '虚拟奖励',
  PHYSICAL: '实物奖励',
  PRIVILEGE: '特权奖励',
}

export function RedeemDialog({ open, onOpenChange, item, student, onSuccess }: RedeemDialogProps) {
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')

  if (!item || !student) return null

  const canRedeem = student.points >= item.cost && (item.stock === null || item.stock > 0)
  const Icon = TYPE_ICONS[item.type]

  const handleRedeem = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/store/redemptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          studentId: student.id,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '兑换失败')
      }

      toast.success('兑换成功！')
      onOpenChange(false)
      setNotes('')
      onSuccess?.()
    } catch (error) {
      console.error('Failed to redeem:', error)
      toast.error(error instanceof Error ? error.message : '兑换失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>确认兑换</DialogTitle>
          <DialogDescription>请确认以下兑换信息</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 商品信息 */}
          <div className="flex gap-4 rounded-lg border p-4">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt={item.name} className="h-24 w-24 rounded-md object-cover" />
            ) : (
              <div className="bg-muted flex h-24 w-24 items-center justify-center rounded-md">
                <Icon className="text-muted-foreground h-10 w-10" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">{item.name}</h3>
              <Badge variant="secondary">
                <Icon className="mr-1 h-3 w-3" />
                {TYPE_LABELS[item.type]}
              </Badge>
              {item.description && (
                <p className="text-muted-foreground text-sm">{item.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-primary font-semibold">{item.cost} 积分</span>
                {item.stock !== null && (
                  <span className="text-muted-foreground">库存: {item.stock}</span>
                )}
              </div>
            </div>
          </div>

          {/* 学生信息 */}
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">学生信息</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">姓名:</span>
                <span>{student.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">学号:</span>
                <span>{student.studentNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">当前积分:</span>
                <span className="font-semibold">{student.points}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">兑换后剩余:</span>
                <span className={student.points >= item.cost ? 'text-green-600' : 'text-red-600'}>
                  {student.points - item.cost}
                </span>
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">备注（可选）</label>
            <Textarea
              placeholder="填写备注信息，如收货地址、联系方式等"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-muted-foreground text-xs">最多500个字符</p>
          </div>

          {/* 警告信息 */}
          {!canRedeem && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {student.points < item.cost ? '积分不足，无法兑换此商品' : '商品库存不足'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setNotes('')
            }}
            disabled={loading}
          >
            取消
          </Button>
          <Button onClick={handleRedeem} disabled={!canRedeem || loading}>
            {loading ? '兑换中...' : '确认兑换'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
