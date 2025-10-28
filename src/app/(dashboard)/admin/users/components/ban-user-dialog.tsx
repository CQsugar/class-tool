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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string
}

interface BanUserDialogProps {
  open: boolean
  user: User
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BanUserDialog({ open, user, onOpenChange, onSuccess }: BanUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    reason: '',
    duration: 'permanent',
    customDays: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let banExpires: string | undefined
      if (formData.duration !== 'permanent') {
        const days =
          formData.duration === 'custom'
            ? parseInt(formData.customDays)
            : parseInt(formData.duration)
        const expiresDate = new Date()
        expiresDate.setDate(expiresDate.getDate() + days)
        banExpires = expiresDate.toISOString()
      }

      const response = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: formData.reason,
          banExpires,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '封禁用户失败')
      }

      toast.success('用户已封禁')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '封禁失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>封禁用户</DialogTitle>
          <DialogDescription>
            封禁 {user.name} ({user.email})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">封禁原因</Label>
            <Textarea
              id="reason"
              required
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              placeholder="请输入封禁原因"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">封禁期限</Label>
            <Select
              value={formData.duration}
              onValueChange={value => setFormData({ ...formData, duration: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1天</SelectItem>
                <SelectItem value="7">7天</SelectItem>
                <SelectItem value="30">30天</SelectItem>
                <SelectItem value="365">1年</SelectItem>
                <SelectItem value="custom">自定义</SelectItem>
                <SelectItem value="permanent">永久</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.duration === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customDays">自定义天数</Label>
              <Input
                id="customDays"
                type="number"
                min="1"
                required
                value={formData.customDays}
                onChange={e => setFormData({ ...formData, customDays: e.target.value })}
                placeholder="输入天数"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading} variant="destructive">
              {loading ? '封禁中...' : '确认封禁'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
