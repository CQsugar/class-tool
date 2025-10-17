'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
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
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'

interface Tag {
  id: string
  name: string
  color: string
  _count: {
    relations: number
  }
}

interface BatchTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentIds: string[]
  mode: 'add' | 'remove'
  onSuccess?: () => void
}

export function BatchTagDialog({
  open,
  onOpenChange,
  studentIds,
  mode,
  onSuccess,
}: BatchTagDialogProps) {
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      loadTags()
      setSelectedTags([])
    }
  }, [open])

  const loadTags = async () => {
    try {
      const response = await fetch('/api/students/tags')
      if (!response.ok) throw new Error('加载标签失败')

      const data = await response.json()
      setTags(data.data || [])
    } catch (error) {
      console.error('Failed to load tags:', error)
      toast.error('加载标签失败')
    }
  }

  const handleSubmit = async () => {
    if (selectedTags.length === 0) {
      toast.error('请至少选择一个标签')
      return
    }

    try {
      setLoading(true)

      const endpoint =
        mode === 'add' ? '/api/students/tags/batch/add' : '/api/students/tags/batch/remove'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds,
          tagIds: selectedTags,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '操作失败')
      }

      const result = await response.json()

      if (mode === 'add') {
        toast.success(
          `成功添加 ${result.addedCount} 个标签关联${
            result.skippedCount > 0 ? `，跳过 ${result.skippedCount} 个已存在的关联` : ''
          }`
        )
      } else {
        toast.success(`成功移除 ${result.removedCount} 个标签关联`)
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to batch tag:', error)
      toast.error(error instanceof Error ? error.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? '批量添加标签' : '批量移除标签'}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? `为选中的 ${studentIds.length} 名学生添加标签`
              : `从选中的 ${studentIds.length} 名学生移除标签`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {tags.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">暂无标签，请先创建标签</div>
          ) : (
            <div className="space-y-2">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center space-x-3 rounded-lg border p-3">
                  <Checkbox
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={checked => {
                      if (checked) {
                        setSelectedTags([...selectedTags, tag.id])
                      } else {
                        setSelectedTags(selectedTags.filter(id => id !== tag.id))
                      }
                    }}
                  />
                  <div
                    className="h-4 w-4 rounded-full border"
                    style={{ backgroundColor: tag.color }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{tag.name}</div>
                  </div>
                  <Badge variant="secondary">{tag._count.relations} 人</Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading || selectedTags.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'add' ? '添加' : '移除'} ({selectedTags.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
