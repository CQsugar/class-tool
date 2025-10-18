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
import { Loader2, Plus, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { StudentGroupFormDialog } from './student-group-form-dialog'

interface Group {
  id: string
  name: string
  color: string
  _count: {
    members: number
  }
}

interface BatchGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentIds: string[]
  mode: 'add' | 'remove'
  onSuccess?: () => void
}

export function BatchGroupDialog({
  open,
  onOpenChange,
  studentIds,
  mode,
  onSuccess,
}: BatchGroupDialogProps) {
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    if (open) {
      loadGroups()
      setSelectedGroups([])
      setSearchText('')
    }
  }, [open])

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/students/groups/list')
      if (!response.ok) throw new Error('加载分组失败')

      const data = await response.json()
      setGroups(data.data || [])
    } catch (error) {
      console.error('Failed to load groups:', error)
      toast.error('加载分组失败')
    }
  }

  const handleSubmit = async () => {
    if (selectedGroups.length === 0) {
      toast.error('请至少选择一个分组')
      return
    }

    try {
      setLoading(true)

      const endpoint =
        mode === 'add' ? '/api/students/groups/batch/add' : '/api/students/groups/batch/remove'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds,
          groupIds: selectedGroups,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '操作失败')
      }

      const result = await response.json()

      if (mode === 'add') {
        toast.success(
          `成功添加 ${result.addedCount} 个分组关联${
            result.skippedCount > 0 ? `，跳过 ${result.skippedCount} 个已存在的关联` : ''
          }`
        )
      } else {
        toast.success(`成功移除 ${result.removedCount} 个分组关联`)
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to batch group:', error)
      toast.error(error instanceof Error ? error.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId))
    } else {
      setSelectedGroups([...selectedGroups, groupId])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? '批量添加分组' : '批量移除分组'}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? `为选中的 ${studentIds.length} 名学生添加分组`
              : `从选中的 ${studentIds.length} 名学生移除分组`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 搜索和快速创建 */}
          <div className="flex gap-2">
            <Input
              placeholder="搜索分组..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowCreateGroup(true)}
              title="快速创建分组"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-[350px] pr-4">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="text-muted-foreground mb-4 h-12 w-12" />
                <h3 className="mb-2 font-semibold">暂无分组</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  请先创建分组才能进行批量分组操作
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => setShowCreateGroup(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    快速创建
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/students/groups">前往分组管理</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {groups
                  .filter(group =>
                    searchText ? group.name.toLowerCase().includes(searchText.toLowerCase()) : true
                  )
                  .map(group => (
                    <Card
                      key={group.id}
                      className={`cursor-pointer transition-all ${
                        selectedGroups.includes(group.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => toggleGroup(group.id)}
                    >
                      <div className="flex items-center space-x-3 p-3">
                        <Checkbox
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={() => toggleGroup(group.id)}
                          onClick={e => e.stopPropagation()}
                        />
                        <div
                          className="h-4 w-4 rounded-full border"
                          style={{ backgroundColor: group.color }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{group.name}</div>
                        </div>
                        <Badge variant="secondary">{group._count.members} 人</Badge>
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
          <Button onClick={handleSubmit} disabled={loading || selectedGroups.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'add' ? '添加' : '移除'} ({selectedGroups.length})
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* 快速创建分组对话框 */}
      <StudentGroupFormDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onSuccess={() => {
          setShowCreateGroup(false)
          loadGroups()
        }}
      />
    </Dialog>
  )
}
