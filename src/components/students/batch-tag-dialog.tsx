'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Plus, Tag as TagIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { StudentTagFormDialog } from './student-tag-form-dialog'

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
  const [showCreateTag, setShowCreateTag] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    if (open) {
      loadTags()
      setSelectedTags([])
      setSearchText('')
    }
  }, [open])

  const loadTags = async () => {
    try {
      const response = await fetch('/api/students/tags/list')
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

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
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

        <div className="space-y-4">
          {/* 搜索和快速创建 */}
          <div className="flex gap-2">
            <Input
              placeholder="搜索标签..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowCreateTag(true)}
              title="快速创建标签"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-[350px] pr-4">
            {tags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TagIcon className="text-muted-foreground mb-4 h-12 w-12" />
                <h3 className="mb-2 font-semibold">暂无标签</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  请先创建标签才能进行批量标签操作
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => setShowCreateTag(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    快速创建
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/students">前往标签管理</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {tags
                  .filter(tag =>
                    searchText ? tag.name.toLowerCase().includes(searchText.toLowerCase()) : true
                  )
                  .map(tag => (
                    <Card
                      key={tag.id}
                      className={`cursor-pointer transition-all ${
                        selectedTags.includes(tag.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => toggleTag(tag.id)}
                    >
                      <div className="flex items-center space-x-3 p-3">
                        <Checkbox
                          checked={selectedTags.includes(tag.id)}
                          onCheckedChange={() => toggleTag(tag.id)}
                          onClick={e => e.stopPropagation()}
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
                    </Card>
                  ))}
              </div>
            )}
          </ScrollArea>
        </div>

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

      {/* 快速创建标签对话框 */}
      <StudentTagFormDialog
        open={showCreateTag}
        onOpenChange={setShowCreateTag}
        onSuccess={() => {
          setShowCreateTag(false)
          loadTags()
        }}
      />
    </Dialog>
  )
}
